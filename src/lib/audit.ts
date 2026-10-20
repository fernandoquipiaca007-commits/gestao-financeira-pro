// ============================================================
// Audit Helper — Registo de Ações Administrativas
// ============================================================

import { supabase } from './supabase';
import { AuditLogEntry, UserRole } from '../types/rbac';

interface LogActionParams {
  companyId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  result?: 'success' | 'error' | 'denied';
}

/**
 * Regista uma acção de auditoria no Supabase.
 * Falhas são silenciosas para não interromper operações principais.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      user_role: params.userRole,
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      changes: params.changes || null,
      result: params.result || 'success',
    });
  } catch (err) {
    console.warn('[Audit] Failed to log action:', params.action, err);
  }
}

/**
 * Busca logs de auditoria da empresa.
 */
export async function fetchAuditLogs(companyId: string, limit = 100): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      companyId: item.company_id,
      userId: item.user_id,
      userName: item.user_name,
      userRole: item.user_role as UserRole,
      action: item.action,
      resourceType: item.resource_type,
      resourceId: item.resource_id,
      changes: item.changes,
      result: item.result,
      ipAddress: item.ip_address,
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.warn('[Audit] Failed to fetch audit logs:', err);
    return [];
  }
}

/**
 * Formata uma entrada de auditoria em texto legível.
 * Ex: "Fernando alterou permissões de João"
 */
export function formatAuditEntry(entry: AuditLogEntry, lang: 'pt' | 'en' = 'pt'): string {
  const isEn = lang === 'en';
  const actor = entry.userName || (isEn ? 'System' : 'Sistema');
  const when = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString(isEn ? 'en-US' : 'pt-PT', { dateStyle: 'short', timeStyle: 'short' })
    : '';

  const actionMessages: Record<string, { pt: string; en: string }> = {
    'user.create':        { pt: `${actor} criou um novo utilizador`, en: `${actor} created a new user` },
    'user.edit':          { pt: `${actor} editou um utilizador`, en: `${actor} edited a user` },
    'user.suspend':       { pt: `${actor} suspendeu um utilizador`, en: `${actor} suspended a user` },
    'user.activate':      { pt: `${actor} reativou um utilizador`, en: `${actor} reactivated a user` },
    'user.delete':        { pt: `${actor} eliminou um utilizador`, en: `${actor} deleted a user` },
    'user.role_change':   { pt: `${actor} alterou o cargo de um utilizador`, en: `${actor} changed a user role` },
    'permission.grant':   { pt: `${actor} concedeu permissões a um utilizador`, en: `${actor} granted permissions to a user` },
    'permission.revoke':  { pt: `${actor} revogou permissões de um utilizador`, en: `${actor} revoked permissions from a user` },
    'project.assign':     { pt: `${actor} atribuiu um projeto a um funcionário`, en: `${actor} assigned a project to an employee` },
    'project.assume':     { pt: `${actor} assumiu um projeto disponível`, en: `${actor} claimed an available project` },
    'project.create':     { pt: `${actor} criou um novo projeto`, en: `${actor} created a new project` },
    'project.edit':       { pt: `${actor} editou um projeto`, en: `${actor} edited a project` },
    'project.delete':     { pt: `${actor} eliminou um projeto`, en: `${actor} deleted a project` },
    'task.create':        { pt: `${actor} criou uma nova tarefa`, en: `${actor} created a new task` },
    'task.assign':        { pt: `${actor} atribuiu uma tarefa`, en: `${actor} assigned a task` },
    'task.complete':      { pt: `${actor} concluiu uma tarefa`, en: `${actor} completed a task` },
    'task.status_change': { pt: `${actor} alterou o estado de uma tarefa`, en: `${actor} changed task status` },
    'client.create':      { pt: `${actor} criou um novo cliente`, en: `${actor} created a new client` },
    'client.edit':        { pt: `${actor} editou um cliente`, en: `${actor} edited a client` },
    'client.delete':      { pt: `${actor} eliminou um cliente`, en: `${actor} deleted a client` },
    'settings.edit':      { pt: `${actor} alterou as configurações da empresa`, en: `${actor} changed company settings` },
  };

  const message = actionMessages[entry.action]?.[lang] || (isEn ? `${actor} performed: ${entry.action}` : `${actor} realizou: ${entry.action}`);
  return when ? `${message} • ${when}` : message;
}
