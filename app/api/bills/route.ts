import { NextRequest, NextResponse } from 'next/server';
import { getAllBills, createBill } from '@/lib/db/bills';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Confidential commercial data.' },
        { status: 401 }
      );
    }

    const bills = await getAllBills(50);
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('API Error in GET /api/bills:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyMutationOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Cross-origin request rejected' }, { status: 403 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bill_number, bill_date, supplier, image_url, notes, total_amount } = body;

    if (!bill_number || !bill_date || !supplier) {
      return NextResponse.json(
        { success: false, error: 'bill_number, bill_date, and supplier are required' },
        { status: 400 }
      );
    }

    const bill = await createBill({
      bill_number,
      bill_date,
      supplier,
      image_url,
      notes,
      total_amount,
    });

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    console.error('API Error in POST /api/bills:', error);
    return NextResponse.json({ success: false, error: 'Failed to create bill' }, { status: 500 });
  }
}

