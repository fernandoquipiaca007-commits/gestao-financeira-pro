import React, { useState } from 'react';
import {
  PieChart,
  Download,
  Users,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Client, Project, Income, Expense, CurrencyCode, AppSettings } from '../types';
import { formatCurrency, convertCurrency } from '../lib/formatters';

interface ReportsViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  settings,
  currencyFilter,
}) => {
  const currentYear = new Date().getFullYear();

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const mainCurrency = currencyFilter === 'ALL' ? settings.defaultCurrency : currencyFilter;

  // Filter Incomes
  const filteredIncomes = incomes.filter((inc) => {
    // Currency
    if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return false;

    // Client
    if (selectedClient !== 'ALL' && inc.clientId !== selectedClient) return false;

    // Category / Service (check via linked project or description)
    if (selectedCategory !== 'ALL' && inc.projectId) {
      const proj = projects.find((p) => p.id === inc.projectId);
      if (proj && proj.category !== selectedCategory) return false;
    }

    // Date / Year / Month
    const targetDate = inc.receivedDate || inc.dueDate;
    if (!targetDate) return false;

    const [y, m] = targetDate.split('-');
    if (selectedYear !== 'ALL' && y !== selectedYear) return false;
    if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;

    return true;
  });

  // Filter Expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return false;

    if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;

    const [y, m] = exp.date.split('-');
    if (selectedYear !== 'ALL' && y !== selectedYear) return false;
    if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;

    return true;
  });

  // Calculation Helper
  const sumAmount = (items: { amount: number; currency: CurrencyCode }[]) => {
    if (currencyFilter !== 'ALL') {
      return items.reduce((sum, item) => sum + item.amount, 0);
    }
    return items.reduce((sum, item) => {
      return sum + convertCurrency(item.amount, item.currency, settings.defaultCurrency, settings.exchangeRates);
    }, 0);
  };

  // 1. Receita total (Recebido)
  const receivedIncomes = filteredIncomes.filter((i) => i.status === 'Recebido');
  const totalRevenue = sumAmount(receivedIncomes);

  // 2. Despesas
  const totalExpenses = sumAmount(filteredExpenses);

  // 3. Lucro Líquido
  const netProfit = totalRevenue - totalExpenses;

  // 4. Quantidade de Clientes
  const totalClientsCount = clients.filter((c) =>
    currencyFilter === 'ALL' ? true : c.currency === currencyFilter
  ).length;

  // 5. Ticket Médio
  const ticketMedio = receivedIncomes.length > 0 ? totalRevenue / receivedIncomes.length : 0;

  // 6. Clientes inadimplentes
  const overdueIncomes = incomes.filter((i) => {
    if (currencyFilter !== 'ALL' && i.currency !== currencyFilter) return false;
    return i.status === 'Atrasado';
  });
  const defaultorClientsSet = new Set(overdueIncomes.map((i) => i.clientId));
  const defaultorClientsCount = defaultorClientsSet.size;

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Tipo', 'Cliente/Categoria', 'Descrição', 'Valor', 'Moeda', 'Data', 'Status'];
    const rows: string[][] = [];

    filteredIncomes.forEach((inc) => {
      const client = clients.find((c) => c.id === inc.clientId);
      rows.push([
        'Receita',
        client?.name || 'Cliente',
        inc.description,
        String(inc.amount),
        inc.currency,
        inc.dueDate,
        inc.status,
      ]);
    });

    filteredExpenses.forEach((exp) => {
      rows.push([
        'Despesa',
        exp.category,
        exp.description,
        String(exp.amount),
        exp.currency,
        exp.date,
        exp.paid ? 'Pago' : 'Pendente',
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#0050d7]" />
            Relatórios Gerenciais
          </h2>
          <p className="text-xs text-[#747878] mt-0.5">
            Análise consolidada por período, serviço, cliente e taxas de adimplência
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] font-medium text-xs rounded-[29px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#747878]" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-xs rounded-[29px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#c4c7c7]/40 p-4 rounded-[22px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        
        {/* Year Filter */}
        <div>
          <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Ano</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-xs font-medium focus:outline-none focus:border-[#000000]"
          >
            <option value="ALL">Todos os Anos</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Mês</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-xs font-medium focus:outline-none focus:border-[#000000]"
          >
            <option value="ALL">Todos os Meses</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>

        {/* Client Filter */}
        <div>
          <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Cliente</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-xs font-medium focus:outline-none focus:border-[#000000]"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company || c.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Service/Category Filter */}
        <div>
          <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Serviço / Categoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-xs font-medium focus:outline-none focus:border-[#000000]"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="Tráfego Pago">Tráfego Pago</option>
            <option value="Website">Website</option>
            <option value="Landing Page">Landing Page</option>
            <option value="Loja Virtual">Loja Virtual</option>
            <option value="Automação">Automação</option>
            <option value="Consultoria">Consultoria</option>
          </select>
        </div>

      </div>

      {/* KPI Cards for Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Receita Total */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Receita Total</span>
            <div className="p-1.5 rounded-full bg-[#d4eddf] text-[#1a6b3a]">
              <DollarSign className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#1a6b3a] mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(totalRevenue, mainCurrency)}
          </div>
          <p className="text-xs text-[#747878] mt-1">
            {receivedIncomes.length} faturas liquidadas no período
          </p>
        </div>

        {/* Despesas */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Despesas Totais</span>
            <div className="p-1.5 rounded-full bg-[#f1edec] text-[#444747]">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(totalExpenses, mainCurrency)}
          </div>
          <p className="text-xs text-[#747878] mt-1">
            {filteredExpenses.length} custos computados
          </p>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Lucro Líquido</span>
            <div className={`p-1.5 rounded-full ${netProfit >= 0 ? 'bg-[#d4eddf] text-[#1a6b3a]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className={`text-2xl font-medium mt-2 tracking-[-0.04em] ${netProfit >= 0 ? 'text-[#1a6b3a]' : 'text-[#ba1a1a]'}`} style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(netProfit, mainCurrency)}
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Margem de lucro calculada
          </p>
        </div>

        {/* Quantidade de Clientes */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Quantidade de Clientes</span>
            <div className="p-1.5 rounded-full bg-[#dbe1ff] text-[#003da9]">
              <Users className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalClientsCount} clientes
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Base ativa cadastrada
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Ticket Médio por Fatura</span>
            <div className="p-1.5 rounded-full bg-[#f1edec] text-[#444747]">
              <Sparkles className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#000000] mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(ticketMedio, mainCurrency)}
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Valor médio por projeto/receita
          </p>
        </div>

        {/* Clientes Inadimplentes */}
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] text-[#747878] font-semibold uppercase tracking-widest">
            <span>Clientes Inadimplentes</span>
            <div className="p-1.5 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-[#ba1a1a] mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {defaultorClientsCount} cliente(s)
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Atraso registrado em pagamentos
          </p>
        </div>

      </div>

    </div>
  );
};
