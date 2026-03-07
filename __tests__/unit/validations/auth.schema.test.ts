import { describe, it, expect } from "vitest";
import {
  LoginSchema,
  RegisterSchema,
} from "@/lib/validations/auth.schema";

// ── LoginSchema ────────────────────────────────────────────

describe("LoginSchema", () => {
  it("accepts valid email + password", () => {
    const result = LoginSchema.safeParse({
      email: "siswa@kantin.id",
      password: "rahasia123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = LoginSchema.safeParse({
      email: "bukan-email",
      password: "rahasia123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Format email tidak valid."
      );
    }
  });

  it("rejects empty email", () => {
    const result = LoginSchema.safeParse({
      email: "",
      password: "rahasia123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = LoginSchema.safeParse({ password: "rahasia123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({
      email: "siswa@kantin.id",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Password wajib diisi.");
    }
  });

  it("rejects missing password", () => {
    const result = LoginSchema.safeParse({ email: "siswa@kantin.id" });
    expect(result.success).toBe(false);
  });

  it("rejects completely empty object", () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── RegisterSchema ─────────────────────────────────────────

describe("RegisterSchema", () => {
  function validRegister() {
    return {
      name: "Budi Santoso",
      email: "budi@kantin.id",
      password: "password123",
      confirmPassword: "password123",
    };
  }

  // ── Valid ────────────────────────────────────────────────

  it("accepts valid registration data", () => {
    const result = RegisterSchema.safeParse(validRegister());
    expect(result.success).toBe(true);
  });

  it("accepts name with exactly 2 chars (boundary)", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      name: "Ab",
    });
    expect(result.success).toBe(true);
  });

  it("accepts password with exactly 6 chars (boundary)", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      password: "abc123",
      confirmPassword: "abc123",
    });
    expect(result.success).toBe(true);
  });

  // ── Name ─────────────────────────────────────────────────

  it("rejects name shorter than 2 chars", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      name: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Nama minimal 2 karakter ya."
      );
    }
  });

  it("rejects empty name", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      name: "",
    });
    expect(result.success).toBe(false);
  });

  // ── Email ────────────────────────────────────────────────

  it("rejects invalid email", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      email: "not@valid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      email: "",
    });
    expect(result.success).toBe(false);
  });

  // ── Password ─────────────────────────────────────────────

  it("rejects password shorter than 6 chars", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwIssue = result.error.issues.find(
        (i) => i.message === "Password minimal 6 karakter."
      );
      expect(pwIssue).toBeDefined();
    }
  });

  it("rejects empty password", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      password: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  // ── Password mismatch ───────────────────────────────────

  it("rejects password mismatch", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      password: "password123",
      confirmPassword: "password456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatchIssue = result.error.issues.find(
        (i) => i.path.includes("confirmPassword")
      );
      expect(mismatchIssue?.message).toBe("Password tidak cocok.");
    }
  });

  it("rejects empty confirmPassword", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister(),
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });

  // ── Missing fields ──────────────────────────────────────

  it("rejects missing all fields", () => {
    const result = RegisterSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
