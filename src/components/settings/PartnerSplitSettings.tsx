import React, { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import type { AppSettings, PartnerShare } from '../../types';
import { splitTotal } from '../../lib/finance/cashPosition';

interface Props {
  settings: AppSettings;
  lang: 'pt' | 'en';
  onSaveSettings: (settings: AppSettings) => void | Promise<void>;
}

// Sócios e a percentagem de cada um na divisão do resultado (usada em Financeiro → Caixa e sócios).
export function PartnerSplitSettings({ settings, lang, onSaveSettings }: Props) {
  const en = lang === 'en';
  const [rows, setRows] = useState<PartnerShare[]>(settings.profitSplit?.length ? settings.profitSplit : [{ name: '', percent: 0 }]);
  const [saved, setSaved] = useState(false);
  const total = splitTotal(rows.filter((r) => r.name.trim()));

  const update = (idx: number, patch: Partial<PartnerShare>) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), percent: Number(r.percent) || 0 }));
    if (splitTotal(clean) !== 100) return;
    await onSaveSettings({ ...settings, profitSplit: clean });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form id="socios" onSubmit={save} className="xl:col-span-2 scroll-mt-24 bg-glass border border-line-subtle p-6 rounded-xl shadow-glass space-y-4">
      <div>
        <h3 className="m-0 text-sm font-semibold text-fg flex items-center gap-2"><Users className="w-4 h-4 text-accent-soft-fg stroke-[1.5]" />{en ? 'Partners and profit split' : 'Sócios e divisão do resultado'}</h3>
        <p className="mt-1 mb-0 text-xs text-fg-muted">
          {en ? 'Used when you record a distribution in Finance → Cash & partners. Must add up to 100%.' : 'Usado ao registar uma distribuição em Financeiro → Caixa e sócios. Tem de somar 100%.'}
        </p>
      </div>

      <div className="grid gap-2">
        {rows.map((r, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_110px_auto] gap-2 items-center">
            <input value={r.name} onChange={(e) => update(idx, { name: e.target.value })} placeholder={en ? 'Partner name' : 'Nome do sócio'} className="aura-input" />
            <div className="relative">
              <input inputMode="decimal" value={String(r.percent)} onChange={(e) => update(idx, { percent: Number(e.target.value.replace(',', '.')) || 0 })} className="aura-input pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm">%</span>
            </div>
            <button type="button" aria-label={en ? 'Remove' : 'Remover'} onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))} className="aura-btn aura-btn--ghost aura-btn--sm"><Trash2 /></button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setRows((prev) => [...prev, { name: '', percent: 0 }])} className="aura-btn aura-btn--secondary aura-btn--sm"><Plus />{en ? 'Add partner' : 'Adicionar sócio'}</button>
        <span className={`text-sm font-medium ${total === 100 ? 'text-success-fg' : 'text-danger-fg'}`}>{en ? 'Total' : 'Total'}: {total}%</span>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={total !== 100} className="aura-btn aura-btn--primary">{en ? 'Save partners' : 'Guardar sócios'}</button>
        {saved && <span className="text-sm text-success-fg">{en ? 'Saved' : 'Guardado'}</span>}
      </div>
    </form>
  );
}
