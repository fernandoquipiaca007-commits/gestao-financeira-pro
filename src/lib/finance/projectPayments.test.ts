import { describe, expect, it } from 'vitest';
import type { Income, Project } from '../../types';
import { buildSettlementIncomes, paymentDeltaIncome, reconcileProjectWithIncomes } from './projectPayments';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1', name: 'Funil de palestra', clientId: 'c1', category: 'Outro',
  totalAmount: 1500, paidAmount: 0, currency: 'BRL', startDate: '2026-09-14', dueDate: '2026-10-25',
  status: 'Em andamento', createdAt: '2026-09-14', ...over,
});
const income = (over: Partial<Income> = {}): Income => ({
  id: 'i1', clientId: 'c1', projectId: 'p1', description: 'Sinal', amount: 500, currency: 'BRL',
  dueDate: '2026-09-14', status: 'Recebido', receivedDate: '2026-09-14', createdAt: '2026-09-14', ...over,
});

describe('reconcileProjectWithIncomes', () => {
  it('keeps a fully paid project "Em andamento"', () => {
    const p = reconcileProjectWithIncomes(project(), [income({ amount: 1500 })]);
    expect(p.paidAmount).toBe(1500);
    expect(p.status).toBe('Em andamento');
  });

  it('never moves a closed contract back to "Em andamento"', () => {
    const p = reconcileProjectWithIncomes(project({ status: 'Concluído', paidAmount: 1500 }), [income({ amount: 600 })]);
    expect(p.status).toBe('Concluído');
  });

  it('counts only received incomes of that project', () => {
    const p = reconcileProjectWithIncomes(project(), [
      income({ id: 'a', amount: 600 }),
      income({ id: 'b', amount: 900, status: 'Pendente', receivedDate: undefined }),
      income({ id: 'c', amount: 999, projectId: 'other' }),
    ]);
    expect(p.paidAmount).toBe(600);
  });

  it('leaves a project without linked incomes untouched (legacy paid amount kept)', () => {
    const original = project({ paidAmount: 1800 });
    expect(reconcileProjectWithIncomes(original, [])).toBe(original);
  });
});

describe('buildSettlementIncomes', () => {
  it('marks pending incomes received and records the missing remainder', () => {
    const out = buildSettlementIncomes(project(), [
      income({ id: 'a', amount: 500 }),
      income({ id: 'b', amount: 400, status: 'Pendente', receivedDate: undefined }),
    ], '2026-10-20', 'new');
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'b', status: 'Recebido', receivedDate: '2026-10-20' });
    expect(out[1]).toMatchObject({ id: 'new', amount: 600, status: 'Recebido', projectId: 'p1', clientId: 'c1' });
  });

  it('adds nothing when the incomes already cover the total', () => {
    expect(buildSettlementIncomes(project(), [income({ amount: 1500 })], '2026-10-20', 'new')).toEqual([]);
  });

  it('records the whole amount when the project has no incomes', () => {
    const out = buildSettlementIncomes(project({ totalAmount: 1800 }), [], '2026-10-20', 'new');
    expect(out).toEqual([expect.objectContaining({ amount: 1800, description: 'Quitação - Funil de palestra' })]);
  });

  it('handles cents without floating-point leftovers', () => {
    const out = buildSettlementIncomes(project({ totalAmount: 100.3 }), [income({ amount: 0.1 }), income({ id: 'x', amount: 0.2 })], '2026-10-20', 'new');
    expect(out[0].amount).toBe(100);
  });
});

describe('paymentDeltaIncome', () => {
  it('records the increase in "valor pago" as a received income', () => {
    const inc = paymentDeltaIncome(project({ paidAmount: 500 }), project({ paidAmount: 1500 }), '2026-10-20', 'new');
    expect(inc).toMatchObject({ amount: 1000, status: 'Recebido', receivedDate: '2026-10-20', projectId: 'p1' });
  });

  it('records nothing when the paid amount did not go up', () => {
    expect(paymentDeltaIncome(project({ paidAmount: 1800 }), project({ paidAmount: 1800, name: 'Novo nome' }), '2026-10-20', 'n')).toBeNull();
    expect(paymentDeltaIncome(project({ paidAmount: 1800 }), project({ paidAmount: 1000 }), '2026-10-20', 'n')).toBeNull();
  });

  it('ignores new projects (their entry income is created separately)', () => {
    expect(paymentDeltaIncome(undefined, project({ paidAmount: 1500 }), '2026-10-20', 'n')).toBeNull();
  });
});
