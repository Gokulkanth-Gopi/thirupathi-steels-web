import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  description: string;
  breadcrumbCurrent?: string;
}

export function PageHero({
  badge,
  title,
  description,
  breadcrumbCurrent,
  className,
  children,
  ...props
}: PageHeroProps) {
  return (
    <div
      className={cn(
        'relative bg-accent text-white py-14 sm:py-20 border-b border-steel-700/60 overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Subtle industrial background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none subtle-grid" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/20 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {breadcrumbCurrent && (
          <div className="text-xs text-steel-300">
            <span className="hover:text-white transition-colors">Home</span>
            <span className="mx-2 text-steel-400">/</span>
            <span className="text-brand-300 font-medium">{breadcrumbCurrent}</span>
          </div>
        )}

        {badge && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand/20 text-brand-200 border border-brand/30">
            {badge}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-steel-200 max-w-3xl leading-relaxed">
          {description}
        </p>

        {children}
      </div>
    </div>
  );
}
