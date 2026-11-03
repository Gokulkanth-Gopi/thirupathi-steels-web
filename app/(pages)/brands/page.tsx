import React from 'react';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { BrandCard } from '@/components/brands/BrandCard';
import { CTASection } from '@/components/ui/CTASection';
import { APPROVED_BRANDS } from '@/lib/constants/brands';
import { getActiveBrands } from '@/lib/db/content';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Approved Brands — Tata Tiscon, Suryadev, Agni, SSI & JPR',
  description:
    'Authorized TMT steel brands distributed by Thirupathi Steels, Salem: TATA TISCON, SURYADEV, AGNI, SSI TMT, and JPR. 100% genuine rebars with mill test certificates.',
  canonicalUrl: '/brands',
});

export default async function BrandsPage() {
  let brandsList: any[] = APPROVED_BRANDS;
  try {
    const dbBrands = await getActiveBrands();
    if (dbBrands && dbBrands.length > 0) {
      brandsList = dbBrands;
    }
  } catch (err) {
    console.warn('Fallback to static approved brands:', err);
  }
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="CERTIFIED MILL PARTNERSHIPS"
        title="Approved TMT Steel Manufacturers"
        description="Partnering with India’s foremost primary and certified secondary producers to supply genuine reinforcement steel with full quality traceability in Salem, Tamil Nadu."
        breadcrumbCurrent="Brands"
      />

      {/* Quality Standards Strip */}
      <div className="bg-brand-50 border-b border-brand-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-accent">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>All brands conform to BIS 1786 : 2008 standards</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Genuine mill embossed logos & heat number tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Original manufacturer test certificates supplied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brands Grid: TATA TISCON, SURYADEV, AGNI, SSI TMT, JPR */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="OUR BRAND PORTFOLIO"
          title="Approved Steel Producers"
          subtitle="Explore the mechanical characteristics, grade certifications, and specific applications for each authorized brand."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandsList.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </Section>

      {/* Primary vs Secondary Explanation */}
      <Section background="neutral" className="border-b border-steel-200">
        <SectionHeading
          badge="MATERIAL GUIDE"
          title="Understanding Primary & Secondary Steel"
          subtitle="Selecting the right grade and production route for your structural requirements."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-accent">Primary Steel (e.g. TATA TISCON)</h3>
              <span className="text-xs font-bold text-brand bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Virgin Iron Ore
              </span>
            </div>
            <p className="text-sm text-steel-700 leading-relaxed mb-4">
              Manufactured through blast furnaces from virgin iron ore. Delivers ultra-low levels of sulfur and phosphorus, resulting in supreme ductility and high energy absorption during seismic events. Ideal for high-rise frames and critical infrastructure.
            </p>
            <div className="text-xs text-steel-600 space-y-1">
              <p>• Recommended: Multi-storey towers, bridge structures, basements</p>
              <p>• Grade: Fe 550D Super Ductile</p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-steel-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-accent">Secondary Steel (e.g. SURYADEV, AGNI)</h3>
              <span className="text-xs font-bold text-steel-700 bg-neutral px-2 py-0.5 rounded border border-steel-200">
                Thermex Quenching
              </span>
            </div>
            <p className="text-sm text-steel-700 leading-relaxed mb-4">
              Produced via induction furnaces with advanced thermo-mechanical treatment. Highly cost-effective while meeting strict BIS yield strength criteria. Universally preferred for residential housing, commercial complexes, and individual home builds.
            </p>
            <div className="text-xs text-steel-600 space-y-1">
              <p>• Recommended: Independent houses, villas, boundary walls, commercial RCC</p>
              <p>• Grade: Fe 550D / Fe 500D</p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section background="white">
        <CTASection
          title="Compare Brands & Secure Today's Prices"
          subtitle="Contact our Salem yard sales desk for brand-wise comparative pricing and freight estimates."
        />
      </Section>
    </div>
  );
}
