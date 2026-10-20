import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AppSettings, CashReserve, Expense, Income, PartnerShare } from '../../types';
import { buildPartnerDistribution, cashBreakdown, owedToPartners, reserveStatuses, splitTotal } from './cashPosition';

vi.mock('react', async (importOriginal) => ({ ...(await importOriginal<typeof import('react')>()), useMemo: (fn: () => unknown) => fn() }));
const { useFinanceMetrics } = await import('./useFinanceMetrics');

const conv = (n: number) => n;
const split: PartnerShare[] = [
  { name: 'Fernando', percent: 40 },
  { name: 'Jorge', percent: 40 },
  { name: 'Valdimiro', percent: 20 },
];
const expense = (over: Partial<Expense>): Expense => ({
  id: 'e', category: 'Ferramentas', description: 'x', amount: 0, currency: 'BRL', date: '2026-09-22', paid: true, createdAt: '2026-09-22', ...over,
});
const reserve = (over: Partial<CashReserve>): CashReserve => ({
  id: 'r', name: 'Reserva', amount: 0, currency: 'BRL', date: '2026-09-22', closed: false, createdAt: '2026-09-22', ...over,
});

describe('buildPartnerDistribution', () => {
  it('splits 2.500 as 1.000 / 1.000 / 500 and marks who was already paid', () => {
    const out = buildPartnerDistribution({ amount: 2500, date: '2026-10-09', currency: 'BRL', split, sent: { Fernando: true, Valdimiro: true }, reference: 'Setembro', idPrefix: 'd' });
    expect(out.map((e) => [e.partnerName, e.amount, e.paid])).toEqual([['Fernando', 1000, true], ['Jorge', 1000, false], ['Valdimiro', 500, true]]);
    expect(out.every((e) => e.category === 'Distribuição a sócios')).toBe(true);
  });

  it('keeps the total exact when the split leaves cents', () => {
    const out = buildPartnerDistribution({ amount: 100, date: 'd', currency: 'BRL', split: [{ name: 'A', percent: 33.33 }, { name: 'B', percent: 33.33 }, { name: 'C', percent: 33.34 }], sent: {}, reference: 'x', idPrefix: 'd' });
    expect(out.reduce((s, e) => s + e.amount, 0)).toBe(100);
  });

  it('splitTotal checks the percentages add up to 100', () => {
    expect(splitTotal(split)).toBe(100);
  });
});

describe('reserves and amounts owed', () => {
  it('a reserve shrinks as expenses are paid from it', () => {
    const r = reserveStatuses([reserve({ id: 'tools', amount: 600 })], [expense({ amount: 120, reserveId: 'tools' }), expense({ amount: 80, reserveId: 'tools', paid: false })], conv);
    expect(r[0]).toMatchObject({ used: 120, remaining: 480 });
  });

  it('closed reserves no longer hold cash', () => {
    expect(reserveStatuses([reserve({ amount: 600, closed: true })], [], conv)).toEqual([]);
  });

  it('unpaid partner distributions are money still in the cash', () => {
    expect(owedToPartners([expense({ category: 'Distribuição a sócios', amount: 1000, paid: false }), expense({ category: 'Distribuição a sócios', amount: 500 })], conv)).toBe(1000);
    expect(cashBreakdown(2600, [{ reserve: reserve({}), used: 0, remaining: 1600 }], 1000)).toEqual({ reserved: 1600, owed: 1000, free: 0 });
  });
});

describe('September 2026 batch, as reported to the partners', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-20T12:00:00')); });
  afterAll(() => { vi.useRealTimers(); });

  // Earlier projects (3.900 received) were fully spent: 3.375 in expenses + 525 in commissions.
  const received = (id: string, amount: number, date: string): Income => ({ id, clientId: 'c', description: id, amount, currency: 'BRL', dueDate: date, receivedDate: date, status: 'Recebido', createdAt: date });
  const incomes: Income[] = [
    received('old', 3900 - 525, '2026-08-01'),
    received('diná', 1000, '2026-09-16'), received('euro', 1300, '2026-09-17'), received('rebeka', 1500, '2026-09-14'), received('julianna', 1800, '2026-09-25'),
  ];
  const reserves = [reserve({ id: 'meta', name: 'Meta dos 30 mil', amount: 1000 }), reserve({ id: 'tools', name: 'Ferramentas futuras', amount: 600 })];
  const expenses: Expense[] = [
    expense({ id: 'old-out', category: 'Outros', amount: 3375, date: '2026-08-02' }),
    expense({ id: 'fees', category: 'Taxas de pagamento', amount: 100, date: '2026-09-25' }),
    expense({ id: 'edit', category: 'Edição de vídeo', amount: 800 }),
    expense({ id: 'tools-now', category: 'Ferramentas', amount: 600 }),
    ...buildPartnerDistribution({ amount: 2500, date: '2026-10-09', currency: 'BRL', split, sent: { Fernando: true, Valdimiro: true }, reference: 'Setembro', idPrefix: 'dist' }),
  ];
  const settings = { defaultCurrency: 'BRL', userName: 'x', businessName: 'x', exchangeRates: { BRL: 1, AOA: 165, USD: 0.18, EUR: 0.16 } } as AppSettings;

  it('cash is 2.600: 1.000 for Jorge, 1.000 for the 30k goal and 600 for tools, nothing free', () => {
    const m = useFinanceMetrics({ clients: [], projects: [], incomes, expenses, settings, currencyFilter: 'ALL', period: '12m', lang: 'pt', reserves });
    expect(m.cashBalance).toBe(2600);
    expect(m.cashReserved).toBe(1600);
    expect(m.cashOwedToPartners).toBe(1000);
    expect(m.cashFree).toBe(0);
  });

  it('partner payouts stay out of costs and result', () => {
    const m = useFinanceMetrics({ clients: [], projects: [], incomes, expenses, settings, currencyFilter: 'ALL', period: '12m', lang: 'pt', reserves });
    expect(m.spentPeriod).toBe(3375 + 100 + 800 + 600);
    expect(m.withdrawalsPeriod).toBe(1500); // Fernando + Valdimiro already sent
  });
});
