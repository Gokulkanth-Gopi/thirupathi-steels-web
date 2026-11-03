import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';
import { getYardSettings, updateYardSettings } from '@/lib/db/settings';

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

    const settings = await getYardSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      currentUser: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error retrieving yard settings:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve yard settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff session required.' },
        { status: 401 }
      );
    }

    if (!verifyMutationOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Cross-origin mutation request rejected.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation
    const updates: any = {};

    if (body.yard_name !== undefined) {
      if (!String(body.yard_name).trim()) {
        return NextResponse.json({ success: false, error: 'Yard name cannot be empty.' }, { status: 400 });
      }
      updates.yard_name = String(body.yard_name).trim();
    }

    if (body.yard_location !== undefined) {
      if (!String(body.yard_location).trim()) {
        return NextResponse.json({ success: false, error: 'Yard physical location cannot be empty.' }, { status: 400 });
      }
      updates.yard_location = String(body.yard_location).trim();
    }

    if (body.phone_primary !== undefined) {
      if (!String(body.phone_primary).trim()) {
        return NextResponse.json({ success: false, error: 'Primary phone cannot be empty.' }, { status: 400 });
      }
      updates.phone_primary = String(body.phone_primary).trim();
    }

    if (body.phone_secondary !== undefined) {
      updates.phone_secondary = String(body.phone_secondary).trim();
    }

    if (body.whatsapp_number !== undefined) {
      updates.whatsapp_number = String(body.whatsapp_number).trim();
    }

    if (body.gstin !== undefined) {
      if (!String(body.gstin).trim()) {
        return NextResponse.json({ success: false, error: 'GSTIN cannot be empty.' }, { status: 400 });
      }
      updates.gstin = String(body.gstin).trim().toUpperCase();
    }

    if (body.operating_hours !== undefined) {
      updates.operating_hours = String(body.operating_hours).trim();
    }

    if (body.low_stock_threshold_kg !== undefined) {
      const num = Number(body.low_stock_threshold_kg);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json(
          { success: false, error: 'Low stock threshold must be a positive number in kg.' },
          { status: 400 }
        );
      }
      updates.low_stock_threshold_kg = num;
    }

    if (body.weighbridge_gate !== undefined) {
      updates.weighbridge_gate = String(body.weighbridge_gate).trim();
    }

    if (body.weighbridge_status !== undefined) {
      updates.weighbridge_status = String(body.weighbridge_status).trim();
    }

    if (body.dispatch_notes !== undefined) {
      updates.dispatch_notes = String(body.dispatch_notes).trim();
    }

    const updatedSettings = await updateYardSettings(updates);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Yard operational settings updated successfully in PostgreSQL.',
    });
  } catch (error: any) {
    console.error('Error updating yard settings:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update yard settings' },
      { status: 500 }
    );
  }
}
