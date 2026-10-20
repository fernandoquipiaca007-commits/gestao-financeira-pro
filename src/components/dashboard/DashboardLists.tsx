import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CalendarClock, CheckCircle2, Circle, FileText, FolderKanban, MessageCircle, Sparkles } from 'lucide-react';
import { fadeUp } from './DashboardCards';

export interface AttentionItem {
  id: string;
  tone: 'danger' | 'warning' | 'info';
  title: string;
  meta: string;
  value?: string;
  actionLabel?: string;
  onAction?: () => void;
  onOpen?: () => void;
  kind: 'overdue' | 'today' | 'billing' | 'project';
}

const kindIcon = { overdue: AlertCircle, today: CalendarClock, billing: FileText, project: FolderKanban };

/** Lista "Precisa de atenção": o que pede ação hoje, com a ação à mão. */
export function AttentionList({ items, emptyTitle, emptyText }: { items: AttentionItem[]; emptyTitle: string; emptyText: string }) {
  if (!items.length) {
    return (
      <div className="grid place-items-center text-center gap-2 py-8">
        <span className="aura-stat__icon !w-12 !h-12 !bg-success-soft !text-success-fg"><Sparkles /></span>
        <p className="m-0 font-medium text-fg">{emptyTitle}</p>
        <p className="m-0 text-[13px] text-fg-muted max-w-[34ch]">{emptyText}</p>
      </div>
    );
  }
  return (
    <motion.ul className="aura-list -mx-2" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {items.slice(0, 6).map((it) => {
        const Icon = kindIcon[it.kind];
        return (
          <motion.li key={it.id} variants={fadeUp} className="aura-list-item !min-h-[60px] !items-start sm:!items-center flex-wrap sm:flex-nowrap">
            {/* o texto abre o detalhe; a ação (ex.: Cobrar) é um botão à parte — sem controlos encaixados */}
            <button type="button" onClick={it.onOpen} disabled={!it.onOpen} className="flex flex-1 min-w-0 items-start sm:items-center gap-3 text-left cursor-pointer disabled:cursor-default">
              <span className={`aura-list-item__icon !w-10 !h-10 ${it.tone === 'danger' ? '!bg-danger-soft !text-danger-fg' : it.tone === 'warning' ? '!bg-warning-soft !text-warning-fg' : '!bg-info-soft !text-info-fg'} !shadow-none`}>
                <Icon className="!w-[18px] !h-[18px]" />
              </span>
              <span className="aura-list-item__body">
                <span className="aura-list-item__title block text-[14px] !whitespace-normal line-clamp-2">{it.title}</span>
                <span className="aura-list-item__meta">{it.meta}</span>
              </span>
            </button>
            <span className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 pl-[52px] sm:pl-0">
              {it.value && <span className="aura-list-item__value text-[14px]">{it.value}</span>}
              {it.onAction && (
                <button type="button" onClick={it.onAction} className="aura-btn aura-btn--secondary aura-btn--sm shrink-0">
                  {it.kind === 'overdue' || it.kind === 'today' ? <MessageCircle /> : null}
                  {it.actionLabel}
                </button>
              )}
            </span>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/** Tarefas de hoje: card escuro com pilha 3D (o foco do dia). */
export function TasksToday({ title, tasks, doneCount, totalCount, emptyText, onOpen, onToggle }: {
  title: string;
  tasks: { id: string; title: string; meta: string; done: boolean; onOpen?: () => void }[];
  doneCount: number;
  totalCount: number;
  emptyText: string;
  onOpen: () => void;
  onToggle?: (id: string, done: boolean) => void;
}) {
  return (
    <motion.section variants={fadeUp} className="pt-5 min-w-0">
      <div className="aura-float aura-float--delay h-full">
      <div className="aura-card aura-card--inverse aura-stack h-full p-5 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <button type="button" onClick={onOpen} className="text-left cursor-pointer">
            <h2 className="font-display text-[17px] font-medium m-0 text-[var(--text-inverse)]">{title}</h2>
          </button>
          <span className="font-display font-light text-[34px] leading-none text-[var(--text-inverse)]">{doneCount}/{totalCount}</span>
        </div>
        {tasks.length === 0 ? (
          <p className="text-[13px] text-[var(--text-inverse-muted)] m-0 py-6 text-center">{emptyText}</p>
        ) : (
          <ul className="aura-list -mx-2">
            {tasks.slice(0, 5).map((t) => (
              <li key={t.id} className={`aura-list-item !min-h-[56px] ${t.done ? 'aura-list-item--done' : ''}`}>
                <button type="button" onClick={() => onToggle?.(t.id, !t.done)} className="aura-list-item__icon !w-9 !h-9 cursor-pointer" aria-label={t.done ? 'Marcar como por fazer' : 'Marcar como concluída'}>
                  {t.done ? <CheckCircle2 className="!w-[18px] !h-[18px]" /> : <Circle className="!w-[18px] !h-[18px]" />}
                </button>
                <button type="button" onClick={t.onOpen} className="aura-list-item__body text-left cursor-pointer">
                  <span className="aura-list-item__title block text-[14px]">{t.title}</span>
                  <span className="aura-list-item__meta">{t.meta}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </motion.section>
  );
}

/** Timeline de próximas entregas e prazos. */
export function UpcomingTimeline({ items, emptyText }: { items: { id: string; title: string; meta: string; when: string; late?: boolean; onOpen?: () => void }[]; emptyText: string }) {
  if (!items.length) return <p className="text-[13px] text-fg-muted text-center py-8 m-0">{emptyText}</p>;
  return (
    <ol className="relative m-0 p-0 list-none grid gap-1">
      <span className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--divider)]" aria-hidden />
      {items.slice(0, 5).map((it) => (
        <li key={it.id}>
          <button type="button" onClick={it.onOpen} className="relative w-full flex items-start gap-3 rounded-lg px-1 py-2 text-left hover:bg-sunken transition-colors cursor-pointer">
            <span className={`relative z-10 mt-1 w-[30px] h-[30px] shrink-0 rounded-full grid place-items-center text-[11px] font-semibold ${it.late ? 'bg-danger-soft text-danger-fg' : 'bg-surface-1 text-fg shadow-xs'}`}>{it.when}</span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-fg line-clamp-2">{it.title}</span>
              <span className="block text-[12px] text-fg-muted truncate">{it.meta}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Progresso dos projetos ativos (pago vs total), barras com listras no que falta. */
export function ProjectsProgress({ items, emptyText }: { items: { id: string; name: string; client: string; pct: number; label: string; onOpen?: () => void }[]; emptyText: string }) {
  if (!items.length) return <p className="text-[13px] text-fg-muted text-center py-8 m-0">{emptyText}</p>;
  return (
    <ul className="m-0 p-0 list-none grid gap-4">
      {items.slice(0, 5).map((p, i) => (
        <li key={p.id}>
          <button type="button" onClick={p.onOpen} className="w-full text-left grid gap-2 cursor-pointer group">
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-fg line-clamp-2 group-hover:underline underline-offset-2">{p.name}</span>
                <span className="block text-[12px] text-fg-muted truncate">{p.client}</span>
              </span>
              <span className="text-[12px] text-fg-secondary tabular-nums shrink-0">{p.label}</span>
            </span>
            <span className="aura-progress aura-progress--sm">
              <motion.span className="aura-progress__bar" initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, p.pct))}%` }} transition={{ duration: 1, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
