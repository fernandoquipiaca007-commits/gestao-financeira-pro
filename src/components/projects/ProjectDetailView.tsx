import React, { useMemo } from 'react';
import { ArrowLeft, Edit3, Building2, MessageCircle, Mail, Calendar, Wallet, ListChecks, BellRing, Handshake, Star, Paperclip, Download } from 'lucide-react';
import { type Project, type Client, type Income, type AgendaEvent, getProjectStatusLabel, BILLING_TYPE_LABELS, PIPELINE_STAGES } from '../../types';
import type { Task } from '../../types/rbac';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { MarkdownView } from '../editor/MarkdownView';

interface Props {
  project: Project;
  clients: Client[];
  incomes: Income[];
  tasks: Task[];
  agendaEvents: AgendaEvent[];
  isEn: boolean;
  canEdit: boolean;
  canViewFinancials: boolean;
  onBack: () => void;
  onEdit: (p: Project) => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
}

function Card({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-glass border border-line-subtle rounded-xl p-5 shadow-glass ${className}`}>
      <h2 className="aura-h4 m-0 mb-4 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line-subtle last:border-0 text-sm">
      <span className="text-fg-secondary">{label}</span>
      <span className={`text-right ${strong ? 'font-semibold text-fg' : 'text-fg'}`}>{value}</span>
    </div>
  );
}

/** Página completa de um projeto: descrição inteira, cliente, dinheiro, cobranças, tarefas e agenda. */
export function ProjectDetailView({ project: p, clients, incomes, tasks, agendaEvents, isEn, canEdit, canViewFinancials, onBack, onEdit, onOpenWhatsApp }: Props) {
  const ids = p.clientIds && p.clientIds.length ? p.clientIds : p.clientId ? [p.clientId] : [];
  const linked = ids.map((id) => clients.find((c) => c.id === id)).filter(Boolean) as Client[];
  const projIncomes = useMemo(() => incomes.filter((i) => i.projectId === p.id).sort((a, b) => (a.receivedDate || a.dueDate || '').localeCompare(b.receivedDate || b.dueDate || '')), [incomes, p.id]);
  const projTasks = tasks.filter((t) => t.projectId === p.id);
  const events = agendaEvents
    .filter((e) => e.projectId === p.id || (e.clientId && ids.includes(e.clientId)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const remaining = Math.max(0, p.totalAmount - p.paidAmount);
  const pct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paidAmount / p.totalAmount) * 100)) : 0;
  const stageLabel = (k?: string) => { const s = PIPELINE_STAGES.find((x) => x.key === k); return s ? (isEn ? s.en : s.pt) : null; };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="aura-btn aura-btn--secondary aura-btn--sm inline-flex">
          <ArrowLeft className="w-4 h-4" /> {isEn ? 'All projects' : 'Todos os projetos'}
        </button>
        {canEdit && (
          <button type="button" onClick={() => onEdit(p)} className="aura-btn aura-btn--primary aura-btn--sm inline-flex">
            <Edit3 className="w-4 h-4" /> {isEn ? 'Edit project' : 'Editar projeto'}
          </button>
        )}
      </div>

      <header>
        <div className="flex flex-wrap items-center gap-2 mb-2 text-[12px]">
          <span className="aura-badge !font-medium">{p.category}</span>
          <span className="aura-badge aura-badge--accent !font-medium">{getProjectStatusLabel(p.status, isEn ? 'en' : 'pt')}</span>
          {p.billingType && p.billingType !== 'unico' && <span className="aura-badge !font-medium">{isEn ? BILLING_TYPE_LABELS[p.billingType].en : BILLING_TYPE_LABELS[p.billingType].pt}</span>}
          {p.archived && <span className="aura-badge !font-medium">{isEn ? 'Archived' : 'Arquivado'}</span>}
          {!!p.rating && <span className="text-warning-fg">{'★'.repeat(p.rating)}</span>}
        </div>
        <h1 className="font-display font-normal text-[28px] sm:text-[34px] leading-tight tracking-[-0.02em] text-fg m-0">{p.name}</h1>
        <p className="text-sm text-fg-secondary mt-2 mb-0 flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{isEn ? 'Start' : 'Início'}: {p.startDate ? formatDate(p.startDate) : '—'}</span>
          <span>{isEn ? 'Delivery' : 'Entrega'}: {p.dueDate ? formatDate(p.dueDate) : (isEn ? 'not defined' : 'indefinida')}</span>
          {p.partnerName && <span className="inline-flex items-center gap-1.5"><Handshake className="w-4 h-4" />{isEn ? 'Partner' : 'Parceiro'}: {p.partnerName}</span>}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          <Card title={isEn ? 'Description' : 'Descrição'} icon={null}>
            {p.notes ? <MarkdownView source={p.notes} className="text-[15px] leading-relaxed" /> : <p className="text-sm text-fg-muted m-0">{isEn ? 'No description yet.' : 'Ainda sem descrição.'}</p>}
          </Card>
          {canViewFinancials && (
            <Card title={isEn ? 'Payments' : 'Pagamentos'} icon={<Wallet className="w-4 h-4" />}>
              {projIncomes.length === 0 ? <p className="text-sm text-fg-muted m-0">{isEn ? 'No payments recorded.' : 'Sem pagamentos registados.'}</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-fg-muted text-[12px]"><th className="py-2 font-medium">{isEn ? 'Description' : 'Descrição'}</th><th className="py-2 font-medium">{isEn ? 'Date' : 'Data'}</th><th className="py-2 font-medium">{isEn ? 'Status' : 'Estado'}</th><th className="py-2 font-medium text-right">{isEn ? 'Amount' : 'Valor'}</th></tr></thead>
                    <tbody>
                      {projIncomes.map((i) => (
                        <tr key={i.id} className="border-t border-line-subtle">
                          <td className="py-2 pr-3 text-fg">{i.description}{i.paymentMethod ? <span className="block text-[12px] text-fg-muted">{i.paymentMethod}</span> : null}</td>
                          <td className="py-2 pr-3 text-fg-secondary whitespace-nowrap">{formatDate(i.receivedDate || i.dueDate)}</td>
                          <td className={`py-2 pr-3 whitespace-nowrap ${i.status === 'Recebido' ? 'text-success-fg' : 'text-warning-fg'}`}>{i.status}</td>
                          <td className="py-2 text-right font-semibold text-fg whitespace-nowrap">{formatCurrency(i.amount, i.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          <Card title={isEn ? 'Tasks' : 'Tarefas'} icon={<ListChecks className="w-4 h-4" />}>
            {projTasks.length === 0 ? <p className="text-sm text-fg-muted m-0">{isEn ? 'No tasks for this project.' : 'Sem tarefas neste projeto.'}</p> : (
              <ul className="m-0 p-0 list-none">
                {projTasks.map((t) => (
                  <li key={t.id} className="py-2 border-b border-line-subtle last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-fg">{t.title}</span>
                      <span className="text-[12px] text-fg-muted whitespace-nowrap">{t.status}{t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}</span>
                    </div>
                    {t.description && <p className="m-0 mt-1 text-[13px] text-fg-secondary whitespace-pre-line">{t.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={isEn ? 'Agenda' : 'Agenda'} icon={<BellRing className="w-4 h-4" />}>
            {events.length === 0 ? <p className="text-sm text-fg-muted m-0">{isEn ? 'Nothing scheduled.' : 'Nada marcado.'}</p> : (
              <ul className="m-0 p-0 list-none">
                {events.map((e) => (
                  <li key={e.id} className={`py-2 border-b border-line-subtle last:border-0 ${e.status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-fg">{e.title}</span>
                      <span className="text-[12px] text-fg-muted whitespace-nowrap">{formatDate(e.date)}{e.time ? ` · ${e.time}` : ''}</span>
                    </div>
                    {e.description && <p className="m-0 mt-1 text-[13px] text-fg-secondary">{e.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!!p.attachments?.length && (
            <Card title={isEn ? 'Attachments' : 'Anexos'} icon={<Paperclip className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.attachments.map((a) => (
                  <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="aura-chip inline-flex items-center gap-1.5">{a.name}<Download className="w-3 h-3" /></a>
                ))}
              </div>
            </Card>
          )}
        </div>
        <aside className="space-y-6 min-w-0">
          {canViewFinancials && (
            <Card title={isEn ? 'Money' : 'Valores'} icon={<Wallet className="w-4 h-4" />}>
              <Row label={isEn ? 'Total' : 'Valor total'} value={formatCurrency(p.totalAmount, p.currency)} strong />
              <Row label={isEn ? 'Paid' : 'Já pago'} value={<span className="text-success-fg font-semibold">{formatCurrency(p.paidAmount, p.currency)}</span>} />
              <Row label={isEn ? 'Missing' : 'Em falta'} value={<span className={remaining > 0 ? 'text-warning-fg font-semibold' : 'text-fg-muted'}>{formatCurrency(remaining, p.currency)}</span>} />
              {p.billingType && p.billingType !== 'unico' && <Row label={isEn ? 'Per period' : 'Por período'} value={formatCurrency(p.recurringAmount || 0, p.currency)} />}
              {remaining > 0 && p.nextPaymentDate && <Row label={isEn ? 'Next payment' : 'Próx. pagamento'} value={formatDate(p.nextPaymentDate)} />}
              {p.partnerName && <Row label={isEn ? 'Commission' : 'Comissão'} value={`${formatCurrency(p.commissionAmount || 0, p.currency)}${p.commissionPaid ? (isEn ? ' · paid' : ' · paga') : ''}`} />}
              <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-success-fg" style={{ width: `${pct}%` }} /></div>
              <p className="m-0 mt-1 text-right text-[12px] text-fg-muted">{pct}% {isEn ? 'paid' : 'liquidado'}</p>
            </Card>
          )}

          {linked.map((c) => (
            <Card key={c.id} title={c.name} icon={c.isFavorite ? <Star className="w-4 h-4 text-warning-fg" fill="currentColor" /> : <Building2 className="w-4 h-4" />}>
              {c.company && <p className="m-0 mb-2 text-sm text-fg-secondary">{c.company}</p>}
              {stageLabel(c.pipelineStage) && <Row label={isEn ? 'Stage' : 'Fase'} value={stageLabel(c.pipelineStage)} />}
              {!!c.rating && <Row label={isEn ? 'Rating' : 'Classificação'} value={<span className="text-warning-fg">{'★'.repeat(c.rating)}</span>} />}
              {c.contractType && <Row label={isEn ? 'Contract' : 'Contrato'} value={c.contractType} />}
              {c.source && <Row label={isEn ? 'Source' : 'Origem'} value={c.source} />}
              {c.lastContactAt && <Row label={isEn ? 'Last contact' : 'Último contacto'} value={formatDate(c.lastContactAt)} />}
              {c.nextContactDate && <Row label={isEn ? 'Next contact' : 'Próximo contacto'} value={formatDate(c.nextContactDate)} />}
              {c.nextAction && <p className="m-0 mt-3 rounded-md bg-warning-soft text-warning-fg px-3 py-2 text-[13px]"><strong>{isEn ? 'Next step: ' : 'Próximo passo: '}</strong>{c.nextAction}</p>}
              {c.summary && <p className="m-0 mt-3 text-[13px] leading-relaxed text-fg-secondary whitespace-pre-line">{c.summary}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {c.whatsapp && (
                  <button type="button" onClick={() => onOpenWhatsApp(c.whatsapp, isEn ? `Hello, ${c.name}!` : `Olá, ${c.name}! Tudo bem?`)} className="px-3.5 py-1.5 bg-success-soft text-success-fg rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                )}
                {c.email && <a href={`mailto:${c.email}`} className="px-3.5 py-1.5 bg-surface-2 text-fg-secondary rounded-full text-xs font-semibold inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</a>}
              </div>
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}
