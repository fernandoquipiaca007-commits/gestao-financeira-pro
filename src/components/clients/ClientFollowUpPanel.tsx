import React, { useMemo } from 'react';
import { BellRing, Star } from 'lucide-react';
import { PIPELINE_STAGES, type Client, type PipelineStage } from '../../types';
import { formatDate } from '../../lib/formatters';

type Filter = PipelineStage | 'ALL' | 'FAV' | 'DUE';

const toneClass: Record<string, string> = {
  accent: 'aura-badge aura-badge--accent !font-medium',
  success: 'aura-badge aura-badge--success !font-medium',
  warning: 'aura-badge !font-medium !bg-warning-soft !text-warning-fg',
  danger: 'aura-badge aura-badge--danger !font-medium',
  neutral: 'aura-badge !font-medium',
};

export function stageInfo(key: PipelineStage) {
  const st = PIPELINE_STAGES.find((s) => s.key === key) || PIPELINE_STAGES[0];
  return { ...st, cls: toneClass[st.tone] };
}

/** Data de hoje (AAAA-MM-DD) no fuso do navegador. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Topo da página de clientes: quem contactar hoje, próximos contactos e quantas há em cada fase. */
export function ClientFollowUpPanel({ clients, isEn, active, onSelect, onOpenClient }: {
  clients: Client[];
  isEn: boolean;
  active: Filter;
  onSelect: (f: Filter) => void;
  onOpenClient?: (c: Client) => void;
}) {
  const today = todayISO();
  const { due, upcoming, counts, favs } = useMemo(() => {
    const withDate = clients.filter((c) => c.nextContactDate).sort((a, b) => a.nextContactDate!.localeCompare(b.nextContactDate!));
    const counts = new Map<PipelineStage, number>();
    clients.forEach((c) => c.pipelineStage && counts.set(c.pipelineStage, (counts.get(c.pipelineStage) || 0) + 1));
    return {
      due: withDate.filter((c) => c.nextContactDate! <= today),
      upcoming: withDate.filter((c) => c.nextContactDate! > today).slice(0, 6),
      counts,
      favs: clients.filter((c) => c.isFavorite).length,
    };
  }, [clients, today]);

  if (!clients.some((c) => c.pipelineStage || c.nextContactDate)) return null;

  const pill = (key: Filter, label: string, n: number) => (
    <button
      key={key}
      type="button"
      onClick={() => onSelect(active === key ? 'ALL' : key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${active === key ? 'bg-primary text-primary-fg shadow-primary-3d' : 'bg-surface-2 text-fg-secondary hover:bg-sunken'}`}
    >
      {label} <span className="opacity-70">{n}</span>
    </button>
  );

  const row = (c: Client) => (
    <li key={c.id}>
      <button type="button" disabled={!onOpenClient} onClick={() => onOpenClient?.(c)} className="w-full text-left flex items-start justify-between gap-3 py-2 border-b border-line-subtle last:border-0 cursor-pointer disabled:cursor-default">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            {c.isFavorite && <Star className="w-3.5 h-3.5 text-warning-fg" fill="currentColor" />}
            <span className="truncate">{c.name}</span>
          </span>
          <span className="block text-[12px] text-fg-secondary">{c.nextAction || (isEn ? 'Get in touch' : 'Entrar em contacto')}</span>
        </span>
        <span className={`shrink-0 text-[12px] font-semibold ${c.nextContactDate! < today ? 'text-danger-fg' : c.nextContactDate === today ? 'text-warning-fg' : 'text-fg-muted'}`}>
          {c.nextContactDate! < today ? (isEn ? 'Overdue' : 'Em atraso') : c.nextContactDate === today ? (isEn ? 'Today' : 'Hoje') : formatDate(c.nextContactDate!)}
        </span>
      </button>
    </li>
  );

  return (
    <section className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="aura-h4 m-0 flex items-center gap-2"><BellRing className="w-4 h-4 text-warning-fg" />{isEn ? 'Contact today' : 'Contactar hoje'} <span className="text-fg-muted font-normal">({due.length})</span></h2>
          {due.length ? <ul className="m-0 mt-2 p-0 list-none">{due.map(row)}</ul> : <p className="text-sm text-fg-muted mt-2 mb-0">{isEn ? 'Nobody to contact today.' : 'Ninguém para contactar hoje.'}</p>}
        </div>
        <div>
          <h2 className="aura-h4 m-0">{isEn ? 'Next contacts' : 'Próximos contactos'}</h2>
          {upcoming.length ? <ul className="m-0 mt-2 p-0 list-none">{upcoming.map(row)}</ul> : <p className="text-sm text-fg-muted mt-2 mb-0">{isEn ? 'No contacts scheduled.' : 'Sem contactos marcados.'}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {pill('DUE', isEn ? 'Contact today' : 'Contactar hoje', due.length)}
        {pill('FAV', isEn ? 'Favourites' : 'Preferidas', favs)}
        {PIPELINE_STAGES.filter((st) => counts.get(st.key)).map((st) => pill(st.key, isEn ? st.en : st.pt, counts.get(st.key)!))}
      </div>
    </section>
  );
}
