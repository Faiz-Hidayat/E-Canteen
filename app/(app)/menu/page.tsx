import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MenuHero } from '@/components/shared/MenuHero';
import { WalletCard } from '@/components/shared/WalletCard';
import { MenuCatalog } from '@/components/shared/MenuCatalog';
import { AnimatedBlobs } from '@/components/shared/AnimatedBlobs';

export const metadata = {
  title: 'Menu Kantin — Kantin 40',
  description: 'Jelajahi menu kantin sekolah dan pesan makanan favoritmu.',
};

export default async function MenuPage() {
  const session = await auth();

  // Query all available menus with tenant info
  const menus = await prisma.menu.findMany({
    where: { is_available: true },
    include: {
      tenant: { select: { id: true, name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  // Get user balance if logged in
  let balance = 0;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });
    balance = user?.balance ?? 0;
  }

  // Transform for client component
  const menuData = menus.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    photoUrl: m.photo_url,
    category: m.category,
    isAvailable: m.is_available,
    tenantName: m.tenant.name,
    tenantId: m.tenant.id,
  }));

  return (
    <div className="relative">
      <AnimatedBlobs />

      <div className="relative z-10">
        {/* Hero + Wallet: stacked on mobile, side-by-side on desktop */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MenuHero userName={session?.user?.name} />
          </div>
          <div className="lg:col-span-2">
            <WalletCard balance={balance} />
          </div>
        </div>

        <MenuCatalog menus={menuData} />
      </div>
    </div>
  );
}
