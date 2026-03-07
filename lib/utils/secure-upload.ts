/**
 * Secure file upload validation utility.
 *
 * Validates: MIME type, file extension, max file size.
 * Rejects dangerous file types (.exe, .php, .sh, etc.).
 */

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.php',
  '.sh',
  '.bat',
  '.cmd',
  '.ps1',
  '.msi',
  '.dll',
  '.com',
  '.vbs',
  '.js',
  '.jar',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
  '.asp',
  '.aspx',
  '.jsp',
  '.svg', // SVG can contain scripts
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

type ValidateFileResult =
  | {
      valid: true;
      mimeType: string;
      extension: string;
      size: number;
    }
  | {
      valid: false;
      error: string;
    };

/**
 * Validate an uploaded file for security.
 *
 * @param file - The File object from FormData
 * @param options - Optional overrides for max size and allowed types
 */
export function validateUploadedFile(
  file: File,
  options?: {
    maxSize?: number;
    allowedMimeTypes?: Set<string>;
    allowedExtensions?: Set<string>;
  },
): ValidateFileResult {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
  const allowedMime = options?.allowedMimeTypes ?? ALLOWED_MIME_TYPES;
  const allowedExt = options?.allowedExtensions ?? ALLOWED_EXTENSIONS;

  // 1. Check if it's actually a File
  if (!(file instanceof File)) {
    return { valid: false, error: 'File tidak valid.' };
  }

  // 2. Check file size
  if (file.size === 0) {
    return { valid: false, error: 'File kosong.' };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxMB}MB ya.`,
    };
  }

  // 3. Extract and validate extension
  const fileName = file.name.toLowerCase();
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot >= 0 ? fileName.slice(lastDot) : '';

  if (DANGEROUS_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: 'Tipe file berbahaya. Upload gambar JPG, PNG, atau WEBP ya.',
    };
  }

  if (!allowedExt.has(extension)) {
    return {
      valid: false,
      error: 'Format file belum didukung. Pakai JPG, PNG, atau WEBP ya.',
    };
  }

  // 4. Validate MIME type
  if (!allowedMime.has(file.type)) {
    return {
      valid: false,
      error: 'Format foto belum didukung. Pakai JPG, PNG, atau WEBP ya.',
    };
  }

  // 5. Double-check: MIME must match extension
  const mimeExtMap: Record<string, readonly string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };

  const validExtsForMime = mimeExtMap[file.type];
  if (validExtsForMime && !validExtsForMime.includes(extension)) {
    return {
      valid: false,
      error: 'Ekstensi file tidak sesuai dengan tipe file. Coba upload ulang ya.',
    };
  }

  return {
    valid: true,
    mimeType: file.type,
    extension,
    size: file.size,
  };
}
