'use client';

import React, { useState } from 'react';
import {
  X,
  FilePlus2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calculator,
  Truck,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminBillEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const APPROVED_BRANDS = [
  { id: 'tata-tiscon', name: 'TATA TISCON' },
  { id: 'suryadev', name: 'SURYADEV' },
  { id: 'agni', name: 'AGNI' },
  { id: 'ssi', name: 'SSI TMT' },
  { id: 'chakraa', name: 'JPR' },
];

const SUPPORTED_DIAMETERS = [8, 10, 12, 16, 20, 25];

export function AdminBillEntryModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminBillEntryModalProps) {
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [brandId, setBrandId] = useState('tata-tiscon');
  const [diameterMm, setDiameterMm] = useState<number>(12);
  const [grade, setGrade] = useState('Fe 550D');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [ratePerKg, setRatePerKg] = useState<string>('');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18.0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partially_paid' | 'unpaid'>('paid');
  const [bayNumber, setBayNumber] = useState('');
  const [bays, setBays] = useState<{ bay_id: string; bay_code: string; name: string; max_capacity_mt: number }[]>([]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchBays() {
      try {
        const res = await fetch('/api/bays');
        const json = await res.json();
        if (json.success && json.data?.bays) {
          setBays(json.data.bays);
        }
      } catch (err) {
        console.error('Failed to load bays for bills:', err);
      }
    }
    fetchBays();
  }, []);

  if (!isOpen) return null;

  // Live financial preview
  const numQty = parseFloat(quantityKg) || 0;
  const numRate = parseFloat(ratePerKg) || 0;
  const subtotal = Math.round(numQty * numRate * 100) / 100;
  const tax = Math.round(subtotal * (taxRatePercent / 100.0) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const tonnageMt = (numQty / 1000.0).toFixed(3);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!billNumber.trim() || !supplier.trim() || numQty <= 0 || numRate <= 0) {
      setErrorMsg('Please complete all required fields with valid quantities and rates.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billNumber: billNumber.trim(),
          billDate,
          supplier: supplier.trim(),
          vehicleNo: vehicleNo.trim() || null,
          brandId,
          diameterMm,
          grade,
          quantityKg: numQty,
          ratePerKg: numRate,
          taxRatePercent,
          paymentStatus,
          location: 'Salem Main Yard',
          bayNumber: bayNumber.trim() || null,
          notes: notes.trim() || null,
          idempotencyKey: `idemp_${billNumber.trim().toLowerCase()}_${Date.now()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create inward bill');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-steel-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-steel-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record Inward Consignment Bill</h2>
              <p className="text-xs text-steel-400">Atomic bill creation and physical yard stock lot update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-steel-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Bill & Supplier Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-steel-500 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand" />
              <span>Invoice & Commercial Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Supplier Invoice Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-SALEM-088"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Supplier / Mill Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Steel Limited - Authorized Depot"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Transport Vehicle Number
                </label>
                <div className="relative">
                  <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-steel-400" />
                  <input
                    type="text"
                    placeholder="e.g. TN-30-AA-5588"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                >
                  <option value="paid">Paid (Fully Settled)</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="unpaid">Unpaid (Credit Consignment)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Steel Lot Specifications */}
          <div className="pt-2 border-t border-steel-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-steel-500 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Steel Specifications & Yard Placement</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white font-bold"
                >
                  {APPROVED_BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Diameter (mm) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={diameterMm}
                  onChange={(e) => setDiameterMm(parseInt(e.target.value, 10))}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white font-bold font-mono"
                >
                  {SUPPORTED_DIAMETERS.map((d) => (
                    <option key={d} value={d}>
                      {d} mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Steel Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white font-mono"
                >
                  <option value="Fe 550D">Fe 550D (Standard)</option>
                  <option value="Fe 500D">Fe 500D</option>
                  <option value="Fe 550">Fe 550</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Inward Quantity (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="e.g. 24500"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand font-mono font-bold"
                />
                <span className="text-[10px] text-steel-500 mt-0.5 block">
                  ≈ {tonnageMt} Metric Tons
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1">
                  Rate per kg (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 54.50"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-steel-700 mb-1 flex items-center justify-between">
                  <span>Yard Bay / Stacking Berth</span>
                  {bays.length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-800 font-bold lowercase">
                      ({bays.length} in db)
                    </span>
                  )}
                </label>
                <select
                  value={bayNumber}
                  onChange={(e) => setBayNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white cursor-pointer"
                >
                  <option value="">Unassigned / Yard Floor</option>
                  {bays.map((b) => (
                    <option key={b.bay_id || b.bay_code} value={b.bay_code}>
                      {b.bay_code} — {b.name} ({b.max_capacity_mt} MT)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Live Financial Summary Breakdown */}
          <div className="bg-steel-50 border border-steel-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-2">
              <Calculator className="w-3.5 h-3.5 text-brand" />
              <span>Commercial Breakdown (18% GST Applicable)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-steel-200">
                <span className="text-[10px] text-steel-500 uppercase block">Subtotal</span>
                <span className="font-mono font-bold text-accent">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-steel-200">
                <span className="text-[10px] text-steel-500 uppercase block">GST (18%)</span>
                <span className="font-mono font-bold text-amber-700">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-brand/10 p-2 rounded-lg border border-brand/20">
                <span className="text-[10px] text-brand uppercase font-bold block">Total Spend</span>
                <span className="font-mono font-extrabold text-brand">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-steel-700 mb-1">
              Internal Notes & Weighment Ticket Cross-Reference
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Weighed at Salem Yard Weighbridge Ticket #WB-9081; bundled in 12m commercial lengths."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-steel-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-steel-300 rounded-lg text-xs font-semibold text-steel-700 hover:bg-steel-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Inward Consignment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Create Bill & Inward Lot</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
