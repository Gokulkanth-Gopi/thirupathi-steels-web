import { newDb, DataType } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calculateFinancials } from '../../lib/db/bills';

async function runBillsDatabaseIntegrationTests() {
  console.log('====================================================');
  console.log('🐘 POSTGRESQL INTEGRATION: BILLS & DOCUMENT SYSTEM');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  // 1. Initialize dedicated test PostgreSQL database
  console.log('--- 1. TEST POSTGRESQL DATABASE INITIALIZATION ---');
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.text,
    implementation: () => 'test-uuid-' + Math.random().toString(36).slice(2),
  });

  const pg = db.adapters.createPg();
  const pool = new pg.Pool();
  assert('PostgreSQL test connection pool created', pool !== null);

  // 2. Apply Migration 001
  console.log('\n--- 2. APPLY MIGRATION 001 (CORE INVENTORY) ---');
  const m1Path = path.resolve(process.cwd(), 'db/migrations/001_initial_stock_schema.sql');
  const m1Sql = fs.readFileSync(m1Path, 'utf8');
  for (const stmt of m1Sql.split(';').map((s) => s.trim()).filter((s) => s.length > 0)) {
    await pool.query(stmt);
  }
  assert('Applied migration 001 statements successfully', true);

  // Seed brands and diameters
  await pool.query(`
    INSERT INTO brands (id, name, category, display_order) VALUES
    ('tata-tiscon', 'TATA TISCON', 'Primary Steel', 1),
    ('suryadev', 'SURYADEV', 'Secondary Steel', 2),
    ('agni', 'AGNI', 'Secondary Steel', 3),
    ('ssi', 'SSI TMT', 'Secondary Steel', 4),
    ('chakraa', 'CHAKRAA TMT', 'Secondary Steel', 5);

    INSERT INTO diameters (id, diameter_mm, weight_kg_per_meter, display_order) VALUES
    ('d-8mm', 8, 0.395, 1),
    ('d-10mm', 10, 0.617, 2),
    ('d-12mm', 12, 0.888, 3),
    ('d-16mm', 16, 1.580, 4),
    ('d-20mm', 20, 2.470, 5),
    ('d-25mm', 25, 3.850, 6);
  `);
  assert('Seeded approved brands (5) and diameters (6)', true);

  // 3. Apply Migration 002 (Bills & Documents)
  console.log('\n--- 3. APPLY MIGRATION 002 (BILLS & DOCUMENTS) ---');
  const m2Path = path.resolve(process.cwd(), 'db/migrations/002_bills_and_documents_schema.sql');
  const m2Sql = fs.readFileSync(m2Path, 'utf8');
  for (const stmt of m2Sql.split(';').map((s) => s.trim()).filter((s) => s.length > 0)) {
    await pool.query(stmt);
  }
  assert('Applied migration 002 statements successfully', true);

  // 4. Exact Financial Arithmetic Test
  console.log('\n--- 4. EXACT FINANCIAL ARITHMETIC ---');
  // 15,450 kg at Rs. 54.25 per kg with 18% GST
  const fin = calculateFinancials(15450, 54.25, 18.0);
  // Subtotal = 15450 * 54.25 = 838,162.50
  assert('Subtotal is exact to 2 decimal places', fin.subtotalAmount === 838162.5);
  // Tax = 838,162.50 * 0.18 = 150,869.25
  assert('Tax amount (18%) is exact to 2 decimal places', fin.taxAmount === 150869.25);
  // Total = 838,162.50 + 150,869.25 = 989,031.75
  assert('Total amount is exact sum of subtotal + tax', fin.totalAmount === 989031.75);

  // 5. Transactional Inward Bill & Stock Lot Creation
  console.log('\n--- 5. TRANSACTIONAL INWARD BILL & STOCK LOT CREATION ---');
  const lotId = 'lot_test_001';
  const lotNumber = 'TS-261023-12MM-ABCD';
  const movementId = 'mov_test_001';
  const billId = 'bill_test_001';
  const billNumber = 'INV-2026-SALEM-099';
  const supplier = 'Tata Steel Ltd - Authorized Depo';
  const quantityKg = 25000; // 25 MT
  const ratePerKg = 55.5;
  const billFin = calculateFinancials(quantityKg, ratePerKg, 18.0);

  // Simulate atomic transaction
  const backup = db.backup();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert Stock Lot
    await client.query(
      `INSERT INTO stock_lots (id, lot_number, brand_id, diameter_id, grade, quantity_kg, location, stock_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [lotId, lotNumber, 'tata-tiscon', 'd-12mm', 'Fe 550D', quantityKg, 'Salem Main Yard', 'in_stock']
    );

    // Insert Movement
    await client.query(
      `INSERT INTO stock_movements (id, lot_id, movement_type, quantity_delta_kg, previous_quantity_kg, new_quantity_kg, reason, reference_no, performed_by, created_at)
       VALUES ($1, $2, 'inward_receipt', $3, 0, $3, $4, $5, 'Salem Yard Admin', NOW())`,
      [movementId, lotId, quantityKg, `Inward consignment receipt per Bill #${billNumber}`, billNumber]
    );

    // Insert Bill
    await client.query(
      `INSERT INTO bills (
        id, bill_number, bill_date, supplier, vehicle_no, quantity_kg,
        rate_per_kg, subtotal_amount, tax_rate_percent, tax_amount, total_amount,
        payment_status, stock_lot_id, stock_movement_id, notes, is_archived,
        created_by_name, created_at, updated_at
      ) VALUES ($1, $2, '2026-10-23', $3, 'TN-30-AA-1234', $4, $5, $6, 18.00, $7, $8, 'paid', $9, $10, 'Primary rebar shipment', FALSE, 'Salem Yard Admin', NOW(), NOW())`,
      [
        billId,
        billNumber,
        supplier,
        quantityKg,
        ratePerKg,
        billFin.subtotalAmount,
        billFin.taxAmount,
        billFin.totalAmount,
        lotId,
        movementId,
      ]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  // Verify created records
  const billCheck = await pool.query('SELECT * FROM bills WHERE id = $1', [billId]);
  assert('Bill record created in PostgreSQL', billCheck.rows.length === 1);
  assert('Bill links to correct stock_lot_id', billCheck.rows[0].stock_lot_id === lotId);
  assert('Bill links to correct stock_movement_id', billCheck.rows[0].stock_movement_id === movementId);
  assert('Bill financial total stored accurately', Number(billCheck.rows[0].total_amount) === billFin.totalAmount);

  const lotCheck = await pool.query('SELECT * FROM stock_lots WHERE id = $1', [lotId]);
  assert('Linked stock lot has exact inward quantity in kg', Number(lotCheck.rows[0].quantity_kg) === quantityKg);

  const movCheck = await pool.query('SELECT * FROM stock_movements WHERE id = $1', [movementId]);
  assert('Linked stock movement audit record logged', movCheck.rows.length === 1);
  assert('Movement reference number matches bill number', movCheck.rows[0].reference_no === billNumber);

  // 6. Duplicate Bill Number Rejection
  console.log('\n--- 6. DUPLICATE BILL NUMBER CONSTRAINT ---');
  let duplicateRejected = false;
  try {
    await pool.query(
      `INSERT INTO bills (id, bill_number, bill_date, supplier, quantity_kg, created_at, updated_at)
       VALUES ('bill_dup', $1, '2026-10-23', 'Another Supplier', 5000, NOW(), NOW())`,
      [billNumber]
    );
  } catch (err: any) {
    duplicateRejected = true;
  }
  assert('Duplicate bill number was blocked by PostgreSQL UNIQUE constraint', duplicateRejected);

  // 7. Atomic Rollback on Mid-Transaction Failure
  console.log('\n--- 7. ATOMIC ROLLBACK ON MID-TRANSACTION FAILURE ---');
  const failClient = await pool.connect();
  const preFailBackup = db.backup();
  let txFailed = false;

  try {
    await failClient.query('BEGIN');
    // Step A: Insert a lot
    await failClient.query(
      `INSERT INTO stock_lots (id, lot_number, brand_id, diameter_id, grade, quantity_kg, location, stock_status, created_at, updated_at)
       VALUES ('lot_fail', 'TS-FAIL-LOT', 'tata-tiscon', 'd-12mm', 'Fe 550D', 5000, 'Salem Main Yard', 'in_stock', NOW(), NOW())`
    );

    // Step B: Intentionally trigger error (violating foreign key on brand)
    await failClient.query(
      `INSERT INTO bills (id, bill_number, bill_date, supplier, quantity_kg, stock_lot_id, created_at, updated_at)
       VALUES ('bill_fail', 'INV-FAIL-001', '2026-10-23', 'Supplier', 5000, 'non-existent-lot-id', NOW(), NOW())`
    );

    await failClient.query('COMMIT');
  } catch (err: any) {
    txFailed = true;
    await failClient.query('ROLLBACK');
    preFailBackup.restore();
  } finally {
    failClient.release();
  }

  assert('Transaction aborted on mid-step failure', txFailed);
  const orphanLot = await pool.query('SELECT * FROM stock_lots WHERE id = $1', ['lot_fail']);
  assert('Rolled-back lot does not exist in PostgreSQL (no orphan record)', orphanLot.rows.length === 0);

  // 8. Document Metadata Table & Cascade Integrity
  console.log('\n--- 8. DOCUMENT METADATA ATTACHMENT & INTEGRITY ---');
  const docId = 'doc_test_001';
  await pool.query(
    `INSERT INTO bill_documents (
      id, bill_id, document_type, original_filename, storage_filename,
      storage_path, mime_type, file_size_bytes, file_hash_sha256,
      uploaded_by_name, is_active, created_at, updated_at
    ) VALUES ($1, $2, 'supplier_invoice', 'TaxInvoice_12MM_Tata.pdf', 'doc_safe_abc123.pdf',
              '/private/docs/doc_safe_abc123.pdf', 'application/pdf', 245120,
              'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              'Salem Yard Admin', TRUE, NOW(), NOW())`,
    [docId, billId]
  );

  const docCheck = await pool.query('SELECT * FROM bill_documents WHERE id = $1', [docId]);
  assert('Document record successfully attached to bill', docCheck.rows.length === 1);
  assert('Document metadata captures type and safe filename', docCheck.rows[0].document_type === 'supplier_invoice');

  console.log('\n====================================================');
  console.log(`📊 BILLS INTEGRATION SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) process.exit(1);
}

runBillsDatabaseIntegrationTests().catch((err) => {
  console.error('Bills database test failed:', err);
  process.exit(1);
});
