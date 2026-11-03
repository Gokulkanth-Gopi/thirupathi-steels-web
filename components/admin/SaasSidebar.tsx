'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Scale,
  Layers,
  Database,
  Ruler,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

interface SaasSidebarProps {
  lotsCount?: number;
  billsCount?: number;
  movementsCount?: number;
  baysCount?: number;
  onCloseMobile?: () => void;
}

export function SaasSidebar({
  lotsCount = 0,
  billsCount = 0,
  movementsCount = 0,
  baysCount,
  onCloseMobile,
}: SaasSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  const isDashboard = pathname === '/admin' || pathname === '/admin/';
  const isStock = pathname.startsWith('/admin/live-stock');
  const isBills = pathname.startsWith('/admin/bills');
  const isBays = pathname.startsWith('/admin/bays');
  const isMovements = pathname.startsWith('/admin/movements');
  const isSizes = pathname.startsWith('/admin/sizes');
  const isBrands = pathname.startsWith('/admin/brands');
  const isGallery = pathname.startsWith('/admin/gallery');
  const isSettings = pathname.startsWith('/admin/settings');

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      active: isDashboard,
      badge: null,
    },
    {
      title: 'Live Stock Lots',
      href: '/admin/live-stock',
      icon: Package,
      active: isStock,
      badge: lotsCount !== undefined ? String(lotsCount) : null,
      badgeColor: isStock ? 'bg-[#0c4a3b] text-white' : 'bg-steel-100 text-steel-700',
    },
    {
      title: 'Inward Bills & Invoices',
      href: '/admin/bills',
      icon: FileText,
      active: isBills,
      badge: billsCount !== undefined ? String(billsCount) : null,
      badgeColor: isBills ? 'bg-[#0c4a3b] text-white' : 'bg-steel-100 text-steel-700',
    },
    {
      title: 'Yard Bays & Slots',
      href: '/admin/bays',
      icon: Layers,
      active: isBays,
      badge: baysCount !== undefined ? `${baysCount} Bays` : 'Bays Map',
      badgeColor: isBays ? 'bg-[#0c4a3b] text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      title: 'Audit Movements',
      href: '/admin/movements',
      icon: History,
      active: isMovements,
      badge: movementsCount !== undefined ? String(movementsCount) : null,
      badgeColor: isMovements ? 'bg-[#0c4a3b] text-white' : 'bg-steel-100 text-steel-700',
    },
  ];

  const contentItems = [
    {
      title: 'Sizes & Diameters',
      href: '/admin/sizes',
      icon: Ruler,
      active: isSizes,
      badge: 'Public',
      badgeColor: isSizes ? 'bg-[#0c4a3b] text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      title: 'Brands & Logos',
      href: '/admin/brands',
      icon: Award,
      active: isBrands,
      badge: 'Public',
      badgeColor: isBrands ? 'bg-[#0c4a3b] text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      title: 'Media Gallery',
      href: '/admin/gallery',
      icon: ImageIcon,
      active: isGallery,
      badge: 'Public',
      badgeColor: isGallery ? 'bg-[#0c4a3b] text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-steel-200/80 h-full overflow-y-auto flex flex-col justify-between p-5 select-none scrollbar-thin">
      <div>
        {/* Brand Logo Header */}
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-3 px-2 py-2.5 mb-6 rounded-2xl hover:bg-steel-50/80 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all cursor-pointer group"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border border-emerald-100/90 p-1 flex items-center justify-center shadow-2xs flex-shrink-0 group-hover:scale-105 group-hover:border-emerald-300 group-hover:shadow-xs transition-all duration-200">
            <Image
              src="/images/logo/Teal T and Steel S Emblem-4.png"
              alt="Thirupathi Steels Logo"
              width={38}
              height={38}
              className="object-contain w-full h-full drop-shadow-2xs"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-[#111827] text-base tracking-tight leading-none flex items-center gap-1.5">
              <span>Thirupathi</span>
              <span className="text-emerald-700 font-black">Steels</span>
            </div>
            <div className="text-[10px] font-semibold text-steel-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Salem Yard Portal</span>
            </div>
          </div>
        </Link>

        {/* OPERATIONS Group */}
        <div className="space-y-1 mb-6">
          <div className="text-[10px] font-bold text-steel-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Yard Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  item.active
                    ? 'bg-[#eaf4ef] text-[#0c4a3b] font-bold shadow-2xs'
                    : 'text-steel-600 hover:text-steel-900 hover:bg-steel-50/80'
                }`}
              >
                {item.active && (
                  <span className="absolute -left-5 top-2.5 bottom-2.5 w-1.5 bg-[#0c4a3b] rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      item.active ? 'text-[#0c4a3b]' : 'text-steel-400 group-hover:text-steel-700'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* CATALOG & PUBLIC CONTENT Group */}
        <div className="space-y-1 mb-6">
          <div className="text-[10px] font-bold text-steel-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Catalog & Public Content
          </div>

          {contentItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  item.active
                    ? 'bg-[#eaf4ef] text-[#0c4a3b] font-bold shadow-2xs'
                    : 'text-steel-600 hover:text-steel-900 hover:bg-steel-50/80'
                }`}
              >
                {item.active && (
                  <span className="absolute -left-5 top-2.5 bottom-2.5 w-1.5 bg-[#0c4a3b] rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      item.active ? 'text-[#0c4a3b]' : 'text-steel-400 group-hover:text-steel-700'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* SYSTEM & GENERAL Group */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-steel-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Management & System
          </div>

          <Link
            href="/admin/settings"
            onClick={onCloseMobile}
            className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isSettings
                ? 'bg-[#eaf4ef] text-[#0c4a3b] font-bold shadow-2xs'
                : 'text-steel-600 hover:text-steel-900 hover:bg-steel-50/80'
            }`}
          >
            {isSettings && (
              <span className="absolute -left-5 top-2.5 bottom-2.5 w-1.5 bg-[#0c4a3b] rounded-r-full" />
            )}
            <div className="flex items-center gap-3">
              <Settings
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isSettings ? 'text-[#0c4a3b]' : 'text-steel-400 group-hover:text-steel-700'
                }`}
              />
              <span>Yard & System Settings</span>
            </div>
          </Link>

          <Link
            href="/live-stock"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-steel-600 hover:text-steel-900 hover:bg-steel-50/80 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-steel-400 transition-transform group-hover:scale-110" />
              <span>Public Stock Terminal</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase">
              Live ↗
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-all text-left cursor-pointer mt-1"
          >
            <LogOut className="w-4 h-4 text-rose-500 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout Session</span>
          </button>
        </div>
      </div>

      {/* Bottom Live System Indicator */}
      {/* <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#0c382b] via-[#092d22] to-[#041a13] text-white relative overflow-hidden shadow-lg shadow-[#0c382b]/25 group">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border border-emerald-500/20 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -right-2 -bottom-2 w-20 h-20 rounded-full border border-emerald-400/25 pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Scale className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div>
            <h4 className="font-bold text-xs text-white">Weighbridge Gate 1</h4>
            <p className="text-[10px] text-emerald-200/80 leading-relaxed mt-0.5">
              PostgreSQL 18 database connected. Gross & Tare balance synced.
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/admin/settings"
              className="w-full py-1.5 px-3 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer text-center"
            >
              <Database className="w-3.5 h-3.5" />
              <span>System Status</span>
            </Link>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
