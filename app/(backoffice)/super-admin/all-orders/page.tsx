import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AllOrdersView } from "@/components/shared/AllOrdersView";

export const dynamic = "force-dynamic";

export interface AllOrderItem {
  id: string;
  userName: string;
  tenantName: string;
  totalAmount: number;
  status: string;
  pickupTime: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

export interface TenantOption {
  id: string;
  name: string;
}

export default async function SuperAdminAllOrdersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [orders, tenants] = await Promise.all([
    prisma.order.findMany({
      orderBy: { created_at: "desc" },
      take: 200,
      select: {
        id: true,
        total_amount: true,
        status: true,
        pickup_time: true,
        payment_method: true,
        notes: true,
        created_at: true,
        user: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const items: AllOrderItem[] = orders.map((o) => ({
    id: o.id,
    userName: o.user.name,
    tenantName: o.tenant.name,
    totalAmount: o.total_amount,
    status: o.status,
    pickupTime: o.pickup_time,
    paymentMethod: o.payment_method,
    notes: o.notes,
    createdAt: o.created_at.toISOString(),
  }));

  const tenantOptions: TenantOption[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400 p-6 text-white shadow-lg shadow-orange-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">📋</div>
        <h1 className="text-2xl font-bold">Semua Pesanan</h1>
        <p className="mt-1 text-sm text-white/80">
          Seluruh pesanan dari semua stan kantin (read-only)
        </p>
        <div className="mt-3 inline-flex rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-lg font-bold">{items.length}</span>
          <span className="ml-1.5 text-xs text-white/80 self-center">Pesanan</span>
        </div>
      </div>
      <AllOrdersView orders={items} tenantOptions={tenantOptions} />
    </div>
  );
}
