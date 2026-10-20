import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, Shield, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { UserProfile, PermissionScope, getRoleLabel } from '../../types/rbac';
import {
  PERMISSIONS_BY_RESOURCE,
  getResourceLabel,
  getPermissionLabel,
  ADMIN_DEFAULT_PERMISSIONS,
  EMPLOYEE_DEFAULT_PERMISSIONS,
} from '../../lib/permissions';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t, lang } = useLanguage();
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
    ALL: lang === 'en' ? 'All' : 'Todos',
    ASSIGNED: lang === 'en' ? 'Assigned' : 'Atribuídos',
    OWN: lang === 'en' ? 'Own' : 'Próprios',
    TEAM: lang === 'en' ? 'Team' : 'Equipa',
  };

  return (
    <EditorPage
      title={<>{lang === 'en' ? `Permissions — ${user.name}` : `Permissões — ${user.name}`}</>}
      trail={[lang === 'en' ? 'Users' : 'Utilizadores']}
      subtitle={<>{getRoleLabel(user.role, lang)} • {lang === 'en' ? "Customize this user's permissions" : "Personalize o acesso deste utilizador"}</>}
      icon={<Shield className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
          <button type="button" onClick={resetToDefaults} className="aura-btn aura-btn--ghost"><RotateCcw className="w-4 h-4" /><span>{lang === 'en' ? 'Reset to role defaults' : 'Repor padrões do cargo'}</span></button>
          <button
            onClick={onClose}
            className="aura-btn aura-btn--ghost"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="aura-btn aura-btn--primary"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{loading ? t('common.saving', 'A guardar...') : (lang === 'en' ? 'Apply Permissions' : 'Aplicar Permissões')}</span>
          </button>
        </>}
    >
      <div className="space-y-6 text-fg">

        {/* Permissions list */}
        <div className="space-y-5">
          {Object.entries(PERMISSIONS_BY_RESOURCE).map(([resource, resourcePerms]) => (
            <div key={resource}>
              <h4 className="text-[13px] font-medium text-fg-secondary mb-2">
                {getResourceLabel(resource, lang)}
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
                      className={`p-3 rounded-md border transition-all ${
 granted
 ? 'border-line-subtle bg-surface-2 '
 : 'border-line-subtle bg-glass-strong opacity-60'
 }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <button
                            type="button"
                            onClick={() => togglePermission(p.id)}
                            className={`w-5 h-5 rounded-xs border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
 granted
 ? 'bg-primary shadow-primary-3d border-fg '
 : 'bg-glass-strong border-line '
 }`}
                          >
                            {granted && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                          <span className="text-sm text-fg font-medium">
                            {getPermissionLabel(p, lang)}
                          </span>
                        </div>

                        {granted && availableScopes.length > 1 && (
                          <select
                            value={scope}
                            onChange={(e) => setScope(p.id, e.target.value as PermissionScope)}
                            className="text-[11px] bg-surface-2 border border-line-subtle rounded-sm px-2 py-1 text-fg focus:outline-none focus:border-accent cursor-pointer"
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

        
      </div>
    </EditorPage>
  );
}
