import { describe, expect, it } from 'vitest';
import { convertWith, fxDayFor, FX_HISTORY_START } from './fxRates';
import { convertAtDate } from './formatters';

const rates = { BRL: 1, AOA: 180, USD: 0.2, EUR: 0.18 };

describe('câmbio', () => {
  it('converts BRL to Kwanza and back', () => {
    expect(convertWith(1800, 'BRL', 'AOA', rates)).toBe(324000);
    expect(convertWith(324000, 'AOA', 'BRL', rates)).toBe(1800);
  });

  it('converts between two non-BRL currencies through BRL', () => {
    expect(convertWith(100, 'USD', 'EUR', rates)).toBeCloseTo(90, 6);
  });

  it('uses the latest rate for today or future dates and clamps old dates', () => {
    expect(fxDayFor('2999-01-01')).toBe('latest');
    expect(fxDayFor('2020-05-01')).toBe(FX_HISTORY_START);
    expect(fxDayFor('2026-09-25')).toBe('2026-09-25');
    expect(fxDayFor('')).toBe('latest');
  });

  it('convertAtDate uses the rate of the transaction day when known', () => {
    const settings = { exchangeRates: rates, rateAt: (d: string) => (d === '2026-09-25' ? { BRL: 1, AOA: 176, USD: 0.19, EUR: 0.17 } : undefined) };
    expect(convertAtDate(1800, 'BRL', 'AOA', settings, '2026-09-25')).toBe(316800);
    // dia sem câmbio carregado: usa o de hoje
    expect(convertAtDate(1800, 'BRL', 'AOA', settings, '2026-09-26')).toBe(324000);
    // mesma moeda: nunca converte
    expect(convertAtDate(1800, 'BRL', 'BRL', settings, '2026-09-25')).toBe(1800);
  });
});
