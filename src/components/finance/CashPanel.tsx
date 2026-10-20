import React, { useState } from 'react';
import { PiggyBank, Plus, Users, Lock } from 'lucide-react';
import type { AppSettings, CashReserve, CurrencyCode, Expense, Income, Project } from '../../types';
import { useFinanceMetrics } from '../../lib/finance/useFinanceMetrics';
import { getTodayIso } from '../../lib/storage';
import { DistributeForm } from './DistributeForm';

interface CashPanelProps {
  incomes: Income[];
  expenses: Expense[];
  projects: Project[];
  settings: AppSettings;
  reserves: CashReserve[];
  currencyFilter: CurrencyCode | 'ALL';
  lang: 'pt' | 'en';
  canEdit: boolean;
  onSaveReserve: (reserve: Omit<CashReserve, 'id' | 'createdAt'> & { id?: string }) => Promise<boolean>;
  onDistribute: (params: { amount: number; date: string; reference: string; sent: Record<string, boolean> }) => Promise<boolean>;
}

// Onde está o dinheiro do caixa e o que já tem destino. As reservas são escritas à mão.
export function CashPanel(p: CashPanelProps) {
  const en = p.lang === 'en';
  const m = useFinanceMetrics({ clients: [], projects: p.projects, incomes: p.incomes, expenses: p.expenses, settings: p.settings, currencyFilter: p.currencyFilter, period: '12m', lang: p.lang, reserves: p.reserves });
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayIso());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!name.trim() || !(value > 0)) return;
    setSaving(true);
    const ok = await p.onSaveReserve({ name: name.trim(), amount: value, currency: m.currency, date, notes: notes.trim() || undefined, closed: false });
    setSaving(false);
    if (ok) { setShowNew(false); setName(''); setAmount(''); setNotes(''); }
  };

  const tiles = [
    { label: en ? 'Cash balance' : 'Saldo em caixa', value: m.fmt(m.cashBalance), tone: 'text-fg' },
    { label: en ? 'Reserved' : 'Reservado', value: m.fmt(m.cashReserved), tone: 'text-fg' },
    { label: en ? 'Owed to partners' : 'Por enviar a sócios', value: m.fmt(m.cashOwedToPartners), tone: 'text-warning-fg' },
    { label: en ? 'Free to use' : 'Livre', value: m.fmt(m.cashFree), tone: m.cashFree < 0 ? 'text-danger-fg' : 'text-success-fg' },
  ];
  const owedItems = p.expenses.filter((e) => !e.paid && e.category === 'Distribuição a sócios');

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-glass border border-line-subtle p-4 rounded-xl shadow-glass">
            <div className="text-[12px] text-fg-secondary font-medium">{t.label}</div>
            <div className={`text-xl font-medium mt-1 tracking-[-0.03em] ${t.tone}`}>{t.value}</div>
          </div>
        ))}
      </div>
      {m.cashFree < 0 && (
        <p className="m-0 text-[13px] text-danger-fg">
          {en ? 'Reserves and amounts owed are larger than the cash. Check the reserves.' : 'As reservas e o que falta enviar aos sócios são maiores do que o caixa. Reveja as reservas.'}
        </p>
      )}

      <section className="bg-glass border border-line-subtle rounded-xl shadow-glass p-5 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-[15px] font-medium text-fg flex items-center gap-2"><PiggyBank className="w-4 h-4" />{en ? 'Reserves' : 'Reservas'}</h3>
          {p.canEdit && (
            <button type="button" onClick={() => setShowNew((v) => !v)} className="aura-btn aura-btn--secondary aura-btn--sm"><Plus />{en ? 'New reserve' : 'Nova reserva'}</button>
          )}
        </div>
        <p className="m-0 text-[13px] text-fg-muted">
          {en ? 'Money that stays in the cash but already has a purpose. Expenses paid from a reserve reduce it.' : 'Dinheiro que fica em caixa mas já tem destino. As despesas pagas com uma reserva vão-na reduzindo.'}
        </p>

        {showNew && (
          <form onSubmit={saveNew} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr] items-end border border-line-subtle rounded-xl p-3">
            <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Name' : 'Nome'}
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={en ? 'e.g. 30k goal' : 'Ex.: Meta dos 30 mil'} className="aura-input" />
            </label>
            <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Amount' : 'Valor'} ({m.currency})
              <input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" className="aura-input" />
            </label>
            <label className="grid gap-1 text-[12px] text-fg-secondary">{en ? 'Date' : 'Data'}
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="aura-input" />
            </label>
            <label className="grid gap-1 text-[12px] text-fg-secondary sm:col-span-2">{en ? 'Notes' : 'Notas'}
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="aura-input" />
            </label>
            <button type="submit" disabled={saving} className="aura-btn aura-btn--primary">{saving ? (en ? 'Saving…' : 'A guardar…') : (en ? 'Save reserve' : 'Guardar reserva')}</button>
          </form>
        )}

        {m.reserves.length === 0 ? (
          <p className="m-0 text-[13px] text-fg-muted">{en ? 'No reserves yet.' : 'Ainda sem reservas.'}</p>
        ) : (
          <ul className="m-0 p-0 list-none grid gap-2">
            {m.reserves.map(({ reserve, used, remaining }) => (
              <li key={reserve.id} className="flex flex-wrap items-center justify-between gap-3 border border-line-subtle rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-fg">{reserve.name}</div>
                  <div className="text-[12px] text-fg-muted">
                    {m.fmt(reserve.amount)} {en ? 'reserved' : 'reservados'}{used > 0 ? ` · ${m.fmt(used)} ${en ? 'used' : 'gastos'}` : ''}{reserve.notes ? ` · ${reserve.notes}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="text-[15px] font-medium text-fg">{m.fmt(remaining)}</strong>
                  {p.canEdit && (
                    <button type="button" title={en ? 'Close reserve (stops holding cash)' : 'Fechar reserva (deixa de prender caixa)'} onClick={() => p.onSaveReserve({ ...reserve, closed: true })} className="aura-btn aura-btn--ghost aura-btn--sm"><Lock />{en ? 'Close' : 'Fechar'}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-glass border border-line-subtle rounded-xl shadow-glass p-5 grid gap-4">
        <h3 className="m-0 text-[15px] font-medium text-fg flex items-center gap-2"><Users className="w-4 h-4" />{en ? 'Partner distribution' : 'Distribuição aos sócios'}</h3>
        {owedItems.length > 0 && (
          <ul className="m-0 p-0 list-none grid gap-1 text-[13px]">
            {owedItems.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 text-fg-secondary"><span>{e.description}</span><strong className="text-warning-fg font-medium">{m.fmt(e.amount)} · {en ? 'to send' : 'por enviar'}</strong></li>
            ))}
          </ul>
        )}
        {p.canEdit ? (
          <DistributeForm split={p.settings.profitSplit || []} currency={m.currency} suggested={Math.max(0, m.cashFree)} fmt={m.fmt} lang={p.lang} onDistribute={p.onDistribute} />
        ) : (
          <p className="m-0 text-[13px] text-fg-muted">{en ? 'Only the owner can distribute.' : 'Só o owner pode distribuir.'}</p>
        )}
      </section>
    </div>
  );
}
