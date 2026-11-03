import { NextResponse } from 'next/server';
import { getYardBaysData } from '@/lib/db/stock';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getYardBaysData();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching yard bays data:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve yard bays' },
      { status: 500 }
    );
  }
}
