import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Product } from '../../types';

const input = 'w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all';
const label = 'text-[13px] font-medium text-fg-secondary block mb-1.5';

export const emptyProduct = (sortOrder: number): Product => ({
  id: `prod-${Date.now()}`, name: '', kind: 'plano', billing: 'unico', priceMin: 0, priceMax: 0, currency: 'BRL',
  summary: '', includes: [''], conditions: '', internalNotes: '', active: true, sortOrder,
});

/** Formulário de um plano da tabela de preços. */
export function ProductEditor({ product, isEn, onClose, onSave }: {
  product: Product | null;
  isEn: boolean;
  onClose: () => void;
  onSave: (p: Product) => Promise<boolean>;
}) {
  const [p, setP] = useState<Product | null>(product);
  const [saving, setSaving] = useState(false);
  useEffect(() => setP(product ? { ...product, includes: product.includes.length ? product.includes : [''] } : null), [product]);
  if (!p) return null;
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP({ ...p, [k]: v });
  const setInc = (i: number, v: string) => set('includes', p.includes.map((x, j) => (j === i ? v : x)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.name.trim() || saving) return;
    setSaving(true);
    const ok = await onSave({ ...p, name: p.name.trim(), priceMax: Math.max(p.priceMax, p.priceMin), includes: p.includes.map((x) => x.trim()).filter(Boolean) });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 sm:p-6" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="bg-surface-1 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line-subtle shadow-glass p-6 grid gap-5 text-fg">
        <div className="flex items-center justify-between">
          <h2 className="aura-h4 m-0">{isEn ? 'Plan' : 'Plano'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-sunken cursor-pointer" aria-label={isEn ? 'Close' : 'Fechar'}><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className={label} htmlFor="pe-name">{isEn ? 'Name *' : 'Nome *'}</label>
          <input id="pe-name" required className={input} value={p.name} onChange={(e) => set('name', e.target.value)} placeholder={isEn ? 'e.g. Talk funnel' : 'ex.: Funil de Palestra'} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="pe-kind">{isEn ? 'Type' : 'Tipo'}</label>
            <select id="pe-kind" className={`${input} cursor-pointer`} value={p.kind} onChange={(e) => set('kind', e.target.value as Product['kind'])}>
              <option value="plano">{isEn ? 'Main plan' : 'Plano principal'}</option>
              <option value="adicional">{isEn ? 'Add-on (adds to a plan)' : 'Adicional (soma a um plano)'}</option>
              <option value="auxiliar">{isEn ? 'Auxiliary work' : 'Trabalho auxiliar'}</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pe-billing">{isEn ? 'Billing' : 'Cobrança'}</label>
            <select id="pe-billing" className={`${input} cursor-pointer`} value={p.billing} onChange={(e) => set('billing', e.target.value as Product['billing'])}>
              <option value="unico">{isEn ? 'One-off' : 'Único (por projeto)'}</option>
              <option value="mensal">{isEn ? 'Monthly' : 'Mensal'}</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pe-min">{isEn ? 'Price from (R$)' : 'Preço a partir de (R$)'}</label>
            <input id="pe-min" type="number" min="0" step="any" className={input} value={p.priceMin} onChange={(e) => set('priceMin', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={label} htmlFor="pe-max">{isEn ? 'Price up to (R$)' : 'Preço até (R$)'}</label>
            <input id="pe-max" type="number" min="0" step="any" className={input} value={p.priceMax} onChange={(e) => set('priceMax', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="pe-sum">{isEn ? 'Short description (goes to the client)' : 'Descrição curta (vai para a cliente)'}</label>
          <textarea id="pe-sum" rows={2} className={`${input} resize-y`} value={p.summary || ''} onChange={(e) => set('summary', e.target.value)} />
        </div>
        <div>
          <span className={label}>{isEn ? 'What is included' : 'O que inclui'}</span>
          <div className="grid gap-2">
            {p.includes.map((x, i) => (
              <div key={i} className="flex gap-2">
                <input className={input} value={x} onChange={(e) => setInc(i, e.target.value)} placeholder={isEn ? 'e.g. Landing page' : 'ex.: Landing page de inscrição'} />
                <button type="button" onClick={() => set('includes', p.includes.filter((_, j) => j !== i))} className="p-2 rounded-md text-fg-muted hover:text-danger-fg hover:bg-danger-soft cursor-pointer" aria-label={isEn ? 'Remove' : 'Remover'}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set('includes', [...p.includes, ''])} className="justify-self-start inline-flex items-center gap-1 text-xs font-semibold text-accent-soft-fg hover:underline cursor-pointer"><Plus className="w-3.5 h-3.5" />{isEn ? 'Add item' : 'Acrescentar item'}</button>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="pe-cond">{isEn ? 'Conditions (goes to the client)' : 'Condições (vai para a cliente)'}</label>
          <textarea id="pe-cond" rows={2} className={`${input} resize-y`} value={p.conditions || ''} onChange={(e) => set('conditions', e.target.value)} placeholder={isEn ? 'Ad budget, deadlines…' : 'Verba dos anúncios, prazos…'} />
        </div>
        <div>
          <label className={label} htmlFor="pe-notes">{isEn ? 'Internal notes (never sent)' : 'Notas internas (nunca são enviadas)'}</label>
          <textarea id="pe-notes" rows={2} className={`${input} resize-y`} value={p.internalNotes || ''} onChange={(e) => set('internalNotes', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-secondary cursor-pointer"><input type="checkbox" checked={p.active} onChange={(e) => set('active', e.target.checked)} />{isEn ? 'Active (shown in projects and price list)' : 'Ativo (aparece nos projetos e na tabela de preços)'}</label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="aura-btn aura-btn--secondary">{isEn ? 'Cancel' : 'Cancelar'}</button>
          <button type="submit" disabled={saving} className="aura-btn aura-btn--primary">{saving ? (isEn ? 'Saving…' : 'A guardar…') : (isEn ? 'Save' : 'Guardar')}</button>
        </div>
      </form>
    </div>
  );
}
