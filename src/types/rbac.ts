// ============================================================
// RBAC Types — Hierarquia de Acessos, Cargos e Permissões
// ============================================================

export type UserRole = 'owner' | 'admin' | 'employee';
export type PermissionScope = 'ALL' | 'ASSIGNED' | 'OWN' | 'TEAM';
export type UserStatus = 'active' | 'suspended' | 'invited';
export type TaskStatus = 'Disponível' | 'Aguardando' | 'Em andamento' | 'Em revisão' | 'Concluída' | 'Cancelada';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProjectAssignmentType = 'company' | 'employee' | 'available';
export type AuditResult = 'success' | 'error' | 'denied';

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
// Log de Auditoria
// ------------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  companyId: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  action: string;          // ex: 'permission.grant', 'project.assume', 'user.suspend'
  resourceType?: string;   // ex: 'project', 'user', 'task'
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

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  owner:    { bg: '#000000', text: '#ffffff', border: '#000000' },
  admin:    { bg: '#dbe1ff', text: '#003da9', border: '#003da9' },
  employee: { bg: '#f1edec', text: '#444747', border: '#c4c7c7' },
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active:    'Ativo',
  suspended: 'Suspenso',
  invited:   'Convidado',
};

export const STATUS_COLORS: Record<UserStatus, { bg: string; text: string }> = {
  active:    { bg: '#d4eddf', text: '#1a6b3a' },
  suspended: { bg: '#ffdad6', text: '#ba1a1a' },
  invited:   { bg: '#fff3d6', text: '#7a5400' },
};

export const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  'Disponível':   { bg: '#dbe1ff', text: '#003da9' },
  'Aguardando':   { bg: '#fff3d6', text: '#7a5400' },
  'Em andamento': { bg: '#f1edec', text: '#1c1b1b' },
  'Em revisão':   { bg: '#e8d5f5', text: '#6b21a8' },
  'Concluída':    { bg: '#d4eddf', text: '#1a6b3a' },
  'Cancelada':    { bg: '#ffdad6', text: '#ba1a1a' },
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Baixa',
  normal: 'Normal',
  high:   'Alta',
  urgent: 'Urgente',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low:    { bg: '#f1edec', text: '#747878' },
  normal: { bg: '#f1edec', text: '#1c1b1b' },
  high:   { bg: '#fff3d6', text: '#7a5400' },
  urgent: { bg: '#ffdad6', text: '#ba1a1a' },
};
