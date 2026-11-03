'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { BUSINESS_INFO } from '@/lib/constants/business';
import { Phone, MessageCircle, Menu, X, MapPin } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'TMT Products', href: '/tmt-products' },
  { label: 'Live Stock', href: '/live-stock', isLive: true },
  { label: 'Brands', href: '/brands' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-steel-200 shadow-sm">
      {/* Top Utility Bar: Salem Address + Direct Verified Phone Call */}
      <div className="hidden md:block bg-accent text-steel-200 text-xs py-2 border-b border-accent-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-steel-300">
              <MapPin className="w-3.5 h-3.5 text-brand-300 flex-shrink-0" />
              <span>{BUSINESS_INFO.address.street}, {BUSINESS_INFO.address.city} – {BUSINESS_INFO.address.postalCode}</span>
            </span>
            <span className="text-steel-600">|</span>
            <span className="text-brand-300 font-medium">
              Established 2011 • GSTIN: {BUSINESS_INFO.gstin}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${BUSINESS_INFO.phones[0].tel}`}
              className="text-white hover:text-brand-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Phone className="w-3 h-3 text-brand-300" />
              <span>{BUSINESS_INFO.phones[0].display}</span>
            </a>
            <span className="text-steel-600">|</span>
            <a
              href={`tel:${BUSINESS_INFO.phones[1].tel}`}
              className="text-steel-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{BUSINESS_INFO.phones[1].display}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Thirupathi Steels Logo */}
          <Link href="/" className="flex items-center gap-3.5 group cursor-pointer">
            <div className="relative w-12 h-12 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/images/logo/Teal T and Steel S Emblem-4.png"
                alt="Thirupathi Steels Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-accent group-hover:text-brand transition-colors">
                THIRUPATHI <span className="text-brand">STEELS</span>
              </span>
              <span className="text-[11px] tracking-wide text-steel-600 font-medium uppercase">
                Salem TMT Steel Retailer & Stockist
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href === '/tmt-products' && pathname === '/products');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'text-brand bg-brand-50 border-b-2 border-brand font-bold'
                      : 'text-accent hover:text-brand hover:bg-neutral'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {item.isLive && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        LIVE
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Header Action Buttons: WhatsApp & Call */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Button
              href={BUSINESS_INFO.whatsapp.link}
              variant="whatsapp"
              size="sm"
              className="hidden xl:inline-flex"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>

            <Button
              href="/live-stock"
              variant="primary"
              size="sm"
            >
              <span>Live Stock</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-accent hover:text-brand hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-steel-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href === '/tmt-products' && pathname === '/products');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand font-bold border-l-4 border-brand'
                    : 'text-accent hover:bg-neutral hover:text-brand'
                )}
              >
                <span>{item.label}</span>
                {item.isLive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-steel-200 flex flex-col gap-2.5">
            <Button
              href={BUSINESS_INFO.whatsapp.link}
              variant="whatsapp"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>WhatsApp Enquiry</span>
            </Button>

            <Button
              href={`tel:${BUSINESS_INFO.phones[0].tel}`}
              variant="outline"
              className="w-full justify-center"
            >
              <Phone className="w-4 h-4 mr-2 text-brand" />
              <span>Call: {BUSINESS_INFO.phones[0].display}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
