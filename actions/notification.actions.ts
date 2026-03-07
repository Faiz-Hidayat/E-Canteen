"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MarkAsReadSchema,
  GetNotificationsSchema,
} from "@/lib/validations/notification.schema";

// ── Types ──────────────────────────────────────────────────

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── getNotifications ───────────────────────────────────────

export async function getNotifications(
  limit = 20
): Promise<ActionResult<NotificationData[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu." };
  }

  // Zod validation
  const parsed = GetNotificationsSchema.safeParse({ limit });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const notifications = await prisma.notification.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: parsed.data.limit,
  });

  return {
    success: true,
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      orderId: n.order_id,
      isRead: n.is_read,
      createdAt: n.created_at.toISOString(),
    })),
  };
}

// ── getUnreadCount ─────────────────────────────────────────

export async function getUnreadCount(): Promise<ActionResult<number>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu." };
  }

  const count = await prisma.notification.count({
    where: { user_id: session.user.id, is_read: false },
  });

  return { success: true, data: count };
}

// ── markAsRead ─────────────────────────────────────────────

export async function markAsRead(
  notificationId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu." };
  }

  // Zod validation
  const parsed = MarkAsReadSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: parsed.data.notificationId },
    select: { user_id: true },
  });

  if (!notification || notification.user_id !== session.user.id) {
    return { success: false, error: "Notifikasi tidak ditemukan." };
  }

  await prisma.notification.update({
    where: { id: parsed.data.notificationId },
    data: { is_read: true },
  });

  return { success: true, data: null };
}

// ── markAllAsRead ──────────────────────────────────────────

export async function markAllAsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu." };
  }

  await prisma.notification.updateMany({
    where: { user_id: session.user.id, is_read: false },
    data: { is_read: true },
  });

  return { success: true, data: null };
}
