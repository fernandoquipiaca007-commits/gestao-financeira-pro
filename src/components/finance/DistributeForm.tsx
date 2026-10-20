import React, { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { CurrencyCode, PartnerShare } from '../../types';
import { buildPartnerDistribution, splitTotal } from '../../lib/finance/cashPosition';
import { getTodayIso } from '../../lib/storage';

interface DistributeFormProps {
  split: PartnerShare[];
  currency: CurrencyCode;
  /** Sugestão: o que está livre no caixa (o valor é sempre confirmado à mão). */
  suggested: number;
  fmt: (v: number) => string;
  lang: 'pt' | 'en';
  /** Quanto cada sócio deve à empresa (adiantamentos). */
  advances?: Record<string, number>;
  onDistribute: (params: { amount: number; date: string; reference: string; sent: Record<string, boolean>; offset: Record<string, boolean> }) => Promise<boolean>;
}

// Divide um valor pelos sócios segundo as percentagens das Definições. Cada parte fica
// "enviada" (sai do caixa) ou "por enviar" (continua no caixa até ser marcada como paga).
export function DistributeForm({ split, currency, suggested, fmt, lang, advances = {}, onDistribute }: DistributeFormProps) {
  const en = lang === 'en';
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested) : '');
  const [date, setDate] = useState(getTodayIso());
  const [reference, setReference] = useState('');
  const [sent, setSent] = useState<Record<string, boolean>>({});
  // Sócios com adiantamento: por defeito a parte deles é descontada no que devem, não enviada.
  const [offset, setOffset] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.keys(advances).map((k) => [k, true])));
  const [saving, setSaving] = useState(false);

  const value = Number(amount.replace(',', '.')) || 0;
  const total = splitTotal(split);
  const preview = useMemo(
    () => buildPartnerDistribution({ amount: value, date, currency, split, sent, reference: reference || '-', idPrefix: 'preview' }),
    [value, date, currency, split, sent, reference],
  );

  if (split.length === 0) {
    return <p className="m-0 text-[13px] text-fg-muted">{en ? 'Set the partners and their percentages in Settings → Company & currencies.' : 'Defina os sócios e as percentagens em Definições → Empresa e moedas.'}</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(value > 0) || total !== 100 || !reference.trim()) return;
    setSaving(true);
    const ok = await onDistribute({ amount: value, date, reference: reference.trim(), sent, offset });
    setSaving(false);
    if (ok) { setAmount(''); setReference(''); setSent({}); }
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Amount to split' : 'Valor a dividir'} ({currency})
          <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="aura-input" />
        </label>
        <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Date' : 'Data'}
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="aura-input" />
        </label>
        <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Reference' : 'Referência'}
          <input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder={en ? 'e.g. September projects' : 'Ex.: Projetos de setembro'} className="aura-input" />
        </label>
      </div>

      {total !== 100 && (
        <p className="m-0 text-[13px] text-danger-fg">{en ? `The percentages add up to ${total}%, not 100%. Fix them in Settings.` : `As percentagens somam ${total}%, não 100%. Corrija-as nas Definições.`}</p>
      )}

      <ul className="m-0 p-0 list-none grid gap-2">
        {preview.map((share) => (
          <li key={share.partnerName} className="flex flex-wrap items-center justify-between gap-3 border border-line-subtle rounded-xl px-4 py-2.5">
            <span className="text-[14px] text-fg">{share.description.split(' - ')[0]}</span>
            <span className="flex items-center gap-4">
              <strong className="text-[14px] font-medium text-fg">{fmt(share.amount)}</strong>
              {advances[share.partnerName || ''] > 0 && (
                <label className="flex items-center gap-2 text-[12px] text-warning-fg cursor-pointer" title={en ? 'Owes the company from an advance' : 'Deve à empresa por adiantamento'}>
                  <input type="checkbox" checked={Boolean(offset[share.partnerName || ''])} onChange={(e) => setOffset((s) => ({ ...s, [share.partnerName || '']: e.target.checked }))} />
                  {en ? `Deduct from advance (owes ${fmt(advances[share.partnerName || ''])})` : `Descontar no adiantamento (deve ${fmt(advances[share.partnerName || ''])})`}
                </label>
              )}
              {!offset[share.partnerName || ''] && (
                <label className="flex items-center gap-2 text-[12px] text-fg-secondary cursor-pointer">
                  <input type="checkbox" checked={Boolean(sent[share.partnerName || ''])} onChange={(e) => setSent((s) => ({ ...s, [share.partnerName || '']: e.target.checked }))} />
                  {en ? 'Already sent' : 'Já enviado'}
                </label>
              )}
            </span>
          </li>
        ))}
      </ul>

      <button type="submit" disabled={saving || !(value > 0) || total !== 100} className="aura-btn aura-btn--primary justify-self-start">
        <Send />{saving ? (en ? 'Recording…' : 'A registar…') : (en ? 'Record distribution' : 'Registar distribuição')}
      </button>
    </form>
  );
}
