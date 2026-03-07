import { z } from 'zod';

// ── Mark as Read Schema ─────────────────────────────────────

export const MarkAsReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID wajib diisi.'),
});

export type MarkAsReadInput = z.infer<typeof MarkAsReadSchema>;

// ── Get Notifications Schema ────────────────────────────────

export const GetNotificationsSchema = z.object({
  limit: z
    .number()
    .int('Limit harus bilangan bulat.')
    .min(1, 'Minimal 1.')
    .max(100, 'Maksimal 100.')
    .optional()
    .default(20),
});

export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
