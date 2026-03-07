import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActiveOrders } from '@/components/shared/ActiveOrders';
import { OrderHistory } from '@/components/shared/OrderHistory';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Pesanan Kamu — Kantin 40',
  description: 'Lihat status pesanan dan riwayat transaksimu.',
};

// ── Types shared with client components ────────────────────

export interface OrderItemData {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  id: string;
  tenantName: string;
  totalAmount: number;
  pickupTime: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  paymentExpiresAt: string | null;
  midtransPaymentStatus: string | null;
  cancellationReason: string | null;
  items: OrderItemData[];
}

// ── Active statuses ────────────────────────────────────────

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] as const;

export default async function OrdersPage() {
  const session = await auth();

  // Not logged in → show friendly login prompt
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f512.svg"
          alt=""
          className="h-16 w-16 opacity-60"
        />
        <h2 className="text-lg font-extrabold text-gray-800">Masuk dulu yuk! 👋</h2>
        <p className="max-w-xs text-sm text-muted-foreground">Kamu perlu login untuk melihat pesananmu.</p>
        <Button asChild className="mt-2 rounded-full px-8">
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    );
  }

  // Query all orders for this user
  const orders = await prisma.order.findMany({
    where: { user_id: session.user.id },
    include: {
      tenant: { select: { name: true } },
      orderItems: {
        include: {
          menu: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // Transform for client
  const allOrders: OrderData[] = orders.map((o) => ({
    id: o.id,
    tenantName: o.tenant.name,
    totalAmount: o.total_amount,
    pickupTime: o.pickup_time,
    paymentMethod: o.payment_method,
    status: o.status,
    notes: o.notes,
    createdAt: o.created_at.toISOString(),
    paymentExpiresAt: o.payment_expires_at?.toISOString() ?? null,
    midtransPaymentStatus: o.midtrans_payment_status ?? null,
    cancellationReason: o.cancellation_reason ?? null,
    items: o.orderItems.map((oi) => ({
      id: oi.id,
      menuName: oi.menu.name,
      quantity: oi.quantity,
      price: oi.price,
    })),
  }));

  // Split active vs history
  const active = allOrders.filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status));
  const history = allOrders.filter((o) => !(ACTIVE_STATUSES as readonly string[]).includes(o.status));

  return (
    <div className="space-y-10">
      <ActiveOrders orders={active} />
      <OrderHistory orders={history} />
    </div>
  );
}
