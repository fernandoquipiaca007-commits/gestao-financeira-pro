import React, { useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CheckCircle2,
  FolderKanban,
  Zap,
  ArrowRight,
  Wallet,
  Handshake,
  PieChart as PieChartIcon,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Client, Project, Income, Expense, CurrencyCode, AppSettings } from '../types';
import { formatCurrency, getDaysDiff, convertCurrency } from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface Quick10SecSummaryProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateToTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenNewExpenseModal?: () => void;
}

export const Quick10SecSummary: React.FC<Quick10SecSummaryProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  settings,
  currencyFilter,
  onNavigateToTab,
  onOpenWhatsAppCharge,
  onOpenNewExpenseModal,
}) => {
  const { lang, isEn } = useLanguage();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter lists by currency if a specific currency is active
  const filteredIncomes = incomes.filter((i) =>
    currencyFilter === 'ALL' ? true : i.currency === currencyFilter
  );
  const filteredExpenses = expenses.filter((e) =>
    currencyFilter === 'ALL' ? true : e.currency === currencyFilter
  );
  const filteredProjects = projects.filter((p) =>
    currencyFilter === 'ALL' ? true : p.currency === currencyFilter
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

  // 1. Contas a Receber (Pending incomes + Unbilled project balances)
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

  // 2. Inadimplência (Clients with pending / overdue incomes)
  const unpaidIncomes = filteredIncomes.filter((i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0));
  const unpaidClientsSet = new Set(unpaidIncomes.map((i) => i.clientId));
  const unpaidClientsCount = unpaidClientsSet.size;

  // 3. Cobranças do Dia (Due today or overdue)
  const incomesToChargeToday = filteredIncomes.filter(
    (i) => i.status !== 'Recebido' && getDaysDiff(i.dueDate) <= 0
  );

  // 4. Receita Recebida no mês
  const monthlyReceivedItems = filteredIncomes
    .filter((i) => {
      if (i.status !== 'Recebido') return false;
      const recDate = i.receivedDate || i.dueDate;
      return recDate.startsWith(currentYM);
    })
    .map((i) => ({ amount: i.amount, currency: i.currency }));

  const totalBilledThisMonth = calculateTotalSmart(monthlyReceivedItems);

  // 5. Custos Operacionais no mês
  const monthlyExpenseItems = filteredExpenses
    .filter((e) => e.date.startsWith(currentYM))
    .map((e) => ({ amount: e.amount, currency: e.currency }));

  const totalSpentThisMonth = calculateTotalSmart(monthlyExpenseItems);

  // 6. Resultado Líquido Mensal (Profit = Received - Spent)
  const profitRaw = totalBilledThisMonth.raw - totalSpentThisMonth.raw;
  const dominantCurrency = currencyFilter !== 'ALL' ? currencyFilter : (monthlyReceivedItems[0]?.currency || settings.defaultCurrency);
  const netProfitThisMonthFormatted = formatCurrency(profitRaw, dominantCurrency);

  // 7. Projetos Ativos
  const activeProjects = filteredProjects.filter(
    (p) => p.status === 'Em andamento' || p.status === 'Aguardando cliente'
  );

  // 8. Receita Contratada em Projetos (Pipeline Geral)
  const projectTotalItems = filteredProjects.map((p) => ({ amount: p.totalAmount, currency: p.currency }));
  const totalPipelineContracted = calculateTotalSmart(projectTotalItems);

  // 9. Disponibilidade em Caixa (Liquidez Atual = Total Recebido Histórico - Despesas Pagas - Comissões Pagas)
  const allReceivedItems = filteredIncomes
    .filter((i) => i.status === 'Recebido')
    .map((i) => ({ amount: i.amount, currency: i.currency }));
  const allPaidExpensesItems = filteredExpenses
    .filter((e) => e.paid)
    .map((e) => ({ amount: e.amount, currency: e.currency }));
  
  const allPaidCommissionsItems = filteredProjects
    .filter((p) => p.commissionPaid && (p.commissionAmount || 0) > 0)
    .map((p) => ({ amount: p.commissionAmount || 0, currency: p.currency }));

  const totalReceivedAllTime = calculateTotalSmart(allReceivedItems).raw;
  const totalPaidExpensesAllTime = calculateTotalSmart(allPaidExpensesItems).raw;
  const totalPaidCommissionsAllTime = calculateTotalSmart(allPaidCommissionsItems).raw;
  const realCashBalanceRaw = totalReceivedAllTime - totalPaidExpensesAllTime - totalPaidCommissionsAllTime;
  const isNegativeBalance = realCashBalanceRaw < 0;
  // Always format the real value so user sees explicit negative or positive value
  const realCashBalanceFormatted = formatCurrency(realCashBalanceRaw, dominantCurrency);

  // 10. Repasses a Parceiros (Comissões Pendentes)
  const pendingCommissionsItems = filteredProjects
    .filter((p) => !p.commissionPaid && (p.commissionAmount || 0) > 0)
    .map((p) => ({ amount: p.commissionAmount || 0, currency: p.currency }));
  const totalPendingCommissions = calculateTotalSmart(pendingCommissionsItems);

  // 11. Projetos com Pendências
  const projectsNeedingAttention = filteredProjects.filter((p) => {
    if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
    const days = getDaysDiff(p.dueDate);
    return days <= 1 || p.status === 'Aguardando cliente';
  });

  // 6-month historical timeline data for Fluxo de Caixa AreaChart
  const monthlyFlowData = useMemo(() => {
    const months: { month: string; shortMonth: string; receitas: number; despesas: number; saldo: number }[] = [];
    const monthNames = lang === 'en'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const shortName = `${monthNames[d.getMonth()]}`;

      // Sum received in this month
      const mIncomes = filteredIncomes.filter(inc => {
        if (inc.status !== 'Recebido') return false;
        const dt = inc.receivedDate || inc.dueDate;
        return dt.startsWith(ym);
      });
      const recTotal = calculateTotalSmart(mIncomes.map(x => ({ amount: x.amount, currency: x.currency }))).raw;

      // Sum paid expenses in this month
      const mExpenses = filteredExpenses.filter(exp => {
        return exp.paid && exp.date.startsWith(ym);
      });
      const expTotal = calculateTotalSmart(mExpenses.map(x => ({ amount: x.amount, currency: x.currency }))).raw;

      months.push({
        month: ym,
        shortMonth: shortName,
        receitas: Math.round(recTotal),
        despesas: Math.round(expTotal),
        saldo: Math.round(recTotal - expTotal),
      });
    }
    return months;
  }, [filteredIncomes, filteredExpenses, currencyFilter, settings, lang]);

  // Composition data for Portfolio Donut
  const totalReceivedVal = Math.max(0, totalReceivedAllTime);
  const totalPendingIncomesVal = Math.max(0, totalToReceive.raw);
  const totalPaidExpensesVal = Math.max(0, totalPaidExpensesAllTime);
  const totalPendingCommissionsVal = Math.max(0, totalPendingCommissions.raw);

  const portfolioCompositionData = [
    { name: isEn ? 'Received' : 'Recebido', value: totalReceivedVal, color: '#10B981' },
    { name: isEn ? 'To Receive' : 'A Receber', value: totalPendingIncomesVal, color: '#0050d7' },
    { name: isEn ? 'Paid Expenses' : 'Despesas Pagas', value: totalPaidExpensesVal, color: '#EF4444' },
    { name: isEn ? 'Commissions' : 'Comissões', value: totalPendingCommissionsVal, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const chartSlices = portfolioCompositionData.length > 0 
    ? portfolioCompositionData 
    : [{ name: isEn ? 'Awaiting Operations' : 'Aguardando Operações', value: 1, color: '#c4c7c7' }];

  return (
    <div className="bg-glass border border-line-subtle rounded-xl p-5 sm:p-6 mb-8 shadow-glass relative">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-line-subtle ">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 text-fg flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent-soft-fg " />
          </div>
          <div>
            <h2 className="text-base font-semibold text-fg tracking-tight flex items-center gap-2">
              {isEn ? 'Financial Overview' : 'Visão Geral Financeira'}
            </h2>
            <p className="text-xs text-fg-muted mt-0.5">
              {isEn ? 'Real-time vital indicators for operational and strategic control' : 'Indicadores vitais em tempo real para controle operacional e estratégico'}
            </p>
          </div>
        </div>

        {currencyFilter === 'ALL' && (
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-surface-2 border border-line-subtle text-fg-secondary self-start sm:self-auto inline-flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accent-soft-fg" strokeWidth={2} />
            <span>{isEn ? 'Base Currency:' : 'Moeda Base:'} <strong className="text-fg ">{settings.defaultCurrency}</strong></span>
          </span>
        )}
      </div>

      {/* ============================================================ */}
      {/* TOP: 2 HERO FINANCIAL CHARTS (MATCHING PHOTO 1 & PHOTO 3)    */}
      {/* ============================================================ */}
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Gráfico 1: Posição Geral da Carteira & Fluxo de Caixa (col-span-7) */}
          <div className="lg:col-span-7 bg-surface-2 border border-line-subtle rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line-subtle ">
                <div>
                  <span className="text-[13px] font-medium text-fg-secondary block mb-1">
                    {isEn ? 'General Portfolio Position' : 'Posição Geral da Carteira'}
                  </span>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className={`text-3xl sm:text-4xl font-semibold tracking-tight ${
 isNegativeBalance ? 'text-danger-fg ' : 'text-fg '
 }`}>
                      {realCashBalanceFormatted}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
 isNegativeBalance 
 ? 'bg-danger-soft text-danger-fg border border-danger/20'
 : 'bg-success-soft text-success-fg border border-success/20'
 }`}>
                      {isNegativeBalance ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                      <span>{isNegativeBalance ? (isEn ? 'Negative Balance (Deficit)' : 'Saldo Negativo (Déficit)') : (isEn ? 'Surplus / Positive Margin' : 'Superávit / Margem Positiva')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-fg-muted bg-glass-strong px-3 py-1.5 rounded-full font-medium border border-line-subtle ">
                    {isEn ? '6-Month Cash Flow' : 'Fluxo 6 Meses'}
                  </span>
                </div>
              </div>

              {/* Sub-indicators 3 Cards */}
              <div className="grid grid-cols-3 gap-2.5 py-3">
                <div className="p-3 rounded-md bg-glass-strong border border-line-subtle shadow-xs">
                  <span className="text-[13px] text-fg-secondary font-medium block">
                    {isEn ? 'Total Received' : 'Total Recebido'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-success-fg block mt-0.5">
                    {formatCurrency(totalReceivedAllTime, dominantCurrency)}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-glass-strong border border-line-subtle shadow-xs">
                  <span className="text-[13px] text-fg-secondary font-medium block">
                    {isEn ? 'Paid Expenses' : 'Custos Pagos'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-danger-fg block mt-0.5">
                    {formatCurrency(totalPaidExpensesAllTime, dominantCurrency)}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-glass-strong border border-line-subtle shadow-xs">
                  <span className="text-[13px] text-fg-secondary font-medium block">
                    {isEn ? 'To Receive' : 'A Receber'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-accent-soft-fg block mt-0.5">
                    {totalToReceive.formatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Smooth AreaChart showing cash flow */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--viz-2)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="var(--viz-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--viz-1)" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="var(--viz-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="shortMonth" stroke="var(--chart-grid)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-grid)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val >= 1000 ? `${Math.round(val/1000)}k` : val}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-glass-strong p-3 rounded-md border border-line-subtle shadow-lg text-xs space-y-1">
                            <div className="font-semibold text-fg mb-1">{label}</div>
                            <div className="text-success-fg font-medium">{isEn ? 'Inflow' : 'Entradas'}: {formatCurrency(payload[0]?.value as number, dominantCurrency)}</div>
                            <div className="text-danger-fg font-medium">{isEn ? 'Outflow' : 'Saídas'}: {formatCurrency(payload[1]?.value as number, dominantCurrency)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="var(--viz-2)" strokeWidth={2} fillOpacity={1} fill="url(#gradientReceitas)" name={isEn ? "Income" : "Receitas"} />
                  <Area type="monotone" dataKey="despesas" stroke="var(--viz-1)" strokeWidth={2} fillOpacity={1} fill="url(#gradientDespesas)" name={isEn ? "Expenses" : "Despesas"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Composição & Saúde Financeira da Carteira (col-span-5) */}
          <div className="lg:col-span-5 bg-surface-2 border border-line-subtle rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line-subtle ">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-accent-soft-fg " />
                  <h3 className="font-semibold text-sm text-fg ">{isEn ? 'Portfolio Composition' : 'Composição da Carteira'}</h3>
                </div>
                <span className="text-[11px] font-medium text-fg-muted ">{isEn ? 'Financial Volume' : 'Volume Financeiro'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-3">
                {/* Doughnut Chart */}
                <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartSlices}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartSlices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const itemName = data?.name || (data as any)?.payload?.name || (isEn ? 'Item' : 'Item');
                            const itemVal = Number(data?.value ?? (data as any)?.payload?.value ?? 0);
                            return (
                              <div className="bg-glass-strong p-2 rounded-md border border-line-subtle shadow-md text-xs">
                                <span className="font-semibold text-fg ">{itemName}: </span>
                                <span className="font-medium text-accent-soft-fg">{formatCurrency(itemVal, dominantCurrency)}</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center metric in Doughnut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[13px] text-fg-secondary font-medium ">{isEn ? 'Volume' : 'Volume'}</span>
                    <span className="text-xs font-bold text-fg ">
                      {formatCurrency(totalReceivedVal + totalPendingIncomesVal, dominantCurrency).split(',')[0]}
                    </span>
                  </div>
                </div>

                {/* Legend with explicit amounts */}
                <div className="sm:col-span-6 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-fg-secondary ">{isEn ? 'Received' : 'Recebido'}</span>
                    </div>
                    <span className="font-semibold text-fg ">
                      {formatCurrency(totalReceivedVal, dominantCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <span className="text-fg-secondary ">{isEn ? 'To Receive' : 'A Receber'}</span>
                    </div>
                    <span className="font-semibold text-fg ">
                      {totalToReceive.formatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <span className="text-fg-secondary ">{isEn ? 'Expenses' : 'Despesas'}</span>
                    </div>
                    <span className="font-semibold text-fg ">
                      {formatCurrency(totalPaidExpensesVal, dominantCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-fg-secondary ">{isEn ? 'Commissions' : 'Comissões'}</span>
                    </div>
                    <span className="font-semibold text-fg ">
                      {totalPendingCommissions.formatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-line-subtle flex items-center justify-between text-xs">
              <span className="text-fg-muted ">{isEn ? 'Total Contracted Pipeline' : 'Pipeline Total Contratado'}</span>
              <span className="font-semibold text-accent-soft-fg ">
                {totalPipelineContracted.formatted}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM: 11 EXECUTIVE INDICATORS / KPI CARDS                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Contas a Receber */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Accounts Receivable' : 'Contas a Receber'}</span>
            <div className="w-7 h-7 rounded-full bg-info-soft text-info-fg flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalToReceive.formatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{pendingIncomeItems.length} {isEn ? 'invoice(s)' : 'fatura(s)'}</span>
            <button
              onClick={() => onNavigateToTab('projects', 'a-receber')}
              className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 2: Em Atraso */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Overdue' : 'Em Atraso'}</span>
            <div className="w-7 h-7 rounded-full bg-danger-soft text-danger-fg flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-danger-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {unpaidClientsCount} {isEn ? 'client(s)' : 'cliente(s)'}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{unpaidIncomes.length} {isEn ? 'overdue charge(s)' : 'cobrança(s) vencida(s)'}</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-atrasadas')}
              className="text-danger-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'Charge' : 'Cobrar'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: Cobranças do Dia */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Daily Collections' : 'Cobranças do Dia'}</span>
            <div className="w-7 h-7 rounded-full bg-warning-soft text-warning-fg flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-warning-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {incomesToChargeToday.length} {isEn ? 'invoice(s)' : 'conta(s)'}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Due today or overdue' : 'Vencimento hoje ou atrasado'}</span>
            <button
              onClick={() => onNavigateToTab('financial', 'cobrar-hoje')}
              className="text-warning-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'Execute' : 'Executar'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 4: Receita Recebida */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Received Revenue' : 'Receita Recebida'}</span>
            <div className="w-7 h-7 rounded-full bg-success-soft text-success-fg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-success-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalBilledThisMonth.formatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? `Current month (${monthlyReceivedItems.length} entries)` : `Mês atual (${monthlyReceivedItems.length} entradas)`}</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-recebidas')}
              className="text-success-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 5: Custos Operacionais */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Operating Costs' : 'Custos Operacionais'}</span>
            <div className="w-7 h-7 rounded-full bg-surface-2 text-fg-secondary flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalSpentThisMonth.formatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? `Current month (${monthlyExpenseItems.length} expenses)` : `Mês atual (${monthlyExpenseItems.length} despesas)`}</span>
            <button
              onClick={() => onNavigateToTab('financial', 'despesas')}
              className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 6: Resultado Líquido Mensal */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Net Profit' : 'Resultado Líquido'}</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${profitRaw >= 0 ? 'bg-success-soft text-success-fg ' : 'bg-danger-soft text-danger-fg '}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-[-0.04em] ${profitRaw >= 0 ? 'text-success-fg ' : 'text-danger-fg '}`} style={{ letterSpacing: '-0.055em' }}>
            {netProfitThisMonthFormatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{profitRaw >= 0 ? (isEn ? 'Positive margin' : 'Margem positiva') : (isEn ? 'Attention to margins' : 'Atenção às margens')}</span>
          </div>
        </div>

        {/* KPI 7: Projetos Ativos */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Active Projects' : 'Projetos Ativos'}</span>
            <div className="w-7 h-7 rounded-full bg-info-soft text-info-fg flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {activeProjects.length} {isEn ? 'project(s)' : 'projeto(s)'}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Active operations' : 'Operação ativa'}</span>
            <button
              onClick={() => onNavigateToTab('projects', 'ativos')}
              className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 8: Projetos com Pendências */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Deadlines & Alerts' : 'Prazos & Alertas'}</span>
            <div className="w-7 h-7 rounded-full bg-warning-soft text-warning-fg flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-warning-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {projectsNeedingAttention.length} {isEn ? 'alert(s)' : 'alerta(s)'}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Deadlines / Waiting' : 'Prazos / Aguardando'}</span>
            <button
              onClick={() => onNavigateToTab('projects', 'atencao')}
              className="text-warning-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 9: Disponibilidade em Caixa */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Cash Balance' : 'Saldo em Caixa'}</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
 isNegativeBalance ? 'bg-danger-soft text-danger-fg ' : 'bg-success-soft text-success-fg '
 }`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-[-0.04em] ${isNegativeBalance ? 'text-danger-fg ' : 'text-success-fg '}`} style={{ letterSpacing: '-0.055em' }}>
            {realCashBalanceFormatted}
          </div>
          {isNegativeBalance && (
            <p className="text-[11px] text-danger-fg font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {isEn ? 'Negative balance — check income and expenses' : 'Saldo negativo — verifique receitas e despesas'}
            </p>
          )}
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Available today' : 'Disponível hoje'}</span>
            {onOpenNewExpenseModal && (
              <button
                onClick={onOpenNewExpenseModal}
                className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                {isEn ? '+ Expense' : '+ Saída'}
              </button>
            )}
          </div>
        </div>

        {/* KPI 10: Receita Contratada */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Project Pipeline' : 'Pipeline Projetos'}</span>
            <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalPipelineContracted.formatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Total projects sum' : 'Soma total projetos'}</span>
            <button
              onClick={() => onNavigateToTab('projects', 'ALL')}
              className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'View' : 'Ver'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 11: Repasses a Parceiros */}
        <div className="bg-surface-2 hover:bg-surface-1 p-4 rounded-lg border border-line-subtle hover:border-line-strong hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-fg-secondary ">{isEn ? 'Commissions to Pay' : 'Comissões a Pagar'}</span>
            <div className="w-7 h-7 rounded-full bg-surface-2 text-fg-secondary flex items-center justify-center">
              <Handshake className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fg tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalPendingCommissions.formatted}
          </div>
          <div className="text-xs text-fg-muted mt-2 flex items-center justify-between border-t border-line-subtle pt-2">
            <span>{isEn ? 'Pending payouts' : 'Repasses pendentes'}</span>
            <button
              onClick={() => onNavigateToTab('partners', 'pendentes')}
              className="text-accent-soft-fg hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isEn ? 'Partners' : 'Parceiros'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
