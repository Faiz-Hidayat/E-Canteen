'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartDrawer } from '@/components/shared/CartDrawer';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  userName?: string | null;
  isLoggedIn?: boolean;
}

const NAV_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'Pesanan' },
  { href: '/profile', label: 'Profil' },
] as const;

export function Navbar({ userName, isLoggedIn }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFB26B]">
            <span className="text-sm">🍽️</span>
          </div>
          <span className="text-lg font-bold text-foreground">Kantin 40</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#FFB26B]/10 text-[#FFB26B]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {userName && (
                <span className="hidden text-sm text-muted-foreground md:inline">Hai, {userName.split(' ')[0]}!</span>
              )}
              <NotificationBell />
              <CartDrawer />
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full gap-1.5 px-4 text-xs font-bold">
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                Masuk
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
