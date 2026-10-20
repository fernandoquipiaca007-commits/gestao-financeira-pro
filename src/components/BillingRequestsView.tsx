import React, { useState } from 'react';
import { confirmAction, toast } from '../lib/feedback';
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
import { BillingRequest, BillingRequestStatus, BILLING_STATUS_COLORS, getBillingStatusLabel } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const isEn = lang === 'en';
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
    { id: 'ALL', label: isEn ? 'All' : 'Todas', count: requests.length },
    { id: 'Solicitada', label: isEn ? 'Requested' : 'Solicitadas', count: requests.filter((r) => r.status === 'Solicitada').length },
    { id: 'Em análise', label: isEn ? 'Under Review' : 'Em Análise', count: requests.filter((r) => r.status === 'Em análise').length },
    { id: 'Aprovada', label: isEn ? 'Approved' : 'Aprovadas', count: requests.filter((r) => r.status === 'Aprovada').length },
    { id: 'Rejeitada', label: isEn ? 'Rejected' : 'Rejeitadas', count: requests.filter((r) => r.status === 'Rejeitada').length },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
            {isEn ? 'Billing Requests' : 'Solicitações de Faturação'}
          </h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {canApprove
              ? (isEn ? 'Review and approve billing requests submitted by collaborators' : 'Analise e aprove os pedidos de faturação enviados pelos colaboradores')
              : (isEn ? 'Request billing for completed projects and track status' : 'Solicite o faturação dos seus projetos concluídos e acompanhe o estado')}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewRequestModal}
            className="aura-btn aura-btn--primary aura-btn--sm shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'New Request' : 'Nova Solicitação'}</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[13px] font-medium text-fg-secondary block">
              {isEn ? 'Pending Review' : 'Pendente de Análise'}
            </span>
            <div className="text-2xl font-semibold text-warning-fg mt-1">
              {totalPending.length} <span className="text-xs font-normal text-fg-muted ">{isEn ? 'requests' : 'pedidos'}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-warning-soft text-warning-fg flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[13px] font-medium text-fg-secondary block">
              {isEn ? 'Approved / Invoiced' : 'Aprovados / Faturados'}
            </span>
            <div className="text-2xl font-semibold text-success-fg mt-1">
              {totalApproved.length} <span className="text-xs font-normal text-fg-muted ">{isEn ? 'requests' : 'pedidos'}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-success-soft text-success-fg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-glass border border-line-subtle p-5 rounded-xl shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[13px] font-medium text-fg-secondary block">
              {isEn ? 'Total Invoiced this Month' : 'Total Faturado no Mês'}
            </span>
            <div className="text-xl font-semibold text-fg mt-1 truncate">
              {sumApproved.toLocaleString(isEn ? 'en-US' : 'pt-PT', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-2 text-fg-secondary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-glass p-3 rounded-xl border border-line-subtle shadow-glass">
        <div className="flex flex-wrap gap-1">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
 isActive
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:bg-sunken hover:text-fg '
 }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
 isActive ? 'bg-white/20 text-white' : 'bg-surface-3 text-fg-muted '
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
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-fg-muted " />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by description, project...' : 'Buscar por descrição, projeto...'}
            className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-line-subtle rounded-full text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-glass border border-line-subtle rounded-xl shadow-glass overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-fg text-base">
              {isEn ? 'No requests found' : 'Nenhuma solicitação encontrada'}
            </h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto mt-1">
              {activeFilter !== 'ALL'
                ? (isEn ? 'No requests match this filter.' : 'Não existem solicitações correspondentes a este filtro.')
                : (isEn ? 'When collaborators submit project billing requests, they will appear here.' : 'Quando os colaboradores enviarem pedidos de faturação de projetos, eles aparecerão aqui.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2 text-[13px] font-medium text-fg-secondary border-b border-line-subtle ">
                  <th className="py-3.5 px-5">{isEn ? 'Request / Description' : 'Solicitação / Descrição'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Project' : 'Projeto'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Requester' : 'Solicitante'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Amount' : 'Valor'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Status' : 'Estado'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Date' : 'Data'}</th>
                  <th className="py-3.5 px-5 text-right">{isEn ? 'Action' : 'Ação'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle ">
                {filteredRequests.map((r) => {
                  const statusStyle = BILLING_STATUS_COLORS[r.status] || { bg: '#f1edec', text: '#444747' };
                  const isOwnRequest = r.requestedBy === userProfile?.id;

                  return (
                    <tr key={r.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-4 px-5 max-w-xs">
                        <span className="font-medium text-fg block line-clamp-1">{r.description}</span>
                        {r.reviewNotes && (
                          <span className="text-[11px] text-fg-muted mt-0.5 block italic">
                            {isEn ? 'Note: ' : 'Nota: '}{r.reviewNotes}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {r.projectName ? (
                          <span className="flex items-center gap-1.5 font-medium text-fg ">
                            <FolderKanban className="w-3.5 h-3.5 text-accent-soft-fg shrink-0" />
                            <span className="truncate max-w-[160px]">{r.projectName}</span>
                          </span>
                        ) : (
                          <span className="text-fg-muted italic">{isEn ? 'Standalone' : 'Avulso'}</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="flex items-center gap-1.5 text-fg-secondary ">
                          <User className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                          <span>{r.requestedByName || (isEn ? 'Employee' : 'Funcionário')}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-fg ">
                          {r.currency} {r.amount.toLocaleString(isEn ? 'en-US' : 'pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {getBillingStatusLabel(r.status, lang)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-fg-muted ">
                        {new Date(r.createdAt).toLocaleDateString(isEn ? 'en-US' : 'pt-PT')}
                      </td>

                      <td className="py-4 px-5 text-right space-x-2">
                        {canApprove ? (
                          <button
                            onClick={() => onOpenReviewModal(r)}
                            className="aura-btn aura-btn--primary aura-btn--sm"
                          >
                            {r.status === 'Aprovada' || r.status === 'Faturada' ? (isEn ? 'Details' : 'Detalhes') : (isEn ? 'Review' : 'Analisar')}
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenReviewModal(r)}
                            className="aura-btn aura-btn--secondary aura-btn--sm"
                          >
                            {isEn ? 'View Details' : 'Ver Detalhes'}
                          </button>
                        )}

                        {onDeleteRequest && (isOwner || (isOwnRequest && r.status === 'Solicitada')) && (
                          <button
                            onClick={async () => {
                              if ((await confirmAction({ title: isEn ? 'Do you want to delete this billing request?' : 'Deseja eliminar esta solicitação de faturação?', confirmLabel: isEn ? 'Delete request' : 'Eliminar pedido', danger: true }))) {
                                onDeleteRequest(r.id);
                              }
                            }}
                            className="p-1.5 rounded-full text-danger-fg hover:bg-danger-soft cursor-pointer transition-colors"
                            title={isEn ? 'Delete request' : 'Eliminar solicitação'}
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
