import { MetadataRoute } from 'next';
import { CANONICAL_BASE_URL } from '@/lib/seo';

/**
 * Technical Robots.txt Directives
 * Guides compliant search engine crawlers away from admin workflows and internal APIs.
 * Note: Treated strictly as a crawler directive, not as an access-control mechanism.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/bills',
          '/api/auth/',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${CANONICAL_BASE_URL}/sitemap.xml`,
    host: CANONICAL_BASE_URL,
  };
}
