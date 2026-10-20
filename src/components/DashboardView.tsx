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
  FileText,
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
import { FinanceDashboard } from './dashboard/FinanceDashboard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  tasks?: Task[];
  billingRequests?: import('../types/rbac').BillingRequest[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal?: () => void;
  onAssumeProject?: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateTaskStatus?: (taskId: string, status: import('../types/rbac').TaskStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  tasks = [],
  billingRequests = [],
  settings,
  currencyFilter,
  onNavigateTab,
  onOpenWhatsAppCharge,
  onOpenNewProjectModal,
  onOpenNewIncomeModal,
  onOpenNewExpenseModal,
  onAssumeProject,
  onUpdateTaskStatus,
}) => {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const { lang, t } = useLanguage();
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
      const monthLabel = d.toLocaleString(lang === 'en' ? 'en-US' : 'pt-PT', { month: 'short' });

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
  }, [incomes, expenses, settings, now, hasFinancialAccess, lang]);

  // If user does NOT have financial access, show the Operational Employee Dashboard
  if (!hasFinancialAccess) {
    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[30px] sm:text-[38px] font-normal text-fg tracking-[-0.03em] leading-tight">
              {lang === 'en' ? `Hello, ${userProfile?.name || 'Team Member'}` : `Olá, ${userProfile?.name || 'Membro da Equipa'}`}
            </h1>
            <p className="text-sm text-fg-muted mt-1">
              {lang === 'en' ? 'Overview of your operations, deliverables, and tasks' : 'Visão geral das tuas operações, entregas e tarefas'}
            </p>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTab('projects', 'MINE')}
            className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass aura-glass--interactive cursor-pointer"
          >
            <span className="text-[13px] font-medium text-fg-secondary block mb-2">
              {lang === 'en' ? 'My Projects' : 'Meus Projetos'}
            </span>
            <div className="font-display text-[28px] sm:text-[32px] font-normal tracking-[-0.03em] leading-none mt-1 text-accent-soft-fg ">
              {myProjects.length}
            </div>
            <span className="text-[13px] font-normal text-fg-muted mt-1.5 block">
              {lang === 'en' ? 'in progress' : 'em andamento'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('tasks', 'MINE')}
            className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass aura-glass--interactive cursor-pointer"
          >
            <span className="text-[13px] font-medium text-fg-secondary block mb-2">
              {lang === 'en' ? 'My tasks' : 'Minhas tarefas'}
            </span>
            <div className="font-display text-[28px] sm:text-[32px] font-normal tracking-[-0.03em] leading-none mt-1 text-fg ">
              {myPendingTasks.length}
            </div>
            <span className="text-[13px] font-normal text-fg-muted mt-1.5 block">
              {lang === 'en' ? 'pending' : 'pendentes'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('projects', 'AVAILABLE')}
            className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass aura-glass--interactive cursor-pointer"
          >
            <span className="text-[13px] font-medium text-fg-secondary block mb-2">
              {lang === 'en' ? 'Available Projects' : 'Projetos Disponíveis'}
            </span>
            <div className="font-display text-[28px] sm:text-[32px] font-normal tracking-[-0.03em] leading-none mt-1 text-accent-soft-fg ">
              {availableProjects.length}
            </div>
            <span className="text-[13px] font-normal text-accent-soft-fg mt-1.5 block font-medium">
              {lang === 'en' ? 'to claim' : 'para assumir'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass aura-glass--interactive cursor-pointer"
          >
            <span className="text-[13px] font-medium text-fg-secondary block mb-2">
              {lang === 'en' ? 'My Clients' : 'Meus Clientes'}
            </span>
            <div className="font-display text-[28px] sm:text-[32px] font-normal tracking-[-0.03em] leading-none mt-1 text-success-fg ">
              {activeClientsCount}
            </div>
            <span className="text-[13px] font-normal text-fg-muted mt-1.5 block">
              {lang === 'en' ? 'assigned' : 'atribuídos'}
            </span>
          </div>
        </div>

        {/* Operational Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <div className="bg-glass border border-line-subtle rounded-xl p-6 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-fg text-base flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-accent-soft-fg " />
                {lang === 'en' ? 'My Assigned Projects' : 'Meus Projetos Atribuídos'}
              </h3>
              <button
                onClick={() => onNavigateTab('projects', 'MINE')}
                className="text-xs text-accent-soft-fg font-semibold hover:underline cursor-pointer"
              >
                {lang === 'en' ? 'View all' : 'Ver todos'}
              </button>
            </div>

            {myProjects.length === 0 ? (
              <div className="py-8 text-center text-fg-muted ">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 text-fg-disabled " />
                <p className="text-xs">{lang === 'en' ? 'You have no assigned projects at the moment' : 'Não tens projetos atribuídos no momento'}</p>
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
                      className="p-3 bg-surface-2 hover:bg-sunken rounded-lg border border-line-subtle transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-sm text-fg ">{p.name}</div>
                        <div className="text-xs text-fg-muted mt-0.5">
                          {client?.name} • {lang === 'en' ? 'Delivery: ' : 'Entrega: '}{formatDate(p.dueDate)}
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
 daysToDue <= 2 ? 'bg-danger-soft text-danger-fg ' : 'bg-accent-soft text-accent-soft-fg '
 }`}>
                        {daysToDue >= 0 ? (lang === 'en' ? `in ${daysToDue}d` : `em ${daysToDue}d`) : (lang === 'en' ? `overdue ${Math.abs(daysToDue)}d` : `atrasado ${Math.abs(daysToDue)}d`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Projects */}
          <div className="bg-glass border border-line-subtle rounded-xl p-6 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-fg text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent-soft-fg " />
                {lang === 'en' ? 'Projects Available to Claim' : 'Projetos Disponíveis para Assumir'}
              </h3>
              <button
                onClick={() => onNavigateTab('projects', 'AVAILABLE')}
                className="text-xs text-accent-soft-fg font-semibold hover:underline cursor-pointer"
              >
                {lang === 'en' ? 'View all' : 'Ver todos'}
              </button>
            </div>

            {availableProjects.length === 0 ? (
              <div className="py-8 text-center text-fg-muted ">
                <Globe className="w-8 h-8 mx-auto mb-2 text-fg-disabled " />
                <p className="text-xs">{lang === 'en' ? 'No projects available at the moment' : 'Nenhum projeto disponível no momento'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableProjects.slice(0, 5).map(p => {
                  const client = clientMap.get(p.clientId);
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-accent-soft/40 rounded-lg border border-accent/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm text-fg ">{p.name}</div>
                        <div className="text-xs text-fg-muted mt-0.5">
                          {client?.name} • {p.category}
                        </div>
                      </div>
                      {onAssumeProject && (
                        <button
                          onClick={() => onAssumeProject(p.id)}
                          className="inline-flex items-center space-x-1 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                        >
                          <Hand className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Claim' : 'Assumir'}</span>
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

  // Pending billing requests
  const pendingBillingRequests = billingRequests.filter(
    (r) => r.status === 'Solicitada' || r.status === 'Em análise'
  );

  // Full Financial Dashboard for Owner / Admin with financial access
  return (
    <FinanceDashboard
      userName={userProfile?.name || ''}
      lang={lang === 'en' ? 'en' : 'pt'}
      clients={clients}
      projects={projects}
      incomes={incomes}
      expenses={expenses}
      tasks={tasks}
      billingRequests={billingRequests}
      settings={settings}
      currencyFilter={currencyFilter}
      onNavigateTab={onNavigateTab}
      onOpenWhatsAppCharge={onOpenWhatsAppCharge}
      onOpenNewIncomeModal={onOpenNewIncomeModal}
      onOpenNewExpenseModal={onOpenNewExpenseModal}
      onUpdateTaskStatus={onUpdateTaskStatus}
    />
  );
};
