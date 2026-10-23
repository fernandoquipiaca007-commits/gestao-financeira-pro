import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Users, FolderKanban, ListChecks, BellRing, Wallet, ChevronRight } from 'lucide-react';
import type { Client, Project, Income, AgendaEvent } from '../types';
import type { Task } from '../types/rbac';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  tasks?: Task[];
  agendaEvents?: AgendaEvent[];
  onSelectClient: (client: Client) => void;
  onSelectProject: (project: Project) => void;
  onSelectTask?: (task: Task) => void;
  onSelectEvent?: (event: AgendaEvent) => void;
  onSelectIncome?: (income: Income) => void;
}

const norm = (s?: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const LIMIT = 8;

function Group({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-[13px] font-medium text-fg-secondary flex items-center gap-1.5">{icon}{title} ({count})</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ title, sub, onClick }: { title: string; sub: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left p-3.5 bg-surface-2 hover:bg-sunken border border-line-subtle rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors group">
      <div className="min-w-0">
        <div className="font-semibold text-fg text-sm group-hover:text-accent-soft-fg transition-colors truncate">{title}</div>
        <div className="text-[13px] text-fg-muted mt-0.5 truncate">{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-fg-disabled group-hover:text-accent-soft-fg shrink-0" />
    </button>
  );
}

/** Pesquisa global: ao escrever um nome mostra tudo o que se liga a ele e abre a página certa. */
export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose, clients, projects, incomes, tasks = [], agendaEvents = [], onSelectClient, onSelectProject, onSelectTask, onSelectEvent, onSelectIncome }) => {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const q = norm(query.trim());
  const res = useMemo(() => {
    if (!q) return null;
    const has = (...f: (string | undefined)[]) => f.some((x) => norm(x).includes(q));
    const mClients = clients.filter((c) => has(c.name, c.company, c.whatsapp, c.email, c.type, c.contactName, c.source, c.summary, c.nextAction, c.notes, (c.tags || []).join(' ')));
    // clientes cujo NOME bate: tudo o que é delas entra nos resultados
    const nameIds = new Set(clients.filter((c) => has(c.name, c.company, c.whatsapp, c.contactName)).map((c) => c.id));
    const ofClient = (p: Project) => nameIds.has(p.clientId) || (p.clientIds || []).some((id) => nameIds.has(id));
    const mProjects = projects.filter((p) => has(p.name, p.category, p.notes, p.partnerName) || ofClient(p));
    const projIds = new Set(mProjects.filter((p) => ofClient(p) || has(p.name)).map((p) => p.id));
    const mTasks = tasks.filter((t) => has(t.title, t.description) || (t.projectId && projIds.has(t.projectId)));
    const mEvents = agendaEvents.filter((e) => has(e.title, e.description) || (e.clientId && nameIds.has(e.clientId)) || (e.projectId && projIds.has(e.projectId)));
    const mIncomes = incomes.filter((i) => has(i.description) || nameIds.has(i.clientId) || (i.projectId && projIds.has(i.projectId)));
    return { mClients, mProjects, mTasks, mEvents, mIncomes };
  }, [q, clients, projects, tasks, agendaEvents, incomes]);

  if (!isOpen) return null;
  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name || '-';
  const projName = (id?: string) => projects.find((p) => p.id === id)?.name;
  const total = res ? res.mClients.length + res.mProjects.length + res.mTasks.length + res.mEvents.length + res.mIncomes.length : 0;
  const pick = (fn: () => void) => () => { fn(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-[rgba(18,17,14,0.34)] backdrop-blur-sm p-4 animate-fade-in font-sans" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-glass-strong border border-line-subtle rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-[56px]">
        <div className="bg-surface-2 p-4 border-b border-line-subtle flex items-center space-x-3">
          <Search className="w-5 h-5 text-fg-muted stroke-[2.2]" />
          <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-fg font-normal text-sm focus:outline-none placeholder:text-fg-muted"
            placeholder={en ? 'Search a name: client, project, task, payment…' : 'Pesquisar um nome: doutora, projeto, tarefa, pagamento…'} />
          <button onClick={onClose} className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg cursor-pointer transition-colors" aria-label={en ? 'Close' : 'Fechar'}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!res ? (
            <div className="text-center py-12 text-fg-muted space-y-1">
              <p className="text-fg font-semibold text-base">{en ? 'Search everything' : 'Pesquisa de tudo'}</p>
              <p className="text-sm">{en ? 'Type a name and see everything linked to it. Click to open the page.' : 'Escreva um nome e veja tudo o que se liga a ele. Clique para abrir a página.'}</p>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-12 text-fg-muted text-sm">{en ? `No results for "${query}".` : `Nenhum resultado para "${query}".`}</div>
          ) : (
            <>
              <Group icon={<Users className="w-4 h-4 text-accent-soft-fg" />} title={en ? 'Clients' : 'Clientes'} count={res.mClients.length}>
                {res.mClients.slice(0, LIMIT).map((c) => (
                  <Row key={c.id} title={`${c.isFavorite ? '★ ' : ''}${c.name}`} sub={[c.company, c.type, c.whatsapp].filter(Boolean).join(' • ')} onClick={pick(() => onSelectClient(c))} />
                ))}
              </Group>
              <Group icon={<FolderKanban className="w-4 h-4 text-fg-secondary" />} title={en ? 'Projects' : 'Projetos'} count={res.mProjects.length}>
                {res.mProjects.slice(0, LIMIT).map((p) => (
                  <Row key={p.id} title={p.name} sub={`${clientName(p.clientId)} • ${p.status}${p.archived ? (en ? ' • archived' : ' • arquivado') : ''} • ${formatCurrency(p.totalAmount, p.currency)}`} onClick={pick(() => onSelectProject(p))} />
                ))}
              </Group>
              <Group icon={<ListChecks className="w-4 h-4 text-fg-secondary" />} title={en ? 'Tasks' : 'Tarefas'} count={res.mTasks.length}>
                {res.mTasks.slice(0, LIMIT).map((t) => (
                  <Row key={t.id} title={t.title} sub={`${t.status}${t.dueDate ? ` • ${formatDate(t.dueDate)}` : ''}${projName(t.projectId) ? ` • ${projName(t.projectId)}` : ''}`} onClick={pick(() => onSelectTask?.(t))} />
                ))}
              </Group>
              <Group icon={<BellRing className="w-4 h-4 text-fg-secondary" />} title={en ? 'Agenda' : 'Agenda'} count={res.mEvents.length}>
                {res.mEvents.slice(0, LIMIT).map((e) => (
                  <Row key={e.id} title={e.title} sub={`${formatDate(e.date)}${e.time ? ` • ${e.time}` : ''} • ${e.status === 'completed' ? (en ? 'done' : 'feito') : (en ? 'pending' : 'pendente')}`} onClick={pick(() => onSelectEvent?.(e))} />
                ))}
              </Group>
              <Group icon={<Wallet className="w-4 h-4 text-fg-secondary" />} title={en ? 'Payments' : 'Pagamentos'} count={res.mIncomes.length}>
                {res.mIncomes.slice(0, LIMIT).map((i) => (
                  <Row key={i.id} title={i.description} sub={`${clientName(i.clientId)} • ${i.status} • ${formatCurrency(i.amount, i.currency)}`} onClick={pick(() => onSelectIncome?.(i))} />
                ))}
              </Group>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
