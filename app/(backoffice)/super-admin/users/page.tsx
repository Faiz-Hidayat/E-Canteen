import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserManagement } from '@/components/shared/UserManagement';

export const dynamic = 'force-dynamic';

export interface UserListPageItem {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
  tenantName: string | null;
}

export default async function SuperAdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      balance: true,
      created_at: true,
      tenant: { select: { name: true } },
    },
  });

  const items: UserListPageItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    balance: u.balance,
    createdAt: u.created_at.toISOString(),
    tenantName: u.tenant?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 p-6 text-white shadow-lg shadow-blue-200/40">
        <div className="absolute -right-6 -top-6 text-[80px] opacity-20">👥</div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-white/80">
          Lihat dan kelola seluruh akun pengguna Kantin 40
        </p>
        <div className="mt-3 flex gap-3">
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{items.length}</span>
            <span className="ml-1 text-xs text-white/80">Total User</span>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-lg font-bold">{items.filter(u => u.role === 'ADMIN').length}</span>
            <span className="ml-1 text-xs text-white/80">Admin</span>
          </div>
        </div>
      </div>
      <UserManagement users={items} />
    </div>
  );
}
