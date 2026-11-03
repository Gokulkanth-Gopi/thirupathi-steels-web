'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Command,
  Plus,
  Package,
  FileText,
  Layers,
  History,
  Settings,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Scale,
  X,
  ExternalLink,
} from 'lucide-react';

interface SaasHeaderProps {
  user?: {
    username: string;
    fullName: string;
    role: string;
  } | null;
  onSearchChange?: (val: string) => void;
  onQuickNewLot?: () => void;
}

export function SaasHeader({ user, onSearchChange, onQuickNewLot }: SaasHeaderProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchValue, setSearchValue] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);

  // Keyboard shortcut Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowQuickActionMenu(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchValue(val);
    setShowSearchDropdown(val.trim().length > 0);
    if (onSearchChange) onSearchChange(val);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    router.push(`/admin/live-stock?search=${encodeURIComponent(searchValue.trim())}`);
    setShowSearchDropdown(false);
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  return (
    <header className="h-16 md:h-20 bg-white border-b border-steel-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-steel-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={handleSearch}
            onFocus={() => {
              if (searchValue.trim().length > 0) setShowSearchDropdown(true);
            }}
            placeholder="Search lot #, brand, diameter (12mm), bay..."
            className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] focus:bg-white text-xs text-steel-800 placeholder-steel-400 rounded-full pl-10 pr-16 py-2.5 border border-steel-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs"
          />
          <div className="absolute right-3 flex items-center gap-1 text-[10px] font-mono font-bold text-steel-400 bg-white px-1.5 py-0.5 rounded border border-steel-200 shadow-2xs pointer-events-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </form>

        {/* Search Quick Dropdown */}
        {showSearchDropdown && searchValue.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-steel-200 p-2 z-50 animate-saas-in space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-steel-400 tracking-wider flex items-center justify-between">
              <span>Quick Navigation Results</span>
              <button
                type="button"
                onClick={() => setShowSearchDropdown(false)}
                className="text-steel-400 hover:text-steel-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <Link
              href={`/admin/live-stock?search=${encodeURIComponent(searchValue)}`}
              onClick={() => setShowSearchDropdown(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-emerald-50 text-steel-700 hover:text-emerald-950 transition-colors"
            >
              <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Search Live Lots:</span> &ldquo;{searchValue}&rdquo;
              </div>
            </Link>

            <Link
              href={`/admin/bills?search=${encodeURIComponent(searchValue)}`}
              onClick={() => setShowSearchDropdown(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-blue-50 text-steel-700 hover:text-blue-950 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Search Supplier Invoices:</span> &ldquo;{searchValue}&rdquo;
              </div>
            </Link>

            <Link
              href={`/admin/movements?search=${encodeURIComponent(searchValue)}`}
              onClick={() => setShowSearchDropdown(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-amber-50 text-steel-700 hover:text-amber-950 transition-colors"
            >
              <History className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Search Audit Ledger:</span> &ldquo;{searchValue}&rdquo;
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
            aria-label="Quick Actions"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0c4a3b] hover:bg-[#073328] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Action</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showQuickActionMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-steel-200 p-1.5 z-50 animate-saas-in space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-steel-400">
                Yard Actions
              </div>

              {onQuickNewLot ? (
                <button
                  onClick={() => {
                    setShowQuickActionMenu(false);
                    onQuickNewLot();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Record Inward Stock Lot</span>
                </button>
              ) : (
                <Link
                  href="/admin/live-stock"
                  onClick={() => setShowQuickActionMenu(false)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Record Inward Stock Lot</span>
                </Link>
              )}

              <Link
                href="/admin/bills"
                onClick={() => setShowQuickActionMenu(false)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>New Inward Bill / Ticket</span>
              </Link>

              <Link
                href="/admin/bays"
                onClick={() => setShowQuickActionMenu(false)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-teal-600" />
                <span>View Yard Bays Map</span>
              </Link>

              <Link
                href="/admin/movements"
                onClick={() => setShowQuickActionMenu(false)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-amber-600" />
                <span>View Movement Audit Log</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-steel-200/90 hover:border-steel-300 flex items-center justify-center text-steel-500 hover:text-steel-800 hover:bg-steel-50 transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-steel-200 p-4 z-50 animate-saas-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-steel-100">
                <span className="font-bold text-xs text-steel-900">Live Yard Notifications</span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-emerald-950">PostgreSQL 18 Connected</div>
                    <div className="text-[11px] text-emerald-800">
                      Authoritative inventory ledger online on port 5432. All dummy records cleared.
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-blue-950">Weighbridge Gate 1 Ready</div>
                    <div className="text-[11px] text-blue-800">
                      Gross & Tare scale calibrated for new inward deliveries and dispatches.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill with Dropdown */}
        <div className="relative pl-2 border-l border-steel-200/80">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 hover:bg-steel-50 p-1 rounded-full sm:rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 p-0.5 shadow-2xs">
              <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center text-white font-extrabold text-xs">
                {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'SY'}
              </div>
            </div>

            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-bold text-steel-900 leading-tight">
                {user?.fullName || 'Salem Yard Administrator'}
              </div>
              <div className="text-[10px] text-steel-500 font-mono leading-tight">
                {user?.role === 'admin' ? 'Yard Administrator' : 'Dispatch Manager'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-steel-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-steel-200 p-2 z-50 animate-saas-in space-y-1">
              <div className="px-3 py-2 border-b border-steel-100">
                <div className="font-bold text-xs text-steel-900">{user?.fullName || 'Salem Yard Admin'}</div>
                <div className="text-[11px] text-steel-500 font-mono">{user?.username || 'admin'}@thirupathi</div>
              </div>

              <Link
                href="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-steel-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-steel-500" />
                <span>Yard & System Settings</span>
              </Link>

              <Link
                href="/live-stock"
                target="_blank"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-steel-700 hover:bg-steel-50 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-steel-500" />
                <span>Public Stock Terminal</span>
              </Link>

              <div className="pt-1 border-t border-steel-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
