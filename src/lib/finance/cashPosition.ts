import type { CashReserve, CurrencyCode, Expense, PartnerShare } from '../../types';
import { isProfitDistribution } from '../../types';

// Onde está o dinheiro do caixa: reservado (com destino), por enviar aos sócios, ou livre.

type Convert = (amount: number, from: CurrencyCode) => number;

export interface ReserveStatus {
  reserve: CashReserve;
  used: number;
  remaining: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Cada reserva aberta: quanto foi reservado, quanto já se gastou dela e quanto sobra. */
export function reserveStatuses(reserves: CashReserve[], expenses: Expense[], conv: Convert): ReserveStatus[] {
  return reserves
    .filter((r) => !r.closed)
    .map((reserve) => {
      const used = expenses
        .filter((e) => e.paid && e.reserveId === reserve.id)
        .reduce((s, e) => s + conv(e.amount, e.currency), 0);
      const allocated = conv(reserve.amount, reserve.currency);
      return { reserve, used: round2(used), remaining: round2(Math.max(0, allocated - used)) };
    });
}

/** Distribuições a sócios lançadas mas ainda não enviadas: o dinheiro continua no caixa. */
export function owedToPartners(expenses: Expense[], conv: Convert): number {
  return round2(expenses.filter((e) => !e.paid && isProfitDistribution(e)).reduce((s, e) => s + conv(e.amount, e.currency), 0));
}

export function cashBreakdown(cashBalance: number, reserves: ReserveStatus[], owed: number) {
  const reserved = round2(reserves.reduce((s, r) => s + r.remaining, 0));
  return { reserved, owed, free: round2(cashBalance - reserved - owed) };
}

/**
 * Divide um valor pelos sócios segundo as percentagens. Cada parte é uma despesa
 * "Distribuição a sócios": paga se já foi enviada, por pagar se ainda está no caixa.
 * O último sócio fica com os cêntimos do arredondamento, para a soma bater certo.
 */
export function buildPartnerDistribution(params: {
  amount: number;
  date: string;
  currency: CurrencyCode;
  split: PartnerShare[];
  sent: Record<string, boolean>;
  reference: string;
  idPrefix: string;
}): Expense[] {
  const { amount, date, currency, split, sent, reference, idPrefix } = params;
  const shares = split.filter((p) => p.percent > 0);
  let allocated = 0;
  return shares.map((p, idx) => {
    const isLast = idx === shares.length - 1;
    const value = isLast ? round2(amount - allocated) : round2((amount * p.percent) / 100);
    allocated = round2(allocated + value);
    return {
      id: `${idPrefix}-${idx + 1}`,
      category: 'Distribuição a sócios',
      description: `${p.name} (${p.percent}%) - ${reference}`,
      amount: value,
      currency,
      date,
      paid: Boolean(sent[p.name]),
      partnerName: p.name,
      createdAt: date,
    };
  });
}

export function splitTotal(split: PartnerShare[]): number {
  return round2(split.reduce((s, p) => s + (Number(p.percent) || 0), 0));
}

/** Quanto cada sócio deve à empresa por adiantamentos (dinheiro entregue a mais). */
export function partnerAdvances(expenses: Expense[], conv: Convert): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    if (!e.paid || e.category !== 'Adiantamento a sócio' || !e.partnerName) continue;
    out[e.partnerName] = round2((out[e.partnerName] || 0) + conv(e.amount, e.currency));
  }
  for (const k of Object.keys(out)) if (out[k] <= 0) delete out[k];
  return out;
}

/**
 * Descontar uma parte da distribuição no adiantamento do sócio: em vez de enviar dinheiro,
 * reduz-se o adiantamento (do mais antigo para o mais recente). Devolve os adiantamentos
 * alterados e quanto ficou por descontar.
 */
export function offsetAdvance(advances: Expense[], amount: number): { updated: Expense[]; remainder: number } {
  let left = round2(amount);
  const updated: Expense[] = [];
  for (const a of [...advances].sort((x, y) => x.date.localeCompare(y.date))) {
    if (left <= 0) break;
    const take = Math.min(left, a.amount);
    updated.push({ ...a, amount: round2(a.amount - take) });
    left = round2(left - take);
  }
  return { updated, remainder: left };
}
