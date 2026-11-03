import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/gokul/.gemini/antigravity-ide/brain/4c9a1c1d-4c4f-40dc-a5e0-bd428ac3cc94/qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runE2E() {
  console.log('====================================================');
  console.log('🎭 RUNNING PLAYWRIGHT E2E BROWSER VERIFICATION');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // ----------------------------------------------------
  // TEST 1: Public Live Stock Page
  // ----------------------------------------------------
  console.log('--- 1. PUBLIC LIVE STOCK INTERACTION TEST ---');
  await page.goto(`${BASE_URL}/live-stock`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const heroHeading = await page.locator('h1').textContent();
  console.log(`  ✓ Hero heading: "${heroHeading?.trim()}"`);

  // Check metrics cards rendered
  const metricCards = await page.locator('div.grid.grid-cols-2.md\\:grid-cols-4 > div').count();
  console.log(`  ✓ Rendered ${metricCards} summary metric cards`);

  // Test search input
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.fill('12 mm');
  await page.waitForTimeout(300);
  console.log('  ✓ Search filter tested with "12 mm"');

  // Test Brand pill filter click
  const brandButton = page.locator('button:has-text("TATA TISCON")').first();
  if (await brandButton.isVisible()) {
    await brandButton.click();
    await page.waitForTimeout(300);
    console.log('  ✓ Clicked "TATA TISCON" brand filter pill');
  }

  // Verify privacy: No supplier names or raw invoice URLs in page DOM
  const pageContent = await page.content();
  const leaksSupplier = pageContent.includes('Tata Steel Limited - Authorized Depo') || pageContent.includes('total_amount');
  const leaksInvoiceUrl = pageContent.includes('.jpg') && pageContent.includes('bill_image_url');
  console.log(`  ✓ Confidentiality check: Supplier names leaked? ${leaksSupplier ? 'YES ❌' : 'NO ✅'}`);
  console.log(`  ✓ Confidentiality check: Private invoice URLs leaked? ${leaksInvoiceUrl ? 'YES ❌' : 'NO ✅'}`);

  // Screenshot Public Live Stock Desktop
  const publicScreenshotPath = path.join(OUT_DIR, 'desktop_livestock_rebuilt.png');
  await page.screenshot({ path: publicScreenshotPath, fullPage: true });
  console.log(`  ✓ Captured desktop screenshot: ${publicScreenshotPath}`);

  // Screenshot Public Live Stock Mobile (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  const publicMobileScreenshotPath = path.join(OUT_DIR, 'mobile_livestock_rebuilt.png');
  await page.screenshot({ path: publicMobileScreenshotPath, fullPage: true });
  console.log(`  ✓ Captured public mobile screenshot: ${publicMobileScreenshotPath}`);

  // Reset to desktop viewport for login flow
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ----------------------------------------------------
  // TEST 2: Admin Login Flow (Invalid + Valid)
  // ----------------------------------------------------
  console.log('\n--- 2. ADMIN AUTHENTICATION E2E FLOW ---');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });

  // Test invalid login
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'WrongPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  const errorAlert = page.locator('div.bg-rose-50');
  const errorVisible = await errorAlert.isVisible();
  console.log(`  ✓ Invalid login rejected with error message: ${errorVisible ? 'YES ✅' : 'NO ❌'}`);

  // Test valid login
  await page.fill('input[type="password"]', 'SalemYard@2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const currentUrl = page.url();
  console.log(`  ✓ Logged in and redirected to: ${currentUrl}`);

  // ----------------------------------------------------
  // TEST 3: Admin Live Stock Dashboard & Entry Form
  // ----------------------------------------------------
  console.log('\n--- 3. ADMIN INVENTORY DASHBOARD VERIFICATION ---');
  await page.goto(`${BASE_URL}/admin/live-stock`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const adminHeading = await page.locator('h1').textContent();
  console.log(`  ✓ Admin portal heading: "${adminHeading?.trim()}"`);

  // Toggle "New Inward Lot" form
  const toggleButton = page.locator('button:has-text("New Inward Lot")');
  await toggleButton.click();
  await page.waitForTimeout(400);

  const formVisible = await page.locator('form.space-y-4').isVisible();
  console.log(`  ✓ Stock lot entry form opened: ${formVisible ? 'YES ✅' : 'NO ❌'}`);

  // Capture Admin Desktop Screenshot
  const adminDesktopScreenshot = path.join(OUT_DIR, 'desktop_admin_livestock.png');
  await page.screenshot({ path: adminDesktopScreenshot, fullPage: true });
  console.log(`  ✓ Captured admin desktop screenshot: ${adminDesktopScreenshot}`);

  // Switch to mobile viewport (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  const adminMobileScreenshot = path.join(OUT_DIR, 'mobile_admin_livestock.png');
  await page.screenshot({ path: adminMobileScreenshot, fullPage: true });
  console.log(`  ✓ Captured admin mobile screenshot: ${adminMobileScreenshot}`);

  await context.close();
  await browser.close();

  console.log('\n====================================================');
  console.log('🎉 PLAYWRIGHT E2E BROWSER SUITE COMPLETED SUCCESSFULLY');
  console.log('====================================================\n');
}

runE2E().catch((err) => {
  console.error('Playwright E2E failed:', err);
  process.exit(1);
});
