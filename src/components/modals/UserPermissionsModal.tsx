import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { UserProfile, PermissionScope, ROLE_LABELS } from '../../types/rbac';
import {
  PERMISSIONS_BY_RESOURCE,
  RESOURCE_LABELS,
  ADMIN_DEFAULT_PERMISSIONS,
  EMPLOYEE_DEFAULT_PERMISSIONS,
} from '../../lib/permissions';

interface PermissionEntry {
  permissionId: string;
  scope: PermissionScope;
  granted: boolean;
}

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  currentPermissions: PermissionEntry[];
  onSave: (userId: string, permissions: PermissionEntry[]) => Promise<void>;
}

export function UserPermissionsModal({
  isOpen,
  onClose,
  user,
  currentPermissions,
  onSave,
}: UserPermissionsModalProps) {
  const [perms, setPerms] = useState<Map<string, PermissionEntry>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const defaults = user.role === 'admin' ? ADMIN_DEFAULT_PERMISSIONS : EMPLOYEE_DEFAULT_PERMISSIONS;
    const map = new Map<string, PermissionEntry>();
    for (const d of defaults) {
      map.set(d.id, { permissionId: d.id, scope: d.scope, granted: true });
    }
    for (const c of currentPermissions) {
      map.set(c.permissionId, c);
    }
    setPerms(map);
  }, [isOpen, user, currentPermissions]);

  if (!isOpen || !user) return null;

  const togglePermission = (permId: string) => {
    setPerms((prev: Map<string, PermissionEntry>) => {
      const next = new Map<string, PermissionEntry>(prev);
      const existing = next.get(permId);
      if (existing) {
        next.set(permId, { ...existing, granted: !existing.granted });
      } else {
        next.set(permId, { permissionId: permId, scope: 'ALL', granted: true });
      }
      return next;
    });
  };

  const setScope = (permId: string, scope: PermissionScope) => {
    setPerms((prev: Map<string, PermissionEntry>) => {
      const next = new Map<string, PermissionEntry>(prev);
      const existing = next.get(permId) || { permissionId: permId, scope: 'ALL', granted: true };
      next.set(permId, { ...existing, scope });
      return next;
    });
  };

  const resetToDefaults = () => {
    const defaults = user.role === 'admin' ? ADMIN_DEFAULT_PERMISSIONS : EMPLOYEE_DEFAULT_PERMISSIONS;
    const map = new Map<string, PermissionEntry>();
    for (const d of defaults) {
      map.set(d.id, { permissionId: d.id, scope: d.scope, granted: true });
    }
    setPerms(map);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const permsList: PermissionEntry[] = Array.from(perms.values());
      await onSave(user.id, permsList);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const scopeOptions: PermissionScope[] = ['ALL', 'ASSIGNED', 'OWN'];
  const scopeLabels: Record<PermissionScope, string> = {
    ALL: 'Todos',
    ASSIGNED: 'Atribuídos',
    OWN: 'Próprios',
    TEAM: 'Equipa',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] border border-[#c4c7c7]/30 shadow-[0_8px_40px_rgba(0,0,0,0.06)] w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 rounded-t-[24px] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#0050d7] text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">Permissões — {user.name}</h3>
              <p className="text-xs text-[#747878]">{ROLE_LABELS[user.role]} • Personalize o acesso deste utilizador</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={resetToDefaults}
              className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
              title="Repor padrões do cargo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Permissions list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {Object.entries(PERMISSIONS_BY_RESOURCE).map(([resource, resourcePerms]) => (
            <div key={resource}>
              <h4 className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest mb-2">
                {RESOURCE_LABELS[resource] || resource}
              </h4>
              <div className="space-y-1.5">
                {resourcePerms.map((p) => {
                  const entry = perms.get(p.id);
                  const granted = entry?.granted ?? false;
                  const scope = entry?.scope || 'ALL';
                  const availableScopes = p.scopeOptions || (['ALL'] as const);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-[14px] border transition-all ${
                        granted ? 'border-[#c4c7c7]/40 bg-[#f7f3f2]' : 'border-[#c4c7c7]/20 bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <button
                            type="button"
                            onClick={() => togglePermission(p.id)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              granted ? 'bg-[#000000] border-[#000000]' : 'bg-white border-[#c4c7c7]'
                            }`}
                          >
                            {granted && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                          <span className="text-sm text-[#1c1b1b] font-medium">{p.label}</span>
                        </div>

                        {granted && availableScopes.length > 1 && (
                          <select
                            value={scope}
                            onChange={(e) => setScope(p.id, e.target.value as PermissionScope)}
                            className="text-[11px] bg-[#f1edec] border border-[#c4c7c7]/35 rounded-lg px-2 py-1 text-[#1c1b1b] focus:outline-none focus:border-[#000000] cursor-pointer"
                          >
                            {scopeOptions
                              .filter((s) => availableScopes.includes(s))
                              .map((s) => (
                                <option key={s} value={s}>
                                  {scopeLabels[s]}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#c4c7c7]/40 flex space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-5 py-2 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-medium text-sm rounded-[29px] flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{loading ? 'A guardar...' : 'Aplicar Permissões'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
