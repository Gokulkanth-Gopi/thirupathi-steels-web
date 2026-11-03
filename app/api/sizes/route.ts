import { NextResponse } from 'next/server';
import { getActiveDiameters } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sizes = await getActiveDiameters();
    return NextResponse.json({ success: true, data: sizes });
  } catch (error: any) {
    console.error('Error fetching public sizes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}

