import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAdminDatabaseStats } from '@/lib/db/stock';

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

    const stats = await getAdminDatabaseStats();

    return NextResponse.json({
      success: true,
      data: stats,
      currentUser: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin database stats:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve database stats' },
      { status: 500 }
    );
  }
}

