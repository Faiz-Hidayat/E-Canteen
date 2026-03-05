import { z } from "zod";

// ── Login Schema ────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z
    .string({ message: "Email wajib diisi." })
    .email("Format email tidak valid."),
  password: z
    .string({ message: "Password wajib diisi." })
    .min(1, "Password wajib diisi."),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ── Register Schema ─────────────────────────────────────────

export const RegisterSchema = z
  .object({
    name: z
      .string({ message: "Nama wajib diisi." })
      .min(2, "Nama minimal 2 karakter ya."),
    email: z
      .string({ message: "Email wajib diisi." })
      .email("Format email tidak valid."),
    password: z
      .string({ message: "Password wajib diisi." })
      .min(6, "Password minimal 6 karakter."),
    confirmPassword: z
      .string({ message: "Konfirmasi password wajib diisi." })
      .min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
