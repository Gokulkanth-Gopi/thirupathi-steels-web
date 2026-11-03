import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  containerClassName?: string;
  background?: 'neutral' | 'white' | 'dark' | 'brand';
}

export function Section({
  className,
  containerClassName,
  background = 'neutral',
  children,
  ...props
}: SectionProps) {
  const backgrounds = {
    neutral: 'bg-neutral',
    white: 'bg-white',
    dark: 'bg-accent text-white',
    brand: 'bg-brand text-white',
  };

  return (
    <section
      className={cn('relative py-12 md:py-20 overflow-hidden', backgrounds[background], className)}
      {...props}
    >
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', containerClassName)}>
        {children}
      </div>
    </section>
  );
}
