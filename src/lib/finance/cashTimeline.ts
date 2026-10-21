import type { CurrencyCode, Expense, Income, Project } from '../../types';
import { isCashOut } from '../../types';
import { paidCommissions } from './projectPayments';

// Caixa antes e depois de cada movimento real (receita recebida, despesa paga, comissão paga),
// por ordem de data. No mesmo dia, as entradas vêm antes das saídas.

export interface CashStep { before: number; after: number }

type Convert = (amount: number, from: CurrencyCode) => number;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function cashTimeline(incomes: Income[], expenses: Expense[], projects: Project[], conv: Convert): Map<string, CashStep> {
  const moves: { key: string; date: string; delta: number; order: number }[] = [];
  incomes.filter((i) => i.status === 'Recebido').forEach((i) => {
    moves.push({ key: `inc:${i.id}`, date: (i.receivedDate || i.dueDate || '').slice(0, 10), delta: conv(i.amount, i.currency), order: 0 });
  });
  expenses.filter(isCashOut).forEach((e) => {
    moves.push({ key: `exp:${e.id}`, date: (e.date || '').slice(0, 10), delta: -conv(e.amount, e.currency), order: 1 });
  });
  paidCommissions(projects, incomes).forEach((c) => {
    moves.push({ key: `com:${c.project.id}`, date: c.date, delta: -conv(c.amount, c.project.currency), order: 1 });
  });
  moves.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.key.localeCompare(b.key));

  const out = new Map<string, CashStep>();
  let balance = 0;
  for (const m of moves) {
    const before = round2(balance);
    balance = round2(balance + m.delta);
    out.set(m.key, { before, after: balance });
  }
  return out;
}
