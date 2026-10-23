import type { AppSettings, CashReserve, Client, CurrencyCode, Expense, Income, Project } from '../../types';
import { getExpenseCategoryLabel, isProfitDistribution, isCashOut } from '../../types';
import { convertCurrency, convertAtDate } from '../formatters';
import { paidCommissions } from '../finance/projectPayments';
import { owedToPartners, reserveStatuses } from '../finance/cashPosition';

// Os números do relatório financeiro (Excel), separados do desenho para poderem ser testados.
// Tudo vem na moeda principal: a do filtro ou a moeda padrão da empresa.

export interface ReportPeriod { year: string; month: string } // 'ALL' ou '2026' / 'ALL' ou '09'

export interface Movement {
  date: string;
  kind: 'Entrada' | 'Saída';
  category: string;
  description: string;
  client: string;
  project: string;
  reserve: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface MonthRow { key: string; label: string; received: number; costs: number; commissions: number; profit: number; distributions: number; cashFlow: number }

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const round2 = (n: number) => Math.round(n * 100) / 100;

export function periodRange(p: ReportPeriod): { from: string; to: string; label: string } {
  if (p.year === 'ALL') return { from: '0000-01-01', to: '9999-12-31', label: 'Todo o histórico' };
  if (p.month === 'ALL') return { from: `${p.year}-01-01`, to: `${p.year}-12-31`, label: `Ano ${p.year}` };
  const last = new Date(Number(p.year), Number(p.month), 0).getDate();
  return { from: `${p.year}-${p.month}-01`, to: `${p.year}-${p.month}-${String(last).padStart(2, '0')}`, label: `${MONTHS_PT[Number(p.month) - 1]} de ${p.year}` };
}

export function buildFinancialReport(input: {
  incomes: Income[];
  expenses: Expense[];
  projects: Project[];
  clients: Client[];
  reserves: CashReserve[];
  settings: AppSettings;
  currency: CurrencyCode;
  period: ReportPeriod;
  /** Intervalo de dias escolhido nos Relatórios (tem prioridade sobre ano/mês). */
  range?: { from: string; to: string; label: string };
}) {
  const { incomes, expenses, projects, clients, reserves, settings, currency, period } = input;
  const conv = (amount: number, from: CurrencyCode) => round2(convertCurrency(amount || 0, from, currency, settings.exchangeRates));
  // Movimentos: ao câmbio do dia de cada um.
  const convAt = (amount: number, from: CurrencyCode, date: string) => round2(convertAtDate(amount || 0, from, currency, settings, date));
  const range = input.range
    ? { from: input.range.from || '0000-01-01', to: input.range.to || '9999-12-31', label: input.range.label }
    : periodRange(period);
  const inRange = (d: string) => d >= range.from && d <= range.to;
  const clientName = (id?: string) => {
    const c = clients.find((x) => x.id === id);
    return c ? c.name : '';
  };
  const projectOf = (id?: string) => projects.find((x) => x.id === id);
  const reserveName = (id?: string) => reserves.find((r) => r.id === id)?.name || '';

  // Todos os movimentos de dinheiro que já aconteceram, por data.
  type Raw = Omit<Movement, 'balance'>;
  const raw: Raw[] = [];
  for (const i of incomes.filter((x) => x.status === 'Recebido')) {
    const p = projectOf(i.projectId);
    raw.push({ date: (i.receivedDate || i.dueDate || '').slice(0, 10), kind: 'Entrada', category: p?.category || 'Receita', description: i.description, client: clientName(i.clientId || p?.clientId), project: p?.name || '', reserve: '', inflow: convAt(i.amount, i.currency, i.receivedDate || i.dueDate || ''), outflow: 0 });
  }
  for (const e of expenses.filter(isCashOut)) {
    raw.push({ date: (e.date || '').slice(0, 10), kind: 'Saída', category: getExpenseCategoryLabel(e.category, 'pt'), description: e.description, client: '', project: '', reserve: reserveName(e.reserveId), inflow: 0, outflow: convAt(e.amount, e.currency, e.date || '') });
  }
  for (const c of paidCommissions(projects, incomes)) {
    raw.push({ date: c.date, kind: 'Saída', category: 'Comissão de parceiro', description: `Comissão ${c.project.partnerName || ''} - ${c.project.name}`.replace('  ', ' '), client: clientName(c.project.clientId), project: c.project.name, reserve: '', inflow: 0, outflow: convAt(c.amount, c.project.currency, c.date) });
  }
  raw.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'Entrada' ? -1 : 1));

  const opening = round2(raw.filter((m) => m.date < range.from).reduce((s, m) => s + m.inflow - m.outflow, 0));
  let running = opening;
  const movements: Movement[] = raw.filter((m) => inRange(m.date)).map((m) => {
    running = round2(running + m.inflow - m.outflow);
    return { ...m, balance: running };
  });
  const closing = running;

  // Resultado: distribuições a sócios e retiradas não são custo.
  const periodExpenses = expenses.filter((e) => isCashOut(e) && inRange((e.date || '').slice(0, 10)));
  const received = round2(movements.filter((m) => m.kind === 'Entrada').reduce((s, m) => s + m.inflow, 0));
  const costs = round2(periodExpenses.filter((e) => !isProfitDistribution(e)).reduce((s, e) => s + convAt(e.amount, e.currency, e.date || ''), 0));
  const commissions = round2(movements.filter((m) => m.category === 'Comissão de parceiro').reduce((s, m) => s + m.outflow, 0));
  const distributions = round2(periodExpenses.filter(isProfitDistribution).reduce((s, e) => s + convAt(e.amount, e.currency, e.date || ''), 0));
  const profit = round2(received - costs - commissions);

  // Mês a mês dentro do período.
  const monthKeys = Array.from(new Set(movements.map((m) => m.date.slice(0, 7)))).sort();
  const months: MonthRow[] = monthKeys.map((key) => {
    const ms = movements.filter((m) => m.date.startsWith(key));
    const exp = periodExpenses.filter((e) => e.date.startsWith(key));
    const rec = round2(ms.filter((m) => m.kind === 'Entrada').reduce((s, m) => s + m.inflow, 0));
    const cst = round2(exp.filter((e) => !isProfitDistribution(e)).reduce((s, e) => s + convAt(e.amount, e.currency, e.date || ''), 0));
    const com = round2(ms.filter((m) => m.category === 'Comissão de parceiro').reduce((s, m) => s + m.outflow, 0));
    const dist = round2(exp.filter(isProfitDistribution).reduce((s, e) => s + convAt(e.amount, e.currency, e.date || ''), 0));
    const [y, mo] = key.split('-');
    return { key, label: `${MONTHS_PT[Number(mo) - 1]} ${y}`, received: rec, costs: cst, commissions: com, profit: round2(rec - cst - com), distributions: dist, cashFlow: round2(rec - cst - com - dist) };
  });

  // Situação do caixa hoje (independente do período).
  const allIn = raw.reduce((s, m) => s + m.inflow - m.outflow, 0);
  const cashNow = round2(allIn);
  const reserveList = reserveStatuses(reserves, expenses, conv);
  const owed = owedToPartners(expenses, conv);
  const reserved = round2(reserveList.reduce((s, r) => s + r.remaining, 0));

  // Arquivados ficam fora da folha de projetos (não contam no que falta receber).
  const projectRows = projects
    .filter((p) => !p.archived)
    .filter((p) => (period.year === 'ALL' && !input.range) || inRange((p.startDate || p.createdAt || '').slice(0, 10)) || p.status === 'Em andamento' || p.status === 'Aguardando cliente')
    .map((p) => ({
      name: p.name,
      client: clientName(p.clientId),
      category: p.category,
      status: p.status,
      start: p.startDate || '',
      due: p.dueDate || '',
      total: conv(p.totalAmount, p.currency),
      paid: conv(p.paidAmount, p.currency),
      missing: conv(Math.max(0, p.totalAmount - p.paidAmount), p.currency),
      pct: p.totalAmount > 0 ? Math.min(1, p.paidAmount / p.totalAmount) : 0,
    }))
    .sort((a, b) => b.start.localeCompare(a.start));

  const distributionRows = expenses
    .filter((e) => e.category === 'Distribuição a sócios')
    .map((e) => ({ date: e.date, partner: e.partnerName || '', description: e.description, amount: conv(e.amount, e.currency), sent: e.paid }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    companyName: settings.businessName || 'CodeEngine',
    currency,
    periodLabel: range.label,
    summary: { received, costs, commissions, profit, margin: received > 0 ? profit / received : null, distributions, opening, closing },
    cash: { now: cashNow, reserved, owed, free: round2(cashNow - reserved - owed) },
    months,
    movements,
    projects: projectRows,
    reserves: reserveList.map((r) => ({ name: r.reserve.name, date: r.reserve.date, allocated: conv(r.reserve.amount, r.reserve.currency), used: r.used, remaining: r.remaining, notes: r.reserve.notes || '' })),
    distributions: distributionRows,
  };
}

export type FinancialReport = ReturnType<typeof buildFinancialReport>;
