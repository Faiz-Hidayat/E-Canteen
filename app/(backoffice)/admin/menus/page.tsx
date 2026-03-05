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
    <div>
      <h1 className="text-2xl font-bold text-foreground">Menu Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola menu makanan dan minuman stan kamu di sini.
      </p>

      <div className="mt-6">
        <AdminMenuList menus={menuItems} />
      </div>
    </div>
  );
}
