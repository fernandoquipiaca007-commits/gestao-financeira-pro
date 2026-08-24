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
  Partner,
  CurrencyCode,
} from '../types';
import {
  UserProfile,
  UserRole,
  UserStatus,
  PermissionScope,
  UserPermissionEntry,
  Task,
  TaskStatus,
  TaskPriority,
  ProjectAssignment,
  AuditLogEntry,
  BillingRequest,
} from '../types/rbac';
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
  getStoredPartners,
  savePartners,
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

export async function fetchClientsFromDb(companyId?: string): Promise<Client[]> {
  try {
    let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;
    const formatted: Client[] = (data || []).map((item) => ({
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
  } catch (err) {
    console.warn('[DB] fetchClientsFromDb failed, using local cache:', err);
    return getStoredClients();
  }
}



export async function upsertClientToDb(client: Client, companyId: string): Promise<{ success: boolean; error?: string }> {
  saveClients([client, ...getStoredClients().filter(c => c.id !== client.id)]);
  try {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      company_id: companyId,
      name: client.name,
      company: client.company,
      whatsapp: client.whatsapp,
      email: client.email,
      type: client.type,
      country: client.country,
      currency: client.currency,
      notes: client.notes,
    });
    if (error) {
      console.error('[DB] upsertClientToDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertClientToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteClientFromDb(clientId: string): Promise<{ success: boolean; error?: string }> {
  saveClients(getStoredClients().filter(c => c.id !== clientId));
  try {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      console.error('[DB] deleteClientFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}


export async function fetchProjectsFromDb(companyId?: string): Promise<Project[]> {
  try {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;

    const formatted: Project[] = (data || []).map((item) => {
      const parsedClientIds: string[] = Array.isArray(item.client_ids)
        ? item.client_ids
        : (item.client_id ? [item.client_id] : []);

      return {
        id: item.id,
        name: item.name,
        clientId: item.client_id || (parsedClientIds[0] || ''),
        clientIds: parsedClientIds.length > 0 ? parsedClientIds : (item.client_id ? [item.client_id] : []),
        category: item.category || 'Outro',
        totalAmount: Number(item.total_amount) || 0,
        paidAmount: Number(item.paid_amount) || 0,
        currency: item.currency || 'BRL',
        startDate: item.start_date || '',
        dueDate: item.due_date || '',
        nextPaymentDate: item.next_payment_date || undefined,
        status: item.status || 'Em andamento',
        notes: item.notes || '',
        rating: Number(item.rating) || 0,
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        partnerId: item.partner_id || undefined,
        partnerName: item.partner_name || undefined,
        commissionType: item.commission_type || 'percent',
        commissionValue: Number(item.commission_value) || 0,
        commissionAmount: Number(item.commission_amount) || 0,
        commissionPaid: item.commission_paid || false,
        createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });

    // BD é a fonte de verdade — não misturar com dados locais
    saveProjects(formatted);
    return formatted;
  } catch (err) {
    console.warn('[DB] fetchProjectsFromDb failed, using local cache:', err);
    return getStoredProjects();
  }
}

export async function upsertProjectToDb(project: Project, companyId: string): Promise<{ success: boolean; error?: string }> {
  const allProjects = getStoredProjects();
  const updatedProjects = [project, ...allProjects.filter((p) => p.id !== project.id)];
  saveProjects(updatedProjects);

  try {
    const payload = {
      id: project.id,
      company_id: companyId,
      name: project.name,
      client_id: project.clientId || null,
      client_ids: project.clientIds && project.clientIds.length > 0 ? project.clientIds : [project.clientId],
      category: project.category,
      total_amount: Number(project.totalAmount) || 0,
      paid_amount: Number(project.paidAmount) || 0,
      currency: project.currency,
      start_date: project.startDate || null,
      due_date: project.dueDate || null,
      next_payment_date: project.nextPaymentDate || null,
      status: project.status,
      notes: project.notes || null,
      rating: Number(project.rating) || 0,
      attachments: project.attachments || [],
      partner_id: project.partnerId || null,
      partner_name: project.partnerName || null,
      commission_type: project.commissionType || 'percent',
      commission_value: Number(project.commissionValue) || 0,
      commission_amount: Number(project.commissionAmount) || 0,
      commission_paid: Boolean(project.commissionPaid),
    };

    const { error } = await supabase.from('projects').upsert(payload);
    if (error) {
      // Retry without client_ids (schema compatibility)
      const { error: err2 } = await supabase.from('projects').upsert({
        ...payload,
        client_ids: undefined,
      });
      if (err2) {
        console.error('[DB] upsertProjectToDb error:', err2.message);
        return { success: false, error: err2.message };
      }
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertProjectToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteProjectFromDb(projectId: string): Promise<{ success: boolean; error?: string }> {
  saveProjects(getStoredProjects().filter(p => p.id !== projectId));
  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      console.error('[DB] deleteProjectFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}


export async function fetchIncomesFromDb(companyId?: string): Promise<Income[]> {
  try {
    let query = supabase.from('incomes').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('incomes').select('*').order('created_at', { ascending: false });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;
    const formatted: Income[] = (data || []).map((item) => ({
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
      partnerId: item.partner_id || undefined,
      partnerName: item.partner_name || undefined,
      commissionAmount: Number(item.commission_amount) || 0,
      commissionPaid: item.commission_paid || false,
      createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
    saveIncomes(formatted);
    return formatted;
  } catch (err) {
    console.warn('[DB] fetchIncomesFromDb failed, using local cache:', err);
    return getStoredIncomes();
  }
}


export async function upsertIncomeToDb(income: Income, companyId: string): Promise<{ success: boolean; error?: string }> {
  saveIncomes([income, ...getStoredIncomes().filter(i => i.id !== income.id)]);
  try {
    const payload = {
      id: income.id,
      company_id: companyId,
      client_id: income.clientId || null,
      project_id: income.projectId || null,
      description: income.description,
      amount: Number(income.amount) || 0,
      currency: income.currency,
      due_date: income.dueDate,
      received_date: income.receivedDate || null,
      payment_method: income.paymentMethod || 'PIX',
      status: income.status,
      notes: income.notes || null,
      partner_id: income.partnerId || null,
      partner_name: income.partnerName || null,
      commission_amount: Number(income.commissionAmount) || 0,
      commission_paid: Boolean(income.commissionPaid),
    };

    const { error } = await supabase.from('incomes').upsert(payload);
    if (error) {
      console.warn('[DB] upsertIncomeToDb standard failed, retrying core schema:', error.message);
      const payloadCore = {
        id: income.id,
        company_id: companyId,
        client_id: income.clientId || null,
        project_id: income.projectId || null,
        description: income.description,
        amount: Number(income.amount) || 0,
        currency: income.currency,
        due_date: income.dueDate,
        received_date: income.receivedDate || null,
        payment_method: income.paymentMethod || 'PIX',
        status: income.status,
        notes: income.notes || null,
      };
      const { error: err2 } = await supabase.from('incomes').upsert(payloadCore);
      if (err2) {
        console.error('[DB] CRITICAL: upsertIncomeToDb core error:', err2.message);
        return { success: false, error: err2.message };
      }
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertIncomeToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteIncomeFromDb(incomeId: string): Promise<{ success: boolean; error?: string }> {
  saveIncomes(getStoredIncomes().filter(i => i.id !== incomeId));
  try {
    const { error } = await supabase.from('incomes').delete().eq('id', incomeId);
    if (error) {
      console.error('[DB] deleteIncomeFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

export async function fetchExpensesFromDb(companyId?: string): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;
    const formatted: Expense[] = (data || []).map((item) => ({
      id: item.id,
      category: item.category || 'Outros',
      description: item.description,
      amount: Number(item.amount) || 0,
      currency: item.currency || 'BRL',
      date: item.date,
      paid: item.paid || false,
      partnerId: item.partner_id || undefined,
      partnerName: item.partner_name || undefined,
      receiptUrl: item.receipt_url || undefined,
      createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
    saveExpenses(formatted);
    return formatted;
  } catch (err) {
    console.warn('[DB] fetchExpensesFromDb failed, using local cache:', err);
    return getStoredExpenses();
  }
}


export async function upsertExpenseToDb(expense: Expense, companyId: string): Promise<{ success: boolean; error?: string }> {
  saveExpenses([expense, ...getStoredExpenses().filter(e => e.id !== expense.id)]);
  try {
    const { error } = await supabase.from('expenses').upsert({
      id: expense.id,
      company_id: companyId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paid: expense.paid,
      partner_id: expense.partnerId || null,
      partner_name: expense.partnerName || null,
      receipt_url: expense.receiptUrl || null,
    });
    if (error) {
      console.error('[DB] upsertExpenseToDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertExpenseToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteExpenseFromDb(expenseId: string): Promise<{ success: boolean; error?: string }> {
  saveExpenses(getStoredExpenses().filter(e => e.id !== expenseId));
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.error('[DB] deleteExpenseFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ----------------------------------------------------
// PARTNER DB OPERATIONS
// ----------------------------------------------------

export async function fetchPartnersFromDb(companyId?: string): Promise<Partner[]> {
  try {
    let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('partners').select('*').order('created_at', { ascending: false });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;
    const formatted: Partner[] = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      whatsapp: item.whatsapp || '',
      email: item.email || '',
      defaultCommissionPercent: Number(item.default_commission_percent) || 10,
      notes: item.notes || '',
      createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
    savePartners(formatted);
    return formatted;
  } catch (err) {
    console.warn('[DB] fetchPartnersFromDb failed, using local cache:', err);
    return getStoredPartners();
  }
}

export async function upsertPartnerToDb(partner: Partner, companyId: string): Promise<{ success: boolean; error?: string }> {
  savePartners([partner, ...getStoredPartners().filter(p => p.id !== partner.id)]);
  try {
    const { error } = await supabase.from('partners').upsert({
      id: partner.id,
      company_id: companyId,
      name: partner.name,
      whatsapp: partner.whatsapp || null,
      email: partner.email || null,
      default_commission_percent: partner.defaultCommissionPercent,
      notes: partner.notes || null,
    });
    if (error) {
      console.error('[DB] upsertPartnerToDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertPartnerToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deletePartnerFromDb(partnerId: string): Promise<{ success: boolean; error?: string }> {
  savePartners(getStoredPartners().filter(p => p.id !== partnerId));
  try {
    const { error } = await supabase.from('partners').delete().eq('id', partnerId);
    if (error) {
      console.error('[DB] deletePartnerFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ----------------------------------------------------
// AGENDA EVENTS DB OPERATIONS
// ----------------------------------------------------

export async function fetchAgendaEventsFromDb(companyId?: string): Promise<AgendaEvent[]> {
  try {
    let query = supabase.from('agenda_events').select('*').order('date', { ascending: true });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase.from('agenda_events').select('*').order('date', { ascending: true });
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }
    }
    if (error) throw error;
    const formatted: AgendaEvent[] = (data || []).map((item) => ({
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
  } catch (err) {
    console.warn('[DB] fetchAgendaEventsFromDb failed, using local cache:', err);
    return getStoredAgendaEvents();
  }
}

export async function upsertAgendaEventToDb(event: AgendaEvent, companyId: string): Promise<{ success: boolean; error?: string }> {
  saveAgendaEvents([event, ...getStoredAgendaEvents().filter(e => e.id !== event.id)]);
  try {
    const { error } = await supabase.from('agenda_events').upsert({
      id: event.id,
      company_id: companyId,
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time || null,
      client_id: event.clientId || null,
      project_id: event.projectId || null,
      description: event.description || null,
      status: event.status,
      notify_push: event.notifyPush,
    });
    if (error) {
      console.error('[DB] upsertAgendaEventToDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertAgendaEventToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteAgendaEventFromDb(eventId: string): Promise<{ success: boolean; error?: string }> {
  saveAgendaEvents(getStoredAgendaEvents().filter(e => e.id !== eventId));
  try {
    const { error } = await supabase.from('agenda_events').delete().eq('id', eventId);
    if (error) {
      console.error('[DB] deleteAgendaEventFromDb error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}


// ============================================================
// RBAC — User Profiles
// ============================================================

export async function fetchCompanyUsers(companyId: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((u) => ({
      id: u.id,
      companyId: u.company_id,
      email: u.email,
      name: u.name,
      role: u.role as UserRole,
      status: u.status as UserStatus,
      avatarUrl: u.avatar_url || undefined,
      mustChangePassword: u.must_change_password || false,
      lastLoginAt: u.last_login_at || undefined,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
  } catch (err) {
    console.warn('[DB] fetchCompanyUsers failed:', err);
    return [];
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      avatarUrl: data.avatar_url || undefined,
      mustChangePassword: data.must_change_password || false,
      lastLoginAt: data.last_login_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[DB] fetchUserProfile failed:', err);
    return null;
  }
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string; companyId: string }): Promise<void> {
  try {
    await supabase.from('user_profiles').upsert({
      id: profile.id,
      company_id: profile.companyId,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      status: profile.status || 'active',
      avatar_url: profile.avatarUrl || null,
      must_change_password: profile.mustChangePassword ?? false,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[DB] upsertUserProfile failed:', err);
  }
}

export const updateUserProfile = upsertUserProfile;

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  try {
    await supabase.from('user_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    console.warn('[DB] updateUserStatus failed:', err);
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await supabase.from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    console.warn('[DB] updateUserRole failed:', err);
  }
}

// Create user via Supabase Admin API (owner creates employees/admins)
export async function createCompanyUser(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Use signUp (we can't use Admin API directly from client SDK without service key)
    // The user will be created and their profile linked at login, OR:
    // We create the profile pre-emptively and the user logs in with the temp password
    const { data, error } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: { name: params.name },
    });

    if (error || !data.user) {
      // Fallback: try signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: { data: { name: params.name } },
      });
      if (signUpError || !signUpData.user) {
        return { success: false, error: signUpError?.message || 'Erro ao criar utilizador' };
      }
      // Create profile
      await supabase.from('user_profiles').insert({
        id: signUpData.user.id,
        company_id: params.companyId,
        email: params.email,
        name: params.name,
        role: params.role,
        status: 'active',
        must_change_password: true,
      });
      return { success: true, userId: signUpData.user.id };
    }

    // Create profile for admin-created user
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      company_id: params.companyId,
      email: params.email,
      name: params.name,
      role: params.role,
      status: 'active',
      must_change_password: true,
    });

    return { success: true, userId: data.user.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.warn('[DB] createCompanyUser failed:', err);
    return { success: false, error: message };
  }
}

// ============================================================
// RBAC — Permissions
// ============================================================

export async function fetchUserPermissions(userId: string): Promise<UserPermissionEntry[]> {
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('permission_id, scope, granted, granted_by, granted_at')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((p) => ({
      permissionId: p.permission_id,
      scope: p.scope as PermissionScope,
      granted: p.granted,
      grantedBy: p.granted_by || undefined,
      grantedAt: p.granted_at || undefined,
    }));
  } catch (err) {
    console.warn('[DB] fetchUserPermissions failed:', err);
    return [];
  }
}

export async function setUserPermissions(
  userId: string,
  permissions: Array<{ permissionId: string; scope: PermissionScope; granted: boolean }>,
  grantedBy: string
): Promise<void> {
  try {
    // Delete existing custom permissions for this user
    await supabase.from('user_permissions').delete().eq('user_id', userId);

    if (permissions.length === 0) return;

    // Insert new permissions
    await supabase.from('user_permissions').insert(
      permissions.map((p) => ({
        user_id: userId,
        permission_id: p.permissionId,
        scope: p.scope,
        granted: p.granted,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
      }))
    );
  } catch (err) {
    console.warn('[DB] setUserPermissions failed:', err);
  }
}

// ============================================================
// RBAC — Project Assignments
// ============================================================

export async function fetchProjectAssignments(companyId: string): Promise<ProjectAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*, projects!inner(company_id)')
      .eq('projects.company_id', companyId)
      .eq('status', 'active');
    if (error) throw error;
    return (data || []).map((a) => ({
      id: a.id,
      projectId: a.project_id,
      userId: a.user_id,
      assignedBy: a.assigned_by,
      assignedAt: a.assigned_at,
      assumedAt: a.assumed_at,
      status: a.status,
    }));
  } catch (err) {
    console.warn('[DB] fetchProjectAssignments failed:', err);
    return [];
  }
}

export async function assignProjectToUser(
  projectId: string,
  userId: string,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update project
    await supabase.from('projects').update({
      assignment_type: 'employee',
      assigned_to: userId,
    }).eq('id', projectId);

    // Upsert assignment
    await supabase.from('project_assignments').upsert({
      project_id: projectId,
      user_id: userId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'project_id,user_id' });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atribuir projeto';
    return { success: false, error: msg };
  }
}

export async function assumeAvailableProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('assume_project', { p_project_id: projectId });
    if (error) throw error;
    const result = data as { success: boolean; error?: string };
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao assumir projeto';
    return { success: false, error: msg };
  }
}

export async function makeProjectAvailable(projectId: string): Promise<void> {
  try {
    await supabase.from('projects').update({
      assignment_type: 'available',
      assigned_to: null,
    }).eq('id', projectId);

    await supabase.from('project_assignments')
      .update({ status: 'released' })
      .eq('project_id', projectId)
      .eq('status', 'active');
  } catch (err) {
    console.warn('[DB] makeProjectAvailable failed:', err);
  }
}

// ============================================================
// RBAC — Tasks
// ============================================================

export async function fetchTasks(companyId: string, projectId?: string): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*, user_profiles!tasks_assigned_to_fkey(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      companyId: t.company_id,
      projectId: t.project_id || undefined,
      title: t.title,
      description: t.description || undefined,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
      assignedTo: t.assigned_to || undefined,
      assignedToName: t.user_profiles?.name || undefined,
      assignedBy: t.assigned_by || undefined,
      dueDate: t.due_date || undefined,
      completedAt: t.completed_at || undefined,
      notes: t.notes || undefined,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  } catch (err) {
    console.warn('[DB] fetchTasks failed:', err);
    return [];
  }
}

export async function upsertTask(task: Partial<Task> & { id?: string; companyId: string; title: string; createdBy: string }): Promise<Task | null> {
  try {
    const now = new Date().toISOString();
    const id = task.id || crypto.randomUUID();

    const payload = {
      id,
      company_id: task.companyId,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description || null,
      status: task.status || 'Disponível',
      priority: task.priority || 'normal',
      assigned_to: task.assignedTo || null,
      assigned_by: task.assignedBy || null,
      due_date: task.dueDate || null,
      notes: task.notes || null,
      created_by: task.createdBy,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('tasks')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id,
      projectId: data.project_id || undefined,
      title: data.title,
      description: data.description || undefined,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      assignedTo: data.assigned_to || undefined,
      assignedBy: data.assigned_by || undefined,
      dueDate: data.due_date || undefined,
      completedAt: data.completed_at || undefined,
      notes: data.notes || undefined,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[DB] upsertTask failed:', err);
    return null;
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  try {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Concluída') updates.completed_at = new Date().toISOString();

    await supabase.from('tasks').update(updates).eq('id', taskId);
  } catch (err) {
    console.warn('[DB] updateTaskStatus failed:', err);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await supabase.from('tasks').delete().eq('id', taskId);
  } catch (err) {
    console.warn('[DB] deleteTask failed:', err);
  }
}

// ============================================================
// RBAC — Company Setup (first login)
// ============================================================

export async function initializeOwnerCompany(params: {
  userId: string;
  email: string;
  name: string;
  businessName: string;
}): Promise<{ companyId: string } | null> {
  try {
    // Check if already set up
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', params.userId)
      .single();

    if (existing?.company_id) return { companyId: existing.company_id };

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: params.businessName || 'Minha Empresa',
        created_by: params.userId,
      })
      .select()
      .single();

    if (companyError || !company) throw companyError;

    // Create owner profile
    await supabase.from('user_profiles').upsert({
      id: params.userId,
      company_id: company.id,
      email: params.email,
      name: params.name || 'Owner',
      role: 'owner',
      status: 'active',
      must_change_password: false,
    });

    // Migrate existing data
    const tables = ['clients', 'projects', 'incomes', 'expenses', 'categories', 'agenda_events', 'partners', 'notifications'];
    for (const table of tables) {
      await supabase.from(table).update({
        company_id: company.id,
        ...(table !== 'categories' ? { created_by: params.userId } : {}),
      }).is('company_id', null);
    }

    return { companyId: company.id };
  } catch (err) {
    console.warn('[DB] initializeOwnerCompany failed:', err);
    return null;
  }
}

// ============================================================
// RBAC — Billing Requests (Fase 2)
// ============================================================

export async function fetchBillingRequests(
  companyId: string,
  userId?: string,
  isOwnerOrAdmin?: boolean
): Promise<BillingRequest[]> {
  try {
    let query = supabase
      .from('billing_requests')
      .select(`
        *,
        user_profiles!billing_requests_requested_by_fkey ( name ),
        projects ( name, clients ( name ) )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!isOwnerOrAdmin && userId) {
      query = query.eq('requested_by', userId);
    }

    const { data, error } = await query;
    if (error || !data) {
      // Fallback without joins if foreign keys differ
      const { data: rawData, error: rawError } = await supabase
        .from('billing_requests')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (rawError || !rawData) return [];
      return rawData.map((d: any) => ({
        id: d.id,
        companyId: d.company_id,
        projectId: d.project_id || undefined,
        requestedBy: d.requested_by,
        amount: Number(d.amount) || 0,
        currency: d.currency || 'BRL',
        description: d.description,
        status: d.status,
        reviewedBy: d.reviewed_by || undefined,
        reviewedAt: d.reviewed_at || undefined,
        reviewNotes: d.review_notes || undefined,
        incomeId: d.income_id || undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }

    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id,
      projectId: d.project_id || undefined,
      projectName: d.projects?.name,
      clientName: d.projects?.clients?.name,
      requestedBy: d.requested_by,
      requestedByName: d.user_profiles?.name,
      amount: Number(d.amount) || 0,
      currency: d.currency || 'BRL',
      description: d.description,
      status: d.status,
      reviewedBy: d.reviewed_by || undefined,
      reviewedAt: d.reviewed_at || undefined,
      reviewNotes: d.review_notes || undefined,
      incomeId: d.income_id || undefined,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (err) {
    console.warn('[DB] fetchBillingRequests failed:', err);
    return [];
  }
}

export async function createBillingRequest(params: {
  companyId: string;
  projectId?: string;
  requestedBy: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
}): Promise<BillingRequest | null> {
  try {
    const { data, error } = await supabase
      .from('billing_requests')
      .insert({
        company_id: params.companyId,
        project_id: params.projectId || null,
        requested_by: params.requestedBy,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        status: 'Solicitada',
      })
      .select()
      .single();

    if (error || !data) throw error;

    return {
      id: data.id,
      companyId: data.company_id,
      projectId: data.project_id || undefined,
      requestedBy: data.requested_by,
      amount: Number(data.amount) || 0,
      currency: data.currency,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('[DB] createBillingRequest failed:', err);
    return null;
  }
}

export async function reviewBillingRequest(params: {
  requestId: string;
  status: 'Aprovada' | 'Rejeitada' | 'Em análise';
  reviewerId: string;
  notes?: string;
}): Promise<{ success: boolean; incomeId?: string; error?: string }> {
  try {
    if (params.status === 'Aprovada') {
      // Use database function for secure income generation and approval
      const { data, error } = await supabase.rpc('approve_billing_request', {
        p_request_id: params.requestId,
        p_notes: params.notes || null,
      });

      if (error) throw error;
      if (data && data.success === false) {
        return { success: false, error: data.error };
      }
      return { success: true, incomeId: data?.income_id };
    }

    // Otherwise standard update (Rejeitada / Em análise)
    const { error } = await supabase
      .from('billing_requests')
      .update({
        status: params.status,
        reviewed_by: params.reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: params.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    console.warn('[DB] reviewBillingRequest failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Falha ao processar solicitação' };
  }
}

export async function deleteBillingRequest(requestId: string): Promise<void> {
  try {
    await supabase.from('billing_requests').delete().eq('id', requestId);
  } catch (err) {
    console.warn('[DB] deleteBillingRequest failed:', err);
  }
}


