import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyMutationOrigin } from '@/lib/auth';
import { getAdminBillById, attachDocumentToBill } from '@/lib/db/bills';
import { processAndStoreDocument, removeStoredFile } from '@/lib/documents/storage';
import { DocumentType } from '@/db/schema';
import { DOCUMENT_TYPES } from '@/lib/validations/bills';

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
      data: bill.documents || [],
    });
  } catch (err: any) {
    console.error('Error fetching bill documents:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let savedStoragePath: string | null = null;

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

    const { id: billId } = await params;
    const bill = await getAdminBillById(billId);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: `Bill with ID '${billId}' not found` },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'supplier_invoice';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!DOCUMENT_TYPES.includes(documentType as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid document type. Allowed types: ${DOCUMENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Secure processing: Sharp for images (EXIF strip + re-encode), direct path for PDFs
    const processed = await processAndStoreDocument(buffer, file.name);
    savedStoragePath = processed.storagePath;

    // Save metadata in PostgreSQL
    const docRecord = await attachDocumentToBill(
      billId,
      {
        documentType: documentType as DocumentType,
        originalFilename: file.name,
        storageFilename: processed.storageFilename,
        storagePath: processed.storagePath,
        mimeType: processed.mimeType,
        fileSizeBytes: processed.fileSizeBytes,
        fileHashSha256: processed.fileHashSha256,
      },
      { name: user.full_name, id: user.id }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded and attached successfully',
        data: docRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Document upload error:', err);
    // Cleanup orphaned file if DB insertion failed
    if (savedStoragePath) {
      removeStoredFile(savedStoragePath);
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to upload document' },
      { status: 400 }
    );
  }
}
