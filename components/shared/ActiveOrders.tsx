"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, Store, CreditCard, Timer, AlertTriangle, XCircle, Loader2, Ban } from "lucide-react";
import type { OrderData } from "@/app/(app)/orders/page";
import { formatRupiah, getPickupLabel } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelOrder } from "@/actions/order.actions";
import { playfulToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ── Midtrans status mapping ────────────────────────────────

interface MidtransStatusInfo {
  label: string;
  description: string;
  emoji: string;
  color: "violet" | "amber" | "red" | "emerald";
}

function getMidtransStatusInfo(
  midtransStatus: string | null,
  isExpired: boolean
): MidtransStatusInfo {
  if (isExpired) {
    return {
      label: "Waktu Pembayaran Habis",
      description: "Pesanan otomatis dibatalkan karena tidak dibayar.",
      emoji: "⏰",
      color: "red",
    };
  }

  switch (midtransStatus) {
    case "deny":
      return {
        label: "Pembayaran Ditolak",
        description: "Pembayaran ditolak oleh bank/penyedia. Coba metode lain ya.",
        emoji: "😔",
        color: "red",
      };
    case "cancel":
      return {
        label: "Pembayaran Dibatalkan",
        description: "Pembayaran sudah dibatalkan.",
        emoji: "❌",
        color: "red",
      };
    case "expire":
      return {
        label: "Pembayaran Kedaluwarsa",
        description: "Waktu pembayaran sudah habis. Pesanan dibatalkan.",
        emoji: "⏰",
        color: "red",
      };
    case "settlement":
    case "capture":
      return {
        label: "Pembayaran Berhasil",
        description: "Pembayaran sudah diterima! Pesanan sedang diproses.",
        emoji: "✅",
        color: "emerald",
      };
    case "pending":
    default:
      return {
        label: "Menunggu Pembayaran",
        description: "Selesaikan pembayaranmu ya, biar pesanan langsung diproses! 🙏",
        emoji: "💳",
        color: "violet",
      };
  }
}

const STATUS_COLORS = {
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    subtext: "text-violet-500",
    icon: "text-violet-500",
    progressBg: "bg-violet-100",
    progressFill: "bg-violet-400",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    subtext: "text-amber-500",
    icon: "text-amber-500",
    progressBg: "bg-amber-100",
    progressFill: "bg-amber-400",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    subtext: "text-red-500",
    icon: "text-red-500",
    progressBg: "bg-red-100",
    progressFill: "bg-red-400",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    subtext: "text-emerald-500",
    icon: "text-emerald-500",
    progressBg: "bg-emerald-100",
    progressFill: "bg-emerald-400",
  },
} as const;

// ── Payment Countdown ──────────────────────────────────────

function PaymentCountdown({
  expiresAt,
  midtransStatus,
  totalDuration,
}: {
  expiresAt: string | null;
  midtransStatus: string | null;
  /** Total countdown duration in seconds (default 900 = 15 min) */
  totalDuration: number;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const expiresMs = new Date(expiresAt).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresMs - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setIsExpired(true);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const statusInfo = getMidtransStatusInfo(midtransStatus, isExpired);
  const colors = STATUS_COLORS[statusInfo.color];

  // Format mm:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Urgency level
  const isUrgent = timeLeft !== null && timeLeft > 0 && timeLeft <= 120; // < 2 min
  const isWarning = timeLeft !== null && timeLeft > 120 && timeLeft <= 300; // 2-5 min
  const effectiveColors = isExpired
    ? STATUS_COLORS.red
    : isUrgent
      ? STATUS_COLORS.red
      : isWarning
        ? STATUS_COLORS.amber
        : colors;

  // Progress bar
  const progress = timeLeft !== null ? (timeLeft / Math.max(totalDuration, 1)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "mx-5 mb-3 overflow-hidden rounded-2xl border",
        effectiveColors.bg,
        effectiveColors.border
      )}
    >
      {/* Main content */}
      <div className="flex items-start gap-2.5 p-3">
        {/* Icon */}
        <motion.div
          animate={
            isExpired
              ? { scale: [1, 1.1, 1] }
              : isUrgent
                ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }
                : { rotate: [0, 8, -8, 0] }
          }
          transition={{
            duration: isUrgent ? 0.6 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-0.5"
        >
          {isExpired || midtransStatus === "expire" ? (
            <XCircle className={cn("h-5 w-5", effectiveColors.icon)} />
          ) : isUrgent ? (
            <AlertTriangle className={cn("h-5 w-5", effectiveColors.icon)} />
          ) : (
            <CreditCard className={cn("h-5 w-5", effectiveColors.icon)} />
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Status label */}
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-xs font-extrabold", effectiveColors.text)}>
              {statusInfo.emoji} {statusInfo.label}
            </p>

            {/* Countdown timer */}
            {timeLeft !== null && timeLeft > 0 && !isExpired && (
              <motion.div
                animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5",
                  isUrgent
                    ? "bg-red-100"
                    : isWarning
                      ? "bg-amber-100"
                      : "bg-violet-100"
                )}
              >
                <Timer
                  className={cn(
                    "h-3 w-3",
                    isUrgent
                      ? "text-red-600"
                      : isWarning
                        ? "text-amber-600"
                        : "text-violet-600"
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] font-extrabold tabular-nums",
                    isUrgent
                      ? "text-red-700"
                      : isWarning
                        ? "text-amber-700"
                        : "text-violet-700"
                  )}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Description */}
          <p className={cn("mt-0.5 text-[10px] leading-tight", effectiveColors.subtext)}>
            {isExpired && !midtransStatus
              ? "Waktu pembayaran habis. Pesanan akan otomatis dibatalkan."
              : statusInfo.description}
          </p>
        </div>
      </div>

      {/* Progress bar (only when counting down) */}
      {timeLeft !== null && timeLeft > 0 && !isExpired && (
        <div className={cn("h-1", effectiveColors.progressBg)}>
          <motion.div
            className={cn("h-full rounded-r-full", effectiveColors.progressFill)}
            initial={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      )}

      {/* Expired / failed state: full red bar */}
      {(isExpired || midtransStatus === "expire" || midtransStatus === "deny" || midtransStatus === "cancel") && (
        <div className="h-1 bg-red-200">
          <div className="h-full w-full bg-red-400" />
        </div>
      )}
    </motion.div>
  );
}

// ── Timeline config ────────────────────────────────────────

const STEPS = [
  {
    key: "CONFIRMED",
    label: "Pesanan Diterima",
    emoji: "1f4dd",
    accent: "#FFB26B",
    bgActive: "bg-amber-50",
    borderActive: "border-amber-200/80",
  },
  {
    key: "PREPARING",
    label: "Lagi dimasak~",
    emoji: "1f373",
    accent: "#FF8C42",
    bgActive: "bg-orange-50",
    borderActive: "border-orange-200/80",
  },
  {
    key: "READY",
    label: "Ambil yuk!",
    emoji: "1f37d",
    accent: "#93C572",
    bgActive: "bg-emerald-50",
    borderActive: "border-emerald-200/80",
  },
] as const;

function statusIndex(status: string): number {
  // PENDING → -1 (all steps idle while awaiting payment)
  return STEPS.findIndex((s) => s.key === status);
}

// ── Floating steam particles (cooking step) ────────────────

function SteamPuffs() {
  return (
    <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gray-300/50"
          style={{
            width: 5 + i * 1.5,
            height: 5 + i * 1.5,
            left: -6 + i * 7,
          }}
          animate={{
            y: [0, -14 - i * 4],
            opacity: [0.7, 0],
            scale: [0.7, 1.4],
          }}
          transition={{
            duration: 1.3 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Writing scribble lines (pending step) ──────────────────

function ScribbleLines() {
  return (
    <div className="pointer-events-none absolute -right-1.5 top-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="mb-0.5 rounded-full bg-amber-300/60"
          style={{ width: 6 + i * 2, height: 1.5 }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.6 + i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Sparkle burst (ready step) ─────────────────────────────

function Sparkles() {
  const angles = [0, 72, 144, 216, 288];
  return (
    <div className="pointer-events-none absolute inset-0">
      {angles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const dist = 22;
        return (
          <motion.div
            key={deg}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full"
            style={{ backgroundColor: i % 2 === 0 ? "#FFD700" : "#93C572" }}
            animate={{
              x: [0, Math.cos(rad) * dist, 0],
              y: [0, Math.sin(rad) * dist, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Animated trail connector ───────────────────────────────

function TrailDots({ filled }: { filled: boolean }) {
  return (
    <div className="flex items-center gap-[3px] px-1">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: i === 1 || i === 2 ? 3.5 : 2.5,
            height: i === 1 || i === 2 ? 3.5 : 2.5,
          }}
          animate={
            filled
              ? { backgroundColor: "#93C572", scale: [1, 1.3, 1] }
              : { backgroundColor: "#E5E5E5", scale: 1 }
          }
          transition={
            filled
              ? {
                  scale: {
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  },
                  backgroundColor: { duration: 0.4 },
                }
              : { duration: 0.4 }
          }
        />
      ))}
    </div>
  );
}

// ── Single step station ────────────────────────────────────

function StepStation({
  step,
  state,
}: {
  step: (typeof STEPS)[number];
  state: "done" | "active" | "idle";
}) {
  const isDone = state === "done";
  const isActive = state === "active";

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Station circle */}
      <motion.div
        initial={false}
        animate={{
          scale: isActive ? 1.1 : isDone ? 0.95 : 0.9,
          y: isActive ? -3 : 0,
          rotate: isActive ? [0, -3, 3, 0] : 0,
        }}
        transition={
          isActive
            ? {
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                scale: { type: "spring", stiffness: 300, damping: 18 },
                y: { type: "spring", stiffness: 300, damping: 18 },
              }
            : { type: "spring", stiffness: 300, damping: 18 }
        }
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition-shadow duration-500",
          isActive && step.bgActive,
          isActive && step.borderActive,
          isActive && "shadow-md",
          isDone && "border-accent/30 bg-accent/10",
          !isActive && !isDone && "border-gray-200 bg-gray-50"
        )}
        style={
          isActive
            ? { boxShadow: `0 4px 20px ${step.accent}30` }
            : undefined
        }
      >
        {/* Emoji illustration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${step.emoji}.svg`}
          alt={step.label}
          className={cn(
            "h-5 w-5 drop-shadow-sm transition-all duration-500",
            !isActive && !isDone && "opacity-30 grayscale"
          )}
        />

        {/* Done checkmark overlay */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent shadow-sm"
            >
              <svg
                className="h-2.5 w-2.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active glow ring */}
        {isActive && (
          <motion.div
            animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl"
            style={{ border: `2px solid ${step.accent}` }}
          />
        )}

        {/* Step-specific particle effects */}
        {isActive && step.key === "CONFIRMED" && <ScribbleLines />}
        {isActive && step.key === "PREPARING" && <SteamPuffs />}
        {isActive && step.key === "READY" && <Sparkles />}
      </motion.div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.span
            key="active-label"
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wide"
            style={{
              backgroundColor: `${step.accent}18`,
              color: step.accent,
            }}
          >
            {step.label}
          </motion.span>
        ) : (
          <motion.span
            key="idle-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDone ? 0.7 : 0.35 }}
            className={cn(
              "text-[9px] font-bold",
              isDone ? "text-accent" : "text-gray-400"
            )}
          >
            {isDone ? "Selesai ✓" : step.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Full StatusTimeline ────────────────────────────────────

function StatusTimeline({ status }: { status: string }) {
  const current = statusIndex(status);

  return (
    <div className="flex w-full items-start justify-center gap-0">
      {STEPS.map((step, i) => {
        const state: "done" | "active" | "idle" =
          i < current ? "done" : i === current ? "active" : "idle";

        return (
          <div key={step.key} className="flex items-start">
            <StepStation step={step} state={state} />
            {i < STEPS.length - 1 && (
              <div className="mt-4 flex items-center">
                <TrailDots filled={i < current} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Cancel Order Button ────────────────────────────────────

function CancelOrderButton({ order }: { order: OrderData }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Can cancel if PENDING or CONFIRMED only (PREPARING = sudah dimasak, tidak bisa dibatalkan user)
  const canCancel =
    order.status === "PENDING" || order.status === "CONFIRMED";
  if (!canCancel) return null;

  // Determine if user gets a refund (CONFIRMED = already paid)
  const willRefund =
    order.paymentMethod === "BALANCE" ||
    (order.paymentMethod === "MIDTRANS" && order.status === "CONFIRMED");

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrder({ orderId: order.id });
      if (result.success) {
        if (willRefund) {
          playfulToast.success(
            `Pesanan dibatalkan. ${formatRupiah(order.totalAmount)} dikembalikan ke Saldo Jajanmu! 💰`
          );
        } else {
          playfulToast.info("Pesanan dibatalkan.");
        }
        setShowConfirm(false);
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
        onClick={() => setShowConfirm(true)}
      >
        <Ban className="size-3" />
        Batalkan
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan?</DialogTitle>
            <DialogDescription>
              {willRefund ? (
                <>
                  Saldo sebesar{" "}
                  <strong className="text-foreground">
                    {formatRupiah(order.totalAmount)}
                  </strong>{" "}
                  akan dikembalikan ke{" "}
                  <strong className="text-foreground">Saldo Jajanmu</strong>.
                </>
              ) : (
                "Pesanan belum dibayar, jadi langsung dibatalkan ya."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              Nggak Jadi
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── ActiveOrders ───────────────────────────────────────────

interface ActiveOrdersProps {
  orders: OrderData[];
}

export function ActiveOrders({ orders }: ActiveOrdersProps) {
  const router = useRouter();

  // Auto-refresh every 15 seconds to pick up status changes
  useEffect(() => {
    if (orders.length === 0) return;
    const interval = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(interval);
  }, [orders.length, router]);

  return (
    <section>
      <h2 className="mb-4 text-xl font-extrabold text-gray-800">
        Pesanan Aktif 🔥
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60c.svg"
            alt=""
            className="h-14 w-14 opacity-50"
          />
          <p className="text-sm font-bold text-muted-foreground">
            Tidak ada pesanan aktif saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
            >
              {/* Header: tenant + pickup badge */}
              <div className="flex items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm font-extrabold text-gray-800">
                    {order.tenantName}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1 text-[10px] font-bold"
                >
                  <Clock className="h-3 w-3" />
                  {getPickupLabel(order.pickupTime)}
                </Badge>
              </div>

              {/* Items */}
              <ul className="space-y-1 px-5 pb-3">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">
                      {item.menuName}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-bold text-gray-700">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Notes */}
              {order.notes && (
                <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl bg-secondary/50 p-3">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs text-gray-600">{order.notes}</p>
                </div>
              )}

              {/* Midtrans Payment Status Banner */}
              {order.status === "PENDING" &&
                order.paymentMethod === "MIDTRANS" && (
                  <PaymentCountdown
                    expiresAt={order.paymentExpiresAt}
                    midtransStatus={order.midtransPaymentStatus}
                    totalDuration={900}
                  />
                )}

              {/* ── Illustrated Timeline Panel ─────────── */}
              <div className="border-t border-dashed border-gray-100 bg-[#FEFDFB] px-5 py-4">
                <StatusTimeline status={order.status} />
              </div>

              {/* Footer: total + cancel */}
              <div className="flex items-center justify-between border-t border-gray-50 bg-white px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Total Pesanan
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
                <CancelOrderButton order={order} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
