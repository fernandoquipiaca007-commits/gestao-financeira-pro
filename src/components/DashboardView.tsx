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

  // KPI card data array
  const kpiCards = [
    {
      label: 'Contas a Receber',
      value: totalToReceive.formatted,
      sub: `${pendingIncomeItems.length} fatura(s) pendente(s)`,
      icon: DollarSign,
      iconBg: 'bg-[#f1edec]',
      iconColor: 'text-[#444747]',
      onClick: () => onNavigateTab('financial', 'receitas-pendentes'),
    },
    {
      label: 'Receita Recebida',
      value: totalReceivedThisMonth.formatted,
      sub: `${monthlyReceivedItems.length} pagamento(s) liquidado(s)`,
      icon: TrendingUp,
      iconBg: 'bg-[#d4eddf]',
      iconColor: 'text-[#1a6b3a]',
      onClick: () => onNavigateTab('financial', 'receitas-recebidas'),
    },
    {
      label: 'Custos Operacionais',
      value: totalExpensesThisMonth.formatted,
      sub: `${monthlyExpenseItems.length} custo(s) lançado(s)`,
      icon: Receipt,
      iconBg: 'bg-[#f1edec]',
      iconColor: 'text-[#747878]',
      onClick: () => onNavigateTab('financial', 'despesas'),
    },
    {
      label: 'Resultado Líquido',
      value: netProfitThisMonthFormatted,
      sub: profitRaw >= 0 ? 'Margem operacional positiva' : 'Atenção às margens',
      icon: CheckCircle2,
      iconBg: profitRaw >= 0 ? 'bg-[#d4eddf]' : 'bg-[#ffdad6]',
      iconColor: profitRaw >= 0 ? 'text-[#1a6b3a]' : 'text-[#93000a]',
      valueColor: profitRaw >= 0 ? 'text-[#1a6b3a]' : 'text-[#93000a]',
      onClick: undefined,
    },
    {
      label: 'Clientes Ativos',
      value: String(activeClientsCount),
      sub: 'Cadastrados no sistema',
      icon: Users,
      iconBg: 'bg-[#dbe1ff]',
      iconColor: 'text-[#003da9]',
      onClick: () => onNavigateTab('clients'),
    },
    {
      label: 'Projetos Ativos',
      value: String(inProgressProjects.length),
      sub: 'Em produção ativa',
      icon: FolderKanban,
      iconBg: 'bg-[#f1edec]',
      iconColor: 'text-[#444747]',
      onClick: () => onNavigateTab('projects', 'em_andamento'),
    },
    {
      label: 'Entregas Concluídas',
      value: String(completedProjects.length),
      sub: 'Entregues com sucesso',
      icon: CheckCircle2,
      iconBg: 'bg-[#f1edec]',
      iconColor: 'text-[#444747]',
      onClick: () => onNavigateTab('projects', 'concluidos'),
    },
    {
      label: 'Inadimplência',
      value: String(overdueIncomes.length),
      sub: 'Cobrança(s) em atraso',
      icon: AlertTriangle,
      iconBg: 'bg-[#ffdad6]',
      iconColor: 'text-[#ba1a1a]',
      valueColor: overdueIncomes.length > 0 ? 'text-[#93000a]' : undefined,
      onClick: () => onNavigateTab('financial', 'receitas-atrasadas'),
    },
  ];

  return (
    <div className="space-y-6 pb-12">

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight">
            Indicadores Financeiros
          </h3>
          <span className="text-[11px] font-semibold text-[#747878] bg-[#f1edec] px-3 py-1 rounded-full border border-[#c4c7c7]/40 w-fit uppercase tracking-widest">
            {currencyFilter === 'ALL' ? 'Todas as Moedas' : currencyFilter}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.onClick}
                className={`bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${card.onClick ? 'cursor-pointer hover:border-[#c4c7c7] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] group' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[#747878]">{card.label}</span>
                  <div className={`p-2 rounded-full ${card.iconBg} ${card.iconColor}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                </div>
                <div className={`text-2xl font-medium mt-3 tracking-[-0.04em] ${card.valueColor || 'text-[#000000]'}`} style={{ letterSpacing: '-0.055em' }}>
                  {card.value}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#c4c7c7]/40 pt-2">
                  <span className="text-xs text-[#747878]">{card.sub}</span>
                  {card.onClick && <ChevronRight className="w-3.5 h-3.5 text-[#c4c7c7] group-hover:text-[#747878] transition-colors" strokeWidth={1.5} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Evolução Financeira Mensal */}
      <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight">
              Evolução Financeira Mensal
            </h3>
            <p className="text-sm text-[#747878] mt-0.5">
              Receitas vs. Custos vs. Resultado Líquido — últimos 6 meses em {mainCurrency}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-medium text-[#747878]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#000000] inline-block" /> Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#c4c7c7] inline-block" /> Custos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0050d7] inline-block" /> Resultado
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2e1" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#747878" fontSize={11} tickLine={false} fontWeight={500} />
              <YAxis
                stroke="#747878"
                fontSize={11}
                tickLine={false}
                fontWeight={500}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#c4c7c7',
                  borderRadius: '16px',
                  color: '#1c1b1b',
                  fontSize: '12px',
                  fontWeight: '500',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar dataKey="Receitas" fill="#000000" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Despesas" fill="#c4c7c7" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Lucro" fill="#0050d7" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Action Lists Grid: Cobranças Pendentes vs Próximas Entregas de Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* List A: Cobranças Pendentes & Atrasadas */}
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#c4c7c7]/40">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-full bg-[#fff3d6] text-[#7a5400]">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-[#1c1b1b]">Cobranças &amp; Faturas Pendentes</h3>
            </div>
            <button
              onClick={() => onNavigateTab('financial', 'receitas')}
              className="text-xs font-medium text-[#0050d7] hover:opacity-75 cursor-pointer"
            >
              Ver todas →
            </button>
          </div>

          {pendingIncomes.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#c4c7c7]" strokeWidth={1.5} />
              <p className="font-semibold text-[#1c1b1b] text-sm">Tudo em dia!</p>
              <p className="text-xs text-[#747878]">Nenhuma cobrança pendente no momento.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingIncomes.slice(0, 4).map((inc) => {
                const client = clientMap.get(inc.clientId);
                const diff = getDaysDiff(inc.dueDate);
                const isOverdue = diff < 0;
                const isDueToday = diff === 0;

                const text = `Olá, ${client?.name}! Tudo bem? Passando para lembrar do pagamento referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}). Vencimento: ${formatDate(inc.dueDate)}. Abs!`;

                return (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 flex items-center justify-between gap-3 hover:bg-[#f1edec] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-[#1c1b1b] text-sm truncate">
                          {client?.name || 'Cliente'}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ffdad6] text-[#93000a]">
                            Atrasado {Math.abs(diff)}d
                          </span>
                        )}
                        {isDueToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff3d6] text-[#7a5400]">
                            Vence Hoje
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#747878] truncate mt-0.5">
                        {inc.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-[#1a6b3a]">
                        {formatCurrency(inc.amount, inc.currency)}
                      </div>
                      {client?.whatsapp && (
                        <button
                          onClick={() => onOpenWhatsAppCharge(client.whatsapp, text)}
                          className="mt-1 text-[10px] font-medium text-[#747878] hover:text-[#0050d7] flex items-center gap-1 justify-end cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" strokeWidth={1.5} /> Cobrar
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
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#c4c7c7]/40">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-full bg-[#f1edec] text-[#444747]">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-[#1c1b1b]">Próximos Prazos de Entrega</h3>
            </div>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-medium text-[#0050d7] hover:opacity-75 cursor-pointer"
            >
              Ver todos →
            </button>
          </div>

          {inProgressProjects.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <FolderKanban className="w-8 h-8 mx-auto text-[#c4c7c7]" strokeWidth={1.5} />
              <p className="font-semibold text-[#1c1b1b] text-sm">Nenhum projeto ativo</p>
              <p className="text-xs text-[#747878]">Crie um novo projeto para acompanhar os prazos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inProgressProjects.slice(0, 4).map((proj) => {
                const client = clientMap.get(proj.clientId);
                const diff = getDaysDiff(proj.dueDate);
                const progressPct = proj.totalAmount > 0 ? Math.round((proj.paidAmount / proj.totalAmount) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 hover:bg-[#f1edec] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-[#1c1b1b] text-sm truncate">
                        {proj.name}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        diff < 0 ? 'bg-[#ffdad6] text-[#93000a]' :
                        diff <= 3 ? 'bg-[#fff3d6] text-[#7a5400]' :
                        'bg-[#e5e2e1] text-[#444747]'
                      }`}>
                        {formatDate(proj.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#747878] mb-2.5">
                      <span>{client?.name || '-'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#f1edec] text-[#444747] text-[10px] font-medium">
                        {proj.category}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#e5e2e1] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#000000] h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#747878] mt-1 text-right">{progressPct}% pago</div>
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
