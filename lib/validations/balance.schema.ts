import { z } from "zod";

// ── Top-Up Schema ──────────────────────────────────────────

export const TopUpSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(10000, "Minimal top-up Rp 10.000.")
    .max(500000, "Maksimal top-up Rp 500.000."),
});

export type TopUpInput = z.infer<typeof TopUpSchema>;

// ── Get Balance History Schema ──────────────────────────────

export const GetBalanceHistorySchema = z.object({
  limit: z
    .number()
    .int("Limit harus bilangan bulat.")
    .min(1, "Minimal 1.")
    .max(100, "Maksimal 100.")
    .optional()
    .default(20),
});

export type GetBalanceHistoryInput = z.infer<typeof GetBalanceHistorySchema>;
