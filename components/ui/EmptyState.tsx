import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search criteria or filter options to find what you are looking for.',
  actionLabel,
  onAction,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 px-4 rounded-xl border border-dashed border-steel-300 bg-white shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-steel-100 text-steel-500 flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-accent mb-1">{title}</h3>
      <p className="text-sm text-steel-600 mb-6 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
