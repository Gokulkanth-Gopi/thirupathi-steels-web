import React from 'react';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GalleryGrid, GalleryItem } from '@/components/gallery/GalleryGrid';
import { CTASection } from '@/components/ui/CTASection';
import { getActiveGalleryImages } from '@/lib/db/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Stockyard & Logistics Gallery — Thirupathi Steels Salem',
  description:
    'Visual inspection of Thirupathi Steels Salem yard infrastructure, certified TMT rebar bundles, crane unloading bays, and delivery transit fleet.',
  canonicalUrl: '/gallery',
});

const STATIC_FALLBACK_IMAGES: GalleryItem[] = [
  {
    id: 'gal-yard-overview',
    title: 'Salem Main Stockyard & Rebar Storage Bays',
    category: 'Yard Infrastructure',
    image: '/images/home/steel-yard-hero.jpg',
    description:
      'Expansive covered storage facility housing primary and secondary TMT rebars under weather protection to preserve surface finish and rib sharpness.',
  },
  {
    id: 'gal-rebar-bundles',
    title: 'Factory-Tagged TMT Rebar Bundles',
    category: 'Certified Products',
    image: '/images/products/rebar-bundle.jpg',
    description:
      'Standard 12-meter bundles strapped with manufacturer inspection tags, heat identification numbers, and grade markings.',
  },
  {
    id: 'gal-fleet-logistics',
    title: 'Transit Fleet & Immediate Dispatch Logistics',
    category: 'Logistics Fleet',
    image: '/images/home/cta-banner.jpg',
    description:
      'Heavy transport trailers and commercial flatbeds loaded directly via overhead gantry systems for prompt delivery across Tamil Nadu.',
  },
  {
    id: 'gal-rebar-inspection',
    title: 'Thermo-Mechanically Treated Rebar Rib Profile',
    category: 'Quality Inspection',
    image: '/images/home/hero-bg.jpg',
    description:
      'Close-up examination of high-strength deformed rebar rib angles, guaranteeing superior adhesion with structural concrete.',
  },
];

export default async function GalleryPage() {
  let galleryItems = STATIC_FALLBACK_IMAGES;

  try {
    const dbImages = await getActiveGalleryImages();
    if (dbImages && dbImages.length > 0) {
      galleryItems = dbImages.map((img) => ({
        id: img.id,
        title: img.title,
        category: img.category,
        image: img.image_url,
        description: img.description || '',
      }));
    }
  } catch (err) {
    console.warn('Fallback to static gallery images due to DB fetch error:', err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="SALEM YARD OPERATIONS"
        title="Stockyard Facility & Fleet Gallery"
        description="Authentic photographs of our Salem yard facility, heavy overhead gantry cranes, protected rebar bays, and delivery logistics."
        breadcrumbCurrent="Gallery"
      />

      {/* Gallery Section */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="FACILITY TOUR"
          title="Inside Thirupathi Steels Stockyard"
          subtitle="All photographs represent actual yard facilities, handling equipment, and genuine rebar inventory in Salem."
        />

        <GalleryGrid items={galleryItems} />
      </Section>

      {/* CTA */}
      <Section background="neutral">
        <CTASection
          title="Schedule an In-Person Yard Inspection"
          subtitle="We welcome builders, contractors, and structural engineers to visit our Seelanaickenpatti yard for physical bundle and weighment verification."
        />
      </Section>
    </div>
  );
}
