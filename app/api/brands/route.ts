import { NextResponse } from 'next/server';
import { getActiveBrands } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brands = await getActiveBrands();
    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    console.error('Error fetching public brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

