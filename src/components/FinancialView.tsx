import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Check,
} from 'lucide-react';
import {
  Income,
  Expense,
  Client,
  Project,
  CurrencyCode,
  IncomeStatus,
  ExpenseCategory,
  PaymentMethod,
} from '../types';
import {
  formatCurrency,
  formatDate,
  getDaysDiff,
  generateWhatsAppLink,
} from '../lib/formatters';

interface FinancialViewProps {
  incomes: Income[];
  expenses: Expense[];
  clients: Client[];
  projects: Project[];
  currencyFilter: CurrencyCode | 'ALL';
  initialTab?: 'receitas' | 'despesas' | 'agenda';
  initialFilter?: string;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (incomeId: string) => void;
  onToggleIncomeStatus: (income: Income) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onToggleExpensePaid: (expense: Expense) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
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
}) => {
  const [subTab, setSubTab] = useState<'receitas' | 'despesas' | 'agenda'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || 'ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

  // Filtered Incomes
  const filteredIncomes = incomes.filter((inc) => {
    if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return false;

    if (statusFilter === 'receitas-pendentes' && inc.status === 'Recebido') return false;
    if (statusFilter === 'receitas-recebidas' && inc.status !== 'Recebido') return false;
    if (statusFilter === 'receitas-atrasadas' && inc.status !== 'Atrasado' && getDaysDiff(inc.dueDate) >= 0) return false;
    if (statusFilter === 'cobrar-hoje' && (inc.status === 'Recebido' || getDaysDiff(inc.dueDate) > 0)) return false;
    if (
      statusFilter !== 'ALL' &&
      !['receitas-pendentes', 'receitas-recebidas', 'receitas-atrasadas', 'cobrar-hoje'].includes(statusFilter) &&
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

  // Helper to format date YYYY-MM-DD
  const formatDateKey = (dayNum: number) => {
    const m = String(calendarMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${calendarYear}-${m}-${d}`;
  };

  // Collect calendar events for the active month
  const getCalendarEventsForDay = (dayNum: number) => {
    const key = formatDateKey(dayNum);
    const events: { id: string; type: 'income' | 'expense' | 'project'; text: string; color: string }[] = [];

    // Incomes due or received on this day
    incomes.forEach((inc) => {
      if (currencyFilter !== 'ALL' && inc.currency !== currencyFilter) return;
      if (inc.dueDate === key) {
        const client = clientMap.get(inc.clientId);
        const name = client ? client.name.split(' ')[0] : 'Cliente';
        const isPaid = inc.status === 'Recebido';
        events.push({
          id: `inc-${inc.id}`,
          type: 'income',
          text: `💰 Vence: ${name} (${formatCurrency(inc.amount, inc.currency)})`,
          color: isPaid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        });
      }
    });

    // Expenses due on this day
    expenses.forEach((exp) => {
      if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return;
      if (exp.date === key) {
        events.push({
          id: `exp-${exp.id}`,
          type: 'expense',
          text: `💸 Despesa: ${exp.description} (${formatCurrency(exp.amount, exp.currency)})`,
          color: exp.paid ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        });
      }
    });

    // Projects due on this day
    projects.forEach((proj) => {
      if (currencyFilter !== 'ALL' && proj.currency !== currencyFilter) return;
      if (proj.dueDate === key) {
        const client = clientMap.get(proj.clientId);
        const name = client ? client.name.split(' ')[0] : 'Cliente';
        events.push({
          id: `proj-${proj.id}`,
          type: 'project',
          text: `🚀 Entrega: ${proj.name} (${name})`,
          color: proj.status === 'Concluído' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        });
      }
    });

    return events;
  };

  const monthNamesPT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Módulo Financeiro
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestão de receitas, despesas operacionais e agenda financeira unificada
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenNewIncomeModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Receita</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Registrar retirada própria ou saída de caixa do saldo real"
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Registrar Saída / Retirada</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setSubTab('receitas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'receitas'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Receitas ({filteredIncomes.length})
        </button>

        <button
          onClick={() => setSubTab('despesas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'despesas'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" /> Despesas ({filteredExpenses.length})
        </button>

        <button
          onClick={() => setSubTab('agenda')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            subTab === 'agenda'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" /> Agenda Financeira
        </button>
      </div>

      {/* TAB 1: RECEITAS */}
      {subTab === 'receitas' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Recebido">Recebido</option>
              <option value="Atrasado">Atrasado</option>
              <option value="cobrar-hoje">Atrasado ou Vence Hoje</option>
            </select>
          </div>

          {/* Receitas List */}
          {filteredIncomes.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Nenhuma receita encontrada</h3>
              <button
                onClick={onOpenNewIncomeModal}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Receita
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Cliente &amp; Projeto</th>
                      <th className="px-4 py-3.5">Descrição</th>
                      <th className="px-4 py-3.5">Valor</th>
                      <th className="px-4 py-3.5">Data Prevista</th>
                      <th className="px-4 py-3.5">Forma Pgt</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIncomes.map((inc) => {
                      const client = clientMap.get(inc.clientId);
                      const project = inc.projectId ? projectMap.get(inc.projectId) : null;
                      const diffDays = getDaysDiff(inc.dueDate);
                      const isOverdue = inc.status !== 'Recebido' && diffDays < 0;

                      return (
                        <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 text-sm">
                              {client ? client.name : 'Cliente'}
                            </div>
                            {project && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                {project.name}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-medium text-slate-700">
                            {inc.description}
                          </td>

                          <td className="px-4 py-3.5 font-extrabold text-emerald-700 text-sm">
                            {formatCurrency(inc.amount, inc.currency)}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                              {formatDate(inc.dueDate)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
                              {inc.paymentMethod || 'PIX'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => onToggleIncomeStatus(inc)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 border ${
                                inc.status === 'Recebido'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                              title="Clique para alterar status"
                            >
                              {inc.status === 'Recebido' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>{isOverdue && inc.status !== 'Recebido' ? `Atrasado (${Math.abs(diffDays)}d)` : inc.status}</span>
                            </button>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {client?.whatsapp && inc.status !== 'Recebido' && (
                                <button
                                  onClick={() => {
                                    const text = `Olá, ${client.name}! Tudo bem? Passando para lembrar do valor referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}) com vencimento em ${formatDate(inc.dueDate)}. Obrigado!`;
                                    onOpenWhatsAppCharge(client.whatsapp, text);
                                  }}
                                  className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onEditIncome(inc)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteIncome(inc.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Excluir"
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
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por descrição de despesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>

            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Internet">Internet</option>
              <option value="Hospedagem">Hospedagem</option>
              <option value="Domínio">Domínio</option>
              <option value="Publicidade">Publicidade</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Salário">Salário</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Nenhuma despesa cadastrada</h3>
              <button
                onClick={onOpenNewExpenseModal}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Despesa
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Categoria</th>
                      <th className="px-4 py-3.5">Descrição</th>
                      <th className="px-4 py-3.5">Valor</th>
                      <th className="px-4 py-3.5">Data Vencimento</th>
                      <th className="px-4 py-3.5">Pago?</th>
                      <th className="px-4 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => {
                      const diffDays = getDaysDiff(exp.date);
                      const isOverdue = !exp.paid && diffDays < 0;

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[11px]">
                              {exp.category}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-medium text-slate-700">
                            {exp.description}
                          </td>

                          <td className="px-4 py-3.5 font-extrabold text-slate-900 text-sm">
                            {formatCurrency(exp.amount, exp.currency)}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                              {formatDate(exp.date)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => onToggleExpensePaid(exp)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 border ${
                                exp.paid
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                            >
                              {exp.paid ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span>{exp.paid ? 'Pago' : 'Pendente'}</span>
                            </button>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => onEditExpense(exp)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              {monthNamesPT[calendarMonth]} {calendarYear}
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition-colors"
              >
                Hoje
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-slate-50 rounded-xl border border-slate-100 opacity-40" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const events = getCalendarEventsForDay(dayNum);
              const key = formatDateKey(dayNum);
              const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
              const isTodayDay = key === todayStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`h-28 p-1.5 rounded-xl border text-xs flex flex-col justify-between overflow-hidden transition-all ${
                    isTodayDay
                      ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-extrabold text-xs ${
                        isTodayDay
                          ? 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[9px] text-slate-400 font-bold">
                        {events.length}x
                      </span>
                    )}
                  </div>

                  {/* Events list inside cell */}
                  <div className="space-y-1 overflow-y-auto max-h-20 my-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] p-1 rounded font-bold border truncate ${ev.color}`}
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
