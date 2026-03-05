"use client";

import { motion } from "framer-motion";
import { User, Mail, ShieldCheck, LogOut } from "lucide-react";
import { NumberTicker } from "@/components/magic/NumberTicker";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  balance: number;
}

// ── Helpers ────────────────────────────────────────────────

function roleBadge(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Super Admin", className: "bg-purple-100 text-purple-700 border-purple-200" };
    case "ADMIN":
      return { label: "Admin Stan", className: "bg-blue-100 text-blue-700 border-blue-200" };
    default:
      return { label: "Siswa", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
}

// ── Component ──────────────────────────────────────────────

export function ProfileCard({ name, email, role, balance }: ProfileCardProps) {
  const badge = roleBadge(role);

  return (
    <div className="space-y-5">
      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
      >
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-extrabold text-gray-800">
                {name}
              </h2>
              <Badge
                variant="outline"
                className={cn("shrink-0 text-[10px] font-bold", badge.className)}
              >
                {badge.label}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wallet / Saldo Card — matches ref UI exactly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-primary to-[#ff9b44] p-6 text-white shadow-xl shadow-primary/30"
      >
        {/* Polkadot SVG pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="polkadot-profile"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#polkadot-profile)"
          />
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
        </div>
      </motion.div>
    </div>
  );
}
