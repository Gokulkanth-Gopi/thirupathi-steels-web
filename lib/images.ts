import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Image processing utilities powered by Sharp
 * Production-ready server-side image handling for stock bills, products, and gallery
 */

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

/**
 * Optimizes an uploaded invoice or product image and saves it to the target directory
 */
export async function optimizeAndSaveImage(
  inputBuffer: Buffer,
  outputFileName: string,
  targetDirectory: string = 'public/uploads',
  options: ProcessImageOptions = {}
): Promise<{ relativePath: string; width: number; height: number; format: string; sizeBytes: number }> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 85, format = 'webp' } = options;

  const resolvedDir = path.isAbsolute(targetDirectory)
    ? targetDirectory
    : path.resolve(process.cwd(), targetDirectory);

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  let pipeline = sharp(inputBuffer).resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality });
  } else if (format === 'avif') {
    pipeline = pipeline.avif({ quality });
  }

  const finalName = `${path.parse(outputFileName).name}.${format}`;
  const finalPath = path.join(resolvedDir, finalName);

  const info = await pipeline.toFile(finalPath);

  // Return public web accessible relative path
  const relativeWebPath = `/${path.relative(path.resolve(process.cwd(), 'public'), finalPath).replace(/\\/g, '/')}`;

  return {
    relativePath: relativeWebPath,
    width: info.width,
    height: info.height,
    format: info.format,
    sizeBytes: info.size,
  };
}

/**
 * Generates an image thumbnail for fast listing previews (e.g., invoice preview in stock table)
 */
export async function createThumbnail(
  inputPath: string,
  outputDir: string = 'public/uploads/thumbnails',
  size: number = 300
): Promise<string> {
  const resolvedInput = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), 'public', inputPath.replace(/^\//, ''));

  const resolvedDir = path.isAbsolute(outputDir)
    ? outputDir
    : path.resolve(process.cwd(), outputDir);

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  const fileName = `thumb_${path.parse(resolvedInput).name}.webp`;
  const outputPath = path.join(resolvedDir, fileName);

  await sharp(resolvedInput)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(outputPath);

  return `/${path.relative(path.resolve(process.cwd(), 'public'), outputPath).replace(/\\/g, '/')}`;
}

/**
 * Inspect image metadata safely
 */
export async function getImageMetadata(inputBuffer: Buffer) {
  const metadata = await sharp(inputBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
  };
}
