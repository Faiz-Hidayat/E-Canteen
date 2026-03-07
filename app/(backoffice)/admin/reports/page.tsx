import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DailyReportDashboard } from "@/components/shared/DailyReportDashboard";
import { StockPrediction } from "@/components/shared/StockPrediction";

export const dynamic = "force-dynamic";

// ── Types exported for child components ─────────────────────

export interface MenuSalesItem {
  menuId: string;
  menuName: string;
  quantity: number;
  revenue: number;
}

export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  menuSales: MenuSalesItem[];
}

export interface StockPredictionItem {
  menuId: string;
  menuName: string;
  avgDaily: number;
  trend: "up" | "down" | "stable";
  last7Days: number[];
  alert: "hot" | "restock" | null;
}

// ── Helper: query a single day's report ─────────────────────

async function getDailyReport(
  tenantId: string,
  date: Date
): Promise<DailyReportData> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dateStr = date.toISOString().slice(0, 10);

  // Total revenue + order count (COMPLETED orders only)
  const orderAgg = await prisma.order.aggregate({
    where: {
      tenant_id: tenantId,
      status: "COMPLETED",
      created_at: { gte: startOfDay, lte: endOfDay },
    },
    _sum: { total_amount: true },
    _count: true,
  });

  // Per-menu breakdown
  const menuSalesRaw = await prisma.orderItem.groupBy({
    by: ["menu_id"],
    where: {
      order: {
        tenant_id: tenantId,
        status: "COMPLETED",
        created_at: { gte: startOfDay, lte: endOfDay },
      },
    },
    _sum: { quantity: true, price: true },
  });

  // Fetch menu names in one query
  const menuIds = menuSalesRaw.map((m) => m.menu_id);
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds } },
    select: { id: true, name: true },
  });
  const menuMap = new Map(menus.map((m) => [m.id, m.name]));

  const menuSales: MenuSalesItem[] = menuSalesRaw
    .map((m) => ({
      menuId: m.menu_id,
      menuName: menuMap.get(m.menu_id) ?? "Menu Dihapus",
      quantity: m._sum.quantity ?? 0,
      revenue: m._sum.price ?? 0,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  return {
    date: dateStr,
    totalRevenue: orderAgg._sum.total_amount ?? 0,
    totalOrders: orderAgg._count,
    menuSales,
  };
}

// ── Helper: 7-day stock prediction ──────────────────────────

async function getStockPrediction(
  tenantId: string
): Promise<StockPredictionItem[]> {
  const now = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  // Get all completed order items in last 7 days
  const start = days[0]!;
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        tenant_id: tenantId,
        status: "COMPLETED",
        created_at: { gte: start, lte: endOfToday },
      },
    },
    select: {
      menu_id: true,
      quantity: true,
      order: { select: { created_at: true } },
    },
  });

  // Get menu names
  const allMenuIds = [...new Set(items.map((i) => i.menu_id))];
  const menus = await prisma.menu.findMany({
    where: { id: { in: allMenuIds } },
    select: { id: true, name: true },
  });
  const menuMap = new Map(menus.map((m) => [m.id, m.name]));

  // Build per-menu, per-day sales matrix
  const salesMap = new Map<string, number[]>();
  for (const menuId of allMenuIds) {
    salesMap.set(menuId, new Array(7).fill(0) as number[]);
  }

  for (const item of items) {
    const dayIdx = days.findIndex((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return item.order.created_at >= d && item.order.created_at < next;
    });
    if (dayIdx >= 0) {
      const arr = salesMap.get(item.menu_id)!;
      arr[dayIdx] = (arr[dayIdx] ?? 0) + item.quantity;
    }
  }

  // Calculate predictions
  const HOT_THRESHOLD = 5; // avg > 5 portions/day = hot
  const predictions: StockPredictionItem[] = [];

  for (const [menuId, last7Days] of salesMap) {
    const total = last7Days.reduce((a, b) => a + b, 0);
    const avgDaily = total / 7;

    // Trend: compare first half (days 0-2) vs second half (days 4-6)
    const firstHalf = last7Days.slice(0, 3).reduce((a, b) => a + b, 0);
    const secondHalf = last7Days.slice(4, 7).reduce((a, b) => a + b, 0);
    const diff = secondHalf - firstHalf;
    const trend: "up" | "down" | "stable" =
      diff > 2 ? "up" : diff < -2 ? "down" : "stable";

    // Alert logic
    let alert: "hot" | "restock" | null = null;
    if (avgDaily >= HOT_THRESHOLD) {
      alert = "hot";
    }
    if (trend === "up" && avgDaily >= 3) {
      alert = "restock"; // trending up + decent volume → restock soon
    }

    predictions.push({
      menuId,
      menuName: menuMap.get(menuId) ?? "Menu Dihapus",
      avgDaily: Math.round(avgDaily * 10) / 10,
      trend,
      last7Days,
      alert,
    });
  }

  return predictions.sort((a, b) => b.avgDaily - a.avgDaily);
}

// ── Page Component ──────────────────────────────────────────

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (!session.user.tenantId) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white shadow-lg shadow-blue-200/40">
          <div className="absolute -right-6 -top-6 text-[80px] opacity-20">
            📊
          </div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="mt-1 text-sm text-white/80">
            Lihat rekapitulasi pendapatan dan produk terjual
          </p>
        </div>
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
      </div>
    );
  }

  const tenantId = session.user.tenantId;
  const params = await searchParams;

  // Parse selected date (default: today)
  const selectedDate = params.date ? new Date(params.date + "T00:00:00") : new Date();
  if (isNaN(selectedDate.getTime())) {
    redirect("/admin/reports");
  }

  // Fetch data in parallel
  const [report, predictions] = await Promise.all([
    getDailyReport(tenantId, selectedDate),
    getStockPrediction(tenantId),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white shadow-lg shadow-blue-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">
          📊
        </div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="mt-1 text-sm text-white/80">
          Lihat rekapitulasi pendapatan dan produk terjual
        </p>
      </div>

      {/* Daily Report */}
      <DailyReportDashboard report={report} />

      {/* Stock Prediction */}
      {predictions.length > 0 && (
        <StockPrediction predictions={predictions} />
      )}
    </div>
  );
}
