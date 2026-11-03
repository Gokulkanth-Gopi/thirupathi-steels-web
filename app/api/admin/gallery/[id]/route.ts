import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getGalleryImageById, updateGalleryImage, deleteGalleryImage } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const img = await getGalleryImageById(id);
    if (!img) {
      return NextResponse.json({ success: false, error: 'Gallery image not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: img });
  } catch (error: any) {
    console.error('Error fetching gallery image:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch gallery image' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateGalleryImage(id, {
      title: body.title?.trim(),
      category: body.category?.trim(),
      image_url: body.image_url?.trim(),
      description: body.description,
      display_order: body.display_order !== undefined ? Number(body.display_order) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update gallery image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteGalleryImage(id);

    return NextResponse.json({ success: true, message: `Gallery image ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete gallery image' },
      { status: 500 }
    );
  }
}

