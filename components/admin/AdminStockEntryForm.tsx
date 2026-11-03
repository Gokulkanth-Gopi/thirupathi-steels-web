'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlusCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { APPROVED_BRAND_IDS, SUPPORTED_DIAMETERS } from '@/lib/validations/stock';

interface AdminStockEntryFormProps {
  onSuccess: () => void;
}

export function AdminStockEntryForm({ onSuccess }: AdminStockEntryFormProps) {
  const [brandId, setBrandId] = useState('tata-tiscon');
  const [diameterMm, setDiameterMm] = useState(12);
  const [grade, setGrade] = useState('Fe 550D');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [location, setLocation] = useState('Salem Main Yard');
  const [bayNumber, setBayNumber] = useState('Bay A-1');
  const [mfgBatchNo, setMfgBatchNo] = useState('');
  const [reason, setReason] = useState('Verified Salem Yard consignment arrival');
  const [referenceNo, setReferenceNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const numericQty = parseFloat(quantityKg) || 0;
  const mtEquivalent = (numericQty / 1000).toFixed(3);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isNaN(numericQty) || numericQty <= 0) {
      setError('Please enter a valid positive quantity in kilograms.');
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setError('Audit reason is required for physical inventory entry.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          diameterMm: Number(diameterMm),
          grade,
          quantityKg: numericQty,
          location,
          bayNumber: bayNumber.trim() || undefined,
          mfgBatchNo: mfgBatchNo.trim() || undefined,
          reason: reason.trim(),
          referenceNo: referenceNo.trim() || undefined,
          idempotencyKey: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create stock lot');
      }

      setSuccessMsg(`Lot '${json.data.lot_number}' successfully created (${numericQty.toLocaleString()} kg / ${mtEquivalent} MT)!`);
      setQuantityKg('');
      setMfgBatchNo('');
      setReferenceNo('');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while saving the lot.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-steel-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-steel-100">
        <div>
          <h3 className="text-base font-bold text-accent flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand" />
            <span>Enter Verified Stock Consignment (kg)</span>
          </h3>
          <p className="text-xs text-steel-500 mt-0.5">
            Record physical steel entering the Salem yard. Updates PostgreSQL authoritative inventory with an immutable audit log.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Brand */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Approved Brand *
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            >
              <option value="tata-tiscon">TATA TISCON (Primary)</option>
              <option value="suryadev">SURYADEV (Secondary)</option>
              <option value="agni">AGNI (Secondary)</option>
              <option value="ssi">SSI TMT (Secondary)</option>
              <option value="chakraa">JPR (Secondary)</option>
            </select>
          </div>

          {/* Diameter */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Rebar Diameter *
            </label>
            <select
              value={diameterMm}
              onChange={(e) => setDiameterMm(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            >
              {SUPPORTED_DIAMETERS.map((d) => (
                <option key={d} value={d}>
                  {d} mm Rebar
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Quality Grade
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            >
              <option value="Fe 550D">Fe 550D (Super Ductile)</option>
              <option value="Fe 500D">Fe 500D (Standard Ductile)</option>
            </select>
          </div>

          {/* Quantity in Kilograms */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-accent uppercase tracking-wider">
                Quantity (kg) *
              </label>
              {numericQty > 0 && (
                <span className="text-xs font-mono font-bold text-brand">
                  = {mtEquivalent} MT
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.001"
              min="0"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              placeholder="e.g. 25000"
              required
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Yard Location */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Yard Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Bay Number */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Yard Bay / Stacking Rack
            </label>
            <input
              type="text"
              value={bayNumber}
              onChange={(e) => setBayNumber(e.target.value)}
              placeholder="e.g. Bay A-1"
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Mfg Batch / Heat No */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Mill Batch / Heat No.
            </label>
            <input
              type="text"
              value={mfgBatchNo}
              onChange={(e) => setMfgBatchNo(e.target.value)}
              placeholder="e.g. BATCH-2026-88"
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Weighbridge Slip Ref.
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. WB-SALEM-489"
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>
        </div>

        {/* Audit Reason */}
        <div>
          <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
            Audit Reason & Notes (Required for Stock Audit Trail) *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Direct mill plant trailer delivery cleared at yard weighbridge"
            required
            className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="w-4 h-4 mr-2" />
            )}
            <span>Commit Inward Stock Lot</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
