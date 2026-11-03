import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicStockLots,
  getPublicStockSummaryMetrics,
  createStockLotWithMovement,
} from '@/lib/db/stock';
import { publicStockQuerySchema, createStockLotSchema } from '@/lib/validations/stock';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stock
 * Public inventory endpoint:
 * Strictly exposes customer-facing stock data (lots, brands, diameters, quantities in kg & MT, status).
 * Excludes all supplier bills, purchase costs, and private weighment tickets.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryValidation = publicStockQuerySchema.safeParse({
      brand: searchParams.get('brand') || undefined,
      diameter: searchParams.get('diameter') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: queryValidation.error.format() },
        { status: 400 }
      );
    }

    const { brand, diameter, status, search } = queryValidation.data;

    const [items, metrics] = await Promise.all([
      getPublicStockLots({
        brand,
        diameter,
        status,
        search,
      }),
      getPublicStockSummaryMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
      data: items,
    });
  } catch (error: any) {
    console.error('API Error in GET /api/stock:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live stock data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stock
 * Authenticated stock lot creation endpoint:
 * Requires server-side session authentication (admin or yard_manager).
 * Protected against CSRF and cross-origin attacks.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid staff session required for inventory entry' },
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

    // 3. Parse & Validate input
    const body = await request.json();
    const validation = createStockLotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    // 4. Create stock lot with atomic movement audit record
    const createdLot = await createStockLotWithMovement(validation.data, {
      name: user.full_name,
      id: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Stock lot '${createdLot.lot_number}' created successfully`,
        data: createdLot,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error in POST /api/stock:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create stock lot' },
      { status: 500 }
    );
  }
}
