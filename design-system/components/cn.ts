import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Junta classes condicionais e resolve conflitos Tailwind (igual a src/lib/utils.ts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata moeda com a locale da app. Valores grandes compactam (12,9 mil / 4,2 M). */
export function formatMoney(value: number, currency = 'EUR', opts: { compact?: boolean; locale?: string } = {}) {
  const { compact = false, locale = 'pt-PT' } = opts;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}
