import type { CashCheckpoint, CurrencyCode, Income } from '../../types';

const round2 = (n: number) => Math.round(n * 100) / 100;
type ConvertAt = (amount: number, from: CurrencyCode, date: string) => number;

/**
 * Valor de uma entrada recebida na moeda pedida. Se passou pela Stripe, conta o que ficou de facto
 * (líquido, fixo na moeda do saldo). Na moeda faturada mostra os reais que chegaram de facto
 * (líquido ao câmbio da Stripe nesse dia). Noutra moeda converte o líquido.
 */
export function incomeValue(i: Income, to: CurrencyCode, convAt: ConvertAt): number {
  const s = i.settled;
  const date = (i.receivedDate || i.dueDate || '').slice(0, 10);
  if (!s) return convAt(i.amount, i.currency, date);
  if (to === s.currency) return s.amount;
  if (to === i.currency && s.rate > 0) return round2(s.amount / s.rate);
  return convAt(s.amount, s.currency, s.date || date);
}

export const settledFeesTotal = (i: Income) => round2((i.settled?.fees || []).reduce((a, f) => a + f.amount, 0));

/** Último fecho de caixa (o mais recente por data). */
export function latestCheckpoint(list: CashCheckpoint[]): CashCheckpoint | undefined {
  return list.reduce<CashCheckpoint | undefined>((best, c) => (!best || c.date > best.date ? c : best), undefined);
}
