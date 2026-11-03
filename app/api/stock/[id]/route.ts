import { NextRequest, NextResponse } from 'next/server';
import {
  getStockLotById,
  getStockLotMovements,
  adjustStockLotWithLock,
} from '@/lib/db/stock';
import { adjustStockLotSchema } from '@/lib/validations/stock';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stock/[id]
 * Authenticated: Returns full details of a stock lot including movement history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session required' },
        { status: 401 }
      );
    }

    const lot = await getStockLotById(id);
    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'Stock lot not found' },
        { status: 404 }
      );
    }

    const movements = await getStockLotMovements(id);

    return NextResponse.json({
      success: true,
      data: {
        ...lot,
        movements,
      },
    });
  } catch (error: any) {
    console.error('API Error in GET /api/stock/[id]:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stock lot details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/stock/[id]
 * Authenticated: Adjust stock lot quantity with PostgreSQL row-level locking
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Staff session required' },
        { status: 401 }
      );
    }

    // 2. Verify Origin / CSRF
    if (!verifyMutationOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cross-origin mutation request rejected' },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const validation = adjustStockLotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    // 4. Perform transactional adjustment with row lock
    const updatedLot = await adjustStockLotWithLock(id, validation.data, {
      name: user.full_name,
      id: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Stock for lot '${updatedLot.lot_number}' updated to ${updatedLot.quantity_kg} kg`,
      data: updatedLot,
    });
  } catch (error: any) {
    console.error('API Error in PUT /api/stock/[id]:', error?.message || error);
    const isConflict = error?.message?.includes('negative stock') || error?.message?.includes('Overselling');
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to adjust stock lot' },
      { status: isConflict ? 409 : 500 }
    );
  }
}
