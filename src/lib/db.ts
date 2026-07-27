import { supabase } from './supabase';
import {
  Client,
  Project,
  Income,
  Expense,
  CategoryItem,
  AgendaEvent,
  AppSettings,
  NotificationItem,
} from '../types';
import {
  getStoredClients,
  saveClients,
  getStoredProjects,
  saveProjects,
  getStoredIncomes,
  saveIncomes,
  getStoredExpenses,
  saveExpenses,
  getStoredSettings,
  saveSettings,
} from './storage';

const CATEGORIES_KEY = 'gfo_categories_v1';
const AGENDA_EVENTS_KEY = 'gfo_agenda_events_v1';

// Default initial categories
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Tráfego Pago', type: 'income', color: '#10B981', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Desenvolvimento Web', type: 'income', color: '#3B82F6', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Consultoria', type: 'income', color: '#8B5CF6', createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Hospedagem', type: 'expense', color: '#EF4444', createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'Domínio', type: 'expense', color: '#F59E0B', createdAt: new Date().toISOString() },
  { id: 'cat-6', name: 'Ferramentas & Softwares', type: 'expense', color: '#EC4899', createdAt: new Date().toISOString() },
];

export function getStoredCategories(): CategoryItem[] {
  try {
    const item = localStorage.getItem(CATEGORIES_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: CategoryItem[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getStoredAgendaEvents(): AgendaEvent[] {
  try {
    const item = localStorage.getItem(AGENDA_EVENTS_KEY);
    if (item) return JSON.parse(item);
  } catch {}
  return [];
}

export function saveAgendaEvents(events: AgendaEvent[]): void {
  localStorage.setItem(AGENDA_EVENTS_KEY, JSON.stringify(events));
}

// ----------------------------------------------------
// SUPABASE SYNC OPERATIONS
// ----------------------------------------------------

export async function fetchClientsFromDb(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const formatted: Client[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        company: item.company || '',
        whatsapp: item.whatsapp || '',
        email: item.email || '',
        type: item.type || 'Outro',
        country: item.country || 'BR',
        currency: item.currency || 'BRL',
        notes: item.notes || '',
        createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      saveClients(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch clients failed, using local storage:', err);
  }
  return getStoredClients();
}

export async function upsertClientToDb(client: Client): Promise<void> {
  saveClients([client, ...getStoredClients().filter(c => c.id !== client.id)]);
  try {
    await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      company: client.company,
      whatsapp: client.whatsapp,
      email: client.email,
      type: client.type,
      country: client.country,
      currency: client.currency,
      notes: client.notes,
    });
  } catch (err) {
    console.warn('Failed to sync client to Supabase:', err);
  }
}

export async function deleteClientFromDb(clientId: string): Promise<void> {
  saveClients(getStoredClients().filter(c => c.id !== clientId));
  try {
    await supabase.from('clients').delete().eq('id', clientId);
  } catch (err) {
    console.warn('Failed to delete client from Supabase:', err);
  }
}

export async function fetchProjectsFromDb(): Promise<Project[]> {
  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const formatted: Project[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        clientId: item.client_id || '',
        category: item.category || 'Outro',
        totalAmount: Number(item.total_amount) || 0,
        paidAmount: Number(item.paid_amount) || 0,
        currency: item.currency || 'BRL',
        startDate: item.start_date || '',
        dueDate: item.due_date || '',
        nextPaymentDate: item.next_payment_date || undefined,
        status: item.status || 'Em andamento',
        notes: item.notes || '',
        createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      saveProjects(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch projects failed, using local storage:', err);
  }
  return getStoredProjects();
}

export async function upsertProjectToDb(project: Project): Promise<void> {
  saveProjects([project, ...getStoredProjects().filter(p => p.id !== project.id)]);
  try {
    await supabase.from('projects').upsert({
      id: project.id,
      name: project.name,
      client_id: project.clientId,
      category: project.category,
      total_amount: project.totalAmount,
      paid_amount: project.paidAmount,
      currency: project.currency,
      start_date: project.startDate,
      due_date: project.dueDate,
      next_payment_date: project.nextPaymentDate,
      status: project.status,
      notes: project.notes,
    });
  } catch (err) {
    console.warn('Failed to sync project to Supabase:', err);
  }
}

export async function deleteProjectFromDb(projectId: string): Promise<void> {
  saveProjects(getStoredProjects().filter(p => p.id !== projectId));
  try {
    await supabase.from('projects').delete().eq('id', projectId);
  } catch (err) {
    console.warn('Failed to delete project from Supabase:', err);
  }
}

export async function fetchIncomesFromDb(): Promise<Income[]> {
  try {
    const { data, error } = await supabase.from('incomes').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const formatted: Income[] = data.map((item) => ({
        id: item.id,
        clientId: item.client_id || '',
        projectId: item.project_id || undefined,
        description: item.description,
        amount: Number(item.amount) || 0,
        currency: item.currency || 'BRL',
        dueDate: item.due_date,
        receivedDate: item.received_date || undefined,
        paymentMethod: item.payment_method || 'PIX',
        status: item.status || 'Pendente',
        notes: item.notes || '',
        createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      saveIncomes(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch incomes failed, using local storage:', err);
  }
  return getStoredIncomes();
}

export async function upsertIncomeToDb(income: Income): Promise<void> {
  saveIncomes([income, ...getStoredIncomes().filter(i => i.id !== income.id)]);
  try {
    await supabase.from('incomes').upsert({
      id: income.id,
      client_id: income.clientId,
      project_id: income.projectId,
      description: income.description,
      amount: income.amount,
      currency: income.currency,
      due_date: income.dueDate,
      received_date: income.receivedDate,
      payment_method: income.paymentMethod,
      status: income.status,
      notes: income.notes,
    });
  } catch (err) {
    console.warn('Failed to sync income to Supabase:', err);
  }
}

export async function deleteIncomeFromDb(incomeId: string): Promise<void> {
  saveIncomes(getStoredIncomes().filter(i => i.id !== incomeId));
  try {
    await supabase.from('incomes').delete().eq('id', incomeId);
  } catch (err) {
    console.warn('Failed to delete income from Supabase:', err);
  }
}

export async function fetchExpensesFromDb(): Promise<Expense[]> {
  try {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const formatted: Expense[] = data.map((item) => ({
        id: item.id,
        category: item.category || 'Outros',
        description: item.description,
        amount: Number(item.amount) || 0,
        currency: item.currency || 'BRL',
        date: item.date,
        paid: item.paid || false,
        createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      saveExpenses(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch expenses failed, using local storage:', err);
  }
  return getStoredExpenses();
}

export async function upsertExpenseToDb(expense: Expense): Promise<void> {
  saveExpenses([expense, ...getStoredExpenses().filter(e => e.id !== expense.id)]);
  try {
    await supabase.from('expenses').upsert({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paid: expense.paid,
    });
  } catch (err) {
    console.warn('Failed to sync expense to Supabase:', err);
  }
}

export async function deleteExpenseFromDb(expenseId: string): Promise<void> {
  saveExpenses(getStoredExpenses().filter(e => e.id !== expenseId));
  try {
    await supabase.from('expenses').delete().eq('id', expenseId);
  } catch (err) {
    console.warn('Failed to delete expense from Supabase:', err);
  }
}

export async function fetchAgendaEventsFromDb(): Promise<AgendaEvent[]> {
  try {
    const { data, error } = await supabase.from('agenda_events').select('*').order('date', { ascending: true });
    if (!error && data && data.length > 0) {
      const formatted: AgendaEvent[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        date: item.date,
        time: item.time || undefined,
        clientId: item.client_id || undefined,
        projectId: item.project_id || undefined,
        description: item.description || '',
        status: item.status || 'pending',
        notifyPush: item.notify_push ?? true,
        createdAt: item.created_at || new Date().toISOString(),
      }));
      saveAgendaEvents(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch agenda failed, using local storage:', err);
  }
  return getStoredAgendaEvents();
}

export async function upsertAgendaEventToDb(event: AgendaEvent): Promise<void> {
  saveAgendaEvents([event, ...getStoredAgendaEvents().filter(e => e.id !== event.id)]);
  try {
    await supabase.from('agenda_events').upsert({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      client_id: event.clientId,
      project_id: event.projectId,
      description: event.description,
      status: event.status,
      notify_push: event.notifyPush,
    });
  } catch (err) {
    console.warn('Failed to sync agenda event to Supabase:', err);
  }
}

export async function deleteAgendaEventFromDb(eventId: string): Promise<void> {
  saveAgendaEvents(getStoredAgendaEvents().filter(e => e.id !== eventId));
  try {
    await supabase.from('agenda_events').delete().eq('id', eventId);
  } catch (err) {
    console.warn('Failed to delete agenda event from Supabase:', err);
  }
}
