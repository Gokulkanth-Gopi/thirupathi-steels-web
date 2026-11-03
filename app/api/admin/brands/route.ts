import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllBrands, createBrand } from '@/lib/db/content';

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

    const brands = await getAllBrands();
    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch brands' },
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
    const { name, category, tagline, description, features, logo, is_active, display_order, id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    if (!category || !['Primary Steel', 'Secondary Steel'].includes(category)) {
      return NextResponse.json(
        { success: false, error: "Category must be 'Primary Steel' or 'Secondary Steel'" },
        { status: 400 }
      );
    }

    const newBrand = await createBrand({
      id: id?.trim() || undefined,
      name: name.trim(),
      category,
      tagline: tagline?.trim() || null,
      description: description?.trim() || null,
      features,
      logo: logo?.trim() || null,
      is_active: is_active !== false,
      display_order: display_order !== undefined ? Number(display_order) : undefined,
    });

    return NextResponse.json({ success: true, data: newBrand });
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create brand' },
      { status: 500 }
    );
  }
}

