// src/config/currencies.ts
// ============================================================
// Catálogo Expansível de Moedas Suportadas
// ============================================================

export type CurrencyCode = 'BRL' | 'AOA' | 'USD' | 'EUR' | 'GBP' | 'MZN' | 'CVE';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  defaultCountry: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real (Brasil)', flag: '', locale: 'pt-BR', defaultCountry: 'BR' },
  AOA: { code: 'AOA', symbol: 'Kz', name: 'Kwanza (Angola)', flag: '', locale: 'pt-AO', defaultCountry: 'AO' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar (EUA)', flag: '', locale: 'en-US', defaultCountry: 'US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (Portugal/UE)', flag: '', locale: 'pt-PT', defaultCountry: 'PT' },
  GBP: { code: 'GBP', symbol: '£', name: 'Libra Esterlina', flag: '', locale: 'en-GB', defaultCountry: 'GB' },
  MZN: { code: 'MZN', symbol: 'MT', name: 'Metical (Moçambique)', flag: '', locale: 'pt-MZ', defaultCountry: 'MZ' },
  CVE: { code: 'CVE', symbol: 'Esc', name: 'Escudo (Cabo Verde)', flag: '', locale: 'pt-CV', defaultCountry: 'CV' },
};

/** Formata valor monetário com símbolo e locale adequado */
export function formatCurrencyAmount(amount: number, currency: CurrencyCode = 'BRL'): string {
  const conf = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.BRL;
  try {
    return new Intl.NumberFormat(conf.locale, {
      style: 'currency',
      currency: conf.code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${conf.symbol} ${Number(amount).toFixed(2)}`;
  }
}
