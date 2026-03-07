"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/useCartStore";
import { formatRupiah } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface CartDrawerProps {
  /** Render the trigger button inline — pass children to customize */
  children?: React.ReactNode;
}

export function CartDrawer({ children }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children ?? (
          <button aria-label="Buka keranjang" className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted">
            <ShoppingCart className="size-5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 text-lg font-extrabold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Keranjang Kamu
            {itemCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {itemCount} item
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            /* ── Empty state ─────────────────── */
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6d2.svg"
                alt=""
                className="h-16 w-16 opacity-50"
              />
              <p className="text-sm font-bold text-muted-foreground">
                Belum ada makanan yang dipilih
              </p>
              <p className="text-xs text-muted-foreground">
                Yuk pilih menu favoritmu!
              </p>
            </div>
          ) : (
            /* ── Cart items ──────────────────── */
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.menuId}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-extrabold text-gray-800">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(item.price)}
                    </p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.menuId, item.quantity - 1)
                      }
                      aria-label={`Kurangi ${item.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.menuId, item.quantity + 1)
                      }
                      aria-label={`Tambah ${item.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal + remove */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-extrabold text-primary">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.menuId)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Hapus ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter>
            {/* Total */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-bold text-muted-foreground">
                Total
              </span>
              <span className="text-xl font-extrabold text-primary">
                {formatRupiah(total)}
              </span>
            </div>

            <DrawerClose asChild>
              <Button
                className="w-full rounded-full text-base font-bold"
                size="lg"
                onClick={() => router.push("/cart")}
              >
                Checkout
              </Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
