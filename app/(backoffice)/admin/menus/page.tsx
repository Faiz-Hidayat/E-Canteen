import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminMenuList } from "@/components/shared/AdminMenuList";
import { cleanupOrphanedUploads } from "@/actions/menu.actions";

export const dynamic = "force-dynamic";

export interface AdminMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

export default async function AdminMenusPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (!session.user.tenantId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-20 text-center backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-green-100 shadow-inner">
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

  const menus = await prisma.menu.findMany({
    where: { tenant_id: session.user.tenantId },
    orderBy: [{ is_available: "desc" }, { created_at: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      photo_url: true,
      category: true,
      is_available: true,
    },
  });

  const menuItems: AdminMenuItem[] = menus.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price,
    photoUrl: m.photo_url,
    category: m.category,
    isAvailable: m.is_available,
  }));

  // Best-effort cleanup: remove uploaded photos not saved to any menu (>30 min old)
  cleanupOrphanedUploads().catch(() => {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-6 text-white shadow-lg shadow-green-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">🍽️</div>
        <h1 className="text-2xl font-bold">Menu Saya</h1>
        <p className="mt-1 text-sm text-white/80">
          Kelola menu makanan dan minuman stan kamu di sini
        </p>
        <div className="mt-3 flex gap-3">
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{menuItems.length}</span>
            <span className="ml-1 text-xs text-white/80">Total Menu</span>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{menuItems.filter(m => m.isAvailable).length}</span>
            <span className="ml-1 text-xs text-white/80">Aktif</span>
          </div>
        </div>
      </div>

      <AdminMenuList menus={menuItems} />
    </div>
  );
}
