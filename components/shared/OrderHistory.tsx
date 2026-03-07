"use client";

import { motion } from "framer-motion";
import { Store } from "lucide-react";
import type { OrderData } from "@/app/(app)/orders/page";
import { formatRupiah, getStatusLabel } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  if (status === "COMPLETED") return "bg-accent/15 text-accent border-accent/20";
  if (status === "CANCELLED") return "bg-destructive/10 text-destructive border-destructive/20";
  return "";
}

// ── OrderHistory ───────────────────────────────────────────

interface OrderHistoryProps {
  orders: OrderData[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-extrabold text-gray-800">
        Riwayat Pesanan 📋
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f37d.svg"
            alt=""
            className="h-14 w-14 opacity-50"
          />
          <p className="text-sm font-bold text-muted-foreground">
            Kamu belum pernah pesan. Yuk cobain!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              {/* Top row: tenant + date */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-gray-800">
                    {order.tenantName}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              {/* Item summary */}
              <p className="mb-3 text-sm text-gray-500">
                {order.items
                  .map((it) => `${it.menuName} ×${it.quantity}`)
                  .join(", ")}
              </p>

              {/* Bottom row: status badge + total */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-extrabold w-fit transition-colors duration-200",
                      statusBadgeClass(order.status)
                    )}
                  >
                    {getStatusLabel(order.status)}
                  </Badge>
                  {/* Show Midtrans cancellation reason */}
                  {order.status === "CANCELLED" &&
                    order.paymentMethod === "MIDTRANS" &&
                    order.midtransPaymentStatus &&
                    !order.cancellationReason && (
                      <span className="text-[9px] text-muted-foreground">
                        {order.midtransPaymentStatus === "expire"
                          ? "⏰ Waktu bayar habis"
                          : order.midtransPaymentStatus === "deny"
                            ? "❌ Pembayaran ditolak"
                            : order.midtransPaymentStatus === "cancel"
                              ? "🚫 Pembayaran dibatalkan"
                              : null}
                      </span>
                    )}
                  {/* Show admin cancellation reason */}
                  {order.status === "CANCELLED" &&
                    order.cancellationReason && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-semibold text-red-500">
                          🛑 Dibatalkan oleh Penjual
                        </span>
                        <span className="text-[9px] text-red-400">
                          Alasan: {order.cancellationReason}
                        </span>
                      </div>
                    )}
                  {/* User self-cancel (no cancellationReason and no midtrans failure) */}
                  {order.status === "CANCELLED" &&
                    !order.cancellationReason &&
                    !(order.paymentMethod === "MIDTRANS" && order.midtransPaymentStatus && ["expire", "deny", "cancel"].includes(order.midtransPaymentStatus)) && (
                      <span className="text-[9px] text-muted-foreground">
                        🙋 Dibatalkan oleh kamu
                      </span>
                    )}
                </div>
                <span className="text-sm font-extrabold text-primary">
                  {formatRupiah(order.totalAmount)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
