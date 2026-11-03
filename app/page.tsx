import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CTASection } from '@/components/ui/CTASection';
import { ProductCard } from '@/components/products/ProductCard';
import { BrandCard } from '@/components/brands/BrandCard';
import { LiveStockBoard } from '@/components/stock/LiveStockBoard';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { SUPPORTED_PRODUCTS } from '@/lib/constants/products';
import { APPROVED_BRANDS } from '@/lib/constants/brands';
import { getActiveBrands, getActiveDiameters } from '@/lib/db/content';
import {
  ShieldCheck,
  Scale,
  Clock,
  Truck,
  ArrowRight,
  Phone,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Thirupathi Steels — Quality TMT for a Stronger Tomorrow | Salem Stockist',
  description:
    'Thirupathi Steels is Salem’s trusted TMT steel stockist since 2011. Authorized distributor for TATA TISCON, SURYADEV, AGNI, SSI & JPR with verified live yard stock tracking.',
  canonicalUrl: '/',
});

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let brandsList: any[] = APPROVED_BRANDS;
  let featuredProducts: any[] = SUPPORTED_PRODUCTS.slice(0, 3);

  try {
    const dbBrands = await getActiveBrands();
    if (dbBrands && dbBrands.length > 0) {
      brandsList = dbBrands;
    }
  } catch (e) {
    console.warn('Fallback to static brands on homepage:', e);
  }

  try {
    const dbDiameters = await getActiveDiameters();
    if (dbDiameters && dbDiameters.length > 0) {
      featuredProducts = dbDiameters.slice(0, 3).map((d) => {
        const existingStatic = SUPPORTED_PRODUCTS.find((p) => p.diameterMm === d.diameter_mm);
        return {
          id: d.id,
          diameterMm: d.diameter_mm,
          name: `${d.diameter_mm} mm TMT Rebars`,
          category: 'TMT Reinforcement Steel',
          standardGrades: d.standard_grades ? d.standard_grades.split(',').map((s) => s.trim()) : ['Fe 550D', 'Fe 500D'],
          primaryUse: d.primary_use || existingStatic?.primaryUse || 'RCC Structural Framing',
          weightKgPerMeter: Number(d.weight_kg_per_meter),
          description: d.description || existingStatic?.description || `Standard ${d.diameter_mm} mm high-strength TMT rebar.`,
          image: d.image || existingStatic?.image || '/images/products/rebar-bundle.jpg',
          keyApplications: d.key_applications
            ? (typeof d.key_applications === 'string' ? d.key_applications.split(',').map((s) => s.trim()) : d.key_applications)
            : (existingStatic?.keyApplications || ['Structural RCC framing']),
        };
      });
    }
  } catch (e) {
    console.warn('Fallback to static products on homepage:', e);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section - Industrial Layout with Official Mascot/Visual */}
      <section className="relative bg-white border-b border-steel-200 overflow-hidden py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold uppercase tracking-wider text-brand">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>SALEM TMT STEEL STOCKIST • ESTABLISHED {BUSINESS_INFO.establishedYear}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-accent leading-[1.12]">
                QUALITY TMT FOR A <span className="text-brand">STRONGER TOMORROW</span>
              </h1>

              <p className="text-base sm:text-lg text-steel-700 leading-relaxed max-w-2xl">
                Salem’s dependable stockist for high-tensile TMT steel bars. Supplying certified Fe 550D primary & secondary rebars directly from approved manufacturers with transparent electronic weighbridge verification and live yard stock.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button href="/live-stock" variant="primary" size="lg">
                  <span>View Live Stock</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button href="/products" variant="outline" size="lg">
                  <span>Explore Products</span>
                </Button>

                <Button href={BUSINESS_INFO.whatsapp.link} variant="whatsapp" size="lg" className="hidden sm:inline-flex">
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  <span>WhatsApp Enquiry</span>
                </Button>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-6 border-t border-steel-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {BUSINESS_INFO.stats.map((stat, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="text-xl sm:text-2xl font-extrabold text-accent">{stat.value}</div>
                    <div className="text-xs font-bold text-steel-700">{stat.label}</div>
                    <div className="text-[11px] text-steel-500">{stat.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Approved Mascot & Stockyard Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-neutral border border-steel-200 p-3 shadow-card overflow-hidden">
                <div className="relative h-80 sm:h-96 w-full rounded-xl overflow-hidden bg-white">
                  <Image
                    src="/images/Mascot/Homepage/hero.png"
                    alt="Thirupathi Steels Mascot Quality Guarantee"
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="object-contain p-2"
                    priority
                  />
                </div>

                {/* Floating Yard Dispatch Notice */}
                <div className="mt-3 p-3.5 rounded-xl bg-accent text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-brand-200 uppercase tracking-wider">
                        Salem Yard Dispatch Desk
                      </div>
                      <div className="text-sm font-bold text-white">
                        {BUSINESS_INFO.phones[0].display}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/live-stock"
                    className="text-xs font-bold bg-brand hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Check Yard Stock →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Approved Brands Section */}
      <Section background="neutral" className="py-12 border-b border-steel-200">
        <SectionHeading
          badge="TRUSTED PARTNERSHIPS"
          title="Approved Steel Producers"
          subtitle="Direct distribution partnerships with verified primary and secondary TMT manufacturers in India."
          centered
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {brandsList.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl bg-white border border-steel-200/90 p-5 flex flex-col items-center justify-between text-center shadow-xs hover:border-brand/50 hover:shadow-md transition-all duration-200 group min-h-[190px]"
            >
              <div className="w-full h-20 sm:h-24 flex items-center justify-center p-2 mb-3 bg-neutral-50/60 rounded-xl group-hover:bg-neutral-50 transition-colors">
                <div className="relative w-full h-full max-w-[140px] max-h-[64px]">
                  {b.logo ? (
                    <Image
                      src={b.logo}
                      alt={`${b.name} Logo`}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                      className="object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <span className="font-mono text-xs font-black text-steel-400">{b.name}</span>
                  )}
                </div>
              </div>
              <div className="w-full mt-auto pt-2 border-t border-steel-100/70">
                <span className="text-sm font-extrabold text-accent block leading-tight tracking-tight">{b.name}</span>
                <span className="text-[11px] text-steel-500 font-medium mt-1 block">{b.category}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Live Stock Promotional & Transparency Section */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="LIVE INVENTORY TERMINAL"
          title="Real-Time Salem Yard Stock"
          subtitle="Check current rebar availability before booking. Every entry corresponds to verified physical inventory in our Salem bays."
          centered
        />

        <LiveStockBoard />
      </Section>

      {/* 4. Product Catalogue Overview */}
      <Section background="neutral" className="border-b border-steel-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-4">
          <SectionHeading
            badge="TMT REINFORCEMENT"
            title="Standard Construction Diameters"
            subtitle="Full range of certified rebar sizes from 8 mm ties to 25 mm infrastructure rebars."
            className="mb-0"
          />

          <Button href="/products" variant="primary" size="sm" className="self-start sm:self-auto">
            <span>View Full Product Catalogue</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      {/* 5. Trust Indicators & Business Strengths */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="THE THIRUPATHI ADVANTAGE"
          title="Built on Integrity, Accuracy & Reliability"
          subtitle="Serving structural engineers, building contractors, and individual home builders across Salem since 2011."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-accent mb-2">Zero Weight Discrepancies</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              Certified computerized electronic weighbridge on-site in Salem. You receive exact mill tare and gross weight slips on every vehicle dispatch.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-accent mb-2">Mill Test Certificates (MTC)</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              Authentic batch-wise chemical and physical mechanical test reports directly from Tata Tiscon, Suryadev, Agni, and SSI supplied with invoices.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-accent mb-2">Dependable Supply Since 2011</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              15+ years of verified business reputation in Salem, Tamil Nadu with direct plant logistics and customer-first service.
            </p>
          </div>
        </div>
      </Section>

      {/* 6. Contact & WhatsApp Conversion Banner */}
      <Section background="neutral">
        <CTASection />
      </Section>
    </div>
  );
}
