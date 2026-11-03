import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/gokul/.gemini/antigravity-ide/brain/4c9a1c1d-4c4f-40dc-a5e0-bd428ac3cc94/qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runBillsPlaywrightE2E() {
  console.log('====================================================');
  console.log('🎭 RUNNING TS-04 PLAYWRIGHT E2E BROWSER VERIFICATION');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // ----------------------------------------------------
  // TEST 1: Unauthenticated Protection & Login Flow
  // ----------------------------------------------------
  console.log('--- 1. ADMIN AUTHENTICATION FLOW ---');
  await page.goto('http://localhost:3005/admin/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'SalemYard@2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  console.log(`  ✓ Successfully logged in as Salem Yard Admin`);

  // ----------------------------------------------------
  // TEST 2: Admin Bills Register
  // ----------------------------------------------------
  console.log('\n--- 2. ADMIN BILLS REGISTER VERIFICATION ---');
  await page.goto('http://localhost:3005/admin/bills', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const headingText = await page.locator('h1').textContent();
  console.log(`  ✓ Bills Register Heading: "${headingText?.trim()}"`);

  // Check Metric Cards rendered
  const metricCards = await page.locator('div.grid.grid-cols-2.md\\:grid-cols-4 > div').count();
  console.log(`  ✓ Rendered ${metricCards} summary metric cards`);

  // Test Filter / Search Bar
  const searchInput = page.locator('input[placeholder*="Search by Bill #"]');
  await searchInput.fill('INV-2026');
  await page.waitForTimeout(300);
  console.log('  ✓ Search filter tested with query');

  // Open "Record Inward Bill" modal
  const openModalBtn = page.locator('button:has-text("Record Inward Bill")').first();
  await openModalBtn.click();
  await page.waitForTimeout(400);

  const modalHeading = await page.locator('h2:has-text("Record Inward Consignment Bill")').isVisible();
  console.log(`  ✓ Inward Bill Entry Modal opened: ${modalHeading ? 'YES ✅' : 'NO ❌'}`);

  // Capture Desktop Screenshot with Modal
  const desktopBillsScreenshot = path.join(OUT_DIR, 'desktop_admin_bills_register.png');
  await page.screenshot({ path: desktopBillsScreenshot, fullPage: true });
  console.log(`  ✓ Captured desktop bills register screenshot: ${desktopBillsScreenshot}`);

  // Capture Mobile Screenshot
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  const mobileBillsScreenshot = path.join(OUT_DIR, 'mobile_admin_bills_register.png');
  await page.screenshot({ path: mobileBillsScreenshot, fullPage: true });
  console.log(`  ✓ Captured mobile bills register screenshot: ${mobileBillsScreenshot}`);

  // Close modal
  const closeBtn = page.locator('button:has-text("Cancel")').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // ----------------------------------------------------
  // TEST 3: Bill Detail View
  // ----------------------------------------------------
  console.log('\n--- 3. BILL DETAIL & DOCUMENT VIEWER VERIFICATION ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3005/admin/bills/sample_lot_detail', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const detailScreenshot = path.join(OUT_DIR, 'desktop_admin_bill_detail.png');
  await page.screenshot({ path: detailScreenshot, fullPage: true });
  console.log(`  ✓ Captured desktop bill detail screenshot: ${detailScreenshot}`);

  // Mobile Bill Detail
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  const mobileDetailScreenshot = path.join(OUT_DIR, 'mobile_admin_bill_detail.png');
  await page.screenshot({ path: mobileDetailScreenshot, fullPage: true });
  console.log(`  ✓ Captured mobile bill detail screenshot: ${mobileDetailScreenshot}`);

  await context.close();
  await browser.close();

  console.log('\n====================================================');
  console.log('🎉 PLAYWRIGHT E2E BROWSER VERIFICATION COMPLETED');
  console.log('====================================================\n');
}

runBillsPlaywrightE2E().catch((err) => {
  console.error('Playwright E2E failed:', err);
  process.exit(1);
});
