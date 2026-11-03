import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { signSessionToken } from '../lib/auth/index.js';

const OUT_DIR = 'C:/Users/gokul/.gemini/antigravity-ide/brain/4c9a1c1d-4c4f-40dc-a5e0-bd428ac3cc94/qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

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

async function captureSaasScreenshots() {
  console.log('🚀 Launching Chromium to capture SaaS Admin Dashboard...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop 1440x900
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await desktopContext.addCookies([getAdminCookie()]);
  const desktopPage = await desktopContext.newPage();

  // Flagship SaaS Dashboard (/admin)
  console.log('Capturing Desktop SaaS Dashboard (/admin)...');
  await desktopPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  const saasDesktopPath = path.join(OUT_DIR, 'ts05_desktop_admin_saas_dashboard.png');
  await desktopPage.screenshot({ path: saasDesktopPath, fullPage: true });
  console.log(`Saved: ${saasDesktopPath}`);

  // Live Stock in SaaS Shell (/admin/live-stock)
  console.log('Capturing Desktop Live Stock in SaaS Shell (/admin/live-stock)...');
  await desktopPage.goto(`${BASE_URL}/admin/live-stock`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  const stockDesktopPath = path.join(OUT_DIR, 'ts05_desktop_admin_live_stock_saas.png');
  await desktopPage.screenshot({ path: stockDesktopPath, fullPage: true });
  console.log(`Saved: ${stockDesktopPath}`);

  // Bills in SaaS Shell (/admin/bills)
  console.log('Capturing Desktop Bills in SaaS Shell (/admin/bills)...');
  await desktopPage.goto(`${BASE_URL}/admin/bills`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(800);
  const billsDesktopPath = path.join(OUT_DIR, 'ts05_desktop_admin_bills_saas.png');
  await desktopPage.screenshot({ path: billsDesktopPath, fullPage: true });
  console.log(`Saved: ${billsDesktopPath}`);

  await desktopContext.close();

  // 2. Mobile 375x812
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await mobileContext.addCookies([getAdminCookie()]);
  const mobilePage = await mobileContext.newPage();

  console.log('Capturing Mobile SaaS Dashboard (/admin)...');
  await mobilePage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  const saasMobilePath = path.join(OUT_DIR, 'ts05_mobile_admin_saas_dashboard.png');
  await mobilePage.screenshot({ path: saasMobilePath, fullPage: true });
  console.log(`Saved: ${saasMobilePath}`);

  await mobileContext.close();
  await browser.close();
  console.log('✨ SaaS Admin Dashboard screenshots captured successfully!');
}

captureSaasScreenshots().catch(err => {
  console.error('Error capturing SaaS screenshots:', err);
  process.exit(1);
});
