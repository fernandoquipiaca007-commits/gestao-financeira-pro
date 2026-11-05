import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileCheck2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { CurrencyCode } from '../../types';

type Pair = [string, number];
interface CloseData {
  title: string; period: string; currency: CurrencyCode; rule?: string;
  entries: { date: string; client: string; project: string; billed: number; billedCurrency: CurrencyCode; gross: number | null; fees: number; net: number; feeDetail?: Pair[]; note?: string }[];
  toSplit: { label: string; amount: number }[]; toSplitTotal: number;
  partners: { name: string; percent: number; share: number; discount: number; discountNote?: string; receives: number }[];
  withdrawals: { date: string; status: string; items: Pair[]; total: number }[];
  cash: { label: string; amount: number }[]; cashTotal: number;
  summary: { label: string; amount: number; note?: string }[];
  notes?: string[];
}

const th = 'text-left text-[11px] font-semibold uppercase tracking-wide text-fg-muted px-3 py-2';
const td = 'px-3 py-2 text-[13px] text-fg align-top';
const num = 'px-3 py-2 text-[13px] text-right tabular-nums align-top';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="m-0 text-sm font-semibold text-fg">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-line-subtle">{children}</div>
    </section>
  );
}

function CloseBody({ d, isEn }: { d: CloseData; isEn: boolean }) {
  const m = (v: number) => formatCurrency(v, d.currency);
  const entriesNet = d.entries.reduce((a, e) => a + e.net, 0);
  const entriesFees = d.entries.reduce((a, e) => a + e.fees, 0);
  return (
    <div className="space-y-6">
      {d.rule && <p className="m-0 text-[12px] text-fg-muted">{d.rule}</p>}

      <Section title={isEn ? '1. What came in' : '1. O que entrou'}>
        <table className="w-full min-w-[640px]">
          <thead className="bg-surface-2"><tr><th className={th}>{isEn ? 'Date' : 'Data'}</th><th className={th}>{isEn ? 'Client / project' : 'Cliente / projeto'}</th><th className={`${th} text-right`}>{isEn ? 'Billed' : 'Faturado'}</th><th className={`${th} text-right`}>{isEn ? 'Gross' : 'Bruto'}</th><th className={`${th} text-right`}>{isEn ? 'Fees' : 'Taxas'}</th><th className={`${th} text-right`}>{isEn ? 'Net' : 'Ficou'}</th></tr></thead>
          <tbody>
            {d.entries.map((e) => (
              <tr key={e.date + e.client} className="border-t border-line-subtle">
                <td className={td}>{formatDate(e.date)}</td>
                <td className={td}>
                  <strong>{e.client}</strong><span className="block text-[12px] text-fg-muted">{e.project}</span>
                  {e.feeDetail && <span className="block text-[11px] text-fg-muted">{e.feeDetail.map(([l, v]) => `${l} ${m(v)}`).join(' · ')}</span>}
                  {e.note && <span className="block text-[11px] text-fg-muted italic">{e.note}</span>}
                </td>
                <td className={num}>{formatCurrency(e.billed, e.billedCurrency)}</td>
                <td className={num}>{e.gross != null ? m(e.gross) : '—'}</td>
                <td className={num}>{e.fees ? m(e.fees) : '—'}</td>
                <td className={`${num} font-semibold text-success-fg`}>{m(e.net)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-line-subtle bg-surface-2 font-semibold"><td className={td} colSpan={4}>Total</td><td className={num}>{m(entriesFees)}</td><td className={num}>{m(entriesNet)}</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title={isEn ? '2. From the month total to the amount to split' : '2. Do total do mês ao valor a dividir'}>
        <table className="w-full"><tbody>
          {d.toSplit.map((x) => <tr key={x.label} className="border-t border-line-subtle first:border-t-0"><td className={td}>{x.amount < 0 ? '− ' : x.label === d.toSplit[0].label ? '' : '+ '}{x.label}</td><td className={num}>{m(x.amount)}</td></tr>)}
          <tr className="border-t-2 border-line-subtle bg-surface-2 font-semibold"><td className={td}>{isEn ? 'To split' : 'Valor a dividir'}</td><td className={num}>{m(d.toSplitTotal)}</td></tr>
        </tbody></table>
      </Section>

      <Section title={isEn ? '3. Each partner' : '3. Resultado de cada sócio'}>
        <table className="w-full min-w-[560px]">
          <thead className="bg-surface-2"><tr><th className={th}>{isEn ? 'Partner' : 'Sócio'}</th><th className={`${th} text-right`}>%</th><th className={`${th} text-right`}>{isEn ? 'Share' : 'Parte'}</th><th className={`${th} text-right`}>{isEn ? 'Discount' : 'Desconto'}</th><th className={`${th} text-right`}>{isEn ? 'Receives' : 'Recebe'}</th></tr></thead>
          <tbody>
            {d.partners.map((p) => (
              <tr key={p.name} className="border-t border-line-subtle">
                <td className={td}><strong>{p.name}</strong>{p.discountNote && <span className="block text-[11px] text-fg-muted">{p.discountNote}</span>}</td>
                <td className={num}>{p.percent}%</td><td className={num}>{m(p.share)}</td><td className={num}>{p.discount ? `− ${m(p.discount)}` : '—'}</td>
                <td className={`${num} font-semibold text-success-fg`}>{m(p.receives)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={isEn ? '4. Where the money went' : '4. Para onde foi o dinheiro'}>
        <table className="w-full"><tbody>
          {d.withdrawals.map((w) => (
            <React.Fragment key={w.date}>
              <tr className="bg-surface-2"><td className={`${td} font-semibold`}>{isEn ? 'Withdrawal' : 'Retirada'} {formatDate(w.date)} · {w.status}</td><td className={`${num} font-semibold`}>{m(w.total)}</td></tr>
              {w.items.map(([l, v]) => <tr key={w.date + l} className="border-t border-line-subtle"><td className={`${td} pl-6`}>{l}</td><td className={num}>{m(v)}</td></tr>)}
            </React.Fragment>
          ))}
        </tbody></table>
      </Section>

      <Section title={isEn ? '5. Cash after the close' : '5. Caixa depois do fecho'}>
        <table className="w-full"><tbody>
          {d.cash.map((x) => <tr key={x.label} className="border-t border-line-subtle first:border-t-0"><td className={td}>{x.label}</td><td className={num}>{m(x.amount)}</td></tr>)}
          <tr className="border-t-2 border-line-subtle bg-surface-2 font-semibold"><td className={td}>{isEn ? 'Total cash' : 'Caixa total'}</td><td className={num}>{m(d.cashTotal)}</td></tr>
        </tbody></table>
      </Section>

      <Section title={isEn ? '6. Summary' : '6. Resumo do mês'}>
        <table className="w-full"><tbody>
          {d.summary.map((x) => <tr key={x.label} className="border-t border-line-subtle first:border-t-0"><td className={td}>{x.label}{x.note && <span className="block text-[11px] text-fg-muted">{x.note}</span>}</td><td className={num}>{m(x.amount)}</td></tr>)}
        </tbody></table>
      </Section>

      {!!d.notes?.length && <ul className="m-0 pl-5 text-[12px] text-fg-muted space-y-1">{d.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
    </div>
  );
}

/** Relatórios de fecho mensal guardados (um por mês). */
export function MonthCloseReport({ isEn }: { isEn: boolean }) {
  const [closes, setCloses] = useState<{ month: string; data: CloseData }[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    supabase.from('month_closes').select('month, data').order('month', { ascending: false }).then(({ data }) => {
      if (data?.length) { setCloses(data as { month: string; data: CloseData }[]); setOpen(data[0].month); }
    });
  }, []);
  if (!closes.length) return null;
  return (
    <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass space-y-4">
      <h2 className="m-0 aura-h4 flex items-center gap-2"><FileCheck2 className="w-4 h-4" />{isEn ? 'Monthly closes' : 'Fechos mensais'}</h2>
      {closes.map((c) => (
        <div key={c.month} className="border-t border-line-subtle pt-3 first:border-t-0 first:pt-0">
          <button type="button" onClick={() => setOpen(open === c.month ? null : c.month)} className="w-full flex items-center justify-between gap-3 cursor-pointer text-left">
            <span className="font-semibold text-fg">{c.data.title}</span>
            <span className="flex items-center gap-2 text-sm text-fg-secondary">{isEn ? 'Cash' : 'Caixa'} {formatCurrency(c.data.cashTotal, c.data.currency)}{open === c.month ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </button>
          {open === c.month && <div className="mt-4"><CloseBody d={c.data} isEn={isEn} /></div>}
        </div>
      ))}
    </div>
  );
}
