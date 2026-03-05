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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl">🏪</p>
        <h2 className="mt-3 text-lg font-semibold text-foreground">
          Belum Terhubung ke Stan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Antrean Pesanan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola pesanan masuk untuk stan kamu hari ini.
      </p>

      <div className="mt-6">
        <OrderQueueBoard orders={queueOrders} />
      </div>
    </div>
  );
}

