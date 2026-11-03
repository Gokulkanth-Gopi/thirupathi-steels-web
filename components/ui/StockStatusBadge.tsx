import React from 'react';
import { cn } from '@/lib/utils';
import { StockStatus } from '@/db/schema';

export interface StockStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export function StockStatusBadge({
  status,
  size = 'md',
  className,
  ...props
}: StockStatusBadgeProps) {
  const configs = {
    in_stock: {
      label: 'IN STOCK',
      container: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      dot: 'bg-emerald-600',
    },
    low_stock: {
      label: 'LOW STOCK',
      container: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      dot: 'bg-amber-600',
    },
    out_of_stock: {
      label: 'OUT OF STOCK',
      container: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      dot: 'bg-rose-600',
    },
    incoming: {
      label: 'INCOMING',
      container: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
      dot: 'bg-sky-600',
    },
  };

  const current = configs[status] || configs.out_of_stock;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-semibold',
        current.container,
        sizeClasses,
        className
      )}
      {...props}
    >
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', current.dot)} />
      <span>{current.label}</span>
    </span>
  );
}
