import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'teal',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const dotColors = {
    teal: 'bg-teal-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
