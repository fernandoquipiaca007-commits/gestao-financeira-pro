import { createClient } from '@supabase/supabase-js';
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
  CashReserve,
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

// Uma referência inválida (cliente/projeto/parceiro apagado) nunca é "resolvida" gravando o
// registo sem o vínculo: isso deixava receitas órfãs e relatórios por cliente/projeto errados.
function describeDbError(error: { code?: string; message?: string }): string {
  if (error.code === '23503') {
    return 'Este registo está ligado a outro (cliente, projeto ou receita) e a alteração deixaria o histórico incompleto. Atualize a página e tente de novo.';
  }
  return error.message || 'Erro desconhecido';
}

// Supabase-backed categories
export async function fetchCategoriesFromDb(companyId?: string): Promise<CategoryItem[]> {
  try {
    let query = supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return [];
    const categories: CategoryItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      color: r.color,
      createdAt: r.created_at,
    }));
    return categories;
  } catch {
    return [];
  }
}

export async function upsertCategoryToDb(category: CategoryItem, companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('categories').upsert({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      company_id: companyId,
      created_at: category.createdAt || new Date().toISOString(),
    });
    if (error) return { success: false, error: describeDbError(error) };
    return { success: true };
  } catch (e) {
    console.error('[upsertCategoryToDb]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}

export async function deleteCategoryFromDb(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) return { success: false, error: describeDbError(error) };
    return { success: true };
  } catch (e) {
    console.error('[deleteCategoryFromDb]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}

// Supabase-backed settings
export async function fetchSettingsFromDb(companyId: string): Promise<AppSettings | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      defaultCurrency: data.default_currency,
      userName: data.user_name,
      businessName: data.business_name,
      exchangeRates: data.exchange_rates || { BRL: 1, AOA: 165, USD: 0.18, EUR: 0.16 },
      emailSettings: data.email_settings || undefined,
      profitSplit: Array.isArray(data.profit_split) ? data.profit_split : [],
    } as AppSettings;
  } catch {
    return null;
  }
}

export async function upsertSettingsToDb(settings: AppSettings, companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('app_settings').upsert({
      company_id: companyId,
      default_currency: settings.defaultCurrency,
      user_name: settings.userName,
      business_name: settings.businessName,
      exchange_rates: settings.exchangeRates || {},
      profit_split: settings.profitSplit || [],
      email_settings: (settings as any).emailSettings || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'company_id',
    });

    if (error) {
      console.error('[upsertSettingsToDb] Supabase error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[upsertSettingsToDb] Exception:', e);
    return { success: false, error: e?.message };
  }
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
    if (error) throw error;
    // As colunas da ficha completa existem? (select * devolve a chave mesmo com valor nulo)
    if (data && data.length > 0) clientProfileSupported = 'tax_id' in data[0];
    if (data && data.length > 0) clientPipelineSupported = 'pipeline_stage' in data[0];
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
      // Ficha completa (migração 014; ausentes antes da migração)
      taxId: item.tax_id || undefined,
      website: item.website || undefined,
      address: item.address || undefined,
      city: item.city || undefined,
      postalCode: item.postal_code || undefined,
      contactName: item.contact_name || undefined,
      contactRole: item.contact_role || undefined,
      preferredChannel: item.preferred_channel || undefined,
      paymentTermsDays: item.payment_terms_days ?? undefined,
      tags: Array.isArray(item.tags) ? item.tags : undefined,
      source: item.source || undefined,
      pipelineStage: item.pipeline_stage || undefined,
      isFavorite: Boolean(item.is_favorite),
      rating: item.rating ?? undefined,
      contractType: item.contract_type || undefined,
      nextContactDate: item.next_contact_date || undefined,
      nextAction: item.next_action || undefined,
      lastContactAt: item.last_contact_at || undefined,
      summary: item.summary || undefined,
    }));
    saveClients(formatted);
    return formatted;
  } catch (err) {
    console.warn('[DB] fetchClientsFromDb failed, using local cache:', err);
    return getStoredClients();
  }
}



/** Colunas da ficha completa (migração 014). Antes da migração não envia nada destas colunas;
    depois, envia todas (vazio → NULL, para permitir limpar um campo). */
let clientPipelineSupported = true; // acompanhamento comercial (migração 20261022120000)
let clientProfileSupported = true; // migração 014 aplicada em produção; a leitura desliga isto se as colunas faltarem
function clientProfileColumns(c: Client): Record<string, unknown> {
  if (!clientProfileSupported) return {};
  const v = (x?: string) => (x && x.trim() ? x.trim() : null);
  return {
    tax_id: v(c.taxId), website: v(c.website), address: v(c.address), city: v(c.city), postal_code: v(c.postalCode),
    contact_name: v(c.contactName), contact_role: v(c.contactRole), preferred_channel: c.preferredChannel || null,
    payment_terms_days: typeof c.paymentTermsDays === 'number' && !isNaN(c.paymentTermsDays) ? c.paymentTermsDays : null,
    tags: c.tags && c.tags.length ? c.tags : null, source: v(c.source),
    ...(clientPipelineSupported ? {
      pipeline_stage: c.pipelineStage || null, is_favorite: Boolean(c.isFavorite),
      rating: typeof c.rating === 'number' && c.rating >= 1 && c.rating <= 5 ? Math.round(c.rating) : null,
      contract_type: v(c.contractType), next_contact_date: c.nextContactDate || null, next_action: v(c.nextAction),
      last_contact_at: c.lastContactAt || null, summary: v(c.summary),
    } : {}),
  };
}

export async function upsertClientToDb(client: Client, companyId: string): Promise<{ success: boolean; error?: string }> {
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
      ...clientProfileColumns(client),
    });
    if (error) {
      console.error('[DB] upsertClientToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveClients([client, ...getStoredClients().filter(c => c.id !== client.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertClientToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteClientFromDb(clientId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      console.error('[DB] deleteClientFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveClients(getStoredClients().filter(c => c.id !== clientId));
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
        parentProjectId: item.parent_project_id || undefined,
        coveredAmount: Number(item.covered_amount) || 0,
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
        invoiceFooter: item.invoice_footer || undefined,
        invoiceNotes: item.invoice_notes || undefined,
        archived: Boolean(item.archived),
        billingType: item.billing_type || 'unico',
        recurringAmount: item.recurring_amount != null ? Number(item.recurring_amount) : undefined,
        recurringEnd: item.recurring_end || undefined,
        archivedAt: item.archived_at || undefined,
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
      parent_project_id: project.parentProjectId || null,
      covered_amount: Number(project.coveredAmount) || 0,
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
      invoice_footer: project.invoiceFooter || null,
      invoice_notes: project.invoiceNotes || null,
      archived: Boolean(project.archived),
      billing_type: project.billingType || 'unico',
      recurring_amount: project.billingType && project.billingType !== 'unico' ? Number(project.recurringAmount) || 0 : null,
      recurring_end: project.billingType && project.billingType !== 'unico' ? project.recurringEnd || null : null,
      archived_at: project.archived ? project.archivedAt || new Date().toISOString() : null,
    };

    const { error } = await supabase.from('projects').upsert(payload);
    if (error) {
      console.error('[DB] upsertProjectToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveProjects([project, ...getStoredProjects().filter((p) => p.id !== project.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertProjectToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteProjectFromDb(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      console.error('[DB] deleteProjectFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveProjects(getStoredProjects().filter(p => p.id !== projectId));
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
      stripeInvoiceId: item.stripe_invoice_id || undefined,
      stripeCustomerId: item.stripe_customer_id || undefined,
      stripeInvoiceUrl: item.stripe_invoice_url || undefined,
      stripeInvoicePdf: item.stripe_invoice_pdf || undefined,
      stripeReceiptUrl: item.stripe_receipt_url || undefined,
      stripeStatus: item.stripe_status || undefined,
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
      stripe_invoice_id: income.stripeInvoiceId || null,
      stripe_customer_id: income.stripeCustomerId || null,
      stripe_invoice_url: income.stripeInvoiceUrl || null,
      stripe_invoice_pdf: income.stripeInvoicePdf || null,
      stripe_receipt_url: income.stripeReceiptUrl || null,
      stripe_status: income.stripeStatus || null,
    };

    const { error } = await supabase.from('incomes').upsert(payload);
    if (error) {
      console.error('[DB] upsertIncomeToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveIncomes([income, ...getStoredIncomes().filter(i => i.id !== income.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertIncomeToDb exception:', msg);
    return { success: false, error: msg };
  }
}

/** Cria a receita só se ainda não existir (nunca sobrescreve uma cobrança já paga). */
export async function insertIncomeIfMissing(income: Income, companyId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('incomes').upsert({
    id: income.id,
    company_id: companyId,
    client_id: income.clientId || null,
    project_id: income.projectId || null,
    description: income.description,
    amount: Number(income.amount) || 0,
    currency: income.currency,
    due_date: income.dueDate,
    received_date: null,
    payment_method: income.paymentMethod || 'Transferência',
    status: income.status,
    notes: income.notes || null,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) return { success: false, error: describeDbError(error) };
  return { success: true };
}

export async function deleteIncomeFromDb(incomeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('incomes').delete().eq('id', incomeId);
    if (error) {
      console.error('[DB] deleteIncomeFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveIncomes(getStoredIncomes().filter(i => i.id !== incomeId));
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
      reserveId: item.reserve_id || undefined,
      advanceAmount: Number(item.advance_amount) || 0,
      settledByAdvance: Boolean(item.settled_by_advance),
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
      reserve_id: expense.reserveId || null,
      advance_amount: Number(expense.advanceAmount) || 0,
      settled_by_advance: Boolean(expense.settledByAdvance),
    });
    if (error) {
      console.error('[DB] upsertExpenseToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveExpenses([expense, ...getStoredExpenses().filter(e => e.id !== expense.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertExpenseToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteExpenseFromDb(expenseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.error('[DB] deleteExpenseFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveExpenses(getStoredExpenses().filter(e => e.id !== expenseId));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ----------------------------------------------------
// PARTNER DB OPERATIONS
// ----------------------------------------------------

// ----------------------------------------------------
// RESERVAS DE CAIXA
// ----------------------------------------------------

export async function fetchCashReservesFromDb(companyId: string): Promise<CashReserve[] | null> {
  const { data, error } = await supabase
    .from('cash_reserves')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: true });
  if (error) {
    console.warn('[DB] fetchCashReservesFromDb:', error.message);
    return null;
  }
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount) || 0,
    currency: r.currency || 'BRL',
    date: r.date,
    notes: r.notes || undefined,
    closed: Boolean(r.closed),
    createdAt: r.created_at,
  }));
}

export async function upsertCashReserveToDb(reserve: CashReserve, companyId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('cash_reserves').upsert({
    id: reserve.id,
    company_id: companyId,
    name: reserve.name,
    amount: Number(reserve.amount) || 0,
    currency: reserve.currency,
    date: reserve.date,
    notes: reserve.notes || null,
    closed: reserve.closed,
  });
  if (error) return { success: false, error: describeDbError(error) };
  return { success: true };
}

export async function deleteCashReserveFromDb(reserveId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('cash_reserves').delete().eq('id', reserveId);
  if (error) return { success: false, error: describeDbError(error) };
  return { success: true };
}

export async function fetchPartnersFromDb(companyId?: string): Promise<Partner[]> {
  try {
    let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (companyId) query = query.eq('company_id', companyId);
    let { data, error } = await query;
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
      console.error('[DB] upsertPartnerToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    savePartners([partner, ...getStoredPartners().filter(p => p.id !== partner.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertPartnerToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deletePartnerFromDb(partnerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('partners').delete().eq('id', partnerId);
    if (error) {
      console.error('[DB] deletePartnerFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    savePartners(getStoredPartners().filter(p => p.id !== partnerId));
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
      console.error('[DB] upsertAgendaEventToDb:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveAgendaEvents([event, ...getStoredAgendaEvents().filter(e => e.id !== event.id)]);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[DB] upsertAgendaEventToDb exception:', msg);
    return { success: false, error: msg };
  }
}

export async function deleteAgendaEventFromDb(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('agenda_events').delete().eq('id', eventId);
    if (error) {
      console.error('[DB] deleteAgendaEventFromDb error:', error.message);
      return { success: false, error: describeDbError(error) };
    }
    saveAgendaEvents(getStoredAgendaEvents().filter(e => e.id !== eventId));
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
      .maybeSingle();
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
    const payload: any = {
      id: profile.id,
      company_id: profile.companyId,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      status: profile.status || 'active',
      avatar_url: profile.avatarUrl || null,
      must_change_password: profile.mustChangePassword ?? false,
      updated_at: new Date().toISOString(),
    };
    if (profile.language) {
      payload.language = profile.language;
    }
    const { error } = await supabase.from('user_profiles').upsert(payload);
    if (error && profile.language) {
      // Column might not exist yet in DB schema; fallback without language column
      delete payload.language;
      await supabase.from('user_profiles').upsert(payload);
    }
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

// Create user safely with 3-layer resilience:
// 1. Edge Function (server-side Admin API)
// 2. Isolated signUp (ephemeral client, no session hijack)
// 3. Direct REST API fallback
export async function createCompanyUser(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanPassword = params.password || 'Mudar123!';

  console.log('[createCompanyUser] Iniciando criação:', { email: cleanEmail, name: cleanName, role: params.role });

  // ── Strategy 1: Edge Function ─────────────────────────────────────────
  try {
    console.log('[createCompanyUser] Tentando Edge Function create-user...');
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: cleanEmail,
        password: cleanPassword,
        name: cleanName,
        role: params.role,
        companyId: params.companyId,
      },
    });

    if (!error && data?.success && data?.userId) {
      console.log('[createCompanyUser] [SUCCESS] Edge Function sucesso! userId:', data.userId);
      return { success: true, userId: data.userId };
    }

    // Edge Function retornou mas sem sucesso — log detalhado
    console.warn('[createCompanyUser] Edge Function falhou:', {
      error: error?.message,
      data,
    });
  } catch (edgeFnErr) {
    console.warn('[createCompanyUser] Edge Function exception:', edgeFnErr);
  }

  // ── Strategy 2: Isolated signUp ───────────────────────────────────────
  try {
    console.log('[createCompanyUser] Tentando signUp isolado...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    // Cliente completamente isolado — não toca no localStorage do Owner
    const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-isolated-create-user-' + Date.now(), // chave única para evitar colisão
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
    });

    const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: { data: { name: cleanName } },
    });

    console.log('[createCompanyUser] signUp resultado:', {
      userId: signUpData?.user?.id,
      error: signUpError?.message,
      identitiesLength: signUpData?.user?.identities?.length,
    });

    if (signUpError) {
      // Utilizador já existente — tenta recuperar e actualizar perfil
      if (signUpError.message?.toLowerCase().includes('already registered') ||
          signUpError.message?.toLowerCase().includes('already been registered')) {
        console.log('[createCompanyUser] Utilizador já existe no Auth, procurando perfil...');
        return await handleExistingUser(cleanEmail, cleanName, params.role, params.companyId);
      }
      throw new Error(signUpError.message);
    }

    // signUp pode devolver user com identities[] vazia = email já registado (Supabase v2)
    if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
      console.log('[createCompanyUser] signUp retornou identities vazia — email já registado');
      return await handleExistingUser(cleanEmail, cleanName, params.role, params.companyId);
    }

    if (!signUpData?.user?.id) {
      throw new Error('signUp não retornou ID do utilizador');
    }

    const userId = signUpData.user.id;
    console.log('[createCompanyUser] [SUCCESS] signUp sucesso! userId:', userId);

    // Inserir perfil via upsert
    await upsertUserProfileSafe(userId, cleanEmail, cleanName, params.role, params.companyId);

    return { success: true, userId };
  } catch (signUpErr: unknown) {
    const msg = signUpErr instanceof Error ? signUpErr.message : String(signUpErr);
    console.error('[createCompanyUser] signUp isolado falhou:', msg);
    return { success: false, error: msg };
  }
}

// Helper: insert/update user_profiles com bypass de RLS via upsert
async function upsertUserProfileSafe(
  userId: string,
  email: string,
  name: string,
  role: UserRole,
  companyId: string
): Promise<void> {
  console.log('[upsertUserProfileSafe] Upserting perfil...', { userId, email, role });

  const { error } = await supabase.from('user_profiles').upsert(
    {
      id: userId,
      company_id: companyId,
      email,
      name,
      role,
      status: 'active' as UserStatus,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('[upsertUserProfileSafe] Upsert falhou:', error.message, error.details, error.hint);
    // Tentar INSERT directo caso o upsert falhe
    const { error: insertErr } = await supabase.from('user_profiles').insert({
      id: userId,
      company_id: companyId,
      email,
      name,
      role,
      status: 'active',
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertErr) {
      console.error('[upsertUserProfileSafe] INSERT directo também falhou:', insertErr.message);
    } else {
      console.log('[upsertUserProfileSafe] [SUCCESS] INSERT directo sucesso');
    }
  } else {
    console.log('[upsertUserProfileSafe] [SUCCESS] Upsert sucesso');
  }
}

// Helper: tratar utilizador que já existe no Auth
async function handleExistingUser(
  email: string,
  name: string,
  role: UserRole,
  companyId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile?.id) {
    console.log('[handleExistingUser] Perfil encontrado, actualizando...', existingProfile.id);
    await upsertUserProfileSafe(existingProfile.id, email, name, role, companyId);
    return { success: true, userId: existingProfile.id };
  }

  console.warn('[handleExistingUser] Email registado no Auth mas sem perfil em user_profiles');
  return {
    success: false,
    error: `O email ${email} já está registado no sistema mas não tem perfil associado. Contacte o suporte.`,
  };
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

    return (data || []).map((t) => {
      const catMatch = t.notes?.match(/^\[CAT:([^\]]+)\]\n?/);
      const cleanNotes = catMatch ? t.notes.replace(/^\[CAT:[^\]]+\]\n?/, '') : t.notes;
      const taskCategory = t.category || (catMatch ? catMatch[1] : undefined);

      return {
        id: t.id,
        companyId: t.company_id,
        projectId: t.project_id || undefined,
        category: taskCategory,
        title: t.title,
        description: t.description || undefined,
        status: t.status as TaskStatus,
        priority: t.priority as TaskPriority,
        assignedTo: t.assigned_to || undefined,
        assignedToName: t.user_profiles?.name || undefined,
        assignedBy: t.assigned_by || undefined,
        dueDate: t.due_date || undefined,
        completedAt: t.completed_at || undefined,
        notes: cleanNotes || undefined,
        createdBy: t.created_by,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });
  } catch (err) {
    console.warn('[DB] fetchTasks failed:', err);
    return [];
  }
}

export async function upsertTask(task: Partial<Task> & { id?: string; companyId: string; title: string; createdBy: string }): Promise<Task> {
  const now = new Date().toISOString();
  const id = task.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  let notesPayload = task.notes || null;
  if (task.category) {
    notesPayload = `[CAT:${task.category.trim()}]\n${task.notes || ''}`.trim();
  }

  // Format dueDate cleanly as YYYY-MM-DD for PostgreSQL DATE type
  const cleanDueDate = task.dueDate ? task.dueDate.split('T')[0] : null;

  const localTask: Task = {
    id,
    companyId: task.companyId,
    projectId: task.projectId || undefined,
    category: task.category || undefined,
    title: task.title,
    description: task.description || undefined,
    status: (task.status as TaskStatus) || 'Disponível',
    priority: (task.priority as TaskPriority) || 'normal',
    assignedTo: task.assignedTo || undefined,
    assignedBy: task.assignedBy || undefined,
    dueDate: cleanDueDate || undefined,
    notes: task.notes || undefined,
    createdBy: task.createdBy,
    createdAt: task.createdAt || now,
    updatedAt: now,
  };

  try {
    const payload: Record<string, unknown> = {
      id,
      company_id: task.companyId,
      project_id: task.projectId && task.projectId.trim() ? task.projectId : null,
      title: task.title.trim(),
      description: task.description ? task.description.trim() : null,
      status: task.status || 'Disponível',
      priority: task.priority || 'normal',
      assigned_to: task.assignedTo && task.assignedTo.trim() ? task.assignedTo : null,
      assigned_by: task.assignedBy && task.assignedBy.trim() ? task.assignedBy : null,
      due_date: cleanDueDate,
      notes: notesPayload,
      created_by: task.createdBy,
      updated_at: now,
    };

    if (task.id) {
      // Update existing task
      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select()
        .single();

      if (error) {
        console.warn('[DB] tasks update warning:', error);
      } else if (data) {
        localTask.updatedAt = data.updated_at || now;
      }
    } else {
      // Insert new task
      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('[DB] tasks insert warning:', error);
      } else if (data) {
        localTask.id = data.id;
        localTask.createdAt = data.created_at || now;
        localTask.updatedAt = data.updated_at || now;
      }
    }

    return localTask;
  } catch (err) {
    console.warn('[DB] upsertTask exception — retaining local task:', err);
    return localTask;
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Concluída') updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) {
      console.warn('[DB] updateTaskStatus failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[DB] updateTaskStatus failed:', err);
    return false;
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

// ----------------------------------------------------
// NOTIFICATIONS DB OPERATIONS (LANDING PAGE LEADS & ALERTS)
// ----------------------------------------------------

export async function fetchNotificationsFromDb(companyId?: string): Promise<NotificationItem[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    let { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (companyId) {
        const fallback = await supabase
          .from('notifications')
          .select('*')
          .eq('read', false)
          .order('created_at', { ascending: false });
        if (!fallback.error && fallback.data) {
          data = fallback.data;
          error = null;
        }
      }
    }

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      type: item.type || 'new_lead',
      title: item.title,
      message: item.message,
      date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      clientId: item.client_id || undefined,
      projectId: item.project_id || undefined,
      incomeId: item.income_id || undefined,
      expenseId: item.expense_id || undefined,
      whatsappMessage: item.whatsapp_message || undefined,
      whatsappPhone: item.whatsapp_phone || undefined,
      severity: item.severity || 'high',
      read: item.read || false,
    }));
  } catch (err) {
    console.warn('[DB] fetchNotificationsFromDb failed:', err);
    return [];
  }
}

export async function markNotificationAsReadInDb(notificationId: string): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  } catch (err) {
    console.warn('[DB] markNotificationAsReadInDb failed:', err);
  }
}

export async function deleteNotificationFromDb(notificationId: string): Promise<void> {
  try {
    await supabase.from('notifications').delete().eq('id', notificationId);
  } catch (err) {
    console.warn('[DB] deleteNotificationFromDb failed:', err);
  }
}



