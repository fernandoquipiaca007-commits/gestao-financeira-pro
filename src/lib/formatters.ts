import { CurrencyCode, CURRENCIES } from '../types';

/**
 * Formats a number with its currency symbol and locale-appropriate decimals.
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'BRL'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  switch (currencyCode) {
    case 'BRL':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(safeAmount);
      
    case 'AOA': {
      // Format as e.g. "350.000,00 Kz" or "350.000 Kz"
      const formatted = new Intl.NumberFormat('pt-AO', {
        minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
      return `${formatted} Kz`;
    }

    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(safeAmount);

    case 'EUR':
      return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
      }).format(safeAmount);

    default:
      return `${safeAmount.toLocaleString()} ${currencyCode}`;
  }
}

/**
 * Clean phone number for WhatsApp wa.me links
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, plus signs
  return phone.replace(/\D/g, '');
}

/**
 * Generate a pre-filled WhatsApp link with polite text
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  if (!cleanPhone) return `https://wa.me/?text=${encodedText}`;
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Format YYYY-MM-DD into DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

/**
 * Get relative days difference from today (0 = today, negative = past/overdue)
 */
export function getDaysDiff(dateString: string): number {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return 0;
  
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 */
export function isToday(dateString: string): boolean {
  return getDaysDiff(dateString) === 0;
}

/**
 * Get current year and month YYYY-MM
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Convert amounts approximately between currencies for consolidation if needed
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: { BRL: number; AOA: number; USD: number; EUR: number }
): number {
  if (from === to) return amount;
  
  // Convert 'from' to BRL first
  let amountInBRL = amount;
  if (from === 'AOA') amountInBRL = amount / (rates.AOA || 165);
  else if (from === 'USD') amountInBRL = amount / (rates.USD || 0.18);
  else if (from === 'EUR') amountInBRL = amount / (rates.EUR || 0.16);

  // Convert BRL to 'to'
  if (to === 'BRL') return amountInBRL;
  if (to === 'AOA') return amountInBRL * (rates.AOA || 165);
  if (to === 'USD') return amountInBRL * (rates.USD || 0.18);
  if (to === 'EUR') return amountInBRL * (rates.EUR || 0.16);

  return amount;
}
