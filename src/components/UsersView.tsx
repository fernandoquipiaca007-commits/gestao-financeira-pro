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
  STATUS_LABELS,
  STATUS_COLORS,
} from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const canCreate = isOwner || hasPermission('users.create');
  const canEdit = isOwner || hasPermission('users.edit');
  const canManagePerms = isOwner || hasPermission('users.permissions');
  const canSuspend = isOwner || hasPermission('users.suspend');
  const canDelete = isOwner || hasPermission('users.delete');

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
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
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">Gestão de Utilizadores</h1>
          <p className="text-sm text-[#747878] mt-1">
            Controle de acessos, cargos e permissões da equipa
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewUserModal}
            className="inline-flex items-center space-x-2 bg-[#000000] hover:opacity-85 text-white px-5 py-2.5 rounded-[29px] text-sm font-medium transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Utilizador</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Total Membros
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#000000]">{totalUsers}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Administradores
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#003da9]">{adminCount}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Funcionários
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#444747]">{employeeCount}</div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1">
            Contas Ativas
          </span>
          <div className="text-2xl font-medium tracking-[-0.04em] text-[#1a6b3a]">{activeCount}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#c4c7c7]/40 rounded-[22px] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-10 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'owner', 'admin', 'employee'] as const).map(role => {
            const label = role === 'ALL' ? 'Todos' : ROLE_LABELS[role];
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#000000] text-white'
                    : 'text-[#444747] hover:bg-[#f1edec]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f3f2] border-b border-[#c4c7c7]/30 text-[11px] font-semibold tracking-widest uppercase text-[#747878]">
                <th className="py-3.5 px-5">Utilizador</th>
                <th className="py-3.5 px-4">Cargo</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Último Acesso</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c7c7]/20 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#747878]">
                    <Users className="w-10 h-10 mx-auto mb-3 text-[#c4c7c7]" strokeWidth={1.5} />
                    <p className="font-medium text-[#1c1b1b]">Nenhum utilizador encontrado</p>
                    <p className="text-xs text-[#747878] mt-1">Ajuste os filtros de pesquisa</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleStyle = ROLE_COLORS[user.role];
                  const statusStyle = STATUS_COLORS[user.status];
                  const isSelf = user.id === userProfile?.id;
                  const isTargetOwner = user.role === 'owner';

                  return (
                    <tr key={user.id} className="hover:bg-[#f7f3f2]/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#1c1b1b] font-medium flex items-center justify-center shrink-0 border border-[#c4c7c7]/30">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[#1c1b1b] flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="text-[10px] bg-[#e5e2e1] text-[#444747] px-1.5 py-0.5 rounded-full font-normal">
                                  Tu
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#747878]">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {STATUS_LABELS[user.status]}
                        </span>
                      </td>

                      {/* Last login */}
                      <td className="py-4 px-4 text-xs text-[#747878]">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca acedeu'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Permissions modal (not for owner, target must not be owner) */}
                          {canManagePerms && !isTargetOwner && (
                            <button
                              onClick={() => onOpenPermissionsModal(user)}
                              className="p-1.5 rounded-full text-[#0050d7] hover:bg-[#dbe1ff] cursor-pointer transition-colors"
                              title="Gerir Permissões"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit user */}
                          {canEdit && (!isTargetOwner || isOwner) && (
                            <button
                              onClick={() => onEditUser(user)}
                              className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
                              title="Editar Utilizador"
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
                                  ? 'text-[#ba1a1a] hover:bg-[#ffdad6]'
                                  : 'text-[#1a6b3a] hover:bg-[#d4eddf]'
                              }`}
                              title={user.status === 'active' ? 'Suspender Conta' : 'Ativar Conta'}
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
                              className="p-1.5 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6] cursor-pointer transition-colors"
                              title="Eliminar Utilizador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {isTargetOwner && !isOwner && (
                            <span className="p-1.5 text-[#c4c7c7]" title="Protegido">
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
