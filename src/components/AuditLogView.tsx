import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RotateCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
} from 'lucide-react';
import { AuditLogEntry, ROLE_LABELS, ROLE_COLORS, getRoleLabel } from '../types/rbac';
import { fetchAuditLogs, formatAuditEntry } from '../lib/audit';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function AuditLogView() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { userProfile, isOwner } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const loadLogs = async () => {
    if (!userProfile?.companyId) return;
    setLoading(true);
    try {
      const data = await fetchAuditLogs(userProfile.companyId, 150);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userProfile?.companyId]);

  if (!isOwner) {
    return (
      <div className="bg-glass border border-line-subtle rounded-xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-danger-fg" />
        <h3 className="font-semibold text-fg text-base">
          {isEn ? 'Restricted Access' : 'Acesso Restrito'}
        </h3>
        <p className="text-xs text-fg-muted mt-1">
          {isEn
            ? 'Only the company owner has permission to view the audit log.'
            : 'Apenas o titular da empresa (Owner) tem permissão para visualizar o log de auditoria.'}
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(l => {
    const text = `${l.userName || ''} ${l.action} ${l.resourceType || ''} ${l.resourceId || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action.startsWith(actionFilter);
    return matchesSearch && matchesAction;
  });

  const getResultBadge = (result: string) => {
    if (result === 'success') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-fg bg-success-soft px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> {isEn ? 'Success' : 'Sucesso'}
        </span>
      );
    }
    if (result === 'denied') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning-fg bg-warning-soft px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> {isEn ? 'Denied' : 'Negado'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger-fg bg-danger-soft px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> {isEn ? 'Error' : 'Erro'}
      </span>
    );
  };

  const actionCategories = [
    { key: 'ALL', label: isEn ? 'All' : 'Todas' },
    { key: 'user', label: isEn ? 'Users' : 'Utilizadores' },
    { key: 'permission', label: isEn ? 'Permissions' : 'Permissões' },
    { key: 'project', label: isEn ? 'Projects' : 'Projetos' },
    { key: 'task', label: isEn ? 'Tasks' : 'Tarefas' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
            {isEn ? 'Audit Log' : 'Registo de Auditoria'}
          </h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {isEn
              ? 'History of administrative actions, permission changes, and security events'
              : 'Histórico de ações administrativas, alterações de permissões e eventos de segurança'}
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="aura-btn aura-btn--secondary aura-btn--sm inline-flex shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isEn ? 'Refresh' : 'Atualizar'}</span>
        </button>
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
            placeholder={isEn ? 'Search by author, action or resource...' : 'Pesquisar por autor, ação ou recurso...'}
            className="w-full bg-surface-2 border border-line-subtle rounded-full pl-10 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>

        {/* Action Category Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {actionCategories.map(f => {
            const isActive = actionFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActionFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
 isActive
 ? 'bg-primary shadow-primary-3d text-primary-fg '
 : 'text-fg-secondary hover:bg-sunken '
 }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table / Feed */}
      <div className="bg-glass border border-line-subtle rounded-xl shadow-glass overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-fg-muted ">
            <History className="w-10 h-10 mx-auto mb-3 text-fg-disabled " strokeWidth={1.5} />
            <p className="font-medium text-fg ">
              {isEn ? 'No audit records found' : 'Nenhum registo de auditoria encontrado'}
            </p>
            <p className="text-xs text-fg-muted mt-1">
              {isEn ? 'User actions will be automatically recorded here' : 'As ações dos utilizadores serão registadas aqui automaticamente'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line-subtle ">
            {filteredLogs.map(log => {
              const roleStyle = log.userRole ? ROLE_COLORS[log.userRole] : undefined;
              return (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 hover:bg-surface-2/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-surface-2 text-fg flex items-center justify-center shrink-0 border border-line-subtle mt-0.5">
                      <User className="w-4 h-4 text-fg-muted " />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-fg text-sm">
                          {log.userName || (isEn ? 'System' : 'Sistema')}
                        </span>
                        {log.userRole && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: roleStyle?.bg || '#f1edec',
                              color: roleStyle?.text || '#1c1b1b',
                            }}
                          >
                            {getRoleLabel(log.userRole, lang)}
                          </span>
                        )}
                        {getResultBadge(log.result)}
                      </div>

                      <p className="text-xs text-fg-secondary mt-1 leading-relaxed">
                        {formatAuditEntry(log, lang)}
                      </p>

                      {log.changes && (
                        <pre className="text-[10px] text-fg-muted bg-surface-2 border border-transparent p-2 rounded-sm mt-2 overflow-x-auto font-mono">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-fg-muted shrink-0 sm:text-right">
                    {new Date(log.createdAt).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
