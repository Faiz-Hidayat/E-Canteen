'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/actions/notification.actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function notifIcon(type: string): string {
  switch (type) {
    case 'ORDER_CANCELLED_BY_ADMIN':
      return '❌';
    case 'ORDER_READY':
      return '🍽️';
    case 'ORDER_CONFIRMED':
      return '✅';
    default:
      return '🔔';
  }
}

// ── POLLING_INTERVAL ───────────────────────────────────────

const POLL_INTERVAL = 15_000; // 15 seconds

// ── NotificationBell ───────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Fetch full list
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getNotifications(20);
    if (result.success) {
      setNotifications(result.data);
    }
    setIsLoading(false);
  }, []);

  // Fetch unread count (polling)
  const fetchCount = useCallback(async () => {
    const result = await getUnreadCount();
    if (result.success) {
      const newCount = result.data;

      if (!isInitializedRef.current) {
        // First poll — just record the baseline, don't show popup for old notifs
        isInitializedRef.current = true;
        prevCountRef.current = newCount;
        setUnreadCount(newCount);
        return;
      }

      // If count increased since last poll → new notification arrived
      // Auto-open the dropdown so user sees it immediately
      if (newCount > prevCountRef.current) {
        setIsOpen(true);
        void fetchList();
        router.refresh();
      }
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    }
  }, [router, fetchList]);

  // Poll unread count via interval subscription
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchCount();
    }, POLL_INTERVAL);
    const initTimer = setTimeout(() => void fetchCount(), 0);
    return () => {
      clearInterval(interval);
      clearTimeout(initTimer);
    };
  }, [fetchCount]);

  // Fetch list when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => void fetchList(), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchList]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkRead(notif.id);
    }
    if (notif.orderId) {
      router.push('/orders');
      router.refresh();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifikasi">
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-extrabold text-gray-800">Notifikasi</h3>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={handleMarkAllRead}>
                    <CheckCheck className="size-3" />
                    Baca Semua
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="text-2xl">🔕</span>
                  <p className="text-xs text-muted-foreground">Belum ada notifikasi</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotifClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNotifClick(notif);
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      !notif.isRead && 'bg-primary/5',
                    )}>
                    <span className="mt-0.5 text-base">{notifIcon(notif.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'truncate text-xs font-bold',
                            notif.isRead ? 'text-gray-500' : 'text-gray-800',
                          )}>
                          {notif.title}
                        </p>
                        {!notif.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notif.id);
                        }}
                        className="mt-1 rounded-full p-1 text-muted-foreground hover:bg-gray-200 hover:text-foreground"
                        title="Tandai sudah dibaca">
                        <Check className="size-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
