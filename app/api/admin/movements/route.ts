import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAllStockMovements } from '@/lib/db/stock';

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const lotId = searchParams.get('lotId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const data = await getAllStockMovements({
      search,
      type,
      lotId,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: data.movements,
      totalCount: data.totalCount,
    });
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve stock movements' },
      { status: 500 }
    );
  }
}

