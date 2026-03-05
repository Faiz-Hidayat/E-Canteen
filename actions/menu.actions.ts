"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateMenuSchema,
  UpdateMenuSchema,
  DeleteMenuSchema,
  ToggleMenuAvailabilitySchema,
  type CreateMenuInput,
  type UpdateMenuInput,
  type DeleteMenuInput,
  type ToggleMenuAvailabilityInput,
} from "@/lib/validations/menu.schema";

// ── Types ──────────────────────────────────────────────────

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Helpers ────────────────────────────────────────────────

async function getAdminTenantId(): Promise<
  { tenantId: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kamu harus login dulu ya." };
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return { error: "Kamu tidak punya akses untuk ini." };
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return { error: "Akun admin kamu belum terhubung ke stan." };
  }

  return { tenantId };
}

// ── createMenu ─────────────────────────────────────────────

export async function createMenu(
  input: CreateMenuInput
): Promise<ActionResult<{ menuId: string }>> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ("error" in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = CreateMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data menu tidak valid.";
    return { success: false, error: firstError };
  }

  const { name, description, price, category, photoUrl } = parsed.data;

  try {
    const menu = await prisma.menu.create({
      data: {
        tenant_id: tenant.tenantId,
        name,
        description: description || null,
        price,
        category: category || null,
        photo_url: photoUrl || null,
        is_available: true,
      },
      select: { id: true },
    });

    revalidatePath("/admin/menus");
    revalidatePath("/menu");

    return { success: true, data: { menuId: menu.id } };
  } catch (error) {
    console.error("[createMenu]", {
      tenantId: tenant.tenantId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal menambahkan menu. Coba lagi ya.",
    };
  }
}

// ── updateMenu ─────────────────────────────────────────────

export async function updateMenu(
  input: UpdateMenuInput
): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ("error" in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = UpdateMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data menu tidak valid.";
    return { success: false, error: firstError };
  }

  const { menuId, name, description, price, category, photoUrl } = parsed.data;

  try {
    // 3. Verify ownership
    const existing = await prisma.menu.findFirst({
      where: { id: menuId, tenant_id: tenant.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Menu tidak ditemukan." };
    }

    // 4. Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined)
      updateData.description = description || null;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category || null;
    if (photoUrl !== undefined) updateData.photo_url = photoUrl || null;

    await prisma.menu.update({
      where: { id: menuId },
      data: updateData,
    });

    revalidatePath("/admin/menus");
    revalidatePath("/menu");

    return { success: true, data: null };
  } catch (error) {
    console.error("[updateMenu]", {
      tenantId: tenant.tenantId,
      menuId: parsed.data.menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: "Gagal mengubah menu. Coba lagi ya." };
  }
}

// ── deleteMenu ─────────────────────────────────────────────

export async function deleteMenu(
  input: DeleteMenuInput
): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ("error" in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = DeleteMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { menuId } = parsed.data;

  try {
    // 3. Verify ownership
    const existing = await prisma.menu.findFirst({
      where: { id: menuId, tenant_id: tenant.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Menu tidak ditemukan." };
    }

    // 4. Check for active orders referencing this menu
    const activeOrderItems = await prisma.orderItem.count({
      where: {
        menu_id: menuId,
        order: {
          status: { in: ["PENDING", "PREPARING", "READY"] },
        },
      },
    });

    if (activeOrderItems > 0) {
      return {
        success: false,
        error:
          "Menu ini masih ada di pesanan aktif. Nonaktifkan dulu ya, jangan dihapus.",
      };
    }

    await prisma.menu.delete({ where: { id: menuId } });

    revalidatePath("/admin/menus");
    revalidatePath("/menu");

    return { success: true, data: null };
  } catch (error) {
    console.error("[deleteMenu]", {
      tenantId: tenant.tenantId,
      menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: "Gagal menghapus menu. Coba lagi ya." };
  }
}

// ── toggleMenuAvailability ─────────────────────────────────

export async function toggleMenuAvailability(
  input: ToggleMenuAvailabilityInput
): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ("error" in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = ToggleMenuAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Data tidak valid.";
    return { success: false, error: firstError };
  }

  const { menuId, isAvailable } = parsed.data;

  try {
    // 3. Verify ownership
    const existing = await prisma.menu.findFirst({
      where: { id: menuId, tenant_id: tenant.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Menu tidak ditemukan." };
    }

    await prisma.menu.update({
      where: { id: menuId },
      data: { is_available: isAvailable },
    });

    revalidatePath("/admin/menus");
    revalidatePath("/menu");

    return { success: true, data: null };
  } catch (error) {
    console.error("[toggleMenuAvailability]", {
      tenantId: tenant.tenantId,
      menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Gagal mengubah ketersediaan menu. Coba lagi ya.",
    };
  }
}
