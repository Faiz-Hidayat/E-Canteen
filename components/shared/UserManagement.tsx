'use client';

import { useState, useTransition } from 'react';
import { Search, Loader2, Shield, ShieldCheck, ShieldAlert, Wallet, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { updateUserRole, adjustUserBalance } from '@/actions/user.actions';
import { formatRupiah } from '@/lib/utils/format';
import { playfulToast } from '@/lib/toast';
import type { UserListPageItem } from '@/app/(backoffice)/super-admin/users/page';

// ── Role helpers ────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  USER: 'User',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  USER: 'bg-gray-100 text-gray-700 border-gray-200',
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  USER: <Shield className="size-3" />,
  ADMIN: <ShieldCheck className="size-3" />,
  SUPER_ADMIN: <ShieldAlert className="size-3" />,
};

const ROLE_PILL_COLORS: Record<string, string> = {
  ALL: 'bg-foreground text-white',
  USER: 'bg-gray-700 text-white',
  ADMIN: 'bg-blue-600 text-white',
  SUPER_ADMIN: 'bg-purple-600 text-white',
};

const ROLE_FILTERS = ['ALL', 'USER', 'ADMIN', 'SUPER_ADMIN'] as const;

// ── Change Role Dialog ──────────────────────────────────────

function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListPageItem | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [newRole, setNewRole] = useState('USER');

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      setNewRole(user.role);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    startTransition(async () => {
      const result = await updateUserRole({
        userId: user.id,
        role: newRole as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
      });
      if (result.success) {
        playfulToast.success('Role berhasil diubah!');
        onOpenChange(false);
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Role</DialogTitle>
          <DialogDescription>
            Ubah role untuk <strong>{user?.name}</strong> ({user?.email}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Role Baru</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Adjust Balance Dialog ───────────────────────────────────

function AdjustBalanceDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListPageItem | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [adjustType, setAdjustType] = useState<'INCREMENT' | 'DECREMENT'>('INCREMENT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setAdjustType('INCREMENT');
      setAmount('');
      setReason('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      playfulToast.error('Nominal harus lebih dari 0.');
      return;
    }
    if (!reason.trim()) {
      playfulToast.error('Alasan wajib diisi.');
      return;
    }

    startTransition(async () => {
      const result = await adjustUserBalance({
        userId: user.id,
        amount: numAmount,
        type: adjustType,
        reason: reason.trim(),
      });
      if (result.success) {
        playfulToast.success(
          adjustType === 'INCREMENT' ? 'Saldo berhasil ditambahkan! 💰' : 'Saldo berhasil dikurangi.',
        );
        onOpenChange(false);
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjustment Saldo</DialogTitle>
          <DialogDescription>
            Saldo saat ini <strong>{user?.name}</strong>: <strong>{formatRupiah(user?.balance ?? 0)}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'INCREMENT' | 'DECREMENT')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCREMENT">Tambah Saldo (+)</SelectItem>
                <SelectItem value="DECREMENT">Kurangi Saldo (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-amount">Nominal (Rp)</Label>
            <Input
              id="adjust-amount"
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-reason">Alasan</Label>
            <Input
              id="adjust-reason"
              placeholder="Contoh: Koreksi saldo, Refund, dll."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {adjustType === 'INCREMENT' ? 'Tambah' : 'Kurangi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────

interface UserManagementProps {
  users: UserListPageItem[];
}

export function UserManagement({ users }: UserManagementProps) {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<UserListPageItem | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<UserListPageItem | null>(null);

  // Filtering
  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const openRoleDialog = (user: UserListPageItem) => {
    setRoleUser(user);
    setRoleDialogOpen(true);
  };

  const openBalanceDialog = (user: UserListPageItem) => {
    setBalanceUser(user);
    setBalanceDialogOpen(true);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Role pills */}
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === role
                  ? `${ROLE_PILL_COLORS[role] ?? 'bg-foreground text-white'} border-transparent shadow-sm`
                  : 'border-border/40 bg-white/80 text-muted-foreground hover:bg-muted/60'
              }`}>
              {role !== 'ALL' && ROLE_ICONS[role]}
              {role === 'ALL' ? 'Semua' : (ROLE_LABELS[role] ?? role)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-border/40 bg-white/80 pl-9 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Counter */}
      <p className="text-xs text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> dari {users.length} user
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-16 backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner">
            <Search className="size-7 text-blue-400" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">Tidak ada user ditemukan</p>
          <p className="mt-1 text-xs text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="text-right font-semibold">Saldo</TableHead>
                <TableHead className="font-semibold">Stan</TableHead>
                <TableHead className="font-semibold">Daftar</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const initials = u.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const avatarGradients = [
                  'from-amber-400 to-orange-500',
                  'from-blue-400 to-indigo-500',
                  'from-emerald-400 to-green-500',
                  'from-pink-400 to-rose-500',
                  'from-violet-400 to-purple-500',
                ];
                const avatarGradient = avatarGradients[u.name.charCodeAt(0) % avatarGradients.length];

                return (
                  <TableRow key={u.id} className="transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-[11px] font-bold text-white shadow-sm`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                        {ROLE_ICONS[u.role]}
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-foreground">{formatRupiah(u.balance)}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.tenantName ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <Store className="size-3" />
                          {u.tenantName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleDialog(u)}
                          title="Ubah role"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                          <ShieldCheck className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openBalanceDialog(u)}
                          title="Adjustment saldo"
                          className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600">
                          <Wallet className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <ChangeRoleDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen} user={roleUser} />
      <AdjustBalanceDialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen} user={balanceUser} />
    </>
  );
}
