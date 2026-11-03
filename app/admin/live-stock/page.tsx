'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { AdminStockEntryForm } from '@/components/admin/AdminStockEntryForm';
import { AdminStockTable } from '@/components/admin/AdminStockTable';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  Package,
  ArrowUpRight,
} from 'lucide-react';

function LiveStockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [user, setUser] = useState<{ id: string; username: string; fullName: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);

  const [lots, setLots] = useState<any[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [metrics, setMetrics] = useState<any | null>(null);

  async function checkAuthAndLoad() {
    try {
      setCheckingAuth(true);
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.authenticated) {
        router.push('/admin/login');
        return;
      }
      setUser(json.user);
      await loadStockData();
    } catch (err) {
      console.error('Auth verification failed:', err);
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadStockData() {
    try {
      setLoadingLots(true);
      const res = await fetch('/api/stock', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setLots(json.data || []);
        setMetrics(json.metrics || null);
      }
    } catch (err) {
      console.error('Failed to load lots:', err);
    } finally {
      setLoadingLots(false);
    }
  }

  useEffect(() => {
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-sm font-semibold text-accent">Verifying Staff Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <SaasAdminLayout lotsCount={lots.length}>
      <div className="space-y-6">
        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-accent">Salem Yard Physical Inventory Management</h1>
            <p className="text-xs text-steel-500 mt-1">
              Authoritative PostgreSQL stock register. All inward entries and sales adjustments create immutable audit movements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStockData}
              className="bg-white cursor-pointer"
              title="Refresh table"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLots ? 'animate-spin text-brand' : ''}`} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEntryForm(!showEntryForm)}
              className="cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{showEntryForm ? 'Hide Entry Form' : 'New Inward Lot'}</span>
            </Button>
          </div>
        </div>

        {/* Metrics Banner - Dashboard Visual Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Total Yard Stock
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 transition-transform group-hover:scale-110">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {metrics ? `${metrics.totalQuantityMt.toLocaleString()} MT` : '...'}
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{metrics ? `${metrics.totalQuantityKg.toLocaleString('en-IN')} kg balance` : '...'}</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                Ready Lots
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-emerald-700 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics ? `${metrics.inStockLotsCount}` : '...'}
                <span className="text-base font-bold text-steel-500 ml-1.5 font-sans">Lots</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>&gt; 1,500 kg threshold</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                Low Stock Alerts
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-amber-700 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-amber-700 font-mono tracking-tight">
                {metrics ? `${metrics.lowStockLotsCount}` : '...'}
                <span className="text-base font-bold text-steel-500 ml-1.5 font-sans">Lots</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>&le; 1,500 kg threshold</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                PostgreSQL Security
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-brand group-hover:text-brand-700 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                <span>Row-Locking Active</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span>Atomic ledger logging</span>
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible New Stock Entry Form */}
        {showEntryForm && (
          <AdminStockEntryForm
            onSuccess={() => {
              loadStockData();
              setShowEntryForm(false);
            }}
          />
        )}

        {/* Inventory Register Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand" />
            <h2 className="text-base font-bold text-accent">Active Yard Inventory Lots</h2>
          </div>

          <AdminStockTable
            lots={lots}
            initialSearch={initialSearch}
            onRefresh={loadStockData}
          />
        </div>
      </div>
    </SaasAdminLayout>
  );
}

export default function AdminLiveStockPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
            <p className="text-sm font-semibold text-accent">Loading Yard Inventory Lots...</p>
          </div>
        </div>
      }
    >
      <LiveStockContent />
    </Suspense>
  );
}
