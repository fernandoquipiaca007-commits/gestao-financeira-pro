/**
 * integrity.ts — Verificação de integridade financeira
 * 
 * Valida que os dados financeiros no frontend são consistentes
 * e calcula métricas de auditoria.
 */

import { Income, Expense, Project } from '../types';

export interface IntegrityResult {
  isValid: boolean;
  totalReceived: number;
  totalExpensesPaid: number;
  totalCommissionsPaid: number;
  realBalance: number;
  warnings: string[];
}

/**
 * Verifica integridade dos dados financeiros.
 * Retorna balanço real e lista de avisos se houver inconsistências.
 */
export function checkFinancialIntegrity(
  incomes: Income[],
  expenses: Expense[],
  projects: Project[],
  currency = 'BRL'
): IntegrityResult {
  const warnings: string[] = [];

  // Filtra pela moeda base
  const filteredIncomes = incomes.filter(i => i.currency === currency);
  const filteredExpenses = expenses.filter(e => e.currency === currency);
  const filteredProjects = projects.filter(p => p.currency === currency);

  // Total recebido (histórico completo)
  const totalReceived = filteredIncomes
    .filter(i => i.status === 'Recebido')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Total despesas pagas (histórico completo)
  const totalExpensesPaid = filteredExpenses
    .filter(e => e.paid)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Total comissões pagas (vêm dos projetos)
  const totalCommissionsPaid = filteredProjects
    .filter(p => p.commissionPaid && (p.commissionAmount || 0) > 0)
    .reduce((sum, p) => sum + (Number(p.commissionAmount) || 0), 0);

  const realBalance = totalReceived - totalExpensesPaid - totalCommissionsPaid;

  // --- Verificações de Integridade ---

  // 1. Receitas com amount negativo ou zero
  const badIncomes = filteredIncomes.filter(i => i.amount <= 0);
  if (badIncomes.length > 0) {
    warnings.push(`${badIncomes.length} receita(s) com valor inválido (≤ 0)`);
  }

  // 2. Despesas com amount negativo ou zero
  const badExpenses = filteredExpenses.filter(e => e.amount <= 0);
  if (badExpenses.length > 0) {
    warnings.push(`${badExpenses.length} despesa(s) com valor inválido (≤ 0)`);
  }

  // 3. Receitas marcadas como "Recebido" sem receivedDate
  const missingReceivedDate = filteredIncomes.filter(
    i => i.status === 'Recebido' && !i.receivedDate
  );
  if (missingReceivedDate.length > 0) {
    warnings.push(`${missingReceivedDate.length} receita(s) marcada(s) como recebida sem data de recebimento`);
  }

  // 4. Projetos com paidAmount > totalAmount
  const overpaidProjects = filteredProjects.filter(
    p => p.paidAmount > p.totalAmount && p.totalAmount > 0
  );
  if (overpaidProjects.length > 0) {
    warnings.push(`${overpaidProjects.length} projeto(s) com valor pago maior que valor total`);
  }

  // 5. Projetos "Concluído" com paidAmount < totalAmount
  const concludedNotPaid = filteredProjects.filter(
    p => p.status === 'Concluído' && p.paidAmount < p.totalAmount && p.totalAmount > 0
  );
  if (concludedNotPaid.length > 0) {
    warnings.push(`${concludedNotPaid.length} projeto(s) marcado(s) como Concluído mas não totalmente pagos`);
  }

  // 6. Receitas sem clientId
  const orphanIncomes = filteredIncomes.filter(i => !i.clientId);
  if (orphanIncomes.length > 0) {
    warnings.push(`${orphanIncomes.length} receita(s) sem cliente associado`);
  }

  return {
    isValid: warnings.length === 0,
    totalReceived,
    totalExpensesPaid,
    totalCommissionsPaid,
    realBalance,
    warnings,
  };
}
