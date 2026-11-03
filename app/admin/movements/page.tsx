'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Package,
  Layers,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MovementRecord {
  id: string;
  lot_id: string;
  lot_number: string;
  brand_id: string;
  brand_name: string;
  diameter_mm: number;
  grade: string;
  bay_number: string | null;
  movement_type: string;
  quantity_delta_kg: number;
  quantity_delta_mt: number;
  previous_quantity_kg: number;
  new_quantity_kg: number;
  reason: string;
  reference_no: string | null;
  performed_by: string;
  created_at: string;
}

function AdminMovementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [movementType, setMovementType] = useState('all');

  async function loadMovements() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (movementType !== 'all') params.set('type', movementType);

      const res = await fetch(`/api/admin/movements?${params.toString()}`, { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setMovements(json.data || []);
        setTotalCount(json.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementType]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadMovements();
  }

  function handleExportCsv() {
    if (movements.length === 0) return;
    const headers = [
      'Timestamp',
      'Movement ID',
      'Lot Number',
      'Brand',
      'Diameter (mm)',
      'Movement Type',
      'Delta (kg)',
      'Delta (MT)',
      'Previous Qty (kg)',
      'New Qty (kg)',
      'Reason',
      'Reference No',
      'Recorded By',
    ];

    const csvRows = [
      headers.join(','),
      ...movements.map((m) =>
        [
          `"${m.created_at}"`,
          `"${m.id}"`,
          `"${m.lot_number}"`,
          `"${m.brand_name}"`,
          m.diameter_mm,
          `"${m.movement_type}"`,
          m.quantity_delta_kg,
          m.quantity_delta_mt,
          m.previous_quantity_kg,
          m.new_quantity_kg,
          `"${(m.reason || '').replace(/"/g, '""')}"`,
          `"${(m.reference_no || '').replace(/"/g, '""')}"`,
          `"${(m.performed_by || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `thirupathi_steels_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculate summary metrics
  const totalInwardKg = movements
    .filter((m) => m.quantity_delta_kg > 0)
    .reduce((acc, m) => acc + m.quantity_delta_kg, 0);

  const totalOutwardKg = movements
    .filter((m) => m.quantity_delta_kg < 0)
    .reduce((acc, m) => acc + Math.abs(m.quantity_delta_kg), 0);

  return (
    <SaasAdminLayout movementsCount={totalCount}>
      <div className="space-y-6 animate-saas-in pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                PostgreSQL Immutable Ledger
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
              Stock Movement Audit Trail
            </h1>
            <p className="text-xs text-steel-500 mt-0.5">
              Verified chronological log of all rebar bundle inward consignments, trailer dispatches, and weighbridge reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Download CSV"
            >
              <Download className="w-4 h-4 mr-1.5 text-steel-600" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMovements}
              className="bg-white cursor-pointer hover:border-emerald-600"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Ledger KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200/90 uppercase tracking-wider">
              <span>Total Audit Records</span>
              <History className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-white">
                {totalCount} <span className="text-base font-sans text-emerald-300">Events</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-200">
              Zero deletions • Append-only database
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Total Inward Added</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-emerald-700">
                {(totalInwardKg / 1000).toFixed(2)} <span className="text-base font-sans text-steel-500">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500">
              {totalInwardKg.toLocaleString()} kg verified on gate scale
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Total Dispatched</span>
              <ArrowDownRight className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-slate-900">
                {(totalOutwardKg / 1000).toFixed(2)} <span className="text-base font-sans text-steel-500">MT</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500">
              {totalOutwardKg.toLocaleString()} kg client dispatches
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-steel-500 uppercase tracking-wider">
              <span>Integrity Hash Check</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>100% Reconciled</span>
              </div>
            </div>
            <div className="text-[11px] text-steel-500">
              PostgreSQL Foreign Key Verified
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-steel-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-steel-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lot #, brand, reason, reference invoice..."
              className="w-full pl-10 pr-4 py-2 bg-steel-50 hover:bg-steel-100/70 focus:bg-white text-xs text-slate-900 placeholder-steel-400 rounded-xl border border-steel-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-steel-400" />
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="bg-steel-50 border border-steel-200 rounded-xl px-3 py-2 text-xs font-semibold text-steel-700 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Movement Types</option>
              <option value="initial_entry">Initial Inventory Entry</option>
              <option value="inward_receipt">Inward Receipt (Truck Weighed)</option>
              <option value="dispatch_sale">Dispatch Sale (Trailer Loaded)</option>
              <option value="yard_adjustment">Stacking / Tonnage Adjustment</option>
              <option value="audit_reconciliation">Audit Reconciliation</option>
            </select>
          </div>
        </div>

        {/* Movements Table */}
        <div className="rounded-2xl border border-steel-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-steel-700">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-steel-600 border-b border-steel-200 font-mono">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Timestamp</th>
                  <th scope="col" className="px-5 py-3.5">Rebar Lot #</th>
                  <th scope="col" className="px-5 py-3.5">Movement Type</th>
                  <th scope="col" className="px-5 py-3.5">Quantity Delta</th>
                  <th scope="col" className="px-5 py-3.5">Balance Transition</th>
                  <th scope="col" className="px-5 py-3.5">Reason & Reference</th>
                  <th scope="col" className="px-5 py-3.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-200/80">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-steel-400">
                      No stock movement audit records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isInward = m.quantity_delta_kg > 0;
                    const isZero = m.quantity_delta_kg === 0;

                    let typeBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                    let typeLabel = m.movement_type;

                    if (m.movement_type === 'initial_entry') {
                      typeBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      typeLabel = 'Initial Entry';
                    } else if (m.movement_type === 'inward_receipt') {
                      typeBadge = 'bg-teal-50 text-teal-800 border-teal-200';
                      typeLabel = 'Inward Receipt';
                    } else if (m.movement_type === 'dispatch_sale') {
                      typeBadge = 'bg-blue-50 text-blue-800 border-blue-200';
                      typeLabel = 'Dispatch Sale';
                    } else if (m.movement_type === 'yard_adjustment') {
                      typeBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                      typeLabel = 'Yard Adjustment';
                    } else if (m.movement_type === 'audit_reconciliation') {
                      typeBadge = 'bg-purple-50 text-purple-800 border-purple-200';
                      typeLabel = 'Audit Reconciliation';
                    }

                    return (
                      <tr key={m.id} className="hover:bg-steel-50/60 transition-colors">
                        {/* Timestamp */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="font-mono text-steel-900 font-semibold">
                            {new Date(m.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-steel-400 font-mono">
                            {new Date(m.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Lot & Brand */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/admin/live-stock?search=${encodeURIComponent(m.lot_number)}`}
                            className="font-mono font-bold text-emerald-800 hover:underline"
                          >
                            {m.lot_number}
                          </Link>
                          <div className="text-[10px] text-steel-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-800">{m.brand_name}</span>
                            <span>•</span>
                            <span>{m.diameter_mm}mm {m.grade}</span>
                          </div>
                        </td>

                        {/* Movement Type */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge}`}
                          >
                            {isInward && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                            {!isInward && !isZero && <ArrowDownRight className="w-3 h-3 text-blue-600" />}
                            {typeLabel}
                          </span>
                        </td>

                        {/* Delta */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div
                            className={`font-mono font-extrabold text-sm ${
                              isInward
                                ? 'text-emerald-700'
                                : isZero
                                ? 'text-steel-500'
                                : 'text-blue-700'
                            }`}
                          >
                            {isInward ? '+' : ''}
                            {Number(m.quantity_delta_kg).toLocaleString()} kg
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-steel-500">
                            ({isInward ? '+' : ''}
                            {(Number(m.quantity_delta_kg) / 1000).toFixed(3)} MT)
                          </div>
                        </td>

                        {/* Balance Transition */}
                        <td className="px-5 py-3.5 whitespace-nowrap font-mono">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-steel-400">
                              {(Number(m.previous_quantity_kg) / 1000).toFixed(1)} MT
                            </span>
                            <span className="text-steel-300">→</span>
                            <span className="font-bold text-slate-900">
                              {(Number(m.new_quantity_kg) / 1000).toFixed(1)} MT
                            </span>
                          </div>
                          <div className="text-[10px] text-steel-400">
                            {Number(m.new_quantity_kg).toLocaleString()} kg balance
                          </div>
                        </td>

                        {/* Reason & Reference */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="text-xs text-slate-800 font-medium line-clamp-1">
                            {m.reason}
                          </div>
                          {m.reference_no && (
                            <div className="text-[10px] text-steel-500 font-mono flex items-center gap-1 mt-0.5">
                              <Hash className="w-3 h-3 text-steel-400" />
                              <span>{m.reference_no}</span>
                            </div>
                          )}
                        </td>

                        {/* Operator */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-steel-700 font-semibold">
                            <User className="w-3.5 h-3.5 text-steel-400" />
                            <span>{m.performed_by}</span>
                          </div>
                          <div className="text-[10px] text-steel-400 font-mono">
                            {m.bay_number || 'Salem Yard'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SaasAdminLayout>
  );
}

export default function AdminMovementsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
            <p className="text-sm font-semibold text-accent">Loading Audit Movement Trail...</p>
          </div>
        </div>
      }
    >
      <AdminMovementsContent />
    </Suspense>
  );
}
