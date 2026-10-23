import React, { useEffect, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import type { Project } from '../../types';
import { formatCurrency } from '../../lib/formatters';

export interface LinkProjectData {
  name: string;
  startDate: string;
  dueDate: string;
  noDueDate: boolean;
  totalAmount: number;
  coveredAmount: number;
  notes: string;
}

const input = 'w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all';
const label = 'text-[13px] font-medium text-fg-secondary block mb-1.5';
const today = () => new Date().toISOString().slice(0, 10);

/** Cria um projeto novo (ex.: a palestra deste mês) ligado a um projeto de origem. */
export function LinkProjectModal({ parent, isOpen, isEn, onClose, onConfirm }: {
  parent: Project | null;
  isOpen: boolean;
  isEn: boolean;
  onClose: () => void;
  onConfirm: (data: LinkProjectData) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [noDueDate, setNoDueDate] = useState(false);
  const [total, setTotal] = useState(0);
  const [covered, setCovered] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!parent || !isOpen) return;
    setName(parent.name);
    setStartDate(today());
    setDueDate('');
    setNoDueDate(false);
    setTotal(parent.totalAmount);
    setCovered(0);
    setNotes(isEn ? `Linked to project "${parent.name}".` : `Vinculado ao projeto «${parent.name}».`);
    setSaving(false);
  }, [parent, isOpen, isEn]);

  if (!isOpen || !parent) return null;
  const cur = parent.currency;
  const safeCovered = Math.min(Math.max(0, covered || 0), total || 0);
  const toCharge = Math.max(0, (total || 0) - safeCovered);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || saving) return;
    setSaving(true);
    try {
      await onConfirm({ name: name.trim(), startDate, dueDate, noDueDate, totalAmount: Number(total) || 0, coveredAmount: safeCovered, notes: notes.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="bg-surface-1 w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line-subtle shadow-glass p-6 grid gap-5 text-fg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="aura-h4 m-0 flex items-center gap-2"><Link2 className="w-4 h-4" />{isEn ? 'Link a new project' : 'Vincular novo projeto'}</h2>
            <p className="m-0 mt-1 text-[13px] text-fg-secondary">{isEn ? 'Origin: ' : 'Origem: '}<strong>{parent.name}</strong></p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-sunken cursor-pointer" aria-label={isEn ? 'Close' : 'Fechar'}><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className={label} htmlFor="lp-name">{isEn ? 'Name of the new project *' : 'Nome do novo projeto *'}</label>
          <input id="lp-name" required className={input} value={name} onChange={(e) => setName(e.target.value)} />
          <p className="m-0 mt-1 text-[12px] text-fg-muted">{isEn ? 'Tip: add the month, e.g. "… #3 — November".' : 'Dica: acrescente o mês, ex.: «… #3 — Novembro».'}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="lp-start">{isEn ? 'Start *' : 'Início *'}</label>
            <input id="lp-start" type="date" required className={input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="lp-due">{isEn ? 'Delivery' : 'Entrega'}</label>
            {noDueDate ? <div className={`${input} text-fg-muted`}>{isEn ? 'No date set' : 'Data indefinida'}</div> : <input id="lp-due" type="date" className={input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
            <label className="mt-1.5 flex items-center gap-2 text-[12px] text-fg-secondary cursor-pointer"><input type="checkbox" checked={noDueDate} onChange={(e) => setNoDueDate(e.target.checked)} />{isEn ? 'Undefined date' : 'Data indefinida'}</label>
          </div>
        </div>

        <fieldset className="border border-line-subtle rounded-xl p-4 grid gap-3">
          <legend className="px-2 text-[13px] font-semibold text-fg-secondary">{isEn ? 'How is it paid?' : 'Como é pago?'}</legend>
          <div>
            <label className={label} htmlFor="lp-total">{isEn ? 'Total value of this project' : 'Valor total deste projeto'}</label>
            <input id="lp-total" type="number" min="0" step="any" className={input} value={total} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setTotal(v); if (covered > v) setCovered(v); }} />
          </div>
          <div>
            <label className={label} htmlFor="lp-cov">{isEn ? 'Covered by the earlier payment' : 'Coberto pelo pagamento anterior'}</label>
            <input id="lp-cov" type="number" min="0" max={total} step="any" className={input} value={covered} onChange={(e) => setCovered(parseFloat(e.target.value) || 0)} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setCovered(total)} className="aura-chip cursor-pointer">{isEn ? 'All: already paid' : 'Tudo: já está pago'}</button>
              <button type="button" onClick={() => setCovered(0)} className="aura-chip cursor-pointer">{isEn ? 'None: new charge' : 'Nada: nova cobrança'}</button>
            </div>
          </div>
          <div className="rounded-lg bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed text-fg-secondary">
            <div>{isEn ? 'Counts as already paid (no new income, cash unchanged): ' : 'Conta como já pago (sem receita nova, o caixa não muda): '}<strong className="text-success-fg">{formatCurrency(safeCovered, cur)}</strong></div>
            <div>{isEn ? 'New charge (pending income to receive): ' : 'Nova cobrança (receita pendente a receber): '}<strong className={toCharge > 0 ? 'text-warning-fg' : 'text-fg'}>{formatCurrency(toCharge, cur)}</strong></div>
          </div>
        </fieldset>

        <div>
          <label className={label} htmlFor="lp-notes">{isEn ? 'Notes' : 'Notas'}</label>
          <textarea id="lp-notes" rows={3} className={`${input} resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <p className="m-0 text-[12px] text-fg-muted">{isEn ? 'Client, category and currency are copied from the origin project. Partner commission is not copied.' : 'Cliente, categoria e moeda são copiados do projeto de origem. A comissão do parceiro não é copiada.'}</p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="aura-btn aura-btn--secondary">{isEn ? 'Cancel' : 'Cancelar'}</button>
          <button type="submit" disabled={saving} className="aura-btn aura-btn--primary">{saving ? (isEn ? 'Saving…' : 'A guardar…') : (isEn ? 'Create linked project' : 'Criar projeto vinculado')}</button>
        </div>
      </form>
    </div>
  );
}
