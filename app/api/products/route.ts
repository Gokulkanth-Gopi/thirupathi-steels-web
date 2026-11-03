import { NextRequest, NextResponse } from 'next/server';
import { getActiveProducts } from '@/lib/db/products';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;

    const products = await getActiveProducts({ category, brand });
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('API Error in GET /api/products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
