import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionHeading({
  badge,
  title,
  subtitle,
  centered = false,
  light = false,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl space-y-2 mb-8 md:mb-12',
        centered && 'mx-auto text-center',
        className
      )}
      {...props}
    >
      {badge && (
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border',
            light
              ? 'bg-white/10 text-brand-100 border-white/20'
              : 'bg-brand-50 text-brand-700 border-brand-200'
          )}
        >
          {badge}
        </span>
      )}
      <h2
        className={cn(
          'text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight',
          light ? 'text-white' : 'text-accent'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-sm sm:text-base leading-relaxed',
            light ? 'text-steel-200' : 'text-steel-600'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
