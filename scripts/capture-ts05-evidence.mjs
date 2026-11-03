import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { signSessionToken } from '../lib/auth/index.js';

const OUT_DIR = 'C:/Users/gokul/.gemini/antigravity-ide/brain/4c9a1c1d-4c4f-40dc-a5e0-bd428ac3cc94/qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

const PUBLIC_PAGES = [
  { slug: '', name: 'home' },
  { slug: 'about', name: 'about' },
  { slug: 'tmt-products', name: 'tmt_products' },
  { slug: 'live-stock', name: 'livestock_dashboard' },
  { slug: 'brands', name: 'brands' },
  { slug: 'gallery', name: 'gallery' },
  { slug: 'contact', name: 'contact' },
];

function getAdminCookie() {
  const token = signSessionToken({
    id: 'usr_admin_01',
    username: 'admin',
    fullName: 'Salem Yard Administrator',
    role: 'admin',
    exp: Date.now() + 3600 * 1000,
  });

  return {
    name: 'ts_admin_session',
    value: token,
    url: BASE_URL,
    httpOnly: true,
    sameSite: 'Lax',
  };
}

async function captureEvidence() {
  console.log('🚀 Launching Chromium for TS-05 visual evidence capture...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop captures (1440 x 900)
  console.log('\n🖥️ Capturing Full-Page Desktop Screenshots (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();

  for (const p of PUBLIC_PAGES) {
    const url = `${BASE_URL}/${p.slug}`;
    console.log(`  Visiting ${url} (Desktop)...`);
    await desktopPage.goto(url, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);
    const filePath = path.join(OUT_DIR, `ts05_desktop_${p.name}.png`);
    await desktopPage.screenshot({ path: filePath, fullPage: true });
    console.log(`  Saved: ${filePath}`);
  }

  // Inject Admin Session Cookie for Dashboard screenshots
  console.log('\n🔐 Injecting Verified Admin Session for Dashboard Captures...');
  await desktopContext.addCookies([getAdminCookie()]);

  // Admin Live Stock
  await desktopPage.goto(`${BASE_URL}/admin/live-stock`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);
  const adminStockDesktopPath = path.join(OUT_DIR, 'ts05_desktop_admin_livestock.png');
  await desktopPage.screenshot({ path: adminStockDesktopPath, fullPage: true });
  console.log(`  Saved: ${adminStockDesktopPath}`);

  // Admin Bills Register
  await desktopPage.goto(`${BASE_URL}/admin/bills`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);
  const adminBillsDesktopPath = path.join(OUT_DIR, 'ts05_desktop_admin_bills.png');
  await desktopPage.screenshot({ path: adminBillsDesktopPath, fullPage: true });
  console.log(`  Saved: ${adminBillsDesktopPath}`);

  await desktopContext.close();

  // 2. Mobile captures (375 x 812 - Standard iPhone Mobile Viewport)
  console.log('\n📱 Capturing Full-Page Mobile Screenshots (375x812)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();

  for (const p of PUBLIC_PAGES) {
    const url = `${BASE_URL}/${p.slug}`;
    console.log(`  Visiting ${url} (Mobile)...`);
    await mobilePage.goto(url, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);
    const filePath = path.join(OUT_DIR, `ts05_mobile_${p.name}.png`);
    await mobilePage.screenshot({ path: filePath, fullPage: true });
    console.log(`  Saved: ${filePath}`);
  }

  // Inject Admin Cookie for Mobile
  await mobileContext.addCookies([getAdminCookie()]);

  await mobilePage.goto(`${BASE_URL}/admin/live-stock`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);
  const adminStockMobilePath = path.join(OUT_DIR, 'ts05_mobile_admin_livestock.png');
  await mobilePage.screenshot({ path: adminStockMobilePath, fullPage: true });
  console.log(`  Saved: ${adminStockMobilePath}`);

  await mobilePage.goto(`${BASE_URL}/admin/bills`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);
  const adminBillsMobilePath = path.join(OUT_DIR, 'ts05_mobile_admin_bills.png');
  await mobilePage.screenshot({ path: adminBillsMobilePath, fullPage: true });
  console.log(`  Saved: ${adminBillsMobilePath}`);

  await mobileContext.close();
  await browser.close();
  console.log('\n✨ All TS-05 visual evidence screenshots captured successfully!');
}

captureEvidence().catch((err) => {
  console.error('Error during visual capture:', err);
  process.exit(1);
});
