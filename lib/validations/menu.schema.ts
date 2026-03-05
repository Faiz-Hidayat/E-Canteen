import { z } from "zod";

const PhotoUrlSchema = z
  .string()
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Format URL foto tidak valid." }
  )
  .optional()
  .or(z.literal(""));

// ── Create Menu Schema ──────────────────────────────────────

export const CreateMenuSchema = z.object({
  name: z
    .string({ message: "Nama menu wajib diisi." })
    .min(2, "Nama menu minimal 2 karakter ya.")
    .max(100, "Nama menu maksimal 100 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
  price: z
    .number({ message: "Harga wajib diisi." })
    .min(1000, "Harga minimal Rp 1.000 ya.")
    .max(1_000_000, "Harga maksimal Rp 1.000.000."),
  category: z
    .string()
    .max(50, "Kategori maksimal 50 karakter.")
    .optional()
    .or(z.literal("")),
  photoUrl: PhotoUrlSchema,
});

export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;

// ── Update Menu Schema ──────────────────────────────────────

export const UpdateMenuSchema = CreateMenuSchema.partial().extend({
  menuId: z.string({ message: "ID menu wajib diisi." }).min(1, "ID menu wajib diisi."),
});

export type UpdateMenuInput = z.infer<typeof UpdateMenuSchema>;

// ── Toggle Availability Schema ──────────────────────────────

export const ToggleMenuAvailabilitySchema = z.object({
  menuId: z.string({ message: "ID menu wajib diisi." }).min(1, "ID menu wajib diisi."),
  isAvailable: z.boolean({ message: "Status ketersediaan wajib diisi." }),
});

export type ToggleMenuAvailabilityInput = z.infer<typeof ToggleMenuAvailabilitySchema>;

// ── Delete Menu Schema ──────────────────────────────────────

export const DeleteMenuSchema = z.object({
  menuId: z.string({ message: "ID menu wajib diisi." }).min(1, "ID menu wajib diisi."),
});

export type DeleteMenuInput = z.infer<typeof DeleteMenuSchema>;
