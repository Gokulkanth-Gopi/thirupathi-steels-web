import { NextResponse } from 'next/server';
import { getActiveGalleryImages } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const images = await getActiveGalleryImages();
    return NextResponse.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Error fetching public gallery images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

