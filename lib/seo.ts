import { Metadata } from 'next';
import { BUSINESS_INFO } from './constants/business';

export const CANONICAL_BASE_URL = 'https://thirupathisteels.com';

export const SITE_CONFIG = {
  name: BUSINESS_INFO.name,
  legalName: BUSINESS_INFO.legalName,
  tagline: BUSINESS_INFO.tagline,
  description: BUSINESS_INFO.description,
  url: CANONICAL_BASE_URL,
  location: {
    streetAddress: BUSINESS_INFO.address.full,
    addressLocality: BUSINESS_INFO.address.city,
    addressRegion: BUSINESS_INFO.address.state,
    postalCode: BUSINESS_INFO.address.postalCode,
    addressCountry: 'IN',
  },
  contact: {
    phonePrimary: BUSINESS_INFO.phones[0].display,
    phoneSecondary: BUSINESS_INFO.phones[1].display,
  },
  defaultOgImage: '/images/home/steel-yard-hero.jpg',
  keywords: [
    'Thirupathi Steels Salem',
    'TMT Steel Salem',
    'Tata Tiscon Salem',
    'Suryadev TMT Salem',
    'Agni TMT Salem',
    'SSI TMT Steel',
    'JPR TMT',
    'Live Stock TMT Salem',
    'Fe 550D TMT rebars',
    'Seelanaickenpatti steel stockist',
    'TMT Steel wholesale Salem',
    'Reinforcement steel bars Salem',
  ],
};

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  image = SITE_CONFIG.defaultOgImage,
  canonicalUrl,
  noIndex = false,
}: MetadataProps = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline} | Salem, Tamil Nadu`;

  // Always use the authoritative production canonical domain https://thirupathisteels.com
  let canonical = CANONICAL_BASE_URL;
  if (canonicalUrl) {
    const cleanPath = canonicalUrl.startsWith('/') ? canonicalUrl : `/${canonicalUrl}`;
    canonical = `${CANONICAL_BASE_URL}${cleanPath}`;
  }

  const ogImageUrl = image.startsWith('http') ? image : `${CANONICAL_BASE_URL}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: SITE_CONFIG.keywords,
    metadataBase: new URL(CANONICAL_BASE_URL),
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} Salem TMT Rebar Yard Infrastructure`,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/images/logo/Teal T and Steel S Emblem-4.png',
      shortcut: '/images/logo/Teal T and Steel S Emblem-4.png',
      apple: '/images/logo/Teal T and Steel S Emblem-4.png',
    },
  };
}

/**
 * Verified LocalBusiness Structured Data (Schema.org)
 * Strictly utilizes authoritative business facts for Thirupathi Steels, Salem
 */
export function getLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'WholesaleStore', 'HomeAndConstructionBusiness'],
    '@id': `${CANONICAL_BASE_URL}/#localbusiness`,
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    description: BUSINESS_INFO.description,
    slogan: BUSINESS_INFO.tagline,
    url: CANONICAL_BASE_URL,
    telephone: [BUSINESS_INFO.phones[0].tel, BUSINESS_INFO.phones[1].tel],
    logo: `${CANONICAL_BASE_URL}/images/logo/Teal%20T%20and%20Steel%20S%20Emblem-4.png`,
    image: `${CANONICAL_BASE_URL}/images/home/steel-yard-hero.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_INFO.address.street,
      addressLocality: BUSINESS_INFO.address.city,
      addressRegion: BUSINESS_INFO.address.state,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 11.6234,
      longitude: 78.1460,
    },
    taxID: BUSINESS_INFO.gstin,
    foundingDate: '2011',
    areaServed: [
      {
        '@type': 'City',
        name: 'Salem',
      },
      {
        '@type': 'State',
        name: 'Tamil Nadu',
      },
    ],
    priceRange: '₹₹',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:30',
        closes: '19:30',
      },
    ],
    brand: [
      { '@type': 'Brand', name: 'TATA TISCON' },
      { '@type': 'Brand', name: 'SURYADEV' },
      { '@type': 'Brand', name: 'AGNI' },
      { '@type': 'Brand', name: 'SSI TMT' },
      { '@type': 'Brand', name: 'JPR' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Supported TMT Rebar Diameters',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '8mm TMT Steel Rebars' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '10mm TMT Steel Rebars' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '12mm TMT Steel Rebars' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '16mm TMT Steel Rebars' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '20mm TMT Steel Rebars' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: '25mm TMT Steel Rebars' } },
      ],
    },
  };
}
