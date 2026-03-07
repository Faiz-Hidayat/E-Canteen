"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  UpdateRoleSchema,
  AdjustBalanceSchema,
  GetAllUsersFiltersSchema,
  type UpdateRoleInput,
  type AdjustBalanceInput,
} from "@/lib/validations/user.schema";

// ── Types ──────────────────────────────────────────────────

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
  tenantName: string | null;
}

interface GetAllUsersFilters {
  role?: string;
  search?: string;
}

// ── Helpers ────────────────────────────────────────────────

// ── getAllUsers ─────────────────────────────────────────────

export async function getAllUsers(
  filters?: GetAllUsersFilters
): Promise<ActionResult<UserListItem[]>> {
  // 1. Auth + RBAC
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak. Hanya Super Admin yang bisa melakukan ini." };
  }

  // 2. Zod validation
  const parsed = GetAllUsersFiltersSchema.safeParse(filters ?? {});
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const where: Record<string, unknown> = {};

    // Role filter
    if (parsed.data.role && parsed.data.role !== "ALL") {
      where.role = parsed.data.role;
    }

    // Search filter (name or email)
    if (parsed.data.search) {
      where.OR = [
        { name: { contains: parsed.data.search } },
        { email: { contains: parsed.data.search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        created_at: true,
        tenant: { select: { name: true } },
      },
    });

    const data: UserListItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      balance: u.balance,
      createdAt: u.created_at.toISOString(),
      tenantName: u.tenant?.name ?? null,
    }));

    return { success: true, data };
  } catch (err) {
    console.error("[getAllUsers]", {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal memuat data user. Coba lagi ya.",
    };
  }
}

// ── updateUserRole ─────────────────────────────────────────

export async function updateUserRole(
  input: UpdateRoleInput
): Promise<ActionResult> {
  // 1. Auth + RBAC
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak. Hanya Super Admin yang bisa melakukan ini." };
  }

  // 2. Zod validation
  const parsed = UpdateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const { userId, role } = parsed.data;

  try {
    // 3. Prevent self-demotion
    if (userId === session.user.id && role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Kamu tidak bisa mengubah role dirimu sendiri.",
      };
    }

    // 4. Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, tenant: { select: { id: true } } },
    });
    if (!user) {
      return { success: false, error: "User tidak ditemukan." };
    }

    // 5. If changing FROM ADMIN, check tenant dependency
    if (user.role === "ADMIN" && user.tenant && role !== "ADMIN") {
      return {
        success: false,
        error: "User ini masih terhubung ke stan. Hapus stan terlebih dahulu.",
      };
    }

    // 6. Update role
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/super-admin/users");

    return { success: true, data: null };
  } catch (err) {
    console.error("[updateUserRole]", {
      userId,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal mengubah role user. Coba lagi ya.",
    };
  }
}

// ── adjustUserBalance ──────────────────────────────────────

export async function adjustUserBalance(
  input: AdjustBalanceInput
): Promise<ActionResult> {
  // 1. Auth + RBAC
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak. Hanya Super Admin yang bisa melakukan ini." };
  }

  // 2. Zod validation
  const parsed = AdjustBalanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const { userId, amount, type, reason } = parsed.data;

  try {
    // 3. MUST use prisma.$transaction for financial ops
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, name: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const delta = type === "INCREMENT" ? amount : -amount;
      const newBalance = user.balance + delta;

      if (newBalance < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      // Create notification for the user
      await tx.notification.create({
        data: {
          user_id: userId,
          type: type === "INCREMENT" ? "BALANCE_ADJUSTMENT_ADD" : "BALANCE_ADJUSTMENT_DEDUCT",
          title:
            type === "INCREMENT"
              ? "Saldo Ditambahkan"
              : "Saldo Dikurangi",
          message:
            type === "INCREMENT"
              ? `Saldo kamu ditambahkan Rp ${amount.toLocaleString("id-ID")} oleh Super Admin. Alasan: ${reason}`
              : `Saldo kamu dikurangi Rp ${amount.toLocaleString("id-ID")} oleh Super Admin. Alasan: ${reason}`,
        },
      });
    });

    revalidatePath("/super-admin/users");

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return { success: false, error: "User tidak ditemukan." };
      }
      if (error.message === "INSUFFICIENT_BALANCE") {
        return {
          success: false,
          error: "Saldo user tidak cukup untuk dikurangi sebanyak itu.",
        };
      }
    }
    console.error("[adjustUserBalance]", {
      userId,
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: "Gagal mengubah saldo user. Coba lagi ya.",
    };
  }
}
