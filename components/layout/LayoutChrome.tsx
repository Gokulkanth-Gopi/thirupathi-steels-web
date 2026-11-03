'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface LayoutChromeProps {
  children: React.ReactNode;
}

/**
 * LayoutChrome conditionally renders the public marketing Header and Footer
 * only for public visitor routes (/ , /about, /tmt-products, /live-stock, etc.).
 *
 * For all /admin routes (/admin, /admin/live-stock, /admin/bills, /admin/login),
 * the public header and footer are omitted, allowing the standalone SaaS admin
 * shell (SaasSidebar + SaasHeader) to occupy full viewport real estate without clutter.
 */
export function LayoutChrome({ children }: LayoutChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  React.useEffect(() => {
    if (isAdmin) {
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-[#f8faf9]', 'text-slate-900');
    } else {
      document.body.classList.remove('bg-[#f8faf9]', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    }
  }, [isAdmin]);

  if (isAdmin) {
    return <main className="flex-grow w-full min-h-screen bg-[#f8faf9] text-slate-900">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
