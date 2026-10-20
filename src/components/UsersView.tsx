import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_BADGE_CLASSES,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BADGE_CLASSES,
  getRoleLabel,
  getStatusLabel,
} from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface UsersViewProps {
  users: UserProfile[];
  onOpenNewUserModal: () => void;
  onEditUser: (user: UserProfile) => void;
  onOpenPermissionsModal: (user: UserProfile) => void;
  onToggleUserStatus: (userId: string, currentStatus: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function UsersView({
  users,
  onOpenNewUserModal,
  onEditUser,
  onOpenPermissionsModal,
  onToggleUserStatus,
  onDeleteUser,
}: UsersViewProps) {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const canCreate = isOwner || hasPermission('users.create');
  const canEdit = isOwner || hasPermission('users.edit');
  const canManagePerms = isOwner || hasPermission('users.permissions');
  const canSuspend = isOwner || hasPermission('users.suspend');
  const canDelete = isOwner || hasPermission('users.delete');

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">{t('users.title', 'Gestão de Utilizadores')}</h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {t('users.subtitle', 'Acessos, cargos e permissões da equipa')}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewUserModal}
            className="aura-btn aura-btn--primary inline-flex shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('users.newUser', 'Novo Utilizador')}</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {t('users.totalMembers', 'Total Membros')}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-fg ">{totalUsers}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {t('users.admins', 'Administradores')}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-accent-soft-fg ">{adminCount}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {t('users.employees', 'Funcionários')}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-fg-secondary ">{employeeCount}</div>
        </div>

        <div className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass">
          <span className="text-[13px] font-medium text-fg-secondary block mb-1">
            {t('users.activeAccounts', 'Contas Ativas')}
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-success-fg ">{activeCount}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-glass border border-line-subtle rounded-xl p-3 shadow-glass">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('users.searchPlaceholder', 'Pesquisar por nome ou email...')}
            className="w-full bg-surface-2 border border-line-subtle rounded-full pl-10 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'owner', 'admin', 'employee'] as const).map(role => {
            const label = role === 'ALL' ? t('users.filterAll', 'Todos') : getRoleLabel(role, lang);
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
 isActive
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-glass border border-line-subtle rounded-xl shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-line-subtle text-[13px] font-medium text-fg-secondary ">
                <th className="py-3.5 px-5">{t('common.name', 'Utilizador')}</th>
                <th className="py-3.5 px-4">{t('common.role', 'Cargo')}</th>
                <th className="py-3.5 px-4">{t('common.language', 'Idioma')}</th>
                <th className="py-3.5 px-4">{t('common.status', 'Estado')}</th>
                <th className="py-3.5 px-4">{t('users.lastLogin', 'Último Acesso')}</th>
                <th className="py-3.5 px-5 text-right">{t('common.actions', 'Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fg-muted ">
                    <Users className="w-10 h-10 mx-auto mb-3 text-fg-disabled " strokeWidth={1.5} />
                    <p className="font-medium text-fg ">
                      {lang === 'en' ? 'No users found' : 'Nenhum utilizador encontrado'}
                    </p>
                    <p className="text-xs text-fg-muted mt-1">
                      {lang === 'en' ? 'Adjust your search filters' : 'Ajuste os filtros de pesquisa'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isSelf = user.id === userProfile?.id;
                  const isTargetOwner = user.role === 'owner';

                  return (
                    <tr key={user.id} className="hover:bg-surface-2/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-surface-2 text-fg font-medium flex items-center justify-center shrink-0 border border-line-subtle ">
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-fg flex items-center gap-1.5">
                              {user?.name || (lang === 'en' ? 'User' : 'Utilizador')}
                              {isSelf && (
                                <span className="text-[10px] bg-surface-3 text-fg-secondary px-1.5 py-0.5 rounded-full font-normal">
                                  {lang === 'en' ? 'You' : 'Tu'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-fg-muted ">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE_CLASSES[user.role] || 'bg-surface-2 text-gray-800 '}`}
                        >
                          {getRoleLabel(user.role, lang)}
                        </span>
                      </td>

                      {/* Language Badge */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-surface-2 border border-line-subtle text-fg-secondary ">
                          {user.language === 'en' ? 'EN' : 'PT'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASSES[user.status] || 'bg-surface-2 text-gray-800 '}`}
                        >
                          {getStatusLabel(user.status, lang)}
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="py-4 px-4 text-xs text-fg-muted ">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : t('users.neverLoggedIn', 'Nunca acedeu')}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Permissions modal (not for owner, target must not be owner) */}
                          {canManagePerms && !isTargetOwner && (
                            <button
                              onClick={() => onOpenPermissionsModal(user)}
                              className="p-1.5 rounded-full text-accent-soft-fg hover:bg-accent-soft cursor-pointer transition-colors"
                              title={t('users.permissions', 'Gerir Permissões')}
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit user */}
                          {canEdit && (!isTargetOwner || isOwner) && (
                            <button
                              onClick={() => onEditUser(user)}
                              className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg cursor-pointer transition-colors"
                              title={t('users.editUser', 'Editar Utilizador')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Suspend / Activate (cannot suspend owner or self) */}
                          {canSuspend && !isTargetOwner && !isSelf && (
                            <button
                              onClick={() => onToggleUserStatus(user.id, user.status)}
                              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
 user.status === 'active'
 ? 'text-danger-fg hover:bg-danger-soft '
 : 'text-success-fg hover:bg-success-soft '
 }`}
                              title={user.status === 'active' ? t('users.suspend', 'Suspender') : t('users.activate', 'Ativar')}
                            >
                              {user.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete (owner only, cannot delete self or owner) */}
                          {canDelete && isOwner && !isTargetOwner && !isSelf && onDeleteUser && (
                            <button
                              onClick={() => onDeleteUser(user.id)}
                              className="p-1.5 rounded-full text-danger-fg hover:bg-danger-soft cursor-pointer transition-colors"
                              title={t('users.delete', 'Eliminar Utilizador')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {isTargetOwner && !isOwner && (
                            <span className="p-1.5 text-fg-disabled " title={lang === 'en' ? "Protected" : "Protegido"}>
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
