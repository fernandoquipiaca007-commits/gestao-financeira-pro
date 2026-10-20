import type { Income, Project } from '../../types';

// Regras de pagamento de projetos. Ficam fora do App para poderem ser testadas.

/**
 * O valor pago de um projeto vem das receitas recebidas ligadas a ele. O estado do projeto
 * nunca muda por causa de pagamentos: muitos clientes pagam tudo à cabeça e o trabalho
 * continua "Em andamento" até ser entregue.
 */
export function reconcileProjectWithIncomes(project: Project, allIncomes: Income[]): Project {
  const projectIncomes = allIncomes.filter((i) => i.projectId === project.id);
  if (projectIncomes.length === 0) return project;

  const paidAmount = projectIncomes
    .filter((i) => i.status === 'Recebido')
    .reduce((acc, i) => acc + i.amount, 0);

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

  const covered = linked.reduce((acc, i) => acc + i.amount, 0);
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
