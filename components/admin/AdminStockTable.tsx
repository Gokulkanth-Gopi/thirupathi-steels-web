'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StockStatusBadge } from '@/components/ui/StockStatusBadge';
import { Button } from '@/components/ui/Button';
import { AdminAdjustmentModal } from './AdminAdjustmentModal';
import {
  SlidersHorizontal,
  MapPin,
  Hash,
  Search,
  Filter,
  Download,
  Truck,
  ArrowUpDown,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AdminStockTableProps {
  lots: any[];
  initialSearch?: string;
  onRefresh: () => void;
}

export function AdminStockTable({ lots, initialSearch = '', onRefresh }: AdminStockTableProps) {
  const [selectedLotForAdjust, setSelectedLotForAdjust] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('subtract');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // DB Bay Integration
  const [dbBays, setDbBays] = useState<{ bay_id: string; bay_code: string; name: string; max_capacity_mt: number }[]>([]);
  const [relocateLot, setRelocateLot] = useState<any | null>(null);
  const [targetBay, setTargetBay] = useState<string>('');
  const [relocating, setRelocating] = useState(false);
  const [relocateMsg, setRelocateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    async function fetchBays() {
      try {
        const res = await fetch('/api/bays');
        const json = await res.json();
        if (json.success && json.data?.bays) {
          setDbBays(json.data.bays);
        }
      } catch (e) {
        console.error('Failed to load DB bays in stock table:', e);
      }
    }
    fetchBays();
  }, []);

  async function handleRelocateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!relocateLot) return;
    try {
      setRelocating(true);
      setRelocateMsg(null);
      const res = await fetch(`/api/stock/${relocateLot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bayNumber: targetBay }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setRelocateMsg({ type: 'error', text: json.error || 'Failed to relocate lot.' });
        return;
      }
      setRelocateLot(null);
      onRefresh();
    } catch (err: any) {
      setRelocateMsg({ type: 'error', text: err?.message || 'Network error relocating lot.' });
    } finally {
      setRelocating(false);
    }
  }

  // Filters
  const [search, setSearch] = useState(initialSearch);

  React.useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);
  const [brandFilter, setBrandFilter] = useState('all');
  const [diameterFilter, setDiameterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bayFilter, setBayFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'weight_desc' | 'weight_asc' | 'lot_asc' | 'diameter_asc'>('weight_desc');

  // Extract unique brands, diameters, and all bays from DB + lots
  const brands = Array.from(new Set(lots.map((l) => l.brand_name).filter(Boolean)));
  const diameters = Array.from(new Set(lots.map((l) => Number(l.diameter_mm)).filter(Boolean))).sort(
    (a, b) => a - b
  );
  const bays = Array.from(new Set([
    ...dbBays.map((b) => b.bay_code),
    ...lots.map((l) => l.bay_number).filter(Boolean)
  ])).sort();

  // Filter logic
  let filtered = lots.filter((l) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      l.lot_number?.toLowerCase().includes(q) ||
      l.brand_name?.toLowerCase().includes(q) ||
      `${l.diameter_mm}mm`.includes(q) ||
      l.bay_number?.toLowerCase().includes(q) ||
      l.mfg_batch_no?.toLowerCase().includes(q) ||
      l.grade?.toLowerCase().includes(q);

    const matchBrand = brandFilter === 'all' || l.brand_name?.toLowerCase() === brandFilter.toLowerCase();
    const matchDiameter = diameterFilter === 'all' || Number(l.diameter_mm) === Number(diameterFilter);
    const matchStatus = statusFilter === 'all' || l.stock_status === statusFilter;
    const matchBay = bayFilter === 'all' || l.bay_number === bayFilter;

    return matchSearch && matchBrand && matchDiameter && matchStatus && matchBay;
  });

  // Sort logic
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'weight_desc') {
      return Number(b.quantity_kg) - Number(a.quantity_kg);
    }
    if (sortBy === 'weight_asc') {
      return Number(a.quantity_kg) - Number(b.quantity_kg);
    }
    if (sortBy === 'diameter_asc') {
      return Number(a.diameter_mm) - Number(b.diameter_mm);
    }
    if (sortBy === 'lot_asc') {
      return (a.lot_number || '').localeCompare(b.lot_number || '');
    }
    return 0;
  });

  // Calculate filtered totals
  const filteredKg = filtered.reduce((acc, curr) => acc + Number(curr.quantity_kg || 0), 0);
  const filteredMt = (filteredKg / 1000.0).toFixed(2);

  function handleExportCsv() {
    if (filtered.length === 0) return;
    const headers = [
      'Lot Number',
      'Brand',
      'Diameter (mm)',
      'Grade',
      'Location',
      'Bay Number',
      'Batch No',
      'Weight (kg)',
      'Weight (MT)',
      'Status',
      'Last Updated',
    ];

    const rows = [
      headers.join(','),
      ...filtered.map((l) =>
        [
          `"${l.lot_number}"`,
          `"${l.brand_name}"`,
          l.diameter_mm,
          `"${l.grade}"`,
          `"${l.location}"`,
          `"${l.bay_number || ''}"`,
          `"${l.mfg_batch_no || ''}"`,
          l.quantity_kg,
          (Number(l.quantity_kg) / 1000).toFixed(3),
          `"${l.stock_status}"`,
          `"${l.updated_at || l.created_at || ''}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `thirupathi_steels_stock_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openDispatchModal(lot: any) {
    setSelectedLotForAdjust(lot);
    setAdjustType('subtract');
    setAdjustReason('Customer trailer dispatch loading');
  }

  function openAdjustModal(lot: any) {
    setSelectedLotForAdjust(lot);
    setAdjustType('subtract');
    setAdjustReason('');
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-steel-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-steel-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lot #, brand, diameter, bay, batch..."
              className="w-full pl-10 pr-4 py-2 bg-steel-50 hover:bg-steel-100/60 focus:bg-white text-xs text-slate-900 placeholder-steel-400 rounded-xl border border-steel-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="bg-white cursor-pointer hover:border-emerald-600 text-xs py-1.5"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-steel-600" />
              <span>Export CSV</span>
            </Button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-steel-50 border border-steel-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-steel-500" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-steel-700 outline-none cursor-pointer"
              >
                <option value="weight_desc">Weight: High to Low</option>
                <option value="weight_asc">Weight: Low to High</option>
                <option value="diameter_asc">Diameter: 8mm → 25mm</option>
                <option value="lot_asc">Lot Number: A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-steel-100 text-xs">
          <div className="flex items-center gap-1 text-steel-400 font-semibold text-[11px] mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-steel-50 border border-steel-200 rounded-lg px-2.5 py-1 text-xs text-steel-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Diameter Filter */}
          <select
            value={diameterFilter}
            onChange={(e) => setDiameterFilter(e.target.value)}
            className="bg-steel-50 border border-steel-200 rounded-lg px-2.5 py-1 text-xs text-steel-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Diameters ({diameters.length})</option>
            {diameters.map((d) => (
              <option key={d} value={d}>
                {d} mm
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-steel-50 border border-steel-200 rounded-lg px-2.5 py-1 text-xs text-steel-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock (&gt; 1,500 kg)</option>
            <option value="low_stock">Low Stock (&le; 1,500 kg)</option>
            <option value="out_of_stock">Out of Stock (0 kg)</option>
          </select>

          {/* Bay Filter */}
          {bays.length > 0 && (
            <select
              value={bayFilter}
              onChange={(e) => setBayFilter(e.target.value)}
              className="bg-steel-50 border border-steel-200 rounded-lg px-2.5 py-1 text-xs text-steel-700 font-medium outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Stacking Bays</option>
              {bays.map((bay) => (
                <option key={bay} value={bay}>
                  {bay}
                </option>
              ))}
            </select>
          )}

          {(brandFilter !== 'all' || diameterFilter !== 'all' || statusFilter !== 'all' || bayFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setBrandFilter('all');
                setDiameterFilter('all');
                setStatusFilter('all');
                setBayFilter('all');
                setSearch('');
              }}
              className="text-[11px] text-emerald-800 hover:underline font-bold px-2 py-1 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Ribbon */}
      <div className="flex flex-wrap items-center justify-between px-2 text-xs text-steel-500 font-medium">
        <div>
          Showing <strong className="text-slate-900 font-mono">{filtered.length}</strong> of{' '}
          <strong className="text-slate-900 font-mono">{lots.length}</strong> total lots
        </div>
        <div>
          Filtered Tonnage:{' '}
          <strong className="text-emerald-800 font-mono font-extrabold text-sm">{filteredMt} MT</strong> (
          <span className="font-mono">{filteredKg.toLocaleString()} kg</span>)
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl border border-steel-200/90 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-steel-700">
            <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-steel-600 border-b border-steel-200 font-mono">
              <tr>
                <th scope="col" className="px-5 py-3.5">Rebar Lot #</th>
                <th scope="col" className="px-5 py-3.5">Brand & Grade</th>
                <th scope="col" className="px-5 py-3.5">Location / Bay</th>
                <th scope="col" className="px-5 py-3.5">Authoritative Weight</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-200/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-steel-400">
                    No matching rebar stock lots found in Salem Yard inventory.
                  </td>
                </tr>
              ) : (
                filtered.map((lot) => {
                  const qtyKg = Number(lot.quantity_kg);
                  const qtyMt = (qtyKg / 1000.0).toFixed(3);

                  return (
                    <tr key={lot.id} className="hover:bg-steel-50/60 transition-colors">
                      {/* Lot # & Diameter */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {lot.lot_number}
                        </div>
                        <div className="text-[11px] text-steel-500 flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                            {lot.diameter_mm} mm Rebar
                          </span>
                          {lot.mfg_batch_no && (
                            <span className="flex items-center gap-1 font-mono text-steel-400">
                              <Hash className="w-3 h-3" />
                              {lot.mfg_batch_no}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Brand & Grade */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{lot.brand_name}</div>
                        <div className="text-[11px] font-mono text-steel-500">{lot.grade}</div>
                      </td>

                      {/* Bay / Location */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Link
                          href={`/admin/bays`}
                          className="flex items-center gap-1 text-slate-800 font-bold hover:text-emerald-800 hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5 text-steel-400" />
                          <span>{lot.bay_number || 'Salem Yard Floor'}</span>
                        </Link>
                        <div className="text-[10px] text-steel-400">{lot.location}</div>
                      </td>

                      {/* Weight in kg & MT */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          {qtyKg.toLocaleString()} kg
                        </div>
                        <div className="font-mono text-xs text-emerald-700 font-bold">
                          ({qtyMt} MT)
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StockStatusBadge status={lot.stock_status} size="sm" />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                        {/* Quick Dispatch Button */}
                        <button
                          onClick={() => openDispatchModal(lot)}
                          disabled={qtyKg <= 0}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center gap-1 border border-blue-200 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          title="Record trailer dispatch"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>

                        {/* Adjust / Reconcile Button */}
                        <button
                          onClick={() => openAdjustModal(lot)}
                          className="px-2.5 py-1 rounded-lg bg-steel-50 hover:bg-steel-100 text-steel-700 font-bold text-xs inline-flex items-center gap-1 border border-steel-200 transition-colors cursor-pointer"
                          title="Adjust balance"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>

                        {/* Relocate Bay Button */}
                        <button
                          onClick={() => {
                            setRelocateLot(lot);
                            setTargetBay(lot.bay_number || '');
                            setRelocateMsg(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs inline-flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                          title="Reassign to another bay in DB"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Move Bay</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment & Dispatch Modal */}
      {selectedLotForAdjust && (
        <AdminAdjustmentModal
          lot={selectedLotForAdjust}
          initialAdjustmentType={adjustType}
          initialReason={adjustReason}
          onClose={() => setSelectedLotForAdjust(null)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {/* Relocate Yard Bay Modal */}
      {relocateLot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-steel-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-steel-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827]">
                    Relocate Stacking Bay
                  </h3>
                  <p className="text-xs text-steel-500 font-mono">
                    Lot: {relocateLot.lot_number} ({relocateLot.brand_name} {relocateLot.diameter_mm}mm)
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRelocateSubmit} className="space-y-4">
              {relocateMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {relocateMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-steel-700 mb-1">
                  Current Bay Location
                </label>
                <div className="px-3 py-2 bg-steel-50 rounded-xl border border-steel-200 text-xs font-mono font-bold text-slate-800">
                  {relocateLot.bay_number || 'Salem Yard Floor (Unassigned)'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-steel-700 mb-1">
                  Assign to Database Yard Bay *
                </label>
                <select
                  value={targetBay}
                  onChange={(e) => setTargetBay(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-steel-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white cursor-pointer"
                >
                  <option value="">Unassigned / Yard Floor</option>
                  {dbBays.map((b) => (
                    <option key={b.bay_id || b.bay_code} value={b.bay_code}>
                      {b.bay_code} — {b.name} ({b.max_capacity_mt} MT)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-steel-500 mt-1">
                  Selecting a bay updates the lot in PostgreSQL and recalculates bay occupancy on the Salem Bay Map.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-steel-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRelocateLot(null)}
                  disabled={relocating}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={relocating}
                  className="bg-[#0c4a3b] hover:bg-[#073328] text-white cursor-pointer"
                >
                  {relocating ? 'Saving...' : 'Update Yard Bay'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
