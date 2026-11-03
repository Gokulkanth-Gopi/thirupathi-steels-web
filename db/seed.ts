import { execute, query } from '../lib/db';
import { calculateStockStatus } from '../lib/db/stock';
import { hashPassword } from '../lib/auth';

/**
 * Seed script for Thirupathi Steels PostgreSQL database.
 * Strictly adheres to:
 * 1. Kilograms storage unit (NUMERIC(14, 3))
 * 2. 5 Approved Brands ONLY
 * 3. 6 Supported Diameters ONLY
 * 4. Authoritative status thresholds:
 *      out_of_stock: <= 0 kg
 *      low_stock:    0 < qty <= 1500 kg
 *      in_stock:     > 1500 kg
 */
async function seed() {
  console.log('🌱 Seeding Thirupathi Steels PostgreSQL database with normalized catalog & inventory...');

  const now = new Date().toISOString();

  // 1. Seed 5 Approved Brands
  const brands = [
    { id: 'tata-tiscon', name: 'TATA TISCON', category: 'Primary Steel', tagline: 'Super Ductile Fe 550D Rebars', logo: '/images/brands/tata-tiscon.webp', order: 1 },
    { id: 'suryadev', name: 'SURYADEV', category: 'Secondary Steel', tagline: 'High Tensile Fe 550D Rebars', logo: '/images/brands/suryadev.png', order: 2 },
    { id: 'agni', name: 'AGNI', category: 'Secondary Steel', tagline: 'Reliable South Indian Rebars', logo: '/images/brands/agni.svg', order: 3 },
    { id: 'ssi', name: 'SSI TMT', category: 'Secondary Steel', tagline: 'Quality TMT Steel Solutions', logo: '/images/brands/ssi.png', order: 4 },
    { id: 'chakraa', name: 'JPR', category: 'Secondary Steel', tagline: 'High Ductility Fe 550D Rebars', logo: '/images/brands/jpr.png', order: 5 },
  ];

  for (const b of brands) {
    await execute(
      `INSERT INTO brands (id, name, category, tagline, logo, is_active, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         tagline = EXCLUDED.tagline,
         logo = EXCLUDED.logo,
         display_order = EXCLUDED.display_order,
         updated_at = EXCLUDED.updated_at`,
      [b.id, b.name, b.category, b.tagline, b.logo, b.order, now, now]
    );
  }

  // 2. Seed 6 Supported Diameters
  const diameters = [
    { id: 'd-8mm', mm: 8, weight: 0.395, use: 'Column lateral ties & beam shear stirrups', order: 1 },
    { id: 'd-10mm', mm: 10, weight: 0.617, use: 'Two-way slabs, staircases & residential lintels', order: 2 },
    { id: 'd-12mm', mm: 12, weight: 0.888, use: 'Primary column bars, foundation footings & beams', order: 3 },
    { id: 'd-16mm', mm: 16, weight: 1.580, use: 'Multi-storey columns & transfer girders', order: 4 },
    { id: 'd-20mm', mm: 20, weight: 2.470, use: 'Heavy columns, raft foundations & bridge piers', order: 5 },
    { id: 'd-25mm', mm: 25, weight: 3.850, use: 'Heavy civil infrastructure & high-rise cores', order: 6 },
  ];

  for (const d of diameters) {
    await execute(
      `INSERT INTO diameters (id, diameter_mm, weight_kg_per_meter, primary_use, is_active, display_order, created_at)
       VALUES (?, ?, ?, ?, TRUE, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         diameter_mm = EXCLUDED.diameter_mm,
         weight_kg_per_meter = EXCLUDED.weight_kg_per_meter,
         primary_use = EXCLUDED.primary_use,
         display_order = EXCLUDED.display_order`,
      [d.id, d.mm, d.weight, d.use, d.order, now]
    );
  }

  // 3. Seed Default Admin Users (Password: SalemYard@2026!)
  const defaultPasswordHash = hashPassword('SalemYard@2026!');
  const adminUsers = [
    { id: 'usr_admin_01', username: 'admin', fullName: 'Salem Yard Administrator', role: 'admin' },
    { id: 'usr_manager_01', username: 'yardmanager', fullName: 'Salem Yard Dispatch Manager', role: 'yard_manager' },
  ];

  for (const u of adminUsers) {
    await execute(
      `INSERT INTO admin_users (id, username, password_hash, full_name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         updated_at = EXCLUDED.updated_at`,
      [u.id, u.username, defaultPasswordHash, u.fullName, u.role, now, now]
    );
  }

  const brandCount = await query<{ count: number }>('SELECT COUNT(*) as count FROM brands');
  const diameterCount = await query<{ count: number }>('SELECT COUNT(*) as count FROM diameters');
  const lotCount = await query<{ count: number }>('SELECT COUNT(*) as count FROM stock_lots');
  const adminCount = await query<{ count: number }>('SELECT COUNT(*) as count FROM admin_users');

  console.log('✅ Seed completed successfully (Master catalog & staff credentials initialized)!');
  console.log(`🏷️  Approved Brands: ${brandCount[0]?.count}`);
  console.log(`📏 Diameters: ${diameterCount[0]?.count}`);
  console.log(`📦 Stock Lots: ${lotCount[0]?.count}`);
  console.log(`👤 Admin Users: ${adminCount[0]?.count}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
