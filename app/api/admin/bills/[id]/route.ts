import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';
import { getAdminBillById, updateBillMetadata } from '@/lib/db/bills';
import { updateBillMetadataSchema } from '@/lib/validations/bills';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const bill = await getAdminBillById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: `Bill with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (err: any) {
    console.error('Error retrieving bill:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve bill' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validation = updateBillMetadataSchema.safeParse(body);

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

    const updatedBill = await updateBillMetadata(
      id,
      validation.data,
      { name: user.full_name, id: user.id }
    );

    if (!updatedBill) {
      return NextResponse.json(
        { success: false, error: `Bill with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bill metadata updated successfully',
      data: updatedBill,
    });
  } catch (err: any) {
    console.error('Error updating bill:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}
