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
import { AuditLogEntry, ROLE_LABELS, ROLE_COLORS } from '../types/rbac';
import { fetchAuditLogs, formatAuditEntry } from '../lib/audit';
import { useAuth } from '../contexts/AuthContext';

export function AuditLogView() {
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
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-8 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[#ba1a1a]" />
        <h3 className="font-semibold text-[#1c1b1b] text-base">Acesso Restrito</h3>
        <p className="text-xs text-[#747878] mt-1">
          Apenas o titular da empresa (Owner) tem permissão para visualizar o log de auditoria.
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
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a6b3a] bg-[#d4eddf] px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Sucesso
        </span>
      );
    }
    if (result === 'denied') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7a5400] bg-[#fff3d6] px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Negado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Erro
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">Registo de Auditoria</h1>
          <p className="text-sm text-[#747878] mt-1">
            Histórico de ações administrativas, alterações de permissões e eventos de segurança
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center space-x-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] px-4 py-2 rounded-[29px] text-xs font-medium transition-all cursor-pointer shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
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
            placeholder="Pesquisar por autor, ação ou recurso..."
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-10 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Action Category Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: 'Todas' },
              { key: 'user', label: 'Utilizadores' },
              { key: 'permission', label: 'Permissões' },
              { key: 'project', label: 'Projetos' },
              { key: 'task', label: 'Tarefas' },
            ] as const
          ).map(f => {
            const isActive = actionFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActionFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isActive ? 'bg-[#000000] text-white' : 'text-[#444747] hover:bg-[#f1edec]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table / Feed */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-[#747878]">
            <History className="w-10 h-10 mx-auto mb-3 text-[#c4c7c7]" strokeWidth={1.5} />
            <p className="font-medium text-[#1c1b1b]">Nenhum registo de auditoria encontrado</p>
            <p className="text-xs text-[#747878] mt-1">As ações dos utilizadores serão registadas aqui automaticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-[#c4c7c7]/20">
            {filteredLogs.map(log => {
              const roleStyle = log.userRole ? ROLE_COLORS[log.userRole] : undefined;
              return (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 hover:bg-[#f7f3f2]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0 border border-[#c4c7c7]/30 mt-0.5">
                      <User className="w-4 h-4 text-[#747878]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#1c1b1b] text-sm">
                          {log.userName || 'Sistema'}
                        </span>
                        {log.userRole && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: roleStyle?.bg || '#f1edec',
                              color: roleStyle?.text || '#1c1b1b',
                            }}
                          >
                            {ROLE_LABELS[log.userRole]}
                          </span>
                        )}
                        {getResultBadge(log.result)}
                      </div>

                      <p className="text-xs text-[#444747] mt-1 leading-relaxed">
                        {formatAuditEntry(log)}
                      </p>

                      {log.changes && (
                        <pre className="text-[10px] text-[#747878] bg-[#f1edec] p-2 rounded-lg mt-2 overflow-x-auto font-mono">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#747878] shrink-0 sm:text-right">
                    {new Date(log.createdAt).toLocaleDateString('pt-PT', {
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
