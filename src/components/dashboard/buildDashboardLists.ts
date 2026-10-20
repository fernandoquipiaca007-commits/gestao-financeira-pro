import type { Client, Income, Project } from '../../types';
import type { BillingRequest, Task } from '../../types/rbac';
import { getDaysDiff } from '../../lib/formatters';
import type { AttentionItem } from './DashboardLists';

interface Args {
  lang: 'pt' | 'en';
  clients: Client[];
  overdue: Income[];
  dueToday: Income[];
  billingPending: BillingRequest[];
  projectsDueSoon: Project[];
  activeProjects: Project[];
  tasks: Task[];
  fmtIn: (amount: number, currency: Income['currency']) => string;
  navigate: (tab: string, filter?: string) => void;
  charge: (phone: string, text: string) => void;
}

const dayLabel = (d: number, en: boolean) =>
  d === 0 ? (en ? 'today' : 'hoje') : d < 0 ? (en ? `${-d}d late` : `há ${-d} dias`) : en ? `in ${d}d` : `em ${d} dias`;

/** Constrói as listas do painel (atenção, tarefas, prazos, progresso) a partir dos dados da app. */
export function buildDashboardLists(a: Args) {
  const en = a.lang === 'en';
  const client = new Map(a.clients.map((c) => [c.id, c]));

  const incomeItem = (i: Income, kind: 'overdue' | 'today'): AttentionItem => {
    const c = client.get(i.clientId);
    const d = getDaysDiff(i.dueDate);
    const amount = a.fmtIn(i.amount, i.currency);
    return {
      id: `${kind}-${i.id}`,
      kind,
      tone: kind === 'overdue' ? 'danger' : 'warning',
      title: c?.company || c?.name || (en ? 'Client' : 'Cliente'),
      meta: `${i.description} · ${dayLabel(d, en)}`,
      value: amount,
      actionLabel: c?.whatsapp ? (en ? 'Charge' : 'Cobrar') : undefined,
      onAction: c?.whatsapp
        ? () => a.charge(c.whatsapp, en
          ? `Hello ${c.name}, a friendly reminder about "${i.description}" (${amount}).`
          : `Olá ${c.name}, um lembrete sobre "${i.description}" (${amount}).`)
        : undefined,
      onOpen: () => a.navigate('financial', kind === 'overdue' ? 'receitas-atrasadas' : 'cobrar-hoje'),
    };
  };

  const attention: AttentionItem[] = [
    ...a.overdue.sort((x, y) => x.dueDate.localeCompare(y.dueDate)).map((i) => incomeItem(i, 'overdue')),
    ...a.dueToday.map((i) => incomeItem(i, 'today')),
    ...(a.billingPending.length
      ? [{
          id: 'billing',
          kind: 'billing' as const,
          tone: 'info' as const,
          title: en ? `${a.billingPending.length} billing request(s) to review` : `${a.billingPending.length} ${a.billingPending.length === 1 ? 'pedido de faturação' : 'pedidos de faturação'} por analisar`,
          meta: en ? 'Sent by your team' : 'Enviados pela equipa',
          actionLabel: en ? 'Review' : 'Analisar',
          onAction: () => a.navigate('billing', 'Solicitada'),
          onOpen: () => a.navigate('billing', 'Solicitada'),
        }]
      : []),
    ...a.projectsDueSoon.filter((p) => getDaysDiff(p.dueDate) <= 3).map((p): AttentionItem => ({
      id: `proj-${p.id}`,
      kind: 'project',
      tone: getDaysDiff(p.dueDate) < 0 ? 'danger' : 'warning',
      title: p.name,
      meta: `${en ? 'Delivery' : 'Entrega'} ${dayLabel(getDaysDiff(p.dueDate), en)}`,
      onOpen: () => a.navigate('projects', `project:${p.id}`),
    })),
  ];

  const today = a.tasks
    .filter((t) => t.status !== 'Cancelada' && (!t.dueDate || getDaysDiff(t.dueDate.slice(0, 10)) <= 0))
    .sort((x, y) => (x.status === 'Concluída' ? 1 : 0) - (y.status === 'Concluída' ? 1 : 0));
  const tasks = today.map((t) => ({
    id: t.id,
    title: t.title,
    meta: t.assignedToName || (t.dueDate && getDaysDiff(t.dueDate.slice(0, 10)) < 0 ? (en ? 'Overdue' : 'Atrasada') : en ? 'Today' : 'Hoje'),
    done: t.status === 'Concluída',
    onOpen: () => a.navigate('tasks', `task:${t.id}`),
  }));

  const timeline = a.projectsDueSoon.map((p) => {
    const d = getDaysDiff(p.dueDate);
    const c = client.get(p.clientId);
    return {
      id: p.id,
      title: p.name,
      meta: `${c?.company || c?.name || ''}${c ? ' · ' : ''}${dayLabel(d, en)}`,
      when: new Date(p.dueDate + 'T00:00:00').getDate().toString(),
      late: d < 0,
      onOpen: () => a.navigate('projects', `project:${p.id}`),
    };
  });

  const progress = a.activeProjects
    .filter((p) => p.totalAmount > 0)
    .sort((x, y) => y.totalAmount - x.totalAmount)
    .map((p) => {
      const c = client.get(p.clientId);
      return {
        id: p.id,
        name: p.name,
        client: c?.company || c?.name || '',
        pct: (p.paidAmount / p.totalAmount) * 100,
        label: `${a.fmtIn(p.paidAmount, p.currency)} / ${a.fmtIn(p.totalAmount, p.currency)}`,
        onOpen: () => a.navigate('projects', `project:${p.id}`),
      };
    });

  return { attention, tasks, tasksDone: today.filter((t) => t.status === 'Concluída').length, tasksTotal: today.length, timeline, progress };
}
