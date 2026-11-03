import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getYardBaysData } from '@/lib/db/stock';

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

