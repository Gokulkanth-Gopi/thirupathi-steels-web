import { newDb, DataType } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return `${iterations}:${salt}:${derivedKey.toString('hex')}`;
}

function calculateStockStatus(quantityKg: number): 'out_of_stock' | 'low_stock' | 'in_stock' {
  if (typeof quantityKg !== 'number' || isNaN(quantityKg) || quantityKg <= 0) {
    return 'out_of_stock';
  }
  if (quantityKg <= 1500) {
    return 'low_stock';
  }
  return 'in_stock';
}

let memoryPoolInstance: Pool | null = null;

/**
 * Initializes and returns a singleton in-memory PostgreSQL pool
 * running the full normalized schema (001 + 002) and baseline seed data.
 */
export function getDevMemoryPool(): Pool {
  if (memoryPoolInstance) {
    return memoryPoolInstance;
  }

  console.log('⚡ [PostgreSQL Engine]: Initializing in-memory PostgreSQL engine for local development...');

  const db = newDb();

  // Register UUID function
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.text,
    implementation: () => 'uuid-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36),
  });

  // Register round(float, integer) function
  db.public.registerFunction({
    name: 'round',
    args: [DataType.float, DataType.integer],
    returns: DataType.float,
    implementation: (val: number, precision: number) => {
      if (val === null || val === undefined) return null;
      const factor = Math.pow(10, precision);
      return Math.round(Number(val) * factor) / factor;
    },
  });

  // Register round(float) function
  db.public.registerFunction({
    name: 'round',
    args: [DataType.float],
    returns: DataType.float,
    implementation: (val: number) => {
      if (val === null || val === undefined) return null;
      return Math.round(Number(val));
    },
  });

  try {
    // 1. Run Migration 001
    const m1Path = path.resolve(process.cwd(), 'db/migrations/001_initial_stock_schema.sql');
    if (fs.existsSync(m1Path)) {
      const m1Sql = fs.readFileSync(m1Path, 'utf8');
      db.public.none(m1Sql);
    }

    // 2. Run Migration 002
    const m2Path = path.resolve(process.cwd(), 'db/migrations/002_bills_and_documents_schema.sql');
    if (fs.existsSync(m2Path)) {
      const m2Sql = fs.readFileSync(m2Path, 'utf8');
      db.public.none(m2Sql);
    }

    // 2.5 Run Migration 003 or Create Gallery Table
    try {
      db.public.none(`
        CREATE TABLE IF NOT EXISTS gallery_images (
          id TEXT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'Yard Infrastructure',
          image_url VARCHAR(500) NOT NULL,
          description TEXT,
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (_) {}

    // 3. Seed 5 Approved Brands
    db.public.none(`
      INSERT INTO brands (id, name, category, tagline, logo, is_active, display_order) VALUES
      ('tata-tiscon', 'TATA TISCON', 'Primary Steel', 'Super Ductile Fe 550D Rebars', '/images/brands/tata-tiscon.webp', TRUE, 1),
      ('suryadev', 'SURYADEV', 'Secondary Steel', 'High Tensile Fe 550D Rebars', '/images/brands/suryadev.png', TRUE, 2),
      ('agni', 'AGNI', 'Secondary Steel', 'Reliable South Indian Rebars', '/images/brands/agni.svg', TRUE, 3),
      ('ssi', 'SSI TMT', 'Secondary Steel', 'Quality TMT Steel Solutions', '/images/brands/ssi.png', TRUE, 4),
      ('chakraa', 'JPR', 'Secondary Steel', 'Proven Durability & Tensile Strength', '/images/brands/jpr.png', TRUE, 5);
    `);

    // 4. Seed 6 Supported Diameters
    db.public.none(`
      INSERT INTO diameters (id, diameter_mm, weight_kg_per_meter, primary_use, is_active, display_order) VALUES
      ('d-8mm', 8, 0.395, 'Column lateral ties & beam shear stirrups', TRUE, 1),
      ('d-10mm', 10, 0.617, 'Two-way slabs, staircases & residential lintels', TRUE, 2),
      ('d-12mm', 12, 0.888, 'Primary column bars, foundation footings & beams', TRUE, 3),
      ('d-16mm', 16, 1.580, 'Multi-storey columns & transfer girders', TRUE, 4),
      ('d-20mm', 20, 2.470, 'Heavy columns, raft foundations & bridge piers', TRUE, 5),
      ('d-25mm', 25, 3.850, 'Heavy civil infrastructure & high-rise cores', TRUE, 6);
    `);

    // 5. Seed Admin Users
    const pwdHash = hashPassword('SalemYard@2026!');
    db.public.none(`
      INSERT INTO admin_users (id, username, password_hash, full_name, role, is_active) VALUES
      ('usr_admin_01', 'admin', '${pwdHash}', 'Salem Yard Administrator', 'admin', TRUE),
      ('usr_manager_01', 'yardmanager', '${pwdHash}', 'Salem Yard Supervisor', 'yard_manager', TRUE);
    `);

    console.log('✅ [PostgreSQL Engine]: In-memory catalog and staff credentials initialized successfully.');
  } catch (seedErr) {
    console.error('Error during in-memory PostgreSQL initialization:', seedErr);
  }

  const pg = db.adapters.createPg();
  const pool = new pg.Pool() as unknown as Pool;
  memoryPoolInstance = pool;
  return pool;
}
