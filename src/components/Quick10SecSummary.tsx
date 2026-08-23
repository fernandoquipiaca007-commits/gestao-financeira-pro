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
    <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#c4c7c7]/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1c1b1b] tracking-tight flex items-center gap-2">
              Visão Geral Financeira
            </h2>
            <p className="text-xs text-[#747878] mt-0.5">
              Indicadores vitais em tempo real para controle operacional e estratégico
            </p>
          </div>
        </div>

        {currencyFilter === 'ALL' && (
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#f1edec] border border-[#c4c7c7]/40 text-[#444747] self-start sm:self-auto">
            🌐 Moeda Base: <strong className="text-[#1c1b1b]">{settings.defaultCurrency}</strong>
          </span>
        )}
      </div>

      {/* Grid of Executive Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Contas a Receber */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Contas a Receber</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalToReceive.formatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>{pendingIncomeItems.length} fatura(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-pendentes')}
              className="text-[#0050d7] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 2: Inadimplência */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Inadimplência</span>
            <div className="w-7 h-7 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#ba1a1a] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {unpaidClientsCount} cliente(s)
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>{unpaidIncomes.length} cobrança(s) vencida(s)</span>
            <button
              onClick={() => onNavigateToTab('financial', 'receitas-atrasadas')}
              className="text-[#ba1a1a] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Cobrar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: Cobranças do Dia */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Cobranças do Dia</span>
            <div className="w-7 h-7 rounded-full bg-[#fff3d6] text-[#7a5400] flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#7a5400] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {incomesToChargeToday.length} conta(s)
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Vencimento hoje ou atrasado</span>
            <button
              onClick={() => onNavigateToTab('financial', 'cobrar-hoje')}
              className="text-[#7a5400] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Executar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 4: Receita Recebida */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Receita Recebida</span>
            <div className="w-7 h-7 rounded-full bg-[#d4eddf] text-[#1a6b3a] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#1a6b3a] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalBilledThisMonth.formatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Mês atual ({monthlyReceivedItems.length} entradas)</span>
          </div>
        </div>

        {/* KPI 5: Custos Operacionais */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Custos Operacionais</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalSpentThisMonth.formatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Mês atual ({monthlyExpenseItems.length} despesas)</span>
          </div>
        </div>

        {/* KPI 6: Resultado Líquido Mensal */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Resultado Líquido</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${profitRaw >= 0 ? 'bg-[#d4eddf] text-[#1a6b3a]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-medium tracking-[-0.04em] ${profitRaw >= 0 ? 'text-[#1a6b3a]' : 'text-[#ba1a1a]'}`} style={{ letterSpacing: '-0.055em' }}>
            {netProfitThisMonthFormatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>{profitRaw >= 0 ? 'Margem positiva' : 'Atenção às margens'}</span>
          </div>
        </div>

        {/* KPI 7: Projetos Ativos */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Projetos Ativos</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {activeProjects.length} projeto(s)
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Operação ativa</span>
            <button
              onClick={() => onNavigateToTab('projects', 'Em andamento')}
              className="text-[#0050d7] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 8: Projetos com Pendências */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Prazos &amp; Alertas</span>
            <div className="w-7 h-7 rounded-full bg-[#fff3d6] text-[#7a5400] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#7a5400] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {projectsNeedingAttention.length} alerta(s)
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Prazos / Aguardando</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-[#0050d7] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Ver <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 9: Disponibilidade em Caixa */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Saldo em Caixa</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-medium tracking-[-0.04em] ${realCashBalanceRaw >= 0 ? 'text-[#1a6b3a]' : 'text-[#ba1a1a]'}`} style={{ letterSpacing: '-0.055em' }}>
            {realCashBalanceFormatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Disponível hoje</span>
            {onOpenNewExpenseModal && (
              <button
                onClick={onOpenNewExpenseModal}
                className="text-[#0050d7] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                + Saída
              </button>
            )}
          </div>
        </div>

        {/* KPI 10: Receita Contratada */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Pipeline Projetos</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalPipelineContracted.formatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Soma total projetos</span>
          </div>
        </div>

        {/* KPI 11: Repasses a Parceiros */}
        <div className="bg-[#f7f3f2] hover:bg-[#f1edec] p-4 rounded-[16px] border border-[#c4c7c7]/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Comissões a Pagar</span>
            <div className="w-7 h-7 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <Handshake className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalPendingCommissions.formatted}
          </div>
          <div className="text-xs text-[#747878] mt-2 flex items-center justify-between border-t border-[#c4c7c7]/30 pt-2">
            <span>Repasses pendentes</span>
            <button
              onClick={() => onNavigateToTab('partners')}
              className="text-[#0050d7] hover:opacity-80 font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              Parceiros <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
