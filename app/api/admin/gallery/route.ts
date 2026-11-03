import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllGalleryImages, createGalleryImage } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const images = await getAllGalleryImages();
    return NextResponse.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, category, image_url, description, display_order, is_active } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Image title is required' },
        { status: 400 }
      );
    }

    if (!image_url || !image_url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Image URL or uploaded file is required' },
        { status: 400 }
      );
    }

    const newImage = await createGalleryImage({
      title: title.trim(),
      category: category?.trim() || 'Yard Infrastructure',
      image_url: image_url.trim(),
      description: description?.trim() || null,
      display_order: display_order !== undefined ? Number(display_order) : undefined,
      is_active: is_active !== false,
    });

    return NextResponse.json({ success: true, data: newImage });
  } catch (error: any) {
    console.error('Error creating gallery image:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create gallery image' },
      { status: 500 }
    );
  }
}

