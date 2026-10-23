import React from 'react';
import { ArrowLeft, Edit3, MessageCircle, Mail, Star, FolderKanban, Wallet, ListChecks, BellRing } from 'lucide-react';
import { PIPELINE_STAGES, type Client, type Project, type Income, type AgendaEvent } from '../../types';
import type { Task } from '../../types/rbac';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface Props {
  client: Client;
  projects: Project[];
  incomes: Income[];
  tasks: Task[];
  agendaEvents: AgendaEvent[];
  isEn: boolean;
  canEdit: boolean;
  canViewFinancials: boolean;
  onBack: () => void;
  onEdit: (c: Client) => void;
  onOpenProject: (id: string) => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
      <h2 className="aura-h4 m-0 mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line-subtle last:border-0 text-sm">
      <span className="text-fg-secondary">{label}</span>
      <span className="text-right text-fg">{value}</span>
    </div>
  );
}

/** Página completa de uma cliente: contacto, acompanhamento comercial, projetos, pagamentos, tarefas e agenda. */
export function ClientDetailView({ client: c, projects, incomes, tasks, agendaEvents, isEn, canEdit, canViewFinancials, onBack, onEdit, onOpenProject, onOpenWhatsApp }: Props) {
  const own = projects.filter((p) => p.clientId === c.id || p.clientIds?.includes(c.id)).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  const ownIds = new Set(own.map((p) => p.id));
  const pay = incomes.filter((i) => i.clientId === c.id || (i.projectId && ownIds.has(i.projectId))).sort((a, b) => (b.receivedDate || b.dueDate || '').localeCompare(a.receivedDate || a.dueDate || ''));
  const cTasks = tasks.filter((t) => t.projectId && ownIds.has(t.projectId));
  const events = agendaEvents.filter((e) => e.clientId === c.id || (e.projectId && ownIds.has(e.projectId))).sort((a, b) => b.date.localeCompare(a.date));
  const received = pay.filter((i) => i.status === 'Recebido').reduce((s, i) => s + i.amount, 0);
  const owed = pay.filter((i) => i.status !== 'Recebido').reduce((s, i) => s + i.amount, 0);
  const stage = PIPELINE_STAGES.find((s) => s.key === c.pipelineStage);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="aura-btn aura-btn--secondary aura-btn--sm inline-flex"><ArrowLeft className="w-4 h-4" /> {isEn ? 'All clients' : 'Todas as clientes'}</button>
        <div className="flex gap-2">
          {c.whatsapp && <button type="button" onClick={() => onOpenWhatsApp(c.whatsapp, isEn ? `Hello, ${c.name}!` : `Olá, ${c.name}! Tudo bem?`)} className="aura-btn aura-btn--secondary aura-btn--sm inline-flex"><MessageCircle className="w-4 h-4" /> WhatsApp</button>}
          {canEdit && <button type="button" onClick={() => onEdit(c)} className="aura-btn aura-btn--primary aura-btn--sm inline-flex"><Edit3 className="w-4 h-4" /> {isEn ? 'Edit' : 'Editar'}</button>}
        </div>
      </div>

      <header>
        <div className="flex flex-wrap items-center gap-2 mb-2 text-[12px]">
          {stage && <span className="aura-badge aura-badge--accent !font-medium">{isEn ? stage.en : stage.pt}</span>}
          {!!c.rating && <span className="text-warning-fg">{'★'.repeat(c.rating)}</span>}
          {c.contractType && <span className="aura-badge !font-medium">{c.contractType}</span>}
        </div>
        <h1 className="font-display font-normal text-[28px] sm:text-[34px] leading-tight tracking-[-0.02em] text-fg m-0 flex items-center gap-2">
          {c.isFavorite && <Star className="w-6 h-6 text-warning-fg shrink-0" fill="currentColor" />}{c.name}
        </h1>
        <p className="text-sm text-fg-secondary mt-1.5 mb-0">{[c.company, c.type, c.city].filter(Boolean).join(' · ')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          {(c.nextAction || c.summary) && (
            <Card title={isEn ? 'Sales follow-up' : 'Acompanhamento comercial'}>
              {c.nextAction && (
                <p className={`m-0 mb-3 rounded-md px-3 py-2 text-[13px] ${c.nextContactDate && c.nextContactDate <= today ? 'bg-warning-soft text-warning-fg' : 'bg-surface-2 text-fg-secondary'}`}>
                  <strong>{isEn ? 'Next step' : 'Próximo passo'}{c.nextContactDate ? ` · ${formatDate(c.nextContactDate)}` : ''}: </strong>{c.nextAction}
                </p>
              )}
              {c.summary && <p className="m-0 text-[14px] leading-relaxed text-fg whitespace-pre-line">{c.summary}</p>}
            </Card>
          )}
          <Card title={`${isEn ? 'Projects' : 'Projetos'} (${own.length})`} icon={<FolderKanban className="w-4 h-4" />}>
            {own.length === 0 ? <p className="m-0 text-sm text-fg-muted">{isEn ? 'No projects.' : 'Sem projetos.'}</p> : (
              <ul className="m-0 p-0 list-none">
                {own.map((p) => (
                  <li key={p.id} className="border-b border-line-subtle last:border-0">
                    <button type="button" onClick={() => onOpenProject(p.id)} className="w-full text-left flex items-start justify-between gap-3 py-2.5 cursor-pointer group">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-fg group-hover:text-accent-soft-fg">{p.name}</span>
                        <span className="block text-[12px] text-fg-muted">{p.status}{p.archived ? (isEn ? ' · archived' : ' · arquivado') : ''}{p.startDate ? ` · ${formatDate(p.startDate)}` : ''}</span>
                      </span>
                      {canViewFinancials && <span className="shrink-0 text-right text-[12px] text-fg-secondary">{formatCurrency(p.paidAmount, p.currency)} / {formatCurrency(p.totalAmount, p.currency)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canViewFinancials && (
            <Card title={isEn ? 'Payments' : 'Pagamentos'} icon={<Wallet className="w-4 h-4" />}>
              {pay.length === 0 ? <p className="m-0 text-sm text-fg-muted">{isEn ? 'No payments.' : 'Sem pagamentos.'}</p> : (
                <ul className="m-0 p-0 list-none">
                  {pay.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 py-2 border-b border-line-subtle last:border-0 text-sm">
                      <span className="min-w-0"><span className="block text-fg">{i.description}</span><span className="block text-[12px] text-fg-muted">{formatDate(i.receivedDate || i.dueDate)} · <span className={i.status === 'Recebido' ? 'text-success-fg' : 'text-warning-fg'}>{i.status}</span></span></span>
                      <span className="shrink-0 font-semibold text-fg">{formatCurrency(i.amount, i.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title={`${isEn ? 'Tasks' : 'Tarefas'} (${cTasks.length})`} icon={<ListChecks className="w-4 h-4" />}>
            {cTasks.length === 0 ? <p className="m-0 text-sm text-fg-muted">{isEn ? 'No tasks.' : 'Sem tarefas.'}</p> : (
              <ul className="m-0 p-0 list-none">{cTasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-2 border-b border-line-subtle last:border-0 text-sm">
                  <span className="text-fg">{t.title}</span>
                  <span className="shrink-0 text-[12px] text-fg-muted">{t.status}{t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}</span>
                </li>
              ))}</ul>
            )}
          </Card>

          <Card title={`${isEn ? 'Agenda' : 'Agenda'} (${events.length})`} icon={<BellRing className="w-4 h-4" />}>
            {events.length === 0 ? <p className="m-0 text-sm text-fg-muted">{isEn ? 'Nothing scheduled.' : 'Nada marcado.'}</p> : (
              <ul className="m-0 p-0 list-none">{events.slice(0, 20).map((e) => (
                <li key={e.id} className={`flex items-start justify-between gap-3 py-2 border-b border-line-subtle last:border-0 text-sm ${e.status === 'completed' ? 'opacity-60' : ''}`}>
                  <span className="text-fg">{e.title}</span>
                  <span className="shrink-0 text-[12px] text-fg-muted">{formatDate(e.date)}{e.time ? ` · ${e.time}` : ''}</span>
                </li>
              ))}</ul>
            )}
          </Card>
        </div>
        <aside className="space-y-6 min-w-0">
          {canViewFinancials && (
            <Card title={isEn ? 'Money' : 'Valores'} icon={<Wallet className="w-4 h-4" />}>
              <Row label={isEn ? 'Received' : 'Já recebido'} value={<span className="text-success-fg font-semibold">{formatCurrency(received, c.currency)}</span>} />
              <Row label={isEn ? 'Still owes' : 'Ainda deve'} value={<span className={owed > 0 ? 'text-warning-fg font-semibold' : 'text-fg-muted'}>{formatCurrency(owed, c.currency)}</span>} />
            </Card>
          )}
          <Card title={isEn ? 'Profile' : 'Perfil'}>
            {c.whatsapp && <Row label="WhatsApp" value={c.whatsapp} />}
            {c.email && <Row label="Email" value={<a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-accent-soft-fg"><Mail className="w-3.5 h-3.5" />{c.email}</a>} />}
            {c.contactName && <Row label={isEn ? 'Contact' : 'Contacto'} value={`${c.contactName}${c.contactRole ? ` · ${c.contactRole}` : ''}`} />}
            {c.source && <Row label={isEn ? 'Source' : 'Origem'} value={c.source} />}
            {c.lastContactAt && <Row label={isEn ? 'Last contact' : 'Último contacto'} value={formatDate(c.lastContactAt)} />}
            {c.nextContactDate && <Row label={isEn ? 'Next contact' : 'Próximo contacto'} value={formatDate(c.nextContactDate)} />}
            {!!c.tags?.length && <div className="mt-3 flex flex-wrap gap-1.5">{c.tags.map((t) => <span key={t} className="aura-badge aura-badge--accent !font-medium">{t}</span>)}</div>}
          </Card>
          {c.notes && <Card title={isEn ? 'Notes' : 'Notas'}><p className="m-0 text-[13px] leading-relaxed text-fg-secondary whitespace-pre-line">{c.notes}</p></Card>}
        </aside>
      </div>
    </div>
  );
}
