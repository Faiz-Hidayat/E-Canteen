"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DollarSign, ShoppingBag, UtensilsCrossed, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/format";
import type { DailyReportData } from "@/app/(backoffice)/admin/reports/page";

interface DailyReportDashboardProps {
  report: DailyReportData;
}

export function DailyReportDashboard({ report }: DailyReportDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = searchParams.get("date") ?? report.date;

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!val) return;
    router.push(`/admin/reports?date=${val}`);
  }

  const isToday = report.date === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Date Picker Row */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
          <Calendar className="size-4" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Tanggal Laporan
          </p>
          <Input
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-0.5 h-8 w-44 rounded-lg border-border/40 bg-white/80 text-sm backdrop-blur-sm"
          />
        </div>
        {isToday && (
          <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
            Hari Ini
          </span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Revenue Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/30 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-4 -top-4 text-[60px] opacity-[0.07] transition-transform group-hover:scale-110">
            💰
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 text-white shadow-sm shadow-emerald-200/50">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pendapatan {isToday ? "Hari Ini" : ""}
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatRupiah(report.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Count Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/30 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute -right-4 -top-4 text-[60px] opacity-[0.07] transition-transform group-hover:scale-110">
            🛒
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-sm shadow-blue-200/50">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Pesanan Selesai
              </p>
              <p className="text-2xl font-bold text-foreground">
                {report.totalOrders}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  pesanan
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sales Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 text-white">
            <UtensilsCrossed className="size-3.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            Menu Terjual
          </h3>
          {report.menuSales.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-200">
              {report.menuSales.length} menu
            </span>
          )}
        </div>

        {report.menuSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-white/60 py-12 backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
              <UtensilsCrossed className="size-6 text-amber-400" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">
              Belum ada penjualan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isToday
                ? "Belum ada pesanan selesai hari ini."
                : "Tidak ada pesanan selesai di tanggal ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Nama Menu</TableHead>
                  <TableHead className="text-center font-semibold">
                    Porsi
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Pendapatan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.menuSales.map((item, idx) => (
                  <TableRow
                    key={item.menuId}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">
                        {item.menuName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatRupiah(item.revenue)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t-2 border-border/40 bg-muted/20 hover:bg-muted/30">
                  <TableCell />
                  <TableCell className="text-sm font-bold text-foreground">
                    Total
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                      {report.menuSales.reduce((s, m) => s + m.quantity, 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold text-emerald-600">
                    {formatRupiah(report.totalRevenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
