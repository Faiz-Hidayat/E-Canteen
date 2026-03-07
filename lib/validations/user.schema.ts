import { z } from "zod";

// ── Roles ──────────────────────────────────────────────────

const VALID_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

// ── Update Role Schema ──────────────────────────────────────

export const UpdateRoleSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  role: z.enum(VALID_ROLES, {
    message: "Role tidak valid. Pilih USER, ADMIN, atau SUPER_ADMIN.",
  }),
});

export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

// ── Adjust Balance Schema ───────────────────────────────────

export const AdjustBalanceSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(1, "Nominal minimal Rp 1.")
    .max(10_000_000, "Nominal maksimal Rp 10.000.000."),
  type: z.enum(["INCREMENT", "DECREMENT"], {
    message: "Tipe adjustment harus INCREMENT atau DECREMENT.",
  }),
  reason: z
    .string({ message: "Alasan wajib diisi." })
    .min(3, "Alasan minimal 3 karakter.")
    .max(200, "Alasan maksimal 200 karakter."),
});

export type AdjustBalanceInput = z.infer<typeof AdjustBalanceSchema>;
