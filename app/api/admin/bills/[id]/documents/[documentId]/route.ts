import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';
import { getAdminBillById, deleteDocumentFromBill } from '@/lib/db/bills';
import { query } from '@/lib/db';
import { BillDocument } from '@/db/schema';
import { removeStoredFile } from '@/lib/documents/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required to view confidential documents.' },
        { status: 401 }
      );
    }

    const { id: billId, documentId } = await params;

    // Verify bill exists
    const bill = await getAdminBillById(billId);
    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Query document ensuring it belongs strictly to this bill
    const docs = await query<BillDocument>(
      'SELECT * FROM bill_documents WHERE id = ? AND bill_id = ? AND is_active = TRUE LIMIT 1',
      [documentId, billId]
    );

    if (docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found or does not belong to this bill' },
        { status: 404 }
      );
    }

    const doc = docs[0];

    // Check file existence on private storage
    if (!fs.existsSync(doc.storage_path)) {
      console.error(`File missing from disk at path: ${doc.storage_path}`);
      return NextResponse.json(
        { success: false, error: 'Stored document file not found on disk' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(doc.storage_path);

    // Sanitize filename for Content-Disposition header
    const safeOriginalName = doc.original_filename.replace(/["\r\n]/g, '_');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${safeOriginalName}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('Error serving private document:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
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

    const { id: billId, documentId } = await params;
    const removedDoc = await deleteDocumentFromBill(billId, documentId);

    if (!removedDoc) {
      return NextResponse.json(
        { success: false, error: 'Document not found or does not belong to this bill' },
        { status: 404 }
      );
    }

    // Optionally unlink file from disk
    removeStoredFile(removedDoc.storage_path);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      data: { id: documentId },
    });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
