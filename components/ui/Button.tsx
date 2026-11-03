import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  isExternal?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', href, isExternal, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-brand hover:bg-brand-600 text-white shadow-sm border border-brand-600/30',
      secondary:
        'bg-accent text-white hover:bg-accent-dark shadow-sm border border-accent/40',
      outline:
        'border border-steel-300 hover:border-brand text-accent hover:text-brand hover:bg-brand-50 bg-white',
      ghost:
        'text-accent hover:text-brand hover:bg-steel-100',
      whatsapp:
        'bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-sm font-semibold border border-[#20BD5A]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    };

    const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

    if (href) {
      if (isExternal || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('https://wa.me')) {
        return (
          <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={combinedClassName}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={combinedClassName}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
