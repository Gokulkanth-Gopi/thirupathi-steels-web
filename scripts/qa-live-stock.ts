import { APPROVED_BRAND_IDS, SUPPORTED_DIAMETERS } from '../lib/validations/stock';
import { calculateStockStatus } from '../lib/db/stock';
import { signSessionToken, hashPassword, verifyPassword } from '../lib/auth';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runQaLiveStockSuite() {
  console.log('====================================================');
  console.log('🧪 TS-03 QA VERIFICATION SUITE: LIVE STOCK & ADMIN');
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

  // -----------------------------------------------------------------
  // 1. Stock Status Boundary Assertions (Kilograms)
  // -----------------------------------------------------------------
  console.log('--- 1. STATUS THRESHOLD BOUNDARIES (KG) ---');
  assert('0 kg is out_of_stock', calculateStockStatus(0) === 'out_of_stock');
  assert('-10 kg is out_of_stock', calculateStockStatus(-10) === 'out_of_stock');
  assert('0.001 kg is low_stock', calculateStockStatus(0.001) === 'low_stock');
  assert('1500 kg is low_stock', calculateStockStatus(1500) === 'low_stock');
  assert('1500.001 kg is in_stock', calculateStockStatus(1500.001) === 'in_stock');
  assert('50000 kg is in_stock', calculateStockStatus(50000) === 'in_stock');

  // -----------------------------------------------------------------
  // 2. Approved Brands & Sizes
  // -----------------------------------------------------------------
  console.log('\n--- 2. APPROVED BRANDS & DIAMETERS CONFIGURATION ---');
  assert('Approved brands count is exactly 5', APPROVED_BRAND_IDS.length === 5);
  assert('Approved brands contains tata-tiscon', APPROVED_BRAND_IDS.includes('tata-tiscon'));
  assert('Approved brands contains suryadev', APPROVED_BRAND_IDS.includes('suryadev'));
  assert('Approved brands contains agni', APPROVED_BRAND_IDS.includes('agni'));
  assert('Approved brands contains ssi', APPROVED_BRAND_IDS.includes('ssi'));
  assert('Approved brands contains chakraa', APPROVED_BRAND_IDS.includes('chakraa'));
  assert('Supported diameters count is exactly 6', SUPPORTED_DIAMETERS.length === 6);
  assert('Diameters match [8, 10, 12, 16, 20, 25] mm', JSON.stringify(SUPPORTED_DIAMETERS) === JSON.stringify([8, 10, 12, 16, 20, 25]));

  // -----------------------------------------------------------------
  // 3. Security & Mutation Protection Tests (HTTP Endpoints)
  // -----------------------------------------------------------------
  console.log(`\n--- 3. SECURITY & API MUTATION ENFORCEMENT (${BASE_URL}) ---`);

  // A. Public GET /api/stock should succeed (or return clean 500 error without leaking stack traces if DB offline)
  try {
    const getRes = await fetch(`${BASE_URL}/api/stock`);
    const getJson = await getRes.json();
    assert(
      'GET /api/stock returns structured JSON without leaking stack traces',
      typeof getJson.success === 'boolean'
    );

    const jsonStr = JSON.stringify(getJson);
    assert('GET /api/stock response has no supplier names', !jsonStr.includes('bill_supplier') && !jsonStr.includes('Tata Steel Limited - Authorized Depo'));
    assert('GET /api/stock response has no raw invoice URLs', !jsonStr.includes('bill_image_url') && !jsonStr.includes('.jpg'));
    assert('GET /api/stock response has no commercial trade purchase prices', !jsonStr.includes('total_amount') && !jsonStr.includes('3150000'));
  } catch (err: any) {
    assert('GET /api/stock accessible', false, err.message);
  }

  // B. Unauthorized POST /api/stock MUST BE REJECTED with 401
  try {
    const unauthPost = await fetch(`${BASE_URL}/api/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: 'tata-tiscon',
        diameterMm: 12,
        quantityKg: 5000,
        reason: 'Hacker injection attempt',
      }),
    });
    assert('Unauthenticated POST /api/stock returns 401 Unauthorized', unauthPost.status === 401, `Status: ${unauthPost.status}`);
  } catch (err: any) {
    assert('Unauthenticated POST /api/stock rejected', false, err.message);
  }

  // C. Unauthorized PUT /api/stock/lot_123 MUST BE REJECTED with 401
  try {
    const unauthPut = await fetch(`${BASE_URL}/api/stock/lot_123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adjustmentType: 'subtract',
        quantityKg: 1000,
        reason: 'Unauthorized stock wipe attempt',
      }),
    });
    assert('Unauthenticated PUT /api/stock/[id] returns 401 Unauthorized', unauthPut.status === 401, `Status: ${unauthPut.status}`);
  } catch (err: any) {
    assert('Unauthenticated PUT /api/stock/[id] rejected', false, err.message);
  }

  // D. Admin Login with valid credentials
  let authCookie = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'SalemYard@2026!',
      }),
    });
    const loginJson = await loginRes.json();
    assert('Admin login with valid credentials succeeds (200)', loginRes.status === 200 && loginJson.success);

    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      authCookie = setCookie.split(';')[0];
    }
    assert('Admin login sets ts_admin_session cookie', authCookie.includes('ts_admin_session='));
  } catch (err: any) {
    assert('Admin login flow', false, err.message);
  }

  // E. Admin Login with invalid credentials rejected with 401
  try {
    const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'WrongPassword123!',
      }),
    });
    assert('Admin login with bad credentials returns 401', badLogin.status === 401);
  } catch (err: any) {
    assert('Bad login rejection', false, err.message);
  }

  // F. Authenticated /api/auth/me check
  try {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: authCookie },
    });
    const meJson = await meRes.json();
    assert('/api/auth/me verifies authenticated session', meJson.authenticated === true && meJson.user?.username === 'admin');
  } catch (err: any) {
    assert('/api/auth/me check', false, err.message);
  }

  // G. Public Page Availability
  console.log('\n--- 4. PUBLIC & ADMIN ROUTE STATUS CHECKS ---');
  const routes = ['/', '/about', '/products', '/tmt-products', '/live-stock', '/brands', '/gallery', '/contact', '/admin/login', '/admin/live-stock'];
  for (const r of routes) {
    try {
      const res = await fetch(`${BASE_URL}${r}`);
      assert(`GET ${r} returns HTTP 200`, res.status === 200, `Got: ${res.status}`);
    } catch (err: any) {
      assert(`GET ${r} returns HTTP 200`, false, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`📊 QA SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) process.exit(1);
}

runQaLiveStockSuite().catch((err) => {
  console.error('QA Suite error:', err);
  process.exit(1);
});
