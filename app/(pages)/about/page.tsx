import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CTASection } from '@/components/ui/CTASection';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { ShieldCheck, Target, Eye, Award, CheckCircle2, Building2 } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'About Thirupathi Steels — Established in 2011 | Salem, Tamil Nadu',
  description:
    'Established in 2011, Thirupathi Steels is Salem’s trusted TMT steel retailer and stockist, supplying quality primary and secondary TMT rebars for durable civil construction.',
  canonicalUrl: '/about',
});

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="ESTABLISHED 2011 • SALEM"
        title="Dependable TMT Steel Supply for Stronger Foundations"
        description="Providing builders, contractors, and engineers across Salem and Western Tamil Nadu with authentic, high-ductility reinforcement steel."
        breadcrumbCurrent="About Us"
      />

      {/* Business Introduction & History */}
      <Section background="white" className="border-b border-steel-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Our Journey & Roots
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-accent tracking-tight leading-tight">
              A Trusted Steel Partner in Salem Since {BUSINESS_INFO.establishedYear}
            </h2>

            <p className="text-sm sm:text-base text-steel-700 leading-relaxed">
              Founded in {BUSINESS_INFO.establishedYear}, <strong className="text-accent">Thirupathi Steels</strong> has built a lasting reputation on reliability, transparency, and product excellence in Salem, Tamil Nadu. Over the past 15+ years, we have emerged as a dedicated stockist of leading primary and secondary TMT rebar brands.
            </p>

            <p className="text-sm sm:text-base text-steel-700 leading-relaxed">
              Our expansive stockyard facility on the Chennai Bye Pass Road in Seelanaickenpatti is equipped with computerized electronic weighbridge infrastructure and specialized rebar handling systems to preserve rib geometry and guarantee exact weight deliveries.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-accent">
                <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0" />
                <span>100% Genuine steel sourced from certified manufacturer rolling mills</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-accent">
                <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0" />
                <span>Zero weight discrepancy with computerized electronic weighment</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-accent">
                <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0" />
                <span>Manufacturer test certificates provided with every dispatch</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-neutral border border-steel-200 p-2 overflow-hidden shadow-card group hover:shadow-card-hover hover:border-brand/40 transition-all duration-300">
              <div className="relative h-80 sm:h-[420px] w-full rounded-xl overflow-hidden bg-steel-100">
                <Image
                  src="/images/about/thirupathi-steels-yard-entrance.jpg"
                  alt="Thirupathi Steels Salem Main Yard Entrance & Logistics Fleet"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Salem Yard & Delivery Fleet</span>
                </div>
              </div>
              <div className="p-3.5 text-center text-xs text-steel-700 font-semibold flex items-center justify-center gap-2">
                <span>Thirupathi Steels Commercial Yard • Seelanaickenpatti, Salem</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Mission & Vision */}
      <Section background="neutral" className="border-b border-steel-200">
        <SectionHeading
          badge="OUR CORE PURPOSE"
          title="Mission & Vision"
          subtitle="Guided by our commitment to customer service, structural safety, and verified steel standards."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Mission */}
          <div className="rounded-xl bg-white border border-steel-200 p-8 shadow-card flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-accent">Our Mission</h3>
              <p className="text-sm text-steel-700 leading-relaxed">
                To supply superior quality TMT reinforcement steel with absolute weight accuracy, genuine manufacturer test certificates, and prompt site dispatch, enabling builders in Salem and Western Tamil Nadu to construct safe and resilient structures.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="rounded-xl bg-white border border-steel-200 p-8 shadow-card flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-accent">Our Vision</h3>
              <p className="text-sm text-steel-700 leading-relaxed">
                To be the most respected and transparent TMT steel distributor in Tamil Nadu, recognized for our real-time stock transparency, ethical trading practices, and lasting customer partnerships.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Commitment to Quality & Service */}
      <Section background="white" className="border-b border-steel-200">
        <SectionHeading
          badge="OUR PROMISE"
          title="Commitment to Quality & Service"
          subtitle="Every rebar delivered from our Salem yard meets rigorous national standards."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-neutral border border-steel-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-accent mb-2">Certified Grade Compliance</h4>
            <p className="text-sm text-steel-600 leading-relaxed">
              All rebars conform to BIS 1786 specifications for Fe 500D and Fe 550D grades, ensuring optimal yield strength, ductility, and earthquake resistance.
            </p>
          </div>

          <div className="rounded-xl bg-neutral border border-steel-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-accent mb-2">Dedicated Storage & Handling</h4>
            <p className="text-sm text-steel-600 leading-relaxed">
              Bundles are stored under protective covers on elevated wooden/concrete sleepers to prevent ground moisture exposure and surface corrosion.
            </p>
          </div>

          <div className="rounded-xl bg-neutral border border-steel-200 p-6">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-accent mb-2">Customer-First Service</h4>
            <p className="text-sm text-steel-600 leading-relaxed">
              Experienced sales staff ready to assist with bar bending schedules, diameter recommendations, and transparent pricing.
            </p>
          </div>
        </div>
      </Section>

      {/* Conversion CTA */}
      <Section background="neutral">
        <CTASection
          title="Visit Our Salem Yard or Enquire Online"
          subtitle="We welcome structural consultants, contractors, and home builders for physical stock inspection and material verification."
        />
      </Section>
    </div>
  );
}
