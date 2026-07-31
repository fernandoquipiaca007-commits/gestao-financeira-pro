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
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Client,
  Project,
  Income,
  Expense,
  CurrencyCode,
  AppSettings,
} from '../types';
import {
  formatCurrency,
  getDaysDiff,
  formatDate,
  convertCurrency,
} from '../lib/formatters';
import { Quick10SecSummary } from './Quick10SecSummary';

interface DashboardViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenNewIncomeModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  settings,
  currencyFilter,
  onNavigateTab,
  onOpenWhatsAppCharge,
  onOpenNewProjectModal,
  onOpenNewIncomeModal,
}) => {
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

  const mainCurrency = currencyFilter === 'ALL' ? settings.defaultCurrency : currencyFilter;

  // Helper for sum calculations
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

  // 8. Pagamentos atrasados
  const overdueIncomes = filteredIncomes.filter(
    (i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0)
  );

  // Build Monthly Chart Data (Last 6 Months)
  const chartData = React.useMemo(() => {
    const monthsData: { monthKey: string; monthLabel: string; Receitas: number; Despesas: number; Lucro: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const ym = `${year}-${monthNum}`;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthLabel = `${monthNames[d.getMonth()]}/${String(year).substring(2)}`;

      const incs = filteredIncomes.filter((i) => {
        if (i.status !== 'Recebido') return false;
        const rDate = i.receivedDate || i.dueDate;
        return rDate.startsWith(ym);
      });

      const exps = filteredExpenses.filter((e) => e.date.startsWith(ym));

      const recVal = calculateTotal(incs);
      const expVal = calculateTotal(exps);

      monthsData.push({
        monthKey: ym,
        monthLabel,
        Receitas: Math.round(recVal),
        Despesas: Math.round(expVal),
        Lucro: Math.round(recVal - expVal),
      });
    }

    return monthsData;
  }, [filteredIncomes, filteredExpenses, currencyFilter, settings]);

  return (
    <div className="space-y-8 pb-12">

      {/* 1. Quick 10-Second Answers Banner */}
      <Quick10SecSummary
        clients={clients}
        projects={projects}
        incomes={incomes}
        expenses={expenses}
        settings={settings}
        currencyFilter={currencyFilter}
        onNavigateToTab={onNavigateTab}
        onOpenWhatsAppCharge={onOpenWhatsAppCharge}
      />

      {/* 2. Resumo Geral KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Resumo Geral dos Indicadores
          </h3>
          <span className="text-xs text-slate-400">
            Filtro ativo: <strong className="text-white">{currencyFilter === 'ALL' ? 'Todas as Moedas' : currencyFilter}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total a receber */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-pendentes')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total a receber</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {totalToReceive.formatted}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>{pendingIncomeItems.length} faturas a faturar</span>
              <ChevronRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 2: Total recebido no mês */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-recebidas')}
            className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recebido no Mês</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {totalReceivedThisMonth.formatted}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>{monthlyReceivedItems.length} pagamentos liquidados</span>
              <ChevronRight className="w-4 h-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 3: Total de despesas */}
          <div
            onClick={() => onNavigateTab('financial', 'despesas')}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Despesas no Mês</span>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-slate-700 transition-colors">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {totalExpensesThisMonth.formatted}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>{monthlyExpenseItems.length} custos cadastrados</span>
              <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 4: Lucro líquido */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lucro Líquido (Mês)</span>
              <div className={`p-2 rounded-xl ${profitRaw >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold mt-3 tracking-tight ${profitRaw >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfitThisMonthFormatted}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {netProfitThisMonth >= 0 ? 'Resultado operacional positivo' : 'Atenção às margens'}
            </div>
          </div>

          {/* Card 5: Clientes ativos */}
          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes Ativos</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {activeClientsCount}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Cadastrados no sistema</span>
              <ChevronRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 6: Projetos em andamento */}
          <div
            onClick={() => onNavigateTab('projects', 'em_andamento')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projetos em Andamento</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {inProgressProjects.length}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Em produção ativa</span>
              <ChevronRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 7: Projetos concluídos */}
          <div
            onClick={() => onNavigateTab('projects', 'concluidos')}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projetos Concluídos</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
              {completedProjects.length}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Entregues com sucesso</span>
              <ChevronRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 8: Pagamentos atrasados */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-atrasadas')}
            className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pagamentos Atrasados</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-400 mt-3 tracking-tight">
              {overdueIncomes.length}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Aguardando cobrança</span>
              <ChevronRight className="w-4 h-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

        </div>
      </div>

      {/* 3. Monthly Comparative Chart (Receitas x Despesas x Lucro) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Evolução Financeira Mensal (Últimos 6 Meses)
            </h3>
            <p className="text-xs text-slate-400">
              Comparativo visual entre Receitas x Despesas x Lucro em {mainCurrency}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" /> Despesas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" /> Lucro
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="Despesas" fill="#64748b" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="Lucro" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Action Lists Grid: Cobranças Pendentes vs Próximas Entregas de Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* List A: Cobranças Pendentes & Atrasadas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Cobranças & Faturas Pendentes</h3>
            </div>
            <button
              onClick={() => onNavigateTab('financial', 'receitas')}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Ver todas
            </button>
          </div>

          {pendingIncomes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              Nenhuma cobrança pendente! Tudo em dia.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncomes.slice(0, 4).map((inc) => {
                const client = clientMap.get(inc.clientId);
                const diff = getDaysDiff(inc.dueDate);
                const isOverdue = diff < 0;
                const isDueToday = diff === 0;

                const text = `Olá, ${client?.name}! Tudo bem? Passando para lembrar do pagamento referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}). Vencimento: ${formatDate(inc.dueDate)}. Abs!`;

                return (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 text-sm truncate">
                          {client?.name || 'Cliente'}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Atrasado {Math.abs(diff)}d
                          </span>
                        )}
                        {isDueToday && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Vence Hoje
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {inc.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-400">
                        {formatCurrency(inc.amount, inc.currency)}
                      </div>
                      {client?.whatsapp && (
                        <button
                          onClick={() => onOpenWhatsAppCharge(client.whatsapp, text)}
                          className="mt-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 justify-end"
                        >
                          <MessageCircle className="w-3 h-3" /> Cobrar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* List B: Próximas Entregas de Projetos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Próximos Prazos de Projetos</h3>
            </div>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Ver todos
            </button>
          </div>

          {inProgressProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum projeto em andamento.
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressProjects.slice(0, 4).map((proj) => {
                const client = clientMap.get(proj.clientId);
                const diff = getDaysDiff(proj.dueDate);
                const progressPct = proj.totalAmount > 0 ? Math.round((proj.paidAmount / proj.totalAmount) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 text-sm truncate">
                        {proj.name}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(proj.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>Cliente: <strong className="text-slate-300">{client?.name || '-'}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
                        {proj.category}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
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
