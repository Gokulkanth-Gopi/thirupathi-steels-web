import React from 'react';
import { LiveStockWithDetails } from '@/db/schema';
import { StockStatusBadge } from '@/components/ui/StockStatusBadge';
import { formatTonnage, formatDate } from '@/lib/utils';
import { MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface StockCardProps {
  item: LiveStockWithDetails;
  onPreviewBill?: (item: LiveStockWithDetails) => void;
}

export function StockCard({ item, onPreviewBill }: StockCardProps) {
  return (
    <div className="rounded-xl bg-white border border-steel-200 p-5 shadow-card hover:shadow-card-hover hover:border-brand/40 transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand block mb-1">
              {item.brand} • {item.grade}
            </span>
            <h3 className="text-base font-extrabold text-accent group-hover:text-brand transition-colors">
              {item.product_name}
            </h3>
          </div>
          <StockStatusBadge status={item.stock_status} size="sm" />
        </div>

        <div className="space-y-2 py-3 border-y border-steel-100 my-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-steel-500 font-medium">Available Tonnage:</span>
            <span className="font-mono text-base font-bold text-accent">
              {formatTonnage(item.quantity)}
            </span>
          </div>

          {/* Visual progress bar */}
          <div className="w-full bg-steel-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                item.stock_status === 'in_stock'
                  ? 'bg-brand'
                  : item.stock_status === 'low_stock'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, (item.quantity / 50) * 100))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-steel-600 pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-steel-400" />
              <span>{item.location}</span>
            </span>
            <span className="font-mono text-steel-500">
              Updated: {formatDate(item.last_updated)}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        {item.bill_number ? (
          <button
            onClick={() => onPreviewBill?.(item)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bill: {item.bill_number}</span>
          </button>
        ) : (
          <span className="text-xs text-steel-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
            <span>Mill Verified</span>
          </span>
        )}

        <Button
          href={`https://wa.me/919003461089?text=Hello%20Thirupathi%20Steels,%20I%20want%20to%20enquire%20about%20stock%20for%20${encodeURIComponent(
            item.product_name
          )}`}
          variant="outline"
          size="sm"
          className="text-xs py-1"
        >
          Enquire
        </Button>
      </div>
    </div>
  );
}
