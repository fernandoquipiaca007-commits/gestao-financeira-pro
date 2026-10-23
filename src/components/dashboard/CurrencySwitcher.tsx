import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Check } from 'lucide-react';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';
import type { CurrencyCode } from '../../types';

const OPTIONS: { code: CurrencyCode; pt: string; en: string }[] = [
  { code: 'BRL', pt: 'Real', en: 'Real' },
  { code: 'AOA', pt: 'Kwanza', en: 'Kwanza' },
  { code: 'USD', pt: 'Dólar', en: 'Dollar' },
  { code: 'EUR', pt: 'Euro', en: 'Euro' },
];
const fmtRate = (v: number) => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: v >= 10 ? 2 : 4 }).format(v);
const fmtDate = (d?: string) => (d ? d.split('-').reverse().join('/') : '');

/** Botão da moeda no saldo: muda todo o painel para Real, Kwanza, Dólar ou Euro com o câmbio do momento. */
export function CurrencySwitcher({ fallback, lang }: { fallback: string; lang: 'pt' | 'en' }) {
  const dc = useDisplayCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const en = lang === 'en';

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!dc) return <span className="aura-badge aura-badge--outline">{fallback}</span>;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        className="aura-badge aura-badge--outline inline-flex items-center gap-1 cursor-pointer hover:bg-surface-2"
        title={en ? 'Change currency' : 'Mudar a moeda'}>
        {dc.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {dc.currency}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-30 w-64 rounded-xl border border-line-subtle bg-surface-1 shadow-glass p-2">
          {OPTIONS.map((o) => (
            <button key={o.code} type="button" role="menuitemradio" aria-checked={dc.currency === o.code}
              onClick={() => { dc.choose(o.code); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer ${dc.currency === o.code ? 'bg-surface-2 text-fg font-semibold' : 'text-fg-secondary hover:bg-surface-2'}`}>
              <span>{en ? o.en : o.pt} <span className="text-fg-muted">{o.code}</span></span>
              <span className="flex items-center gap-2 text-[11px] text-fg-muted">
                {o.code !== 'BRL' && <>1 R$ = {fmtRate(dc.rates[o.code])}</>}
                {dc.currency === o.code && <Check className="w-3.5 h-3.5 text-success-fg" />}
              </span>
            </button>
          ))}
          <p className="m-0 mt-2 px-3 pb-1 text-[11px] leading-snug text-fg-muted">
            {en ? 'Balance at today\'s rate; each transaction at the rate of its date.' : 'Saldo ao câmbio de hoje; cada transação ao câmbio do seu dia.'}
            {dc.date && <><br />{en ? 'Rate of ' : 'Câmbio de '}{fmtDate(dc.date)}{dc.source ? ` · ${dc.source}` : ''}</>}
          </p>
        </div>
      )}
    </div>
  );
}
