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
  onOpenNewExpenseModal?: () => void;
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
  onOpenNewExpenseModal,
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

  // 8. Pagamentos pendentes e atrasados
  const overdueIncomes = filteredIncomes.filter(
    (i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0)
  );
  const pendingIncomes = filteredIncomes.filter((i) => i.status !== 'Recebido');

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

      const recVal = calculateTotalSmart(incs.map((i) => ({ amount: i.amount, currency: i.currency }))).raw;
      const expVal = calculateTotalSmart(exps.map((e) => ({ amount: e.amount, currency: e.currency }))).raw;

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
        onOpenNewExpenseModal={onOpenNewExpenseModal}
      />

      {/* 2. Indicadores Financeiros KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Indicadores Financeiros
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Filtro: <strong className="text-slate-900">{currencyFilter === 'ALL' ? 'Todas as Moedas' : currencyFilter}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Contas a Receber */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-pendentes')}
            className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contas a Receber</span>
              <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {totalToReceive.formatted}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{pendingIncomeItems.length} fatura(s) pendente(s)</span>
              <ChevronRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 2: Receita Recebida no mês */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-recebidas')}
            className="bg-white border border-slate-200 hover:border-teal-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Receita Recebida</span>
              <div className="p-2 rounded-xl bg-teal-100/70 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {totalReceivedThisMonth.formatted}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{monthlyReceivedItems.length} pagamento(s) liquidado(s)</span>
              <ChevronRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 3: Custos Operacionais */}
          <div
            onClick={() => onNavigateTab('financial', 'despesas')}
            className="bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Custos Operacionais</span>
              <div className="p-2 rounded-xl bg-slate-100/80 text-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {totalExpensesThisMonth.formatted}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>{monthlyExpenseItems.length} custo(s) lançado(s)</span>
              <ChevronRight className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 4: Resultado Líquido Mensal */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resultado Líquido Mensal</span>
              <div className={`p-2 rounded-xl ${profitRaw >= 0 ? 'bg-emerald-100/70 text-emerald-600' : 'bg-rose-100/70 text-rose-600'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold mt-3 tracking-tight ${profitRaw >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netProfitThisMonthFormatted}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2">
              {profitRaw >= 0 ? '✓ Margem operacional positiva' : '⚠ Atenção às margens'}
            </div>
          </div>

          {/* Card 5: Clientes & Contas */}
          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Clientes Ativos</span>
              <div className="p-2 rounded-xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {activeClientsCount}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Cadastrados no sistema</span>
              <ChevronRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 6: Projetos em Andamento */}
          <div
            onClick={() => onNavigateTab('projects', 'em_andamento')}
            className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Projetos Ativos</span>
              <div className="p-2 rounded-xl bg-indigo-100/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {inProgressProjects.length}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Em produção ativa</span>
              <ChevronRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 7: Entregas Concluídas */}
          <div
            onClick={() => onNavigateTab('projects', 'concluidos')}
            className="bg-white border border-slate-200 hover:border-purple-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entregas Concluídas</span>
              <div className="p-2 rounded-xl bg-purple-100/70 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {completedProjects.length}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Entregues com sucesso</span>
              <ChevronRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 8: Inadimplência */}
          <div
            onClick={() => onNavigateTab('financial', 'receitas-atrasadas')}
            className="bg-white border border-slate-200 hover:border-rose-400 hover:shadow-sm p-5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inadimplência</span>
              <div className="p-2 rounded-xl bg-rose-100/70 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-600 mt-3 tracking-tight">
              {overdueIncomes.length}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Cobrança(s) em atraso</span>
              <ChevronRight className="w-4 h-4 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

        </div>
      </div>

      {/* 3. Evolução Financeira Mensal */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Evolução Financeira Mensal
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Receitas vs. Custos vs. Resultado Líquido — últimos 6 meses em {mainCurrency}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Custos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Resultado
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} fontWeight={600} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="Despesas" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="Lucro" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Action Lists Grid: Cobranças Pendentes vs Próximas Entregas de Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* List A: Cobranças Pendentes & Atrasadas */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Cobranças & Faturas Pendentes</h3>
            </div>
            <button
              onClick={() => onNavigateTab('financial', 'receitas')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Ver todas →
            </button>
          </div>

          {pendingIncomes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-slate-700">Tudo em dia!</p>
              <p className="text-xs text-slate-400">Nenhuma cobrança pendente no momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingIncomes.slice(0, 4).map((inc) => {
                const client = clientMap.get(inc.clientId);
                const diff = getDaysDiff(inc.dueDate);
                const isOverdue = diff < 0;
                const isDueToday = diff === 0;

                const text = `Olá, ${client?.name}! Tudo bem? Passando para lembrar do pagamento referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}). Vencimento: ${formatDate(inc.dueDate)}. Abs!`;

                return (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {client?.name || 'Cliente'}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Atrasado {Math.abs(diff)}d
                          </span>
                        )}
                        {isDueToday && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Vence Hoje
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                        {inc.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-emerald-700">
                        {formatCurrency(inc.amount, inc.currency)}
                      </div>
                      {client?.whatsapp && (
                        <button
                          onClick={() => onOpenWhatsAppCharge(client.whatsapp, text)}
                          className="mt-1 text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 justify-end"
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

        {/* List B: Próximos Prazos de Projetos */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Próximos Prazos de Entrega</h3>
            </div>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Ver todos →
            </button>
          </div>

          {inProgressProjects.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
              <p className="font-semibold text-slate-700">Nenhum projeto ativo</p>
              <p className="text-xs text-slate-400">Crie um novo projeto para acompanhar os prazos.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {inProgressProjects.slice(0, 4).map((proj) => {
                const client = clientMap.get(proj.clientId);
                const diff = getDaysDiff(proj.dueDate);
                const progressPct = proj.totalAmount > 0 ? Math.round((proj.paidAmount / proj.totalAmount) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {proj.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        diff < 0 ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        diff <= 3 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {formatDate(proj.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-2.5">
                      <span>{client?.name || '-'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        {proj.category}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 text-right font-medium">{progressPct}% pago</div>
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
