import { NextResponse } from 'next/server';
import { getYardBaysData } from '@/lib/db/stock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
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

