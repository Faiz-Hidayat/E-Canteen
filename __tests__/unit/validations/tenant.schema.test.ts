import { describe, it, expect } from "vitest";
import {
  CreateTenantSchema,
  UpdateTenantSchema,
} from "@/lib/validations/tenant.schema";

describe("CreateTenantSchema", () => {
  it("accepts valid tenant data", () => {
    const result = CreateTenantSchema.safeParse({
      name: "Stan Bu Ani",
      adminEmail: "admin@kantin.id",
      adminName: "Bu Ani",
      adminPassword: "rahasia123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional description", () => {
    const result = CreateTenantSchema.safeParse({
      name: "Stan Bu Ani",
      adminEmail: "admin@kantin.id",
      adminName: "Bu Ani",
      adminPassword: "rahasia123",
      description: "Makanan rumahan enak",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateTenantSchema.safeParse({
      name: "",
      adminEmail: "admin@kantin.id",
      adminName: "Bu Ani",
      adminPassword: "rahasia123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid admin email", () => {
    const result = CreateTenantSchema.safeParse({
      name: "Stan Bu Ani",
      adminEmail: "bukan-email",
      adminName: "Bu Ani",
      adminPassword: "rahasia123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short admin password", () => {
    const result = CreateTenantSchema.safeParse({
      name: "Stan Bu Ani",
      adminEmail: "admin@kantin.id",
      adminName: "Bu Ani",
      adminPassword: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateTenantSchema", () => {
  it("accepts valid update", () => {
    const result = UpdateTenantSchema.safeParse({
      tenantId: "tenant-1",
      name: "Stan Baru",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with only tenantId", () => {
    const result = UpdateTenantSchema.safeParse({
      tenantId: "tenant-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tenantId", () => {
    const result = UpdateTenantSchema.safeParse({
      tenantId: "",
    });
    expect(result.success).toBe(false);
  });
});
