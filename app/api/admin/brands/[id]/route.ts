import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getBrandById, updateBrand, deleteBrand } from '@/lib/db/content';

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
    const brand = await getBrandById(id);
    if (!brand) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: brand });
  } catch (error: any) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch brand' },
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

    const updated = await updateBrand(id, {
      name: body.name?.trim(),
      category: body.category,
      tagline: body.tagline,
      description: body.description,
      features: body.features,
      logo: body.logo,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      display_order: body.display_order !== undefined ? Number(body.display_order) : undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update brand' },
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
    await deleteBrand(id);

    return NextResponse.json({ success: true, message: `Brand ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete brand' },
      { status: 400 }
    );
  }
}

