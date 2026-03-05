"use client";

import { motion } from "framer-motion";
import { Plus, Star } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { playfulToast } from "@/lib/toast";
import { useCartStore } from "@/hooks/useCartStore";

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  photoUrl: string | null;
  tenantId: string;
  tenantName: string;
  category: string | null;
  isAvailable: boolean;
  index: number;
}

export function MenuCard({
  id,
  name,
  price,
  photoUrl,
  tenantId,
  tenantName,
  isAvailable,
  index,
}: MenuCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({ menuId: id, name, price, tenantId, tenantName });
    playfulToast.cartAdd(name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      className="group relative cursor-pointer rounded-[28px] border border-gray-100 bg-white p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
    >
      {/* Image */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-4xl">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-secondary to-primary/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f37d.svg"
              alt={name}
              className="h-12 w-12 opacity-60"
            />
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-gray-700 shadow-sm backdrop-blur-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          4.8
        </div>

        {/* Out of stock overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-4xl bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-extrabold text-white">
              Aduh, Menu Habis
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1.5 pb-1.5">
        <h3 className="mb-1 line-clamp-1 text-sm font-extrabold leading-tight text-gray-800">
          {name}
        </h3>
        <p className="mb-3 text-[11px] font-bold text-gray-400">
          {tenantName}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-primary">
            {formatRupiah(price)}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary shadow-sm transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Tambah ${name} ke keranjang`}
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
