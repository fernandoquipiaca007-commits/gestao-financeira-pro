import { useMemo } from 'react';
import type { AppSettings, Client, CurrencyCode, Expense, Income, Project } from '../../types';
import { convertCurrency, formatCurrency, getDaysDiff } from '../formatters';
import { paidCommissions } from './projectPayments';
import { cashBreakdown, owedToPartners, reserveStatuses } from './cashPosition';
import { isProfitDistribution } from '../../types';
import type { CashReserve } from '../../types';

/**
 * Métricas financeiras do painel num só sítio (antes duplicadas em Quick10SecSummary e DashboardView).
 * Todos os valores vêm na MESMA moeda de apresentação: a do filtro ativo, ou a moeda padrão da empresa
 * quando o filtro é "Todas" (cada valor é convertido com as taxas das definições).
 */
export type Period = '1m' | '3m' | '12m';

export interface MonthPoint { key: string; label: string; receitas: number; despesas: number; saldo: number }
export interface AgingBucket { label: string; value: number }
export interface ClientTotal { id: string; name: string; value: number }
export interface ForecastPoint { label: string; saldo: number }

interface Input {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  period: Period;
  lang: 'pt' | 'en';
  reserves?: CashReserve[];
}


export function useFinanceMetrics({ clients, projects, incomes, expenses, settings, currencyFilter, period, lang, reserves = [] }: Input) {
  return useMemo(() => {
    const currency: CurrencyCode = currencyFilter !== 'ALL' ? currencyFilter : settings.defaultCurrency;
    const conv = (amount: number, from: CurrencyCode) => convertCurrency(amount || 0, from, currency, settings.exchangeRates);
    const fmt = (v: number) => formatCurrency(v, currency);
    const inScope = <T extends { currency: CurrencyCode }>(list: T[]) => (currencyFilter === 'ALL' ? list : list.filter((x) => x.currency === currencyFilter));

    const inc = inScope(incomes);
    const exp = inScope(expenses);
    // Projetos arquivados ficam fora do que está por receber, dos ativos e dos alertas;
    // o dinheiro que já entrou ou saiu deles continua a contar no caixa.
    const allProj = inScope(projects);
    const proj = allProj.filter((p) => !p.archived);
    const archivedIds = new Set(allProj.filter((p) => p.archived).map((p) => p.id));
    const now = new Date();
    const locale = lang === 'en' ? 'en-US' : 'pt-PT';

    // --- Janela do período: mês atual, últimos 3 meses ou últimos 12 meses (meses de calendário, incluindo o atual).
    //     A janela anterior tem o mesmo tamanho e serve para a variação (Δ).
    const span = period === '12m' ? 12 : period === '3m' ? 3 : 1;
    const monthStart = (back: number) => new Date(now.getFullYear(), now.getMonth() - back, 1);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const winFrom = iso(monthStart(span - 1));
    const winTo = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)); // último dia do mês atual
    const prevFrom = iso(monthStart(2 * span - 1));
    const prevTo = iso(new Date(now.getFullYear(), now.getMonth() - span + 1, 0));
    const between = (d: string, from: string, to: string) => d >= from && d <= to;

    // --- Caixa real (tudo o que entrou − tudo o que saiu − comissões pagas)
    const received = inc.filter((i) => i.status === 'Recebido');
    const totalReceived = received.reduce((s, i) => s + conv(i.amount, i.currency), 0);
    const totalPaidExpenses = exp.filter((e) => e.paid).reduce((s, e) => s + conv(e.amount, e.currency), 0);
    const totalPaidCommissions = allProj.filter((p) => p.commissionPaid && (p.commissionAmount || 0) > 0).reduce((s, p) => s + conv(p.commissionAmount || 0, p.currency), 0);
    const cashBalance = totalReceived - totalPaidExpenses - totalPaidCommissions;
    // Onde está o caixa: reservado (com destino), por enviar aos sócios, ou livre.
    const reserveList = reserveStatuses(currencyFilter === 'ALL' ? reserves : reserves.filter((r) => r.currency === currencyFilter), exp, conv);
    const owed = owedToPartners(exp, conv);
    const breakdown = cashBreakdown(cashBalance, reserveList, owed);

    // --- Período vs período anterior (recebido = data de recebimento; despesa = data da despesa paga)
    const recDate = (i: Income) => (i.receivedDate || i.dueDate || '').slice(0, 10);
    const receivedIn = (from: string, to: string) => received.filter((i) => between(recDate(i), from, to)).reduce((s, i) => s + conv(i.amount, i.currency), 0);
    // Retiradas e distribuições a sócios saem do caixa, mas não são custo do negócio: ficam fora do resultado.
    const isWithdrawal = (e: Expense) => isProfitDistribution(e);
    const paidIn = (from: string, to: string, pick: (e: Expense) => boolean) =>
      exp.filter((e) => e.paid && pick(e) && between((e.date || '').slice(0, 10), from, to)).reduce((s, e) => s + conv(e.amount, e.currency), 0);
    const spentIn = (from: string, to: string) => paidIn(from, to, (e) => !isWithdrawal(e));
    const withdrawnIn = (from: string, to: string) => paidIn(from, to, isWithdrawal);
    // Comissões pagas contam no mês em que o cliente pagou o projeto.
    const commissions = paidCommissions(allProj, inc);
    const commissionsIn = (from: string, to: string) =>
      commissions.filter((c) => between(c.date, from, to)).reduce((s, c) => s + conv(c.amount, c.project.currency), 0);
    const cashOutIn = (from: string, to: string) => paidIn(from, to, () => true) + commissionsIn(from, to);
    const receivedPeriod = receivedIn(winFrom, winTo);
    const receivedPrev = receivedIn(prevFrom, prevTo);
    const spentPeriod = spentIn(winFrom, winTo);
    const spentPrev = spentIn(prevFrom, prevTo);
    const withdrawalsPeriod = withdrawnIn(winFrom, winTo);
    const commissionsPeriod = commissionsIn(winFrom, winTo);
    const withdrawalsTotal = exp.filter((e) => e.paid && isWithdrawal(e)).reduce((s, e) => s + conv(e.amount, e.currency), 0);
    const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);

    // --- A receber (receitas por receber + saldo de projetos sem fatura) e antiguidade
    const pending = inc.filter((i) => i.status !== 'Recebido' && !(i.projectId && archivedIds.has(i.projectId)));
    const unbilled = proj
      .filter((p) => p.totalAmount - p.paidAmount > 0 && !pending.some((i) => i.projectId === p.id))
      .map((p) => conv(p.totalAmount - p.paidAmount, p.currency));
    const toReceive = pending.reduce((s, i) => s + conv(i.amount, i.currency), 0) + unbilled.reduce((s, v) => s + v, 0);
    const aging: AgingBucket[] = [
      { label: lang === 'en' ? 'Not due' : 'A vencer', value: 0 },
      { label: '1–30d', value: 0 },
      { label: '31–60d', value: 0 },
      { label: '61–90d', value: 0 },
      { label: '+90d', value: 0 },
    ];
    pending.forEach((i) => {
      const late = -getDaysDiff(i.dueDate);
      const idx = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
      aging[idx].value += conv(i.amount, i.currency);
    });
    const overdue = pending.filter((i) => i.status === 'Atrasado' || getDaysDiff(i.dueDate) < 0);
    const dueToday = pending.filter((i) => getDaysDiff(i.dueDate) === 0);

    // --- Série do fluxo (recebido vs pago) com a granularidade do período: dias (Mês), semanas (3M) ou meses (12M)
    const series: MonthPoint[] = [];
    const todayIso = iso(now);
    const addPoint = (from: Date, to: Date, label: string) => {
      const f = iso(from);
      const r = receivedIn(f, iso(to));
      const e = cashOutIn(f, iso(to));
      series.push({ key: f, label, receitas: r, despesas: e, saldo: r - e });
    };
    const short = (d: Date, withDay: boolean) =>
      d.toLocaleDateString(locale, withDay ? { day: 'numeric', month: 'short' } : { month: 'short' }).replace('.', '');
    if (period === '12m') {
      for (let k = 11; k >= 0; k--) {
        const from = monthStart(k);
        addPoint(from, new Date(from.getFullYear(), from.getMonth() + 1, 0), short(from, false));
      }
    } else if (period === '3m') {
      for (let d = monthStart(2); iso(d) <= todayIso; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) {
        addPoint(d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6), short(d, true));
      }
    } else {
      for (let day = 1; day <= now.getDate(); day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        addPoint(d, d, short(d, true));
      }
    }

    // --- Previsão de caixa a 90 dias (saldo atual + receitas por receber − despesas por pagar, por semana)
    const forecast: ForecastPoint[] = [];
    let running = cashBalance;
    for (let w = 0; w <= 12; w++) {
      const from = w * 7 - 7;
      const to = w * 7;
      running += pending.filter((i) => { const d = getDaysDiff(i.dueDate); return d > from && d <= to; }).reduce((s, i) => s + conv(i.amount, i.currency), 0);
      running -= exp.filter((e) => !e.paid).filter((e) => { const d = getDaysDiff(e.date); return d > from && d <= to; }).reduce((s, e) => s + conv(e.amount, e.currency), 0);
      forecast.push({ label: w === 0 ? (lang === 'en' ? 'Today' : 'Hoje') : `+${w * 7}d`, saldo: running });
    }

    // --- Receita por cliente (top 5, recebido no período)
    const byClient = new Map<string, number>();
    received
      .filter((i) => between(recDate(i), winFrom, winTo))
      .forEach((i) => byClient.set(i.clientId, (byClient.get(i.clientId) || 0) + conv(i.amount, i.currency)));
    // Nome curto e legível: o nome do cliente, sem descrições entre parênteses.
    const shortName = (s: string) => s.replace(/\s*\(.*\)\s*$/, '').replace(/\s+/g, ' ').trim();
    const clientName = new Map(clients.map((c) => [c.id, shortName(c.name || c.company || '')]));
    const topClients: ClientTotal[] = [...byClient.entries()]
      .map(([id, value]) => ({ id, name: clientName.get(id) || '—', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // --- Projetos
    const activeProjects = proj.filter((p) => p.status === 'Em andamento' || p.status === 'Aguardando cliente');
    const projectsDueSoon = activeProjects.filter((p) => { if (!p.dueDate) return false; const d = getDaysDiff(p.dueDate); return d >= -30 && d <= 14; }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const projectsWithIssues = proj.filter((p) => p.status !== 'Concluído' && p.status !== 'Cancelado' && ((!!p.dueDate && getDaysDiff(p.dueDate) <= 1) || p.status === 'Aguardando cliente'));
    const completedProjects = proj.filter((p) => p.status === 'Concluído').length;
    const contracted = proj.reduce((s, p) => s + conv(p.totalAmount, p.currency), 0);
    const pendingCommissions = proj.filter((p) => !p.commissionPaid && (p.commissionAmount || 0) > 0).reduce((s, p) => s + conv(p.commissionAmount || 0, p.currency), 0);

    // --- Indicadores do negócio (os que existiam no painel anterior, agora num só sítio)
    const overdueAmount = overdue.reduce((s, i) => s + conv(i.amount, i.currency), 0);
    const overdueClients = new Set(overdue.map((i) => i.clientId)).size;
    const dueTodayAmount = dueToday.reduce((s, i) => s + conv(i.amount, i.currency), 0);
    const clientsInScope = currencyFilter === 'ALL' ? clients : clients.filter((c) => c.currency === currencyFilter);
    const newClientsPeriod = clientsInScope.filter((c) => between((c.createdAt || '').slice(0, 10), winFrom, winTo)).length;
    const netPeriod = receivedPeriod - spentPeriod - commissionsPeriod;

    return {
      currency, fmt, period,
      cashBalance, receivedPeriod, receivedPrev, spentPeriod, withdrawalsPeriod, withdrawalsTotal, commissionsPeriod,
      reserves: reserveList, cashReserved: breakdown.reserved, cashOwedToPartners: breakdown.owed, cashFree: breakdown.free,
      receivedDelta: pct(receivedPeriod, receivedPrev),
      netPeriod,
      toReceive, aging, overdue, dueToday,
      series, forecast, topClients,
      // fluxos do período + o que está por receber hoje
      composition: [
        { name: lang === 'en' ? 'Received' : 'Recebido', value: Math.max(0, receivedPeriod) },
        { name: lang === 'en' ? 'To receive' : 'A receber', value: Math.max(0, toReceive) },
        { name: lang === 'en' ? 'Expenses' : 'Despesas', value: Math.max(0, spentPeriod) },
        { name: lang === 'en' ? 'Commissions' : 'Comissões', value: Math.max(0, commissionsPeriod) },
        { name: lang === 'en' ? 'Withdrawals' : 'Retiradas', value: Math.max(0, withdrawalsPeriod) },
      ].filter((s) => s.value > 0),
      activeProjects, projectsDueSoon,
      indicators: {
        overdueAmount, overdueClients, overdueCount: overdue.length,
        dueTodayAmount, dueTodayCount: dueToday.length,
        spentPeriod, spentDelta: pct(spentPeriod, spentPrev),
        netPeriod,
        withdrawalsPeriod,
        margin: receivedPeriod > 0 ? (netPeriod / receivedPeriod) * 100 : null,
        contracted, contractedCount: proj.length,
        pendingCommissions,
        activeCount: activeProjects.length, issuesCount: projectsWithIssues.length, completedCount: completedProjects,
        clientsCount: clientsInScope.length, newClientsPeriod,
      },
    };
  }, [clients, projects, incomes, expenses, settings, currencyFilter, period, lang, reserves]);
}
