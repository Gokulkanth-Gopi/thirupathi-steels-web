import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getYardBayById, updateYardBay, deleteYardBay } from '@/lib/db/stock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { id } = await params;
    const bay = await getYardBayById(id);

    if (!bay) {
      return NextResponse.json(
        { success: false, error: 'Yard bay not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: bay,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error retrieving yard bay:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve yard bay' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const updatePayload: any = {};

    if (body.bayCode !== undefined) {
      if (!String(body.bayCode).trim()) {
        return NextResponse.json(
          { success: false, error: 'Bay code cannot be empty.' },
          { status: 400 }
        );
      }
      updatePayload.bayCode = String(body.bayCode).trim();
    }

    if (body.name !== undefined) {
      if (!String(body.name).trim()) {
        return NextResponse.json(
          { success: false, error: 'Bay name cannot be empty.' },
          { status: 400 }
        );
      }
      updatePayload.name = String(body.name).trim();
    }

    if (body.section !== undefined) {
      if (!String(body.section).trim()) {
        return NextResponse.json(
          { success: false, error: 'Yard section cannot be empty.' },
          { status: 400 }
        );
      }
      updatePayload.section = String(body.section).trim();
    }

    if (body.maxCapacityMt !== undefined) {
      const cap = Number(body.maxCapacityMt);
      if (isNaN(cap) || cap <= 0) {
        return NextResponse.json(
          { success: false, error: 'Maximum capacity must be a positive number in Metric Tonnes (MT).' },
          { status: 400 }
        );
      }
      updatePayload.maxCapacityMt = cap;
    }

    if (body.primaryDiameters !== undefined) {
      updatePayload.primaryDiameters = body.primaryDiameters;
    }

    if (body.displayOrder !== undefined) {
      updatePayload.displayOrder = Number(body.displayOrder);
    }

    if (body.isActive !== undefined) {
      updatePayload.isActive = Boolean(body.isActive);
    }

    if (body.notes !== undefined) {
      updatePayload.notes = body.notes ? String(body.notes).trim() : null;
    }

    const updated = await updateYardBay(id, updatePayload);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Bay ${updated.bay_code} updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error updating yard bay:', error);
    if (
      error?.message?.includes('duplicate key') ||
      error?.message?.includes('UNIQUE constraint') ||
      error?.code === '23505'
    ) {
      return NextResponse.json(
        { success: false, error: 'A yard bay with this code already exists. Please choose a unique bay code.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update yard bay' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { id } = await params;
    const result = await deleteYardBay(id);

    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error deleting yard bay:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete yard bay' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }
}

