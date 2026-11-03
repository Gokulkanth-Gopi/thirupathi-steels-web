import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';
import { getAdminBills, createInwardBillWithStockMovement } from '@/lib/db/bills';
import { createInwardBillSchema } from '@/lib/validations/bills';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const supplier = searchParams.get('supplier') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const result = await getAdminBills({
      search,
      supplier,
      paymentStatus,
      startDate,
      endDate,
      includeArchived,
    });

    return NextResponse.json({
      success: true,
      data: result.bills,
      metrics: result.metrics,
    });
  } catch (err: any) {
    console.error('Error fetching admin bills:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyMutationOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createInwardBillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const createdBill = await createInwardBillWithStockMovement(
      {
        billNumber: data.billNumber,
        billDate: data.billDate,
        supplier: data.supplier,
        vehicleNo: data.vehicleNo,
        brandId: data.brandId,
        diameterMm: data.diameterMm,
        grade: data.grade,
        quantityKg: data.quantityKg,
        ratePerKg: data.ratePerKg,
        taxRatePercent: data.taxRatePercent,
        paymentStatus: data.paymentStatus,
        location: data.location,
        bayNumber: data.bayNumber,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
      },
      { name: user.full_name, id: user.id }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Inward bill and stock lot created successfully',
        data: createdBill,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error creating inward bill:', err);
    const isClientError =
      err.message?.includes('already exists') ||
      err.message?.includes('rejected') ||
      err.message?.includes('not found');

    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create inward bill' },
      { status: isClientError ? 400 : 500 }
    );
  }
}
