import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  Income,
  Expense,
  Client,
  Project,
  CurrencyCode,
} from '../types';
import {
  formatCurrency,
  formatDate,
  getDaysDiff,
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
        const name = client ? client.name.split(' ')[0] : 'Cliente';
        const isPaid = inc.status === 'Recebido';
        events.push({
          id: `inc-${inc.id}`,
          type: 'income',
          text: `💰 Vence: ${name} (${formatCurrency(inc.amount, inc.currency)})`,
          color: isPaid ? 'bg-[#d4eddf] text-[#1a6b3a] border-[#1a6b3a]/20' : 'bg-[#fff3d6] text-[#7a5400] border-[#7a5400]/20',
        });
      }
    });

    expenses.forEach((exp) => {
      if (currencyFilter !== 'ALL' && exp.currency !== currencyFilter) return;
      if (exp.date === key) {
        events.push({
          id: `exp-${exp.id}`,
          type: 'expense',
          text: `💸 Despesa: ${exp.description} (${formatCurrency(exp.amount, exp.currency)})`,
          color: exp.paid ? 'bg-[#e5e2e1] text-[#444747] border-[#c4c7c7]/30' : 'bg-[#ffdad6] text-[#93000a] border-[#93000a]/20',
        });
      }
    });

    projects.forEach((proj) => {
      if (currencyFilter !== 'ALL' && proj.currency !== currencyFilter) return;
      if (proj.dueDate === key) {
        const client = clientMap.get(proj.clientId);
        const name = client ? client.name.split(' ')[0] : 'Cliente';
        events.push({
          id: `proj-${proj.id}`,
          type: 'project',
          text: `🚀 Entrega: ${proj.name} (${name})`,
          color: proj.status === 'Concluído' ? 'bg-[#f1edec] text-[#444747] border-[#c4c7c7]/30' : 'bg-[#dbe1ff] text-[#003da9] border-[#003da9]/20',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">Módulo Financeiro</h2>
            <p className="text-xs text-[#747878] mt-0.5">Gestão de receitas, despesas operacionais e agenda financeira unificada</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenNewIncomeModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Nova Receita</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] border border-[#c4c7c7]/40 font-medium text-sm rounded-[29px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#fff3d6] hover:opacity-85 text-[#7a5400] font-medium text-sm rounded-[29px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            title="Registrar retirada própria ou saída de caixa do saldo real"
          >
            <Receipt className="w-4 h-4" />
            <span>Registrar Retirada</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 bg-[#f1edec] border border-[#c4c7c7]/35 p-1 rounded-full w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setSubTab('receitas')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'receitas'
              ? 'bg-[#000000] text-white'
              : 'text-[#444747] hover:text-[#1c1b1b]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> <span>Receitas ({filteredIncomes.length})</span>
        </button>

        <button
          onClick={() => setSubTab('despesas')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'despesas'
              ? 'bg-[#000000] text-white'
              : 'text-[#444747] hover:text-[#1c1b1b]'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" /> <span>Despesas ({filteredExpenses.length})</span>
        </button>

        <button
          onClick={() => setSubTab('agenda')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            subTab === 'agenda'
              ? 'bg-[#000000] text-white'
              : 'text-[#444747] hover:text-[#1c1b1b]'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> <span>Agenda Financeira</span>
        </button>
      </div>

      {/* TAB 1: RECEITAS */}
      {subTab === 'receitas' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-white border border-[#c4c7c7]/40 p-4 rounded-[22px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm font-medium focus:outline-none cursor-pointer"
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
            <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-[#c4c7c7] mx-auto" />
              <h3 className="text-sm font-semibold text-[#1c1b1b]">Nenhuma receita encontrada</h3>
              <button
                onClick={onOpenNewIncomeModal}
                className="px-5 py-2 bg-[#000000] text-white font-medium text-xs rounded-[29px] inline-flex items-center gap-1.5 hover:opacity-85 transition-all"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Receita
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f3f2] text-[#747878] font-semibold uppercase tracking-widest text-[11px] border-b border-[#c4c7c7]/40">
                    <tr>
                      <th className="px-5 py-4">Cliente &amp; Projeto</th>
                      <th className="px-5 py-4">Descrição</th>
                      <th className="px-5 py-4">Valor</th>
                      <th className="px-5 py-4">Data Prevista</th>
                      <th className="px-5 py-4">Forma Pgt</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c7c7]/30">
                    {filteredIncomes.map((inc) => {
                      const client = clientMap.get(inc.clientId);
                      const project = inc.projectId ? projectMap.get(inc.projectId) : null;
                      const diffDays = getDaysDiff(inc.dueDate);
                      const isOverdue = inc.status !== 'Recebido' && diffDays < 0;

                      return (
                        <tr key={inc.id} className="hover:bg-[#f7f3f2] transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#1c1b1b] text-sm">
                              {client ? client.name : 'Cliente'}
                            </div>
                            {project && (
                              <div className="text-xs text-[#747878]">
                                {project.name}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 font-medium text-[#1c1b1b]">
                            {inc.description}
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#1a6b3a] text-sm">
                            {formatCurrency(inc.amount, inc.currency)}
                          </td>

                          <td className="px-5 py-4">
                            <span className={isOverdue ? 'text-[#ba1a1a] font-semibold' : 'text-[#1c1b1b]'}>
                              {formatDate(inc.dueDate)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#f1edec] text-[#444747] font-medium text-[11px]">
                                {inc.paymentMethod || 'PIX'}
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
                                  ? 'bg-[#d4eddf] text-[#1a6b3a]'
                                  : isOverdue
                                  ? 'bg-[#ffdad6] text-[#93000a]'
                                  : 'bg-[#fff3d6] text-[#7a5400]'
                              }`}
                              title="Clique para alterar status"
                            >
                              {inc.status === 'Recebido' ? (
                                <CheckCircle2 className="w-3 h-3 text-[#1a6b3a]" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{isOverdue && inc.status !== 'Recebido' ? `Atrasado (${Math.abs(diffDays)}d)` : inc.status}</span>
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
                                  title="Abrir link de pagamento Stripe"
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
                                  title="Baixar Fatura Stripe (PDF)"
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
                                  className="p-1.5 text-[#1a6b3a] hover:bg-[#d4eddf] rounded-full transition-colors"
                                  title="Baixar Recibo de Pagamento Stripe"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}

                              {client?.whatsapp && inc.status !== 'Recebido' && (
                                <button
                                  onClick={() => {
                                    const stripeLink = inc.stripeInvoiceUrl ? `\nLink para pagamento: ${inc.stripeInvoiceUrl}` : '';
                                    const text = `Olá, ${client.name}! Tudo bem? Passando para lembrar do valor referentes a "${inc.description}" (${formatCurrency(inc.amount, inc.currency)}) com vencimento em ${formatDate(inc.dueDate)}.${stripeLink}\n\nObrigado!`;
                                    onOpenWhatsAppCharge(client.whatsapp, text);
                                  }}
                                  className="p-1.5 text-[#7a5400] hover:bg-[#fff3d6] rounded-full transition-colors"
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {onOpenSendEmailModal && client?.email && (
                                <button
                                  onClick={() =>
                                    onOpenSendEmailModal({
                                      recipientEmail: client.email,
                                      recipientName: client.name,
                                      subject:
                                        inc.status === 'Recebido'
                                          ? `Comprovativo de Pagamento: ${inc.description}`
                                          : `Lembrete de Cobrança: ${inc.description}`,
                                      message: `Olá, ${client.name}!\n\n${
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
                                    })
                                  }
                                  className="p-1.5 text-[#0050d7] hover:bg-[#dbe1ff] rounded-full transition-colors cursor-pointer"
                                  title="Enviar E-mail via Resend"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onEditIncome(inc)}
                                className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteIncome(inc.id)}
                                className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
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
          <div className="bg-white border border-[#c4c7c7]/40 p-4 rounded-[22px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por descrição de despesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm font-medium focus:outline-none cursor-pointer"
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
            <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-[#c4c7c7] mx-auto" />
              <h3 className="text-sm font-semibold text-[#1c1b1b]">Nenhuma despesa cadastrada</h3>
              <button
                onClick={onOpenNewExpenseModal}
                className="px-5 py-2 bg-[#000000] text-white font-medium text-xs rounded-[29px] inline-flex items-center gap-1.5 hover:opacity-85 transition-all"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Despesa
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f7f3f2] text-[#747878] font-semibold uppercase tracking-widest text-[11px] border-b border-[#c4c7c7]/40">
                    <tr>
                      <th className="px-5 py-4">Categoria</th>
                      <th className="px-5 py-4">Descrição</th>
                      <th className="px-5 py-4">Valor</th>
                      <th className="px-5 py-4">Data Vencimento</th>
                      <th className="px-5 py-4">Pago?</th>
                      <th className="px-5 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c7c7]/30">
                    {filteredExpenses.map((exp) => {
                      const diffDays = getDaysDiff(exp.date);
                      const isOverdue = !exp.paid && diffDays < 0;

                      return (
                        <tr key={exp.id} className="hover:bg-[#f7f3f2] transition-colors">
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#f1edec] text-[#444747] font-medium text-[11px]">
                              {exp.category}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-medium text-[#1c1b1b]">
                            {exp.description}
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#ba1a1a] text-sm">
                            {formatCurrency(exp.amount, exp.currency)}
                          </td>

                          <td className="px-5 py-4">
                            <span className={isOverdue ? 'text-[#ba1a1a] font-semibold' : 'text-[#747878]'}>
                              {formatDate(exp.date)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() => onToggleExpensePaid(exp)}
                              className={`px-2.5 py-1 rounded-full font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                                exp.paid
                                  ? 'bg-[#d4eddf] text-[#1a6b3a]'
                                  : 'bg-[#fff3d6] text-[#7a5400]'
                              }`}
                            >
                              {exp.paid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{exp.paid ? 'Pago' : 'Pendente'}</span>
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => onEditExpense(exp)}
                                className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
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
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
          
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#0050d7]" />
              {monthNamesPT[calendarMonth]} {calendarYear}
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                className="p-2 rounded-full bg-[#f1edec] text-[#444747] hover:text-[#1c1b1b] hover:bg-[#e5e2e1] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-3.5 py-1.5 rounded-full bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1] text-xs font-medium transition-colors cursor-pointer"
              >
                Hoje
              </button>

              <button
                onClick={() => setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                className="p-2 rounded-full bg-[#f1edec] text-[#444747] hover:text-[#1c1b1b] hover:bg-[#e5e2e1] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-[#747878] uppercase tracking-widest">
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
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-[#f7f3f2] rounded-[16px] border border-[#c4c7c7]/20 opacity-40" />
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
                  className={`h-28 p-2 rounded-[16px] border text-xs flex flex-col justify-between overflow-hidden transition-all ${
                    isTodayDay
                      ? 'bg-white border-[#000000] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                      : 'bg-white border-[#c4c7c7]/30 hover:border-[#c4c7c7] hover:bg-[#f7f3f2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isTodayDay
                          ? 'w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center font-semibold'
                          : 'font-medium text-[#1c1b1b]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] text-[#747878] font-medium">
                        {events.length}x
                      </span>
                    )}
                  </div>

                  {/* Events list inside cell */}
                  <div className="space-y-1 overflow-y-auto max-h-20 my-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] p-1 rounded-md font-medium border truncate ${ev.color}`}
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
