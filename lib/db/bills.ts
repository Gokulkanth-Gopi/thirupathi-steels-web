import { query, execute, withTransaction } from './index';
import {
  Bill,
  BillWithDetails,
  BillDocument,
  DocumentType,
  StockLot,
  StockMovement,
} from '@/db/schema';
import { calculateStockStatus } from './stock';
import crypto from 'crypto';

/**
 * Exact Financial Calculations (Rounds to nearest cent/paise)
 */
export function calculateFinancials(
  quantityKg: number,
  ratePerKg: number,
  taxRatePercent: number = 18.0
): {
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = Math.round(quantityKg * ratePerKg * 100) / 100;
  const tax = Math.round(subtotal * (taxRatePercent / 100.0) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: total,
  };
}

export interface InwardBillCreationInput {
  billNumber: string;
  billDate: string;
  supplier: string;
  vehicleNo?: string | null;
  brandId: string;
  diameterMm: number;
  grade?: string;
  quantityKg: number;
  ratePerKg: number;
  taxRatePercent?: number;
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid';
  location?: string;
  bayNumber?: string | null;
  notes?: string | null;
  idempotencyKey?: string | null;
  initialDocuments?: Array<{
    documentType: DocumentType;
    originalFilename: string;
    storageFilename: string;
    storagePath: string;
    mimeType: string;
    fileSizeBytes: number;
    fileHashSha256: string;
  }>;
}

/**
 * Transactionally creates an Inward Bill, associated Stock Lot, Stock Movement,
 * and optional initial Document records.
 * Atomic: Fails completely if any validation, constraint, or query fails.
 */
export async function createInwardBillWithStockMovement(
  input: InwardBillCreationInput,
  actor: { name: string; id?: string }
): Promise<BillWithDetails> {
  return withTransaction(async ({ query: txQuery, execute: txExec }) => {
    // 1. Check for Duplicate Bill Number
    const existingBill = await txQuery<{ id: string }>(
      'SELECT id FROM bills WHERE bill_number = ? LIMIT 1',
      [input.billNumber]
    );
    if (existingBill.length > 0) {
      throw new Error(`Bill/Invoice number '${input.billNumber}' already exists.`);
    }

    // 2. Check Idempotency Key if provided
    if (input.idempotencyKey) {
      const existingKey = await txQuery<{ lot_id: string }>(
        'SELECT lot_id FROM stock_movements WHERE idempotency_key = ? LIMIT 1',
        [input.idempotencyKey]
      );
      if (existingKey.length > 0) {
        throw new Error(`Duplicate submission with idempotency key '${input.idempotencyKey}' rejected.`);
      }
    }

    // 3. Resolve Brand and Diameter
    const brandRows = await txQuery<{ id: string; name: string }>(
      'SELECT id, name FROM brands WHERE id = ? OR name ILIKE ? LIMIT 1',
      [input.brandId.toLowerCase(), input.brandId]
    );
    if (brandRows.length === 0) {
      throw new Error(`Approved brand '${input.brandId}' not found.`);
    }
    const resolvedBrand = brandRows[0];

    const diameterRows = await txQuery<{ id: string; diameter_mm: number }>(
      'SELECT id, diameter_mm FROM diameters WHERE diameter_mm = ? LIMIT 1',
      [input.diameterMm]
    );
    if (diameterRows.length === 0) {
      throw new Error(`Supported diameter '${input.diameterMm} mm' not found.`);
    }
    const resolvedDiameter = diameterRows[0];

    // 4. Financial Calculations
    const taxRate = input.taxRatePercent !== undefined ? input.taxRatePercent : 18.0;
    const { subtotalAmount, taxAmount, totalAmount } = calculateFinancials(
      input.quantityKg,
      input.ratePerKg,
      taxRate
    );

    const now = new Date().toISOString();
    const lotId = `lot_${crypto.randomUUID()}`;
    const timestampStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const lotNumber = `TS-${timestampStr}-${input.diameterMm}MM-${randomHex}`;
    const stockStatus = calculateStockStatus(input.quantityKg);

    // 5. Create Physical Stock Lot (Stored in Kilograms)
    await txExec(
      `INSERT INTO stock_lots (
        id, lot_number, brand_id, diameter_id, grade, quantity_kg,
        location, bay_number, stock_status, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        lotId,
        lotNumber,
        resolvedBrand.id,
        resolvedDiameter.id,
        input.grade || 'Fe 550D',
        input.quantityKg,
        input.location || 'Salem Main Yard',
        input.bayNumber || null,
        stockStatus,
        now,
        now,
      ]
    );

    // 6. Record Inward Stock Movement Audit
    const movementId = `mov_${crypto.randomUUID()}`;
    await txExec(
      `INSERT INTO stock_movements (
        id, lot_id, movement_type, quantity_delta_kg, previous_quantity_kg,
        new_quantity_kg, reason, reference_no, idempotency_key, performed_by, performed_by_id, created_at
      ) VALUES (?, ?, 'inward_receipt', ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        lotId,
        input.quantityKg,
        input.quantityKg,
        `Inward consignment receipt per Bill #${input.billNumber}`,
        input.billNumber,
        input.idempotencyKey || null,
        actor.name,
        actor.id || null,
        now,
      ]
    );

    // 7. Create Inward Bill Record
    const billId = `bill_${crypto.randomUUID()}`;
    await txExec(
      `INSERT INTO bills (
        id, bill_number, bill_date, supplier, vehicle_no, quantity_kg,
        rate_per_kg, subtotal_amount, tax_rate_percent, tax_amount, total_amount,
        payment_status, stock_lot_id, stock_movement_id, notes, is_archived,
        created_by_id, created_by_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?)`,
      [
        billId,
        input.billNumber,
        input.billDate,
        input.supplier,
        input.vehicleNo || null,
        input.quantityKg,
        input.ratePerKg,
        subtotalAmount,
        taxRate,
        taxAmount,
        totalAmount,
        input.paymentStatus || 'paid',
        lotId,
        movementId,
        input.notes || null,
        actor.id || null,
        actor.name,
        now,
        now,
      ]
    );

    // 8. Insert Initial Documents if attached
    const createdDocs: BillDocument[] = [];
    if (input.initialDocuments && input.initialDocuments.length > 0) {
      for (const doc of input.initialDocuments) {
        const docId = `doc_${crypto.randomUUID()}`;
        await txExec(
          `INSERT INTO bill_documents (
            id, bill_id, document_type, original_filename, storage_filename,
            storage_path, mime_type, file_size_bytes, file_hash_sha256,
            uploaded_by_id, uploaded_by_name, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
          [
            docId,
            billId,
            doc.documentType,
            doc.originalFilename,
            doc.storageFilename,
            doc.storagePath,
            doc.mimeType,
            doc.fileSizeBytes,
            doc.fileHashSha256,
            actor.id || null,
            actor.name,
            now,
            now,
          ]
        );
        createdDocs.push({
          id: docId,
          bill_id: billId,
          document_type: doc.documentType,
          original_filename: doc.originalFilename,
          storage_filename: doc.storageFilename,
          storage_path: doc.storagePath,
          mime_type: doc.mimeType,
          file_size_bytes: doc.fileSizeBytes,
          file_hash_sha256: doc.fileHashSha256,
          uploaded_by_id: actor.id || null,
          uploaded_by_name: actor.name,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
      }
    }

    return {
      id: billId,
      bill_number: input.billNumber,
      bill_date: input.billDate,
      supplier: input.supplier,
      vehicle_no: input.vehicleNo || null,
      quantity_kg: input.quantityKg,
      rate_per_kg: input.ratePerKg,
      subtotal_amount: subtotalAmount,
      tax_rate_percent: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_status: input.paymentStatus || 'paid',
      stock_lot_id: lotId,
      stock_movement_id: movementId,
      notes: input.notes || null,
      is_archived: false,
      created_by_id: actor.id || null,
      created_by_name: actor.name,
      created_at: now,
      updated_at: now,
      brand_name: resolvedBrand.name,
      diameter_mm: resolvedDiameter.diameter_mm,
      grade: input.grade || 'Fe 550D',
      lot_number: lotNumber,
      documents: createdDocs,
    };
  });
}

/**
 * Retrieve Bills for Admin Register with Search, Filters, and Metrics
 */
export async function getAdminBills(options?: {
  search?: string;
  supplier?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
}): Promise<{
  bills: Array<
    Bill & {
      brand_name?: string;
      diameter_mm?: number;
      lot_number?: string;
      document_count: number;
    }
  >;
  metrics: {
    totalBillsCount: number;
    totalQuantityKg: number;
    totalAmountSpend: number;
    unpaidCount: number;
  };
}> {
  let sql = `
    SELECT 
      b.id, b.bill_number, b.bill_date, b.supplier, b.vehicle_no, b.stock_lot_id, b.stock_movement_id,
      b.quantity_kg, b.rate_per_kg, b.subtotal_amount, b.tax_rate_percent, b.tax_amount, b.total_amount,
      b.payment_status, b.notes, b.is_archived, b.created_at, b.updated_at,
      sl.lot_number,
      br.name AS brand_name,
      d.diameter_mm
    FROM bills b
    LEFT JOIN stock_lots sl ON b.stock_lot_id = sl.id
    LEFT JOIN brands br ON sl.brand_id = br.id
    LEFT JOIN diameters d ON sl.diameter_id = d.id
    WHERE 1=1
  `;

  const params: (string | number | boolean)[] = [];

  if (!options?.includeArchived) {
    sql += ' AND b.is_archived = FALSE';
  }

  if (options?.supplier) {
    sql += ' AND b.supplier ILIKE ?';
    params.push(`%${options.supplier}%`);
  }

  if (options?.paymentStatus && options.paymentStatus !== 'all') {
    sql += ' AND b.payment_status = ?';
    params.push(options.paymentStatus);
  }

  if (options?.startDate) {
    sql += ' AND b.bill_date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    sql += ' AND b.bill_date <= ?';
    params.push(options.endDate);
  }

  if (options?.search) {
    sql += ' AND (b.bill_number ILIKE ? OR b.supplier ILIKE ? OR b.vehicle_no ILIKE ? OR sl.lot_number ILIKE ?)';
    const term = `%${options.search}%`;
    params.push(term, term, term, term);
  }

  let rows: any[] = [];
  try {
    rows = await query<any>(sql, params);
  } catch (err: any) {
    if (err?.message?.includes('lookups on joins')) {
      let simpleSql = `
        SELECT 
          b.id, b.bill_number, b.bill_date, b.supplier, b.vehicle_no, b.stock_lot_id, b.stock_movement_id,
          b.quantity_kg, b.rate_per_kg, b.subtotal_amount, b.tax_rate_percent, b.tax_amount, b.total_amount,
          b.payment_status, b.notes, b.is_archived, b.created_at, b.updated_at
        FROM bills b
        WHERE 1=1
      `;
      const simpleParams: any[] = [];
      if (!options?.includeArchived) {
        simpleSql += ' AND b.is_archived = FALSE';
      }
      if (options?.supplier) {
        simpleSql += ' AND b.supplier ILIKE ?';
        simpleParams.push(`%${options.supplier}%`);
      }
      if (options?.paymentStatus && options.paymentStatus !== 'all') {
        simpleSql += ' AND b.payment_status = ?';
        simpleParams.push(options.paymentStatus);
      }
      if (options?.startDate) {
        simpleSql += ' AND b.bill_date >= ?';
        simpleParams.push(options.startDate);
      }
      if (options?.endDate) {
        simpleSql += ' AND b.bill_date <= ?';
        simpleParams.push(options.endDate);
      }
      if (options?.search) {
        simpleSql += ' AND (b.bill_number ILIKE ? OR b.supplier ILIKE ? OR b.vehicle_no ILIKE ?)';
        const term = `%${options.search}%`;
        simpleParams.push(term, term, term);
      }
      simpleSql += ' ORDER BY b.bill_date DESC, b.created_at DESC';
      rows = await query<any>(simpleSql, simpleParams);
    } else {
      throw err;
    }
  }

  let docCountMap = new Map<string, number>();
  try {
    const docCounts = await query<{ bill_id: string; count: string | number }>(
      'SELECT bill_id, COUNT(id) as count FROM bill_documents WHERE is_active = TRUE GROUP BY bill_id'
    );
    docCountMap = new Map(docCounts.map((d) => [d.bill_id, Number(d.count)]));
  } catch (_) {}

  const bills = rows.map((r) => ({
    id: r.id,
    bill_number: r.bill_number,
    bill_date: typeof r.bill_date === 'string' ? r.bill_date.slice(0, 10) : new Date(r.bill_date).toISOString().slice(0, 10),
    supplier: r.supplier,
    vehicle_no: r.vehicle_no || null,
    quantity_kg: Number(r.quantity_kg),
    rate_per_kg: r.rate_per_kg ? Number(r.rate_per_kg) : null,
    subtotal_amount: r.subtotal_amount ? Number(r.subtotal_amount) : null,
    tax_rate_percent: r.tax_rate_percent ? Number(r.tax_rate_percent) : 18.0,
    tax_amount: r.tax_amount ? Number(r.tax_amount) : null,
    total_amount: r.total_amount ? Number(r.total_amount) : null,
    payment_status: r.payment_status,
    stock_lot_id: r.stock_lot_id || null,
    stock_movement_id: r.stock_movement_id || null,
    image_url: r.image_url || null,
    notes: r.notes || null,
    is_archived: Boolean(r.is_archived),
    created_by_id: r.created_by_id || null,
    created_by_name: r.created_by_name || 'Admin',
    created_at: r.created_at,
    updated_at: r.updated_at,
    brand_name: r.brand_name || undefined,
    diameter_mm: r.diameter_mm ? Number(r.diameter_mm) : undefined,
    lot_number: r.lot_number || undefined,
    document_count: docCountMap.get(r.id) || 0,
  }));

  // Summary Metrics
  const totalBills = bills.length;
  const totalKg = bills.reduce((acc, b) => acc + (b.quantity_kg || 0), 0);
  const totalSpend = bills.reduce((acc, b) => acc + (b.total_amount || 0), 0);
  const unpaid = bills.filter((b) => b.payment_status === 'unpaid').length;

  return {
    bills,
    metrics: {
      totalBillsCount: totalBills,
      totalQuantityKg: totalKg,
      totalAmountSpend: totalSpend,
      unpaidCount: unpaid,
    },
  };
}

/**
 * Retrieve Single Bill by ID with Linked Lot Details and Documents
 */
export async function getAdminBillById(billId: string): Promise<BillWithDetails | null> {
  const sql = `
    SELECT 
      b.*,
      sl.lot_number,
      sl.grade,
      br.name AS brand_name,
      d.diameter_mm
    FROM bills b
    LEFT JOIN stock_lots sl ON b.stock_lot_id = sl.id
    LEFT JOIN brands br ON sl.brand_id = br.id
    LEFT JOIN diameters d ON sl.diameter_id = d.id
    WHERE b.id = ?
    LIMIT 1
  `;

  let rows: any[] = [];
  try {
    rows = await query<any>(sql, [billId]);
  } catch (err: any) {
    if (err?.message?.includes('lookups on joins')) {
      rows = await query<any>('SELECT * FROM bills WHERE id = ? LIMIT 1', [billId]);
    } else {
      throw err;
    }
  }

  if (rows.length === 0) return null;

  const r = rows[0];
  let lotNumber = r.lot_number;
  let grade = r.grade;
  let brandName = r.brand_name;
  let diameterMm = r.diameter_mm;

  if (!lotNumber && r.stock_lot_id) {
    try {
      const lots = await query<any>('SELECT * FROM stock_lots WHERE id = ?', [r.stock_lot_id]);
      if (lots[0]) {
        lotNumber = lots[0].lot_number;
        grade = lots[0].grade;
        const brand = await query<any>('SELECT name FROM brands WHERE id = ?', [lots[0].brand_id]);
        if (brand[0]) brandName = brand[0].name;
        const diam = await query<any>('SELECT diameter_mm FROM diameters WHERE id = ?', [lots[0].diameter_id]);
        if (diam[0]) diameterMm = diam[0].diameter_mm;
      }
    } catch (_) {}
  }

  // Retrieve attached documents
  const docSql = `
    SELECT * FROM bill_documents
    WHERE bill_id = ? AND is_active = TRUE
    ORDER BY created_at DESC
  `;
  const docs = await query<BillDocument>(docSql, [billId]);

  return {
    id: r.id,
    bill_number: r.bill_number,
    bill_date: typeof r.bill_date === 'string' ? r.bill_date.slice(0, 10) : new Date(r.bill_date).toISOString().slice(0, 10),
    supplier: r.supplier,
    vehicle_no: r.vehicle_no || null,
    quantity_kg: Number(r.quantity_kg),
    rate_per_kg: r.rate_per_kg ? Number(r.rate_per_kg) : null,
    subtotal_amount: r.subtotal_amount ? Number(r.subtotal_amount) : null,
    tax_rate_percent: r.tax_rate_percent ? Number(r.tax_rate_percent) : 18.0,
    tax_amount: r.tax_amount ? Number(r.tax_amount) : null,
    total_amount: r.total_amount ? Number(r.total_amount) : null,
    payment_status: r.payment_status,
    stock_lot_id: r.stock_lot_id || null,
    stock_movement_id: r.stock_movement_id || null,
    image_url: r.image_url || null,
    notes: r.notes || null,
    is_archived: Boolean(r.is_archived),
    created_by_id: r.created_by_id || null,
    created_by_name: r.created_by_name || 'Admin',
    created_at: r.created_at,
    updated_at: r.updated_at,
    brand_name: brandName || r.brand_name || undefined,
    diameter_mm: diameterMm ? Number(diameterMm) : (r.diameter_mm ? Number(r.diameter_mm) : undefined),
    grade: grade || r.grade || undefined,
    lot_number: lotNumber || r.lot_number || undefined,
    documents: docs,
  };
}

/**
 * Permitted Metadata Updates for Existing Bill (Preserves Financial/Stock Integrity)
 */
export async function updateBillMetadata(
  billId: string,
  updates: {
    vehicleNo?: string | null;
    paymentStatus?: 'unpaid' | 'partially_paid' | 'paid';
    notes?: string | null;
    isArchived?: boolean;
  },
  actor: { name: string; id?: string }
): Promise<Bill | null> {
  const existing = await query<Bill>('SELECT * FROM bills WHERE id = ?', [billId]);
  if (existing.length === 0) return null;

  const now = new Date().toISOString();
  const setClauses: string[] = ['updated_at = ?'];
  const params: (string | boolean | null)[] = [now];

  if (updates.vehicleNo !== undefined) {
    setClauses.push('vehicle_no = ?');
    params.push(updates.vehicleNo);
  }
  if (updates.paymentStatus !== undefined) {
    setClauses.push('payment_status = ?');
    params.push(updates.paymentStatus);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    params.push(updates.notes);
  }
  if (updates.isArchived !== undefined) {
    setClauses.push('is_archived = ?');
    params.push(updates.isArchived);
  }

  params.push(billId);

  await execute(
    `UPDATE bills SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  const updated = await query<Bill>('SELECT * FROM bills WHERE id = ?', [billId]);
  return updated[0] || null;
}

/**
 * Attach a new document to an existing bill
 */
export async function attachDocumentToBill(
  billId: string,
  doc: {
    documentType: DocumentType;
    originalFilename: string;
    storageFilename: string;
    storagePath: string;
    mimeType: string;
    fileSizeBytes: number;
    fileHashSha256: string;
  },
  actor: { name: string; id?: string }
): Promise<BillDocument> {
  const docId = `doc_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO bill_documents (
      id, bill_id, document_type, original_filename, storage_filename,
      storage_path, mime_type, file_size_bytes, file_hash_sha256,
      uploaded_by_id, uploaded_by_name, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
    [
      docId,
      billId,
      doc.documentType,
      doc.originalFilename,
      doc.storageFilename,
      doc.storagePath,
      doc.mimeType,
      doc.fileSizeBytes,
      doc.fileHashSha256,
      actor.id || null,
      actor.name,
      now,
      now,
    ]
  );

  const created = await query<BillDocument>('SELECT * FROM bill_documents WHERE id = ?', [docId]);
  return created[0];
}

/**
 * Remove / Soft-Delete a document from a bill (returns document record for disk cleanup)
 */
export async function deleteDocumentFromBill(
  billId: string,
  documentId: string
): Promise<BillDocument | null> {
  const existing = await query<BillDocument>(
    'SELECT * FROM bill_documents WHERE id = ? AND bill_id = ? LIMIT 1',
    [documentId, billId]
  );
  if (existing.length === 0) return null;

  await execute(
    'UPDATE bill_documents SET is_active = FALSE, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), documentId]
  );

  return existing[0];
}

/**
 * Backward compatibility helpers for legacy /api/bills
 */
export async function getAllBills(limit = 50): Promise<Bill[]> {
  const sql = 'SELECT * FROM bills WHERE is_archived = FALSE ORDER BY bill_date DESC LIMIT ?';
  return query<Bill>(sql, [limit]);
}

export async function createBill(input: {
  bill_number: string;
  bill_date: string;
  supplier: string;
  image_url?: string;
  notes?: string | null;
  total_amount?: number | null;
}): Promise<Bill> {
  const id = `bill_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO bills (
      id, bill_number, bill_date, supplier, image_url, notes, total_amount,
      quantity_kg, payment_status, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'paid', FALSE, ?, ?)`,
    [
      id,
      input.bill_number,
      input.bill_date,
      input.supplier,
      input.image_url || null,
      input.notes || null,
      input.total_amount || null,
      now,
      now,
    ]
  );
  const rows = await query<Bill>('SELECT * FROM bills WHERE id = ?', [id]);
  return rows[0];
}

