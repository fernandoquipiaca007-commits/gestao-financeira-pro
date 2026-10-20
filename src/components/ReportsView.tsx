import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  Download,
  Users,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { Client, Project, Income, Expense, CurrencyCode, AppSettings, getProjectStatusLabel } from '../types';
import { formatCurrency, convertCurrency } from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportsViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
}

const PIE_COLORS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)'];

const STATUS_COLORS: Record<string, string> = {
  'Concluído': 'var(--success)',
  'Completed': 'var(--success)',
  'Em andamento': 'var(--info)',
  'In Progress': 'var(--info)',
  'Atrasado': 'var(--danger)',
  'Overdue': 'var(--danger)',
  'Cancelado': 'var(--text-muted)',
  'Canceled': 'var(--text-muted)',
};

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

const MONTH_NAMES_EN: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  projects,
  incomes,
  expenses,
  settings,
  currencyFilter,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const currentYear = new Date().getFullYear();

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const mainCurrency = currencyFilter === 'ALL' ? settings.defaultCurrency : currencyFilter;

  // Available categories dynamic list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    const defaultCats = isEn
      ? ['Paid Traffic', 'Website', 'Landing Page', 'Online Store', 'Automation', 'Consulting', 'Digital Marketing', 'Design & Branding']
      : ['Tráfego Pago', 'Website', 'Landing Page', 'Loja Virtual', 'Automação', 'Consultoria', 'Marketing Digital', 'Design & Branding'];
    defaultCats.forEach(c => set.add(c));
    projects.forEach(p => { if (p.category) set.add(p.category); });
    expenses.forEach(e => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [projects, expenses, isEn]);

  // Filtered Projects (fully responsive to all filters)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (currencyFilter !== 'ALL' && p.currency !== currencyFilter) return false;
      if (selectedClient !== 'ALL' && p.clientId !== selectedClient && !p.clientIds?.includes(selectedClient)) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      const targetDate = p.startDate || p.dueDate;
      if (targetDate) {
        const [y, m] = targetDate.split('-');
        if (selectedYear !== 'ALL' && y !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;
      }
      return true;
    });
  }, [projects, currencyFilter, selectedClient, selectedCategory, selectedYear, selectedMonth]);

  // Filter Incomes (fully responsive to all filters)
  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return false;
      if (selectedClient !== 'ALL' && inc.clientId !== selectedClient) return false;

      if (selectedCategory !== 'ALL') {
        const proj = inc.projectId ? projects.find((p) => p.id === inc.projectId) : undefined;
        if (proj && proj.category !== selectedCategory) return false;
        if (!proj && !inc.description.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
      }

      const targetDate = inc.receivedDate || inc.dueDate;
      if (!targetDate) return false;

      const [y, m] = targetDate.split('-');
      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;

      return true;
    });
  }, [incomes, currencyFilter, selectedClient, selectedCategory, selectedYear, selectedMonth, projects]);

  // Filter Expenses (fully responsive to all filters)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return false;
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;

      // When a specific client is selected, general operating expenses are excluded from client view
      if (selectedClient !== 'ALL') return false;

      const [y, m] = exp.date.split('-');
      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;

      return true;
    });
  }, [expenses, currencyFilter, selectedCategory, selectedClient, selectedYear, selectedMonth]);

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

  // 4. Quantidade de Clientes (Reativo a filtros)
  const totalClientsCount = useMemo(() => {
    if (selectedClient !== 'ALL') {
      const c = clients.find(cl => cl.id === selectedClient);
      if (!c) return 0;
      if (currencyFilter !== 'ALL' && c.currency !== currencyFilter) return 0;
      return 1;
    }
    if (selectedCategory !== 'ALL' || selectedMonth !== 'ALL' || selectedYear !== 'ALL') {
      const clientIdsWithData = new Set<string>();
      filteredIncomes.forEach(i => { if (i.clientId) clientIdsWithData.add(i.clientId); });
      filteredProjects.forEach(p => {
        if (p.clientId) clientIdsWithData.add(p.clientId);
        p.clientIds?.forEach(id => clientIdsWithData.add(id));
      });
      return clientIdsWithData.size;
    }
    return clients.filter((c) => currencyFilter === 'ALL' ? true : c.currency === currencyFilter).length;
  }, [clients, selectedClient, selectedCategory, selectedMonth, selectedYear, currencyFilter, filteredIncomes, filteredProjects]);

  // 5. Ticket Médio
  const ticketMedio = receivedIncomes.length > 0 ? totalRevenue / receivedIncomes.length : 0;

  // 6. Clientes inadimplentes (Reativo a filtros)
  const overdueIncomes = useMemo(() => {
    return incomes.filter((i) => {
      if (currencyFilter !== 'ALL' && i.currency !== currencyFilter) return false;
      if (selectedClient !== 'ALL' && i.clientId !== selectedClient) return false;
      if (selectedCategory !== 'ALL' && i.projectId) {
        const proj = projects.find(p => p.id === i.projectId);
        if (proj && proj.category !== selectedCategory) return false;
      }
      return i.status === 'Atrasado';
    });
  }, [incomes, currencyFilter, selectedClient, selectedCategory, projects]);

  const defaultorClientsSet = new Set(overdueIncomes.map((i) => i.clientId).filter(Boolean));
  const defaultorClientsCount = defaultorClientsSet.size;

  // -------------------------------------------------------------
  // Chart 1: Expenses by Category Data (Doughnut)
  // -------------------------------------------------------------
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || (isEn ? 'Other' : 'Outros');
      const amountInMain = currencyFilter !== 'ALL'
        ? exp.amount
        : convertCurrency(exp.amount, exp.currency, settings.defaultCurrency, settings.exchangeRates);
      map.set(cat, (map.get(cat) || 0) + amountInMain);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, currencyFilter, settings, isEn]);

  // -------------------------------------------------------------
  // Chart 2: Incomes by Service/Category Data (Doughnut)
  // -------------------------------------------------------------
  const incomesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    receivedIncomes.forEach((inc) => {
      let cat = isEn ? 'General Services' : 'Serviços Gerais';
      if (inc.projectId) {
        const proj = projects.find((p) => p.id === inc.projectId);
        if (proj?.category) cat = proj.category;
      }
      const amountInMain = currencyFilter !== 'ALL'
        ? inc.amount
        : convertCurrency(inc.amount, inc.currency, settings.defaultCurrency, settings.exchangeRates);
      map.set(cat, (map.get(cat) || 0) + amountInMain);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [receivedIncomes, projects, currencyFilter, settings, isEn]);

  // -------------------------------------------------------------
  // Chart 3: Monthly & Weekly Evolution (Receitas vs Despesas vs Lucro)
  // Reage diretamente aos filtros de Cliente, Categoria, Ano e Mês
  // -------------------------------------------------------------
  const monthlyEvolution = useMemo(() => {
    const targetYear = selectedYear === 'ALL' ? String(currentYear) : selectedYear;

    if (selectedMonth === 'ALL') {
      // Visão Anual (12 Meses)
      const months = isEn
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      return months.map((monthName, idx) => {
        const monthNum = String(idx + 1).padStart(2, '0');

        const monthIncomes = incomes.filter((i) => {
          if (currencyFilter !== 'ALL' && i.currency !== currencyFilter) return false;
          if (selectedClient !== 'ALL' && i.clientId !== selectedClient) return false;
          if (selectedCategory !== 'ALL' && i.projectId) {
            const proj = projects.find((p) => p.id === i.projectId);
            if (proj && proj.category !== selectedCategory) return false;
          }
          if (i.status !== 'Recebido') return false;
          const targetDate = i.receivedDate || i.dueDate;
          if (!targetDate) return false;
          const [y, m] = targetDate.split('-');
          return (selectedYear === 'ALL' || y === targetYear) && m === monthNum;
        });

        const monthExpenses = expenses.filter((e) => {
          if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
          if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
          if (selectedClient !== 'ALL') return false;
          const [y, m] = e.date.split('-');
          return (selectedYear === 'ALL' || y === targetYear) && m === monthNum;
        });

        const rev = sumAmount(monthIncomes);
        const exp = sumAmount(monthExpenses);
        const profit = rev - exp;

        return {
          name: monthName,
          Receita: Math.round(rev),
          Despesa: Math.round(exp),
          Lucro: Math.round(profit),
        };
      });
    } else {
      // Visão Semanal Detalhada do Mês Selecionado
      const weeks = [
        { name: isEn ? 'Wk 1 (1-7)' : 'Sem 1 (1-7)', startDay: 1, endDay: 7 },
        { name: isEn ? 'Wk 2 (8-14)' : 'Sem 2 (8-14)', startDay: 8, endDay: 14 },
        { name: isEn ? 'Wk 3 (15-21)' : 'Sem 3 (15-21)', startDay: 15, endDay: 21 },
        { name: isEn ? 'Wk 4 (22-28)' : 'Sem 4 (22-28)', startDay: 22, endDay: 28 },
        { name: isEn ? 'Wk 5 (29-31)' : 'Sem 5 (29-31)', startDay: 29, endDay: 31 },
      ];

      return weeks.map((week) => {
        const weekIncomes = filteredIncomes.filter((i) => {
          if (i.status !== 'Recebido') return false;
          const targetDate = i.receivedDate || i.dueDate;
          if (!targetDate) return false;
          const parts = targetDate.split('-');
          const dayNum = parseInt(parts[2] || '1', 10);
          return dayNum >= week.startDay && dayNum <= week.endDay;
        });

        const weekExpenses = filteredExpenses.filter((e) => {
          const parts = e.date.split('-');
          const dayNum = parseInt(parts[2] || '1', 10);
          return dayNum >= week.startDay && dayNum <= week.endDay;
        });

        const rev = sumAmount(weekIncomes);
        const exp = sumAmount(weekExpenses);
        const profit = rev - exp;

        return {
          name: week.name,
          Receita: Math.round(rev),
          Despesa: Math.round(exp),
          Lucro: Math.round(profit),
        };
      });
    }
  }, [incomes, expenses, filteredIncomes, filteredExpenses, selectedYear, selectedMonth, selectedClient, selectedCategory, currencyFilter, settings, currentYear, projects, isEn]);

  // -------------------------------------------------------------
  // Chart 4: Projects Status Distribution (Reativo a filtros)
  // -------------------------------------------------------------
  const projectsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      [getProjectStatusLabel('Concluído', lang)]: 0,
      [getProjectStatusLabel('Em andamento', lang)]: 0,
      [getProjectStatusLabel('Aguardando cliente', lang)]: 0,
      [getProjectStatusLabel('Cancelado', lang)]: 0,
    };
    filteredProjects.forEach((p) => {
      const lbl = getProjectStatusLabel(p.status, lang);
      if (counts[lbl] !== undefined) {
        counts[lbl]++;
      } else {
        counts[lbl] = (counts[lbl] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredProjects, lang]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = isEn
      ? ['Type', 'Client/Category', 'Description', 'Amount', 'Currency', 'Date', 'Status']
      : ['Tipo', 'Cliente/Categoria', 'Descrição', 'Valor', 'Moeda', 'Data', 'Estado'];
    const rows: string[][] = [];

    filteredIncomes.forEach((inc) => {
      const client = clients.find((c) => c.id === inc.clientId);
      rows.push([
        isEn ? 'Revenue' : 'Receita',
        client?.name || (isEn ? 'Client' : 'Cliente'),
        inc.description,
        String(inc.amount),
        inc.currency,
        inc.dueDate,
        inc.status,
      ]);
    });

    filteredExpenses.forEach((exp) => {
      rows.push([
        isEn ? 'Expense' : 'Despesa',
        exp.category,
        exp.description,
        String(exp.amount),
        exp.currency,
        exp.date,
        exp.paid ? (isEn ? 'Paid' : 'Pago') : (isEn ? 'Pending' : 'Pendente'),
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', isEn ? `financial_report_${selectedYear}_${selectedMonth}.csv` : `relatorio_financeiro_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
            {isEn ? 'Reports' : 'Relatórios'}
          </h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {isEn
              ? 'Profit, cash flow and performance by period.'
              : 'Lucro, fluxo de caixa e desempenho por período.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-fg font-medium text-xs rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-fg-muted " />
            <span>{isEn ? 'Print' : 'Imprimir'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="aura-btn aura-btn--primary aura-btn--sm w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            <span>{isEn ? 'Export CSV' : 'Exportar CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-glass border border-line-subtle p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-glass">
        
        {/* Year Filter */}
        <div>
          <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Year' : 'Ano'}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2 bg-surface-2 border border-line-subtle rounded-md text-fg text-xs font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All Years' : 'Todos os Anos'}</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Month' : 'Mês'}</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 bg-surface-2 border border-line-subtle rounded-md text-fg text-xs font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All Months' : 'Todos os Meses'}</option>
            {Object.keys(MONTH_NAMES_PT).map((mKey) => (
              <option key={mKey} value={mKey}>
                {(isEn ? MONTH_NAMES_EN : MONTH_NAMES_PT)[mKey]}
              </option>
            ))}
          </select>
        </div>

        {/* Client Filter */}
        <div>
          <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Client' : 'Cliente'}</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-4 py-2 bg-surface-2 border border-line-subtle rounded-md text-fg text-xs font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All Clients' : 'Todos os Clientes'}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company || c.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Service/Category Filter */}
        <div>
          <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Service / Category' : 'Serviço / Categoria'}</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-surface-2 border border-line-subtle rounded-md text-fg text-xs font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All categories' : 'Todas as categorias'}</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* KPI Cards for Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Receita Total */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Total Revenue' : 'Receita Total'}</span>
            <div className="p-1.5 rounded-full bg-success-soft text-success-fg ">
              <DollarSign className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-success-fg mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(totalRevenue, mainCurrency)}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn
              ? `${receivedIncomes.length} invoices settled in period`
              : `${receivedIncomes.length} faturas liquidadas no período`}
          </p>
        </div>

        {/* Despesas */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Total Expenses' : 'Despesas Totais'}</span>
            <div className="p-1.5 rounded-full bg-surface-2 text-fg-secondary ">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-fg mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(totalExpenses, mainCurrency)}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn
              ? `${filteredExpenses.length} computed costs`
              : `${filteredExpenses.length} custos computados`}
          </p>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Net Profit' : 'Lucro Líquido'}</span>
            <div className={`p-1.5 rounded-full ${netProfit >= 0 ? 'bg-success-soft text-success-fg ' : 'bg-danger-soft text-danger-fg '}`}>
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className={`text-2xl font-medium mt-2 tracking-[-0.04em] ${netProfit >= 0 ? 'text-success-fg ' : 'text-danger-fg '}`} style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(netProfit, mainCurrency)}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn ? 'Calculated profit margin' : 'Margem de lucro calculada'}
          </p>
        </div>

        {/* Quantidade de Clientes */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Total Clients' : 'Quantidade de Clientes'}</span>
            <div className="p-1.5 rounded-full bg-accent-soft text-accent-soft-fg ">
              <Users className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-fg mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {totalClientsCount} {isEn ? 'clients' : 'clientes'}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn ? 'Active registered base' : 'Base ativa registada'}
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Average Ticket per Invoice' : 'Ticket Médio por Fatura'}</span>
            <div className="p-1.5 rounded-full bg-surface-2 text-fg-secondary ">
              <Sparkles className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-fg mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {formatCurrency(ticketMedio, mainCurrency)}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn ? 'Average value per project/revenue' : 'Valor médio por projeto/receita'}
          </p>
        </div>

        {/* Clientes em Atraso */}
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
          <div className="flex items-center justify-between text-[13px] text-fg-secondary font-medium ">
            <span>{isEn ? 'Overdue Clients' : 'Clientes em Atraso'}</span>
            <div className="p-1.5 rounded-full bg-danger-soft text-danger-fg ">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-medium text-danger-fg mt-2 tracking-[-0.04em]" style={{ letterSpacing: '-0.055em' }}>
            {defaultorClientsCount} {isEn ? 'client(s)' : 'cliente(s)'}
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {isEn ? 'Late payments recorded' : 'Atraso registrado em pagamentos'}
          </p>
        </div>

      </div>

      {/* ============================================================= */}
      {/* GRÁFICOS VISUAIS ESTRATÉGICOS (Foto 2) */}
      {/* ============================================================= */}
      
      {/* Gráfico de Evolução Mensal (Full Width) */}
      <div className="bg-glass border border-line-subtle p-6 rounded-xl shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-info-soft border border-blue-200 flex items-center justify-center text-accent-soft-fg ">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg tracking-tight flex items-center gap-2 flex-wrap">
                <span>
                  {selectedMonth === 'ALL'
                    ? (isEn
                        ? `Monthly Financial Evolution — ${selectedYear === 'ALL' ? 'All Years' : selectedYear}`
                        : `Evolução Financeira Mensal — ${selectedYear === 'ALL' ? 'Todos os Anos' : selectedYear}`)
                    : (isEn
                        ? `Weekly Evolution — ${(isEn ? MONTH_NAMES_EN : MONTH_NAMES_PT)[selectedMonth] || selectedMonth} ${selectedYear === 'ALL' ? currentYear : selectedYear}`
                        : `Evolução Semanal — ${MONTH_NAMES_PT[selectedMonth] || selectedMonth} de ${selectedYear === 'ALL' ? currentYear : selectedYear}`)}
                </span>
                {selectedClient !== 'ALL' && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-accent-soft-fg ">
                    {isEn ? 'Client' : 'Cliente'}: {clients.find(c => c.id === selectedClient)?.name || (isEn ? 'Selected Client' : 'Cliente Selecionado')}
                  </span>
                )}
                {selectedCategory !== 'ALL' && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-warning-fg ">
                    {selectedCategory}
                  </span>
                )}
              </h3>
              <p className="text-xs text-fg-muted ">
                {selectedMonth === 'ALL'
                  ? (isEn
                      ? 'Comparison of Revenue, Expenses, and Net Profit month by month'
                      : 'Comparativo de Receitas, Despesas e Lucro Líquido mês a mês')
                  : (isEn
                      ? `Cash flow breakdown by weeks of ${(isEn ? MONTH_NAMES_EN : MONTH_NAMES_PT)[selectedMonth] || selectedMonth} based on applied filters`
                      : `Detalhamento de fluxo por semanas de ${MONTH_NAMES_PT[selectedMonth] || selectedMonth} com base nos filtros aplicados`)}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} stroke="var(--chart-grid)" opacity={0.5} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} stroke="var(--chart-grid)" opacity={0.5} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <RechartsTooltip
                formatter={(value) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #c4c7c7',
                  fontSize: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Receita" fill="var(--viz-2)" radius={[4, 4, 0, 0]} maxBarSize={24} name={isEn ? 'Revenue' : 'Receita'} />
              <Bar dataKey="Despesa" fill="var(--viz-1)" radius={[4, 4, 0, 0]} maxBarSize={24} name={isEn ? 'Expenses' : 'Despesa'} />
              <Bar dataKey="Lucro" fill="var(--viz-3)" radius={[4, 4, 0, 0]} maxBarSize={24} name={isEn ? 'Net Profit' : 'Lucro'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid com Gráficos Circulares (Doughnuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Despesas por Categoria */}
        <div className="bg-glass border border-line-subtle p-6 rounded-xl shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-danger-fg" />
              <h3 className="text-sm font-bold text-fg tracking-tight">
                {isEn ? 'Expenses by Category' : 'Despesas por Categoria'}
              </h3>
            </div>
            <p className="text-[11px] text-fg-muted mb-4">
              {isEn ? 'Where the business allocates costs' : 'Onde o negócio está alocando custos'}
            </p>

            {expensesByCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-fg-muted ">
                {isEn ? 'No expenses recorded in the period' : 'Sem despesas registradas no período'}
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #c4c7c7',
                        fontSize: '11px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Legenda com percentuais */}
          {expensesByCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-line-subtle space-y-1.5 max-h-36 overflow-y-auto">
              {expensesByCategory.slice(0, 5).map((cat, idx) => (
                <div key={cat?.name || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate text-fg-secondary ">{cat?.name || 'Geral'}</span>
                  </div>
                  <span className="font-semibold text-fg shrink-0 ml-2">
                    {formatCurrency(cat?.value || 0, mainCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico 2: Composição de Receitas por Categoria de Serviço */}
        <div className="bg-glass border border-line-subtle p-6 rounded-xl shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#10b981]" />
              <h3 className="text-sm font-bold text-fg tracking-tight">
                {isEn ? 'Revenue by Service' : 'Receitas por Serviço'}
              </h3>
            </div>
            <p className="text-[11px] text-fg-muted mb-4">
              {isEn ? 'Revenue distribution by service type' : 'Distribuição do faturação por tipo'}
            </p>

            {incomesByCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-fg-muted ">
                {isEn ? 'No revenue received in the period' : 'Sem receitas recebidas no período'}
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={incomesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {incomesByCategory.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [formatCurrency(Number(value) || 0, mainCurrency), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #c4c7c7',
                        fontSize: '11px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Legenda com percentuais */}
          {incomesByCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-line-subtle space-y-1.5 max-h-36 overflow-y-auto">
              {incomesByCategory.slice(0, 5).map((cat, idx) => (
                <div key={cat?.name || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[(idx + 2) % PIE_COLORS.length] }} />
                    <span className="truncate text-fg-secondary ">{cat?.name || 'Geral'}</span>
                  </div>
                  <span className="font-semibold text-fg shrink-0 ml-2">
                    {formatCurrency(cat?.value || 0, mainCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico 3: Status Operacional dos Projetos */}
        <div className="bg-glass border border-line-subtle p-6 rounded-xl shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-4 h-4 text-accent-soft-fg" />
              <h3 className="text-sm font-bold text-fg tracking-tight">
                {isEn ? 'Project status' : 'Estado dos projetos'}
              </h3>
            </div>
            <p className="text-[11px] text-fg-muted mb-4">
              {isEn ? 'Team delivery rate and operational efficiency' : 'Eficiência e taxa de entrega da equipa'}
            </p>

            {projectsByStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-fg-muted ">
                {isEn ? 'No projects registered' : 'Ainda não há projetos'}
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={projectsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {projectsByStatus.map((entry, idx) => (
                        <Cell key={`cell-proj-${entry?.name || idx}`} fill={(entry?.name && STATUS_COLORS[entry.name]) || 'var(--text-muted)'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #c4c7c7',
                        fontSize: '11px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Legenda de Projetos */}
          {projectsByStatus.length > 0 && (
            <div className="mt-4 pt-3 border-t border-line-subtle space-y-1.5">
              {projectsByStatus.map((item, idx) => (
                <div key={item?.name || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (item?.name && STATUS_COLORS[item.name]) || 'var(--text-muted)' }} />
                    <span className="text-fg-secondary ">{item?.name || ''}</span>
                  </div>
                  <span className="font-semibold text-fg ">
                    {item?.value || 0} {isEn ? 'project(s)' : 'projeto(s)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
