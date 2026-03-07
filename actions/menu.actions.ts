'use server';

import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  CreateMenuSchema,
  UpdateMenuSchema,
  DeleteMenuSchema,
  ToggleMenuAvailabilitySchema,
  type CreateMenuInput,
  type UpdateMenuInput,
  type DeleteMenuInput,
  type ToggleMenuAvailabilityInput,
} from '@/lib/validations/menu.schema';
import { validateUploadedFile } from '@/lib/utils/secure-upload';

// ── Types ──────────────────────────────────────────────────

type ActionResult<T = null> = { success: true; data: T } | { success: false; error: string };

type UploadResult = { success: true; data: { photoUrl: string } } | { success: false; error: string };

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

async function compressMenuImage(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();

  const originalWidth = metadata.width ?? 1920;
  let targetWidth = Math.min(originalWidth, 1920);
  let quality = 88;

  let output = await image
    .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer();

  for (let i = 0; i < 7 && output.length > MAX_OUTPUT_BYTES; i += 1) {
    quality = Math.max(60, quality - 6);
    targetWidth = Math.max(720, Math.floor(targetWidth * 0.88));

    output = await sharp(inputBuffer, { failOn: 'none' })
      .rotate()
      .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
  }

  if (output.length > MAX_OUTPUT_BYTES) {
    throw new Error('Compressed image still exceeds max output size');
  }

  return output;
}

// ── File helpers ───────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'menus');

function isLocalUpload(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/uploads/menus/');
}

async function deleteLocalFile(photoUrl: string): Promise<void> {
  try {
    const fileName = photoUrl.replace('/uploads/menus/', '');
    if (!fileName || fileName.includes('..') || fileName.includes('/')) return;
    const filePath = path.join(UPLOADS_DIR, fileName);
    await unlink(filePath);
  } catch {
    // File may already be gone — ignore
  }
}

// ── Helpers ────────────────────────────────────────────────

async function getAdminTenantId(): Promise<{ tenantId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Kamu harus login dulu ya.' };
  }

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return { error: 'Kamu tidak punya akses untuk ini.' };
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return { error: 'Akun admin kamu belum terhubung ke stan.' };
  }

  return { tenantId };
}

// ── createMenu ─────────────────────────────────────────────

export async function createMenu(input: CreateMenuInput): Promise<ActionResult<{ menuId: string }>> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = CreateMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data menu tidak valid.';
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

    revalidatePath('/admin/menus');
    revalidatePath('/menu');

    return { success: true, data: { menuId: menu.id } };
  } catch (error) {
    console.error('[createMenu]', {
      tenantId: tenant.tenantId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: 'Gagal menambahkan menu. Coba lagi ya.',
    };
  }
}

// ── uploadMenuPhoto ────────────────────────────────────────

export async function uploadMenuPhoto(formData: FormData): Promise<UploadResult> {
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'File foto tidak valid.' };
  }

  // Secure upload validation (MIME, extension, size, dangerous file check)
  const validation = validateUploadedFile(file, {
    maxSize: MAX_INPUT_BYTES, // 15MB pre-compression limit
  });
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const extension = 'webp';
    const fileName = `menu-${Date.now()}-${randomUUID()}.${extension}`;
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'menus');
    const targetPath = path.join(targetDir, fileName);

    await mkdir(targetDir, { recursive: true });

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const compressedBuffer = await compressMenuImage(inputBuffer);
    await writeFile(targetPath, compressedBuffer);

    return {
      success: true,
      data: { photoUrl: `/uploads/menus/${fileName}` },
    };
  } catch (error) {
    console.error('[uploadMenuPhoto]', {
      tenantId: tenant.tenantId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Upload foto gagal. Coba ulang lagi ya.',
    };
  }
}

// ── updateMenu ─────────────────────────────────────────────

export async function updateMenu(input: UpdateMenuInput): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = UpdateMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data menu tidak valid.';
    return { success: false, error: firstError };
  }

  const { menuId, name, description, price, category, photoUrl } = parsed.data;

  try {
    // 3. Verify ownership + get current photo
    const existing = await prisma.menu.findFirst({
      where: { id: menuId, tenant_id: tenant.tenantId },
      select: { id: true, photo_url: true },
    });

    if (!existing) {
      return { success: false, error: 'Menu tidak ditemukan.' };
    }

    // 4. Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category || null;
    if (photoUrl !== undefined) updateData.photo_url = photoUrl || null;

    await prisma.menu.update({
      where: { id: menuId },
      data: updateData,
    });

    // 5. Delete old local photo if replaced by a different one
    if (photoUrl !== undefined && existing.photo_url !== photoUrl && isLocalUpload(existing.photo_url)) {
      await deleteLocalFile(existing.photo_url!);
    }

    revalidatePath('/admin/menus');
    revalidatePath('/menu');

    return { success: true, data: null };
  } catch (error) {
    console.error('[updateMenu]', {
      tenantId: tenant.tenantId,
      menuId: parsed.data.menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Gagal mengubah menu. Coba lagi ya.' };
  }
}

// ── deleteMenu ─────────────────────────────────────────────

export async function deleteMenu(input: DeleteMenuInput): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = DeleteMenuSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid.';
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
      return { success: false, error: 'Menu tidak ditemukan.' };
    }

    // 4. Check for active orders referencing this menu
    const activeOrderItems = await prisma.orderItem.count({
      where: {
        menu_id: menuId,
        order: {
          status: { in: ['PENDING', 'PREPARING', 'READY'] },
        },
      },
    });

    if (activeOrderItems > 0) {
      return {
        success: false,
        error: 'Menu ini masih ada di pesanan aktif. Nonaktifkan dulu ya, jangan dihapus.',
      };
    }

    // Grab photo_url before deleting so we can clean up the file
    const menuToDelete = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { photo_url: true },
    });

    await prisma.menu.delete({ where: { id: menuId } });

    // Delete local photo file
    if (isLocalUpload(menuToDelete?.photo_url)) {
      await deleteLocalFile(menuToDelete!.photo_url!);
    }

    revalidatePath('/admin/menus');
    revalidatePath('/menu');

    return { success: true, data: null };
  } catch (error) {
    console.error('[deleteMenu]', {
      tenantId: tenant.tenantId,
      menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Gagal menghapus menu. Coba lagi ya.' };
  }
}

// ── toggleMenuAvailability ─────────────────────────────────

export async function toggleMenuAvailability(input: ToggleMenuAvailabilityInput): Promise<ActionResult> {
  // 1. Auth + tenant check
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  // 2. Zod validation
  const parsed = ToggleMenuAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid.';
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
      return { success: false, error: 'Menu tidak ditemukan.' };
    }

    await prisma.menu.update({
      where: { id: menuId },
      data: { is_available: isAvailable },
    });

    revalidatePath('/admin/menus');
    revalidatePath('/menu');

    return { success: true, data: null };
  } catch (error) {
    console.error('[toggleMenuAvailability]', {
      tenantId: tenant.tenantId,
      menuId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: 'Gagal mengubah ketersediaan menu. Coba lagi ya.',
    };
  }
}

// ── cleanupOrphanedUploads ─────────────────────────────────
// Deletes uploaded photos older than `maxAgeMs` that aren't referenced by any menu.
// Called on a best-effort basis (e.g. cron, admin action, or on page load).

const ORPHAN_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function cleanupOrphanedUploads(): Promise<ActionResult<{ deleted: number }>> {
  const tenant = await getAdminTenantId();
  if ('error' in tenant) return { success: false, error: tenant.error };

  try {
    // 1. Get all local photo URLs currently used by menus
    const usedMenus = await prisma.menu.findMany({
      where: {
        photo_url: { not: null },
        tenant_id: tenant.tenantId,
      },
      select: { photo_url: true },
    });

    const usedFileNames = new Set(
      usedMenus.map((m) => m.photo_url?.replace('/uploads/menus/', '') ?? '').filter(Boolean),
    );

    // 2. List all files on disk
    let files: string[];
    try {
      files = await readdir(UPLOADS_DIR);
    } catch {
      return { success: true, data: { deleted: 0 } };
    }

    const now = Date.now();
    let deleted = 0;

    for (const file of files) {
      if (usedFileNames.has(file)) continue; // still referenced

      const filePath = path.join(UPLOADS_DIR, file);
      try {
        const fileStat = await stat(filePath);
        const age = now - fileStat.mtimeMs;
        if (age < ORPHAN_MAX_AGE_MS) continue; // too fresh, user might still save

        await unlink(filePath);
        deleted += 1;
      } catch {
        // skip inaccessible files
      }
    }

    return { success: true, data: { deleted } };
  } catch (error) {
    console.error('[cleanupOrphanedUploads]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Cleanup gagal.' };
  }
}
