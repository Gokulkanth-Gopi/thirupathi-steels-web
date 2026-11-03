import React from 'react';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductCard } from '@/components/products/ProductCard';
import { CTASection } from '@/components/ui/CTASection';
import { Button } from '@/components/ui/Button';
import { SUPPORTED_PRODUCTS, ProductCatalogueItem } from '@/lib/constants/products';
import { getActiveDiameters } from '@/lib/db/content';
import { ArrowRight, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'TMT Products — 8mm, 10mm, 12mm, 16mm, 20mm & 25mm Rebars',
  description:
    'Explore supported TMT rebar diameters (8mm to 25mm) available at Thirupathi Steels, Salem. Certified Fe 550D and Fe 500D high-ductility reinforcement steel.',
  canonicalUrl: '/tmt-products',
});

export default async function TmtProductsPage() {
  let productsList: ProductCatalogueItem[] = SUPPORTED_PRODUCTS;

  try {
    const dbDiameters = await getActiveDiameters();
    if (dbDiameters && dbDiameters.length > 0) {
      productsList = dbDiameters.map((d) => {
        const existingStatic = SUPPORTED_PRODUCTS.find((p) => p.diameterMm === d.diameter_mm);
        const grades = d.standard_grades
          ? d.standard_grades.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Fe 550D', 'Fe 500D'];

        const apps = d.key_applications
          ? typeof d.key_applications === 'string'
            ? d.key_applications.split(',').map((s) => s.trim()).filter(Boolean)
            : d.key_applications
          : existingStatic?.keyApplications || ['Structural RCC framing', 'Load bearing elements'];

        return {
          id: d.id,
          diameterMm: d.diameter_mm,
          name: `${d.diameter_mm} mm TMT Rebars`,
          category: 'TMT Reinforcement Steel',
          standardGrades: grades,
          primaryUse: d.primary_use || existingStatic?.primaryUse || 'RCC Structural Framing',
          weightKgPerMeter: Number(d.weight_kg_per_meter),
          description:
            d.description ||
            existingStatic?.description ||
            `Standard ${d.diameter_mm} mm high-strength TMT rebar for residential and commercial construction.`,
          image: d.image || existingStatic?.image || '/images/products/rebar-bundle.jpg',
          keyApplications: apps,
        };
      });
    }
  } catch (err) {
    console.warn('Fallback to static products due to DB fetch error:', err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="TMT REINFORCEMENT STEEL"
        title="Comprehensive TMT Rebar Product Catalogue"
        description="Supplying standard certified construction rebar diameters from 8 mm ties to 25 mm infrastructure bars for residential and commercial RCC framing in Salem, Tamil Nadu."
        breadcrumbCurrent="TMT Products"
      />

      {/* Catalogue Notice Strip */}
      <div className="bg-brand-50 border-b border-brand-200 py-3 text-xs text-brand-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand flex-shrink-0" />
            <span>
              <strong>Note on Availability:</strong> Diameters listed below reflect our standard product catalogue. For real-time physical inventory, please refer to the Live Stock terminal.
            </span>
          </div>

          <Button href="/live-stock" variant="primary" size="sm" className="text-xs py-1">
            <span>View Live Yard Stock</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Product Cards Grid: Dynamic sizes from Database */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="SUPPORTED REBAR SIZES"
          title="All Confirmed TMT Diameters"
          subtitle="Click on any product to review standard grades, unit weight specifications, and check live yard availability."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      {/* Technical Rebar Specifications Table: Dynamic from Database */}
      <Section background="neutral" className="border-b border-steel-200">
        <SectionHeading
          badge="TECHNICAL REFERENCE"
          title="Standard Nominal Weight & Dimension Tolerances"
          subtitle="As per Bureau of Indian Standards (BIS 1786 : 2008) guidelines for high-strength deformed steel bars."
        />

        <div className="rounded-xl border border-steel-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-steel-700">
              <thead className="bg-neutral text-xs uppercase tracking-wider text-accent font-bold border-b border-steel-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Bar Diameter</th>
                  <th scope="col" className="px-5 py-3.5">Standard Nominal Weight</th>
                  <th scope="col" className="px-5 py-3.5">Permissible Tolerance</th>
                  <th scope="col" className="px-5 py-3.5">Standard Length</th>
                  <th scope="col" className="px-5 py-3.5">Primary Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-200/80">
                {productsList.map((prod) => (
                  <tr key={prod.id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-accent font-mono">
                      {prod.diameterMm} mm
                    </td>
                    <td className="px-5 py-3.5 font-mono text-steel-800">
                      {Number(prod.weightKgPerMeter).toFixed(3)} kg/m
                    </td>
                    <td className="px-5 py-3.5 text-steel-600">
                      {prod.diameterMm <= 10 ? '± 7%' : prod.diameterMm <= 16 ? '± 5%' : '± 3%'}
                    </td>
                    <td className="px-5 py-3.5 text-steel-600">
                      12 Meters (Standard)
                    </td>
                    <td className="px-5 py-3.5 text-steel-700">
                      {prod.primaryUse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section background="white">
        <CTASection
          title="Looking for Specific Rebar Sizes in Bulk?"
          subtitle="Our Salem sales desk can provide bundle counts, weight estimations, and customized freight quotations for your job site."
        />
      </Section>
    </div>
  );
}
