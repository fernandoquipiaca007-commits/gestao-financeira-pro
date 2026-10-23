import React from 'react';
import { Check, Undo2 } from 'lucide-react';
import type { AgendaEvent, Client } from '../../types';
import { formatDate } from '../../lib/formatters';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Lista de tudo o que ainda está por fazer (atrasado, hoje e próximos 7 dias), com um botão "Feito". */
export function PendingEventsPanel({ events, clients, isEn, onToggle, onEdit }: {
  events: AgendaEvent[];
  clients: Client[];
  isEn: boolean;
  onToggle: (id: string) => void;
  onEdit: (e: AgendaEvent) => void;
}) {
  const today = todayIso();
  const limit = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const pending = events.filter((e) => e.status === 'pending' && e.date <= limit).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const [showDone, setShowDone] = React.useState(false);
  const done = events.filter((e) => e.status === 'completed' && e.date >= today.slice(0, 8) + '01').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  const label = (d: string) => (d < today ? (isEn ? 'Overdue' : 'Em atraso') : d === today ? (isEn ? 'Today' : 'Hoje') : formatDate(d));
  const tone = (d: string) => (d < today ? 'text-danger-fg' : d === today ? 'text-warning-fg' : 'text-fg-muted');

  const row = (e: AgendaEvent, isDone: boolean) => {
    const client = clients.find((c) => c.id === e.clientId);
    return (
      <li key={e.id} className="flex items-start gap-3 py-2.5 border-b border-line-subtle last:border-0">
        <button
          type="button"
          onClick={() => onToggle(e.id)}
          className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer shrink-0 transition-colors ${isDone ? 'bg-surface-2 text-fg-secondary hover:bg-sunken' : 'bg-success-soft text-success-fg hover:opacity-85'}`}
          title={isDone ? (isEn ? 'Reopen' : 'Reabrir') : (isEn ? 'Mark as done' : 'Marcar como feito')}
        >
          {isDone ? <Undo2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          {isDone ? (isEn ? 'Reopen' : 'Reabrir') : (isEn ? 'Done' : 'Feito')}
        </button>
        <button type="button" onClick={() => onEdit(e)} className="min-w-0 flex-1 text-left cursor-pointer">
          <span className={`block text-sm font-semibold ${isDone ? 'line-through text-fg-muted' : 'text-fg'}`}>{e.title}</span>
          <span className="block text-[12px] text-fg-secondary truncate">{client ? `${client.name} · ` : ''}{e.description || ''}</span>
        </button>
        <span className={`shrink-0 text-[12px] font-semibold ${isDone ? 'text-fg-muted' : tone(e.date)}`}>{isDone ? formatDate(e.date) : label(e.date)}{e.time && !isDone ? ` · ${e.time}` : ''}</span>
      </li>
    );
  };

  return (
    <section className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
      <div className="flex items-center justify-between gap-3">
        <h2 className="aura-h4 m-0">{isEn ? 'To do' : 'A fazer'} <span className="text-fg-muted font-normal">({pending.length})</span></h2>
        {done.length > 0 && (
          <button type="button" onClick={() => setShowDone((v) => !v)} className="text-xs font-semibold text-accent-soft-fg hover:underline cursor-pointer">
            {showDone ? (isEn ? 'Hide done' : 'Esconder feitos') : (isEn ? `Show done (${done.length})` : `Ver feitos (${done.length})`)}
          </button>
        )}
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-fg-muted mt-2 mb-0">{isEn ? 'Nothing pending. 🎉' : 'Nada pendente.'}</p>
      ) : (
        <ul className="m-0 mt-2 p-0 list-none">{pending.map((e) => row(e, false))}</ul>
      )}
      {showDone && <ul className="m-0 mt-3 p-0 list-none border-t border-line-subtle">{done.map((e) => row(e, true))}</ul>}
    </section>
  );
}
