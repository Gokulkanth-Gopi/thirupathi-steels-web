import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDiameterById, updateDiameter, deleteDiameter } from '@/lib/db/content';

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
    const size = await getDiameterById(id);
    if (!size) {
      return NextResponse.json({ success: false, error: 'Size not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: size });
  } catch (error: any) {
    console.error('Error fetching size:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch size' },
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

    const updated = await updateDiameter(id, {
      diameter_mm: body.diameter_mm !== undefined ? Number(body.diameter_mm) : undefined,
      weight_kg_per_meter: body.weight_kg_per_meter !== undefined ? Number(body.weight_kg_per_meter) : undefined,
      primary_use: body.primary_use,
      description: body.description,
      image: body.image !== undefined ? (body.image ? String(body.image).trim() : null) : undefined,
      standard_grades: body.standard_grades,
      key_applications: body.key_applications,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      display_order: body.display_order !== undefined ? Number(body.display_order) : undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating size:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update size' },
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
    await deleteDiameter(id);

    return NextResponse.json({ success: true, message: `Size ${id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting size:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete size' },
      { status: 400 }
    );
  }
}

