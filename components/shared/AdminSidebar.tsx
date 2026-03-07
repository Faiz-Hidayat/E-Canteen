"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin/queue",
    label: "Antrean",
    icon: ClipboardList,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    href: "/admin/menus",
    label: "Menu Saya",
    icon: UtensilsCrossed,
    gradient: "from-emerald-400 to-green-500",
  },
  {
    href: "/admin/reports",
    label: "Laporan",
    icon: BarChart3,
    gradient: "from-blue-400 to-indigo-500",
  },
] as const;

interface AdminSidebarProps {
  tenantName?: string | null;
  adminName?: string | null;
}

export function AdminSidebar({ tenantName, adminName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = (adminName ?? "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-col border-r border-border/30 bg-white/80 backdrop-blur-xl transition-all duration-300 md:fixed md:left-0 md:top-0 md:flex md:z-40",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "relative overflow-hidden border-b border-border/30",
            collapsed ? "px-2 py-3" : "px-4 py-4",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFB26B]/10 via-transparent to-[#93C572]/10" />
          <div className="relative flex items-center justify-between">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB26B] to-[#FF8C42] shadow-lg shadow-orange-200/50">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {tenantName ?? "Admin Panel"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Panel Penjual
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB26B] to-[#FF8C42] shadow-lg shadow-orange-200/50">
                <span className="text-lg">🍽️</span>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="flex justify-end px-2 pt-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeft className="size-3.5" />
            ) : (
              <PanelLeftClose className="size-3.5" />
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-2 pt-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#FFB26B]/15 to-[#FFB26B]/5 text-[#E8913A] shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#FFB26B] to-[#FF8C42]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-sm`
                      : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile Footer */}
        <div className="border-t border-border/30 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB26B] to-[#FF8C42] text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {adminName ?? "Admin"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  Admin Penjual
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB26B] to-[#FF8C42] text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-white/80 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 transition-all",
                  isActive
                    ? "text-[#E8913A]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-mobile-nav"
                    className="absolute inset-0 rounded-2xl bg-[#FFB26B]/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={cn(
                      "size-5 transition-transform",
                      isActive && "scale-110",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-[#FFB26B]"
                    />
                  )}
                </div>
                <span className="relative text-[10px] font-semibold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
