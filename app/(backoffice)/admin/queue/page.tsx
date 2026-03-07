import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderQueueBoard } from "@/components/shared/OrderQueueBoard";

export const dynamic = "force-dynamic";

export interface QueueOrderItem {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
}

export interface QueueOrder {
  id: string;
  userName: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  pickupTime: "BREAK_1" | "BREAK_2";
  paymentMethod: "BALANCE" | "MIDTRANS";
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  items: QueueOrderItem[];
}

export default async function AdminQueuePage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (!session.user.tenantId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-20 text-center backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
          <span className="text-4xl">🏪</span>
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">
          Belum Terhubung ke Stan
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Akun admin kamu belum terhubung ke stan. Hubungi Super Admin ya.
        </p>
      </div>
    );
  }

  // Fetch paid active orders (CONFIRMED, PREPARING, READY) for today
  // PENDING = unpaid Midtrans, jangan tampilkan ke penjual biar nggak bingung
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      tenant_id: session.user.tenantId,
      status: { in: ["CONFIRMED", "PREPARING", "READY"] },
      created_at: { gte: todayStart },
    },
    include: {
      user: { select: { name: true } },
      orderItems: {
        include: {
          menu: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const queueOrders: QueueOrder[] = orders.map((o) => ({
    id: o.id,
    userName: o.user.name,
    status: o.status,
    pickupTime: o.pickup_time,
    paymentMethod: o.payment_method,
    totalAmount: o.total_amount,
    notes: o.notes,
    createdAt: o.created_at.toISOString(),
    items: o.orderItems.map((oi) => ({
      id: oi.id,
      menuName: oi.menu.name,
      quantity: oi.quantity,
      price: oi.price,
    })),
  }));

  const confirmedCount = queueOrders.filter((o) => o.status === "CONFIRMED").length;
  const preparingCount = queueOrders.filter((o) => o.status === "PREPARING").length;
  const readyCount = queueOrders.filter((o) => o.status === "READY").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400 p-6 text-white shadow-lg shadow-orange-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">📋</div>
        <h1 className="text-2xl font-bold">Antrean Pesanan</h1>
        <p className="mt-1 text-sm text-white/80">
          Kelola pesanan masuk untuk stan kamu hari ini
        </p>
        {/* Mini stats */}
        <div className="mt-4 flex gap-3">
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{confirmedCount}</span>
            <span className="ml-1 text-xs text-white/80">Masuk</span>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{preparingCount}</span>
            <span className="ml-1 text-xs text-white/80">Diproses</span>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{readyCount}</span>
            <span className="ml-1 text-xs text-white/80">Siap</span>
          </div>
        </div>
      </div>

      <OrderQueueBoard orders={queueOrders} />
    </div>
  );
}

