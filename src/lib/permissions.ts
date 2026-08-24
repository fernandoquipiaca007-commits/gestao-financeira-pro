// ============================================================
// Permissions Layer — Constantes, Defaults e Helpers
// ============================================================

import { UserRole, PermissionScope, PermissionMap } from '../types/rbac';

// ------------------------------------------------------------------
// Catálogo Completo de Permissões
// ------------------------------------------------------------------
export interface PermissionDefinition {
  id: string;
  resource: string;
  action: string;
  label: string;
  scopeOptions?: readonly PermissionScope[];
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  { id: 'dashboard.view',       resource: 'dashboard',   action: 'view',        label: 'Ver dashboard', scopeOptions: ['ALL', 'OWN'] },
  { id: 'dashboard.financial',  resource: 'dashboard',   action: 'financial',   label: 'Ver dados financeiros', scopeOptions: ['ALL'] },
  // Utilizadores
  { id: 'users.view',           resource: 'users',       action: 'view',        label: 'Ver utilizadores', scopeOptions: ['ALL'] },
  { id: 'users.create',         resource: 'users',       action: 'create',      label: 'Criar utilizadores', scopeOptions: ['ALL'] },
  { id: 'users.edit',           resource: 'users',       action: 'edit',        label: 'Editar utilizadores', scopeOptions: ['ALL'] },
  { id: 'users.delete',         resource: 'users',       action: 'delete',      label: 'Eliminar utilizadores', scopeOptions: ['ALL'] },
  { id: 'users.permissions',    resource: 'users',       action: 'permissions', label: 'Gerir permissões', scopeOptions: ['ALL'] },
  { id: 'users.suspend',        resource: 'users',       action: 'suspend',     label: 'Suspender utilizadores', scopeOptions: ['ALL'] },
  // Clientes
  { id: 'clients.view',         resource: 'clients',     action: 'view',        label: 'Ver clientes', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'clients.create',       resource: 'clients',     action: 'create',      label: 'Criar clientes', scopeOptions: ['ALL'] },
  { id: 'clients.edit',         resource: 'clients',     action: 'edit',        label: 'Editar clientes', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'clients.delete',       resource: 'clients',     action: 'delete',      label: 'Eliminar clientes', scopeOptions: ['ALL'] },
  // Projetos
  { id: 'projects.view',        resource: 'projects',    action: 'view',        label: 'Ver projetos', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'projects.create',      resource: 'projects',    action: 'create',      label: 'Criar projetos', scopeOptions: ['ALL'] },
  { id: 'projects.edit',        resource: 'projects',    action: 'edit',        label: 'Editar projetos', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'projects.delete',      resource: 'projects',    action: 'delete',      label: 'Eliminar projetos', scopeOptions: ['ALL'] },
  { id: 'projects.assign',      resource: 'projects',    action: 'assign',      label: 'Atribuir projetos', scopeOptions: ['ALL'] },
  { id: 'projects.assume',      resource: 'projects',    action: 'assume',      label: 'Assumir projetos disponíveis', scopeOptions: ['ALL'] },
  // Tarefas
  { id: 'tasks.view',           resource: 'tasks',       action: 'view',        label: 'Ver tarefas', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'tasks.create',         resource: 'tasks',       action: 'create',      label: 'Criar tarefas', scopeOptions: ['ALL'] },
  { id: 'tasks.edit',           resource: 'tasks',       action: 'edit',        label: 'Editar tarefas', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'tasks.delete',         resource: 'tasks',       action: 'delete',      label: 'Eliminar tarefas', scopeOptions: ['ALL'] },
  { id: 'tasks.assign',         resource: 'tasks',       action: 'assign',      label: 'Atribuir tarefas', scopeOptions: ['ALL'] },
  { id: 'tasks.complete',       resource: 'tasks',       action: 'complete',    label: 'Concluir tarefas', scopeOptions: ['ALL', 'ASSIGNED'] },
  // Solicitações de Faturamento (Fase 2)
  { id: 'billing.view',         resource: 'billing',     action: 'view',        label: 'Ver solicitações de faturamento', scopeOptions: ['ALL', 'OWN'] },
  { id: 'billing.request',      resource: 'billing',     action: 'request',     label: 'Criar solicitações de faturamento', scopeOptions: ['ALL'] },
  { id: 'billing.approve',      resource: 'billing',     action: 'approve',     label: 'Aprovar / Rejeitar faturamento', scopeOptions: ['ALL'] },
  // Financeiro
  { id: 'financial.view',       resource: 'financial',   action: 'view',        label: 'Ver receitas e despesas', scopeOptions: ['ALL'] },
  { id: 'financial.create',     resource: 'financial',   action: 'create',      label: 'Criar lançamentos', scopeOptions: ['ALL'] },
  { id: 'financial.edit',       resource: 'financial',   action: 'edit',        label: 'Editar lançamentos', scopeOptions: ['ALL'] },
  { id: 'financial.delete',     resource: 'financial',   action: 'delete',      label: 'Eliminar lançamentos', scopeOptions: ['ALL'] },
  // Parceiros
  { id: 'partners.view',        resource: 'partners',    action: 'view',        label: 'Ver parceiros', scopeOptions: ['ALL'] },
  { id: 'partners.create',      resource: 'partners',    action: 'create',      label: 'Criar parceiros', scopeOptions: ['ALL'] },
  { id: 'partners.edit',        resource: 'partners',    action: 'edit',        label: 'Editar parceiros', scopeOptions: ['ALL'] },
  { id: 'partners.delete',      resource: 'partners',    action: 'delete',      label: 'Eliminar parceiros', scopeOptions: ['ALL'] },
  // Agenda
  { id: 'calendar.view',        resource: 'calendar',    action: 'view',        label: 'Ver agenda', scopeOptions: ['ALL', 'ASSIGNED', 'OWN'] },
  { id: 'calendar.create',      resource: 'calendar',    action: 'create',      label: 'Criar eventos', scopeOptions: ['ALL'] },
  { id: 'calendar.edit',        resource: 'calendar',    action: 'edit',        label: 'Editar eventos', scopeOptions: ['ALL', 'OWN'] },
  // Categorias
  { id: 'categories.view',      resource: 'categories',  action: 'view',        label: 'Ver categorias', scopeOptions: ['ALL'] },
  { id: 'categories.create',    resource: 'categories',  action: 'create',      label: 'Criar categorias', scopeOptions: ['ALL'] },
  { id: 'categories.edit',      resource: 'categories',  action: 'edit',        label: 'Editar categorias', scopeOptions: ['ALL'] },
  // Relatórios / Configurações / Auditoria
  { id: 'reports.view',         resource: 'reports',     action: 'view',        label: 'Ver relatórios', scopeOptions: ['ALL'] },
  { id: 'settings.view',        resource: 'settings',    action: 'view',        label: 'Ver configurações', scopeOptions: ['ALL', 'OWN'] },
  { id: 'settings.edit',        resource: 'settings',    action: 'edit',        label: 'Editar configurações', scopeOptions: ['ALL'] },
  { id: 'audit.view',           resource: 'audit',       action: 'view',        label: 'Ver logs de auditoria', scopeOptions: ['ALL'] },
];

export type PermissionId = string;

// Agrupar permissões por recurso para a UI de gestão
export const PERMISSIONS_BY_RESOURCE: Record<string, PermissionDefinition[]> = {};
for (const p of ALL_PERMISSIONS) {
  if (!PERMISSIONS_BY_RESOURCE[p.resource]) PERMISSIONS_BY_RESOURCE[p.resource] = [];
  PERMISSIONS_BY_RESOURCE[p.resource].push(p);
}

export const RESOURCE_LABELS: Record<string, string> = {
  dashboard:  'Dashboard',
  users:      'Utilizadores',
  clients:    'Clientes',
  projects:   'Projetos',
  tasks:      'Tarefas',
  billing:    'Solicitações de Faturamento',
  financial:  'Financeiro',
  partners:   'Parceiros',
  calendar:   'Agenda',
  categories: 'Categorias',
  reports:    'Relatórios',
  settings:   'Configurações',
  audit:      'Auditoria',
};

// ------------------------------------------------------------------
// Permissões padrão por cargo (frontend mirror do DB)
// ------------------------------------------------------------------
export const ADMIN_DEFAULT_PERMISSIONS: Array<{ id: string; scope: PermissionScope }> = [
  { id: 'dashboard.view',       scope: 'ALL' },
  { id: 'dashboard.financial',  scope: 'ALL' },
  { id: 'users.view',           scope: 'ALL' },
  { id: 'clients.view',         scope: 'ALL' },
  { id: 'clients.create',       scope: 'ALL' },
  { id: 'clients.edit',         scope: 'ALL' },
  { id: 'clients.delete',       scope: 'ALL' },
  { id: 'projects.view',        scope: 'ALL' },
  { id: 'projects.create',      scope: 'ALL' },
  { id: 'projects.edit',        scope: 'ALL' },
  { id: 'projects.delete',      scope: 'ALL' },
  { id: 'projects.assign',      scope: 'ALL' },
  { id: 'tasks.view',           scope: 'ALL' },
  { id: 'tasks.create',         scope: 'ALL' },
  { id: 'tasks.edit',           scope: 'ALL' },
  { id: 'tasks.delete',         scope: 'ALL' },
  { id: 'tasks.assign',         scope: 'ALL' },
  { id: 'tasks.complete',       scope: 'ALL' },
  { id: 'billing.view',         scope: 'ALL' },
  { id: 'billing.request',      scope: 'ALL' },
  { id: 'billing.approve',      scope: 'ALL' },
  { id: 'financial.view',       scope: 'ALL' },
  { id: 'financial.create',     scope: 'ALL' },
  { id: 'financial.edit',       scope: 'ALL' },
  { id: 'financial.delete',     scope: 'ALL' },
  { id: 'partners.view',        scope: 'ALL' },
  { id: 'partners.create',      scope: 'ALL' },
  { id: 'partners.edit',        scope: 'ALL' },
  { id: 'partners.delete',      scope: 'ALL' },
  { id: 'calendar.view',        scope: 'ALL' },
  { id: 'calendar.create',      scope: 'ALL' },
  { id: 'calendar.edit',        scope: 'ALL' },
  { id: 'categories.view',      scope: 'ALL' },
  { id: 'categories.create',    scope: 'ALL' },
  { id: 'categories.edit',      scope: 'ALL' },
  { id: 'reports.view',         scope: 'ALL' },
  { id: 'settings.view',        scope: 'ALL' },
];

export const EMPLOYEE_DEFAULT_PERMISSIONS: Array<{ id: string; scope: PermissionScope }> = [
  { id: 'dashboard.view',   scope: 'OWN' },
  { id: 'clients.view',     scope: 'ASSIGNED' },
  { id: 'clients.create',   scope: 'ALL' },
  { id: 'clients.edit',     scope: 'OWN' },
  { id: 'projects.view',    scope: 'ASSIGNED' },
  { id: 'projects.edit',    scope: 'ASSIGNED' },
  { id: 'projects.assume',  scope: 'ALL' },
  { id: 'tasks.view',       scope: 'ASSIGNED' },
  { id: 'tasks.edit',       scope: 'ASSIGNED' },
  { id: 'tasks.complete',   scope: 'ASSIGNED' },
  { id: 'billing.view',     scope: 'OWN' },
  { id: 'billing.request',  scope: 'ALL' },
  { id: 'calendar.view',    scope: 'ASSIGNED' },
  { id: 'calendar.create',  scope: 'ALL' },
  { id: 'calendar.edit',    scope: 'OWN' },
  { id: 'categories.view',  scope: 'ALL' },
  { id: 'settings.view',    scope: 'OWN' },
];

// ------------------------------------------------------------------
// Helpers de verificação de permissão
// ------------------------------------------------------------------

/**
 * Verifica se o utilizador tem uma permissão específica.
 * OWNER tem sempre tudo. Outros verificam o mapa de permissões efectivas.
 */
export function hasPermission(
  role: UserRole,
  permMap: PermissionMap,
  permissionId: string,
  requiredScope?: PermissionScope
): boolean {
  if (role === 'owner') return true;

  const entry = permMap.get(permissionId);
  if (!entry || !entry.granted) return false;
  if (!requiredScope) return true;

  // Hierarquia de scope: ALL ≥ TEAM ≥ ASSIGNED ≥ OWN
  const scopeHierarchy: PermissionScope[] = ['ALL', 'TEAM', 'ASSIGNED', 'OWN'];
  const userScopeIdx = scopeHierarchy.indexOf(entry.scope);
  const reqScopeIdx = scopeHierarchy.indexOf(requiredScope);

  return userScopeIdx <= reqScopeIdx; // índice menor = mais amplo
}

/**
 * Constrói o PermissionMap a partir dos defaults do cargo + overrides do utilizador.
 */
export function buildPermissionMap(
  role: UserRole,
  overrides: Array<{ permissionId: string; scope: PermissionScope; granted: boolean }>
): PermissionMap {
  const map: PermissionMap = new Map();

  // Carregar defaults do cargo
  const defaults = role === 'admin' ? ADMIN_DEFAULT_PERMISSIONS :
                   role === 'employee' ? EMPLOYEE_DEFAULT_PERMISSIONS : [];

  for (const d of defaults) {
    map.set(d.id, { scope: d.scope, granted: true });
  }

  // Aplicar overrides customizados (podem conceder ou revogar)
  for (const o of overrides) {
    map.set(o.permissionId, { scope: o.scope, granted: o.granted });
  }

  return map;
}

/**
 * Determina quais tabs devem estar visíveis para o utilizador.
 */
export function getVisibleTabs(role: UserRole, permMap: PermissionMap): string[] {
  if (role === 'owner') {
    return ['dashboard', 'calendar', 'projects', 'tasks', 'billing', 'clients', 'financial', 'partners', 'categories', 'reports', 'users', 'audit', 'landing', 'settings'];
  }

  const tabs: string[] = [];

  if (hasPermission(role, permMap, 'dashboard.view')) tabs.push('dashboard');
  if (hasPermission(role, permMap, 'calendar.view'))  tabs.push('calendar');
  if (hasPermission(role, permMap, 'projects.view'))  tabs.push('projects');
  if (hasPermission(role, permMap, 'tasks.view'))     tabs.push('tasks');
  if (hasPermission(role, permMap, 'billing.view'))   tabs.push('billing');
  if (hasPermission(role, permMap, 'clients.view'))   tabs.push('clients');
  if (hasPermission(role, permMap, 'financial.view')) tabs.push('financial');
  if (hasPermission(role, permMap, 'partners.view'))  tabs.push('partners');
  if (hasPermission(role, permMap, 'categories.view'))tabs.push('categories');
  if (hasPermission(role, permMap, 'reports.view'))   tabs.push('reports');
  if (hasPermission(role, permMap, 'users.view'))     tabs.push('users');
  tabs.push('landing'); // sempre visível para a equipa aceder ao site público
  tabs.push('settings'); // sempre visível (perfil pessoal)

  return tabs;
}
