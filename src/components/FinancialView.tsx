import React, { useState } from 'react';
import { convertWith } from '../lib/fxRates';
import {
  DollarSign,
  Receipt,
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MessageCircle,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Mail,
  FileText,
  ExternalLink,
  Download,
  CreditCard,
  PiggyBank,
} from 'lucide-react';
import {
  Income,
  Expense,
  Client,
  Project,
  CurrencyCode,
  getIncomeStatusLabel,
  getPaymentMethodLabel,
  getExpenseCategoryLabel,
  EXPENSE_CATEGORY_LABELS,
  AppSettings,
  CashReserve,
} from '../types';
import {
  formatCurrency,
  formatDate,
  getDaysDiff,
  convertCurrency,
} from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';
import { CashPanel } from './finance/CashPanel';
import { cashTimeline } from '../lib/finance/cashTimeline';

interface FinancialViewProps {
  incomes: Income[];
  expenses: Expense[];
  clients: Client[];
  projects: Project[];
  currencyFilter: CurrencyCode | 'ALL';
  initialTab?: 'receitas' | 'despesas' | 'agenda' | 'caixa';
  initialFilter?: string;
  settings?: AppSettings;
  reserves?: CashReserve[];
  canEditCash?: boolean;
  onSaveReserve?: (reserve: Omit<CashReserve, 'id' | 'createdAt'> & { id?: string }) => Promise<boolean>;
  onDistribute?: (params: { amount: number; date: string; reference: string; sent: Record<string, boolean>; offset: Record<string, boolean> }) => Promise<boolean>;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (incomeId: string) => void;
  onToggleIncomeStatus: (income: Income) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onToggleExpensePaid: (expense: Expense) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenSendEmailModal?: (props: {
    recipientEmail?: string;
    recipientName?: string;
    subject?: string;
    message?: string;
    attachments?: any[];
  }) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  incomes,
  expenses,
  clients,
  projects,
  currencyFilter,
  initialTab = 'receitas',
  initialFilter,
  onOpenNewIncomeModal,
  onOpenNewExpenseModal,
  onEditIncome,
  onDeleteIncome,
  onToggleIncomeStatus,
  onEditExpense,
  onDeleteExpense,
  onToggleExpensePaid,
  onOpenWhatsAppCharge,
  onOpenSendEmailModal,
  settings,
  reserves = [],
  canEditCash = false,
  onSaveReserve,
  onDistribute,
}) => {
  const { t, lang } = useLanguage();
  // Caixa antes → depois de cada movimento real, na moeda padrão da empresa.
  const cashCurrency: CurrencyCode = settings?.defaultCurrency || 'BRL';
  // Valor de uma transação na moeda escolhida, ao câmbio do dia em que aconteceu.
  const renderAtDate = (amount: number, cur: CurrencyCode, date?: string) => {
    if (!settings || cur === cashCurrency) return null;
    const day = (date || '').slice(0, 10);
    const r = day ? settings.rateAt?.(day) : undefined;
    const v = r ? convertWith(amount, cur, cashCurrency, r) : convertCurrency(amount, cur, cashCurrency, settings.exchangeRates);
    return (
      <span className="block text-[11px] font-medium text-fg-muted" title={r ? `1 ${cur} = ${(v / (amount || 1)).toFixed(4)} ${cashCurrency}` : undefined}>
        ≈ {formatCurrency(v, cashCurrency)} {r ? (lang === 'en' ? `(rate of ${formatDate(day)})` : `(câmbio de ${formatDate(day)})`) : (lang === 'en' ? "(today's rate)" : '(câmbio de hoje)')}
      </span>
    );
  };
  const timeline = React.useMemo(
    () => cashTimeline(incomes, expenses, projects, (amount, from) => (settings ? convertCurrency(amount, from, cashCurrency, settings.exchangeRates) : amount)),
    [incomes, expenses, projects, settings, cashCurrency],
  );
  const renderCashStep = (step?: { before: number; after: number }) =>
    step ? (
      <span className="block mt-0.5 text-[11px] font-normal text-fg-muted whitespace-nowrap" title={lang === 'en' ? 'Cash before → after this movement' : 'Caixa antes → depois deste movimento'}>
        {lang === 'en' ? 'Cash' : 'Caixa'}: {formatCurrency(step.before, cashCurrency)} → <strong className="font-medium text-fg-secondary">{formatCurrency(step.after, cashCurrency)}</strong>
      </span>
    ) : null;
  // "despesas"/"despesas-mes" abrem o separador Despesas; os restantes filtros aplicam-se às receitas
  const wantsExpenses = initialFilter === 'despesas' || initialFilter === 'despesas-mes';
  const [subTab, setSubTab] = useState<'receitas' | 'despesas' | 'agenda' | 'caixa'>(initialFilter === 'reservas' ? 'caixa' : wantsExpenses ? 'despesas' : initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter && !wantsExpenses ? initialFilter : 'ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Sync subTab & statusFilter whenever initialFilter or initialTab prop changes
  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter === 'despesas' || initialFilter === 'despesas-mes') {
        setSubTab('despesas');
      } else if (initialFilter === 'reservas') {
        setSubTab('caixa');
      } else {
        setSubTab('receitas');
        setStatusFilter(initialFilter);
      }
    }
  }, [initialFilter]);

  React.useEffect(() => {
    // um filtro de despesas manda no separador; sem ele vale o initialTab
    if (initialTab && !wantsExpenses) {
      setSubTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

  // Filtered Incomes
  const filteredIncomes = incomes.filter((inc) => {
    if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return false;

    // Contas a Receber — eliminar apenas as já recebidas
    if ((statusFilter === 'receitas-pendentes' || statusFilter === 'pendentes') && inc.status === 'Recebido') return false;

    // Recebidas — mostrar apenas recebidas
    if ((statusFilter === 'receitas-recebidas' || statusFilter === 'recebidos') && inc.status !== 'Recebido') return false;

    // Inadimplência — eliminar SEMPRE as recebidas, e eliminar as que ainda não venceram
    if (statusFilter === 'receitas-atrasadas' || statusFilter === 'atrasados') {
      if (inc.status === 'Recebido') return false;
      if (inc.status !== 'Atrasado' && getDaysDiff(inc.dueDate) >= 0) return false;
    }

    // Cobrar Hoje — eliminar recebidas, eliminar futuras, eliminar projetos pausados
    if (statusFilter === 'cobrar-hoje') {
      if (inc.status === 'Recebido') return false;
      if (getDaysDiff(inc.dueDate) > 0) return false;
      if (inc.projectId) {
        const proj = projects.find((p) => p.id === inc.projectId);
        if (proj?.status === 'Aguardando cliente' || proj?.status === 'Cancelado') return false;
      }
    }

    if (
      statusFilter !== 'ALL' &&
      !['receitas-pendentes', 'pendentes', 'receitas-recebidas', 'recebidos', 'receitas-atrasadas', 'atrasados', 'cobrar-hoje'].includes(statusFilter) &&
      inc.status !== statusFilter
    ) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const client = clientMap.get(inc.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const desc = inc.description.toLowerCase();
      return clientName.includes(q) || desc.includes(q);
    }

    return true;
  });

  // Filtered Expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return false;

    if (expenseCategoryFilter !== 'ALL' && exp.category !== expenseCategoryFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return exp.description.toLowerCase().includes(q) || exp.category.toLowerCase().includes(q);
    }

    return true;
  });

  // --- CALENDAR LOGIC ---
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const formatDateKey = (dayNum: number) => {
    const m = String(calendarMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${calendarYear}-${m}-${d}`;
  };

  const getCalendarEventsForDay = (dayNum: number) => {
    const key = formatDateKey(dayNum);
    const events: { id: string; type: 'income' | 'expense' | 'project'; text: string; color: string }[] = [];

    incomes.forEach((inc) => {
      if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return;
      if (inc.dueDate === key) {
        const client = clientMap.get(inc.clientId);
        const name = client?.name ? client.name.split(' ')[0] : 'Cliente';
        const isPaid = inc.status === 'Recebido';
        events.push({
          id: `inc-${inc.id}`,
          type: 'income',
          text: `Vence: ${name} (${formatCurrency(inc.amount, inc.currency)})`,
          color: isPaid ? 'bg-success-soft text-success-fg border-success/20' : 'bg-warning-soft text-warning-fg border-warning/20',
        });
      }
    });

    expenses.forEach((exp) => {
      if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return;
      if (exp.date === key) {
        events.push({
          id: `exp-${exp.id}`,
          type: 'expense',
          text: `Despesa: ${exp.description || 'Despesa'} (${formatCurrency(exp.amount, exp.currency)})`,
          color: exp.paid ? 'bg-surface-3 text-fg-secondary border-line-subtle' : 'bg-danger-soft text-danger-fg border-[#93000a]/20',
        });
      }
    });

    projects.forEach((proj) => {
      if (currencyFilter !== 'ALL' && proj.currency !== currencyFilter) return;
      if (proj.dueDate === key) {
        const client = clientMap.get(proj.clientId);
        const name = client?.name ? client.name.split(' ')[0] : 'Cliente';
        const projName = proj?.name || 'Projeto';
        events.push({
          id: `proj-${proj.id}`,
          type: 'project',
          text: `Entrega: ${projName} (${name})`,
          color: proj.status === 'Concluído' ? 'bg-surface-2 text-fg-secondary border-line-subtle' : 'bg-accent-soft text-accent-soft-fg border-accent/20',
        });
      }
    });

    return events;
  };

  const monthNamesPT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthNamesEN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNames = lang === 'en' ? monthNamesEN : monthNamesPT;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">{t('financial.title', 'Módulo Financeiro')}</h1>
            <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">{t('financial.subtitle', 'Gestão de receitas, despesas operacionais e agenda financeira unificada')}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenNewIncomeModal}
            className="aura-btn aura-btn--primary w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{t('financial.newIncome', 'Nova Receita')}</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-fg border border-line-subtle font-medium text-sm rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('financial.newExpense', 'Nova Despesa')}</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-warning-soft hover:opacity-85 text-warning-fg border border-transparent font-medium text-sm rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            title={lang === 'en' ? 'Register owner withdrawal or cash out' : 'Registar um levantamento do proprietário ou uma saída de caixa'}
          >
            <Receipt className="w-4 h-4" />
            <span>{t('financial.registerWithdrawal', 'Registar levantamento')}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 bg-surface-2 border border-line-subtle p-1 rounded-full w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setSubTab('receitas')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer ${
 subTab === 'receitas'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:text-fg '
 }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> <span>{t('financial.tabIncomes', 'Receitas')} ({filteredIncomes.length})</span>
        </button>

        <button
          onClick={() => setSubTab('despesas')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer ${
 subTab === 'despesas'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:text-fg '
 }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" /> <span>{t('financial.tabExpenses', 'Despesas')} ({filteredExpenses.length})</span>
        </button>

        <button
          onClick={() => setSubTab('agenda')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
 subTab === 'agenda'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:text-fg '
 }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> <span>{t('financial.tabCalendar', 'Agenda Financeira')}</span>
        </button>

        {settings && onSaveReserve && onDistribute && (
          <button
            onClick={() => setSubTab('caixa')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subTab === 'caixa' ? 'bg-primary shadow-primary-3d text-primary-fg' : 'text-fg-secondary hover:text-fg '
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" /> <span>{lang === 'en' ? 'Cash & partners' : 'Caixa e sócios'}</span>
          </button>
        )}
      </div>

      {subTab === 'caixa' && settings && onSaveReserve && onDistribute && (
        <CashPanel
          incomes={incomes}
          expenses={expenses}
          projects={projects}
          settings={settings}
          reserves={reserves}
          currencyFilter={currencyFilter}
          lang={lang}
          canEdit={canEditCash}
          onSaveReserve={onSaveReserve}
          onDistribute={onDistribute}
        />
      )}

      {/* TAB 1: RECEITAS */}
      {subTab === 'receitas' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-glass border border-line-subtle p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-glass">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('financial.searchPlaceholder', 'Pesquisar por cliente ou descrição...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-line-subtle rounded-full text-fg text-sm placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-surface-2 border border-line-subtle rounded-full text-fg text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('financial.allStatuses', 'Todos os estados')}</option>
              <option value="receitas-pendentes">{t('financial.receivables', 'Contas a Receber (Pendentes)')}</option>
              <option value="cobrar-hoje">{t('financial.dueTodayOverdue', 'Cobranças de Hoje / Atrasadas')}</option>
              <option value="receitas-atrasadas">{t('financial.overdue', 'Contas em Atraso')}</option>
              <option value="receitas-recebidas">{t('financial.receivedIncomes', 'Receitas Recebidas')}</option>
            </select>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 statusFilter === 'ALL'
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
            >
              {t('financial.filterAll', 'Todas')} ({incomes.length})
            </button>

            <button
              onClick={() => setStatusFilter('receitas-pendentes')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 statusFilter === 'receitas-pendentes' || statusFilter === 'pendentes' || statusFilter === 'Pendente'
 ? 'bg-accent text-white'
 : 'text-accent-soft-fg hover:bg-accent-soft '
 }`}
            >
              {t('financial.filterReceivables', 'Contas a Receber')} ({incomes.filter((i) => i.status !== 'Recebido').length})
            </button>

            <button
              onClick={() => setStatusFilter('cobrar-hoje')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 statusFilter === 'cobrar-hoje'
 ? 'bg-warning text-white'
 : 'text-warning-fg hover:bg-warning-soft '
 }`}
            >
              {t('financial.filterDueToday', 'Cobrar Hoje')} ({incomes.filter((i) => i.status !== 'Recebido' && getDaysDiff(i.dueDate) <= 0).length})
            </button>

            <button
              onClick={() => setStatusFilter('receitas-atrasadas')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 statusFilter === 'receitas-atrasadas' || statusFilter === 'atrasados' || statusFilter === 'Atrasado'
 ? 'bg-danger text-white'
 : 'text-danger-fg hover:bg-danger-soft '
 }`}
            >
              {t('financial.filterOverdue', 'Em Atraso')} ({incomes.filter((i) => i.status === 'Atrasado' || (i.status === 'Pendente' && getDaysDiff(i.dueDate) < 0)).length})
            </button>

            <button
              onClick={() => setStatusFilter('receitas-recebidas')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 statusFilter === 'receitas-recebidas' || statusFilter === 'recebidos' || statusFilter === 'Recebido'
 ? 'bg-success text-white'
 : 'text-success-fg hover:bg-success-soft '
 }`}
            >
              {t('financial.filterReceived', 'Recebidas')} ({incomes.filter((i) => i.status === 'Recebido').length})
            </button>
          </div>

          {/* Receitas List */}
          {filteredIncomes.length === 0 ? (
            <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-fg-disabled mx-auto" />
              <h3 className="text-sm font-semibold text-fg ">{t('financial.noIncomesFound', 'Nenhuma receita encontrada')}</h3>
              <button
                onClick={onOpenNewIncomeModal}
                className="aura-btn aura-btn--primary aura-btn--sm inline-flex gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t('financial.newIncome', 'Nova receita')}
              </button>
            </div>
          ) : (
            <div className="bg-glass border border-line-subtle rounded-xl overflow-hidden shadow-glass">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-fg-secondary font-medium text-[13px] border-b border-line-subtle ">
                    <tr>
                      <th className="px-5 py-4">{t('financial.colClientProject', 'Cliente & Projeto')}</th>
                      <th className="px-5 py-4">{t('financial.colDescription', 'Descrição')}</th>
                      <th className="px-5 py-4">{t('financial.colAmount', 'Valor')}</th>
                      <th className="px-5 py-4">{t('financial.colDueDate', 'Data Prevista')}</th>
                      <th className="px-5 py-4">{t('financial.colPaymentMethod', 'Forma Pgt')}</th>
                      <th className="px-5 py-4">{t('financial.colStatus', 'Estado')}</th>
                      <th className="px-5 py-4 text-right">{t('financial.colActions', 'Ações')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle ">
                    {filteredIncomes.map((inc) => {
                      const client = clientMap.get(inc.clientId);
                      const project = inc.projectId ? projectMap.get(inc.projectId) : null;
                      const diffDays = getDaysDiff(inc.dueDate);
                      const isOverdue = inc.status !== 'Recebido' && diffDays < 0;

                      return (
                        <tr key={inc.id} className="hover:bg-sunken transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-fg text-sm">
                              {client?.name || (lang === 'en' ? 'Client' : 'Cliente')}
                            </div>
                            {project && (
                              <div className="text-xs text-fg-muted ">
                                {project?.name || ''}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 font-medium text-fg ">
                            {inc.description}
                          </td>

                          <td className="px-5 py-4 font-semibold text-success-fg text-sm">
                            {formatCurrency(inc.amount, inc.currency)}
                            {renderAtDate(inc.amount, inc.currency, inc.status === 'Recebido' ? (inc.receivedDate || inc.dueDate) : inc.dueDate)}
                            {renderCashStep(timeline.get('inc:' + inc.id))}
                          </td>

                          <td className="px-5 py-4">
                            <span className={isOverdue ? 'text-danger-fg font-semibold' : 'text-fg '}>
                              {formatDate(inc.dueDate)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-2 text-fg-secondary font-medium text-[11px]">
                                {inc.paymentMethod ? getPaymentMethodLabel(inc.paymentMethod, lang) : 'PIX'}
                              </span>
                              {inc.stripeInvoiceId && (
                                <span className="px-2 py-0.5 rounded-full bg-[#f0efff] text-[#635bff] border border-[#635bff]/20 font-medium text-[10px] flex items-center gap-1">
                                  <CreditCard className="w-2.5 h-2.5" /> Stripe
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() => onToggleIncomeStatus(inc)}
                              className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
 inc.status === 'Recebido'
 ? 'bg-success-soft text-success-fg '
 : isOverdue
 ? 'bg-danger-soft text-danger-fg '
 : 'bg-warning-soft text-warning-fg '
 }`}
                              title={lang === 'en' ? 'Click to change status' : 'Clique para alterar status'}
                            >
                              {inc.status === 'Recebido' ? (
                                <CheckCircle2 className="w-3 h-3 text-success-fg " />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{isOverdue && inc.status !== 'Recebido' ? `${lang === 'en' ? 'Overdue' : 'Atrasado'} (${Math.abs(diffDays)}d)` : getIncomeStatusLabel(inc.status, lang)}</span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Link de pagamento Stripe se pendente */}
                              {inc.stripeInvoiceUrl && inc.status !== 'Recebido' && (
                                <a
                                  href={inc.stripeInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-[#635bff] hover:bg-[#f0efff] rounded-full transition-colors"
                                  title={lang === 'en' ? 'Open Stripe payment link' : 'Abrir link de pagamento Stripe'}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}

                              {/* Download PDF da fatura Stripe */}
                              {inc.stripeInvoicePdf && (
                                <a
                                  href={inc.stripeInvoicePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-[#635bff] hover:bg-[#f0efff] rounded-full transition-colors"
                                  title={lang === 'en' ? 'Download Stripe Invoice (PDF)' : 'Baixar Fatura Stripe (PDF)'}
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                              )}

                              {/* Download Recibo de pagamento Stripe (se pago) */}
                              {inc.stripeReceiptUrl && inc.status === 'Recebido' && (
                                <a
                                  href={inc.stripeReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-success-fg hover:bg-success-soft rounded-full transition-colors"
                                  title={lang === 'en' ? 'Download Stripe Payment Receipt' : 'Baixar Recibo de Pagamento Stripe'}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}

                              {client?.whatsapp && inc.status !== 'Recebido' && (
                                <button
                                  onClick={() => {
                                    const stripeLink = inc.stripeInvoiceUrl ? (lang === 'en' ? `\nPayment link: ${inc.stripeInvoiceUrl}` : `\nLink para pagamento: ${inc.stripeInvoiceUrl}`) : '';
                                    const clientName = client?.name || (lang === 'en' ? 'Client' : 'Cliente');
                                    const text = lang === 'en'
                                      ? `Hello, ${clientName}! How are you? A reminder about the payment for "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}) due on ${formatDate(inc.dueDate)}.${stripeLink}\n\nThank you!`
                                      : `Olá, ${clientName}! Tudo bem? Passando para lembrar do valor referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}) com vencimento em ${formatDate(inc.dueDate)}.${stripeLink}\n\nObrigado!`;
                                    onOpenWhatsAppCharge(client.whatsapp, text);
                                  }}
                                  className="p-1.5 text-warning-fg hover:bg-warning-soft rounded-full transition-colors"
                                  title={t('financial.chargeViaWhatsApp', 'Cobrar via WhatsApp')}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {onOpenSendEmailModal && client?.email && (
                                <button
                                  onClick={() => {
                                    const clientName = client?.name || (lang === 'en' ? 'Client' : 'Cliente');
                                    onOpenSendEmailModal({
                                      recipientEmail: client.email,
                                      recipientName: clientName,
                                      subject:
                                        inc.status === 'Recebido'
                                          ? (lang === 'en' ? `Payment Receipt: ${inc.description}` : `Comprovativo de Pagamento: ${inc.description}`)
                                          : (lang === 'en' ? `Payment Reminder: ${inc.description}` : `Lembrete de Cobrança: ${inc.description}`),
                                      message: lang === 'en'
                                        ? `Hello, ${clientName}!\n\n${
                                            inc.status === 'Recebido'
                                              ? 'We confirm receipt of the payment'
                                              : 'This is a reminder regarding the payment'
                                          } for "${inc.description}" (${formatCurrency(
                                            inc.amount,
                                            inc.currency
                                          )}).${inc.stripeInvoiceUrl ? `\n\nOnline invoice link: ${inc.stripeInvoiceUrl}` : ''}\n\nIf you have any questions, feel free to contact us.`
                                        : `Olá, ${clientName}!\n\n${
                                            inc.status === 'Recebido'
                                              ? 'Confirmamos o recebimento do pagamento'
                                              : 'Lembramos o pagamento do valor'
                                          } referente a "${inc.description}" (${formatCurrency(
                                            inc.amount,
                                            inc.currency
                                          )}).${inc.stripeInvoiceUrl ? `\n\nLink da fatura para pagamento online: ${inc.stripeInvoiceUrl}` : ''}\n\nQualquer dúvida, estamos à disposição.`,
                                      attachments: project?.attachments
                                        ? project.attachments.map((att) => ({
                                            filename: att.name,
                                            content: att.url,
                                          }))
                                        : [],
                                    });
                                  }}
                                  className="p-1.5 text-accent-soft-fg hover:bg-accent-soft rounded-full transition-colors cursor-pointer"
                                  title={t('financial.sendEmail', 'Enviar E-mail via Resend')}
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onEditIncome(inc)}
                                className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                                title={t('common.edit', 'Editar')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteIncome(inc.id)}
                                className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                                title={t('common.delete', 'Eliminar')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DESPESAS */}
      {subTab === 'despesas' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-glass border border-line-subtle p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-glass">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search by expense description...' : 'Pesquisar por descrição de despesa...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-line-subtle rounded-full text-fg text-sm placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>

            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-surface-2 border border-line-subtle rounded-full text-fg text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('financial.allCategories', 'Todas as categorias')}</option>
              {/* Todas as categorias conhecidas e as que já existem nas despesas (incl. retiradas e comissões) */}
              {Array.from(new Set([...Object.keys(EXPENSE_CATEGORY_LABELS), ...expenses.map((e) => e.category)])).map((cat) => (
                <option key={cat} value={cat}>{getExpenseCategoryLabel(cat, lang)}</option>
              ))}
            </select>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-fg-disabled mx-auto" />
              <h3 className="text-sm font-semibold text-fg ">{t('financial.noExpensesFound', 'Ainda não há despesas')}</h3>
              <button
                onClick={onOpenNewExpenseModal}
                className="aura-btn aura-btn--primary aura-btn--sm inline-flex gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t('financial.newExpense', 'Nova despesa')}
              </button>
            </div>
          ) : (
            <div className="bg-glass border border-line-subtle rounded-xl overflow-hidden shadow-glass">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-fg-secondary font-medium text-[13px] border-b border-line-subtle ">
                    <tr>
                      <th className="px-5 py-4">{t('financial.colCategory', 'Categoria')}</th>
                      <th className="px-5 py-4">{t('financial.colDescription', 'Descrição')}</th>
                      <th className="px-5 py-4">{t('financial.colAmount', 'Valor')}</th>
                      <th className="px-5 py-4">{t('financial.colDueDate', 'Data Vencimento')}</th>
                      <th className="px-5 py-4">{t('financial.colPaid', 'Pago?')}</th>
                      <th className="px-5 py-4 text-right">{t('financial.colActions', 'Ações')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle ">
                    {filteredExpenses.map((exp) => {
                      const diffDays = getDaysDiff(exp.date);
                      const isOverdue = !exp.paid && diffDays < 0;

                      return (
                        <tr key={exp.id} className="hover:bg-sunken transition-colors">
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 text-fg-secondary font-medium text-[11px]">
                              {getExpenseCategoryLabel(exp.category, lang)}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-medium text-fg ">
                            {exp.description}
                          </td>

                          <td className="px-5 py-4 font-semibold text-danger-fg text-sm">
                            {formatCurrency(exp.amount, exp.currency)}
                            {renderAtDate(exp.amount, exp.currency, exp.date)}
                            {renderCashStep(timeline.get('exp:' + exp.id))}
                          </td>

                          <td className="px-5 py-4">
                            <span className={isOverdue ? 'text-danger-fg font-semibold' : 'text-fg-muted '}>
                              {formatDate(exp.date)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() => onToggleExpensePaid(exp)}
                              className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
 exp.paid
 ? 'bg-success-soft text-success-fg '
 : 'bg-warning-soft text-warning-fg '
 }`}
                              title={lang === 'en' ? 'Click to change status' : 'Clique para alterar status'}
                            >
                              {exp.paid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{exp.paid ? (lang === 'en' ? 'Paid' : 'Pago') : (lang === 'en' ? 'Pending' : 'Pendente')}</span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => onEditExpense(exp)}
                                className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                                title={t('common.edit', 'Editar')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                                title={t('common.delete', 'Eliminar')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENDA FINANCEIRA (CALENDÁRIO) */}
      {subTab === 'agenda' && (
        <div className="bg-glass border border-line-subtle rounded-xl p-6 shadow-glass space-y-6">
          
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-fg tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-accent-soft-fg " />
              {monthNames[calendarMonth]} {calendarYear}
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                className="p-2 rounded-full bg-surface-2 text-fg-secondary hover:text-fg hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date())}
                className="aura-btn aura-btn--secondary aura-btn--sm"
              >
                {lang === 'en' ? 'Today' : 'Hoje'}
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                className="p-2 rounded-full bg-surface-2 text-fg-secondary hover:text-fg hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[13px] font-medium text-fg-secondary ">
            {(lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']).map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-surface-2 rounded-lg border border-line-subtle opacity-40" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const events = getCalendarEventsForDay(dayNum);
              const key = formatDateKey(dayNum);
              const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
              const isTodayDay = key === todayStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`h-28 p-2 rounded-lg border text-xs flex flex-col justify-between overflow-hidden transition-all ${
 isTodayDay
 ? 'bg-glass-strong border-fg shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
 : 'bg-glass-strong border-line-subtle hover:border-line-strong hover:bg-sunken '
 }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
 isTodayDay
 ? 'w-6 h-6 rounded-full bg-primary shadow-primary-3d text-primary-fg flex items-center justify-center font-semibold'
 : 'font-medium text-fg '
 }`}
                    >
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] text-fg-muted font-medium">
                        {events.length}x
                      </span>
                    )}
                  </div>

                  {/* Events list inside cell */}
                  <div className="space-y-1 overflow-y-auto max-h-20 my-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] p-1 rounded-xs font-medium border truncate ${ev.color}`}
                        title={ev.text}
                      >
                        {ev.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
