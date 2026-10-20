import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { AppSettings, Client, CurrencyCode, Expense, Income, Project, CashReserve } from '../../types';
import type { BillingRequest, Task, TaskStatus } from '../../types/rbac';
import { convertCurrency, formatCurrency } from '../../lib/formatters';
import { useFinanceMetrics, Period } from '../../lib/finance/useFinanceMetrics';
import { AreaTrend, BarCompare, ForecastLine } from '../charts/TrendCharts';
import { DonutBreakdown } from '../charts/BreakdownCharts';
import { ChartLegend } from '../charts/AuraTooltip';
import { DashCard, HeroBalance, KpiAccent, KpiReceivable } from './DashboardCards';
import { AttentionList, ProjectsProgress, TasksToday, UpcomingTimeline } from './DashboardLists';
import { buildDashboardLists } from './buildDashboardLists';
import { IndicatorsGrid } from './DashboardIndicators';
import { buildIndicators } from './buildIndicators';

interface Props {
  userName: string;
  lang: 'pt' | 'en';
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  tasks: Task[];
  billingRequests: BillingRequest[];
  settings: AppSettings;
  reserves?: CashReserve[];
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal?: () => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
}

const greet = (en: boolean) => {
  const h = new Date().getHours();
  return h < 12 ? (en ? 'Good morning' : 'Bom dia') : h < 19 ? (en ? 'Good afternoon' : 'Boa tarde') : en ? 'Good evening' : 'Boa noite';
};

export function FinanceDashboard(p: Props) {
  const en = p.lang === 'en';
  const [period, setPeriod] = useState<Period>('3m');
  const [flowView, setFlowView] = useState<'area' | 'bars'>('area');
  const m = useFinanceMetrics({ ...p, period });
  const locale = en ? 'en-US' : 'pt-PT';
  const fmtIn = (amount: number, cur: CurrencyCode) => formatCurrency(convertCurrency(amount, cur, m.currency, p.settings.exchangeRates), m.currency);
  const lists = buildDashboardLists({
    lang: p.lang, clients: p.clients, overdue: m.overdue, dueToday: m.dueToday,
    billingPending: p.billingRequests.filter((r) => r.status === 'Solicitada' || r.status === 'Em análise'),
    projectsDueSoon: m.projectsDueSoon, activeProjects: m.activeProjects, tasks: p.tasks,
    fmtIn, navigate: p.onNavigateTab, charge: p.onOpenWhatsAppCharge,
  });
  const first = p.userName.split(' ')[0];
  const status = m.overdue.length
    ? (en ? `${m.overdue.length} overdue ${m.overdue.length === 1 ? 'invoice' : 'invoices'} need your attention.` : `${m.overdue.length} ${m.overdue.length === 1 ? 'fatura vencida precisa' : 'faturas vencidas precisam'} da sua atenção.`)
    : (en ? 'Everything is up to date.' : 'Está tudo em dia.');
  // rótulos que acompanham o período escolhido
  const n = period === '12m' ? 12 : 3;
  const pl = period === '1m'
    ? { received: en ? 'Received this month' : 'Recebido no mês', net: en ? 'Net this month:' : 'Resultado do mês:', vs: en ? 'vs. last month' : 'vs. mês anterior', top: en ? 'Received this month, top 5' : 'Recebido no mês, top 5', grain: en ? 'by day' : 'por dia' }
    : { received: en ? `Received in ${n} months` : `Recebido em ${n} meses`, net: en ? `Net, ${n} months:` : `Resultado em ${n} meses:`, vs: en ? `vs. previous ${n} months` : `vs. ${n} meses anteriores`, top: en ? `Received in ${n} months, top 5` : `Recebido em ${n} meses, top 5`, grain: period === '3m' ? (en ? 'by week' : 'por semana') : (en ? 'by month' : 'por mês') };
  const periods: { id: Period; label: string }[] = [{ id: '1m', label: en ? 'Month' : 'Mês' }, { id: '3m', label: '3M' }, { id: '12m', label: '12M' }];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="grid gap-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[40px] leading-[1.05] tracking-[-0.035em] text-fg m-0">{greet(en)}, {first}</h1>
          <p className="mt-1.5 mb-0 text-[15px] text-fg-secondary">{status}</p>
        </div>
        <div className="aura-segmented" role="radiogroup" aria-label={en ? 'Period' : 'Período'}>
          {periods.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={period === x.id} className="aura-segmented__item" onClick={() => setPeriod(x.id)}>{x.label}</button>
          ))}
        </div>
      </div>

      {/* Linha 1 — herói + 2 KPIs */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
        <HeroBalance value={m.cashBalance} currency={m.currency} locale={locale} lang={p.lang}
          net={m.fmt(m.netPeriod)} netLabel={pl.net}
          onIncome={p.onOpenNewIncomeModal} onExpense={p.onOpenNewExpenseModal}
          breakdown={{ free: m.fmt(m.cashFree), reserved: m.fmt(m.cashReserved), owed: m.fmt(m.cashOwedToPartners), hasReserved: m.cashReserved > 0, hasOwed: m.cashOwedToPartners > 0 }}
          onOpenReserves={() => p.onNavigateTab('financial', 'reservas')} />
        <KpiAccent label={pl.received} value={m.receivedPeriod} currency={m.currency} locale={locale}
          delta={m.receivedDelta} deltaSuffix={pl.vs} spark={m.series.map((s) => s.receitas)}
          onClick={() => p.onNavigateTab('financial', 'receitas-recebidas')} />
        <KpiReceivable label={en ? 'To receive' : 'A receber'} value={m.toReceive} currency={m.currency} locale={locale} aging={m.aging} format={m.fmt}
          footnote={m.overdue.length ? (en ? `${m.overdue.length} overdue` : `${m.overdue.length} em atraso`) : (en ? 'Nothing overdue' : 'Nada em atraso')}
          onClick={() => p.onNavigateTab('financial', 'receitas-pendentes')} />
      </div>

      {/* Indicadores do negócio — os controlos do painel anterior, num só bloco */}
      <section className="grid gap-3">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.015em] text-fg m-0">{en ? 'Business indicators' : 'Indicadores do negócio'}</h2>
        <IndicatorsGrid items={buildIndicators(m.indicators, m.fmt, en, (tab, filter) => p.onNavigateTab(tab, filter), period)} />
      </section>

      {/* Linha 2 — fluxo + atenção */}
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <DashCard title={en ? 'Cash flow' : 'Fluxo de caixa'} subtitle={`${en ? 'Received vs. paid' : 'Recebido vs. pago'} · ${pl.grain}`} onOpen={() => p.onNavigateTab('reports')}
          action={<div className="flex flex-wrap items-center justify-end gap-3"><ChartLegend items={[{ label: en ? 'Income' : 'Receitas', color: 'var(--viz-2)' }, { label: en ? 'Expenses' : 'Despesas', color: 'var(--viz-1)' }]} /><div className="aura-segmented" role="radiogroup" aria-label={en ? 'Chart type' : 'Tipo de gráfico'}><button type="button" role="radio" aria-checked={flowView === 'area'} className="aura-segmented__item" onClick={() => setFlowView('area')}>{en ? 'Area' : 'Área'}</button><button type="button" role="radio" aria-checked={flowView === 'bars'} className="aura-segmented__item" onClick={() => setFlowView('bars')}>{en ? 'Bars' : 'Barras'}</button></div></div>}>
          {flowView === 'bars' ? (
            <BarCompare data={m.series as unknown as Record<string, unknown>[]} format={m.fmt} lang={p.lang}
              series={[{ key: 'receitas', label: en ? 'Income' : 'Receitas', color: 'var(--viz-2)' }, { key: 'despesas', label: en ? 'Expenses' : 'Despesas', color: 'var(--viz-1)' }]} />
          ) : (
          <AreaTrend data={m.series as unknown as Record<string, unknown>[]} format={m.fmt} lang={p.lang}
            series={[{ key: 'receitas', label: en ? 'Income' : 'Receitas', color: 'var(--viz-2)' }, { key: 'despesas', label: en ? 'Expenses' : 'Despesas', color: 'var(--viz-1)' }]} />
          )}
        </DashCard>
        <DashCard title={en ? 'Needs attention' : 'Precisa de atenção'}>
          <AttentionList items={lists.attention} emptyTitle={en ? 'All clear' : 'Tudo em ordem'} emptyText={en ? 'No overdue invoices or urgent deadlines.' : 'Sem faturas vencidas nem prazos urgentes.'} />
        </DashCard>
      </div>

      {/* Linha 3 — previsão, clientes, composição */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DashCard title={en ? 'Cash forecast' : 'Previsão de caixa'} subtitle={en ? 'Next 90 days' : 'Próximos 90 dias'}>
          <ForecastLine data={m.forecast} format={m.fmt} lang={p.lang} />
        </DashCard>
        <DashCard title={en ? 'Top clients' : 'Receita por cliente'} subtitle={pl.top} onOpen={() => p.onNavigateTab('clients')}>
          {m.topClients.length
            ? <BarCompare layout="vertical" height={200} data={m.topClients.map((c) => ({ label: c.name, valor: c.value }))} format={m.fmt} lang={p.lang} series={[{ key: 'valor', label: en ? 'Received' : 'Recebido', color: 'var(--viz-2)' }]} />
            : <p className="text-[13px] text-fg-muted text-center py-10 m-0">{en ? 'No income received yet.' : 'Ainda sem receitas recebidas.'}</p>}
        </DashCard>
        <DashCard title={en ? 'Composition' : 'Composição'}>
          <DonutBreakdown data={m.composition} format={m.fmt} centerLabel={en ? 'Total' : 'Total'} centerValue={m.fmt(m.composition.reduce((s, c) => s + c.value, 0))} />
        </DashCard>
      </div>

      {/* Linha 4 — tarefas, prazos, projetos */}
      <div className="grid gap-5 lg:grid-cols-3">
        <TasksToday title={en ? "Today's tasks" : 'Tarefas de hoje'} tasks={lists.tasks} doneCount={lists.tasksDone} totalCount={lists.tasksTotal}
          emptyText={en ? 'No tasks for today.' : 'Sem tarefas para hoje.'} onOpen={() => p.onNavigateTab('tasks')}
          onToggle={p.onUpdateTaskStatus ? (id, done) => p.onUpdateTaskStatus!(id, done ? 'Concluída' : 'Em andamento') : undefined} />
        <DashCard title={en ? 'Upcoming deadlines' : 'Próximas entregas'} onOpen={() => p.onNavigateTab('calendar')}>
          <UpcomingTimeline items={lists.timeline} emptyText={en ? 'No deliveries in the next two weeks.' : 'Sem entregas nas próximas duas semanas.'} />
        </DashCard>
        <DashCard title={en ? 'Active projects' : 'Projetos ativos'} subtitle={en ? 'Paid vs. total' : 'Pago vs. total'} onOpen={() => p.onNavigateTab('projects')}>
          <ProjectsProgress items={lists.progress} emptyText={en ? 'No active projects.' : 'Sem projetos ativos.'} />
        </DashCard>
      </div>
    </motion.div>
  );
}
