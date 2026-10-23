import type { CurrencyCode } from '../types';

/**
 * Câmbio do sistema. Fonte principal: fawazahmed0/exchange-api (GitHub, gratuita, sem chave),
 * que tem o Kwanza e o histórico dia a dia. Dois servidores (Cloudflare e jsDelivr) para um
 * servir de reserva ao outro; o open.er-api fica como último recurso para o câmbio de hoje.
 * As taxas são sempre "quanto vale 1 BRL" em cada moeda.
 */
export interface FxRates { BRL: number; AOA: number; USD: number; EUR: number }
export interface FxQuote { rates: FxRates; date: string; source: string }

/** Primeiro dia com histórico nesta fonte. */
export const FX_HISTORY_START = '2024-03-02';
const CACHE_PREFIX = 'fx_brl_v1:';
const memory = new Map<string, FxQuote>();

const toRates = (r: Record<string, number> | undefined): FxRates | null => {
  if (!r) return null;
  const aoa = Number(r.aoa ?? r.AOA), usd = Number(r.usd ?? r.USD), eur = Number(r.eur ?? r.EUR);
  if (!(aoa > 0 && usd > 0 && eur > 0)) return null;
  return { BRL: 1, AOA: aoa, USD: usd, EUR: eur };
};

async function getJson(url: string, timeoutMs = 8000): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** URLs da fonte principal para uma data ('latest' ou AAAA-MM-DD), por ordem de preferência. */
export function fxUrls(tag: string): string[] {
  return [
    `https://${tag}.currency-api.pages.dev/v1/currencies/brl.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/brl.json`,
  ];
}

async function fetchTag(tag: string): Promise<FxQuote | null> {
  for (const url of fxUrls(tag)) {
    const j = await getJson(url);
    const rates = toRates(j?.brl);
    if (rates) return { rates, date: String(j.date || tag), source: 'fawazahmed0/exchange-api' };
  }
  return null;
}

/** Câmbio deste momento (o mais recente publicado). Chamado sempre que se escolhe uma moeda. */
let latestInFlight: { at: number; p: Promise<FxQuote | null> } | null = null;
export function fetchLatestFx(force = false): Promise<FxQuote | null> {
  if (!force && latestInFlight && Date.now() - latestInFlight.at < 60_000) return latestInFlight.p;
  const p = fetchLatestFxNow();
  latestInFlight = { at: Date.now(), p };
  return p;
}

async function fetchLatestFxNow(): Promise<FxQuote | null> {
  const q = await fetchTag('latest');
  if (q) { memory.set('latest', q); return q; }
  const j = await getJson('https://open.er-api.com/v6/latest/BRL');
  const rates = toRates(j?.rates);
  if (rates) {
    const quote = { rates, date: new Date((j.time_last_update_unix || Date.now() / 1000) * 1000).toISOString().slice(0, 10), source: 'open.er-api.com' };
    memory.set('latest', quote);
    return quote;
  }
  return null;
}

const readCache = (date: string): FxQuote | null => {
  if (memory.has(date)) return memory.get(date)!;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + date);
    if (raw) { const q = JSON.parse(raw) as FxQuote; memory.set(date, q); return q; }
  } catch { /* sem armazenamento: fica só em memória */ }
  return null;
};

const writeCache = (date: string, q: FxQuote) => {
  memory.set(date, q);
  try { localStorage.setItem(CACHE_PREFIX + date, JSON.stringify(q)); } catch { /* ignorar */ }
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const prevDay = (d: string) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };

/** Data que se pede à fonte: antes do início do histórico usa o primeiro dia; hoje ou depois usa o mais recente. */
export function fxDayFor(date: string): string {
  const d = (date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d >= todayIso()) return 'latest';
  return d < FX_HISTORY_START ? FX_HISTORY_START : d;
}

/** Câmbio de um dia já carregado (ou undefined). Síncrono, para os cálculos. */
export function fxAt(date: string): FxRates | undefined {
  const day = fxDayFor(date);
  return readCache(day)?.rates;
}

/** Carrega o câmbio dos dias pedidos que ainda não estão guardados. Devolve true se carregou algum. */
export async function loadFxDays(dates: string[], concurrency = 6): Promise<boolean> {
  const days = Array.from(new Set(dates.map(fxDayFor))).filter((d) => d !== 'latest' && !readCache(d));
  let loaded = false;
  let i = 0;
  const worker = async () => {
    while (i < days.length) {
      const day = days[i++];
      // um dia sem ficheiro (raro) usa o dia anterior publicado
      let q: FxQuote | null = null;
      for (let k = 0, d = day; k < 5 && !q; k++, d = prevDay(d)) q = await fetchTag(d);
      if (q) { writeCache(day, q); loaded = true; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, days.length) }, worker));
  return loaded;
}

/** Converte usando taxas "1 BRL = x". */
export function convertWith(amount: number, from: CurrencyCode, to: CurrencyCode, rates: FxRates): number {
  if (from === to || !amount) return amount || 0;
  const inBrl = from === 'BRL' ? amount : amount / (rates[from] || 1);
  return to === 'BRL' ? inBrl : inBrl * (rates[to] || 1);
}
