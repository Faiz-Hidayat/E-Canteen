import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createRateLimiter } from "@/lib/utils/rate-limit";

// ── Rate Limiter ───────────────────────────────────────────

const webhookLimiter = createRateLimiter("midtrans-webhook", {
  maxRequests: 30,
  windowMs: 60_000, // 30 per minute per IP
});

// ── Types ──────────────────────────────────────────────────

interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  fraud_status?: string;
  payment_type?: string;
}

// ── Helpers ────────────────────────────────────────────────

function verifySignature(notification: MidtransNotification): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const payload =
    notification.order_id +
    notification.status_code +
    notification.gross_amount +
    serverKey;

  const expectedSignature = crypto
    .createHash("sha512")
    .update(payload)
    .digest("hex");

  return expectedSignature === notification.signature_key;
}

/**
 * Extract our internal order ID from the Midtrans order_id.
 * Formats:
 *  - "ORDER-<cuid>-<timestamp>"  → order payment
 *  - "TOPUP-<userId>-<timestamp>" → balance top-up
 */
function parseOrderId(midtransOrderId: string): {
  type: "ORDER" | "TOPUP";
  id: string;
} | null {
  if (midtransOrderId.startsWith("ORDER-")) {
    // ORDER-<cuid>-<timestamp>  →  extract cuid (everything between first and last dash-group)
    const withoutPrefix = midtransOrderId.slice("ORDER-".length);
    const lastDash = withoutPrefix.lastIndexOf("-");
    if (lastDash === -1) return null;
    const id = withoutPrefix.slice(0, lastDash);
    return { type: "ORDER", id };
  }

  if (midtransOrderId.startsWith("TOPUP-")) {
    const withoutPrefix = midtransOrderId.slice("TOPUP-".length);
    const lastDash = withoutPrefix.lastIndexOf("-");
    if (lastDash === -1) return null;
    const id = withoutPrefix.slice(0, lastDash);
    return { type: "TOPUP", id };
  }

  return null;
}

function isPaymentSuccess(notification: MidtransNotification): boolean {
  const { transaction_status, fraud_status } = notification;

  // capture = card payment captured (check fraud_status)
  if (transaction_status === "capture") {
    return fraud_status === "accept";
  }

  // settlement = payment settled/completed (bank transfer, e-wallet, etc.)
  return transaction_status === "settlement";
}

function isPaymentFailed(notification: MidtransNotification): boolean {
  // deny = payment denied by bank/provider
  // cancel = cancelled by merchant or user
  // expire = payment window expired (timeout)
  const failed = ["deny", "cancel", "expire"];
  return failed.includes(notification.transaction_status);
}

/**
 * Map Midtrans transaction_status to a human-readable label (BI).
 * Used for midtrans_payment_status column.
 */
function getMidtransStatusLabel(transactionStatus: string): string {
  const STATUS_MAP: Record<string, string> = {
    pending: "pending",
    capture: "capture",
    settlement: "settlement",
    deny: "deny",
    cancel: "cancel",
    expire: "expire",
    refund: "refund",
    partial_refund: "partial_refund",
    authorize: "authorize",
  };
  return STATUS_MAP[transactionStatus] ?? transactionStatus;
}

// ── POST handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateCheck = webhookLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const notification = (await request.json()) as MidtransNotification;

    // 1. Log metadata (never secrets)
    console.log("[Midtrans Webhook]", {
      orderId: notification.order_id,
      status: notification.transaction_status,
      statusCode: notification.status_code,
      paymentType: notification.payment_type,
      timestamp: new Date().toISOString(),
    });

    // 2. Verify signature
    if (!verifySignature(notification)) {
      console.error("[Midtrans Webhook] Signature mismatch", {
        orderId: notification.order_id,
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // 3. Parse order ID
    const parsed = parseOrderId(notification.order_id);
    if (!parsed) {
      console.error("[Midtrans Webhook] Unknown order_id format", {
        orderId: notification.order_id,
      });
      // Return 200 to avoid Midtrans retrying for unknown formats
      return NextResponse.json({ status: "ignored" });
    }

    // 4. Handle based on type
    if (parsed.type === "ORDER") {
      await handleOrderPayment(parsed.id, notification);
    } else if (parsed.type === "TOPUP") {
      await handleTopUpPayment(parsed.id, notification);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Midtrans Webhook] Unhandled error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Order payment handler ──────────────────────────────────

async function handleOrderPayment(
  orderId: string,
  notification: MidtransNotification
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, payment_method: true, user_id: true, total_amount: true },
  });

  if (!order) {
    console.error("[Midtrans Webhook] Order not found:", { orderId });
    return;
  }

  // Only process PENDING orders with MIDTRANS payment
  if (order.payment_method !== "MIDTRANS") {
    console.log("[Midtrans Webhook] Not a Midtrans order, skipping", {
      orderId,
    });
    return;
  }

  if (order.status !== "PENDING") {
    // If order is CANCELLED but Midtrans says payment succeeded,
    // the user already paid — credit refund to their balance
    if (
      order.status === "CANCELLED" &&
      isPaymentSuccess(notification)
    ) {
      await prisma.$transaction(async (tx) => {
        // Idempotency: skip if already refunded (check midtrans_payment_status)
        const current = await tx.order.findUnique({
          where: { id: orderId },
          select: { midtrans_payment_status: true },
        });
        if (
          current?.midtrans_payment_status === "settlement" ||
          current?.midtrans_payment_status === "capture"
        ) {
          // Already refunded on a previous webhook
          return;
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            midtrans_transaction_id: notification.order_id,
            midtrans_payment_status: getMidtransStatusLabel(
              notification.transaction_status
            ),
          },
        });
        // Refund to user balance since they paid but order was already cancelled
        await tx.user.update({
          where: { id: order.user_id },
          data: { balance: { increment: order.total_amount } },
        });
      });

      console.log("[Midtrans Webhook] Order was CANCELLED but payment succeeded — refunded to balance", {
        orderId,
        userId: order.user_id,
        amount: order.total_amount,
      });
      revalidatePath("/orders");
      revalidatePath("/profile");
      revalidatePath("/menu");
      return;
    }

    // Still update midtrans_payment_status for tracking even if already processed
    await prisma.order.update({
      where: { id: orderId },
      data: {
        midtrans_payment_status: getMidtransStatusLabel(
          notification.transaction_status
        ),
      },
    });
    console.log("[Midtrans Webhook] Order already processed, updated midtrans status", {
      orderId,
      currentStatus: order.status,
      midtransStatus: notification.transaction_status,
    });
    return;
  }

  if (isPaymentSuccess(notification)) {
    // Payment success → update to CONFIRMED (seller will then advance to PREPARING)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        midtrans_transaction_id: notification.order_id,
        midtrans_payment_status: getMidtransStatusLabel(
          notification.transaction_status
        ),
      },
    });

    console.log("[Midtrans Webhook] Order payment SUCCESS", { orderId });
    revalidatePath("/orders");
    revalidatePath("/admin/queue");
  } else if (isPaymentFailed(notification)) {
    // Payment failed/expired/denied → CANCELLED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        midtrans_transaction_id: notification.order_id,
        midtrans_payment_status: getMidtransStatusLabel(
          notification.transaction_status
        ),
      },
    });

    console.log("[Midtrans Webhook] Order payment FAILED/CANCELLED", {
      orderId,
      reason: notification.transaction_status,
    });
    revalidatePath("/orders");
    revalidatePath("/admin/queue");
  } else if (notification.transaction_status === "pending") {
    // Pending → update midtrans status only (order stays PENDING)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        midtrans_transaction_id: notification.order_id,
        midtrans_payment_status: "pending",
      },
    });

    console.log("[Midtrans Webhook] Order payment PENDING", { orderId });
    revalidatePath("/orders");
  }
}

// ── Top-up payment handler ─────────────────────────────────

async function handleTopUpPayment(
  userId: string,
  notification: MidtransNotification
) {
  if (isPaymentSuccess(notification)) {
    const amount = parseFloat(notification.gross_amount);

    if (isNaN(amount) || amount <= 0) {
      console.error("[Midtrans Webhook] Invalid top-up amount", {
        userId,
        grossAmount: notification.gross_amount,
      });
      return;
    }

    // Use $transaction for financial atomicity + idempotency
    await prisma.$transaction(async (tx) => {
      // Idempotency: check if this exact Midtrans order_id was already processed
      const existing = await tx.processedWebhook.findUnique({
        where: { midtrans_order_id: notification.order_id },
      });

      if (existing) {
        console.log("[Midtrans Webhook] Top-up already processed (idempotent skip)", {
          userId,
          midtransOrderId: notification.order_id,
        });
        return;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Credit balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });

      // Mark as processed (prevents duplicate credits)
      await tx.processedWebhook.create({
        data: {
          midtrans_order_id: notification.order_id,
          type: "TOPUP",
          amount,
        },
      });

      // Notify user about successful top-up
      const formattedAmount = `Rp ${amount.toLocaleString("id-ID")}`;
      await tx.notification.create({
        data: {
          user_id: userId,
          type: "TOPUP_SUCCESS",
          title: "Top-Up Berhasil! 🎉",
          message: `Saldo kamu berhasil ditambah ${formattedAmount}. Yuk, belanja sekarang!`,
        },
      });
    });

    console.log("[Midtrans Webhook] Top-up SUCCESS", {
      userId,
      amount,
    });
    revalidatePath("/profile");
    revalidatePath("/menu");
  } else if (isPaymentFailed(notification)) {
    console.log("[Midtrans Webhook] Top-up FAILED", {
      userId,
      reason: notification.transaction_status,
    });
  }
}
