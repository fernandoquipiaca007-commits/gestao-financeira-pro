import { createContext, useContext } from 'react';
import type { CurrencyCode } from '../types';

/** Moeda em que o painel, o financeiro e os relatórios mostram o dinheiro (só visualização). */
export interface DisplayCurrencyValue {
  currency: CurrencyCode;
  choose: (c: CurrencyCode) => void;
  loading: boolean;
  /** Câmbio atual: 1 BRL = x */
  rates: { BRL: number; AOA: number; USD: number; EUR: number };
  date?: string;
  source?: string;
}

export const DisplayCurrencyContext = createContext<DisplayCurrencyValue | null>(null);
export const useDisplayCurrency = () => useContext(DisplayCurrencyContext);
