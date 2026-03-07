import { z } from "zod";

// ── Create Tenant Schema ────────────────────────────────────

export const CreateTenantSchema = z.object({
  name: z
    .string({ message: "Nama stan wajib diisi." })
    .min(2, "Nama stan minimal 2 karakter.")
    .max(100, "Nama stan maksimal 100 karakter."),
  adminEmail: z
    .string({ message: "Email admin wajib diisi." })
    .email("Format email tidak valid."),
  adminName: z
    .string({ message: "Nama admin wajib diisi." })
    .min(2, "Nama admin minimal 2 karakter.")
    .max(100, "Nama admin maksimal 100 karakter."),
  adminPassword: z
    .string({ message: "Password admin wajib diisi." })
    .min(6, "Password minimal 6 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// ── Update Tenant Schema ────────────────────────────────────

export const UpdateTenantSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID wajib diisi."),
  name: z
    .string()
    .min(2, "Nama stan minimal 2 karakter.")
    .max(100, "Nama stan maksimal 100 karakter.")
    .optional(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

// ── Delete Tenant Schema ────────────────────────────────────

export const DeleteTenantSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID wajib diisi."),
});

export type DeleteTenantInput = z.infer<typeof DeleteTenantSchema>;
