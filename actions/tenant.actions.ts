"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  CreateTenantSchema,
  UpdateTenantSchema,
  DeleteTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
} from "@/lib/validations/tenant.schema";

// ── Types ──────────────────────────────────────────────────

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Helpers ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── createTenant ───────────────────────────────────────────

export async function createTenant(
  input: CreateTenantInput
): Promise<ActionResult<{ tenantId: string; adminId: string }>> {
  // 1. Auth + RBAC
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu harus login dulu ya." };
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Akses ditolak. Hanya Super Admin yang bisa melakukan ini." };
  }

  // 2. Zod validation
  const parsed = CreateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const { name, adminEmail, adminName, adminPassword, description } = parsed.data;

  try {
    // 3. Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      return { success: false, error: "Email admin sudah terdaftar." };
    }

    // 4. Generate slug
    let slug = slugify(name);
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // 5. Create User (ADMIN) + Tenant in a transaction
    const hashedPassword = await hash(adminPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          description: description || null,
          admin_id: admin.id,
        },
      });

      return { tenantId: tenant.id, adminId: admin.id };
    });

    revalidatePath("/super-admin/tenants");
    revalidatePath("/super-admin");

    return { success: true, data: result };
  } catch (err) {
    console.error("[createTenant]", {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal membuat stan baru. Coba lagi ya.",
    };
  }
}

// ── updateTenant ───────────────────────────────────────────

export async function updateTenant(
  input: UpdateTenantInput
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
  const parsed = UpdateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const { tenantId, name, description } = parsed.data;

  try {
    // 3. Check tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return { success: false, error: "Stan tidak ditemukan." };
    }

    // 4. Update
    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (description !== undefined) {
      data.description = description || null;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    revalidatePath("/super-admin/tenants");
    revalidatePath("/super-admin");

    return { success: true, data: null };
  } catch (err) {
    console.error("[updateTenant]", {
      tenantId,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal mengupdate stan. Coba lagi ya.",
    };
  }
}

// ── deleteTenant ───────────────────────────────────────────

export async function deleteTenant(
  tenantId: string
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
  const parsed = DeleteTenantSchema.safeParse({ tenantId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    // 2. Check tenant exists + dependency count
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        admin_id: true,
        _count: {
          select: {
            orders: true,
            menus: true,
          },
        },
      },
    });

    if (!tenant) {
      return { success: false, error: "Stan tidak ditemukan." };
    }

    // 3. Check active orders (non-completed/cancelled)
    const activeOrders = await prisma.order.count({
      where: {
        tenant_id: tenantId,
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
      },
    });

    if (activeOrders > 0) {
      return {
        success: false,
        error: `Stan masih punya ${activeOrders} pesanan aktif. Selesaikan dulu sebelum menghapus.`,
      };
    }

    // 4. Delete in transaction: OrderItems → Orders → Menus → Tenant
    await prisma.$transaction(async (tx) => {
      // Delete order items for all orders under this tenant
      await tx.orderItem.deleteMany({
        where: { order: { tenant_id: tenantId } },
      });

      // Delete all orders under this tenant
      await tx.order.deleteMany({
        where: { tenant_id: tenantId },
      });

      // Delete all menus
      await tx.menu.deleteMany({
        where: { tenant_id: tenantId },
      });

      // Delete tenant
      await tx.tenant.delete({
        where: { id: tenantId },
      });

      // Reset admin user role to USER (don't delete the user)
      await tx.user.update({
        where: { id: tenant.admin_id },
        data: { role: "USER" },
      });
    });

    revalidatePath("/super-admin/tenants");
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/users");

    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteTenant]", {
      tenantId,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal menghapus stan. Coba lagi ya.",
    };
  }
}
