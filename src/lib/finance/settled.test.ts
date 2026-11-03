import { describe, expect, it } from 'vitest';
import { incomeValue, latestCheckpoint, settledFeesTotal } from './settled';
import type { Income } from '../../types';

const base: Income = { id: 'i', clientId: 'c', description: 'Yasmin', amount: 1800, currency: 'BRL', dueDate: '2026-10-22', receivedDate: '2026-10-22', status: 'Recebido', createdAt: '2026-10-22' };
const yasmin: Income = { ...base, settled: { currency: 'EUR', gross: 318.93, amount: 299.38, rate: 0.177181, date: '2026-10-22', fees: [{ label: 'Processamento do cartão', amount: 10.3 }, { label: 'Conversão de moeda', amount: 6.38 }, { label: 'Climate', amount: 1.59 }, { label: 'Invoicing', amount: 1.28 }] } };
const conv = (a: number, from: string, _d: string) => (from === 'BRL' ? a * 0.17 : a * 6);

describe('valor real das entradas da Stripe', () => {
  it('in the balance currency is the fixed net amount', () => {
    expect(incomeValue(yasmin, 'EUR', conv)).toBe(299.38);
  });
  it('in the billed currency shows the reais that really arrived', () => {
    expect(incomeValue(yasmin, 'BRL', conv)).toBe(1689.68);
  });
  it('other currencies convert the net amount', () => {
    expect(incomeValue(yasmin, 'USD', conv)).toBeCloseTo(299.38 * 6, 6);
  });
  it('without Stripe data it converts the billed amount', () => {
    expect(incomeValue(base, 'EUR', conv)).toBeCloseTo(306, 6);
  });
  it('sums every Stripe fee', () => {
    expect(settledFeesTotal(yasmin)).toBe(19.55);
  });
  it('picks the latest checkpoint', () => {
    expect(latestCheckpoint([{ id: 'a', date: '2026-09-30', currency: 'EUR', amount: 1 }, { id: 'b', date: '2026-11-02', currency: 'EUR', amount: 2 }])?.id).toBe('b');
  });
});
