import React from 'react';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactInfoCard } from '@/components/contact/ContactInfoCard';
import { ContactForm } from '@/components/contact/ContactForm';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { MapPin, Navigation } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Contact Salem Yard — Thirupathi Steels Office & Weighbridge',
  description:
    'Contact Thirupathi Steels yard office in Salem, Tamil Nadu: T.S. No: 153/3-A, Chennai Bye Pass Road, Seelanaickenpatti. Phone: 90034 61089 / 95973 90271. GSTIN: 33AAHFT1872C1ZF.',
  canonicalUrl: '/contact',
});

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Hero */}
      <PageHero
        badge="SALEM YARD OFFICE & DISPATCH"
        title="Contact Thirupathi Steels"
        description="Connect with our Salem sales and weighbridge desk for real-time steel price locks, freight quotes across Western Tamil Nadu, or direct yard directions."
        breadcrumbCurrent="Contact"
      />

      {/* Main Grid: Verified Info Cards + Accessible Form */}
      <Section background="neutral" className="py-12 border-b border-steel-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Verified Business Info */}
          <div className="lg:col-span-5">
            <ContactInfoCard />
          </div>

          {/* Right: Contact / Quote Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </Section>

      {/* Location / Yard Map Reference Section */}
      <Section background="white">
        <SectionHeading
          badge="FIND US IN SALEM"
          title="Yard Location & Route Directions"
          subtitle="Direct arterial access along the Chennai Bye Pass Road for hassle-free transport flatbed entry and weighbridge access."
        />

        <div className="rounded-xl border border-steel-200 bg-neutral p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand flex items-center justify-center flex-shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-accent">Address Reference</h4>
                <p className="text-sm text-steel-700">
                  {BUSINESS_INFO.address.full}
                </p>
                <p className="text-xs text-steel-500 mt-0.5">
                  GSTIN: <strong className="text-accent">{BUSINESS_INFO.gstin}</strong> • Landmark: Near Seelanaickenpatti Bypass Junction
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Seelanaickenpatti+Salem+Tamil+Nadu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-steel-300 text-accent hover:text-brand hover:border-brand text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-brand" />
              <span>Open in Google Maps</span>
            </a>
          </div>

          <div className="rounded-lg overflow-hidden border border-steel-200 aspect-[21/9] relative bg-steel-100 flex items-center justify-center text-steel-500 text-xs">
            <div className="text-center p-4">
              <MapPin className="w-8 h-8 text-brand mx-auto mb-2 animate-bounce" />
              <p className="font-bold text-accent text-sm">Thirupathi Steels Yard Location</p>
              <p className="text-xs text-steel-600 mt-0.5">{BUSINESS_INFO.address.street}, {BUSINESS_INFO.address.city} – {BUSINESS_INFO.address.postalCode}</p>
              <p className="text-[11px] text-steel-500 mt-1 font-mono">Coordinates: 11.63° N, 78.14° E (Salem)</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
