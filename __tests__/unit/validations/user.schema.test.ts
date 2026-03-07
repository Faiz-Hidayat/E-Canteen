import { describe, it, expect } from "vitest";
import {
  UpdateRoleSchema,
  AdjustBalanceSchema,
} from "@/lib/validations/user.schema";

describe("UpdateRoleSchema", () => {
  it("accepts valid role update", () => {
    const result = UpdateRoleSchema.safeParse({
      userId: "user-1",
      role: "ADMIN",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid roles", () => {
    for (const role of ["USER", "ADMIN", "SUPER_ADMIN"] as const) {
      const result = UpdateRoleSchema.safeParse({ userId: "user-1", role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = UpdateRoleSchema.safeParse({
      userId: "user-1",
      role: "MANAGER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty userId", () => {
    const result = UpdateRoleSchema.safeParse({
      userId: "",
      role: "USER",
    });
    expect(result.success).toBe(false);
  });
});

describe("AdjustBalanceSchema", () => {
  it("accepts valid balance adjustment", () => {
    const result = AdjustBalanceSchema.safeParse({
      userId: "user-1",
      amount: 50000,
      type: "INCREMENT",
      reason: "Top-up manual",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount = 0", () => {
    const result = AdjustBalanceSchema.safeParse({
      userId: "user-1",
      amount: 0,
      type: "DECREMENT",
      reason: "Koreksi saldo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects amount above max", () => {
    const result = AdjustBalanceSchema.safeParse({
      userId: "user-1",
      amount: 10_000_001,
      type: "INCREMENT",
      reason: "Top-up besar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = AdjustBalanceSchema.safeParse({
      userId: "user-1",
      amount: 10000,
      type: "TRANSFER",
      reason: "Transfer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short reason", () => {
    const result = AdjustBalanceSchema.safeParse({
      userId: "user-1",
      amount: 10000,
      type: "INCREMENT",
      reason: "ab",
    });
    expect(result.success).toBe(false);
  });
});
