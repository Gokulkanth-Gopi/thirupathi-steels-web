'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, LogOut, ExternalLink, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminHeaderProps {
  user?: {
    username: string;
    fullName: string;
    role: string;
  } | null;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const isStock = pathname.startsWith('/admin/live-stock');
  const isBills = pathname.startsWith('/admin/bills');

  return (
    <header className="bg-white border-b border-steel-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo & Portal Label */}
        <div className="flex items-center gap-6">
          <Link href="/admin/live-stock" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">
              TS
            </div>
            <div>
              <span className="font-extrabold text-accent text-sm tracking-tight block">
                THIRUPATHI STEELS
              </span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider block -mt-0.5">
                Yard Admin Portal
              </span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-steel-200">
            <Link
              href="/admin/live-stock"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isStock
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'text-steel-600 hover:text-accent hover:bg-steel-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Live Stock Yard</span>
            </Link>

            <Link
              href="/admin/bills"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isBills
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'text-steel-600 hover:text-accent hover:bg-steel-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bills & Documents</span>
            </Link>
          </nav>
        </div>

        {/* Right: User info & Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/live-stock"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-steel-600 hover:text-brand px-3 py-1.5 rounded-lg border border-steel-200 hover:border-brand/40 transition-colors"
          >
            <span>View Public Terminal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-steel-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-accent">{user.fullName}</div>
                <div className="text-[10px] text-steel-500 uppercase font-mono">{user.role}</div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Log out of Yard Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
