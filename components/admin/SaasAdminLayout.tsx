'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SaasSidebar } from './SaasSidebar';
import { SaasHeader } from './SaasHeader';
import { Menu, X, ShieldCheck } from 'lucide-react';

interface SaasAdminLayoutProps {
  children: React.ReactNode;
  lotsCount?: number;
  billsCount?: number;
  movementsCount?: number;
  baysCount?: number;
  onSearchChange?: (val: string) => void;
  onQuickNewLot?: () => void;
}

export function SaasAdminLayout({
  children,
  lotsCount = 0,
  billsCount = 0,
  movementsCount = 0,
  baysCount: explicitBaysCount,
  onSearchChange,
  onQuickNewLot,
}: SaasAdminLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; fullName: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [baysCount, setBaysCount] = useState<number | undefined>(explicitBaysCount);

  useEffect(() => {
    async function verifyAuth() {
      try {
        setCheckingAuth(true);
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!json.authenticated) {
          router.push('/admin/login');
          return;
        }
        setUser(json.user);
      } catch (err) {
        console.error('Admin layout auth error:', err);
        router.push('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    }

    async function fetchBaysCount() {
      if (explicitBaysCount !== undefined) {
        setBaysCount(explicitBaysCount);
        return;
      }
      try {
        const res = await fetch('/api/bays', {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
        });
        const json = await res.json();
        if (json.success && json.data?.bays) {
          setBaysCount(json.data.bays.length);
        }
      } catch (e) {
        console.error('Failed to fetch bays count for sidebar:', e);
      }
    }

    verifyAuth();
    fetchBaysCount();
  }, [router, explicitBaysCount]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] flex items-center justify-center text-white shadow-lg animate-pulse">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-xs font-mono font-bold text-steel-600 tracking-wider">
          VERIFYING ADMIN CREDENTIALS...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F5F7] text-steel-800 flex flex-col md:flex-row antialiased selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Desktop Left Sidebar: Permanently fixed and stationary */}
      <div className="hidden md:flex flex-col h-screen shrink-0 sticky top-0 overflow-hidden z-20">
        <SaasSidebar
          lotsCount={lotsCount}
          billsCount={billsCount}
          movementsCount={movementsCount}
          baysCount={baysCount}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full flex flex-col">
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="absolute top-4 right-4 p-2 text-steel-500 hover:text-steel-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <SaasSidebar
            lotsCount={lotsCount}
            billsCount={billsCount}
            movementsCount={movementsCount}
            baysCount={baysCount}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        </div>
      </div>

      {/* Main Content Area: Independent scroll container */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden h-14 bg-white border-b border-steel-200 px-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="p-1.5 text-steel-700 hover:bg-steel-50 rounded-lg cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-xs font-extrabold text-[#111827]">Thirupathi Steels Portal</div>
          <div className="w-6" />
        </div>

        {/* Desktop Top Header Bar */}
        <div className="shrink-0">
          <SaasHeader
            user={user}
            onSearchChange={onSearchChange}
            onQuickNewLot={onQuickNewLot}
          />
        </div>

        {/* Scrollable Page Body with Clean Inner Margins */}
        <main className="flex-1 p-5 sm:p-7 lg:p-9 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
