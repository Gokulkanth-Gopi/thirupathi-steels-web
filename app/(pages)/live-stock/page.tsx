import React from 'react';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { LiveStockBoard } from '@/components/stock/LiveStockBoard';
import { CTASection } from '@/components/ui/CTASection';
import { ShieldCheck, Scale, FileText } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Live Yard Stock Terminal — Real-Time TMT Inventory in Salem',
  description:
    'Monitor real-time physical TMT steel inventory at Thirupathi Steels Salem yard. Track active kilogram and metric tonnage, bar diameters, and certified lot availability.',
  canonicalUrl: '/live-stock',
});

export const dynamic = 'force-dynamic';

export default function LiveStockPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="REAL-TIME YARD TERMINAL"
        title="Live Yard Stock & Availability"
        description="Verify current physical inventory at our Salem yard before booking your orders. Every stock lot corresponds to verified weighbridge receipts and manufacturer batch test records."
        breadcrumbCurrent="Live Stock"
      />

      {/* Core Live Stock Terminal */}
      <Section background="neutral" className="py-10 border-b border-steel-200">
        <LiveStockBoard />
      </Section>

      {/* Stock Reliability Pillars */}
      <Section background="white" className="border-b border-steel-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-accent mb-2">Physical Weighbridge Audited</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              Tonnage counts are updated when consignments clear our Salem yard weighbridge, ensuring real-world availability.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-accent mb-2">Linked Inward Documentation</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              Every major consignment is backed by supplier invoice records and heat-specific chemical and physical test reports.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-neutral border border-steel-200">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-accent mb-2">Direct Vehicle Allocation</h3>
            <p className="text-sm text-steel-600 leading-relaxed">
              When confirmed, materials from available stock are loaded directly onto transport trailers for rapid site transit.
            </p>
          </div>
        </div>
      </Section>

      {/* Conversion Banner */}
      <Section background="neutral">
        <CTASection
          title="Need Immediate Dispatch of Available Stock?"
          subtitle="Call our Salem yard dispatch desk to lock in today's tonnage and schedule trailer loading."
        />
      </Section>
    </div>
  );
}
