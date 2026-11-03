import { MetadataRoute } from 'next';
import { CANONICAL_BASE_URL } from '@/lib/seo';

/**
 * Technical XML Sitemap Generator
 * Emits strictly the 7 canonical public website URLs for search engine crawlers.
 * Private admin and internal API endpoints are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${CANONICAL_BASE_URL}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${CANONICAL_BASE_URL}/live-stock`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${CANONICAL_BASE_URL}/tmt-products`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${CANONICAL_BASE_URL}/brands`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${CANONICAL_BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${CANONICAL_BASE_URL}/gallery`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${CANONICAL_BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
