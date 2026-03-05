import { describe, it, expect } from "vitest";
import { TopUpSchema } from "@/lib/validations/balance.schema";

describe("TopUpSchema", () => {
  // ── Valid cases ────────────────────────────────────────────

  it("accepts minimum valid amount (10000)", () => {
    const result = TopUpSchema.safeParse({ amount: 10000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(10000);
    }
  });

  it("accepts maximum valid amount (500000)", () => {
    const result = TopUpSchema.safeParse({ amount: 500000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(500000);
    }
  });

  it("accepts typical amounts (25000, 50000, 100000)", () => {
    for (const amount of [25000, 50000, 100000]) {
      const result = TopUpSchema.safeParse({ amount });
      expect(result.success).toBe(true);
    }
  });

  // ── Below minimum ──────────────────────────────────────────

  it("rejects amount below 10000", () => {
    const result = TopUpSchema.safeParse({ amount: 5000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Minimal top-up Rp 10.000."
      );
    }
  });

  it("rejects zero amount", () => {
    const result = TopUpSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = TopUpSchema.safeParse({ amount: -10000 });
    expect(result.success).toBe(false);
  });

  // ── Above maximum ─────────────────────────────────────────

  it("rejects amount above 500000", () => {
    const result = TopUpSchema.safeParse({ amount: 600000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Maksimal top-up Rp 500.000."
      );
    }
  });

  it("rejects 1000000", () => {
    const result = TopUpSchema.safeParse({ amount: 1000000 });
    expect(result.success).toBe(false);
  });

  // ── Invalid types ─────────────────────────────────────────

  it("rejects non-number amount", () => {
    const result = TopUpSchema.safeParse({ amount: "10000" });
    expect(result.success).toBe(false);
  });

  it("rejects missing amount", () => {
    const result = TopUpSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects null amount", () => {
    const result = TopUpSchema.safeParse({ amount: null });
    expect(result.success).toBe(false);
  });

  it("rejects undefined amount", () => {
    const result = TopUpSchema.safeParse({ amount: undefined });
    expect(result.success).toBe(false);
  });

  // ── Boundary values ───────────────────────────────────────

  it("rejects 9999 (just below min)", () => {
    const result = TopUpSchema.safeParse({ amount: 9999 });
    expect(result.success).toBe(false);
  });

  it("rejects 500001 (just above max)", () => {
    const result = TopUpSchema.safeParse({ amount: 500001 });
    expect(result.success).toBe(false);
  });
});
