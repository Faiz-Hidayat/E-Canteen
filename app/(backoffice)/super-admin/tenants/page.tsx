import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TenantManagement } from "@/components/shared/TenantManagement";

export const dynamic = "force-dynamic";

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  adminName: string;
  adminEmail: string;
  menuCount: number;
  orderCount: number;
  createdAt: string;
}

export default async function SuperAdminTenantsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      created_at: true,
      admin: { select: { name: true, email: true } },
      _count: { select: { menus: true, orders: true } },
    },
  });

  const items: TenantListItem[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    adminName: t.admin.name,
    adminEmail: t.admin.email,
    menuCount: t._count.menus,
    orderCount: t._count.orders,
    createdAt: t.created_at.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-400 p-6 text-white shadow-lg shadow-green-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">🏪</div>
        <h1 className="text-2xl font-bold">Stan / Tenant</h1>
        <p className="mt-1 text-sm text-white/80">
          Kelola semua stan kantin dan akun admin penjual
        </p>
        <div className="mt-3 inline-flex rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-lg font-bold">{items.length}</span>
          <span className="ml-1.5 text-xs text-white/80 self-center">Stan Terdaftar</span>
        </div>
      </div>
      <TenantManagement tenants={items} />
    </div>
  );
}
