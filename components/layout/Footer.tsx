import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { APPROVED_BRANDS } from '@/lib/constants/brands';
import { MapPin, Phone, MessageCircle, ShieldCheck, Scale, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-accent text-steel-200 border-t border-steel-700/80">
      {/* Trust & Quality Banner */}
      <div className="border-b border-steel-700/60 bg-accent-dark/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand/20 text-brand-300 border border-brand/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold">100% Genuine Certified Steel</h4>
                <p className="text-xs text-steel-300">Supplied with manufacturer test certificates & heat numbers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand/20 text-brand-300 border border-brand/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold">Accurate Weighbridge Bills</h4>
                <p className="text-xs text-steel-300">Exact computerized weighment slips on every consignment</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand/20 text-brand-300 border border-brand/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold">Serving Since 2011</h4>
                <p className="text-xs text-steel-300">15+ years of dependable TMT steel supply across Salem</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/images/logo/Teal T-S Steel Rebar Emblem-1.png"
                  alt="Thirupathi Steels Emblem"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                THIRUPATHI <span className="text-brand-300">STEELS</span>
              </span>
            </Link>

            <p className="text-sm text-steel-300 leading-relaxed max-w-sm">
              {BUSINESS_INFO.description}
            </p>

            <div className="pt-2 text-xs text-steel-300 space-y-1">
              <p><span className="text-white font-semibold">Established:</span> {BUSINESS_INFO.establishedYear}</p>
              <p><span className="text-white font-semibold">GSTIN:</span> {BUSINESS_INFO.gstin}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Website Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-300 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-300 transition-colors">About Thirupathi</Link>
              </li>
              <li>
                <Link href="/tmt-products" className="hover:text-brand-300 transition-colors">TMT Products</Link>
              </li>
              <li>
                <Link href="/live-stock" className="text-brand-300 font-semibold hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Live Yard Stock</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-brand-300 transition-colors">Approved Brands</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-brand-300 transition-colors">Yard Gallery</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-300 transition-colors">Contact Salem Yard</Link>
              </li>
            </ul>
          </div>

          {/* Approved Brands */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Approved Brands
            </h3>
            <ul className="space-y-2.5 text-sm">
              {APPROVED_BRANDS.map((b) => (
                <li key={b.id} className="text-steel-300">
                  <Link href="/brands" className="hover:text-brand-300 transition-colors">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Verified Salem Address & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Salem Yard Address
            </h3>

            <div className="flex items-start gap-2.5 text-sm text-steel-200">
              <MapPin className="w-4 h-4 text-brand-300 mt-1 flex-shrink-0" />
              <span>{BUSINESS_INFO.address.full}</span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-sm text-steel-200">
                <Phone className="w-4 h-4 text-brand-300 flex-shrink-0" />
                <a href={`tel:${BUSINESS_INFO.phones[0].tel}`} className="hover:text-white font-medium">
                  {BUSINESS_INFO.phones[0].display}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-steel-200">
                <Phone className="w-4 h-4 text-brand-300 flex-shrink-0" />
                <a href={`tel:${BUSINESS_INFO.phones[1].tel}`} className="hover:text-white font-medium">
                  {BUSINESS_INFO.phones[1].display}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-400 pt-1">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <a href={BUSINESS_INFO.whatsapp.link} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">
                  Direct WhatsApp Chat
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-steel-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-steel-400 gap-4">
          <p>© {new Date().getFullYear()} {BUSINESS_INFO.legalName}. All rights reserved.</p>
          <p>
            <span>{BUSINESS_INFO.tagline}</span>
            <span className="mx-2">•</span>
            <span className="text-steel-300">{BUSINESS_INFO.address.city}, Tamil Nadu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
