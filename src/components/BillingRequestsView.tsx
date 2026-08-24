import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  FolderKanban,
  User,
  Trash2,
} from 'lucide-react';
import { Project, CurrencyCode } from '../types';
import { BillingRequest, BillingRequestStatus, BILLING_STATUS_COLORS } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';

interface BillingRequestsViewProps {
  requests: BillingRequest[];
  projects: Project[];
  onOpenNewRequestModal: () => void;
  onOpenReviewModal: (request: BillingRequest) => void;
  onDeleteRequest?: (requestId: string) => void;
}

export const BillingRequestsView: React.FC<BillingRequestsViewProps> = ({
  requests,
  projects,
  onOpenNewRequestModal,
  onOpenReviewModal,
  onDeleteRequest,
}) => {
  const { userProfile, isOwner, isAdmin, hasPermission } = useAuth();
  const canApprove = isOwner || hasPermission('billing.approve');
  const canCreate = isOwner || isAdmin || hasPermission('billing.request');

  const [activeFilter, setActiveFilter] = useState<'ALL' | BillingRequestStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering
  const filteredRequests = requests.filter((r) => {
    const matchesFilter = activeFilter === 'ALL' || r.status === activeFilter;
    const matchesSearch =
      searchTerm === '' ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.projectName && r.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.requestedByName && r.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // KPIs
  const totalPending = requests.filter((r) => r.status === 'Solicitada' || r.status === 'Em análise');
  const totalApproved = requests.filter((r) => r.status === 'Aprovada' || r.status === 'Faturada');

  const sumPending = totalPending.reduce((acc, r) => acc + r.amount, 0);
  const sumApproved = totalApproved.reduce((acc, r) => acc + r.amount, 0);

  const filterTabs: Array<{ id: 'ALL' | BillingRequestStatus; label: string; count?: number }> = [
    { id: 'ALL', label: 'Todas', count: requests.length },
    { id: 'Solicitada', label: 'Solicitadas', count: requests.filter((r) => r.status === 'Solicitada').length },
    { id: 'Em análise', label: 'Em Análise', count: requests.filter((r) => r.status === 'Em análise').length },
    { id: 'Aprovada', label: 'Aprovadas', count: requests.filter((r) => r.status === 'Aprovada').length },
    { id: 'Rejeitada', label: 'Rejeitadas', count: requests.filter((r) => r.status === 'Rejeitada').length },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">
            Solicitações de Faturamento
          </h1>
          <p className="text-xs text-[#747878] mt-0.5">
            {canApprove
              ? 'Analise e aprove os pedidos de faturamento enviados pelos colaboradores'
              : 'Solicite o faturamento dos seus projetos concluídos e acompanhe o estado'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewRequestModal}
            className="px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-xs rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block">
              Pendente de Análise
            </span>
            <div className="text-2xl font-semibold text-[#7a5400] mt-1">
              {totalPending.length} <span className="text-xs font-normal text-[#747878]">pedidos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#fff3d6] text-[#7a5400] flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block">
              Aprovados / Faturados
            </span>
            <div className="text-2xl font-semibold text-[#1a6b3a] mt-1">
              {totalApproved.length} <span className="text-xs font-normal text-[#747878]">pedidos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#d4eddf] text-[#1a6b3a] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block">
              Total Faturado no Mês
            </span>
            <div className="text-xl font-semibold text-[#000000] mt-1 truncate">
              {sumApproved.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#000000] text-white'
                    : 'text-[#444747] hover:bg-[#f1edec] hover:text-[#1c1b1b]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#e5e2e1] text-[#747878]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-[#747878]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, projeto..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-xs text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-[#f1edec] text-[#747878] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">Nenhuma solicitação encontrada</h3>
            <p className="text-xs text-[#747878] max-w-sm mx-auto mt-1">
              {activeFilter !== 'ALL'
                ? 'Não existem solicitações correspondentes a este filtro.'
                : 'Quando os colaboradores enviarem pedidos de faturamento de projetos, eles aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f3f2] text-[11px] font-semibold text-[#747878] uppercase tracking-wider border-b border-[#c4c7c7]/40">
                  <th className="py-3.5 px-5">Solicitação / Descrição</th>
                  <th className="py-3.5 px-4">Projeto</th>
                  <th className="py-3.5 px-4">Solicitante</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c7c7]/30">
                {filteredRequests.map((r) => {
                  const statusStyle = BILLING_STATUS_COLORS[r.status] || { bg: '#f1edec', text: '#444747' };
                  const isOwnRequest = r.requestedBy === userProfile?.id;

                  return (
                    <tr key={r.id} className="hover:bg-[#f7f3f2]/60 transition-colors">
                      <td className="py-4 px-5 max-w-xs">
                        <span className="font-medium text-[#1c1b1b] block line-clamp-1">{r.description}</span>
                        {r.reviewNotes && (
                          <span className="text-[11px] text-[#747878] mt-0.5 block italic">
                            Nota: {r.reviewNotes}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {r.projectName ? (
                          <span className="flex items-center gap-1.5 font-medium text-[#1c1b1b]">
                            <FolderKanban className="w-3.5 h-3.5 text-[#0050d7] shrink-0" />
                            <span className="truncate max-w-[160px]">{r.projectName}</span>
                          </span>
                        ) : (
                          <span className="text-[#747878] italic">Avulso</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1.5 text-[#444747]">
                          <User className="w-3.5 h-3.5 text-[#747878] shrink-0" />
                          <span>{r.requestedByName || 'Funcionário'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-[#000000]">
                          {r.currency} {r.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-[#747878]">
                        {new Date(r.createdAt).toLocaleDateString('pt-PT')}
                      </td>

                      <td className="py-4 px-5 text-right space-x-2">
                        {canApprove ? (
                          <button
                            onClick={() => onOpenReviewModal(r)}
                            className="px-3 py-1.5 bg-[#000000] hover:opacity-85 text-white rounded-[29px] text-xs font-medium cursor-pointer transition-all active:scale-95"
                          >
                            {r.status === 'Aprovada' || r.status === 'Faturada' ? 'Detalhes' : 'Analisar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenReviewModal(r)}
                            className="px-3 py-1.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] rounded-[29px] text-xs font-medium cursor-pointer transition-all"
                          >
                            Ver Detalhes
                          </button>
                        )}

                        {onDeleteRequest && (isOwner || (isOwnRequest && r.status === 'Solicitada')) && (
                          <button
                            onClick={() => {
                              if (window.confirm('Deseja eliminar esta solicitação de faturamento?')) {
                                onDeleteRequest(r.id);
                              }
                            }}
                            className="p-1.5 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6] cursor-pointer transition-colors"
                            title="Excluir solicitação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
