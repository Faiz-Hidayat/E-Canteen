import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatRupiah } from '@/lib/utils/format';
import { Users, Store, ShoppingBag, Wallet, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // ── Fetch statistics ─────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalUsers, totalTenants, todayOrders, todayRevenueResult, weeklyOrders, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.order.count({
      where: {
        created_at: { gte: today },
        status: { notIn: ['CANCELLED'] },
      },
    }),
    prisma.order.aggregate({
      _sum: { total_amount: true },
      where: {
        created_at: { gte: today },
        status: { notIn: ['CANCELLED'] },
      },
    }),
    // Weekly orders for chart (last 7 days)
    prisma.order.findMany({
      where: {
        created_at: { gte: sevenDaysAgo },
        status: { notIn: ['CANCELLED'] },
      },
      select: { created_at: true, total_amount: true },
    }),
    // Recent 5 orders
    prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        total_amount: true,
        status: true,
        created_at: true,
        user: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    }),
  ]);

  const todayRevenue = todayRevenueResult._sum.total_amount ?? 0;

  // ── Aggregate weekly orders by day ───────────────────────

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const weeklyData: { label: string; date: string; orders: number; revenue: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayOrders = weeklyOrders.filter((o) => o.created_at >= d && o.created_at < nextD);

    weeklyData.push({
      label: dayLabels[d.getDay()] ?? '',
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
    });
  }

  const maxOrders = Math.max(...weeklyData.map((d) => d.orders), 1);

  // ── Status label helper ──────────────────────────────────

  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    CONFIRMED: 'Diterima',
    PREPARING: 'Disiapin',
    READY: 'Siap Diambil',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 p-6 text-white shadow-lg shadow-purple-200/40">
        <div className="absolute -right-4 -top-4 text-[90px] opacity-15">⚡</div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm font-medium text-white/70">Selamat datang kembali 👋</p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard Super Admin</h1>
        <p className="mt-1 text-sm text-white/70">Overview seluruh sistem E-Canteen hari ini</p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-5" />}
          gradient="from-blue-500 to-cyan-400"
          shadowColor="shadow-blue-200/50"
          label="Total User"
          value={totalUsers.toLocaleString('id-ID')}
          emoji="👥"
        />
        <StatCard
          icon={<Store className="size-5" />}
          gradient="from-purple-500 to-pink-400"
          shadowColor="shadow-purple-200/50"
          label="Total Stan"
          value={totalTenants.toLocaleString('id-ID')}
          emoji="🏪"
        />
        <StatCard
          icon={<ShoppingBag className="size-5" />}
          gradient="from-orange-500 to-amber-400"
          shadowColor="shadow-orange-200/50"
          label="Pesanan Hari Ini"
          value={todayOrders.toLocaleString('id-ID')}
          emoji="🛒"
        />
        <StatCard
          icon={<Wallet className="size-5" />}
          gradient="from-emerald-500 to-green-400"
          shadowColor="shadow-green-200/50"
          label="Pendapatan Hari Ini"
          value={formatRupiah(todayRevenue)}
          emoji="💰"
        />
      </div>

      {/* ── Weekly Chart ────────────────────────────────── */}
      <div className="rounded-2xl border border-border/30 bg-white/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Pesanan 7 Hari Terakhir</h2>
            <p className="text-[11px] text-muted-foreground">Tren pesanan mingguan</p>
          </div>
        </div>
        <div className="mt-5 flex items-end gap-2" style={{ height: 180 }}>
          {weeklyData.map((day, i) => {
            const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0;
            const isToday = i === weeklyData.length - 1;
            return (
              <div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
                {/* Tooltip on hover */}
                <div className="relative">
                  <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-xl bg-foreground px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    <p className="font-bold">{day.orders} pesanan</p>
                    <p className="text-white/70">{formatRupiah(day.revenue)}</p>
                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground" />
                  </div>
                </div>
                {/* Bar */}
                <div className="flex w-full justify-center" style={{ height: 140 }}>
                  <div
                    className={`w-full max-w-9 rounded-xl transition-all duration-300 group-hover:scale-105 ${
                      isToday
                        ? 'bg-gradient-to-t from-purple-500 to-violet-400 shadow-md shadow-purple-200/50'
                        : 'bg-gradient-to-t from-[#FFB26B]/60 to-[#FFB26B]/30 group-hover:from-[#FFB26B] group-hover:to-[#FFB26B]/70'
                    }`}
                    style={{
                      height: `${Math.max(height, 6)}%`,
                      marginTop: 'auto',
                    }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${isToday ? 'text-purple-600' : 'text-muted-foreground'}`}>
                  {day.label}
                </span>
                <span className="text-[9px] text-muted-foreground/60">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Orders ───────────────────────────────── */}
      <div className="rounded-2xl border border-border/30 bg-white/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
            <ShoppingBag className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Pesanan Terbaru</h2>
            <p className="text-[11px] text-muted-foreground">5 pesanan terakhir dari semua stan</p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {recentOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-12">
              <span className="text-3xl">📋</span>
              <p className="mt-2 text-sm text-muted-foreground">Belum ada pesanan.</p>
            </div>
          )}
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-xl border border-border/30 bg-white/60 px-4 py-3 transition-all hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm">
                  {order.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{order.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.tenant.name} · {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    statusColors[order.status] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {statusLabels[order.status] ?? order.status}
                </span>
                <p className="text-sm font-bold text-foreground">{formatRupiah(order.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────

function StatCard({
  icon,
  gradient,
  shadowColor,
  label,
  value,
  emoji,
}: {
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/30 bg-white/80 p-5 backdrop-blur-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute -right-2 -top-2 text-[40px] opacity-[0.07] transition-transform group-hover:scale-110">
        {emoji}
      </div>
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg ${shadowColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
