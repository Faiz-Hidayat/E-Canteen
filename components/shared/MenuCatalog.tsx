'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Mic } from 'lucide-react';
import { MenuCard } from '@/components/shared/MenuCard';
import { TenantSwitchDialog } from '@/components/shared/TenantSwitchDialog';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  price: number;
  photoUrl: string | null;
  category: string | null;
  isAvailable: boolean;
  tenantName: string;
  tenantId: string;
}

interface MenuCatalogProps {
  menus: MenuItem[];
}

// ── Category data ──────────────────────────────────────────

const CATEGORIES = [
  { name: 'Semua', icon: '1f37d', color: 'bg-[#F3E8FF]' },
  { name: 'Makanan', icon: '1f354', color: 'bg-[#FFE5D9]' },
  { name: 'Minuman', icon: '1f9cb', color: 'bg-[#E8F3E1]' },
  { name: 'Snack', icon: '1f369', color: 'bg-[#FFF3CD]' },
  { name: 'Sehat', icon: '1f957', color: 'bg-[#E2F0CB]' },
] as const;

// ── Helpers ────────────────────────────────────────────────

function mapCategoryFilter(dbCategory: string | null): string {
  if (!dbCategory) return 'Makanan';
  const lower = dbCategory.toLowerCase();
  if (lower.includes('minum') || lower.includes('jus') || lower.includes('es')) return 'Minuman';
  if (lower.includes('snack') || lower.includes('gorengan') || lower.includes('roti')) return 'Snack';
  if (lower.includes('sehat') || lower.includes('salad')) return 'Sehat';
  if (lower.includes('makanan') || lower.includes('berat') || lower.includes('nasi') || lower.includes('mie'))
    return 'Makanan';
  return 'Makanan';
}

// ── Component ──────────────────────────────────────────────

export function MenuCatalog({ menus }: MenuCatalogProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), []);

  // Filter menus
  const filtered = useMemo(() => {
    let result = menus;

    // Category filter
    if (activeCategory !== 'Semua') {
      result = result.filter((m) => mapCategoryFilter(m.category) === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q) || m.tenantName.toLowerCase().includes(q));
    }

    return result;
  }, [menus, search, activeCategory]);

  // Group by tenant
  const grouped = useMemo(() => {
    const map = new Map<string, { tenantName: string; items: typeof filtered }>();
    for (const item of filtered) {
      const existing = map.get(item.tenantId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.tenantId, { tenantName: item.tenantName, items: [item] });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {/* ── Search Bar ────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="relative flex h-14 w-full items-center overflow-hidden rounded-full border border-gray-100 bg-white px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Mau jajan apa hari ini? 🤤"
            className="h-full flex-1 border-none bg-transparent px-3 text-sm font-bold text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button
            className="rounded-full bg-secondary p-2.5 text-primary transition-colors hover:bg-primary hover:text-white"
            aria-label="Voice search">
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Category pills ────────────────────────────── */}
      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pt-2">
        {CATEGORIES.map((cat, i) => {
          const isActive = activeCategory === cat.name;
          return (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={() => setActiveCategory(cat.name)}
              className="group flex min-w-19 cursor-pointer flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-sm transition-transform duration-300 group-hover:scale-110',
                  isActive ? 'border-primary/50 ring-2 ring-primary/20' : 'border-white',
                  cat.color,
                )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cat.icon}.svg`}
                  className="h-8 w-8 drop-shadow-sm transition-transform group-hover:rotate-12"
                  alt={cat.name}
                />
              </div>
              <span className={cn('text-xs font-bold', isActive ? 'text-primary' : 'text-gray-700')}>{cat.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Info Marquee (fun school canteen strip) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/10 bg-linear-to-r from-primary/10 via-secondary/60 to-primary/10 py-3">
        {/* Decorative gradient edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white/80 to-transparent" />

        <div className="animate-marquee flex items-center whitespace-nowrap text-sm font-extrabold tracking-wide text-primary/80">
          <div className="flex items-center gap-8 px-4">
            <span>🔔 Pesan dari kelas, ambil pas istirahat tanpa antre!</span>
            <span className="text-lg">🍱</span>
            <span>🕐 Istirahat 1: 09.30 — 10.00 &bull; Istirahat 2: 12.00 — 12.30</span>
            <span className="text-lg">🍛</span>
            <span>💰 Top-up saldo langsung dari app, bayar lebih cepat!</span>
            <span className="text-lg">⚡</span>
            <span>🧠 Fun Fact: Sarapan bikin konsentrasi naik 20%!</span>
            <span className="text-lg">📚</span>
            <span>🎉 Kantin 40 — jajan praktis, belajar fokus!</span>
            <span className="text-lg">🚀</span>
          </div>
          <div className="flex items-center gap-8 px-4" aria-hidden="true">
            <span>🔔 Pesan dari kelas, ambil pas istirahat tanpa antre!</span>
            <span className="text-lg">🍱</span>
            <span>🕐 Istirahat 1: 09.30 — 10.00 &bull; Istirahat 2: 12.00 — 12.30</span>
            <span className="text-lg">🍛</span>
            <span>💰 Top-up saldo langsung dari app, bayar lebih cepat!</span>
            <span className="text-lg">⚡</span>
            <span>🧠 Fun Fact: Sarapan bikin konsentrasi naik 20%!</span>
            <span className="text-lg">📚</span>
            <span>🎉 Kantin 40 — jajan praktis, belajar fokus!</span>
            <span className="text-lg">🚀</span>
          </div>
        </div>
      </motion.div>

      {/* ── Menu Grid (grouped by tenant) ─────────────── */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f614.svg"
            alt=""
            className="h-16 w-16 opacity-60"
          />
          <p className="text-sm font-bold text-gray-400">Tidak ada menu yang cocok. Coba kata kunci lain ya!</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.tenantName}>
            <h2 className="mb-4 text-xl font-extrabold text-gray-800">{group.tenantName} 🔥</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => {
                const idx = globalIndex++;
                return (
                  <MenuCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    photoUrl={item.photoUrl}
                    tenantId={item.tenantId}
                    tenantName={item.tenantName}
                    category={item.category}
                    isAvailable={item.isAvailable}
                    index={idx}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
      <TenantSwitchDialog />
    </div>
  );
}
