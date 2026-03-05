"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/hooks/useCartStore";
import { formatRupiah } from "@/lib/utils/format";

export function CartFAB() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const itemCount = getItemCount();
  const total = getTotal();

  // Hide on cart/checkout page so it doesn't block the Bayar button
  const isCartPage = pathname === "/cart";

  return (
    <AnimatePresence>
      {items.length > 0 && !isCartPage && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-3rem)] max-w-md -translate-x-1/2 md:bottom-6"
        >
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-full border border-white/20 bg-primary p-2 pr-6 text-white shadow-2xl shadow-primary/40 backdrop-blur-md"
          >
            {/* Left: icon + badge */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <ShoppingBag className="h-5 w-5 text-white" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-primary bg-red-500 text-[10px] font-extrabold text-white shadow-sm">
                  {itemCount}
                </span>
              </div>

              {/* Center: total */}
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                  Total Pesanan
                </p>
                <p className="text-lg font-extrabold leading-none">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex cursor-pointer items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-extrabold backdrop-blur-sm transition-colors hover:bg-white/30">
              Checkout <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
