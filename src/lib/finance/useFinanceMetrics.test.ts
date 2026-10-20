import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AppSettings, Expense, Income, Project } from '../../types';

// The hook only uses useMemo; run it as a plain function.
vi.mock('react', async (importOriginal) => ({ ...(await importOriginal<typeof import('react')>()), useMemo: (fn: () => unknown) => fn() }));
const { useFinanceMetrics } = await import('./useFinanceMetrics');

// Same amounts as the company's books on 2026-10-20 (names removed).
const received = (id: string, amount: number, date: string, projectId?: string): Income => ({
  id, clientId: 'c', projectId, description: id, amount, currency: 'BRL', dueDate: date, receivedDate: date, status: 'Recebido', createdAt: date,
});
const incomes: Income[] = [
  received('i1', 1500, '2026-08-18', 'p1'), received('i2', 600, '2026-08-15', 'p2'), received('i3', 600, '2026-08-03', 'p3'),
  received('i4', 600, '2026-07-30', 'p4'), received('i5', 600, '2026-07-01', 'p3'), received('i6', 1500, '2026-09-14', 'p5'),
  received('i7', 1300, '2026-09-17', 'p6'), received('i8', 1000, '2026-09-16', 'p7'),
];
const paid = (id: string, category: string, amount: number, date: string): Expense => ({
  id, category, description: id, amount, currency: 'BRL', date, paid: true, createdAt: date,
});
const expenses: Expense[] = [
  paid('e1', 'Retirada Própria', 975, '2026-08-21'), paid('e2', 'Retirada Própria', 600, '2026-08-18'),
  paid('e3', 'Salário', 900, '2026-08-11'), paid('e4', 'Salário', 300, '2026-08-06'), paid('e5', 'Outros', 600, '2026-07-31'),
];
const project = (id: string, commissionAmount = 0, commissionPaid = false): Project => ({
  id, name: id, clientId: 'c', category: 'Outro', totalAmount: 1500, paidAmount: 1500, currency: 'BRL',
  startDate: '2026-07-01', dueDate: '2026-12-01', status: 'Em andamento', createdAt: '2026-07-01', commissionAmount, commissionPaid,
});
const projects = [project('p1', 375, true), project('p4', 150, true), project('p5')];
const settings = { defaultCurrency: 'BRL', userName: 'x', businessName: 'x', exchangeRates: { BRL: 1, AOA: 165, USD: 0.18, EUR: 0.16 } } as AppSettings;

const metrics = (period: '1m' | '3m' | '12m') =>
  useFinanceMetrics({ clients: [], projects, incomes, expenses, settings, currencyFilter: 'ALL', period, lang: 'pt' });

beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-20T12:00:00')); });
afterAll(() => { vi.useRealTimers(); });

describe('useFinanceMetrics with the real books', () => {
  it('cash balance = received − paid expenses (withdrawals included) − paid commissions', () => {
    expect(metrics('12m').cashBalance).toBe(7700 - 3375 - 525); // 3800
  });

  it('keeps owner withdrawals out of costs and result, counts paid commissions as a cost', () => {
    const m = metrics('12m');
    expect(m.spentPeriod).toBe(1800);
    expect(m.withdrawalsPeriod).toBe(1575);
    expect(m.withdrawalsTotal).toBe(1575);
    expect(m.commissionsPeriod).toBe(525);
    expect(m.netPeriod).toBe(7700 - 1800 - 525);
  });

  it('the cash-flow chart shows every real outflow and adds up to the cash balance', () => {
    const m = metrics('12m');
    const out = m.series.reduce((s, p) => s + p.despesas, 0);
    const inn = m.series.reduce((s, p) => s + p.receitas, 0);
    expect(out).toBe(3375 + 525);
    expect(inn).toBe(7700);
    expect(inn - out).toBe(m.cashBalance);
  });

  it('months are counted by the date the money arrived', () => {
    const m = metrics('12m');
    const by = Object.fromEntries(m.series.map((p) => [p.key.slice(0, 7), p.receitas]));
    expect(by['2026-07']).toBe(1200);
    expect(by['2026-08']).toBe(2700);
    expect(by['2026-09']).toBe(3800);
    expect(by['2026-10']).toBe(0);
  });

  it('this month has no movements yet', () => {
    const m = metrics('1m');
    expect(m.receivedPeriod).toBe(0);
    expect(m.spentPeriod).toBe(0);
    expect(m.withdrawalsPeriod).toBe(0);
  });
});

describe('archived projects', () => {
  const waiting = (id: string, total: number, archived: boolean): Project => ({
    id, name: id, clientId: 'c', category: 'Outro', totalAmount: total, paidAmount: 0, currency: 'BRL',
    startDate: '2026-08-01', dueDate: '2026-08-15', status: 'Aguardando cliente', createdAt: '2026-08-01', archived,
  });
  const run = (archived: boolean) =>
    useFinanceMetrics({ clients: [], projects: [...projects, waiting('brennda', 800, archived), waiting('benefico', 1500, archived)], incomes, expenses, settings, currencyFilter: 'ALL', period: '12m', lang: 'pt' });

  it('leave the amount to receive, active projects and contracted revenue', () => {
    const before = run(false);
    const after = run(true);
    expect(before.toReceive - after.toReceive).toBe(2300);
    expect(before.indicators.activeCount - after.indicators.activeCount).toBe(2);
    expect(before.indicators.contracted - after.indicators.contracted).toBe(2300);
  });

  it('do not change the cash balance', () => {
    expect(run(true).cashBalance).toBe(run(false).cashBalance);
  });
});
