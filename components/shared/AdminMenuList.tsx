"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuAvailability,
} from "@/actions/menu.actions";
import { formatRupiah } from "@/lib/utils/format";
import { playfulToast } from "@/lib/toast";
import type { AdminMenuItem } from "@/app/(backoffice)/admin/menus/page";

// ── Menu Form ──────────────────────────────────────────────

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  photoUrl: string;
}

const EMPTY_FORM: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "",
  photoUrl: "",
};

function MenuFormDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: AdminMenuItem | null;
}) {
  const [form, setForm] = useState<MenuFormData>(() =>
    editItem
      ? {
          name: editItem.name,
          description: editItem.description ?? "",
          price: String(editItem.price),
          category: editItem.category ?? "",
          photoUrl: editItem.photoUrl ?? "",
        }
      : EMPTY_FORM
  );
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editItem;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 1000) {
      setErrors({ price: "Harga minimal Rp 1.000 ya." });
      return;
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateMenu({
          menuId: editItem.id,
          name: form.name,
          description: form.description || undefined,
          price: priceNum,
          category: form.category || undefined,
          photoUrl: form.photoUrl || undefined,
        });
        if (result.success) {
          playfulToast.success("Menu berhasil diperbarui! ✏️");
          onOpenChange(false);
        } else {
          playfulToast.error(result.error);
        }
      } else {
        const result = await createMenu({
          name: form.name,
          description: form.description || undefined,
          price: priceNum,
          category: form.category || undefined,
          photoUrl: form.photoUrl || undefined,
        });
        if (result.success) {
          playfulToast.success("Menu baru berhasil ditambahkan! 🎉");
          onOpenChange(false);
        } else {
          playfulToast.error(result.error);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Menu" : "Tambah Menu Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah detail menu di bawah ini."
              : "Isi detail menu baru untuk stan kamu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="menu-name">
              Nama Menu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="menu-name"
              placeholder="Nasi Goreng Spesial"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              maxLength={100}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="menu-price">
              Harga (Rp) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="menu-price"
              type="number"
              placeholder="15000"
              min={1000}
              max={1000000}
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              required
            />
            {errors.price && (
              <p className="text-xs text-red-500">{errors.price}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="menu-desc">Deskripsi</Label>
            <Textarea
              id="menu-desc"
              placeholder="Nasi goreng dengan telur, ayam, dan sayuran segar..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="menu-category">Kategori</Label>
            <Input
              id="menu-category"
              placeholder="Makanan Berat, Minuman, Snack..."
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              maxLength={50}
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="menu-photo">URL Foto</Label>
            <Input
              id="menu-photo"
              type="url"
              placeholder="https://example.com/foto-menu.jpg"
              value={form.photoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, photoUrl: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {isEdit ? "Simpan Perubahan" : "Tambah Menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ─────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminMenuItem | null;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!item) return;
    startTransition(async () => {
      const result = await deleteMenu({ menuId: item.id });
      if (result.success) {
        playfulToast.success("Menu berhasil dihapus.");
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
          <DialogTitle>Hapus Menu?</DialogTitle>
          <DialogDescription>
            Yakin mau hapus <strong>{item?.name}</strong>? Aksi ini tidak bisa
            dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
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
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Menu Card ──────────────────────────────────────────────

function AdminMenuCard({
  item,
  onEdit,
  onDelete,
}: {
  item: AdminMenuItem;
  onEdit: (item: AdminMenuItem) => void;
  onDelete: (item: AdminMenuItem) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleMenuAvailability({
        menuId: item.id,
        isAvailable: checked,
      });
      if (result.success) {
        playfulToast.success(
          checked ? "Menu ditampilkan ke pembeli! 🟢" : "Menu disembunyikan. 🔴"
        );
      } else {
        playfulToast.error(result.error);
      }
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`overflow-hidden p-0 transition-opacity ${!item.isAvailable ? "opacity-60" : ""}`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-8 text-gray-300" />
            </div>
          )}
          {/* Category badge */}
          {item.category && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-white/90 text-[10px] backdrop-blur-sm"
            >
              {item.category}
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.name}
              </p>
              <p className="text-sm font-bold text-[#FFB26B]">
                {formatRupiah(item.price)}
              </p>
            </div>
            {/* Availability toggle */}
            <div className="flex flex-col items-center gap-0.5">
              <Switch
                checked={item.isAvailable}
                onCheckedChange={handleToggle}
                disabled={isPending}
              />
              <span className="text-[10px] text-muted-foreground">
                {item.isAvailable ? "Aktif" : "Mati"}
              </span>
            </div>
          </div>

          {item.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => onEdit(item)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── AdminMenuList ──────────────────────────────────────────

interface AdminMenuListProps {
  menus: AdminMenuItem[];
}

export function AdminMenuList({ menus }: AdminMenuListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<AdminMenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminMenuItem | null>(null);

  const handleEdit = (item: AdminMenuItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleCloseForm = (open: boolean) => {
    setShowForm(open);
    if (!open) setEditItem(null);
  };

  return (
    <div>
      {/* Add button */}
      <Button onClick={() => setShowForm(true)} className="mb-4 gap-2">
        <Plus className="size-4" />
        Tambah Menu Baru
      </Button>

      {/* Menu Grid */}
      {menus.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center"
        >
          <UtensilsCrossed className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Belum ada menu di stan kamu.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Klik tombol &quot;Tambah Menu Baru&quot; untuk mulai.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {menus.map((item) => (
              <AdminMenuCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={setDeleteItem}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <MenuFormDialog
        open={showForm}
        onOpenChange={handleCloseForm}
        editItem={editItem}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
      />
    </div>
  );
}
