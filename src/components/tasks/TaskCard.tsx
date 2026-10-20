import React from 'react';
import { CalendarDays, CheckSquare, FolderKanban } from 'lucide-react';
import type { Task } from '../../types/rbac';
import { getDaysDiff } from '../../lib/formatters';

export const PRIORITY_META: Record<Task['priority'], { label: string; en: string; color: string; badge: string }> = {
  urgent: { label: 'Urgente', en: 'Urgent', color: 'var(--danger)', badge: 'aura-badge--danger' },
  high: { label: 'Alta', en: 'High', color: 'var(--accent)', badge: 'aura-badge--accent' },
  normal: { label: 'Normal', en: 'Normal', color: 'var(--aura-ink-400)', badge: '' },
  low: { label: 'Baixa', en: 'Low', color: 'var(--aura-ink-300)', badge: '' },
};
export const PRIORITY_ORDER: Record<Task['priority'], number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/** Conta itens de checklist Markdown (- [ ] / - [x]) na descrição. */
export function checklistProgress(text?: string) {
  if (!text) return null;
  const all = text.match(/^\s*[-*] \[( |x|X)\]/gm);
  if (!all?.length) return null;
  const done = all.filter((l) => /\[(x|X)\]/.test(l)).length;
  return { done, total: all.length };
}

const initials = (n?: string) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

interface Props {
  task: Task;
  projectName?: string;
  lang: 'pt' | 'en';
  lifted?: boolean;
  onOpen?: () => void;
}

/** Cartão do quadro. A faixa à esquerda mostra a prioridade; o prazo fica vermelho quando está em atraso. */
export function TaskCard({ task, projectName, lang, lifted, onOpen }: Props) {
  const en = lang === 'en';
  const pr = PRIORITY_META[task.priority] || PRIORITY_META.normal;
  const due = task.dueDate ? task.dueDate.slice(0, 10) : null;
  const d = due ? getDaysDiff(due) : null;
  const late = d != null && d < 0 && task.status !== 'Concluída';
  const check = checklistProgress(task.description);
  const done = task.status === 'Concluída';

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-glass-strong p-3.5 pl-4 text-left transition-[box-shadow,transform] duration-200 ${
        lifted ? 'shadow-xl border-line rotate-[1.5deg] scale-[1.03] cursor-grabbing' : 'shadow-glass border-[var(--glass-border)] hover:shadow-md cursor-grab'
      }`}
      onDoubleClick={onOpen}
    >
      <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: pr.color }} aria-hidden />
      <div className="flex items-start justify-between gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpen}
          onPointerDown={(e) => e.stopPropagation()}
          className={`min-w-0 break-words text-left text-[14px] font-medium leading-snug hover:underline underline-offset-2 cursor-pointer ${done ? 'line-through text-fg-muted' : 'text-fg'}`}
        >
          {task.title}
        </button>
        {(task.priority === 'urgent' || task.priority === 'high') && (
          <span className={`aura-badge ${pr.badge} shrink-0`}>{en ? pr.en : pr.label}</span>
        )}
      </div>

      {(projectName || task.category) && (
        <div className="mt-2 flex flex-wrap gap-1.5 min-w-0">
          {projectName && (
            <span className="inline-flex min-w-0 items-start gap-1 rounded-[9px] bg-surface-2 px-2 py-0.5 text-[11.5px] leading-[1.35] text-fg-secondary max-w-full" title={projectName}>
              <FolderKanban className="w-3 h-3 shrink-0 mt-[2px]" /><span className="line-clamp-2 break-words">{projectName}</span>
            </span>
          )}
          {task.category && <span className="rounded-full bg-highlight-soft px-2 py-0.5 text-[11.5px] text-fg-secondary">{task.category}</span>}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[12px] text-fg-muted">
        {due && (
          <span className={`inline-flex items-center gap-1 ${late ? 'text-danger-fg font-medium' : ''}`}>
            <CalendarDays className="w-3.5 h-3.5" />
            {new Date(due + 'T00:00:00').toLocaleDateString(en ? 'en-US' : 'pt-PT', { day: '2-digit', month: 'short' })}
          </span>
        )}
        {check && (
          <span className={`inline-flex items-center gap-1 ${check.done === check.total ? 'text-success-fg' : ''}`}>
            <CheckSquare className="w-3.5 h-3.5" />{check.done}/{check.total}
          </span>
        )}
        <span className="ml-auto" />
        {task.assignedToName && (
          <span className="aura-avatar aura-avatar--xs !text-[10px]" title={task.assignedToName}>{initials(task.assignedToName)}</span>
        )}
      </div>
    </div>
  );
}
