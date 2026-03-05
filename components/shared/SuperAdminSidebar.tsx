"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  ClipboardList,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SUPER_ADMIN_NAV_ITEMS = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/super-admin/tenants", label: "Stan/Tenant", icon: Store, exact: false },
  { href: "/super-admin/users", label: "Users", icon: Users, exact: false },
  { href: "/super-admin/all-orders", label: "Semua Pesanan", icon: ClipboardList, exact: false },
] as const;

interface SuperAdminSidebarProps {
  adminName?: string | null;
}

export function SuperAdminSidebar({ adminName }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(item: (typeof SUPER_ADMIN_NAV_ITEMS)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-col border-r border-border/40 bg-white transition-all duration-300 md:fixed md:left-0 md:top-0 md:flex md:z-40",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/40 px-3">
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                Super Admin Panel
              </p>
              {adminName && (
                <p className="truncate text-xs text-muted-foreground">
                  {adminName}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 p-2">
          {SUPER_ADMIN_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#FFB26B]/10 text-[#FFB26B]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer branding */}
        {!collapsed && (
          <div className="border-t border-border/40 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFB26B]">
                <span className="text-xs">🍽️</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                E-Canteen
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/90 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {SUPER_ADMIN_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
                  active
                    ? "text-[#FFB26B]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
