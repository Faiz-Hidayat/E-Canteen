"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wallet,
  StickyNote,
  ArrowRight,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateOrderStatus } from "@/actions/order.actions";
import { formatRupiah, getStatusLabel } from "@/lib/utils/format";
import { playfulToast } from "@/lib/toast";
import type { QueueOrder } from "@/app/(backoffice)/admin/queue/page";

// ── Status Config ──────────────────────────────────────────

interface StatusConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEFAULT_CONFIG: StatusConfig = {
  icon: <ClipboardList className="size-4" />,
  color: "text-amber-600",
  bgColor: "bg-amber-50",
  borderColor: "border-amber-200",
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  CONFIRMED: {
    icon: <ClipboardList className="size-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  PREPARING: {
    icon: <ChefHat className="size-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  READY: {
    icon: <CheckCircle2 className="size-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
};

// ── Next status transitions (only statuses visible in queue) ──

const NEXT_STATUS: Record<string, string | null> = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Mulai Proses",
  PREPARING: "Siap Diambil",
  READY: "Selesai",
};

// ── OrderCard ──────────────────────────────────────────────

function OrderCard({ order }: { order: QueueOrder }) {
  const [isPending, startTransition] = useTransition();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const config = STATUS_CONFIG[order.status] ?? DEFAULT_CONFIG;
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_STATUS_LABEL[order.status];

  const handleAdvance = () => {
    if (!nextStatus) return;
    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId: order.id,
        status: nextStatus as "PREPARING" | "READY" | "COMPLETED",
      });
      if (result.success) {
        playfulToast.success(
          nextStatus === "COMPLETED"
            ? "Pesanan selesai! 🎉"
            : `Status diubah ke ${getStatusLabel(nextStatus)}`,
        );
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      playfulToast.error("Alasan pembatalan wajib diisi ya.");
      return;
    }
    setIsCancelling(true);
    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId: order.id,
        status: "CANCELLED",
        cancellationReason: cancelReason.trim(),
      });
      if (result.success) {
        playfulToast.warning("Pesanan dibatalkan dan saldo dikembalikan.");
      } else {
        playfulToast.error(result.error);
      }
      setIsCancelling(false);
      setShowCancelConfirm(false);
      setCancelReason("");
    });
  };

  const orderTime = new Date(order.createdAt);
  const timeStr = orderTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`overflow-hidden border-l-4 ${config.borderColor} p-0`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 pt-3 pb-2`}>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`${config.bgColor} ${config.color} gap-1 border-0 transition-colors duration-200`}
            >
              {config.icon}
              {getStatusLabel(order.status)}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {order.paymentMethod === "MIDTRANS" ? (
              <CreditCard className="size-3.5" />
            ) : (
              <Wallet className="size-3.5" />
            )}
            <span>
              {order.paymentMethod === "MIDTRANS" ? "Midtrans" : "Saldo"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-sm font-semibold text-foreground">
            {order.userName}
          </p>

          {/* Items */}
          <div className="mt-2 space-y-1">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  {item.quantity}x {item.menuName}
                </span>
                <span className="font-medium text-foreground">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatRupiah(order.totalAmount)}
            </span>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5">
              <StickyNote className="mt-0.5 size-3 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            {nextStatus && (
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleAdvance}
                disabled={isPending}
              >
                {isPending && !isCancelling ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
                {nextLabel}
              </Button>
            )}
            {/* Cancel available for CONFIRMED and PREPARING, not READY */}
            {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isPending}
              >
                <XCircle className="size-3.5" />
                Batal
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Cancel Confirmation Dialog with Reason */}
      <Dialog
        open={showCancelConfirm}
        onOpenChange={(open) => {
          setShowCancelConfirm(open);
          if (!open) setCancelReason("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan?</DialogTitle>
            <DialogDescription>
              Pesanan <strong>{order.userName}</strong> sebesar{" "}
              <strong>{formatRupiah(order.totalAmount)}</strong> akan dibatalkan
              dan saldo dikembalikan ke pembeli. Aksi ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="cancel-reason"
              className="text-sm font-medium text-foreground"
            >
              Alasan Pembatalan <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="Contoh: Bahan habis, stok tidak tersedia..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={200}
              className="resize-none"
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {cancelReason.length}/200
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelConfirm(false);
                setCancelReason("");
              }}
              disabled={isCancelling}
            >
              Nggak Jadi
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason.trim()}
              className="gap-1.5"
            >
              {isCancelling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────

function EmptyQueue({ status }: { status: string }) {
  const messages: Record<string, { emoji: string; text: string }> = {
    CONFIRMED: { emoji: "📋", text: "Tidak ada pesanan masuk." },
    PREPARING: { emoji: "👨‍🍳", text: "Tidak ada pesanan sedang diproses." },
    READY: { emoji: "✅", text: "Tidak ada pesanan siap diambil." },
  };
  const msg = messages[status] ?? { emoji: "📋", text: "Tidak ada pesanan." };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center"
    >
      <p className="text-3xl">{msg.emoji}</p>
      <p className="mt-2 text-sm text-muted-foreground">{msg.text}</p>
    </motion.div>
  );
}

// ── OrderQueueBoard ────────────────────────────────────────

interface OrderQueueBoardProps {
  orders: QueueOrder[];
}

export function OrderQueueBoard({ orders }: OrderQueueBoardProps) {
  const router = useRouter();

  // Auto-refresh queue every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(interval);
  }, [router]);

  const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");

  const counts = {
    CONFIRMED: confirmedOrders.length,
    PREPARING: preparingOrders.length,
    READY: readyOrders.length,
  };

  return (
    <Tabs defaultValue="CONFIRMED" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="CONFIRMED" className="gap-1.5 text-xs">
          <ClipboardList className="size-3.5" />
          Pesanan Masuk
          {counts.CONFIRMED > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 bg-amber-100 px-1.5 text-[10px] text-amber-700"
            >
              {counts.CONFIRMED}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="PREPARING" className="gap-1.5 text-xs">
          <ChefHat className="size-3.5" />
          Diproses
          {counts.PREPARING > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 bg-blue-100 px-1.5 text-[10px] text-blue-700"
            >
              {counts.PREPARING}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="READY" className="gap-1.5 text-xs">
          <CheckCircle2 className="size-3.5" />
          Siap Diambil
          {counts.READY > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 bg-green-100 px-1.5 text-[10px] text-green-700"
            >
              {counts.READY}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="CONFIRMED" className="mt-4">
        {confirmedOrders.length === 0 ? (
          <EmptyQueue status="CONFIRMED" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {confirmedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>

      <TabsContent value="PREPARING" className="mt-4">
        {preparingOrders.length === 0 ? (
          <EmptyQueue status="PREPARING" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>

      <TabsContent value="READY" className="mt-4">
        {readyOrders.length === 0 ? (
          <EmptyQueue status="READY" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {readyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
