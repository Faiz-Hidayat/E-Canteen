"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { playfulToast } from "@/lib/toast";

import { useCartStore } from "@/hooks/useCartStore";
import { formatRupiah } from "@/lib/utils/format";
import { createOrder } from "@/actions/order.actions";
import { createMidtransOrderToken } from "@/actions/balance.actions";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Midtrans Snap type ─────────────────────────────────────

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

// ── Pickup time / Payment method types ─────────────────────

const PICKUP_TIMES = [
  { value: "BREAK_1" as const, label: "Istirahat 1", time: "09.30 — 10.00" },
  { value: "BREAK_2" as const, label: "Istirahat 2", time: "12.00 — 12.30" },
] as const;

const PAYMENT_METHODS = [
  { value: "BALANCE" as const, label: "Potong Saldo", icon: "💰" },
  { value: "MIDTRANS" as const, label: "Bayar via Midtrans (QRIS, Gopay, dll)", icon: "💳" },
] as const;

// ── Component ──────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);

  const [pickupTime, setPickupTime] = useState<"BREAK_1" | "BREAK_2">(
    "BREAK_1"
  );
  const [paymentMethod, setPaymentMethod] = useState<"BALANCE" | "MIDTRANS">(
    "BALANCE"
  );
  const [notes, setNotes] = useState("");

  const total = getTotal();
  const tenantId = items[0]?.tenantId;
  const tenantName = items[0]?.tenantName;

  // ── Empty cart guard ─────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6d2.svg"
          alt=""
          className="h-20 w-20 opacity-50"
        />
        <h2 className="text-lg font-extrabold text-gray-800">
          Belum ada makanan yang dipilih
        </h2>
        <p className="text-sm text-muted-foreground">
          Yuk pilih menu favoritmu dulu!
        </p>
        <Button
          className="mt-2 rounded-full"
          onClick={() => router.push("/menu")}
        >
          Lihat Menu
        </Button>
      </div>
    );
  }

  // ── Submit handler ───────────────────────────────────────

  const handleSubmit = () => {
    if (!tenantId) return;

    startTransition(async () => {
      const result = await createOrder({
        tenantId,
        items: items.map((i) => ({
          menuId: i.menuId,
          quantity: i.quantity,
        })),
        pickupTime,
        paymentMethod,
        notes,
      });

      if (!result.success) {
        playfulToast.error(result.error);
        return;
      }

      if (paymentMethod === "BALANCE") {
        playfulToast.orderCreated();
        clearCart();
        router.push("/orders");
        return;
      }

      // MIDTRANS: get snap token then open popup
      const tokenResult = await createMidtransOrderToken(
        result.data.orderId
      );

      if (!tokenResult.success) {
        playfulToast.error(tokenResult.error);
        return;
      }

      if (!window.snap) {
        playfulToast.error("Midtrans belum siap. Coba refresh halaman.");
        return;
      }

      window.snap.pay(tokenResult.data.token, {
        onSuccess: () => {
          playfulToast.success("Pembayaran berhasil! 🎉");
          clearCart();
          router.push("/orders");
        },
        onPending: () => {
          playfulToast.paymentPending();
          clearCart();
          router.push("/orders");
        },
        onError: () => {
          playfulToast.error("Pembayaran gagal. Coba lagi ya.");
        },
        onClose: () => {
          playfulToast.info("Popup pembayaran ditutup.");
        },
      });
    });
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Pesanan dari <span className="font-bold text-foreground">{tenantName}</span>
        </p>
      </div>

      {/* ── Order Summary ────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <ShoppingBag className="h-4 w-4 text-primary" />
          Ringkasan Pesanan
        </div>
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          {items.map((item) => (
            <div
              key={item.menuId}
              className="flex items-center gap-3 border-b border-gray-50 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-gray-800">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRupiah(item.price)} × {item.quantity}
                </p>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateQuantity(item.menuId, item.quantity - 1)
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.menuId, item.quantity + 1)
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <span className="text-sm font-extrabold text-primary">
                {formatRupiah(item.price * item.quantity)}
              </span>

              <button
                onClick={() => removeItem(item.menuId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-bold text-muted-foreground">
              Total
            </span>
            <span className="text-xl font-extrabold text-primary">
              {formatRupiah(total)}
            </span>
          </div>
        </div>
      </section>

      {/* ── Pickup Time ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Clock className="h-4 w-4 text-primary" />
          Waktu Pengambilan
        </div>
        <RadioGroup
          value={pickupTime}
          onValueChange={(v) => setPickupTime(v as "BREAK_1" | "BREAK_2")}
          className="grid grid-cols-2 gap-3"
        >
          {PICKUP_TIMES.map((pt) => (
            <Label
              key={pt.value}
              htmlFor={pt.value}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center transition-all ${
                pickupTime === pt.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <RadioGroupItem
                value={pt.value}
                id={pt.value}
                className="sr-only"
              />
              <span className="text-sm font-extrabold text-gray-800">
                {pt.label}
              </span>
              <span className="text-xs text-muted-foreground">{pt.time}</span>
            </Label>
          ))}
        </RadioGroup>
      </section>

      {/* ── Payment Method ───────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <CreditCard className="h-4 w-4 text-primary" />
          Metode Pembayaran
        </div>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) =>
            setPaymentMethod(v as "BALANCE" | "MIDTRANS")
          }
          className="grid grid-cols-2 gap-3"
        >
          {PAYMENT_METHODS.map((pm) => (
            <Label
              key={pm.value}
              htmlFor={`pay-${pm.value}`}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center transition-all ${
                paymentMethod === pm.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <RadioGroupItem
                value={pm.value}
                id={`pay-${pm.value}`}
                className="sr-only"
              />
              <span className="text-lg">{pm.icon}</span>
              <span className="text-sm font-bold text-gray-800">
                {pm.label}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </section>

      {/* ── Notes ────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <FileText className="h-4 w-4 text-primary" />
          Catatan
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Bang sambelnya banyakin ya..."
          maxLength={200}
          className="resize-none rounded-2xl"
        />
        <p className="text-right text-xs text-muted-foreground">
          {notes.length}/200
        </p>
      </section>

      {/* ── Submit ───────────────────────────────────── */}
      <Button
        size="lg"
        className="w-full rounded-full text-base font-bold"
        disabled={isPending || items.length === 0}
        onClick={handleSubmit}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          `Bayar ${formatRupiah(total)}`
        )}
      </Button>
    </motion.div>
  );
}
