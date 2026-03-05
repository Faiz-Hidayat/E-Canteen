"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { RegisterSchema, LoginSchema } from "@/lib/validations/auth.schema";
import { AuthError } from "next-auth";

// ── Types ──────────────────────────────────────────────────

type RegisterResult =
  | { success: true; data: { userId: string } }
  | { success: false; error: string };

type LoginResult =
  | { success: true }
  | { success: false; error: string };

// ── Register ───────────────────────────────────────────────

export async function registerUser(
  input: z.infer<typeof RegisterSchema>
): Promise<RegisterResult> {
  // 1. Zod validation
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { name, email, password } = parsed.data;

  try {
    // 2. Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    // 3. Hash password
    const hashedPassword = await hash(password, 12);

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        balance: 0,
      },
    });

    return { success: true, data: { userId: user.id } };
  } catch (error) {
    console.error("[registerUser]", {
      email,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Terjadi kesalahan saat mendaftar. Coba lagi ya.",
    };
  }
}

// ── Login ──────────────────────────────────────────────────

export async function loginUser(
  input: z.infer<typeof LoginSchema>
): Promise<LoginResult> {
  // 1. Zod validation
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Email atau password salah. Coba cek lagi ya.",
          };
        default:
          return {
            success: false,
            error: "Terjadi kesalahan saat login. Coba lagi ya.",
          };
      }
    }

    // Re-throw non-auth errors (e.g., redirect from next-auth)
    throw error;
  }
}
