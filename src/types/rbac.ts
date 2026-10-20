// ============================================================
// RBAC Types — Hierarquia de Acessos, Cargos e Permissões
// ============================================================

import { CurrencyCode } from '../types';

export type UserRole = 'owner' | 'admin' | 'employee';
export type PermissionScope = 'ALL' | 'ASSIGNED' | 'OWN' | 'TEAM';
export type UserStatus = 'active' | 'suspended' | 'invited';
export type TaskStatus = 'Disponível' | 'Aguardando' | 'Em andamento' | 'Em revisão' | 'Concluída' | 'Cancelada';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProjectAssignmentType = 'company' | 'employee' | 'available';
export type AuditResult = 'success' | 'error' | 'denied';

export type BillingRequestStatus = 'Solicitada' | 'Em análise' | 'Aprovada' | 'Rejeitada' | 'Faturada';

// ------------------------------------------------------------------
// Perfil de Utilizador
// ------------------------------------------------------------------
export interface UserProfile {
  id: string; // auth.users.id (UUID)
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  language?: 'pt' | 'en';
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------
// Empresa
// ------------------------------------------------------------------
export interface Company {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

// ------------------------------------------------------------------
// Permissões
// ------------------------------------------------------------------
export interface Permission {
  id: string;       // ex: 'projects.view'
  resource: string; // ex: 'projects'
  action: string;   // ex: 'view'
  description?: string;
  scopeOptions: PermissionScope[];
}

export interface UserPermissionEntry {
  permissionId: string;
  scope: PermissionScope;
  granted: boolean;
  grantedBy?: string;
  grantedAt?: string;
}

export interface RoleDefaultPermission {
  role: UserRole;
  permissionId: string;
  defaultScope: PermissionScope;
}

// Mapa em memória de permissões efectivas do utilizador
export type PermissionMap = Map<string, { scope: PermissionScope; granted: boolean }>;

// ------------------------------------------------------------------
// Atribuição de Projetos
// ------------------------------------------------------------------
export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  assignedBy?: string;
  assignedAt: string;
  assumedAt?: string;
  status: 'active' | 'completed' | 'released';
}

// ------------------------------------------------------------------
// Tarefas
// ------------------------------------------------------------------
export interface Task {
  id: string;
  companyId: string;
  projectId?: string;
  category?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;   // user_id
  assignedToName?: string;
  assignedBy?: string;   // user_id
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------
// Solicitações de Faturamento (Fase 2)
// ------------------------------------------------------------------
export interface BillingRequest {
  id: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  clientName?: string;
  requestedBy: string;
  requestedByName?: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  status: BillingRequestStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  incomeId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------
// Log de Auditoria
// ------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  companyId: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  action: string;          // ex: 'permission.grant', 'project.assume', 'user.suspend', 'billing.approve'
  resourceType?: string;   // ex: 'project', 'user', 'task', 'billing_request'
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  result: AuditResult;
  ipAddress?: string;
  createdAt: string;
}

// ------------------------------------------------------------------
// Constantes de UI para Labels/Badges
// ------------------------------------------------------------------
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  employee: 'Funcionário',
};

export const ROLE_LABELS_EN: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  employee: 'Employee',
};

export function getRoleLabel(role: UserRole, lang: 'pt' | 'en' = 'pt'): string {
  return lang === 'en' ? ROLE_LABELS_EN[role] || role : ROLE_LABELS[role] || role;
}

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  owner:    { bg: 'var(--primary-solid)', text: 'var(--primary-fg)', border: 'var(--primary-solid)' },
  admin:    { bg: 'var(--info-soft)', text: 'var(--info-fg)', border: 'var(--info-fg)' },
  employee: { bg: 'var(--surface-3)', text: 'var(--text-secondary)', border: 'var(--border-default)' },
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  owner:    'bg-primary shadow-primary-3d text-primary-fg border border-transparent ',
  admin:    'bg-accent-soft text-accent-soft-fg border border-accent/20 ',
  employee: 'bg-surface-2 text-fg-secondary border border-line-subtle ',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active:    'Ativo',
  suspended: 'Suspenso',
  invited:   'Convidado',
};

export const STATUS_LABELS_EN: Record<UserStatus, string> = {
  active:    'Active',
  suspended: 'Suspended',
  invited:   'Invited',
};

export function getStatusLabel(status: UserStatus, lang: 'pt' | 'en' = 'pt'): string {
  return lang === 'en' ? STATUS_LABELS_EN[status] || status : STATUS_LABELS[status] || status;
}

export const STATUS_COLORS: Record<UserStatus, { bg: string; text: string }> = {
  active:    { bg: 'var(--success-soft)', text: 'var(--success-fg)' },
  suspended: { bg: 'var(--danger-soft)', text: 'var(--danger-fg)' },
  invited:   { bg: 'var(--warning-soft)', text: 'var(--warning-fg)' },
};

export const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  active:    'bg-success-soft text-success-fg border border-success/20 ',
  suspended: 'bg-danger-soft text-danger-fg border border-danger/20 ',
  invited:   'bg-warning-soft text-warning-fg border border-warning/20 ',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  'Disponível':   { bg: 'var(--info-soft)', text: 'var(--info-fg)' },
  'Aguardando':   { bg: 'var(--warning-soft)', text: 'var(--warning-fg)' },
  'Em andamento': { bg: 'var(--surface-3)', text: 'var(--text-primary)' },
  'Em revisão':   { bg: 'var(--accent-soft)', text: 'var(--accent-soft-fg)' },
  'Concluída':    { bg: 'var(--success-soft)', text: 'var(--success-fg)' },
  'Cancelada':    { bg: 'var(--danger-soft)', text: 'var(--danger-fg)' },
};

export const TASK_STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  'Disponível':   'bg-accent-soft text-accent-soft-fg border border-accent/20 ',
  'Aguardando':   'bg-warning-soft text-warning-fg border border-warning/20 ',
  'Em andamento': 'bg-surface-2 text-fg border border-line-subtle ',
  'Em revisão':   'bg-accent-soft text-accent-soft-fg border border-accent/20 ',
  'Concluída':    'bg-success-soft text-success-fg border border-success/20 ',
  'Cancelada':    'bg-danger-soft text-danger-fg border border-danger/20 ',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, { pt: string; en: string }> = {
  'Disponível':   { pt: 'Disponível', en: 'Available' },
  'Aguardando':   { pt: 'Aguardando', en: 'Waiting' },
  'Em andamento': { pt: 'Em andamento', en: 'In Progress' },
  'Em revisão':   { pt: 'Em revisão', en: 'In Review' },
  'Concluída':    { pt: 'Concluída', en: 'Completed' },
  'Cancelada':    { pt: 'Cancelada', en: 'Canceled' },
};

export function getTaskStatusLabel(status: TaskStatus, lang: 'pt' | 'en' = 'pt'): string {
  return TASK_STATUS_LABELS[status]?.[lang] || status;
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Baixa',
  normal: 'Normal',
  high:   'Alta',
  urgent: 'Urgente',
};

export const TASK_PRIORITY_LABELS_EN: Record<TaskPriority, string> = {
  low:    'Low',
  normal: 'Normal',
  high:   'High',
  urgent: 'Urgent',
};

export function getTaskPriorityLabel(priority: TaskPriority, lang: 'pt' | 'en' = 'pt'): string {
  return lang === 'en' ? TASK_PRIORITY_LABELS_EN[priority] || priority : TASK_PRIORITY_LABELS[priority] || priority;
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low:    { bg: 'var(--surface-3)', text: 'var(--text-muted)' },
  normal: { bg: 'var(--surface-3)', text: 'var(--text-primary)' },
  high:   { bg: 'var(--warning-soft)', text: 'var(--warning-fg)' },
  urgent: { bg: 'var(--danger-soft)', text: 'var(--danger-fg)' },
};

export const TASK_PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  low:    'bg-surface-2 text-fg-muted border border-line-subtle ',
  normal: 'bg-surface-2 text-fg border border-line-subtle ',
  high:   'bg-warning-soft text-warning-fg border border-warning/20 ',
  urgent: 'bg-danger-soft text-danger-fg border border-danger/20 ',
};

export const BILLING_STATUS_LABELS: Record<BillingRequestStatus, { pt: string; en: string }> = {
  'Solicitada': { pt: 'Solicitada', en: 'Requested' },
  'Em análise': { pt: 'Em análise', en: 'Under Review' },
  'Aprovada':   { pt: 'Aprovada', en: 'Approved' },
  'Rejeitada':  { pt: 'Rejeitada', en: 'Rejected' },
  'Faturada':   { pt: 'Faturada', en: 'Invoiced' },
};

export function getBillingStatusLabel(status: BillingRequestStatus, lang: 'pt' | 'en' = 'pt'): string {
  return BILLING_STATUS_LABELS[status]?.[lang] || status;
}

export const BILLING_STATUS_COLORS: Record<BillingRequestStatus, { bg: string; text: string }> = {
  'Solicitada': { bg: 'var(--warning-soft)', text: 'var(--warning-fg)' },
  'Em análise': { bg: 'var(--info-soft)', text: 'var(--info-fg)' },
  'Aprovada':   { bg: 'var(--success-soft)', text: 'var(--success-fg)' },
  'Rejeitada':  { bg: 'var(--danger-soft)', text: 'var(--danger-fg)' },
  'Faturada':   { bg: 'var(--accent-soft)', text: 'var(--accent-soft-fg)' },
};

export const BILLING_STATUS_BADGE_CLASSES: Record<BillingRequestStatus, string> = {
  'Solicitada': 'bg-warning-soft text-warning-fg border border-warning/20 ',
  'Em análise': 'bg-accent-soft text-accent-soft-fg border border-accent/20 ',
  'Aprovada':   'bg-success-soft text-success-fg border border-success/20 ',
  'Rejeitada':  'bg-danger-soft text-danger-fg border border-danger/20 ',
  'Faturada':   'bg-accent-soft text-accent-soft-fg border border-accent/20 ',
};
