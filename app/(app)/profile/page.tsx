import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ProfileCard } from '@/components/shared/ProfileCard';
import { TopUpForm } from '@/components/shared/TopUpForm';
import { BalanceHistory } from '@/components/shared/BalanceHistory';
import { LogOut } from 'lucide-react';

export const metadata = {
  title: 'Profil — Kantin 40',
  description: 'Halaman profil dan saldo kamu.',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f512.svg"
          alt=""
          className="h-16 w-16 opacity-60"
        />
        <h2 className="text-lg font-extrabold text-gray-800">Masuk dulu yuk! 👋</h2>
        <p className="max-w-xs text-sm text-muted-foreground">Kamu perlu login untuk melihat profilmu.</p>
        <Button asChild className="mt-2 rounded-full px-8">
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    );
  }

  // Fetch user data from DB for fresh balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      balance: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* Profile + Wallet Card */}
      <ProfileCard name={user.name} email={user.email} role={user.role} balance={user.balance} />

      {/* Top-Up Form */}
      <TopUpForm />

      {/* Balance History */}
      <BalanceHistory />

      {/* Logout */}
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-extrabold text-red-600 transition-colors hover:bg-red-100">
          <LogOut className="h-4 w-4" />
          Keluar dari Akun
        </button>
      </form>
    </div>
  );
}
