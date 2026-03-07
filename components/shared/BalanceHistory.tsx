'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, History, Loader2 } from 'lucide-react';
import { getBalanceHistory, type BalanceHistoryItem } from '@/actions/balance.actions';
import { cn } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  return `Rp ${abs.toLocaleString('id-ID')}`;
}

function typeConfig(type: BalanceHistoryItem['type']) {
  switch (type) {
    case 'TOPUP':
      return {
        icon: ArrowDownLeft,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        prefix: '+',
      };
    case 'REFUND':
      return {
        icon: RotateCcw,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        prefix: '+',
      };
    case 'PURCHASE':
      return {
        icon: ArrowUpRight,
        color: 'text-red-500',
        bg: 'bg-red-50',
        prefix: '-',
      };
  }
}

// ── Component ──────────────────────────────────────────────

export function BalanceHistory() {
  const [items, setItems] = useState<BalanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      setIsLoading(true);
      const result = await getBalanceHistory(20);
      if (!cancelled && result.success) {
        setItems(result.data);
      }
      if (!cancelled) setIsLoading(false);
    }
    void fetchHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-base font-extrabold text-gray-800">Riwayat Saldo</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-3xl">💸</span>
          <p className="text-sm font-bold text-muted-foreground">Belum ada riwayat saldo</p>
          <p className="text-xs text-muted-foreground">Top-up atau belanja untuk melihat riwayat di sini.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence>
            {items.map((item, i) => {
              const config = typeConfig(item.type);
              const Icon = config.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-gray-50">
                  {/* Icon */}
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>

                  {/* Description + date */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">{item.description}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</p>
                  </div>

                  {/* Amount */}
                  <p
                    className={cn(
                      'shrink-0 text-sm font-extrabold',
                      item.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-600',
                    )}>
                    {config.prefix}
                    {formatAmount(item.amount)}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
