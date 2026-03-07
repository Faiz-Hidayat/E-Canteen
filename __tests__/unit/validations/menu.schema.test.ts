import { describe, it, expect } from "vitest";
import {
  CreateMenuSchema,
  UpdateMenuSchema,
  ToggleMenuAvailabilitySchema,
  DeleteMenuSchema,
} from "@/lib/validations/menu.schema";

// ── CreateMenuSchema ───────────────────────────────────────

describe("CreateMenuSchema", () => {
  function validMenu() {
    return {
      name: "Nasi Goreng",
      description: "Nasi goreng spesial",
      price: 15000,
      category: "Makanan",
      photoUrl: "",
    };
  }

  // ── Valid cases ──────────────────────────────────────────

  it("accepts valid menu data", () => {
    const result = CreateMenuSchema.safeParse(validMenu());
    expect(result.success).toBe(true);
  });

  it("accepts menu without optional fields", () => {
    const result = CreateMenuSchema.safeParse({
      name: "Es Teh",
      price: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts price = 1000 (boundary min)", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts price = 1000000 (boundary max)", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: 1000000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts name with 2 chars (boundary min)", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      name: "Es",
    });
    expect(result.success).toBe(true);
  });

  it("accepts name with 100 chars (boundary max)", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid absolute path photoUrl", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      photoUrl: "/uploads/menu.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid http photoUrl", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      photoUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  // ── Name ─────────────────────────────────────────────────

  it("rejects empty name", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name with 1 char", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      name: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Nama menu minimal 2 karakter ya."
      );
    }
  });

  it("rejects name > 100 chars", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Nama menu maksimal 100 karakter."
      );
    }
  });

  // ── Price ────────────────────────────────────────────────

  it("rejects price < 1000", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: 500,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Harga minimal Rp 1.000 ya."
      );
    }
  });

  it("rejects price = 0", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: -5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects price > 1000000", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: 1000001,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Harga maksimal Rp 1.000.000."
      );
    }
  });

  it("rejects non-number price", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      price: "15000",
    });
    expect(result.success).toBe(false);
  });

  // ── Description ──────────────────────────────────────────

  it("rejects description > 500 chars", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  // ── Category ─────────────────────────────────────────────

  it("rejects category > 50 chars", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      category: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  // ── photoUrl ─────────────────────────────────────────────

  it("rejects invalid photoUrl", () => {
    const result = CreateMenuSchema.safeParse({
      ...validMenu(),
      photoUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

// ── UpdateMenuSchema ───────────────────────────────────────

describe("UpdateMenuSchema", () => {
  it("accepts update with menuId and partial fields", () => {
    const result = UpdateMenuSchema.safeParse({
      menuId: "menu-123",
      name: "Nasi Uduk",
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with only menuId", () => {
    const result = UpdateMenuSchema.safeParse({
      menuId: "menu-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty menuId", () => {
    const result = UpdateMenuSchema.safeParse({
      menuId: "",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing menuId", () => {
    const result = UpdateMenuSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });
});

// ── ToggleMenuAvailabilitySchema ───────────────────────────

describe("ToggleMenuAvailabilitySchema", () => {
  it("accepts valid toggle", () => {
    const result = ToggleMenuAvailabilitySchema.safeParse({
      menuId: "menu-123",
      isAvailable: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts isAvailable = false", () => {
    const result = ToggleMenuAvailabilitySchema.safeParse({
      menuId: "menu-123",
      isAvailable: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean isAvailable", () => {
    const result = ToggleMenuAvailabilitySchema.safeParse({
      menuId: "menu-123",
      isAvailable: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty menuId", () => {
    const result = ToggleMenuAvailabilitySchema.safeParse({
      menuId: "",
      isAvailable: true,
    });
    expect(result.success).toBe(false);
  });
});

// ── DeleteMenuSchema ───────────────────────────────────────

describe("DeleteMenuSchema", () => {
  it("accepts valid menuId", () => {
    const result = DeleteMenuSchema.safeParse({ menuId: "menu-123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty menuId", () => {
    const result = DeleteMenuSchema.safeParse({ menuId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing menuId", () => {
    const result = DeleteMenuSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
