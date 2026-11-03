import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getYardBaysData, createYardBay } from '@/lib/db/stock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const data = await getYardBaysData();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error: any) {
    console.error('Error fetching yard bays data:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve yard bays' },
      { status: 500, headers: NO_CACHE_HEADERS }
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
    const { bayCode, name, section, primaryDiameters, maxCapacityMt, displayOrder, isActive, notes } = body;

    if (!bayCode || !String(bayCode).trim()) {
      return NextResponse.json(
        { success: false, error: 'Bay code/identifier is required (e.g. Bay A-3 or BAY-09).' },
        { status: 400 }
      );
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: 'Bay name or designated usage description is required.' },
        { status: 400 }
      );
    }

    if (!section || !String(section).trim()) {
      return NextResponse.json(
        { success: false, error: 'Yard section classification is required.' },
        { status: 400 }
      );
    }

    const capacity = Number(maxCapacityMt);
    if (isNaN(capacity) || capacity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Maximum capacity must be a positive number in Metric Tonnes (MT).' },
        { status: 400 }
      );
    }

    const newBay = await createYardBay({
      bayCode: String(bayCode).trim(),
      name: String(name).trim(),
      section: String(section).trim(),
      primaryDiameters: primaryDiameters || [],
      maxCapacityMt: capacity,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes: notes ? String(notes).trim() : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: newBay,
        message: `Bay ${newBay.bay_code} created successfully.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating yard bay:', error);
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
      { success: false, error: error?.message || 'Failed to create yard bay' },
      { status: 500 }
    );
  }
}
