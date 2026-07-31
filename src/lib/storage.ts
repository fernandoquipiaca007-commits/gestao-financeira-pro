import { Client, Project, Income, Expense, AppSettings } from '../types';

const CLIENTS_KEY = 'gfo_clients_v1';
const PROJECTS_KEY = 'gfo_projects_v1';
const INCOMES_KEY = 'gfo_incomes_v1';
const EXPENSES_KEY = 'gfo_expenses_v1';
const SETTINGS_KEY = 'gfo_settings_v1';

// Get today's ISO date string YYYY-MM-DD
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

// ==============================
// LocalStorage CRUD (cache local)
// ==============================

export function getStoredClients(): Client[] {
  try {
    const item = localStorage.getItem(CLIENTS_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function getStoredProjects(): Project[] {
  try {
    const item = localStorage.getItem(PROJECTS_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getStoredIncomes(): Income[] {
  try {
    const item = localStorage.getItem(INCOMES_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveIncomes(incomes: Income[]): void {
  localStorage.setItem(INCOMES_KEY, JSON.stringify(incomes));
}

export function getStoredExpenses(): Expense[] {
  try {
    const item = localStorage.getItem(EXPENSES_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getStoredSettings(): AppSettings {
  try {
    const item = localStorage.getItem(SETTINGS_KEY);
    if (item) return { ...DEFAULT_SETTINGS, ...JSON.parse(item) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllData(): void {
  localStorage.removeItem(CLIENTS_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(INCOMES_KEY);
  localStorage.removeItem(EXPENSES_KEY);
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
  return JSON.stringify(backup, null, 2);
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
