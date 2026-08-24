import { Client, Project, Income, Expense, AppSettings, Partner } from '../types';

// ── Namespace isolado por utilizador ─────────────────────────────
// Deve ser chamado imediatamente após o login, e limpo no logout.
let _currentUserId: string = 'anonymous';

export function setStorageUserId(userId: string): void {
  _currentUserId = userId;
}

export function clearStorageForUser(userId: string): void {
  const suffix = `_${userId}`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith(suffix)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

// Key factories ─ namespaced por userId, nunca globais
const clientsKey  = () => `gfo_clients_v1_${_currentUserId}`;
const projectsKey = () => `gfo_projects_v1_${_currentUserId}`;
const incomesKey  = () => `gfo_incomes_v1_${_currentUserId}`;
const expensesKey = () => `gfo_expenses_v1_${_currentUserId}`;
const settingsKey = () => `gfo_settings_v1_${_currentUserId}`;
const partnersKey = () => `gfo_partners_v1_${_currentUserId}`;

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'BRL',
  userName: 'Gestor',
  businessName: 'Studio Digital',
  exchangeRates: {
    BRL: 1,
    AOA: 165,
    USD: 0.18,
    EUR: 0.16,
  },
};

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStoredClients(): Client[] {
  try {
    const item = localStorage.getItem(clientsKey());
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(clientsKey(), JSON.stringify(clients));
}

export function getStoredProjects(): Project[] {
  try {
    const item = localStorage.getItem(projectsKey());
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(projectsKey(), JSON.stringify(projects));
}

export function getStoredIncomes(): Income[] {
  try {
    const item = localStorage.getItem(incomesKey());
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveIncomes(incomes: Income[]): void {
  localStorage.setItem(incomesKey(), JSON.stringify(incomes));
}

export function getStoredExpenses(): Expense[] {
  try {
    const item = localStorage.getItem(expensesKey());
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(expensesKey(), JSON.stringify(expenses));
}

export function getStoredSettings(): AppSettings {
  try {
    const item = localStorage.getItem(settingsKey());
    if (item) return { ...DEFAULT_SETTINGS, ...JSON.parse(item) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(settingsKey(), JSON.stringify(settings));
}

export function getStoredPartners(): Partner[] {
  try {
    const item = localStorage.getItem(partnersKey());
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function savePartners(partners: Partner[]): void {
  localStorage.setItem(partnersKey(), JSON.stringify(partners));
}

export function clearAllData(): void {
  clearStorageForUser(_currentUserId);
}

export function exportBackupData(): string {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    clients: getStoredClients(),
    projects: getStoredProjects(),
    incomes: getStoredIncomes(),
    expenses: getStoredExpenses(),
    settings: getStoredSettings(),
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gestao_financeira_backup_${getTodayIso()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return jsonStr;
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.clients && Array.isArray(parsed.clients)) saveClients(parsed.clients);
    if (parsed.projects && Array.isArray(parsed.projects)) saveProjects(parsed.projects);
    if (parsed.incomes && Array.isArray(parsed.incomes)) saveIncomes(parsed.incomes);
    if (parsed.expenses && Array.isArray(parsed.expenses)) saveExpenses(parsed.expenses);
    if (parsed.settings && typeof parsed.settings === 'object') saveSettings(parsed.settings);
    return true;
  } catch (err) {
    console.error('Failed to import data', err);
    return false;
  }
}
