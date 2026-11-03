import { query, execute, withTransaction } from './index';
import {
  StockStatus,
  StockMovementType,
  StockLot,
  StockMovement,
  PublicStockLot,
  LiveStockWithDetails,
} from '@/db/schema';
import crypto from 'crypto';

/**
 * Authoritative Stock Status Thresholds in Kilograms
 *   - out_of_stock: quantity <= 0 kg
 *   - low_stock:    0 < quantity <= 1,500 kg
 *   - in_stock:     quantity > 1,500 kg
 */
export function calculateStockStatus(quantityKg: number): StockStatus {
  if (typeof quantityKg !== 'number' || isNaN(quantityKg) || quantityKg <= 0) {
    return 'out_of_stock';
  }
  if (quantityKg <= 1500) {
    return 'low_stock';
  }
  return 'in_stock';
}

/**
 * Public Customer-Facing Stock Listing
 * Excludes all confidential supplier, purchase price, and internal documents
 */
export async function getPublicStockLots(options?: {
  brand?: string;
  diameter?: number;
  status?: string;
  search?: string;
}): Promise<PublicStockLot[]> {
  let sql = `
    SELECT 
      sl.id,
      sl.lot_number,
      sl.brand_id,
      b.name AS brand_name,
      b.category AS brand_category,
      sl.diameter_id,
      d.diameter_mm,
      sl.grade,
      sl.quantity_kg,
      ROUND(sl.quantity_kg / 1000.0, 3) AS quantity_mt,
      sl.location,
      sl.bay_number,
      sl.stock_status,
      sl.updated_at AS last_updated
    FROM stock_lots sl
    JOIN brands b ON sl.brand_id = b.id
    JOIN diameters d ON sl.diameter_id = d.id
    WHERE sl.is_active = TRUE
  `;

  const params: (string | number)[] = [];

  if (options?.brand && options.brand !== 'All') {
    sql += ' AND (b.id = ? OR b.name = ?)';
    params.push(options.brand.toLowerCase(), options.brand);
  }

  if (options?.diameter) {
    sql += ' AND d.diameter_mm = ?';
    params.push(options.diameter);
  }

  if (options?.status && options.status !== 'all') {
    sql += ' AND sl.stock_status = ?';
    params.push(options.status);
  }

  if (options?.search) {
    sql += ' AND (b.name ILIKE ? OR sl.lot_number ILIKE ? OR sl.grade ILIKE ? OR sl.location ILIKE ?)';
    const term = `%${options.search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY sl.quantity_kg DESC, b.display_order ASC, d.diameter_mm ASC';

  const rows = await query<any>(sql, params);
  return rows.map((r) => ({
    id: r.id,
    lot_number: r.lot_number,
    brand_id: r.brand_id,
    brand_name: r.brand_name,
    brand_category: r.brand_category,
    diameter_id: r.diameter_id,
    diameter_mm: Number(r.diameter_mm),
    grade: r.grade,
    quantity_kg: Number(r.quantity_kg),
    quantity_mt: Number(r.quantity_mt),
    location: r.location,
    bay_number: r.bay_number || null,
    stock_status: r.stock_status as StockStatus,
    last_updated: r.last_updated,
  }));
}

/**
 * Public Live Stock Summary Metrics
 */
export async function getPublicStockSummaryMetrics(): Promise<{
  totalQuantityKg: number;
  totalQuantityMt: number;
  totalLotsCount: number;
  inStockLotsCount: number;
  lowStockLotsCount: number;
  outOfStockLotsCount: number;
  lastUpdated: string;
}> {
  const stats = await query<{
    total_kg: number;
    total_lots: number;
    in_stock_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    latest_update: string;
  }>(`
    SELECT 
      COALESCE(SUM(quantity_kg), 0) AS total_kg,
      COUNT(id) AS total_lots,
      COALESCE(SUM(CASE WHEN stock_status = 'in_stock' THEN 1 ELSE 0 END), 0) AS in_stock_count,
      COALESCE(SUM(CASE WHEN stock_status = 'low_stock' THEN 1 ELSE 0 END), 0) AS low_stock_count,
      COALESCE(SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
      MAX(updated_at) AS latest_update
    FROM stock_lots
    WHERE is_active = TRUE
  `);

  const row = stats[0];
  const totalKg = Number(row?.total_kg || 0);

  return {
    totalQuantityKg: totalKg,
    totalQuantityMt: Number((totalKg / 1000.0).toFixed(3)),
    totalLotsCount: Number(row?.total_lots || 0),
    inStockLotsCount: Number(row?.in_stock_count || 0),
    lowStockLotsCount: Number(row?.low_stock_count || 0),
    outOfStockLotsCount: Number(row?.out_of_stock_count || 0),
    lastUpdated: row?.latest_update || new Date().toISOString(),
  };
}

/**
 * Admin: Retrieve all lots including batch metadata and movement count
 */
export async function getAdminStockLots(): Promise<any[]> {
  const sql = `
    SELECT 
      sl.*,
      b.name AS brand_name,
      d.diameter_mm,
      ROUND(sl.quantity_kg / 1000.0, 3) AS quantity_mt
    FROM stock_lots sl
    JOIN brands b ON sl.brand_id = b.id
    JOIN diameters d ON sl.diameter_id = d.id
    ORDER BY sl.updated_at DESC
  `;
  return query(sql);
}

/**
 * Admin: Retrieve single stock lot by ID with brand and diameter details
 */
export async function getStockLotById(lotId: string): Promise<any | null> {
  const sql = `
    SELECT 
      sl.*,
      b.name AS brand_name,
      d.diameter_mm,
      ROUND(sl.quantity_kg / 1000.0, 3) AS quantity_mt
    FROM stock_lots sl
    JOIN brands b ON sl.brand_id = b.id
    JOIN diameters d ON sl.diameter_id = d.id
    WHERE sl.id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [lotId]);
  return rows[0] || null;
}

/**
 * Admin: Create a new stock lot with initial movement audit within an atomic transaction
 */
export async function createStockLotWithMovement(
  input: {
    brandId: string;
    diameterMm: number;
    grade?: string;
    quantityKg: number;
    location?: string;
    bayNumber?: string | null;
    mfgBatchNo?: string | null;
    reason: string;
    referenceNo?: string | null;
    idempotencyKey?: string | null;
  },
  actor: { name: string; id?: string }
): Promise<StockLot> {
  return withTransaction(async ({ query: txQuery, execute: txExec }) => {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await txQuery<{ lot_id: string }>(
        'SELECT lot_id FROM stock_movements WHERE idempotency_key = ? LIMIT 1',
        [input.idempotencyKey]
      );
      if (existing.length > 0) {
        const lot = await txQuery<StockLot>('SELECT * FROM stock_lots WHERE id = ?', [existing[0].lot_id]);
        return lot[0];
      }
    }

    // 2. Resolve Brand and Diameter IDs
    const brandRows = await txQuery<{ id: string; name: string }>(
      'SELECT id, name FROM brands WHERE id = ? OR name ILIKE ? LIMIT 1',
      [input.brandId.toLowerCase(), input.brandId]
    );
    if (brandRows.length === 0) {
      throw new Error(`Approved brand '${input.brandId}' not found.`);
    }
    const resolvedBrandId = brandRows[0].id;

    const diameterRows = await txQuery<{ id: string; diameter_mm: number }>(
      'SELECT id, diameter_mm FROM diameters WHERE diameter_mm = ? LIMIT 1',
      [input.diameterMm]
    );
    if (diameterRows.length === 0) {
      throw new Error(`Supported diameter '${input.diameterMm} mm' not found.`);
    }
    const resolvedDiameterId = diameterRows[0].id;

    // 3. Generate Lot Number and UUID
    const lotId = `lot_${crypto.randomUUID()}`;
    const timestampStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const lotNumber = `TS-${timestampStr}-${input.diameterMm}MM-${randomHex}`;

    const status = calculateStockStatus(input.quantityKg);
    const now = new Date().toISOString();

    // 4. Insert into stock_lots
    await txExec(
      `INSERT INTO stock_lots (
        id, lot_number, brand_id, diameter_id, grade, quantity_kg, 
        location, bay_number, mfg_batch_no, stock_status, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        lotId,
        lotNumber,
        resolvedBrandId,
        resolvedDiameterId,
        input.grade || 'Fe 550D',
        input.quantityKg,
        input.location || 'Salem Main Yard',
        input.bayNumber || null,
        input.mfgBatchNo || null,
        status,
        now,
        now,
      ]
    );

    // 5. Insert initial movement record
    const movementId = `mov_${crypto.randomUUID()}`;
    await txExec(
      `INSERT INTO stock_movements (
        id, lot_id, movement_type, quantity_delta_kg, previous_quantity_kg, 
        new_quantity_kg, reason, reference_no, idempotency_key, performed_by, performed_by_id, created_at
      ) VALUES (?, ?, 'initial_entry', ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        lotId,
        input.quantityKg,
        input.quantityKg,
        input.reason,
        input.referenceNo || null,
        input.idempotencyKey || null,
        actor.name,
        actor.id || null,
        now,
      ]
    );

    const created = await txQuery<StockLot>('SELECT * FROM stock_lots WHERE id = ?', [lotId]);
    return created[0];
  });
}

/**
 * Admin: Adjust stock quantity with PostgreSQL row-level locking (SELECT FOR UPDATE)
 * Prevents race conditions and lost updates
 */
export async function adjustStockLotWithLock(
  lotId: string,
  input: {
    adjustmentType: 'set' | 'add' | 'subtract';
    quantityKg: number;
    reason: string;
    movementType?: StockMovementType;
    referenceNo?: string | null;
    idempotencyKey?: string | null;
  },
  actor: { name: string; id?: string }
): Promise<StockLot> {
  return withTransaction(async ({ query: txQuery, execute: txExec }) => {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await txQuery<{ lot_id: string }>(
        'SELECT lot_id FROM stock_movements WHERE idempotency_key = ? LIMIT 1',
        [input.idempotencyKey]
      );
      if (existing.length > 0) {
        const lot = await txQuery<StockLot>('SELECT * FROM stock_lots WHERE id = ?', [existing[0].lot_id]);
        return lot[0];
      }
    }

    // 2. Row-Level Lock on target lot
    const lockedRows = await txQuery<StockLot>(
      'SELECT * FROM stock_lots WHERE id = ? FOR UPDATE',
      [lotId]
    );

    if (lockedRows.length === 0) {
      throw new Error(`Stock lot with ID '${lotId}' does not exist.`);
    }

    const currentLot = lockedRows[0];
    const previousQuantity = Number(currentLot.quantity_kg);
    let newQuantity: number;
    let delta: number;

    if (input.adjustmentType === 'set') {
      newQuantity = input.quantityKg;
      delta = newQuantity - previousQuantity;
    } else if (input.adjustmentType === 'add') {
      delta = input.quantityKg;
      newQuantity = previousQuantity + delta;
    } else if (input.adjustmentType === 'subtract') {
      delta = -input.quantityKg;
      newQuantity = previousQuantity - input.quantityKg;
    } else {
      throw new Error('Invalid adjustment type.');
    }

    // Prevent negative quantities
    if (newQuantity < 0) {
      throw new Error(
        `Overselling / negative stock rejected: Current stock is ${previousQuantity} kg; deduction of ${Math.abs(
          delta
        )} kg would result in ${newQuantity} kg.`
      );
    }

    const newStatus = calculateStockStatus(newQuantity);
    const now = new Date().toISOString();

    // 3. Update stock_lots
    await txExec(
      `UPDATE stock_lots 
       SET quantity_kg = ?, stock_status = ?, updated_at = ? 
       WHERE id = ?`,
      [newQuantity, newStatus, now, lotId]
    );

    // 4. Record stock movement
    const movementId = `mov_${crypto.randomUUID()}`;
    await txExec(
      `INSERT INTO stock_movements (
        id, lot_id, movement_type, quantity_delta_kg, previous_quantity_kg, 
        new_quantity_kg, reason, reference_no, idempotency_key, performed_by, performed_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        lotId,
        input.movementType || 'yard_adjustment',
        delta,
        previousQuantity,
        newQuantity,
        input.reason,
        input.referenceNo || null,
        input.idempotencyKey || null,
        actor.name,
        actor.id || null,
        now,
      ]
    );

    const updated = await txQuery<StockLot>('SELECT * FROM stock_lots WHERE id = ?', [lotId]);
    return updated[0];
  });
}

/**
 * Retrieve movement history for a lot
 */
export async function getStockLotMovements(lotId: string): Promise<StockMovement[]> {
  const sql = `
    SELECT * FROM stock_movements 
    WHERE lot_id = ? 
    ORDER BY created_at DESC
  `;
  return query<StockMovement>(sql, [lotId]);
}

/**
 * Backward compatibility helper for existing legacy LiveStockBoard
 */
export async function getLiveStockOverview(options?: {
  status?: string;
  category?: string;
  brand?: string;
  search?: string;
}): Promise<LiveStockWithDetails[]> {
  const lots = await getPublicStockLots({
    brand: options?.brand,
    status: options?.status,
    search: options?.search,
  });

  return lots.map((lot) => ({
    id: lot.id,
    product_id: lot.diameter_id,
    quantity: lot.quantity_mt, // Return in MT for legacy display
    quantity_kg: lot.quantity_kg,
    unit: 'Tons',
    location: lot.location,
    bay_number: lot.bay_number,
    stock_status: lot.stock_status,
    last_bill_id: null,
    last_updated: lot.last_updated,
    created_at: lot.last_updated,
    updated_at: lot.last_updated,
    product_name: `${lot.brand_name} ${lot.grade} - ${lot.diameter_mm}mm`,
    category: lot.brand_category,
    grade: lot.grade,
    brand: lot.brand_name,
    product_image: '/images/products/rebar-bundle.jpg',
    bill_number: lot.lot_number,
    bill_supplier: null, // Strictly redacted
    bill_image_url: null, // Strictly redacted
    bill_date: lot.last_updated.slice(0, 10),
    diameter_mm: lot.diameter_mm,
  }));
}

/**
 * Backward compatibility helper for legacy summary metrics
 */
export async function getLiveStockSummaryMetrics() {
  const metrics = await getPublicStockSummaryMetrics();
  return {
    totalTonnage: metrics.totalQuantityMt,
    totalQuantityKg: metrics.totalQuantityKg,
    totalProducts: metrics.totalLotsCount,
    inStockCount: metrics.inStockLotsCount,
    lowStockCount: metrics.lowStockLotsCount,
    outOfStockCount: metrics.outOfStockLotsCount,
    lastUpdated: metrics.lastUpdated,
  };
}

export interface DetailedStockMovement {
  id: string;
  lot_id: string;
  lot_number: string;
  brand_id: string;
  brand_name: string;
  diameter_mm: number;
  grade: string;
  bay_number: string | null;
  movement_type: StockMovementType;
  quantity_delta_kg: number;
  quantity_delta_mt: number;
  previous_quantity_kg: number;
  new_quantity_kg: number;
  reason: string;
  reference_no: string | null;
  performed_by: string;
  created_at: string;
}

/**
 * Retrieve all stock movements with joined brand, diameter, and lot details
 */
export async function getAllStockMovements(options?: {
  lotId?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ movements: DetailedStockMovement[]; totalCount: number }> {
  let sql = `
    SELECT 
      m.id,
      m.lot_id,
      COALESCE(l.lot_number, 'UNKNOWN') AS lot_number,
      COALESCE(l.brand_id, '') AS brand_id,
      COALESCE(b.name, 'Yard Rebar') AS brand_name,
      COALESCE(d.diameter_mm, 0) AS diameter_mm,
      COALESCE(l.grade, 'Fe 550D') AS grade,
      l.bay_number,
      m.movement_type,
      m.quantity_delta_kg,
      ROUND(m.quantity_delta_kg / 1000.0, 3) AS quantity_delta_mt,
      m.previous_quantity_kg,
      m.new_quantity_kg,
      m.reason,
      m.reference_no,
      m.performed_by,
      m.created_at
    FROM stock_movements m
    LEFT JOIN stock_lots l ON m.lot_id = l.id
    LEFT JOIN brands b ON l.brand_id = b.id
    LEFT JOIN diameters d ON l.diameter_id = d.id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (options?.lotId) {
    sql += ' AND m.lot_id = ?';
    params.push(options.lotId);
  }

  if (options?.type && options.type !== 'all') {
    sql += ' AND m.movement_type = ?';
    params.push(options.type);
  }

  if (options?.search) {
    sql += ' AND (l.lot_number ILIKE ? OR b.name ILIKE ? OR m.reason ILIKE ? OR m.reference_no ILIKE ? OR m.performed_by ILIKE ?)';
    const term = `%${options.search}%`;
    params.push(term, term, term, term, term);
  }

  // Count total matching
  const countSql = `SELECT COUNT(*) as count FROM (${sql}) AS sub`;
  const countRes = await query<{ count: number }>(countSql, params);
  const totalCount = Number(countRes[0]?.count || 0);

  sql += ' ORDER BY m.created_at DESC';

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await query<any>(sql, params);

  const movements: DetailedStockMovement[] = rows.map((r) => ({
    id: r.id,
    lot_id: r.lot_id,
    lot_number: r.lot_number,
    brand_id: r.brand_id,
    brand_name: r.brand_name,
    diameter_mm: Number(r.diameter_mm),
    grade: r.grade,
    bay_number: r.bay_number || null,
    movement_type: r.movement_type as StockMovementType,
    quantity_delta_kg: Number(r.quantity_delta_kg),
    quantity_delta_mt: Number(r.quantity_delta_mt),
    previous_quantity_kg: Number(r.previous_quantity_kg),
    new_quantity_kg: Number(r.new_quantity_kg),
    reason: r.reason,
    reference_no: r.reference_no,
    performed_by: r.performed_by,
    created_at: r.created_at,
  }));

  return { movements, totalCount };
}

export interface YardBayStatus {
  bay_id: string;
  bay_code: string;
  name: string;
  section: string;
  primary_diameters: number[];
  max_capacity_mt: number;
  current_quantity_kg: number;
  current_quantity_mt: number;
  occupancy_percent: number;
  status: 'optimal' | 'near_full' | 'low' | 'empty';
  lots: any[];
}

/**
 * Retrieve comprehensive Yard Bays & Slots mapping for Salem Yard
 */
export async function getYardBaysData(): Promise<{
  bays: YardBayStatus[];
  totalCapacityMt: number;
  totalOccupiedMt: number;
  overallOccupancyPercent: number;
}> {
  // 1. Fetch all active stock lots
  const lots = await getAdminStockLots();

  // Standard Salem Yard Bay Layout Configuration
  const standardBays = [
    {
      bay_id: 'bay-a1',
      bay_code: 'Bay A-1',
      name: 'Primary Column & Footing Stacking',
      section: 'Section A (Heavy Rebars)',
      primary_diameters: [12, 16],
      max_capacity_mt: 60,
    },
    {
      bay_id: 'bay-a2',
      bay_code: 'Bay A-2',
      name: 'High-Rise Beam & Transfer Girder Stacking',
      section: 'Section A (Heavy Rebars)',
      primary_diameters: [16, 20],
      max_capacity_mt: 50,
    },
    {
      bay_id: 'bay-b1',
      bay_code: 'Bay B-1',
      name: 'Residential Slab & Staircase Stacking',
      section: 'Section B (Medium Rebars)',
      primary_diameters: [10],
      max_capacity_mt: 40,
    },
    {
      bay_id: 'bay-b2',
      bay_code: 'Bay B-2',
      name: 'Raft Foundation & Pier Stacking',
      section: 'Section B (Medium Rebars)',
      primary_diameters: [20],
      max_capacity_mt: 40,
    },
    {
      bay_id: 'bay-c1',
      bay_code: 'Bay C-1',
      name: 'Lateral Ties & Beam Stirrup Bundles',
      section: 'Section C (Stirrup & Coils)',
      primary_diameters: [8],
      max_capacity_mt: 30,
    },
    {
      bay_id: 'bay-c2',
      bay_code: 'Bay C-2',
      name: 'Specialized 20mm & Secondary Coils',
      section: 'Section C (Stirrup & Coils)',
      primary_diameters: [8, 20],
      max_capacity_mt: 30,
    },
    {
      bay_id: 'bay-d1',
      bay_code: 'Bay D-1',
      name: 'Civil Infrastructure & Bridge Cores',
      section: 'Section D (Infrastructure)',
      primary_diameters: [25],
      max_capacity_mt: 35,
    },
    {
      bay_id: 'bay-e1',
      bay_code: 'Bay E-1',
      name: 'Secondary & Commercial Fe 550D Rebars',
      section: 'Section E (Commercial Lots)',
      primary_diameters: [10, 12, 16],
      max_capacity_mt: 45,
    },
  ];

  let totalCapacityMt = 0;
  let totalOccupiedMt = 0;

  const bays: YardBayStatus[] = standardBays.map((def) => {
    totalCapacityMt += def.max_capacity_mt;

    // Filter lots assigned to this bay (or fuzzy match e.g. "Bay A-1")
    const matchedLots = lots.filter(
      (l) => l.bay_number && l.bay_number.toLowerCase().trim() === def.bay_code.toLowerCase().trim()
    );

    const currentKg = matchedLots.reduce((acc, curr) => acc + Number(curr.quantity_kg || 0), 0);
    const currentMt = Number((currentKg / 1000.0).toFixed(3));
    totalOccupiedMt += currentMt;

    const occupancyPercent = Number(
      Math.min(100, Math.round((currentMt / def.max_capacity_mt) * 100))
    );

    let status: 'optimal' | 'near_full' | 'low' | 'empty' = 'optimal';
    if (occupancyPercent === 0) {
      status = 'empty';
    } else if (occupancyPercent < 20) {
      status = 'low';
    } else if (occupancyPercent >= 85) {
      status = 'near_full';
    } else {
      status = 'optimal';
    }

    return {
      bay_id: def.bay_id,
      bay_code: def.bay_code,
      name: def.name,
      section: def.section,
      primary_diameters: def.primary_diameters,
      max_capacity_mt: def.max_capacity_mt,
      current_quantity_kg: currentKg,
      current_quantity_mt: currentMt,
      occupancy_percent: occupancyPercent,
      status,
      lots: matchedLots,
    };
  });

  const overallOccupancyPercent = totalCapacityMt > 0
    ? Number(Math.round((totalOccupiedMt / totalCapacityMt) * 100))
    : 0;

  return {
    bays,
    totalCapacityMt,
    totalOccupiedMt: Number(totalOccupiedMt.toFixed(2)),
    overallOccupancyPercent,
  };
}

/**
 * Retrieve database system statistics for settings & diagnostics
 */
export async function getAdminDatabaseStats(): Promise<{
  engine: string;
  database: string;
  port: number;
  tables: Record<string, number>;
  totalTonnageMt: number;
  totalKg: number;
  serverTime: string;
}> {
  const [stockLotsCount, movementsCount, billsCount, docsCount, brandsCount, diametersCount, adminUsersCount] =
    await Promise.all([
      query<{ count: number }>('SELECT COUNT(*) as count FROM stock_lots'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM stock_movements'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM bills'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM bill_documents'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM brands'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM diameters'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM admin_users'),
    ]);

  const tonnageRes = await query<{ total_kg: number }>(
    'SELECT COALESCE(SUM(quantity_kg), 0) as total_kg FROM stock_lots WHERE is_active = TRUE'
  );

  const totalKg = Number(tonnageRes[0]?.total_kg || 0);

  return {
    engine: 'PostgreSQL 18.x (Localhost Service)',
    database: 'thirupathi_steels',
    port: 5432,
    tables: {
      stock_lots: Number(stockLotsCount[0]?.count || 0),
      stock_movements: Number(movementsCount[0]?.count || 0),
      bills: Number(billsCount[0]?.count || 0),
      bill_documents: Number(docsCount[0]?.count || 0),
      brands: Number(brandsCount[0]?.count || 0),
      diameters: Number(diametersCount[0]?.count || 0),
      admin_users: Number(adminUsersCount[0]?.count || 0),
    },
    totalTonnageMt: Number((totalKg / 1000.0).toFixed(3)),
    totalKg,
    serverTime: new Date().toISOString(),
  };
}
