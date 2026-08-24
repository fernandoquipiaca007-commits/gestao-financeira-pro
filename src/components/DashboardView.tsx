import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Clock,
  ChevronRight,
  CheckSquare,
  Globe,
  Hand,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  Client,
  Project,
  Income,
  Expense,
  CurrencyCode,
  AppSettings,
} from '../types';
import { Task } from '../types/rbac';
import {
  formatCurrency,
  getDaysDiff,
  formatDate,
  convertCurrency,
} from '../lib/formatters';
import { Quick10SecSummary } from './Quick10SecSummary';
import { useAuth } from '../contexts/AuthContext';

interface DashboardViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  tasks?: Task[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal?: () => void;
  onAssumeProject?: (projectId: string) => Promise<{ success: boolean; error?: string }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  tasks = [],
  settings,
  currencyFilter,
  onNavigateTab,
  onOpenWhatsAppCharge,
  onOpenNewProjectModal,
  onOpenNewIncomeModal,
  onOpenNewExpenseModal,
  onAssumeProject,
}) => {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const hasFinancialAccess = isOwner || hasPermission('dashboard.financial');

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));

  // Current year-month YYYY-MM
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter datasets by currency if selected
  const filteredIncomes = incomes.filter((i) =>
    currencyFilter === 'ALL' ? true : i.currency === currencyFilter
  );
  const filteredExpenses = expenses.filter((e) =>
    currencyFilter === 'ALL' ? true : e.currency === currencyFilter
  );
  const filteredProjects = projects.filter((p) =>
    currencyFilter === 'ALL' ? true : p.currency === currencyFilter
  );
  const filteredClients = clients.filter((c) =>
    currencyFilter === 'ALL' ? true : c.currency === currencyFilter
  );

  // Helper for smart sum calculations and formatting
  const calculateTotalSmart = (items: { amount: number; currency: CurrencyCode }[]) => {
    if (items.length === 0) {
      const cur = currencyFilter === 'ALL' ? settings.defaultCurrency : currencyFilter;
      return { formatted: formatCurrency(0, cur), raw: 0 };
    }
    if (currencyFilter !== 'ALL') {
      const sum = items.reduce((s, i) => s + i.amount, 0);
      return { formatted: formatCurrency(sum, currencyFilter), raw: sum };
    }

    const firstCurrency = items[0].currency;
    const allSameCurrency = items.every((i) => i.currency === firstCurrency);

    if (allSameCurrency) {
      const sum = items.reduce((s, i) => s + i.amount, 0);
      return { formatted: formatCurrency(sum, firstCurrency), raw: sum };
    }

    const sum = items.reduce((s, item) => {
      return s + convertCurrency(item.amount, item.currency, settings.defaultCurrency, settings.exchangeRates);
    }, 0);
    return { formatted: formatCurrency(sum, settings.defaultCurrency), raw: sum };
  };

  // 1. Total a receber (Pending incomes + Unbilled project balances)
  const pendingIncomeItems: { amount: number; currency: CurrencyCode }[] = [
    ...filteredIncomes.filter((i) => i.status !== 'Recebido').map((i) => ({ amount: i.amount, currency: i.currency })),
  ];

  filteredProjects.forEach((proj) => {
    const unbilled = proj.totalAmount - proj.paidAmount;
    if (unbilled > 0) {
      const hasIncome = filteredIncomes.some((i) => i.projectId === proj.id && i.status !== 'Recebido');
      if (!hasIncome) {
        pendingIncomeItems.push({ amount: unbilled, currency: proj.currency });
      }
    }
  });

  const totalToReceive = calculateTotalSmart(pendingIncomeItems);

  // 2. Total recebido no mês
  const monthlyReceivedItems = filteredIncomes
    .filter((i) => {
      if (i.status !== 'Recebido') return false;
      const recDate = i.receivedDate || i.dueDate;
      return recDate.startsWith(currentYM);
    })
    .map((i) => ({ amount: i.amount, currency: i.currency }));

  const totalReceivedThisMonth = calculateTotalSmart(monthlyReceivedItems);

  // 3. Total de despesas
  const monthlyExpenseItems = filteredExpenses
    .filter((e) => e.date.startsWith(currentYM))
    .map((e) => ({ amount: e.amount, currency: e.currency }));

  const totalExpensesThisMonth = calculateTotalSmart(monthlyExpenseItems);

  // 4. Lucro líquido
  const profitRaw = totalReceivedThisMonth.raw - totalExpensesThisMonth.raw;
  const dominantCurrency = currencyFilter !== 'ALL' ? currencyFilter : (monthlyReceivedItems[0]?.currency || settings.defaultCurrency);
  const netProfitThisMonthFormatted = formatCurrency(profitRaw, dominantCurrency);

  // 5. Clientes ativos
  const activeClientsCount = filteredClients.length;

  // 6. Projetos em andamento
  const inProgressProjects = filteredProjects.filter((p) => p.status === 'Em andamento');

  // 7. Projetos concluídos
  const completedProjects = filteredProjects.filter((p) => p.status === 'Concluído');

  // 8. Pagamentos pendentes e atrasados
  const overdueIncomes = filteredIncomes.filter(
    (i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0)
  );
  const pendingIncomes = filteredIncomes.filter((i) => i.status !== 'Recebido');

  // Employee-specific derived data
  const myProjects = filteredProjects.filter(p => p.assignedTo === userProfile?.id && p.status !== 'Concluído');
  const availableProjects = filteredProjects.filter(p => p.assignmentType === 'available');
  const myPendingTasks = tasks.filter(t => t.assignedTo === userProfile?.id && t.status !== 'Concluída');

  // Build Monthly Chart Data (Last 6 Months)
  const chartData = React.useMemo(() => {
    if (!hasFinancialAccess) return [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('pt-PT', { month: 'short' });

      // Sum incomes
      const incSum = incomes
        .filter((inc) => {
          if (inc.status !== 'Recebido') return false;
          const dt = inc.receivedDate || inc.dueDate;
          return dt.startsWith(ym);
        })
        .reduce((sum, inc) => {
          return sum + convertCurrency(inc.amount, inc.currency, settings.defaultCurrency, settings.exchangeRates);
        }, 0);

      // Sum expenses
      const expSum = expenses
        .filter((exp) => exp.date.startsWith(ym))
        .reduce((sum, exp) => {
          return sum + convertCurrency(exp.amount, exp.currency, settings.defaultCurrency, settings.exchangeRates);
        }, 0);

      months.push({
        month: monthLabel,
        receitas: Math.round(incSum),
        despesas: Math.round(expSum),
        lucro: Math.round(incSum - expSum),
      });
    }
    return months;
  }, [incomes, expenses, settings, now, hasFinancialAccess]);

  // If user does NOT have financial access, show the Operational Employee Dashboard
  if (!hasFinancialAccess) {
    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">
              Olá, {userProfile?.name || 'Membro da Equipa'} 👋
            </h1>
            <p className="text-sm text-[#747878] mt-1">
              Visão geral das tuas operações, entregas e tarefas
            </p>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTab('projects', 'MINE')}
            className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
              Meus Projetos
            </span>
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#0050d7]">
              {myProjects.length}
            </div>
            <span className="text-[11px] text-[#747878] mt-1 block">em andamento</span>
          </div>

          <div
            onClick={() => onNavigateTab('tasks', 'MINE')}
            className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
              Minhas Tarefas
            </span>
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#1c1b1b]">
              {myPendingTasks.length}
            </div>
            <span className="text-[11px] text-[#747878] mt-1 block">pendentes</span>
          </div>

          <div
            onClick={() => onNavigateTab('projects', 'AVAILABLE')}
            className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
              Projetos Disponíveis
            </span>
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#003da9]">
              {availableProjects.length}
            </div>
            <span className="text-[11px] text-[#003da9] mt-1 block font-medium">para assumir</span>
          </div>

          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
              Meus Clientes
            </span>
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#1a6b3a]">
              {activeClientsCount}
            </div>
            <span className="text-[11px] text-[#747878] mt-1 block">atribuídos</span>
          </div>
        </div>

        {/* Operational Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1c1b1b] text-base flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#0050d7]" />
                Meus Projetos Atribuídos
              </h3>
              <button
                onClick={() => onNavigateTab('projects', 'MINE')}
                className="text-xs text-[#0050d7] font-semibold hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            {myProjects.length === 0 ? (
              <div className="py-8 text-center text-[#747878]">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 text-[#c4c7c7]" />
                <p className="text-xs">Não tens projetos atribuídos no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myProjects.slice(0, 5).map(p => {
                  const client = clientMap.get(p.clientId);
                  const daysToDue = getDaysDiff(p.dueDate);
                  return (
                    <div
                      key={p.id}
                      onClick={() => onNavigateTab('projects')}
                      className="p-3 bg-[#f7f3f2] hover:bg-[#f1edec] rounded-[16px] border border-[#c4c7c7]/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-sm text-[#1c1b1b]">{p.name}</div>
                        <div className="text-xs text-[#747878] mt-0.5">
                          {client?.name} • Entrega: {formatDate(p.dueDate)}
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        daysToDue <= 2 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#dbe1ff] text-[#003da9]'
                      }`}>
                        {daysToDue >= 0 ? `em ${daysToDue}d` : `atrasado ${Math.abs(daysToDue)}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Projects */}
          <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1c1b1b] text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#003da9]" />
                Projetos Disponíveis para Assumir
              </h3>
              <button
                onClick={() => onNavigateTab('projects', 'AVAILABLE')}
                className="text-xs text-[#0050d7] font-semibold hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            {availableProjects.length === 0 ? (
              <div className="py-8 text-center text-[#747878]">
                <Globe className="w-8 h-8 mx-auto mb-2 text-[#c4c7c7]" />
                <p className="text-xs">Nenhum projeto disponível no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableProjects.slice(0, 5).map(p => {
                  const client = clientMap.get(p.clientId);
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-[#dbe1ff]/40 rounded-[16px] border border-[#003da9]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm text-[#1c1b1b]">{p.name}</div>
                        <div className="text-xs text-[#747878] mt-0.5">
                          {client?.name} • {p.category}
                        </div>
                      </div>
                      {onAssumeProject && (
                        <button
                          onClick={() => onAssumeProject(p.id)}
                          className="inline-flex items-center space-x-1 bg-[#0050d7] text-white px-3 py-1 rounded-full text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                        >
                          <Hand className="w-3 h-3" />
                          <span>Assumir</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Financial Dashboard for Owner / Admin with financial access
  return (
    <div className="space-y-8">
      {/* 10-Second Executive Summary */}
      <Quick10SecSummary
        clients={clients}
        projects={projects}
        incomes={incomes}
        expenses={expenses}
        settings={settings}
        currencyFilter={currencyFilter}
        onNavigateToTab={onNavigateTab}
        onOpenWhatsAppCharge={onOpenWhatsAppCharge}
        onOpenNewExpenseModal={onOpenNewExpenseModal}
      />

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total a Receber */}
        <div
          onClick={() => onNavigateTab('financial', 'pendentes')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Total a Receber
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#000000]">
            {totalToReceive.formatted}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">
            {pendingIncomeItems.length} faturas/saldos
          </span>
        </div>

        {/* Faturamento do Mês */}
        <div
          onClick={() => onNavigateTab('financial', 'recebidos')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Recebido no Mês
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#1a6b3a]">
            {totalReceivedThisMonth.formatted}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">
            {monthlyReceivedItems.length} entradas liquidadas
          </span>
        </div>

        {/* Custos Operacionais */}
        <div
          onClick={() => onNavigateTab('financial', 'despesas')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Custos do Mês
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#93000a]">
            {totalExpensesThisMonth.formatted}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">
            {monthlyExpenseItems.length} despesas
          </span>
        </div>

        {/* Lucro Líquido */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Lucro Líquido
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#0050d7]">
            {netProfitThisMonthFormatted}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">saldo real do mês</span>
        </div>

        {/* Clientes Ativos */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Clientes Ativos
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#000000]">
            {activeClientsCount}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">na carteira</span>
        </div>

        {/* Projetos em Andamento */}
        <div
          onClick={() => onNavigateTab('projects', 'Em andamento')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Projetos Ativos
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#003da9]">
            {inProgressProjects.length}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">em produção</span>
        </div>

        {/* Projetos Concluídos */}
        <div
          onClick={() => onNavigateTab('projects', 'Concluído')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Entregas Feitas
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#1a6b3a]">
            {completedProjects.length}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">projetos concluídos</span>
        </div>

        {/* Cobranças Atrasadas */}
        <div
          onClick={() => onNavigateTab('financial', 'atrasados')}
          className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#000000] transition-all cursor-pointer group"
        >
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Inadimplência
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#ba1a1a]">
            {overdueIncomes.length}
          </div>
          <span className="text-xs text-[#747878] mt-1 block">faturas vencidas</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">Evolução Financeira Semestral</h3>
            <p className="text-xs text-[#747878] mt-0.5">
              Receitas vs. Custos convertidos para a moeda base ({settings.defaultCurrency})
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e2e1" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#747878', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#747878', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#c4c7c7',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  color: '#1c1b1b',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              />
              <Bar dataKey="receitas" name="Receitas" fill="#000000" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#c4c7c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Collections & Urgent Deliveries Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Collections */}
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1c1b1b] text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#ba1a1a]" />
              Cobranças Pendentes & Atrasadas
            </h3>
            <button
              onClick={() => onNavigateTab('financial', 'pendentes')}
              className="text-xs text-[#0050d7] font-semibold hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {pendingIncomes.length === 0 ? (
            <div className="py-8 text-center text-[#747878]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#1a6b3a]" />
              <p className="text-xs">Todas as faturas estão liquidadas em dia!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncomes.slice(0, 5).map((inc) => {
                const client = clientMap.get(inc.clientId);
                const daysDiff = getDaysDiff(inc.dueDate);
                const isOverdue = daysDiff < 0;

                return (
                  <div
                    key={inc.id}
                    className="p-3 bg-[#f7f3f2] hover:bg-[#f1edec] rounded-[16px] border border-[#c4c7c7]/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#1c1b1b]">{inc.description}</div>
                      <div className="text-xs text-[#747878] mt-0.5">
                        {client?.name} • Vencimento: {formatDate(inc.dueDate)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-medium text-sm text-[#1c1b1b]">
                        {formatCurrency(inc.amount, inc.currency)}
                      </span>
                      {client?.whatsapp && (
                        <button
                          onClick={() => {
                            const msg = `Olá, ${client.name}! Lembramos que a fatura de ${formatCurrency(inc.amount, inc.currency)} referente a "${inc.description}" venceu/vence em ${formatDate(inc.dueDate)}. Obrigado!`;
                            onOpenWhatsAppCharge(client.whatsapp, msg);
                          }}
                          className="p-1.5 bg-[#d4eddf] text-[#1a6b3a] rounded-full hover:opacity-85 transition-colors cursor-pointer"
                          title="Cobrar via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1c1b1b] text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0050d7]" />
              Próximos Prazos de Entrega
            </h3>
            <button
              onClick={() => onNavigateTab('projects', 'Em andamento')}
              className="text-xs text-[#0050d7] font-semibold hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {inProgressProjects.length === 0 ? (
            <div className="py-8 text-center text-[#747878]">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 text-[#c4c7c7]" />
              <p className="text-xs">Nenhum projeto em andamento no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressProjects.slice(0, 5).map((p) => {
                const client = clientMap.get(p.clientId);
                const daysToDue = getDaysDiff(p.dueDate);
                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigateTab('projects')}
                    className="p-3 bg-[#f7f3f2] hover:bg-[#f1edec] rounded-[16px] border border-[#c4c7c7]/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#1c1b1b]">{p.name}</div>
                      <div className="text-xs text-[#747878] mt-0.5">
                        {client?.name} • Entrega: {formatDate(p.dueDate)}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        daysToDue <= 2 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#dbe1ff] text-[#003da9]'
                      }`}
                    >
                      {daysToDue >= 0 ? `em ${daysToDue}d` : `atrasado ${Math.abs(daysToDue)}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
