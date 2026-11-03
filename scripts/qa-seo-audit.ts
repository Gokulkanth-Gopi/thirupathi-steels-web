import { CANONICAL_BASE_URL } from '../lib/seo';
import { BUSINESS_INFO } from '../lib/constants/business';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

async function runSeoAuditSuite() {
  console.log('====================================================');
  console.log('🔍 TS-05 QA AUDIT: SEO, PERFORMANCE & ACCESSIBILITY');
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

  // 1. Technical SEO & Canonical URLs for All 7 Public Pages
  console.log('--- 1. TECHNICAL SEO & CANONICAL VERIFICATION ---');

  const publicRoutes = [
    { path: '/', expectedCanonical: `${CANONICAL_BASE_URL}` },
    { path: '/about', expectedCanonical: `${CANONICAL_BASE_URL}/about` },
    { path: '/tmt-products', expectedCanonical: `${CANONICAL_BASE_URL}/tmt-products` },
    { path: '/live-stock', expectedCanonical: `${CANONICAL_BASE_URL}/live-stock` },
    { path: '/brands', expectedCanonical: `${CANONICAL_BASE_URL}/brands` },
    { path: '/gallery', expectedCanonical: `${CANONICAL_BASE_URL}/gallery` },
    { path: '/contact', expectedCanonical: `${CANONICAL_BASE_URL}/contact` },
  ];

  const pageTitles = new Set<string>();
  const pageDescriptions = new Set<string>();

  for (const page of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`);
      assert(`GET ${page.path} returns HTTP 200`, res.status === 200);

      const html = await res.text();

      // Title check
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      assert(`Page ${page.path} has title: "${title.slice(0, 45)}..."`, Boolean(title));
      assert(`Page ${page.path} title is unique`, !pageTitles.has(title));
      if (title) pageTitles.add(title);

      // Meta Description check
      const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^">]+)"/i);
      const desc = descMatch ? descMatch[1].trim() : '';
      assert(`Page ${page.path} has meta description`, Boolean(desc));
      assert(`Page ${page.path} description is unique`, !pageDescriptions.has(desc));
      if (desc) pageDescriptions.add(desc);

      // Canonical URL check
      const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^">]+)"/i);
      const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';
      assert(
        `Page ${page.path} has canonical: "${canonical}"`,
        canonical === page.expectedCanonical,
        `Expected ${page.expectedCanonical}, got ${canonical}`
      );

      // Open Graph Tags
      const ogTitle = html.includes('property="og:title"');
      const ogDesc = html.includes('property="og:description"');
      const ogUrl = html.includes('property="og:url"');
      assert(`Page ${page.path} has essential OpenGraph tags (title, desc, url)`, ogTitle && ogDesc && ogUrl);

      // Semantic <h1> check (single H1 per page)
      const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gis) || [];
      assert(`Page ${page.path} has exactly one <h1> heading`, h1Matches.length === 1, `Count: ${h1Matches.length}`);
    } catch (err: any) {
      assert(`GET ${page.path} failed with error`, false, err.message);
    }
  }

  // 2. Canonical Consolidation Strategy: /products -> /tmt-products
  console.log('\n--- 2. CANONICAL CONSOLIDATION STRATEGY (/products -> /tmt-products) ---');
  try {
    const resProducts = await fetch(`${BASE_URL}/products`);
    assert('GET /products accessible with HTTP 200', resProducts.status === 200);
    const htmlProducts = await resProducts.text();
    const prodCanonicalMatch = htmlProducts.match(/<link[^>]+rel="canonical"[^>]+href="([^">]+)"/i);
    const prodCanonical = prodCanonicalMatch ? prodCanonicalMatch[1].trim() : '';
    assert(
      'GET /products declares canonical pointing to /tmt-products',
      prodCanonical === `${CANONICAL_BASE_URL}/tmt-products`,
      `Got: ${prodCanonical}`
    );
  } catch (err: any) {
    assert('/products canonical check failed', false, err.message);
  }

  // 3. XML Sitemap Validation
  console.log('\n--- 3. XML SITEMAP VALIDATION (/sitemap.xml) ---');
  try {
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    assert('GET /sitemap.xml returns HTTP 200', sitemapRes.status === 200);

    const sitemapXml = await sitemapRes.text();
    assert('Sitemap contains XML declaration or urlset', sitemapXml.includes('<urlset') || sitemapXml.includes('<url>'));

    for (const page of publicRoutes) {
      const containsUrl = sitemapXml.includes(page.expectedCanonical);
      assert(`Sitemap includes canonical URL: ${page.expectedCanonical}`, containsUrl);
    }

    assert('Sitemap excludes private /admin/ routes', !sitemapXml.includes('/admin/'));
    assert('Sitemap excludes private /api/ routes', !sitemapXml.includes('/api/'));
  } catch (err: any) {
    assert('Sitemap validation error', false, err.message);
  }

  // 4. Robots.txt Validation
  console.log('\n--- 4. ROBOTS.TXT DIRECTIVES VALIDATION (/robots.txt) ---');
  try {
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    assert('GET /robots.txt returns HTTP 200', robotsRes.status === 200);

    const robotsTxt = await robotsRes.text();
    assert('robots.txt contains Disallow: /admin/', robotsTxt.includes('Disallow: /admin/'));
    assert('robots.txt contains Disallow: /api/admin/', robotsTxt.includes('Disallow: /api/admin/'));
    assert('robots.txt contains Disallow: /api/bills', robotsTxt.includes('Disallow: /api/bills'));
    assert(
      'robots.txt links to production sitemap.xml',
      robotsTxt.includes(`Sitemap: ${CANONICAL_BASE_URL}/sitemap.xml`)
    );
  } catch (err: any) {
    assert('Robots.txt validation error', false, err.message);
  }

  // 5. LocalBusiness Schema.org Structured Data
  console.log('\n--- 5. LOCAL BUSINESS STRUCTURED DATA AUDIT ---');
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();

    const ldJsonMatches = homeHtml.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    assert('Page contains application/ld+json structured data block', ldJsonMatches.length > 0);

    let parsedLd: any = null;
    for (const scriptTag of ldJsonMatches) {
      const content = scriptTag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      try {
        const json = JSON.parse(content);
        if (json['@type'] && (Array.isArray(json['@type']) ? json['@type'].includes('LocalBusiness') : json['@type'] === 'LocalBusiness' || json['@type'] === 'HomeAndConstructionBusiness')) {
          parsedLd = json;
          break;
        }
      } catch (_) {}
    }

    assert('Structured data contains valid LocalBusiness schema', parsedLd !== null);

    if (parsedLd) {
      assert('Schema contains verified business name "Thirupathi Steels"', parsedLd.name === 'Thirupathi Steels');
      assert('Schema contains Salem street address', parsedLd.address?.streetAddress?.includes('Chennai Bye Pass Road'));
      assert('Schema contains postal code 636 201', parsedLd.address?.postalCode?.replace(/\s/g, '').includes('636201'));
      assert('Schema contains founding year 2011', parsedLd.foundingDate === '2011');
      assert('Schema contains verified primary phone', parsedLd.telephone?.includes('+919003461089'));
      assert('Schema contains brand catalog with TATA TISCON', parsedLd.brand?.some((b: any) => b.name === 'TATA TISCON'));
      assert('Schema contains rebar offer catalog with standard diameters', parsedLd.hasOfferCatalog?.itemListElement?.length >= 6);
      assert('Schema contains NO unsupported fake aggregateRating or reviews', !parsedLd.aggregateRating && !parsedLd.review);
    }
  } catch (err: any) {
    assert('Structured data audit error', false, err.message);
  }

  // 6. Public Confidentiality Guarantee
  console.log('\n--- 6. PUBLIC CONFIDENTIALITY GUARANTEE ---');
  try {
    const liveStockRes = await fetch(`${BASE_URL}/api/stock`);
    const liveStockJson = await liveStockRes.json();
    const stringified = JSON.stringify(liveStockJson);

    assert('Public stock data contains NO supplier names', !stringified.includes('Tata Steel Limited - Authorized Depot'));
    assert('Public stock data contains NO private invoice paths', !stringified.includes('/private_uploads/'));
    assert('Public stock data contains NO commercial purchase prices', !stringified.includes('rate_per_kg') && !stringified.includes('subtotal_amount'));
  } catch (err: any) {
    assert('Confidentiality test error', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TS-05 QA AUDIT SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runSeoAuditSuite().catch((e) => {
  console.error('Fatal QA error:', e);
  process.exit(1);
});
