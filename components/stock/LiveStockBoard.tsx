'use client';

import React, { useState, useEffect } from 'react';
import { PublicStockLot, StockStatus } from '@/db/schema';
import { formatDate } from '@/lib/utils';
import { StockStatusBadge } from '@/components/ui/StockStatusBadge';
import { StockFilter } from './StockFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { BUSINESS_INFO } from '@/lib/constants/business';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  MapPin,
  RefreshCw,
  Phone,
  LayoutGrid,
  List,
  CheckCircle2,
  Box,
  ArrowUpRight,
} from 'lucide-react';

interface Metrics {
  totalQuantityKg: number;
  totalQuantityMt: number;
  totalLotsCount: number;
  inStockLotsCount: number;
  lowStockLotsCount: number;
  outOfStockLotsCount: number;
  lastUpdated: string;
}

export function LiveStockBoard() {
  const [items, setItems] = useState<PublicStockLot[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedDiameter, setSelectedDiameter] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  async function fetchStockData() {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/stock', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setMetrics(json.metrics || null);
      } else {
        setError(json.error || 'Failed to retrieve live stock data');
      }
    } catch (err) {
      console.error('Failed to load stock data:', err);
      setError('Unable to connect to Salem yard inventory server. Please try again or call dispatch.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStockData();
  }, []);

  const brandsList = Array.from(new Set(items.map((i) => i.brand_name))).filter(Boolean);
  const diametersList = Array.from(new Set(items.map((i) => i.diameter_mm))).filter(Boolean).sort((a, b) => a - b);

  const filteredItems = items.filter((item) => {
    const matchesBrand = selectedBrand === 'All' || item.brand_name === selectedBrand;
    const matchesDiameter = selectedDiameter === 'all' || item.diameter_mm === selectedDiameter;
    const matchesStatus = selectedStatus === 'all' || item.stock_status === selectedStatus;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      item.lot_number.toLowerCase().includes(query) ||
      item.brand_name.toLowerCase().includes(query) ||
      item.grade.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      `${item.diameter_mm}mm`.includes(query);

    return matchesBrand && matchesDiameter && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Banner - Visual Reference Inspired Card Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Metric 1: Total Physical Inventory (Featured Emerald Card) */}
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
              Total Yard Stock
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {metrics ? `${metrics.totalQuantityMt.toLocaleString()} MT` : '...'}
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metrics ? `${metrics.totalQuantityKg.toLocaleString('en-IN')} kg verified` : 'Loading...'}</span>
            </span>
          </div>
        </div>

        {/* Metric 2: Ready In-Stock Lots */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
              Ready Lots
            </span>
            <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-emerald-700 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {metrics ? `${metrics.inStockLotsCount}` : '...'}
              <span className="text-lg font-bold text-steel-500 ml-1.5 font-sans">Lots</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Immediate trailer dispatch</span>
            </span>
          </div>
        </div>

        {/* Metric 3: Low Stock Alert (<= 1500 kg) */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-amber-700 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 font-mono tracking-tight">
              {metrics ? `${metrics.lowStockLotsCount}` : '...'}
              <span className="text-lg font-bold text-steel-500 ml-1.5 font-sans">Lots</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>&le; 1,500 kg yard threshold</span>
            </span>
          </div>
        </div>

        {/* Metric 4: Terminal Status & PostgreSQL Sync */}
        <div className="p-5 md:p-6 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
              Yard Terminal
            </span>
            <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-brand group-hover:text-brand-700 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span>Authoritative DB</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span>Sync: {metrics ? formatDate(metrics.lastUpdated) : 'Connecting...'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <StockFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        selectedDiameter={selectedDiameter}
        onDiameterChange={setSelectedDiameter}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        brandsList={brandsList.length > 0 ? brandsList : ['TATA TISCON', 'SURYADEV', 'AGNI', 'SSI TMT', 'JPR']}
        diametersList={diametersList.length > 0 ? diametersList : [8, 10, 12, 16, 20, 25]}
        onRefresh={fetchStockData}
        isRefreshing={refreshing}
      />

      {/* View Switcher Header */}
      <div className="flex items-center justify-between text-xs text-steel-600 pt-1">
        <span>
          Showing <strong className="text-accent">{filteredItems.length}</strong> verified lots from Salem yard inventory
        </span>

        <div className="flex items-center gap-1 bg-white border border-steel-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-steel-100 text-brand font-bold' : 'text-steel-500 hover:text-accent'
            }`}
            title="Table View (Desktop Recommended)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-steel-100 text-brand font-bold' : 'text-steel-500 hover:text-accent'
            }`}
            title="Card View (Mobile Optimized)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error / Offline State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Database Connection Required</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStockData} className="bg-white whitespace-nowrap cursor-pointer">
            Retry Yard Query
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-xl border border-steel-200">
          <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-base font-bold text-accent">Querying Salem Yard PostgreSQL Database...</p>
          <p className="text-xs text-steel-500 mt-1">Retrieving certified stock lot balances and weighbridge records</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <EmptyState
          title="No Matching Inventory Lots Found"
          description="There are currently no active stock lots matching your filter criteria. Try resetting filters or call our Salem yard dispatch desk."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedBrand('All');
            setSelectedDiameter('all');
            setSelectedStatus('all');
          }}
        />
      ) : viewMode === 'cards' ? (
        /* Mobile Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((lot) => (
            <div
              key={lot.id}
              className="p-5 rounded-xl bg-white border border-steel-200 hover:border-brand/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-neutral text-accent border border-steel-200">
                    {lot.brand_name}
                  </span>
                  <StockStatusBadge status={lot.stock_status} size="sm" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-accent">
                    {lot.diameter_mm} mm TMT Rebar ({lot.grade})
                  </h4>
                  <div className="text-xs text-steel-500 font-mono mt-0.5">Lot: {lot.lot_number}</div>
                </div>

                <div className="bg-steel-50 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs text-steel-500">Available Weight</div>
                    <div className="text-lg font-mono font-extrabold text-accent">
                      {lot.quantity_kg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-steel-500">Metric Tonnage</div>
                    <div className="text-sm font-mono font-bold text-brand">
                      {lot.quantity_mt.toFixed(3)} MT
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-steel-600">
                  <MapPin className="w-3.5 h-3.5 text-steel-400" />
                  <span>{lot.location} {lot.bay_number ? `(${lot.bay_number})` : ''}</span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-steel-100 flex items-center justify-between">
                <span className="text-[11px] text-steel-500">Updated: {formatDate(lot.last_updated)}</span>
                <Button
                  href={`https://wa.me/919003461089?text=Hello%20Thirupathi%20Steels,%20I%20want%20to%20enquire%20about%20lot%20${encodeURIComponent(
                    lot.lot_number
                  )}%20(${lot.brand_name}%20${lot.diameter_mm}mm)`}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 cursor-pointer"
                >
                  Enquire Lot
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Full Desktop Table View */
        <div className="rounded-xl border border-steel-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-steel-700">
              <thead className="bg-neutral text-xs uppercase tracking-wider text-accent font-bold border-b border-steel-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Rebar & Grade</th>
                  <th scope="col" className="px-5 py-3.5">Brand</th>
                  <th scope="col" className="px-5 py-3.5">Lot # & Yard Bay</th>
                  <th scope="col" className="px-5 py-3.5">Available Stock (kg / MT)</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Dispatch Enquiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-200/80">
                {filteredItems.map((lot) => (
                  <tr key={lot.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-accent">
                        {lot.diameter_mm} mm TMT Rebar
                      </div>
                      <div className="text-xs text-steel-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-brand font-semibold">{lot.grade}</span>
                        <span>•</span>
                        <span>IS 1786 Certified</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-neutral text-accent border border-steel-200">
                        {lot.brand_name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono text-xs text-accent font-semibold">{lot.lot_number}</div>
                      <div className="flex items-center gap-1.5 text-xs text-steel-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-steel-400" />
                        <span>{lot.location} {lot.bay_number ? `(${lot.bay_number})` : ''}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-accent text-base">
                        {lot.quantity_kg.toLocaleString()} kg
                      </div>
                      <div className="text-xs font-mono text-brand font-medium">
                        ({lot.quantity_mt.toFixed(3)} MT)
                      </div>
                      <div className="w-28 bg-steel-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lot.stock_status === 'in_stock'
                              ? 'bg-emerald-600'
                              : lot.stock_status === 'low_stock'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(5, (lot.quantity_kg / 50000) * 100))}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StockStatusBadge status={lot.stock_status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        href={`https://wa.me/919003461089?text=Hello%20Thirupathi%20Steels,%20I%20want%20to%20enquire%20about%20lot%20${encodeURIComponent(
                          lot.lot_number
                        )}%20(${lot.brand_name}%20${lot.diameter_mm}mm)`}
                        variant="outline"
                        size="sm"
                        className="text-xs py-1 cursor-pointer"
                      >
                        Enquire Lot
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confidentiality & Yard Dispatch Notice */}
      <div className="p-4 rounded-xl bg-white border border-steel-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-steel-600">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-brand flex-shrink-0" />
          <span>
            Need urgent truckload bookings or custom cutting? Call Salem yard directly at{' '}
            <strong className="text-accent">{BUSINESS_INFO.phones[0].display}</strong>
          </span>
        </div>
        <Button href="/contact" variant="outline" size="sm" className="whitespace-nowrap cursor-pointer">
          Contact Yard Office
        </Button>
      </div>
    </div>
  );
}
