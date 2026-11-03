import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/gokul/.gemini/antigravity-ide/brain/4c9a1c1d-4c4f-40dc-a5e0-bd428ac3cc94/qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
  { slug: '', name: 'home' },
  { slug: 'about', name: 'about' },
  { slug: 'products', name: 'products' },
  { slug: 'live-stock', name: 'livestock' },
  { slug: 'brands', name: 'brands' },
  { slug: 'gallery', name: 'gallery' },
  { slug: 'contact', name: 'contact' },
];

async function capture() {
  console.log('🚀 Launching Chromium for QA visual evidence collection...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop captures (1440 x 900)
  console.log('\n🖥️ Capturing Full-Page Desktop Screenshots (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();

  for (const p of PAGES) {
    const url = `http://localhost:3005/${p.slug}`;
    console.log(`  Visiting ${url} (Desktop)...`);
    await desktopPage.goto(url, { waitUntil: 'networkidle' });
    // Brief settle for animations/fonts
    await desktopPage.waitForTimeout(600);
    const filePath = path.join(OUT_DIR, `desktop_${p.name}.png`);
    await desktopPage.screenshot({ path: filePath, fullPage: true });
    console.log(`  Saved: ${filePath}`);
  }
  await desktopContext.close();

  // 2. Mobile captures (375 x 812 - iPhone X / standard mobile reflow)
  console.log('\n📱 Capturing Full-Page Mobile Screenshots (375x812)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();

  for (const p of PAGES) {
    const url = `http://localhost:3005/${p.slug}`;
    console.log(`  Visiting ${url} (Mobile)...`);
    await mobilePage.goto(url, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);
    const filePath = path.join(OUT_DIR, `mobile_${p.name}.png`);
    await mobilePage.screenshot({ path: filePath, fullPage: true });
    console.log(`  Saved: ${filePath}`);
  }
  await mobileContext.close();

  await browser.close();
  console.log('\n✅ All 14 full-page QA visual evidence screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
