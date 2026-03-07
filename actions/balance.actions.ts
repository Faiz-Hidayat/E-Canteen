"use server";

import { auth } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { TopUpSchema, GetBalanceHistorySchema } from "@/lib/validations/balance.schema";

// ── Types ──────────────────────────────────────────────────

type CreateMidtransTokenResult =
  | { success: true; data: { token: string; redirectUrl: string } }
  | { success: false; error: string };

export interface BalanceHistoryItem {
  id: string;
  type: "PURCHASE" | "TOPUP" | "REFUND";
  description: string;
  amount: number;
  createdAt: string;
}

type BalanceHistoryResult =
  | { success: true; data: BalanceHistoryItem[] }
  | { success: false; error: string };

// ── createMidtransTopUpToken ───────────────────────────────

export async function createMidtransTopUpToken(
  amount: number
): Promise<CreateMidtransTokenResult> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  // 2. Zod validation
  const parsed = TopUpSchema.safeParse({ amount });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Nominal tidak valid." };
  }

  const userId = session.user.id;

  try {
    // 3. Fetch user for details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan." };
    }

    // 4. Create Snap transaction
    const orderId = `TOPUP-${userId}-${Date.now()}`;

    const transaction = await createSnapTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: parsed.data.amount,
      },
      finishPath: "/profile",
      unfinishPath: "/profile",
      errorPath: "/profile",
    });

    return {
      success: true,
      data: {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
      },
    };
  } catch (error) {
    console.error("[createMidtransTopUpToken]", {
      userId,
      amount: parsed.data.amount,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error: "Gagal membuat token pembayaran. Coba lagi ya.",
    };
  }
}

// ── getBalanceHistory ──────────────────────────────────────

export async function getBalanceHistory(
  limit = 20
): Promise<BalanceHistoryResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  // Zod validation
  const parsed = GetBalanceHistorySchema.safeParse({ limit });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const userId = session.user.id;

  try {
    // Fetch completed orders paid via BALANCE (purchases / deductions)
    const orders = await prisma.order.findMany({
      where: {
        user_id: userId,
        payment_method: "BALANCE",
        status: { notIn: ["PENDING", "CANCELLED"] },
      },
      select: {
        id: true,
        total_amount: true,
        created_at: true,
        status: true,
        tenant: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: parsed.data.limit,
    });

    // Fetch top-ups (processed webhooks for this user)
    const topups = await prisma.processedWebhook.findMany({
      where: {
        type: "TOPUP",
        midtrans_order_id: { startsWith: `TOPUP-${userId}-` },
      },
      orderBy: { processed_at: "desc" },
      take: parsed.data.limit,
    });

    // Fetch refunded cancelled orders (admin cancelled, balance refunded)
    const refunds = await prisma.order.findMany({
      where: {
        user_id: userId,
        status: "CANCELLED",
        payment_method: "BALANCE",
        cancellation_reason: { not: null },
      },
      select: {
        id: true,
        total_amount: true,
        created_at: true,
        tenant: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: parsed.data.limit,
    });

    const history: BalanceHistoryItem[] = [];

    // Map orders to purchase items
    for (const order of orders) {
      history.push({
        id: order.id,
        type: "PURCHASE",
        description: `Pembelian di ${order.tenant.name}`,
        amount: -order.total_amount,
        createdAt: order.created_at.toISOString(),
      });
    }

    // Map top-ups
    for (const topup of topups) {
      history.push({
        id: topup.midtrans_order_id,
        type: "TOPUP",
        description: "Top-Up Saldo",
        amount: topup.amount ?? 0,
        createdAt: topup.processed_at.toISOString(),
      });
    }

    // Map refunds
    for (const refund of refunds) {
      history.push({
        id: `refund-${refund.id}`,
        type: "REFUND",
        description: `Refund dari ${refund.tenant.name}`,
        amount: refund.total_amount,
        createdAt: refund.created_at.toISOString(),
      });
    }

    // Sort by date descending
    history.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, data: history.slice(0, parsed.data.limit) };
  } catch (error) {
    console.error("[getBalanceHistory]", {
      userId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error: "Gagal memuat riwayat saldo. Coba lagi ya.",
    };
  }
}

// ── createMidtransOrderToken ───────────────────────────────
// Creates a Midtrans Snap token for an existing order (MIDTRANS payment)

type CreateMidtransOrderTokenResult =
  | { success: true; data: { token: string; redirectUrl: string } }
  | { success: false; error: string };

export async function createMidtransOrderToken(
  orderId: string
): Promise<CreateMidtransOrderTokenResult> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  const userId = session.user.id;

  try {
    // 2. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        user_id: true,
        total_amount: true,
        payment_method: true,
        status: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    // 3. Verify ownership
    if (order.user_id !== userId) {
      return { success: false, error: "Kamu tidak punya akses ke pesanan ini." };
    }

    // 4. Verify it's a MIDTRANS payment and still PENDING
    if (order.payment_method !== "MIDTRANS") {
      return { success: false, error: "Pesanan ini bukan pembayaran Midtrans." };
    }

    if (order.status !== "PENDING") {
      return { success: false, error: "Pesanan sudah diproses." };
    }

    // 5. Create Snap transaction with expiry
    const MIDTRANS_PAYMENT_WINDOW_MINUTES = 15;
    const now = new Date();
    // Midtrans expects "yyyy-MM-dd HH:mm:ss +0700" format
    const pad = (n: number) => String(n).padStart(2, "0");
    const startTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} +0700`;

    const transaction = await createSnapTransaction({
      transaction_details: {
        order_id: `ORDER-${order.id}-${Date.now()}`,
        gross_amount: order.total_amount,
      },
      expiry: {
        start_time: startTime,
        unit: "minutes",
        duration: MIDTRANS_PAYMENT_WINDOW_MINUTES,
      },
      finishPath: "/orders",
      unfinishPath: "/cart",
      errorPath: "/cart",
    });

    return {
      success: true,
      data: {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
      },
    };
  } catch (error) {
    console.error("[createMidtransOrderToken]", {
      userId,
      orderId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error: "Gagal membuat token pembayaran. Coba lagi ya.",
    };
  }
}
