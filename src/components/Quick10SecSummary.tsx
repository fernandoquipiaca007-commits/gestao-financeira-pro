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
  Wallet,
  Handshake,
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-8 shadow-xs relative">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs">
            <Zap className="w-5 h-5 fill-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Visão Geral Financeira
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Indicadores vitais em tempo real para controle operacional e estratégico
            </p>
          </div>
        </div>

        {currencyFilter === 'ALL' && (
          <span className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 self-start sm:self-auto shadow-2xs">
            🌐 Moeda Base: <strong className="text-slate-900">{settings.defaultCurrency}</strong>
          </span>
        )}
      </div>

      {/* Grid of Executive Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Contas a Receber */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contas a Receber</span>
            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {totalToReceive.formatted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>{pendingIncomeItems.length} fatura(s) pendente(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-pendentes')}
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Inadimplência */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inadimplência</span>
            <div className="p-1.5 rounded-lg bg-rose-100/70 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {unpaidClientsCount} cliente(s)
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>{unpaidIncomes.length} cobrança(s) vencida(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-atrasadas')}
              className="text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Cobrar <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: Cobranças do Dia */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cobranças do Dia</span>
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-600">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            {incomesToChargeToday.length} conta(s)
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Vencimento hoje ou atrasado</span>
            <button
              onClick={() => onNavigateToTab('financial', 'cobrar-hoje')}
              className="text-amber-600 hover:text-amber-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Executar <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Receita Recebida */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receita Recebida</span>
            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {totalBilledThisMonth.formatted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Mês atual ({monthlyReceivedItems.length} entradas)</span>
          </div>
        </div>

        {/* KPI 5: Custos Operacionais */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custos Operacionais</span>
            <div className="p-1.5 rounded-lg bg-slate-200/80 text-slate-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {totalSpentThisMonth.formatted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Mês atual ({monthlyExpenseItems.length} despesas)</span>
          </div>
        </div>

        {/* KPI 6: Resultado Líquido Mensal */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultado Líquido Mensal</span>
            <div className={`p-1.5 rounded-lg ${profitRaw >= 0 ? 'bg-teal-100/70 text-teal-600' : 'bg-rose-100/70 text-rose-600'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${profitRaw >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            {netProfitThisMonthFormatted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>{profitRaw >= 0 ? 'Margem operacional positiva' : 'Atenção às margens'}</span>
          </div>
        </div>

        {/* KPI 7: Projetos Ativos */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projetos Ativos</span>
            <div className="p-1.5 rounded-lg bg-indigo-100/70 text-indigo-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
            {activeProjects.length} projeto(s)
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Operação em andamento</span>
            <button
              onClick={() => onNavigateToTab('projects', 'Em andamento')}
              className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 8: Projetos com Pendências */}
        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projetos com Pendências</span>
            <div className="p-1.5 rounded-lg bg-purple-100/70 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 tracking-tight">
            {projectsNeedingAttention.length} projeto(s)
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Prazos/Aguardando cliente</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-purple-600 hover:text-purple-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 9: Disponibilidade em Caixa */}
        <div className="bg-teal-50/60 hover:bg-teal-50/90 p-4 rounded-xl border border-teal-200/90 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Disponibilidade em Caixa</span>
            <div className="p-1.5 rounded-lg bg-teal-200/80 text-teal-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${realCashBalanceRaw >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {realCashBalanceFormatted}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-2 flex items-center justify-between border-t border-teal-200/60 pt-2">
            <span>Disponível em conta hoje</span>
            {onOpenNewExpenseModal && (
              <button
                onClick={onOpenNewExpenseModal}
                className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
              >
                💸 Registrar Saída
              </button>
            )}
          </div>
        </div>

        {/* KPI 10: Receita Contratada */}
        <div className="bg-emerald-50/60 hover:bg-emerald-50/90 p-4 rounded-xl border border-emerald-200/90 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Receita Contratada</span>
            <div className="p-1.5 rounded-lg bg-emerald-200/80 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {totalPipelineContracted.formatted}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-2 flex items-center justify-between border-t border-emerald-200/60 pt-2">
            <span>Soma total dos projetos</span>
          </div>
        </div>

        {/* KPI 11: Repasses a Parceiros */}
        <div className="bg-purple-50/60 hover:bg-purple-50/90 p-4 rounded-xl border border-purple-200/90 transition-all hover:shadow-sm group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Repasses a Parceiros</span>
            <div className="p-1.5 rounded-lg bg-purple-200/80 text-purple-800">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {totalPendingCommissions.formatted}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-2 flex items-center justify-between border-t border-purple-200/60 pt-2">
            <span>Comissões a pagar</span>
            <button
              onClick={() => onNavigateToTab('partners')}
              className="text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Parceiros <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
