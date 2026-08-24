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
export function formatAuditEntry(entry: AuditLogEntry): string {
  const actor = entry.userName || 'Sistema';
  const when = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
    : '';

  const actionMessages: Record<string, string> = {
    'user.create':          `${actor} criou um novo utilizador`,
    'user.edit':            `${actor} editou um utilizador`,
    'user.suspend':         `${actor} suspendeu um utilizador`,
    'user.activate':        `${actor} reativou um utilizador`,
    'user.delete':          `${actor} eliminou um utilizador`,
    'user.role_change':     `${actor} alterou o cargo de um utilizador`,
    'permission.grant':     `${actor} concedeu permissões a um utilizador`,
    'permission.revoke':    `${actor} revogou permissões de um utilizador`,
    'project.assign':       `${actor} atribuiu um projeto a um funcionário`,
    'project.assume':       `${actor} assumiu um projeto disponível`,
    'project.create':       `${actor} criou um novo projeto`,
    'project.edit':         `${actor} editou um projeto`,
    'project.delete':       `${actor} eliminou um projeto`,
    'task.create':          `${actor} criou uma nova tarefa`,
    'task.assign':          `${actor} atribuiu uma tarefa`,
    'task.complete':        `${actor} concluiu uma tarefa`,
    'task.status_change':   `${actor} alterou o estado de uma tarefa`,
    'client.create':        `${actor} criou um novo cliente`,
    'client.edit':          `${actor} editou um cliente`,
    'client.delete':        `${actor} eliminou um cliente`,
    'settings.edit':        `${actor} alterou as configurações da empresa`,
  };

  const message = actionMessages[entry.action] || `${actor} realizou: ${entry.action}`;
  return when ? `${message} • ${when}` : message;
}
