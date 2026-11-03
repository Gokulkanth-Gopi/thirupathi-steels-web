import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllDiameters, createDiameter } from '@/lib/db/content';

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

    const sizes = await getAllDiameters();
    return NextResponse.json({ success: true, data: sizes });
  } catch (error: any) {
    console.error('Error fetching diameter sizes:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch sizes' },
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
    const { diameter_mm, weight_kg_per_meter, primary_use, description, image, standard_grades, key_applications, is_active, display_order } = body;

    if (!diameter_mm || isNaN(Number(diameter_mm))) {
      return NextResponse.json(
        { success: false, error: 'Valid diameter (mm) is required' },
        { status: 400 }
      );
    }

    if (!weight_kg_per_meter || isNaN(Number(weight_kg_per_meter))) {
      return NextResponse.json(
        { success: false, error: 'Valid nominal weight (kg/m) is required' },
        { status: 400 }
      );
    }

    const newSize = await createDiameter({
      diameter_mm: Number(diameter_mm),
      weight_kg_per_meter: Number(weight_kg_per_meter),
      primary_use,
      description,
      image: image?.trim() || null,
      standard_grades,
      key_applications,
      is_active: is_active !== false,
      display_order: display_order ? Number(display_order) : undefined,
    });

    return NextResponse.json({ success: true, data: newSize });
  } catch (error: any) {
    console.error('Error creating diameter size:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create size' },
      { status: 500 }
    );
  }
}

