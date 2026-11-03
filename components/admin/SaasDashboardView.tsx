'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  TrendingUp,
  Package,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Scale,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Truck,
  Activity,
  Layers,
  Building2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StockLot {
  id: string;
  lot_number?: string;
  lotNumber?: string;
  brand_name?: string;
  brandName?: string;
  diameter_mm?: number;
  diameterMm?: number;
  grade?: string;
  quantity_kg?: number;
  availableWeightKg?: number;
  quantity_mt?: number;
  availableWeightMt?: number;
  bay_number?: string;
  yardBayLocation?: string;
  stock_status?: string;
  stockStatus?: string;
}

interface SaasDashboardViewProps {
  lots: StockLot[];
  metrics: {
    totalQuantityKg?: number;
    totalQuantityMt?: number;
    totalStockKg?: number;
    totalStockMt?: number;
    totalLotsCount?: number;
    inStockLotsCount?: number;
    lowStockLotsCount?: number;
    outOfStockLotsCount?: number;
    lastUpdatedAt?: string;
  } | null;
  billsCount?: number;
  onRefresh?: () => void;
  onOpenConsignmentModal?: () => void;
  onOpenAdjustModal?: () => void;
}

export function SaasDashboardView({
  lots,
  metrics,
  billsCount = 0,
  onRefresh,
  onOpenConsignmentModal,
  onOpenAdjustModal,
}: SaasDashboardViewProps) {
  // Live ticking clock state for the "Time Tracker" card
  const [timeString, setTimeString] = useState('14:00:00');
  const [isClockRunning, setIsClockRunning] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    if (!isClockRunning) return;
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isClockRunning]);

  const rawMt = metrics?.totalQuantityMt ?? metrics?.totalStockMt ?? 0;
  const totalMt = typeof rawMt === 'number' ? rawMt.toFixed(2) : String(rawMt);
  const rawKg = metrics?.totalQuantityKg ?? metrics?.totalStockKg ?? 0;
  const totalKg = typeof rawKg === 'number' ? rawKg.toLocaleString('en-IN') : String(rawKg);
  const readyLots = metrics?.inStockLotsCount ?? 0;
  const lowStock = metrics?.lowStockLotsCount ?? 0;

  // Real dynamic rebar weight distribution calculated from actual lots in PostgreSQL
  const standardDiameters = [8, 10, 12, 16, 20, 25];
  const diameterTotals: Record<number, number> = {};
  for (const d of standardDiameters) {
    diameterTotals[d] = 0;
  }

  for (const lot of lots) {
    const d = Number(lot.diameter_mm || lot.diameterMm || 0);
    const kg = Number(lot.quantity_kg || lot.availableWeightKg || 0);
    if (d in diameterTotals) {
      diameterTotals[d] += kg;
    }
  }

  const maxWeightKg = Math.max(...Object.values(diameterTotals), 1);
  const totalLotsWeightKg = Object.values(diameterTotals).reduce((a, b) => a + b, 0);

  const rebarAnalytics = standardDiameters.map((d) => {
    const kg = diameterTotals[d] || 0;
    const mt = (kg / 1000.0).toFixed(1);
    const pct = totalLotsWeightKg > 0 ? Math.round((kg / totalLotsWeightKg) * 100) : 0;
    const height = kg > 0 ? Math.max(16, Math.round((kg / maxWeightKg) * 95)) : 8;

    return {
      label: `${d}mm`,
      height,
      value: `${mt} MT`,
      active: pct >= 25,
      tag: `${pct}%`,
      pattern: kg > 0 ? (pct >= 25 ? 'solid-dark-green' : 'solid-green') : 'pattern-stripes-light',
    };
  });

  // Calculate Yard Capacity Percentage against standard 330 MT capacity
  const totalCapacityMt = 330;
  const capacityPercent = totalCapacityMt > 0 ? Math.min(100, Math.round((Number(totalMt) / totalCapacityMt) * 100)) : 0;
  const dashOffset = Number((125.6 * (1 - capacityPercent / 100)).toFixed(1));

  return (
    <div className="space-y-7 pb-12 animate-saas-in">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-steel-500 mt-1 font-medium">
            Plan, prioritize, and manage Salem TMT yard operations with ease.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenConsignmentModal || (() => alert('Inward Consignment Entry Modal'))}
            className="px-5 py-2.5 rounded-full bg-[#0c4a3b] hover:bg-[#073328] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Consignment</span>
          </button>

          <button
            onClick={onOpenAdjustModal || (() => alert('Adjust Stock Lots Modal'))}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-steel-50 text-steel-700 text-xs font-bold border border-steel-200 transition-all duration-200 hover:border-steel-300 active:scale-[0.98] cursor-pointer"
          >
            Import / Adjust
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Yard Stock */}
        <Link
          href="/admin/live-stock"
          className="saas-dark-card p-6 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-emerald-200/90 tracking-wide">
              Total Yard Stock
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
              {totalMt} <span className="text-lg font-bold text-emerald-300/80">MT</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200 bg-emerald-950/50 w-fit px-2.5 py-1 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>↗ {totalKg} kg verified in yard</span>
          </div>
        </Link>

        {/* Card 2: Ready Lots */}
        <Link
          href="/admin/live-stock"
          className="saas-card p-6 flex flex-col justify-between group cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-steel-500 tracking-wide">
              Ready Stock Lots
            </span>
            <div className="w-8 h-8 rounded-full bg-steel-100 flex items-center justify-center text-steel-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-[#111827] tracking-tight font-mono">
              {readyLots} <span className="text-base font-semibold text-steel-400">Lots</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immediate trailer dispatch</span>
          </div>
        </Link>

        {/* Card 3: Inward Bills */}
        <Link
          href="/admin/bills"
          className="saas-card p-6 flex flex-col justify-between group cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-steel-500 tracking-wide">
              Inward Bills
            </span>
            <div className="w-8 h-8 rounded-full bg-steel-100 flex items-center justify-center text-steel-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-[#111827] tracking-tight font-mono">
              {billsCount} <span className="text-base font-semibold text-steel-400">Bills</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 w-fit px-2.5 py-1 rounded-full border border-blue-100">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>100% verified weighbridge</span>
          </div>
        </Link>

        {/* Card 4: Low Stock Alerts */}
        <Link
          href="/admin/live-stock"
          className="saas-card p-6 flex flex-col justify-between group cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-steel-500 tracking-wide">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-full bg-steel-100 flex items-center justify-center text-steel-600 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-amber-700 tracking-tight font-mono">
              {lowStock} <span className="text-base font-semibold text-steel-400">Lots</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 w-fit px-2.5 py-1 rounded-full border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>≤ 1,500 kg yard threshold</span>
          </div>
        </Link>
      </div>

      {/* 3. Middle Grid: Dynamic Analytics Capsule Bars + Reminders + Active Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (5 Cols): Project Analytics */}
        <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#111827]">Yard Rebar Analytics</h3>
              <p className="text-[11px] text-steel-500">Live inventory weight distribution by diameter</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {lots.length} Active Lots
            </span>
          </div>

          {/* Capsule pill bars */}
          <div className="h-52 flex items-end justify-between gap-3 px-2 pt-8 pb-2">
            {rebarAnalytics.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative w-full flex flex-col items-center justify-end h-40">
                  {bar.active && (
                    <div className="absolute -top-7 z-10 px-2 py-0.5 bg-white text-[10px] font-extrabold font-mono text-[#0c4a3b] rounded-full shadow-md border border-emerald-200 animate-bounce">
                      {bar.tag}
                    </div>
                  )}

                  <div
                    style={{ height: `${bar.height}%` }}
                    className={`w-full max-w-[28px] rounded-full transition-all duration-700 ease-out relative overflow-hidden group-hover:scale-105 ${
                      bar.pattern === 'solid-dark-green'
                        ? 'bg-[#0c4a3b]'
                        : bar.pattern === 'solid-green'
                        ? 'bg-[#10b981]'
                        : 'pattern-stripes-light border border-slate-200'
                    }`}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                      {bar.value.split(' ')[0]}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-steel-600 font-mono">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-steel-100 flex items-center justify-between text-[11px] text-steel-500">
            <span>IS 1786 Standard Diameters</span>
            <span className="font-bold text-[#0c4a3b]">{totalMt} MT Total Verified</span>
          </div>
        </div>

        {/* Card 2 (3 Cols): Reminders / Yard Alerts */}
        <div className="lg:col-span-3 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#111827]">Yard Reminders</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {lowStock > 0 ? (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Action Required
                  </span>
                  <h4 className="font-extrabold text-sm text-amber-950 mt-0.5 leading-snug">
                    {lowStock} Lot(s) at Low Stock
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-1">
                    Inventory below the 1,500 kg threshold. Replenishment advised.
                  </p>
                </div>
              ) : readyLots > 0 ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Yard Status
                  </span>
                  <h4 className="font-extrabold text-sm text-emerald-950 mt-0.5 leading-snug">
                    {readyLots} Ready Lots Available
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    All rebar bundles verified for immediate customer trailer dispatch.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-steel-50 rounded-2xl border border-steel-100 text-center">
                  <span className="text-[10px] font-bold text-steel-400 uppercase tracking-wider block">
                    Yard Inventory Balance
                  </span>
                  <p className="text-xs text-steel-600 font-semibold mt-1">
                    No active stock lots in yard yet.
                  </p>
                  <p className="text-[11px] text-steel-400 mt-0.5">
                    Record inward delivery using &ldquo;Add Consignment&rdquo;.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/admin/live-stock"
            className="w-full mt-4 py-2.5 px-4 bg-[#0c4a3b] hover:bg-[#073328] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <Truck className="w-4 h-4 text-emerald-300" />
            <span>View Stock Register</span>
          </Link>
        </div>

        {/* Card 3 (4 Cols): Active Rebar Lots List */}
        <div className="lg:col-span-4 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#111827]">Active Rebar Lots</h3>
              <button
                onClick={onOpenConsignmentModal}
                className="text-xs font-bold text-[#0c4a3b] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ New</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {lots.length === 0 ? (
                <div className="py-8 text-center text-steel-400 text-xs space-y-1">
                  <Package className="w-8 h-8 text-steel-300 mx-auto" />
                  <p className="font-semibold text-steel-600">No stock lots registered</p>
                  <p className="text-[11px] text-steel-400">All inventory tables are completely clean.</p>
                </div>
              ) : (
                lots.slice(0, 5).map((item, idx) => {
                  const lotNumber = item.lot_number || item.lotNumber || 'TS-LOT';
                  const brand = item.brand_name || item.brandName || 'Approved Brand';
                  const diameter = item.diameter_mm || item.diameterMm || 12;
                  const grade = item.grade || 'Fe 550D';
                  const kg = Number(item.quantity_kg || item.availableWeightKg || 0);
                  const mt = (kg / 1000.0).toFixed(1);

                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-steel-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold font-mono text-xs">
                          {diameter}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#111827] leading-tight">
                            {diameter}mm {grade}
                          </div>
                          <div className="text-[10px] text-steel-500 font-mono mt-0.5">
                            {brand} • {lotNumber}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#111827] font-mono tabular-nums">
                        {mt} MT
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link
              href="/admin/live-stock"
              className="text-[11px] font-bold text-[#0c4a3b] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all {lots.length} lots</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Team Collaboration + Project Progress (Semi-circle Gauge) + Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1 (5 Cols): Authorized Yard Staff */}
        <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-[#111827]">Yard Operations Team</h3>
              <Link
                href="/admin/movements"
                className="text-xs font-bold text-[#0c4a3b] hover:underline"
              >
                View Ledger ↗
              </Link>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Salem Yard Administrator', role: 'admin@thirupathisteels.com', status: 'Active Session', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', avatar: 'SY' },
                { name: 'Salem Yard Dispatch Manager', role: 'yardmanager@thirupathisteels.com', status: 'Supervisor', color: 'text-teal-700 bg-teal-50 border-teal-100', avatar: 'YM' },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">{member.name}</div>
                      <div className="text-[10px] text-steel-500 truncate max-w-[200px] sm:max-w-xs">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${member.color}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-steel-100 text-[11px] text-steel-500 flex items-center justify-between">
            <span>2 Authorized Staff Accounts</span>
            <Link href="/admin/movements" className="font-bold text-emerald-800 hover:underline">
              Shift 1 • View Movements ↗
            </Link>
          </div>
        </div>

        {/* Card 2 (4 Cols): Project Progress - Semi-circular Arc Gauge */}
        <div className="lg:col-span-4 saas-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-[#111827]">Yard Storage Capacity</h3>
            <Link href="/admin/bays" className="text-[10px] font-mono text-emerald-700 hover:underline font-bold">
              View Bays Map ↗
            </Link>
          </div>

          {/* Semi-circular gauge */}
          <Link href="/admin/bays" className="flex flex-col items-center justify-center my-2 group cursor-pointer">
            <div className="relative w-44 h-24 flex items-end justify-center">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#0c4a3b"
                  strokeWidth="10"
                  strokeDasharray="125.6"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-center">
                <span className="text-3xl font-extrabold text-[#111827] font-mono leading-none group-hover:text-emerald-700 transition-colors">
                  {capacityPercent}%
                </span>
                <span className="text-[10px] font-semibold text-steel-500 mt-0.5">
                  {totalMt} MT / {totalCapacityMt} MT
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-steel-100 text-[10px] text-steel-600 font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0c4a3b]" />
              <span>In Stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              <span>Available</span>
            </div>
          </div>
        </div>

        {/* Card 3 (3 Cols): Time Tracker Card */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-gradient-to-br from-[#042017] via-[#062c20] to-[#02130e] text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-[#042017]/30 group">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
              <circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" stroke="currentColor" fill="none" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="20" stroke="currentColor" fill="none" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 tracking-wide">
              Weighbridge Gate
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="relative z-10 my-4 text-center">
            <div className="text-3xl font-black font-mono tracking-wider text-white drop-shadow-md">
              {timeString}
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-1">
              Active Session • Gate 1
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsClockRunning(!isClockRunning)}
              className="w-9 h-9 rounded-full bg-white text-[#042017] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isClockRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if (onRefresh) onRefresh();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer"
              title="Refresh data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
