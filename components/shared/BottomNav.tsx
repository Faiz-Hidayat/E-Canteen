"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ClipboardList, User, ShoppingCart, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/hooks/useCartStore";

const NAV_ITEMS_LOGGED_IN = [
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/orders", label: "Pesanan", icon: ClipboardList },
  { href: "/cart", label: "Keranjang", icon: ShoppingCart },
  { href: "/profile", label: "Profil", icon: User },
] as const;

const NAV_ITEMS_GUEST = [
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/login", label: "Masuk", icon: LogIn },
] as const;

interface BottomNavProps {
  isLoggedIn?: boolean;
}

export function BottomNav({ isLoggedIn }: BottomNavProps) {
  const pathname = usePathname();
  const getItemCount = useCartStore((s) => s.getItemCount);
  const itemCount = getItemCount();

  const items = isLoggedIn ? NAV_ITEMS_LOGGED_IN : NAV_ITEMS_GUEST;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/90 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const showBadge = item.href === "/cart" && itemCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
                isActive
                  ? "text-[#FFB26B]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {showBadge && (
                <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                  {itemCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
