"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { createMidtransTopUpToken } from "@/actions/balance.actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { playfulToast } from "@/lib/toast";

// ── Types ──────────────────────────────────────────────────

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

// ── Quick Amounts ──────────────────────────────────────────

const QUICK_AMOUNTS = [10_000, 25_000, 50_000, 100_000] as const;

// ── Component ──────────────────────────────────────────────

export function TopUpForm() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAmount = selectedAmount ?? (customAmount ? parseInt(customAmount, 10) : 0);

  const handleQuickSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "");
    setCustomAmount(digits);
    setSelectedAmount(null);
    setError(null);
  };

  const handleTopUp = async () => {
    if (!activeAmount || activeAmount < 10_000) {
      setError("Minimal top-up Rp 10.000.");
      return;
    }
    if (activeAmount > 500_000) {
      setError("Maksimal top-up Rp 500.000.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createMidtransTopUpToken(activeAmount);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Open Midtrans Snap popup
      if (!window.snap) {
        setError("Midtrans belum siap. Coba refresh halaman ya.");
        setIsLoading(false);
        return;
      }

      window.snap.pay(result.data.token, {
        onSuccess: () => {
          playfulToast.success("Top-up berhasil! Saldo kamu sudah bertambah.");
          router.refresh();
          setSelectedAmount(null);
          setCustomAmount("");
          setIsLoading(false);
        },
        onPending: () => {
          playfulToast.info("Pembayaran masih diproses. Saldo akan bertambah otomatis.");
          setIsLoading(false);
        },
        onError: () => {
          setError("Pembayaran gagal. Coba lagi ya.");
          setIsLoading(false);
        },
        onClose: () => {
          setIsLoading(false);
        },
      });
    } catch {
      setError("Terjadi kesalahan. Coba lagi ya.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h3 className="text-base font-extrabold text-gray-800">Top-Up Saldo</h3>
      </div>

      {/* Quick amount buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {QUICK_AMOUNTS.map((amount) => (
          <motion.button
            key={amount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickSelect(amount)}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-bold transition-all",
              selectedAmount === amount
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "border border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            Rp {amount.toLocaleString("id-ID")}
          </motion.button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
          Atau masukkan nominal lain
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            Rp
          </span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="10.000 - 500.000"
            value={customAmount ? parseInt(customAmount, 10).toLocaleString("id-ID") : ""}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="rounded-xl pl-10 font-bold"
          />
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 text-xs font-bold text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleTopUp}
        disabled={isLoading || !activeAmount}
        className={cn(
          "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-lg transition-all",
          activeAmount && !isLoading
            ? "bg-linear-to-r from-primary to-[#ff9b44] text-white shadow-primary/30 hover:shadow-xl"
            : "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Top-Up Sekarang
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
