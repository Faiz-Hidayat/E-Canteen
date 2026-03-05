"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NumberTicker } from "@/components/magic/NumberTicker";

interface WalletCardProps {
  balance: number;
}

export function WalletCard({ balance }: WalletCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative h-full overflow-hidden rounded-[32px] bg-linear-to-br from-primary to-[#ff9b44] p-6 text-white shadow-xl shadow-primary/30"
    >
      {/* Polkadot SVG pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="polkadot"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="2" fill="currentColor" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#polkadot)" />
      </svg>

      {/* Floating sparkle */}
      <motion.img
        animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2728.svg"
        className="absolute right-4 top-4 h-6 w-6 opacity-70"
        alt=""
      />

      {/* Floating coin */}
      <motion.img
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1fa99.svg"
        className="absolute -bottom-4 -right-4 h-28 w-28 opacity-90 drop-shadow-2xl"
        alt=""
      />

      <div className="relative z-10">
        <p className="mb-1 text-sm font-bold tracking-wide text-white/90">
          Saldo Jajanmu
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold">Rp</span>
          <NumberTicker
            value={balance}
            className="text-4xl font-extrabold tracking-tight"
          />
        </div>
        <Link href="/profile">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-md"
          >
            <Plus className="h-4 w-4" /> Top Up Saldo
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
