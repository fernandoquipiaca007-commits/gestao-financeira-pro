import React from 'react';
import {
  Clock,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Receipt,
  CheckCircle2,
  FolderKanban,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Client, Project, Income, Expense, CurrencyCode, AppSettings } from '../types';
import { formatCurrency, getDaysDiff, convertCurrency } from '../lib/formatters';

interface Quick10SecSummaryProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onNavigateToTab: (tab: string, filter?: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
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
}) => {
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

  // 1. Quanto tenho para receber (Pending incomes + Unbilled project balances)
  const pendingIncomeItems: { amount: number; currency: CurrencyCode }[] = [
    ...filteredIncomes.filter((i) => i.status !== 'Recebido').map((i) => ({ amount: i.amount, currency: i.currency })),
  ];

  // Include project unpaid balances if no pending income entry exists for that project
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

  // 2. Quem ainda não pagou (Clients with pending / overdue incomes)
  const unpaidIncomes = filteredIncomes.filter((i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0));
  const unpaidClientsSet = new Set(unpaidIncomes.map((i) => i.clientId));
  const unpaidClientsCount = unpaidClientsSet.size;

  // 3. Quem preciso cobrar hoje (Due today or overdue)
  const incomesToChargeToday = filteredIncomes.filter(
    (i) => i.status !== 'Recebido' && getDaysDiff(i.dueDate) <= 0
  );

  // 4. Quanto já faturei este mês (Received incomes in current month)
  const monthlyReceivedItems = filteredIncomes
    .filter((i) => {
      if (i.status !== 'Recebido') return false;
      const recDate = i.receivedDate || i.dueDate;
      return recDate.startsWith(currentYM);
    })
    .map((i) => ({ amount: i.amount, currency: i.currency }));

  const totalBilledThisMonth = calculateTotalSmart(monthlyReceivedItems);

  // 5. Quanto gastei (Paid expenses in current month)
  const monthlyExpenseItems = filteredExpenses
    .filter((e) => e.date.startsWith(currentYM))
    .map((e) => ({ amount: e.amount, currency: e.currency }));

  const totalSpentThisMonth = calculateTotalSmart(monthlyExpenseItems);

  // 6. Qual é o meu lucro (Profit = Received - Spent)
  const profitRaw = totalBilledThisMonth.raw - totalSpentThisMonth.raw;
  const dominantCurrency = currencyFilter !== 'ALL' ? currencyFilter : (monthlyReceivedItems[0]?.currency || settings.defaultCurrency);
  const netProfitThisMonthFormatted = formatCurrency(profitRaw, dominantCurrency);

  // 7. Quantos projetos estão ativos (Em andamento + Aguardando cliente)
  const activeProjects = filteredProjects.filter(
    (p) => p.status === 'Em andamento' || p.status === 'Aguardando cliente'
  );

  // 8. Quais projetos precisam da minha atenção hoje (Due today, due tomorrow, or status 'Aguardando cliente')
  const projectsNeedingAttention = filteredProjects.filter((p) => {
    if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
    const days = getDaysDiff(p.dueDate);
    return days <= 1 || p.status === 'Aguardando cliente';
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 mb-8 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Resumo Instantâneo (Diagnóstico &lt; 10s)
            </h2>
            <p className="text-xs text-slate-400">
              Visão rápida dos 8 indicadores vitais para tomada de decisão imediata
            </p>
          </div>
        </div>

        {currencyFilter === 'ALL' && (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 self-start sm:self-auto">
            🌐 Filtro ativo: <strong className="text-emerald-400">Todas as Moedas</strong>
          </span>
        )}
      </div>

      {/* Grid of 8 Answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Q1: Quanto tenho para receber? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">1. Quanto tenho a receber?</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 tracking-tight">
            {totalToReceive.formatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{pendingIncomeItems.length} cobrança(s) pendente(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-pendentes')}
              className="text-emerald-400 hover:underline text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

        {/* Q2: Quem ainda não pagou? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">2. Quem não pagou (atrasados)?</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 tracking-tight">
            {unpaidClientsCount} cliente(s)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{unpaidIncomes.length} fatura(s) vencida(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-atrasadas')}
              className="text-rose-400 hover:underline text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Cobrar <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

        {/* Q3: Quem preciso cobrar hoje? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">3. Quem cobrar hoje?</span>
            <MessageCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 tracking-tight">
            {incomesToChargeToday.length} pessoa(s)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Vencimento hoje ou vencidos</span>
            <button
              onClick={() => onNavigateToTab('financial', 'cobrar-hoje')}
              className="text-amber-400 hover:underline text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ação <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

        {/* Q4: Quanto já faturei este mês? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">4. Faturado este mês</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 tracking-tight">
            {totalBilledThisMonth.formatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{monthlyReceivedItems.length} receita(s) recebida(s)</span>
          </p>
        </div>

        {/* Q5: Quanto gastei? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">5. Despesas do mês</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-200 tracking-tight">
            {totalSpentThisMonth.formatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{monthlyExpenseItems.length} custo(s) lançados</span>
          </p>
        </div>

        {/* Q6: Qual é o meu lucro? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">6. Lucro líquido no mês</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${profitRaw >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfitThisMonthFormatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{profitRaw >= 0 ? 'Margem positiva' : 'Atenção aos custos'}</span>
          </p>
        </div>

        {/* Q7: Quantos projetos estão ativos? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">7. Projetos em andamento</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-blue-400 tracking-tight">
            {activeProjects.length} projeto(s)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Operação ativa</span>
            <button
              onClick={() => onNavigateToTab('projects', 'Em andamento')}
              className="text-blue-400 hover:underline text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

        {/* Q8: Quais projetos precisam de atenção hoje? */}
        <div className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 transition-all group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">8. Projetos requerem atenção</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-400 tracking-tight">
            {projectsNeedingAttention.length} projeto(s)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Entrega/Aguardando cliente</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-purple-400 hover:underline text-[10px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
