import { CurrencyCode } from '../types';

export interface ExchangeRates {
  BRL: number; // rate relative to 1 BRL
  AOA: number; // e.g. 165 AOA per 1 BRL
  USD: number; // e.g. 0.18 USD per 1 BRL
  EUR: number; // e.g. 0.16 EUR per 1 BRL
}

const DEFAULT_RATES: ExchangeRates = {
  BRL: 1,
  AOA: 165,
  USD: 0.18,
  EUR: 0.16,
};

const EXCHANGE_CACHE_KEY = 'gfo_exchange_rates_v1';
const EXCHANGE_LAST_FETCH_KEY = 'gfo_exchange_last_fetch';

export function getCachedRates(): ExchangeRates {
  try {
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Failed to parse cached exchange rates', err);
  }
  return DEFAULT_RATES;
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  const apiUrl = import.meta.env.VITE_EXCHANGE_API_URL || 'https://open.er-api.com/v6/latest/USD';
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    if (data && data.rates) {
      const usdToBrl = data.rates.BRL || 5.5;
      const usdToAoa = data.rates.AOA || 910;
      const usdToEur = data.rates.EUR || 0.92;

      // Calculate rates relative to 1 BRL
      const rates: ExchangeRates = {
        BRL: 1,
        AOA: parseFloat((usdToAoa / usdToBrl).toFixed(2)),
        USD: parseFloat((1 / usdToBrl).toFixed(4)),
        EUR: parseFloat((usdToEur / usdToBrl).toFixed(4)),
      };

      localStorage.setItem(EXCHANGE_CACHE_KEY, JSON.stringify(rates));
      localStorage.setItem(EXCHANGE_LAST_FETCH_KEY, new Date().toISOString());
      return rates;
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using fallback/cached rates:', err);
  }
  return getCachedRates();
}

/**
 * Converts an amount from sourceCurrency to targetCurrency using relative BRL exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: ExchangeRates = getCachedRates()
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!amount) return 0;

  // Convert amount from source currency to BRL base
  const rateFrom = rates[fromCurrency] || 1;
  const amountInBrl = fromCurrency === 'BRL' ? amount : amount / rateFrom;

  // Convert BRL base to target currency
  const rateTo = rates[toCurrency] || 1;
  if (toCurrency === 'BRL') return amountInBrl;
  return amountInBrl * rateTo;
}
