import type { Indicator } from './DashboardIndicators';
import type { Period } from '../../lib/finance/useFinanceMetrics';
import { INDICATOR_ICONS } from './DashboardIndicators';

interface Ind {
  overdueAmount: number; overdueClients: number; overdueCount: number;
  dueTodayAmount: number; dueTodayCount: number;
  spentPeriod: number; spentDelta: number | null;
  netPeriod: number; margin: number | null;
  contracted: number; contractedCount: number;
  pendingCommissions: number;
  activeCount: number; issuesCount: number; completedCount: number;
  clientsCount: number; newClientsPeriod: number;
}

/** Os 8 indicadores do painel anterior, num só bloco. Cada um abre o módulo já filtrado; os de fluxo seguem o período. */
export function buildIndicators(i: Ind, fmt: (v: number) => string, en: boolean, go: (tab: string, filter?: string) => void, period: Period = '1m'): Indicator[] {
  const pct = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(0)}%`;
  const n = period === '12m' ? 12 : 3;
  const inPeriod = period === '1m' ? '' : en ? ` (${n} months)` : ` (${n} meses)`;
  const vsPrev = period === '1m' ? (en ? 'vs. last month' : 'vs. mês anterior') : en ? `vs. previous ${n} months` : `vs. ${n} meses anteriores`;
  return [
    {
      id: 'overdue', label: en ? 'Overdue' : 'Em atraso', value: fmt(i.overdueAmount),
      tone: i.overdueCount ? 'danger' : 'success', icon: INDICATOR_ICONS.AlertTriangle, onClick: () => go('financial', 'receitas-atrasadas'),
      note: i.overdueCount
        ? (en ? `${i.overdueClients} client(s) · ${i.overdueCount} invoice(s)` : `${i.overdueClients} cliente(s) · ${i.overdueCount} fatura(s)`)
        : (en ? 'Nothing overdue' : 'Nada em atraso'),
    },
    {
      id: 'today', label: en ? 'Due today' : 'Cobranças de hoje', value: fmt(i.dueTodayAmount),
      tone: i.dueTodayCount ? 'warning' : 'neutral', icon: INDICATOR_ICONS.CalendarClock, onClick: () => go('financial', 'cobrar-hoje'),
      note: en ? `${i.dueTodayCount} to collect today` : `${i.dueTodayCount} para cobrar hoje`,
    },
    {
      id: 'costs', label: period === '1m' ? (en ? 'Costs this month' : 'Custos do mês') : (en ? 'Costs' : 'Custos') + inPeriod, value: fmt(i.spentPeriod),
      icon: INDICATOR_ICONS.Receipt, onClick: () => go('financial', 'despesas'),
      note: i.spentDelta == null ? (en ? 'Paid expenses' : 'Despesas pagas') : `${pct(i.spentDelta)} ${vsPrev}`,
    },
    {
      id: 'net', label: period === '1m' ? (en ? 'Net result this month' : 'Resultado do mês') : (en ? 'Net result' : 'Resultado') + inPeriod, value: fmt(i.netPeriod),
      tone: i.netPeriod >= 0 ? 'success' : 'danger', icon: INDICATOR_ICONS.TrendingUp, onClick: () => go('reports'),
      note: i.margin == null ? (en ? 'No income yet' : 'Ainda sem receitas') : `${en ? 'Margin' : 'Margem'} ${i.margin.toFixed(0)}%`,
    },
    {
      id: 'contracted', label: en ? 'Contracted revenue' : 'Receita contratada', value: fmt(i.contracted),
      icon: INDICATOR_ICONS.Briefcase, onClick: () => go('projects'),
      note: en ? `${i.contractedCount} project(s)` : `${i.contractedCount} projeto(s)`,
    },
    {
      id: 'commissions', label: en ? 'Partner payouts' : 'Repasses a parceiros', value: fmt(i.pendingCommissions),
      tone: i.pendingCommissions > 0 ? 'warning' : 'neutral', icon: INDICATOR_ICONS.Handshake, onClick: () => go('partners', i.pendingCommissions > 0 ? 'pendentes' : undefined),
      note: en ? 'Commissions to pay' : 'Comissões por pagar',
    },
    {
      id: 'projects', label: en ? 'Active projects' : 'Projetos ativos', value: String(i.activeCount),
      tone: i.issuesCount ? 'warning' : 'neutral', icon: INDICATOR_ICONS.FolderKanban, onClick: () => go('projects', 'ativos'),
      note: en ? `${i.issuesCount} need attention · ${i.completedCount} done` : `${i.issuesCount} com pendências · ${i.completedCount} concluídos`,
    },
    {
      id: 'clients', label: en ? 'Active clients' : 'Clientes ativos', value: String(i.clientsCount),
      icon: INDICATOR_ICONS.Users, onClick: () => go('clients'),
      note: period === '1m'
        ? (en ? `${i.newClientsPeriod} new this month` : `${i.newClientsPeriod} novos este mês`)
        : (en ? `${i.newClientsPeriod} new in ${n} months` : `${i.newClientsPeriod} novos em ${n} meses`),
    },
  ];
}
