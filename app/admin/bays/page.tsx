'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import {
  Layers,
  RefreshCw,
  Package,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Scale,
  ArrowRight,
  Filter,
  Warehouse,
  ShieldCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BayStatus {
  bay_id: string;
  bay_code: string;
  name: string;
  section: string;
  primary_diameters: number[];
  max_capacity_mt: number;
  current_quantity_kg: number;
  current_quantity_mt: number;
  occupancy_percent: number;
  status: 'optimal' | 'near_full' | 'low' | 'empty';
  lots: any[];
}

export default function AdminYardBaysPage() {
  const router = useRouter();
  const [bays, setBays] = useState<BayStatus[]>([]);
  const [totalCapacityMt, setTotalCapacityMt] = useState(345);
  const [totalOccupiedMt, setTotalOccupiedMt] = useState(0);
  const [overallOccupancy, setOverallOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedBay, setSelectedBay] = useState<BayStatus | null>(null);

  async function loadBays() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bays', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setBays(json.data.bays || []);
        setTotalCapacityMt(json.data.totalCapacityMt || 345);
        setTotalOccupiedMt(json.data.totalOccupiedMt || 0);
        setOverallOccupancy(json.data.overallOccupancyPercent || 0);
      }
    } catch (err) {
      console.error('Failed to load yard bays:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const sections = [
    { id: 'all', label: 'All Sections (8 Bays)' },
    { id: 'Section A', label: 'Section A (Heavy 12-16mm)' },
    { id: 'Section B', label: 'Section B (Medium 10-20mm)' },
    { id: 'Section C', label: 'Section C (Stirrups 8mm)' },
    { id: 'Section D', label: 'Section D (Infrastructure 25mm)' },
    { id: 'Section E', label: 'Section E (Commercial Lots)' },
  ];

  const filteredBays = bays.filter((b) => {
    if (selectedSection === 'all') return true;
    return b.section.toLowerCase().includes(selectedSection.toLowerCase());
  });

  return (
    <SaasAdminLayout>
      <div className="space-y-6 animate-saas-in pb-12">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Salem Yard Map
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Yard Bays & Storage Architecture
            </h1>
            <p className="text-xs text-steel-500 mt-0.5">
              Live capacity utilization, rebar bundle stacking, and slot allocation across Salem Main Yard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBays}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Refresh bays"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </Button>
            <Link href="/admin/live-stock">
              <Button variant="primary" size="sm" className="cursor-pointer bg-[#0c4a3b] hover:bg-[#073328]">
                <Package className="w-4 h-4 mr-1.5" />
                <span>Manage Stock Lots</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Capacity Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200/90 uppercase tracking-wider">
              <span>Occupied Tonnage</span>
              <Warehouse className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-white">
                {totalOccupiedMt.toFixed(2)} <span className="text-base font-sans text-emerald-300">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-200 flex items-center gap-1.5">
              <span>Across {bays.reduce((acc, b) => acc + b.lots.length, 0)} physical rebar lots</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Total Yard Capacity</span>
              <Scale className="w-4 h-4 text-steel-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {totalCapacityMt} <span className="text-base font-sans text-steel-500">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500 flex items-center gap-1.5">
              <span>8 Standard concrete stacking bays</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Overall Occupancy</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {overallOccupancy}%
              </div>
            </div>
            <div className="w-full bg-steel-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, overallOccupancy)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Weighbridge Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Gate 1 Calibrated</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500">
              Salem Bypass Weighbridge Sync OK
            </div>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-steel-400 flex-shrink-0" />
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSection === sec.id
                  ? 'bg-[#0c4a3b] text-white shadow-xs'
                  : 'bg-white text-steel-600 hover:bg-steel-50 border border-steel-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Bay Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredBays.map((bay) => {
            const isFull = bay.occupancy_percent >= 85;
            const isEmpty = bay.occupancy_percent === 0;

            let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            let progressColor = 'bg-emerald-500';

            if (isFull) {
              badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
              progressColor = 'bg-rose-500';
            } else if (bay.occupancy_percent > 65) {
              badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
              progressColor = 'bg-amber-500';
            } else if (isEmpty) {
              badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
              progressColor = 'bg-slate-300';
            }

            return (
              <div
                key={bay.bay_id}
                className="bg-white rounded-2xl border border-steel-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-emerald-300"
              >
                <div>
                  {/* Bay Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-base text-[#111827]">
                      {bay.bay_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}
                    >
                      {bay.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-steel-700 mt-1 line-clamp-1">
                    {bay.name}
                  </h3>
                  <div className="text-[10px] text-steel-400 font-mono mt-0.5">
                    {bay.section}
                  </div>

                  {/* Designated Diameters */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] font-semibold text-steel-500">Designated:</span>
                    {bay.primary_diameters.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-mono font-bold bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded"
                      >
                        {d}mm
                      </span>
                    ))}
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                      <span className="text-steel-600">{bay.current_quantity_mt} MT</span>
                      <span className="text-steel-400">/ {bay.max_capacity_mt} MT ({bay.occupancy_percent}%)</span>
                    </div>
                    <div className="w-full bg-steel-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                        style={{ width: `${Math.min(100, bay.occupancy_percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Lots Stored in this Bay */}
                  <div className="mt-4 pt-3 border-t border-steel-100 space-y-2">
                    <div className="text-[10px] font-bold text-steel-400 uppercase tracking-wider font-mono">
                      Stored Rebar Lots ({bay.lots.length})
                    </div>

                    {bay.lots.length === 0 ? (
                      <div className="p-3 rounded-xl bg-steel-50 text-center text-[11px] text-steel-400 font-medium">
                        Slot available for next trailer dispatch.
                      </div>
                    ) : (
                      bay.lots.map((lot) => (
                        <div
                          key={lot.id}
                          className="p-2.5 rounded-xl bg-[#f8fafc] border border-steel-100 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-[#111827]">
                              {lot.lot_number}
                            </div>
                            <div className="text-[10px] text-steel-500 flex items-center gap-1">
                              <span className="font-semibold text-emerald-800">{lot.brand_name}</span>
                              <span>•</span>
                              <span>{lot.diameter_mm}mm {lot.grade}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-extrabold text-xs text-slate-900">
                              {(Number(lot.quantity_kg) / 1000).toFixed(1)} MT
                            </div>
                            <div className="text-[9px] text-steel-400 font-mono">
                              {Number(lot.quantity_kg).toLocaleString()} kg
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-4 pt-2">
                  <Link
                    href={`/admin/live-stock?search=${encodeURIComponent(bay.bay_code)}`}
                    className="w-full py-1.5 px-3 rounded-xl bg-steel-50 hover:bg-emerald-50 text-steel-700 hover:text-emerald-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Bay Inventory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SaasAdminLayout>
  );
}

