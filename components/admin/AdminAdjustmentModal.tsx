'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Scale, ArrowRight, ShieldAlert, X } from 'lucide-react';

interface AdminAdjustmentModalProps {
  lot: {
    id: string;
    lot_number: string;
    brand_name: string;
    diameter_mm: number;
    grade: string;
    quantity_kg: number;
  };
  initialAdjustmentType?: 'add' | 'subtract' | 'set';
  initialReason?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAdjustmentModal({
  lot,
  initialAdjustmentType = 'subtract',
  initialReason = '',
  onClose,
  onSuccess,
}: AdminAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>(initialAdjustmentType);
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [reason, setReason] = useState<string>(initialReason);
  const [referenceNo, setReferenceNo] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQty = Number(lot.quantity_kg);
  const inputQty = parseFloat(quantityKg) || 0;

  let projectedQty = currentQty;
  if (adjustmentType === 'add') {
    projectedQty = currentQty + inputQty;
  } else if (adjustmentType === 'subtract') {
    projectedQty = currentQty - inputQty;
  } else if (adjustmentType === 'set') {
    projectedQty = inputQty;
  }

  const isNegative = projectedQty < 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isNaN(inputQty) || inputQty <= 0) {
      setError('Please specify a positive quantity in kilograms.');
      return;
    }

    if (isNegative) {
      setError(`Cannot deduct ${inputQty.toLocaleString()} kg: only ${currentQty.toLocaleString()} kg available in this lot.`);
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setError('Audit reason is required for stock movement records.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/stock/${lot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentType,
          quantityKg: inputQty,
          reason: reason.trim(),
          movementType: adjustmentType === 'subtract' ? 'dispatch_sale' : adjustmentType === 'add' ? 'inward_receipt' : 'yard_adjustment',
          referenceNo: referenceNo.trim() || undefined,
          idempotencyKey: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to adjust stock lot');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Adjustment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-steel-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-steel-100">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-accent text-base">Adjust Yard Stock Lot</h3>
          </div>
          <button
            onClick={onClose}
            className="text-steel-400 hover:text-accent p-1.5 rounded-lg hover:bg-steel-100 cursor-pointer"
            aria-label="Close adjustment modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lot Target Summary */}
        <div className="p-3 bg-neutral border border-steel-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-accent text-sm">
              {lot.brand_name} {lot.diameter_mm}mm ({lot.grade})
            </div>
            <div className="text-steel-500 font-mono mt-0.5">Lot: {lot.lot_number}</div>
          </div>
          <div className="text-right">
            <div className="text-steel-500 font-medium">Current Balance</div>
            <div className="font-mono font-extrabold text-brand text-sm">
              {currentQty.toLocaleString()} kg ({ (currentQty / 1000).toFixed(3) } MT)
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation Selector */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1.5 uppercase tracking-wider">
              Operation Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  adjustmentType === 'subtract'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm'
                    : 'bg-white border-steel-200 text-steel-600 hover:bg-neutral'
                }`}
              >
                - Dispatch Sale
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  adjustmentType === 'add'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                    : 'bg-white border-steel-200 text-steel-600 hover:bg-neutral'
                }`}
              >
                + Inward Influx
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  adjustmentType === 'set'
                    ? 'bg-brand-50 border-brand-400 text-brand-900 shadow-sm'
                    : 'bg-white border-steel-200 text-steel-600 hover:bg-neutral'
                }`}
              >
                = Audit Reconcile
              </button>
            </div>
          </div>

          {/* Quantity in Kilograms */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-accent uppercase tracking-wider">
                {adjustmentType === 'set' ? 'New Exact Balance (kg) *' : 'Amount to Change (kg) *'}
              </label>
              {inputQty > 0 && (
                <span className="text-xs font-mono text-steel-500">
                  = {(inputQty / 1000).toFixed(3)} MT
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.001"
              min="0"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent font-mono focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Projected Balance Preview */}
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isNegative ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-steel-50 border-steel-200 text-accent'
          }`}>
            <span className="font-medium">Projected Balance:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-steel-500 line-through">{currentQty.toLocaleString()} kg</span>
              <ArrowRight className="w-3.5 h-3.5 text-steel-400" />
              <span className={`font-mono font-bold text-sm ${isNegative ? 'text-rose-700' : 'text-brand'}`}>
                {projectedQty.toLocaleString()} kg ({ (projectedQty / 1000).toFixed(3) } MT)
              </span>
            </div>
          </div>

          {isNegative && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Overselling rejected: Quantity cannot be reduced below zero.</span>
            </div>
          )}

          {/* Audit Reason */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Reason for Adjustment *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Trailer loading for commercial site dispatch"
              required
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-xs font-bold text-accent mb-1 uppercase tracking-wider">
              Dispatch Slip / Invoice Ref.
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. DSP-2026-904"
              className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-steel-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || isNegative}
              className="cursor-pointer"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              <span>Confirm & Lock Movement</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
