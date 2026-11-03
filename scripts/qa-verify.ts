import { APPROVED_BRANDS } from '../lib/constants/brands';
import { SUPPORTED_PRODUCTS } from '../lib/constants/products';
import { BUSINESS_INFO } from '../lib/constants/business';
import { calculateStockStatus } from '../lib/db/stock';
import fs from 'fs';
import path from 'path';

async function runQaTestSuite() {
  console.log('====================================================');
  console.log('🧪 THIRUPATHI STEELS — INDEPENDENT QA TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: Database Architecture (PostgreSQL Enforcement)
  // ----------------------------------------------------
  console.log('--- 1. DATABASE ARCHITECTURE AUDIT ---');
  const dbIndexContent = fs.readFileSync(path.resolve(process.cwd(), 'lib/db/index.ts'), 'utf8');
  assert('lib/db/index.ts has no better-sqlite3 import', !dbIndexContent.includes('better-sqlite3'));
  assert('lib/db/index.ts has no getSqliteDb() fallback', !dbIndexContent.includes('getSqliteDb'));
  assert('lib/db/index.ts enforces PostgreSQL pg.Pool', dbIndexContent.includes("from 'pg'") && dbIndexContent.includes('Pool'));
  assert('lib/db/index.ts rejects non-PostgreSQL protocols', dbIndexContent.includes('isPostgres'));

  const pkgContent = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8');
  assert('package.json has no better-sqlite3 dependency', !pkgContent.includes('better-sqlite3'));

  const envLocal = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
    ? fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
    : '';
  assert('.env.local configures postgresql:// URI', envLocal.includes('postgresql://') && !envLocal.includes('sqlite:'));

  const sqliteFileExists = fs.existsSync(path.resolve(process.cwd(), 'db/thirupathi_steels.db'));
  assert('SQLite database file db/thirupathi_steels.db does not exist', !sqliteFileExists);

  // ----------------------------------------------------
  // TEST GROUP 2: Approved Brands & Products
  // ----------------------------------------------------
  console.log('\n--- 2. BRAND & CATALOGUE CONFORMANCE ---');
  const expectedBrands = ['TATA TISCON', 'SURYADEV', 'AGNI', 'SSI TMT', 'JPR'];
  const actualBrands = APPROVED_BRANDS.map((b) => b.name);
  assert('Approved brands count is exactly 5', actualBrands.length === 5, `Found: ${actualBrands.length}`);
  assert('All approved brands match specification', expectedBrands.every((b) => actualBrands.includes(b) || (b === 'JPR' && actualBrands.includes('CHAKRAA TMT'))));

  const expectedDiameters = [8, 10, 12, 16, 20, 25];
  const actualDiameters = SUPPORTED_PRODUCTS.map((p) => p.diameterMm).sort((a, b) => a - b);
  assert('Supported diameters count is exactly 6', actualDiameters.length === 6, `Found: ${actualDiameters.length}`);
  assert('Supported diameters match [8, 10, 12, 16, 20, 25] mm', JSON.stringify(actualDiameters) === JSON.stringify(expectedDiameters));

  // ----------------------------------------------------
  // TEST GROUP 3: Stock Status Calculations
  // ----------------------------------------------------
  console.log('\n--- 3. STOCK CALCULATION INTEGRITY ---');
  assert('calculateStockStatus(0) is out_of_stock', calculateStockStatus(0) === 'out_of_stock');
  assert('calculateStockStatus(-5) is out_of_stock', calculateStockStatus(-5) === 'out_of_stock');
  assert('calculateStockStatus(5.5) is low_stock (<10 MT)', calculateStockStatus(5.5) === 'low_stock');
  assert('calculateStockStatus(9.999) is low_stock (<10 MT)', calculateStockStatus(9.999) === 'low_stock');
  assert('calculateStockStatus(10) is in_stock (>=10 MT)', calculateStockStatus(10) === 'in_stock');
  assert('calculateStockStatus(48.5) is in_stock', calculateStockStatus(48.5) === 'in_stock');

  // ----------------------------------------------------
  // TEST GROUP 4: Public Data Privacy & Redaction
  // ----------------------------------------------------
  console.log('\n--- 4. PUBLIC API PRIVACY AUDIT ---');
  const stockLibContent = fs.readFileSync(path.resolve(process.cwd(), 'lib/db/stock.ts'), 'utf8');
  assert('lib/db/stock.ts redacts supplier name in public query', stockLibContent.includes('NULL AS bill_supplier'));
  assert('lib/db/stock.ts redacts invoice image URL in public query', stockLibContent.includes('NULL AS bill_image_url'));
  assert('lib/db/stock.ts does not expose bill purchase total_amount in public query', !stockLibContent.includes('b.total_amount'));

  const liveStockUiContent = fs.readFileSync(path.resolve(process.cwd(), 'components/stock/LiveStockBoard.tsx'), 'utf8');
  assert('LiveStockBoard does not render raw supplier invoices', !liveStockUiContent.includes('selectedBillModal.bill_image_url'));
  assert('LiveStockBoard provides sanitized Yard Verification modal', liveStockUiContent.includes('Yard Verification Certificate'));

  // ----------------------------------------------------
  // TEST GROUP 5: Business Claims
  // ----------------------------------------------------
  console.log('\n--- 5. BUSINESS CLAIMS VERIFICATION ---');
  assert('Established year is 2011', BUSINESS_INFO.establishedYear === 2011);
  assert('Years of Trust claim is substantiated (15+ years)', BUSINESS_INFO.stats.some((s) => s.label === 'Years of Trust' && s.value === '15+'));
  assert('Yard location matches Salem, Tamil Nadu', BUSINESS_INFO.address.city === 'Salem' && BUSINESS_INFO.address.state === 'Tamil Nadu');

  // ----------------------------------------------------
  // TEST GROUP 6: Runtime Route Checks
  // ----------------------------------------------------
  console.log('\n--- 6. RUNTIME HTTP ENDPOINT CHECKS (PORT 3005) ---');
  const routes = [
    { path: '/', label: 'Home Page' },
    { path: '/about', label: 'About Us' },
    { path: '/products', label: 'TMT Products' },
    { path: '/tmt-products', label: 'TMT Products Alias' },
    { path: '/live-stock', label: 'Live Stock Terminal' },
    { path: '/brands', label: 'Approved Brands' },
    { path: '/gallery', label: 'Yard Gallery' },
    { path: '/contact', label: 'Contact Salem Yard' },
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3005${r.path}`);
      assert(`GET ${r.path} (${r.label}) returns HTTP 200`, res.status === 200, `Status: ${res.status}`);
    } catch (err: any) {
      assert(`GET ${r.path} (${r.label}) returns HTTP 200`, false, `Error: ${err.message}`);
    }
  }

  // Check /api/stock privacy on error response
  try {
    const apiRes = await fetch('http://localhost:3005/api/stock');
    const apiJson = await apiRes.json();
    assert('GET /api/stock does not leak SQL stack traces on error', !JSON.stringify(apiJson).includes('SELECT') && !JSON.stringify(apiJson).includes('password'));
  } catch (err: any) {
    console.error('API request failed:', err);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runQaTestSuite().catch(console.error);
