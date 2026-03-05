import { z } from "zod";

// ── Order Item Schema ───────────────────────────────────────

export const OrderItemSchema = z.object({
  menuId: z.string().min(1, "Menu ID wajib diisi."),
  quantity: z
    .number({ message: "Jumlah wajib diisi." })
    .int("Jumlah harus bilangan bulat.")
    .min(1, "Minimal pesan 1 item.")
    .max(50, "Maksimal 50 item per menu ya."),
});

// ── Create Order Schema ─────────────────────────────────────

export const CreateOrderSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID wajib diisi."),
  items: z
    .array(OrderItemSchema)
    .min(1, "Minimal harus ada 1 item pesanan."),
  pickupTime: z.enum(["BREAK_1", "BREAK_2"], {
    message: "Pilih waktu pengambilan yang valid.",
  }),
  paymentMethod: z.enum(["BALANCE", "MIDTRANS"], {
    message: "Pilih metode pembayaran yang valid.",
  }),
  notes: z
    .string()
    .max(200, "Catatan maksimal 200 karakter.")
    .optional()
    .default(""),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;

// ── Update Order Status Schema ──────────────────────────────

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib diisi."),
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"], {
    message: "Status pesanan tidak valid.",
  }),
  cancellationReason: z
    .string()
    .min(1, "Alasan pembatalan wajib diisi.")
    .max(200, "Alasan maksimal 200 karakter.")
    .optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ── Cancel Order Schema (User) ──────────────────────────────

export const CancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID wajib diisi."),
});

export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
