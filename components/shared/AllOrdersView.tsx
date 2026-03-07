"use client";

import { useState } from "react";
import { Search, ClipboardList, CreditCard, Wallet, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, getPickupLabel, getStatusLabel } from "@/lib/utils/format";
import type {
  AllOrderItem,
  TenantOption,
} from "@/app/(backoffice)/super-admin/all-orders/page";

// ── Status styling ──────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARING: "bg-orange-50 text-orange-700 border-orange-200",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-gray-50 text-gray-600 border-gray-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-blue-400",
  PREPARING: "bg-orange-400",
  READY: "bg-emerald-400",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-400",
};

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

// ── Main Component ──────────────────────────────────────────

interface AllOrdersViewProps {
  orders: AllOrderItem[];
  tenantOptions: TenantOption[];
}

export function AllOrdersView({ orders, tenantOptions }: AllOrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tenantFilter, setTenantFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Client-side filtering
  const filtered = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (tenantFilter !== "ALL" && o.tenantName !== tenantFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.userName.toLowerCase().includes(q) ||
        o.tenantName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-xl border-border/40 bg-white/80 backdrop-blur-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {STATUS_OPTIONS.filter((s) => s !== "ALL").map((s) => (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[s] ?? "bg-gray-400"}`} />
                  {getStatusLabel(s)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tenant filter */}
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-52 rounded-xl border-border/40 bg-white/80 backdrop-blur-sm">
            <SelectValue placeholder="Stan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Stan</SelectItem>
            {tenantOptions.map((t) => (
              <SelectItem key={t.id} value={t.name}>
                <span className="flex items-center gap-2">
                  <Store className="size-3 text-muted-foreground" />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari user, stan, atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-border/40 bg-white/80 pl-9 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Counter */}
      <p className="text-xs text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> dari {orders.length} pesanan
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-16 backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
            <ClipboardList className="size-7 text-amber-400" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">
            Tidak ada pesanan ditemukan
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Stan</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Pickup</TableHead>
                <TableHead className="font-semibold">Bayar</TableHead>
                <TableHead className="font-semibold">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="transition-colors hover:bg-muted/30">
                  <TableCell
                    className="max-w-[80px] truncate font-mono text-[11px] text-muted-foreground"
                    title={o.id}
                  >
                    <span className="rounded-md bg-muted/50 px-1.5 py-0.5">{o.id.slice(-8)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-foreground">{o.userName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Store className="size-3" />
                      {o.tenantName}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {formatRupiah(o.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        STATUS_COLORS[o.status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[o.status] ?? "bg-gray-400"}`} />
                      {getStatusLabel(o.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {getPickupLabel(o.pickupTime)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      {o.paymentMethod === "BALANCE" ? (
                        <>
                          <Wallet className="size-3 text-emerald-500" />
                          Saldo
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-3 text-blue-500" />
                          Midtrans
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
