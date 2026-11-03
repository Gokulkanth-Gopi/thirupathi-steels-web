import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StockStatus } from '@/db/schema';

/**
 * Combines Tailwind classes with clsx and twMerge safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats metric tonnage with unit label
 */
export function formatTonnage(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00 MT';
  return `${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} MT`;
}

/**
 * Formats Indian Rupee currency safely
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats ISO date string into readable Indian standard format (e.g., 23 Oct 2026)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats date and time into Salem IST display
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns badge style tokens for live stock availability status
 */
export function getStockStatusBadge(status: StockStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'in_stock':
      return {
        label: 'Ready in Yard',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-400 animate-pulse',
      };
    case 'low_stock':
      return {
        label: 'Limited Stock',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-400',
      };
    case 'incoming':
      return {
        label: 'Transit / Incoming',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        dotClass: 'bg-cyan-400',
      };
    case 'out_of_stock':
    default:
      return {
        label: 'Sold Out / Pre-order',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-400',
      };
  }
}
