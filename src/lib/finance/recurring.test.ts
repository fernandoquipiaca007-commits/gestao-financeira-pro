import { describe, expect, it } from 'vitest';
import type { Expense, Income, Project } from '../../types';
import { missingRecurringCharges, recurringDueDates, recurringTotal } from './projectPayments';
import { cashTimeline } from './cashTimeline';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p', name: 'Gestão de tráfego', clientId: 'c', category: 'Tráfego Pago', totalAmount: 0, paidAmount: 0, currency: 'BRL',
  startDate: '2026-08-31', dueDate: '', status: 'Em andamento', createdAt: '2026-08-31', billingType: 'mensal', recurringAmount: 1500, ...over,
});

describe('recurring projects', () => {
  it('monthly: one charge per month up to 30 days ahead, end-of-month safe', () => {
    expect(recurringDueDates(project(), '2026-10-21')).toEqual(['2026-08-31', '2026-09-30', '2026-10-31']);
  });

  it('quarterly and yearly step by 3 and 12 months', () => {
    expect(recurringDueDates(project({ billingType: 'trimestral', startDate: '2026-01-15' }), '2026-10-21')).toEqual(['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']);
    expect(recurringDueDates(project({ billingType: 'anual', startDate: '2025-03-01' }), '2026-10-21')).toEqual(['2025-03-01', '2026-03-01']);
  });

  it('stops at the contract end and ignores one-off, archived, finished or cancelled projects', () => {
    expect(recurringDueDates(project({ recurringEnd: '2026-09-30' }), '2026-10-21')).toEqual(['2026-08-31', '2026-09-30']);
    for (const over of [{ billingType: 'unico' as const }, { archived: true }, { status: 'Concluído' as const }, { status: 'Cancelado' as const }]) {
      expect(recurringDueDates(project(over), '2026-10-21')).toEqual([]);
    }
  });

  it('only creates the charges that are missing (never duplicates a paid one)', () => {
    const paid: Income = { id: 'rec-p-2026-08-31', clientId: 'c', projectId: 'p', description: 'x', amount: 1500, currency: 'BRL', dueDate: '2026-08-31', receivedDate: '2026-09-02', status: 'Recebido', createdAt: '' };
    const manual: Income = { ...paid, id: 'manual', dueDate: '2026-09-30', status: 'Pendente', receivedDate: undefined };
    const missing = missingRecurringCharges(project(), [paid, manual], '2026-10-21');
    expect(missing.map((i) => i.dueDate)).toEqual(['2026-10-31']);
    expect(missing[0]).toMatchObject({ status: 'Pendente', amount: 1500, description: 'Mensalidade 10/2026 - Gestão de tráfego' });
  });

  it('total so far = amount × periods generated', () => {
    expect(recurringTotal(project(), '2026-10-21')).toBe(4500);
  });
});

describe('cash before and after each movement', () => {
  it('follows the date order, incomes before expenses on the same day', () => {
    const inc = (id: string, amount: number, date: string): Income => ({ id, clientId: 'c', description: id, amount, currency: 'BRL', dueDate: date, receivedDate: date, status: 'Recebido', createdAt: date });
    const exp = (id: string, amount: number, date: string): Expense => ({ id, category: 'Ferramentas', description: id, amount, currency: 'BRL', date, paid: true, createdAt: date });
    const t = cashTimeline([inc('a', 1000, '2026-09-01'), inc('b', 500, '2026-09-05')], [exp('x', 300, '2026-09-05'), { ...exp('pend', 99, '2026-09-02'), paid: false }], [], (n) => n);
    expect(t.get('inc:a')).toEqual({ before: 0, after: 1000 });
    expect(t.get('inc:b')).toEqual({ before: 1000, after: 1500 });
    expect(t.get('exp:x')).toEqual({ before: 1500, after: 1200 });
    expect(t.get('exp:pend')).toBeUndefined();
  });
});
