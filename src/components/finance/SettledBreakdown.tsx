import React from 'react';
import type { Income } from '../../types';
import { formatCurrency } from '../../lib/formatters';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** O que entrou de facto na Stripe: bruto, cada taxa, líquido (fixo) e os reais que chegaram. */
export function SettledBreakdown({ incomes, isEn, compact = false }: { incomes: Income[]; isEn: boolean; compact?: boolean }) {
  const list = incomes.filter((i) => i.status === 'Recebido' && i.settled);
  if (!list.length) return null;
  const cur = list[0].settled!.currency;
  const billedCur = list[0].currency;
  const gross = r2(list.reduce((a, i) => a + i.settled!.gross, 0));
  const net = r2(list.reduce((a, i) => a + i.settled!.amount, 0));
  const fees = new Map<string, number>();
  list.forEach((i) => i.settled!.fees.forEach((f) => fees.set(f.label, r2((fees.get(f.label) || 0) + f.amount))));
  const netBilled = r2(list.reduce((a, i) => a + (i.settled!.rate > 0 ? i.settled!.amount / i.settled!.rate : 0), 0));
  const feeTotal = r2(gross - net);
  const pct = gross > 0 ? ((feeTotal / gross) * 100).toFixed(1).replace('.', ',') : '0';
  const label: Record<string, string> = isEn
    ? { 'Processamento do cartão': 'Card processing', 'Conversão de moeda': 'Currency conversion', Climate: 'Climate', Invoicing: 'Invoicing' }
    : {};
  const line = (l: string, v: React.ReactNode, cls = '') => (
    <div className={`flex items-center justify-between gap-3 text-[12px] ${cls}`}><span className="text-fg-muted">{l}</span><span className="tabular-nums">{v}</span></div>
  );
  return (
    <div className={`${compact ? '' : 'mt-4 pt-3 border-t border-line-subtle'} grid gap-1`}>
      {!compact && <p className="m-0 mb-1 text-[12px] font-semibold text-fg-secondary">{isEn ? 'What really arrived in Stripe' : 'O que entrou de facto na Stripe'}</p>}
      {line(isEn ? 'Gross' : 'Bruto', formatCurrency(gross, cur))}
      {[...fees.entries()].filter(([, v]) => v > 0).map(([l, v]) => line(`− ${label[l] || l}`, `− ${formatCurrency(v, cur)}`))}
      {line(isEn ? `Fees (${pct}%)` : `Taxas (${pct}%)`, `− ${formatCurrency(feeTotal, cur)}`, 'border-t border-dashed border-line-subtle pt-1')}
      {line(isEn ? 'Net in Stripe (fixed)' : 'Líquido na Stripe (fixo)', <strong className="text-success-fg">{formatCurrency(net, cur)}</strong>)}
      {billedCur !== cur && line(isEn ? 'In reais (Stripe rate of the day)' : 'Em reais (câmbio Stripe do dia)', formatCurrency(netBilled, billedCur))}
      {list.length === 1 && line(isEn ? 'Stripe rate' : 'Câmbio Stripe', `1 ${billedCur} = ${list[0].settled!.rate.toFixed(6)} ${cur} · ${list[0].settled!.date.split('-').reverse().join('/')}`)}
    </div>
  );
}
