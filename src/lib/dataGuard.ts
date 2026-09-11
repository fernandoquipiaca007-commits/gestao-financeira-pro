/**
 * DataGuard — Sistema de Proteção e Integridade Contínua de Dados
 * 
 * Previne:
 * 1. Sobrescrita de dados locais por arrays vazios acidentais
 * 2. Queda brusca inesperada no número de registros (data loss silencioso)
 * 3. Falta de histórico de emergência (cria snapshot automático)
 */

import { Client, Project, Income, Expense, Partner } from '../types';
import {
  getStoredClients,
  saveClients,
  getStoredProjects,
  saveProjects,
  getStoredIncomes,
  saveIncomes,
  getStoredExpenses,
  saveExpenses,
  getStoredPartners,
  savePartners,
} from './storage';

const EMERGENCY_SNAPSHOT_KEY = 'gfo_emergency_snapshot_v1';

export interface DataIntegrityReport {
  timestamp: string;
  clientsCount: number;
  projectsCount: number;
  incomesCount: number;
  expensesCount: number;
  partnersCount: number;
  status: 'healthy' | 'warning' | 'critical';
  details: string[];
}

/**
 * Cria snapshot de emergência se os dados atuais forem saudáveis
 */
export function createEmergencySnapshot(): void {
  try {
    const clients = getStoredClients();
    const projects = getStoredProjects();
    const incomes = getStoredIncomes();
    const expenses = getStoredExpenses();
    const partners = getStoredPartners();

    const total = clients.length + projects.length + incomes.length + expenses.length + partners.length;
    if (total === 0) return; // Não salvar snapshot vazio

    const snapshot = {
      timestamp: new Date().toISOString(),
      data: { clients, projects, incomes, expenses, partners },
    };

    localStorage.setItem(EMERGENCY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    console.log(`[DataGuard] Snapshot de emergência atualizado com sucesso (${total} registros totais).`);
  } catch (e) {
    console.warn('[DataGuard] Não foi possível criar snapshot de emergência:', e);
  }
}

/**
 * Recupera o último snapshot de emergência salvo
 */
export function getEmergencySnapshot(): {
  timestamp: string;
  data: {
    clients: Client[];
    projects: Project[];
    incomes: Income[];
    expenses: Expense[];
    partners: Partner[];
  };
} | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Validação de segurança antes de sobrescrever uma entidade no armazenamento
 */
function isSafeToUpdate<T>(
  existing: T[],
  incoming: T[],
  entityName: string,
  allowEmpty: boolean = false
): boolean {
  if (existing.length > 0 && incoming.length === 0 && !allowEmpty) {
    console.error(
      `[DataGuard] 🛡️ BLOQUEIO DE SEGURANÇA: Tentativa de sobrescrever ${existing.length} ${entityName} por um array VAZIO. Operação cancelada para proteger dados!`
    );
    return false;
  }

  // Alerta de queda brusca de mais de 70% dos dados
  if (existing.length >= 5 && incoming.length < existing.length * 0.3 && !allowEmpty) {
    console.warn(
      `[DataGuard] ⚠️ ALERTA DE QUEDA BRUSCA: ${entityName} caiu de ${existing.length} para ${incoming.length}.`
    );
  }

  return true;
}

/**
 * Salva Clientes com proteção ativa contra perda de dados
 */
export function safeSaveClients(incoming: Client[], allowEmpty: boolean = false): boolean {
  const existing = getStoredClients();
  if (!isSafeToUpdate(existing, incoming, 'clientes', allowEmpty)) {
    return false;
  }
  saveClients(incoming);
  return true;
}

/**
 * Salva Projetos com proteção ativa contra perda de dados
 */
export function safeSaveProjects(incoming: Project[], allowEmpty: boolean = false): boolean {
  const existing = getStoredProjects();
  if (!isSafeToUpdate(existing, incoming, 'projetos', allowEmpty)) {
    return false;
  }
  saveProjects(incoming);
  return true;
}

/**
 * Salva Receitas com proteção ativa contra perda de dados
 */
export function safeSaveIncomes(incoming: Income[], allowEmpty: boolean = false): boolean {
  const existing = getStoredIncomes();
  if (!isSafeToUpdate(existing, incoming, 'receitas', allowEmpty)) {
    return false;
  }
  saveIncomes(incoming);
  return true;
}

/**
 * Salva Despesas com proteção ativa contra perda de dados
 */
export function safeSaveExpenses(incoming: Expense[], allowEmpty: boolean = false): boolean {
  const existing = getStoredExpenses();
  if (!isSafeToUpdate(existing, incoming, 'despesas', allowEmpty)) {
    return false;
  }
  saveExpenses(incoming);
  return true;
}

/**
 * Salva Parceiros com proteção ativa contra perda de dados
 */
export function safeSavePartners(incoming: Partner[], allowEmpty: boolean = false): boolean {
  const existing = getStoredPartners();
  if (!isSafeToUpdate(existing, incoming, 'parceiros', allowEmpty)) {
    return false;
  }
  savePartners(incoming);
  return true;
}

/**
 * Executa auditoria do estado atual dos dados
 */
export function auditDataState(): DataIntegrityReport {
  const clients = getStoredClients();
  const projects = getStoredProjects();
  const incomes = getStoredIncomes();
  const expenses = getStoredExpenses();
  const partners = getStoredPartners();

  const details: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Verificar relacionamentos órfãos
  const clientIds = new Set(clients.map((c) => c.id));
  const orphanProjects = projects.filter((p) => p.clientId && !clientIds.has(p.clientId));
  if (orphanProjects.length > 0) {
    details.push(`${orphanProjects.length} projeto(s) associado(s) a clientes inexistentes.`);
    status = 'warning';
  }

  const projectIds = new Set(projects.map((p) => p.id));
  const orphanIncomes = incomes.filter((i) => i.projectId && !projectIds.has(i.projectId));
  if (orphanIncomes.length > 0) {
    details.push(`${orphanIncomes.length} receita(s) associada(s) a projetos inexistentes.`);
    if (status !== 'critical') status = 'warning';
  }

  return {
    timestamp: new Date().toISOString(),
    clientsCount: clients.length,
    projectsCount: projects.length,
    incomesCount: incomes.length,
    expensesCount: expenses.length,
    partnersCount: partners.length,
    status,
    details,
  };
}
