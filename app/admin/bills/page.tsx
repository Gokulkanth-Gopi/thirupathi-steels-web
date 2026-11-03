'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SaasAdminLayout } from '@/components/admin/SaasAdminLayout';
import { AdminBillEntryModal } from '@/components/admin/AdminBillEntryModal';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Building2,
  Calendar,
  Layers,
  Scale,
  Paperclip,
  ArrowRight,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowUpRight,
} from 'lucide-react';

function AdminBillsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; username: string; fullName: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [bills, setBills] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loadingBills, setLoadingBills] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showEntryModal, setShowEntryModal] = useState(false);

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
      await loadBillsData();
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/admin/login');
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadBillsData() {
    try {
      setLoadingBills(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);

      const res = await fetch(`/api/admin/bills?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setBills(json.data || []);
        setMetrics(json.metrics || null);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoadingBills(false);
    }
  }

  useEffect(() => {
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadBillsData();
  }

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
    <SaasAdminLayout billsCount={bills.length}>
      <div className="space-y-6">
        {/* Top Header & New Inward Bill Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Commercial & Consignment Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-accent tracking-tight">
              Inward Bills & Document Register
            </h1>
            <p className="text-xs sm:text-sm text-steel-600 mt-1">
              Track supplier purchase invoices, weighbridge slips, and exact inward physical lot traceability.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setShowEntryModal(true)}
              className="px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Record Inward Bill</span>
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards - Dashboard Visual Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c4a3b] via-[#093c30] to-[#04281f] text-white shadow-sm flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Inward TMT Volume
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 transition-transform group-hover:scale-110">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {metrics ? (metrics.totalQuantityKg / 1000.0).toFixed(2) : '0.00'}{' '}
                <span className="text-lg font-bold text-emerald-300 font-sans">MT</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>{metrics ? metrics.totalQuantityKg.toLocaleString('en-IN') : '0'} kg weighed</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                Total Purchase Spend
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-emerald-700 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                ₹{metrics ? metrics.totalAmountSpend.toLocaleString('en-IN') : '0'}
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inclusive of 18% GST</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                Total Invoices
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-sky-700 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics ? metrics.totalBillsCount : '0'}
                <span className="text-base font-bold text-steel-500 ml-1.5 font-sans">Bills</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Consignments recorded</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-steel-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-steel-500">
                Pending Settlement
              </span>
              <div className="w-8 h-8 rounded-full border border-steel-200 bg-neutral/80 flex items-center justify-center text-steel-500 group-hover:text-amber-700 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-1">
              <div className="text-3xl font-extrabold text-amber-700 font-mono tracking-tight">
                {metrics ? metrics.unpaidCount : '0'}
                <span className="text-base font-bold text-steel-500 ml-1.5 font-sans">Bills</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting finance clearance</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-steel-400" />
            <input
              type="text"
              placeholder="Search by Bill #, Supplier, Vehicle #, or Lot #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-20 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-3 py-1 bg-steel-100 hover:bg-steel-200 text-steel-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Payment Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-steel-500 mr-1 hidden sm:inline">Status:</span>
            {[
              { id: 'all', label: 'All Bills' },
              { id: 'paid', label: 'Paid' },
              { id: 'partially_paid', label: 'Partial' },
              { id: 'unpaid', label: 'Unpaid' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPaymentFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  paymentFilter === f.id
                    ? 'bg-brand text-white shadow-2xs'
                    : 'bg-steel-100 text-steel-600 hover:bg-steel-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => {
                setSearch('');
                setPaymentFilter('all');
                loadBillsData();
              }}
              title="Refresh bills list"
              className="p-1.5 text-steel-600 hover:text-brand bg-steel-100 hover:bg-steel-200 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBills ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bills Register Table (Desktop) & Cards (Mobile) */}
        <div className="bg-white rounded-xl border border-steel-200 shadow-2xs overflow-hidden">
          {loadingBills ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
              <p className="text-xs font-semibold text-steel-600">Loading bills and documents...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-steel-400 mx-auto" />
              <h3 className="text-sm font-bold text-accent">No Consignment Bills Found</h3>
              <p className="text-xs text-steel-500 max-w-sm mx-auto">
                No bills matched your search query. Record a new inward bill to start tracking supplier invoices and attached documents.
              </p>
              <Button
                onClick={() => setShowEntryModal(true)}
                className="px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Inward Bill</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-steel-50/80 border-b border-steel-200 text-steel-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Invoice / Bill #</th>
                      <th className="py-3 px-4">Supplier & Vehicle</th>
                      <th className="py-3 px-4">Steel Spec & Lot</th>
                      <th className="py-3 px-4 text-right">Inward Qty</th>
                      <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Docs</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-steel-50/50 transition-colors">
                        {/* Invoice & Date */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/bills/${bill.id}`}
                            className="font-mono font-bold text-brand hover:underline block"
                          >
                            {bill.bill_number}
                          </Link>
                          <span className="text-[11px] text-steel-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-steel-400" />
                            <span>{bill.bill_date}</span>
                          </span>
                        </td>

                        {/* Supplier & Vehicle */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-accent truncate max-w-[200px]" title={bill.supplier}>
                            {bill.supplier}
                          </div>
                          {bill.vehicle_no && (
                            <div className="text-[11px] text-steel-500 font-mono flex items-center gap-1 mt-0.5">
                              <Truck className="w-3 h-3 text-steel-400" />
                              <span>{bill.vehicle_no}</span>
                            </div>
                          )}
                        </td>

                        {/* Spec & Lot */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-accent">
                            {bill.brand_name || 'TMT Steel'} • {bill.diameter_mm ? `${bill.diameter_mm} mm` : 'Rebar'}
                          </div>
                          {bill.lot_number && (
                            <div className="text-[10px] font-mono text-steel-500 mt-0.5 truncate max-w-[150px]">
                              {bill.lot_number}
                            </div>
                          )}
                        </td>

                        {/* Inward Qty */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-accent">
                            {(bill.quantity_kg / 1000.0).toFixed(3)} MT
                          </div>
                          <div className="text-[10px] font-mono text-steel-500">
                            {bill.quantity_kg.toLocaleString('en-IN')} kg
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-accent">
                            ₹{bill.total_amount ? bill.total_amount.toLocaleString('en-IN') : '0'}
                          </div>
                          {bill.rate_per_kg && (
                            <div className="text-[10px] font-mono text-steel-500">
                              @ ₹{bill.rate_per_kg}/kg
                            </div>
                          )}
                        </td>

                        {/* Payment Status Pill */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              bill.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : bill.payment_status === 'partially_paid'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {bill.payment_status?.replace(/_/g, ' ') || 'paid'}
                          </span>
                        </td>

                        {/* Attached Documents Count */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              bill.document_count > 0
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-steel-100 text-steel-500'
                            }`}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{bill.document_count}</span>
                          </span>
                        </td>

                        {/* View Action */}
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/bills/${bill.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark px-2.5 py-1 rounded-md hover:bg-brand/10 transition-colors"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< 768px) */}
              <div className="md:hidden divide-y divide-steel-100">
                {bills.map((bill) => (
                  <div key={bill.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/bills/${bill.id}`}
                        className="font-mono font-bold text-brand text-sm hover:underline"
                      >
                        {bill.bill_number}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bill.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {bill.payment_status || 'paid'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-accent truncate">
                      {bill.supplier}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-steel-100">
                      <div>
                        <span className="text-[10px] text-steel-500 uppercase block">Specification</span>
                        <span className="font-bold text-accent">
                          {bill.brand_name} {bill.diameter_mm}mm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-steel-500 uppercase block">Inward Volume</span>
                        <span className="font-mono font-bold text-accent">
                          {(bill.quantity_kg / 1000.0).toFixed(3)} MT
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-steel-500 uppercase block">Total Spend</span>
                        <span className="font-mono font-bold text-accent">
                          ₹{bill.total_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-steel-500 uppercase block">Attached Docs</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                          <Paperclip className="w-3 h-3" />
                          <span>{bill.document_count} Files</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-steel-500 font-mono">Date: {bill.bill_date}</span>
                      <Link
                        href={`/admin/bills/${bill.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-lg"
                      >
                        <span>View Details & Docs</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Entry Modal */}
      <AdminBillEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        onSuccess={() => {
          loadBillsData();
        }}
      />
    </SaasAdminLayout>
  );
}

export default function AdminBillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-steel-50 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-brand mx-auto" />
            <p className="text-sm font-semibold text-accent">Loading Inward Bills & Documents...</p>
          </div>
        </div>
      }
    >
      <AdminBillsContent />
    </Suspense>
  );
}
