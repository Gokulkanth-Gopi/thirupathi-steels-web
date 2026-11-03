import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { DocumentType } from '@/db/schema';

// Private storage directory outside public/
export const PRIVATE_STORAGE_DIR =
  process.env.DOCUMENT_STORAGE_DIR ||
  path.resolve(process.cwd(), 'private_uploads/documents');

// Ensure directory exists
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: AllowedMimeType;
  extension?: string;
}

/**
 * Validates file buffer magic bytes against trusted signatures
 */
export function validateMagicBytes(buffer: Buffer): FileValidationResult {
  if (buffer.length < 8) {
    return { isValid: false, error: 'File buffer too small to determine signature' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMimeType: 'image/jpeg', extension: '.jpg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMimeType: 'image/png', extension: '.png' };
  }

  // 3. WebP: RIFF ... WEBP (0-3: 52 49 46 46, 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMimeType: 'image/webp', extension: '.webp' };
  }

  // 4. PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { isValid: true, detectedMimeType: 'application/pdf', extension: '.pdf' };
  }

  return {
    isValid: false,
    error: 'Unsupported file format or invalid magic bytes signature. Allowed: JPEG, PNG, WebP, PDF.',
  };
}

/**
 * Generates an unguessable safe server filename, rejecting path traversal
 */
export function generateSafeStorageFilename(extension: string): string {
  const safeExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  const uuid = crypto.randomUUID();
  return `doc_${uuid}${safeExt}`;
}

/**
 * Calculate SHA-256 hash of buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export interface ProcessedDocumentResult {
  storageFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHashSha256: string;
}

/**
 * Securely processes and stores an uploaded document:
 * - Images are processed via Sharp (EXIF stripped, auto-rotated, max 2400x2400, re-encoded).
 * - PDFs bypass Sharp and are stored directly after magic byte verification.
 */
export async function processAndStoreDocument(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<ProcessedDocumentResult> {
  // 1. Size check
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`
    );
  }

  // 2. Validate Magic Bytes Signature
  const signature = validateMagicBytes(fileBuffer);
  if (!signature.isValid || !signature.detectedMimeType || !signature.extension) {
    throw new Error(signature.error || 'Invalid file signature');
  }

  let finalBuffer: Buffer;
  let finalMimeType: string = signature.detectedMimeType;
  let finalExtension: string = signature.extension;

  // 3. Process Images using Sharp
  if (signature.detectedMimeType !== 'application/pdf') {
    try {
      const pipeline = sharp(fileBuffer, { failOnError: true })
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(2400, 2400, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      if (signature.detectedMimeType === 'image/webp') {
        finalBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
        finalMimeType = 'image/webp';
        finalExtension = '.webp';
      } else if (signature.detectedMimeType === 'image/png') {
        finalBuffer = await pipeline.png({ compressionLevel: 8 }).toBuffer();
        finalMimeType = 'image/png';
        finalExtension = '.png';
      } else {
        // Default JPEG
        finalBuffer = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
        finalMimeType = 'image/jpeg';
        finalExtension = '.jpg';
      }
    } catch (sharpErr: any) {
      throw new Error(`Image processing failed: ${sharpErr?.message || 'Corrupted image file'}`);
    }
  } else {
    // 4. PDF Safe Path (Bypasses Sharp)
    finalBuffer = fileBuffer;
    finalMimeType = 'application/pdf';
    finalExtension = '.pdf';
  }

  // 5. Generate Safe Storage Filename and Write to Private Directory
  const storageFilename = generateSafeStorageFilename(finalExtension);
  const storagePath = path.join(PRIVATE_STORAGE_DIR, storageFilename);

  // Prevent directory traversal
  const resolvedPath = path.resolve(storagePath);
  if (!resolvedPath.startsWith(path.resolve(PRIVATE_STORAGE_DIR))) {
    throw new Error('Path traversal attempt detected');
  }

  fs.writeFileSync(resolvedPath, finalBuffer);

  const fileHash = calculateSha256(finalBuffer);

  return {
    storageFilename,
    storagePath: resolvedPath,
    mimeType: finalMimeType,
    fileSizeBytes: finalBuffer.length,
    fileHashSha256: fileHash,
  };
}

/**
 * Safely removes a file from private storage
 */
export function removeStoredFile(storagePath: string): boolean {
  try {
    const resolved = path.resolve(storagePath);
    if (!resolved.startsWith(path.resolve(PRIVATE_STORAGE_DIR))) {
      console.warn('Attempted to delete file outside private storage dir:', storagePath);
      return false;
    }
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to unlink stored document:', err);
    return false;
  }
}
