import { z } from "zod";

// ── Top-Up Schema ──────────────────────────────────────────

export const TopUpSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(10000, "Minimal top-up Rp 10.000.")
    .max(500000, "Maksimal top-up Rp 500.000."),
});

export type TopUpInput = z.infer<typeof TopUpSchema>;
