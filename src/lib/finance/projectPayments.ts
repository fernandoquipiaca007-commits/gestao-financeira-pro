import type { Income, Project } from '../../types';

// Regras de pagamento de projetos. Ficam fora do App para poderem ser testadas.

/**
 * O valor pago de um projeto vem das receitas recebidas ligadas a ele. O estado do projeto
 * nunca muda por causa de pagamentos: muitos clientes pagam tudo à cabeça e o trabalho
 * continua "Em andamento" até ser entregue.
 */
export function reconcileProjectWithIncomes(project: Project, allIncomes: Income[]): Project {
  const projectIncomes = allIncomes.filter((i) => i.projectId === project.id);
  const covered = Number(project.coveredAmount) || 0; // pago por um pagamento anterior: não é receita
  if (projectIncomes.length === 0 && covered === 0) return project;

  const paidAmount = projectIncomes
    .filter((i) => i.status === 'Recebido')
    .reduce((acc, i) => acc + i.amount, 0) + covered;

  if (paidAmount === project.paidAmount) return project;
  return { ...project, paidAmount };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Quitar um projeto: as receitas pendentes passam a "Recebido" e, se não cobrirem o valor
 * total, acrescenta-se uma receita com a diferença. Devolve só as receitas novas ou alteradas.
 */
export function buildSettlementIncomes(project: Project, allIncomes: Income[], today: string, newId: string): Income[] {
  const linked = allIncomes.filter((i) => i.projectId === project.id);
  const changed: Income[] = linked
    .filter((i) => i.status !== 'Recebido')
    .map((i) => ({ ...i, status: 'Recebido' as const, receivedDate: i.receivedDate || today }));

  const covered = linked.reduce((acc, i) => acc + i.amount, 0) + (Number(project.coveredAmount) || 0);
  const remainder = round2(project.totalAmount - covered);
  if (remainder > 0) {
    changed.push({
      id: newId,
      clientId: project.clientId,
      projectId: project.id,
      description: `Quitação - ${project.name}`,
      amount: remainder,
      currency: project.currency,
      dueDate: today,
      receivedDate: today,
      status: 'Recebido',
      paymentMethod: 'Transferência',
      createdAt: today,
    });
  }
  return changed;
}

/**
 * Aumentar o "valor pago" ao editar um projeto é um pagamento recebido: devolve a receita a
 * registar pela diferença, ou null se o valor pago não subiu.
 */
export function paymentDeltaIncome(previous: Project | undefined, next: Project, today: string, newId: string): Income | null {
  if (!previous) return null;
  const delta = round2((next.paidAmount || 0) - (previous.paidAmount || 0));
  if (delta <= 0) return null;
  return {
    id: newId,
    clientId: next.clientId,
    projectId: next.id,
    description: `Pagamento - ${next.name}`,
    amount: delta,
    currency: next.currency,
    dueDate: today,
    receivedDate: today,
    status: 'Recebido',
    paymentMethod: 'Transferência',
    createdAt: today,
  };
}

/**
 * Data em que a comissão de um parceiro conta como saída: a do último recebimento do projeto
 * (o repasse acompanha o pagamento do cliente). Sem recebimentos, a data de início do projeto.
 */
export function commissionDate(project: Project, allIncomes: Income[]): string {
  const dates = allIncomes
    .filter((i) => i.projectId === project.id && i.status === 'Recebido')
    .map((i) => (i.receivedDate || i.dueDate || '').slice(0, 10))
    .filter(Boolean)
    .sort();
  return dates[dates.length - 1] || (project.startDate || project.createdAt || '').slice(0, 10);
}

/** Comissões já pagas a parceiros, cada uma com a data em que conta. */
export function paidCommissions(projects: Project[], allIncomes: Income[]): { project: Project; amount: number; date: string }[] {
  return projects
    .filter((p) => p.commissionPaid && (p.commissionAmount || 0) > 0)
    .map((p) => ({ project: p, amount: p.commissionAmount || 0, date: commissionDate(p, allIncomes) }));
}

const RECURRING_MONTHS: Record<string, number> = { mensal: 1, trimestral: 3, anual: 12 };
const CYCLE_NAME: Record<string, string> = { mensal: 'Mensalidade', trimestral: 'Trimestre', anual: 'Anuidade' };
/** Quantos dias antes do vencimento a cobrança de um período aparece. */
export const RECURRING_LEAD_DAYS = 30;

function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last)); // ex.: dia 31 → último dia dos meses mais curtos
  return target.toISOString().slice(0, 10);
}

/**
 * Datas de cobrança de um projeto recorrente, desde o início até `today` + antecedência
 * (e nunca depois do fim do contrato). Projetos únicos, arquivados, cancelados ou concluídos não geram.
 */
export function recurringDueDates(project: Project, today: string): string[] {
  const months = RECURRING_MONTHS[project.billingType || 'unico'];
  if (!months || !project.startDate || project.archived || project.status === 'Cancelado' || project.status === 'Concluído') return [];
  const horizon = new Date(`${today}T00:00:00Z`);
  horizon.setUTCDate(horizon.getUTCDate() + RECURRING_LEAD_DAYS);
  const limit = horizon.toISOString().slice(0, 10);
  const end = project.recurringEnd || '9999-12-31';
  const dates: string[] = [];
  for (let k = 0; k < 600; k++) {
    const due = addMonthsIso(project.startDate, k * months);
    if (due > limit || due > end) break;
    dates.push(due);
  }
  return dates;
}

/** Cobranças em falta de um projeto recorrente (as que ainda não existem como receita). */
export function missingRecurringCharges(project: Project, incomes: Income[], today: string): Income[] {
  const amount = Number(project.recurringAmount) || 0;
  if (amount <= 0) return [];
  const existing = incomes.filter((i) => i.projectId === project.id);
  return recurringDueDates(project, today)
    .filter((due) => !existing.some((i) => i.id === `rec-${project.id}-${due}` || i.dueDate === due))
    .map((due) => ({
      id: `rec-${project.id}-${due}`,
      clientId: project.clientId,
      projectId: project.id,
      description: `${CYCLE_NAME[project.billingType || 'mensal']} ${due.slice(5, 7)}/${due.slice(0, 4)} - ${project.name}`,
      amount,
      currency: project.currency,
      dueDate: due,
      status: 'Pendente' as const,
      paymentMethod: 'Transferência' as const,
      createdAt: today,
    }));
}

/** Valor total de um recorrente até hoje: um período por cada data de cobrança já gerada. */
export function recurringTotal(project: Project, today: string): number {
  return round2((Number(project.recurringAmount) || 0) * recurringDueDates(project, today).length);
}
