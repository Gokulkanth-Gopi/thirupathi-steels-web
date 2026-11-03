import React from 'react';
import { cn } from '@/lib/utils';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface StockFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedDiameter: number | 'all';
  onDiameterChange: (diameter: number | 'all') => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  brandsList: string[];
  diametersList?: number[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StockFilter({
  searchTerm,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedDiameter,
  onDiameterChange,
  selectedStatus,
  onStatusChange,
  brandsList,
  diametersList = [8, 10, 12, 16, 20, 25],
  onRefresh,
  isRefreshing = false,
}: StockFilterProps) {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'in_stock', label: 'In Stock (>1,500 kg)' },
    { value: 'low_stock', label: 'Low Stock (≤1,500 kg)' },
    { value: 'out_of_stock', label: 'Out of Stock (0 kg)' },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-steel-200 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search lot #, brand, diameter, bay location..."
            className="w-full pl-9 pr-4 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent placeholder-steel-400 focus:outline-none focus:border-brand focus:bg-white transition-colors"
          />
        </div>

        {/* Brand Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            aria-label="Filter by Brand"
            className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
          >
            <option value="All">All Approved Brands</option>
            {brandsList.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by Status"
            className="w-full px-3 py-2 bg-neutral border border-steel-200 rounded-lg text-sm text-accent focus:outline-none focus:border-brand focus:bg-white"
          >
            {statusOptions.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <div className="md:col-span-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full md:w-auto justify-center cursor-pointer"
              title="Refresh live stock from PostgreSQL yard database"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-brand')} />
            </Button>
          </div>
        )}
      </div>

      {/* Diameter & Brand Fast-Filter Pills */}
      <div className="space-y-2 pt-2 border-t border-steel-100 text-xs">
        {/* Diameter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-steel-500 mr-2 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Diameter:</span>
          </span>
          <button
            onClick={() => onDiameterChange('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
              selectedDiameter === 'all'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-neutral text-steel-700 hover:bg-steel-200 border border-steel-200'
            )}
          >
            All Sizes
          </button>
          {diametersList.map((d) => (
            <button
              key={d}
              onClick={() => onDiameterChange(d)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                selectedDiameter === d
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-neutral text-steel-700 hover:bg-steel-200 border border-steel-200'
              )}
            >
              {d} mm
            </button>
          ))}
        </div>

        {/* Brand Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="font-bold text-steel-500 mr-2 uppercase tracking-wider">
            Brand:
          </span>
          <button
            onClick={() => onBrandChange('All')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
              selectedBrand === 'All'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-neutral text-steel-700 hover:bg-steel-200 border border-steel-200'
            )}
          >
            All Brands
          </button>
          {brandsList.map((brand) => (
            <button
              key={brand}
              onClick={() => onBrandChange(brand)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                selectedBrand === brand
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-neutral text-steel-700 hover:bg-steel-200 border border-steel-200'
              )}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
