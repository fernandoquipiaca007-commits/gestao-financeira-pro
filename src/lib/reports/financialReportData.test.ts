import { describe, expect, it } from 'vitest';
import type { AppSettings, CashReserve, Expense, Income, Project } from '../../types';
import { buildFinancialReport, periodRange } from './financialReportData';

const settings = { defaultCurrency: 'BRL', userName: 'x', businessName: 'CodeEngine', exchangeRates: { BRL: 1, AOA: 165, USD: 0.18, EUR: 0.16 } } as AppSettings;
const inc = (id: string, amount: number, date: string): Income => ({ id, clientId: 'c', description: id, amount, currency: 'BRL', dueDate: date, receivedDate: date, status: 'Recebido', createdAt: date });
const exp = (id: string, category: string, amount: number, date: string, paid = true): Expense => ({ id, category, description: id, amount, currency: 'BRL', date, paid, createdAt: date });
const reserves: CashReserve[] = [{ id: 'r', name: 'Meta dos 30 mil', amount: 1000, currency: 'BRL', date: '2026-09-22', closed: false, createdAt: '' }];

const data = {
  incomes: [inc('aug', 3900, '2026-08-10'), inc('s1', 1500, '2026-09-14'), inc('s2', 4100, '2026-09-25')],
  expenses: [exp('aug-out', 'Outros', 3900, '2026-08-20'), exp('edit', 'Edição de vídeo', 800, '2026-09-22'), exp('fees', 'Taxas de pagamento', 100, '2026-09-25'), exp('fernando', 'Distribuição a sócios', 1000, '2026-10-09'), exp('jorge', 'Distribuição a sócios', 1000, '2026-10-09', false)],
  projects: [] as Project[],
  clients: [],
  reserves,
  settings,
  currency: 'BRL' as const,
};

describe('periodRange', () => {
  it('builds month, year and full-history ranges', () => {
    expect(periodRange({ year: '2026', month: '09' })).toEqual({ from: '2026-09-01', to: '2026-09-30', label: 'Setembro de 2026' });
    expect(periodRange({ year: '2026', month: 'ALL' }).label).toBe('Ano 2026');
    expect(periodRange({ year: 'ALL', month: 'ALL' }).label).toBe('Todo o histórico');
  });
});

describe('buildFinancialReport', () => {
  it('September: opening balance is zero, every line carries the running balance', () => {
    const r = buildFinancialReport({ ...data, period: { year: '2026', month: '09' } });
    expect(r.summary.opening).toBe(0);
    expect(r.movements.map((m) => m.balance)).toEqual([1500, 700, 4800, 4700]);
    expect(r.summary.closing).toBe(4700);
    expect(r.summary.received).toBe(5600);
    expect(r.summary.costs).toBe(900);
    expect(r.summary.profit).toBe(4700);
  });

  it('partner distributions leave the cash but are not costs; unpaid ones are owed', () => {
    const r = buildFinancialReport({ ...data, period: { year: 'ALL', month: 'ALL' } });
    expect(r.summary.distributions).toBe(1000);
    expect(r.summary.costs).toBe(3900 + 800 + 100);
    expect(r.cash).toEqual({ now: 3700, reserved: 1000, owed: 1000, free: 1700 });
    expect(r.distributions.find((d) => d.partner === '' && d.amount === 1000 && !d.sent)).toBeTruthy();
  });

  it('months add up to the period totals', () => {
    const r = buildFinancialReport({ ...data, period: { year: '2026', month: 'ALL' } });
    expect(r.months.reduce((s, m) => s + m.received, 0)).toBe(r.summary.received);
    expect(r.months.reduce((s, m) => s + m.cashFlow, 0)).toBe(r.summary.closing - r.summary.opening);
  });
});
