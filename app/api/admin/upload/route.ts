import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetFolder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data' },
        { status: 400 }
      );
    }

    // Validate mime type
    const mimeType = file.type.toLowerCase();
    const originalName = file.name || 'image.png';
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format: ${mimeType || ext}. Allowed: JPG, PNG, WebP, SVG, GIF, AVIF.`,
        },
        { status: 400 }
      );
    }

    // Restrict folder to safe alphanumerics
    const safeFolder = targetFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate clean unique filename
    const safeBaseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const uniqueHash = crypto.randomBytes(4).toString('hex');
    const finalFilename = `${safeBaseName}-${Date.now().toString(36)}-${uniqueHash}${ext || '.png'}`;
    const filePath = path.join(uploadDir, finalFilename);

    // Write file buffer to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
      size: buffer.length,
      mimeType,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'File upload failed' },
      { status: 500 }
    );
  }
}

