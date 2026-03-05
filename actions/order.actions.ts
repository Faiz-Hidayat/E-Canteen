"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  CancelOrderSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type CancelOrderInput,
} from "@/lib/validations/order.schema";

// ── Types ──────────────────────────────────────────────────

type CreateOrderResult =
  | { success: true; data: { orderId: string } }
  | { success: false; error: string };

type ActionResult =
  | { success: true; data: null }
  | { success: false; error: string };

// ── Helpers ────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ── createOrder ────────────────────────────────────────────

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  // 2. Zod validation
  const parsed = CreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data pesanan tidak valid.";
    return { success: false, error: firstError };
  }

  const { tenantId, items, pickupTime, paymentMethod, notes } = parsed.data;
  const userId = session.user.id;

  try {
    // 3. Prisma Transaction — hitung total dari harga AKTUAL di DB, bukan client
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Fetch actual menu prices from DB
      const menuIds = items.map((i) => i.menuId);
      const menus = await tx.menu.findMany({
        where: {
          id: { in: menuIds },
          tenant_id: tenantId,
          is_available: true,
        },
        select: { id: true, price: true, name: true },
      });

      // Validate all items exist and are available
      if (menus.length !== items.length) {
        throw new Error(
          "Beberapa menu tidak tersedia atau sudah habis. Coba refresh halaman ya."
        );
      }

      // Build menu price map
      const menuPriceMap = new Map(menus.map((m) => [m.id, m.price]));

      // 3b. Calculate server-side total
      let totalAmount = 0;
      const orderItemsData = items.map((item) => {
        const actualPrice = menuPriceMap.get(item.menuId);
        if (actualPrice === undefined) {
          throw new Error("Menu tidak ditemukan.");
        }
        totalAmount += actualPrice * item.quantity;
        return {
          menu_id: item.menuId,
          quantity: item.quantity,
          price: actualPrice,
        };
      });

      // 3c. If BALANCE payment: check & deduct balance
      if (paymentMethod === "BALANCE") {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });

        if (!user || user.balance < totalAmount) {
          throw new Error(
            `Oops, saldo kamu nggak cukup nih! Kurang ${
              user
                ? `Rp ${(totalAmount - user.balance).toLocaleString("id-ID")}`
                : ""
            }. Yuk top-up!`
          );
        }

        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: totalAmount } },
        });
      }

      // 3d. Create Order + OrderItems
      const MIDTRANS_PAYMENT_WINDOW_MINUTES = 15;
      const order = await tx.order.create({
        data: {
          user_id: userId,
          tenant_id: tenantId,
          total_amount: totalAmount,
          pickup_time: pickupTime,
          payment_method: paymentMethod,
          status: paymentMethod === "BALANCE" ? "CONFIRMED" : "PENDING",
          notes: notes || null,
          payment_expires_at:
            paymentMethod === "MIDTRANS"
              ? new Date(Date.now() + MIDTRANS_PAYMENT_WINDOW_MINUTES * 60 * 1000)
              : null,
          orderItems: {
            create: orderItemsData,
          },
        },
        select: { id: true },
      });

      return { orderId: order.id };
    });

    // 4. Revalidate
    revalidatePath("/orders");
    revalidatePath("/admin/queue");

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat pesanan. Coba lagi ya.";

    console.error("[createOrder]", {
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      error: message,
    });

    return { success: false, error: message };
  }
}

// ── updateOrderStatus (Admin/Seller) ───────────────────────

const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
} as const;

export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<ActionResult> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  // 2. RBAC check
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return { success: false, error: "Kamu tidak punya akses untuk ini." };
  }

  // 3. Tenant isolation
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return { success: false, error: "Akun admin kamu belum terhubung ke stan." };
  }

  // 4. Zod validation
  const parsed = UpdateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { orderId, status: newStatus, cancellationReason } = parsed.data;

  try {
    // 5. Fetch order + verify tenant ownership
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      select: { id: true, status: true, payment_method: true, user_id: true, total_amount: true },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    // 6. Validate status transition
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Tidak bisa mengubah status dari "${order.status}" ke "${newStatus}".`,
      };
    }

    // 7. Handle cancel with refund (both BALANCE and MIDTRANS go to balance)
    // CONFIRMED or PREPARING = already paid, needs refund
    if (newStatus === "CANCELLED" && (order.status === "CONFIRMED" || order.status === "PREPARING")) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            cancellation_reason: cancellationReason || null,
          },
        });
        // Refund to user balance (both BALANCE and MIDTRANS paid orders)
        await tx.user.update({
          where: { id: order.user_id },
          data: { balance: { increment: order.total_amount } },
        });
        // Create notification for the user
        await tx.notification.create({
          data: {
            user_id: order.user_id,
            type: "ORDER_CANCELLED_BY_ADMIN",
            title: "Pesanan Dibatalkan oleh Penjual",
            message: cancellationReason
              ? `Pesanan kamu dibatalkan. Alasan: "${cancellationReason}". Saldo ${formatAmount(order.total_amount)} sudah dikembalikan ke Saldo Jajanmu.`
              : `Pesanan kamu dibatalkan oleh penjual. Saldo ${formatAmount(order.total_amount)} sudah dikembalikan ke Saldo Jajanmu.`,
            order_id: orderId,
          },
        });
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      // Notify user when order is READY
      if (newStatus === "READY") {
        await prisma.notification.create({
          data: {
            user_id: order.user_id,
            type: "ORDER_READY",
            title: "Pesanan Siap Diambil!",
            message: "Pesananmu sudah siap! Yuk ambil di stan kantin. 🎉",
            order_id: orderId,
          },
        });
      }
    }

    // 8. Revalidate
    revalidatePath("/admin/queue");
    revalidatePath("/orders");

    return { success: true, data: null };
  } catch (error) {
    console.error("[updateOrderStatus]", {
      tenantId,
      orderId: parsed.data.orderId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal mengubah status pesanan. Coba lagi ya.",
    };
  }
}

// ── cancelOrder (User) ─────────────────────────────────────
// Aturan:
// - PENDING + MIDTRANS (belum bayar) → batal, tanpa refund
// - CONFIRMED + any (sudah bayar, belum dimasak) → batal + refund ke Saldo
// - PREPARING / READY / COMPLETED / CANCELLED → tidak bisa dibatalkan oleh user

export async function cancelOrder(
  input: CancelOrderInput
): Promise<ActionResult> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }

  // 2. Zod validation
  const parsed = CancelOrderSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { orderId } = parsed.data;
  const userId = session.user.id;

  try {
    // 3. Fetch order — verify ownership
    const order = await prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      select: {
        id: true,
        status: true,
        payment_method: true,
        total_amount: true,
        user_id: true,
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan." };
    }

    // 4. Check if cancellable (user can only cancel PENDING or CONFIRMED)
    const cancellableStatuses = ["PENDING", "CONFIRMED"] as const;
    if (!(cancellableStatuses as readonly string[]).includes(order.status)) {
      if (order.status === "PREPARING") {
        return {
          success: false,
          error: "Pesanan sudah mulai diproses, nggak bisa dibatalkan lagi ya. Hubungi penjual langsung.",
        };
      }
      if (order.status === "READY") {
        return {
          success: false,
          error: "Pesanan sudah siap diambil, nggak bisa dibatalkan lagi ya.",
        };
      }
      return {
        success: false,
        error: "Pesanan ini sudah tidak bisa dibatalkan.",
      };
    }

    // 5. Determine if refund is needed
    // BALANCE orders: always paid upfront (status starts at CONFIRMED)
    // MIDTRANS orders: paid if status moved past PENDING (webhook set to CONFIRMED)
    const needsRefund =
      order.payment_method === "BALANCE" ||
      (order.payment_method === "MIDTRANS" && order.status === "CONFIRMED");

    if (needsRefund) {
      // Refund to balance via $transaction (MIDTRANS refund → Saldo Jajanmu)
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
        await tx.user.update({
          where: { id: order.user_id },
          data: { balance: { increment: order.total_amount } },
        });
      });
    } else {
      // PENDING + MIDTRANS: belum bayar, cancel aja tanpa refund
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }

    // 6. Revalidate
    revalidatePath("/orders");
    revalidatePath("/admin/queue");

    return { success: true, data: null };
  } catch (error) {
    console.error("[cancelOrder]", {
      userId,
      orderId: parsed.data.orderId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal membatalkan pesanan. Coba lagi ya.",
    };
  }
}
