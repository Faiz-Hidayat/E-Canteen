"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Store,
  Loader2,
  UtensilsCrossed,
  ShoppingBag,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {

  createTenant,
  updateTenant,
  deleteTenant,
} from "@/actions/tenant.actions";
import { playfulToast } from "@/lib/toast";
import type { TenantListItem } from "@/app/(backoffice)/super-admin/tenants/page";

// ── Create/Edit Dialog ─────────────────────────────────────

function TenantFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: TenantListItem | null;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!editItem;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Sync form on open
  const handleOpenChange = (open: boolean) => {
    if (open && editItem) {
      setName(editItem.name);
      setDescription(editItem.description ?? "");
    } else if (open && !editItem) {
      setName("");
      setDescription("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
    }
    onOpenChange(open);
  };

  // We re-sync when open changes
  if (open && editItem && name === "" && description === "") {
    // This will only fire once when dialog opens with edit item
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      if (isEdit) {
        const result = await updateTenant({
          tenantId: editItem.id,
          name: name || undefined,
          description,
        });
        if (result.success) {
          playfulToast.success("Stan berhasil diupdate! 🎉");
          onOpenChange(false);
        } else {
          playfulToast.error(result.error);
        }
      } else {
        const result = await createTenant({
          name,
          adminName,
          adminEmail,
          adminPassword,
          description,
        });
        if (result.success) {
          playfulToast.success("Stan baru & akun admin berhasil dibuat! 🏪");
          onOpenChange(false);
        } else {
          playfulToast.error(result.error);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Stan" : "Tambah Stan Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah informasi stan."
              : "Buat stan baru beserta akun admin penjualnya."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stan Name */}
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Nama Stan</Label>
            <Input
              id="tenant-name"
              placeholder="Contoh: Warung Bu Ani"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tenant-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="tenant-desc"
              placeholder="Deskripsi singkat tentang stan ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Admin fields only for create */}
          {!isEdit && (
            <>
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">
                  Akun Admin Penjual
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Nama Admin</Label>
                    <Input
                      id="admin-name"
                      placeholder="Contoh: Bu Ani"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email Admin</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="buani@ecanteen.sch.id"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password Admin</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {isEdit ? "Simpan" : "Buat Stan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ──────────────────────────────

function DeleteTenantDialog({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantListItem | null;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!tenant) return;
    startTransition(async () => {
      const result = await deleteTenant(tenant.id);
      if (result.success) {
        playfulToast.success("Stan berhasil dihapus.");
        onOpenChange(false);
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Stan?</DialogTitle>
          <DialogDescription>
            Semua data terkait stan <strong>{tenant?.name}</strong> (menu,
            pesanan lama) akan dihapus. Akun admin akan direset ke role USER.
            Aksi ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Ya, Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────

interface TenantManagementProps {
  tenants: TenantListItem[];
}

export function TenantManagement({ tenants }: TenantManagementProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<TenantListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TenantListItem | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (tenant: TenantListItem) => {
    setEditItem(tenant);
    setFormOpen(true);
  };

  const openDelete = (tenant: TenantListItem) => {
    setDeleteItem(tenant);
    setDeleteOpen(true);
  };

  // Gradient colors cycling for tenant cards
  const gradients = [
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-green-500",
    "from-blue-400 to-indigo-500",
    "from-pink-400 to-rose-500",
    "from-violet-400 to-purple-500",
    "from-cyan-400 to-teal-500",
  ];

  return (
    <>
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tenants.length} stan terdaftar
        </p>
        <Button onClick={openCreate} className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 shadow-md shadow-green-200/50 hover:from-emerald-600 hover:to-green-600">
          <Plus className="size-4" />
          Tambah Stan Baru
        </Button>
      </div>

      {/* Cards Grid */}
      {tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-white/60 py-20 backdrop-blur-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-green-100 shadow-inner">
            <Store className="size-8 text-emerald-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">
            Belum ada stan terdaftar
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Klik &quot;Tambah Stan Baru&quot; untuk membuat stan pertama.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tenants.map((t, i) => (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Gradient Top Bar */}
              <div className={`h-2 bg-gradient-to-r ${gradients[i % gradients.length]}`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} text-white shadow-sm`}>
                      <Store className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{t.name}</p>
                      {t.description && (
                        <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(t)}
                      title="Edit stan"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(t)}
                      title="Hapus stan"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Admin Info */}
                <div className="mt-4 space-y-2 rounded-xl bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="size-3.5 shrink-0" />
                    <span className="truncate font-medium text-foreground">{t.adminName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{t.adminEmail}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5">
                    <UtensilsCrossed className="size-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">{t.menuCount}</span>
                    <span className="text-[10px] text-amber-600">menu</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5">
                    <ShoppingBag className="size-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">{t.orderCount}</span>
                    <span className="text-[10px] text-blue-600">order</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="size-3" />
                    {new Date(t.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TenantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
      />
      <DeleteTenantDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tenant={deleteItem}
      />
    </>
  );
}
