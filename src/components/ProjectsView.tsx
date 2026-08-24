import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MessageCircle,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  Star,
  Copy,
  Paperclip,
  Download,
  FileText,
  User,
  Users,
  Globe,
  Hand,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { Project, Client, ProjectStatus, CurrencyCode } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../lib/formatters';
import { useAuth } from '../contexts/AuthContext';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  currencyFilter: CurrencyCode | 'ALL';
  initialStatusFilter?: string;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onDuplicateProject?: (project: Project) => void;
  onRateProject?: (project: Project, rating: number) => void;
  onDeleteProject: (projectId: string) => void;
  onMarkProjectAsPaid?: (project: Project) => void;
  onAssumeProject?: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenStripeInvoiceModal?: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  currencyFilter,
  initialStatusFilter,
  onOpenNewProjectModal,
  onEditProject,
  onDuplicateProject,
  onRateProject,
  onDeleteProject,
  onMarkProjectAsPaid,
  onAssumeProject,
  onOpenWhatsAppCharge,
  onOpenStripeInvoiceModal,
}) => {
  const { isOwner, hasPermission, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [assumingProjectId, setAssumingProjectId] = useState<string | null>(null);

  const canCreate = isOwner || hasPermission('projects.create');
  const canEdit = isOwner || hasPermission('projects.edit');
  const canDelete = isOwner || hasPermission('projects.delete');
  const canAssume = hasPermission('projects.assume');

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    // Currency filter
    if (currencyFilter !== 'ALL' && p.currency !== currencyFilter) return false;

    // Assignment & Status filter
    if (statusFilter === 'MINE') {
      if (p.assignedTo !== userProfile?.id) return false;
    } else if (statusFilter === 'AVAILABLE') {
      if (p.assignmentType !== 'available') return false;
    } else if (statusFilter === 'ativos') {
      if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
    } else if (statusFilter === 'atencao') {
      if (p.status !== 'Aguardando cliente' && getDaysDiff(p.dueDate) > 1) return false;
    } else if (
      statusFilter !== 'ALL' &&
      statusFilter !== 'ativos' &&
      statusFilter !== 'atencao' &&
      statusFilter !== 'MINE' &&
      statusFilter !== 'AVAILABLE' &&
      p.status !== statusFilter
    ) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const client = clientMap.get(p.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const clientCompany = client?.company.toLowerCase() || '';
      const projName = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      return (
        projName.includes(q) ||
        clientName.includes(q) ||
        clientCompany.includes(q) ||
        cat.includes(q)
      );
    }

    return true;
  });

  const handleAssume = async (projectId: string) => {
    if (!onAssumeProject) return;
    setAssumingProjectId(projectId);
    try {
      const res = await onAssumeProject(projectId);
      if (!res.success) {
        alert(res.error || 'Não foi possível assumir o projeto.');
      }
    } finally {
      setAssumingProjectId(null);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Em andamento':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dbe1ff] text-[#003da9] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Em andamento
          </span>
        );
      case 'Aguardando cliente':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff3d6] text-[#7a5400] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Aguardando cliente
          </span>
        );
      case 'Concluído':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#d4eddf] text-[#1a6b3a] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'Cancelado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ffdad6] text-[#93000a] flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
    }
  };

  const availableCount = projects.filter(p => p.assignmentType === 'available').length;
  const myProjectsCount = projects.filter(p => p.assignedTo === userProfile?.id).length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">Projetos & Operações</h1>
          <p className="text-sm text-[#747878] mt-1">
            Acompanhe o status, entregas, pagamentos e responsáveis de cada projeto
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center space-x-2 bg-[#000000] hover:opacity-85 text-white px-5 py-2.5 rounded-[29px] text-sm font-medium transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por projeto, cliente ou serviço..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-10 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full px-4 py-2 text-xs font-medium text-[#1c1b1b] focus:outline-none focus:border-[#000000] cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Website">Website</option>
              <option value="Landing Page">Landing Page</option>
              <option value="Loja Virtual">Loja Virtual</option>
              <option value="Tráfego Pago">Tráfego Pago</option>
              <option value="Automação">Automação</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {/* Status & Scope Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-[#000000] text-white'
                : 'text-[#444747] hover:bg-[#f1edec]'
            }`}
          >
            Todos ({projects.length})
          </button>

          {myProjectsCount > 0 && (
            <button
              onClick={() => setStatusFilter('MINE')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'MINE'
                  ? 'bg-[#0050d7] text-white'
                  : 'text-[#0050d7] hover:bg-[#dbe1ff]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Meus Projetos ({myProjectsCount})</span>
            </button>
          )}

          {availableCount > 0 && (
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-[#003da9] text-white'
                  : 'bg-[#dbe1ff] text-[#003da9] hover:opacity-85'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Disponíveis para Assumir ({availableCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter('ativos')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'ativos'
                ? 'bg-[#000000] text-white'
                : 'text-[#444747] hover:bg-[#f1edec]'
            }`}
          >
            Ativos
          </button>

          <button
            onClick={() => setStatusFilter('Em andamento')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Em andamento'
                ? 'bg-[#000000] text-white'
                : 'text-[#444747] hover:bg-[#f1edec]'
            }`}
          >
            Em andamento
          </button>

          <button
            onClick={() => setStatusFilter('Aguardando cliente')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Aguardando cliente'
                ? 'bg-[#000000] text-white'
                : 'text-[#444747] hover:bg-[#f1edec]'
            }`}
          >
            Aguardando Cliente
          </button>

          <button
            onClick={() => setStatusFilter('Concluído')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Concluído'
                ? 'bg-[#000000] text-white'
                : 'text-[#444747] hover:bg-[#f1edec]'
            }`}
          >
            Concluídos
          </button>
        </div>
      </div>

      {/* Projects List Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <FolderKanban className="w-12 h-12 text-[#c4c7c7] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-[#1c1b1b]">Nenhum projeto encontrado</h3>
          <p className="text-xs text-[#747878] mt-1 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Tente alterar os filtros ou termo de busca acima.'
              : 'Comece adicionando seu primeiro projeto operacional.'}
          </p>
          {canCreate && (
            <button
              onClick={onOpenNewProjectModal}
              className="mt-4 inline-flex items-center space-x-2 bg-[#000000] text-white px-5 py-2.5 rounded-[29px] text-xs font-medium hover:opacity-85 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Projeto</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const client = clientMap.get(p.clientId);
            const clientIds = p.clientIds && p.clientIds.length > 0 ? p.clientIds : (p.clientId ? [p.clientId] : []);
            const linkedClients = clientIds.map((id) => clientMap.get(id)).filter(Boolean) as Client[];
            const primaryClient = linkedClients[0] || client;

            const remaining = Math.max(0, p.totalAmount - p.paidAmount);
            const isFullyPaid = remaining === 0;
            const progressPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paidAmount / p.totalAmount) * 100)) : 0;
            const daysToDue = getDaysDiff(p.dueDate);
            const isUrgent = daysToDue <= 2 && p.status !== 'Concluído' && p.status !== 'Cancelado';

            const isAssignedToMe = p.assignedTo === userProfile?.id;
            const isAvailable = p.assignmentType === 'available';

            return (
              <div
                key={p.id}
                className={`bg-white border rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between group ${
                  isAvailable
                    ? 'border-[#0050d7]/40 ring-2 ring-[#0050d7]/10'
                    : isUrgent
                    ? 'border-[#ffdad6]'
                    : 'border-[#c4c7c7]/40'
                }`}
              >
                <div>
                  {/* Top Bar: Category, Status, Responsible Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1edec] text-[#444747]">
                      {p.category}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Responsible / Assignment Banner */}
                  <div className="mb-3">
                    {isAvailable ? (
                      <div className="bg-[#dbe1ff] border border-[#003da9]/20 p-2.5 rounded-[14px] flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#003da9] flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Projeto Disponível
                        </span>
                        {canAssume && (
                          <button
                            onClick={() => handleAssume(p.id)}
                            disabled={assumingProjectId === p.id}
                            className="inline-flex items-center space-x-1 bg-[#0050d7] hover:opacity-90 disabled:opacity-50 text-white px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            {assumingProjectId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Hand className="w-3 h-3" />
                            )}
                            <span>Assumir</span>
                          </button>
                        )}
                      </div>
                    ) : p.assignmentType === 'employee' ? (
                      <div className="inline-flex items-center space-x-1.5 text-xs text-[#444747] bg-[#f1edec] px-2.5 py-1 rounded-full font-medium">
                        <User className="w-3.5 h-3.5 text-[#747878]" />
                        <span>
                          {p.assignedToName || 'Funcionário'} {isAssignedToMe && '(Tu)'}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 text-xs text-[#747878] bg-[#f7f3f2] px-2.5 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5" />
                        <span>Empresa</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight leading-snug group-hover:text-[#0050d7] transition-colors">
                    {p.name}
                  </h3>

                  <div className="flex items-center justify-between mt-1.5 mb-3">
                    <div className="flex items-start space-x-1.5 text-xs text-[#747878]">
                      <Building2 className="w-3.5 h-3.5 text-[#747878] shrink-0 mt-0.5" />
                      <div>
                        {linkedClients.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-[#1c1b1b] font-medium">
                              {linkedClients.map((c) => c.name).join(' & ')}
                            </strong>
                            <span className="px-1.5 py-0.5 rounded-full bg-[#dbe1ff] text-[#003da9] text-[10px] font-semibold">
                              {linkedClients.length} Clientes
                            </span>
                          </div>
                        ) : (
                          <span>
                            <strong className="text-[#1c1b1b] font-medium">{primaryClient ? primaryClient.name : 'Cliente não encontrado'}</strong>
                            {primaryClient?.company && (
                              <span className="text-[#747878] ml-1">({primaryClient.company})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Bar */}
                  <div className="flex items-center space-x-1 mb-4 bg-[#f1edec] px-2.5 py-1 rounded-full w-fit">
                    <span className="text-[11px] text-[#747878] font-medium mr-1">Avaliação:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRateProject?.(p, p.rating === star ? 0 : star);
                        }}
                        className="p-0.5 transition-transform hover:scale-125 cursor-pointer"
                        title={`Classificar como ${star} estrela(s)`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            (p.rating || 0) >= star
                              ? 'fill-[#000000] text-[#000000]'
                              : 'text-[#c4c7c7] hover:text-[#000000]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Financial Breakdown Card (hidden for employee without financial view) */}
                  {(isOwner || hasPermission('financial.view')) && (
                    <div className="bg-[#f7f3f2] p-4 rounded-[16px] border border-[#c4c7c7]/30 mb-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#747878]">Valor Total:</span>
                        <strong className="text-[#000000] font-medium text-sm">
                          {formatCurrency(p.totalAmount, p.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#747878]">Valor Já Pago:</span>
                        <strong className="text-[#1a6b3a] font-medium">
                          {formatCurrency(p.paidAmount, p.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#c4c7c7]/30">
                        <span className="text-[#747878]">Valor Restante:</span>
                        <strong className={`font-medium ${remaining > 0 ? 'text-[#7a5400]' : 'text-[#747878]'}`}>
                          {formatCurrency(remaining, p.currency)}
                        </strong>
                      </div>

                      <div className="pt-1.5">
                        <div className="w-full bg-[#e5e2e1] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-[#1a6b3a]' : 'bg-[#000000]'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-[#747878] text-right mt-1">
                          {progressPct}% liquidado
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates Details */}
                  <div className="space-y-2 text-xs text-[#1c1b1b] mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[#747878]">
                        <Calendar className="w-3.5 h-3.5 text-[#747878]" /> Previsão Entrega:
                      </span>
                      <strong className={isUrgent ? 'text-[#ba1a1a] font-semibold' : 'text-[#1c1b1b] font-medium'}>
                        {formatDate(p.dueDate)}
                        {daysToDue >= 0 ? ` (em ${daysToDue}d)` : ` (atrasado ${Math.abs(daysToDue)}d)`}
                      </strong>
                    </div>

                    {p.nextPaymentDate && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#747878]">
                          <Clock className="w-3.5 h-3.5 text-[#747878]" /> Próx. Pagamento:
                        </span>
                        <strong className="text-[#1c1b1b] font-medium">{formatDate(p.nextPaymentDate)}</strong>
                      </div>
                    )}

                    {p.partnerName && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#c4c7c7]/20 text-[11px]">
                        <span className="text-[#747878]">Parceiro Indicador:</span>
                        <span className="text-[#1c1b1b] font-medium">{p.partnerName}</span>
                      </div>
                    )}
                  </div>

                  {/* File Attachments Pills */}
                  {p.attachments && p.attachments.length > 0 && (
                    <div className="mb-4 pt-2 border-t border-[#c4c7c7]/30">
                      <div className="flex items-center space-x-1.5 mb-2 text-[11px] font-semibold text-[#747878] uppercase tracking-widest">
                        <Paperclip className="w-3.5 h-3.5 text-[#747878]" />
                        <span>Ficheiros Anexados ({p.attachments.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            download={att.name}
                            className="inline-flex items-center space-x-1.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border border-[#c4c7c7]/30"
                            title={`Descarregar ${att.name}`}
                          >
                            <FileText className="w-3 h-3 text-[#0050d7]" />
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <Download className="w-3 h-3 text-[#747878]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.notes && (
                    <div className="p-2.5 bg-[#f7f3f2] rounded-xl text-xs text-[#747878] italic mb-4">
                      "{p.notes}"
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => onEditProject(p)}
                        className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                        title="Editar Projeto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canCreate && onDuplicateProject && (
                      <button
                        onClick={() => onDuplicateProject(p)}
                        className="p-1.5 text-[#747878] hover:text-[#0050d7] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                        title="Replicar Projeto Recorrente (Novo Mês)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {onOpenStripeInvoiceModal && remaining > 0 && (isOwner || hasPermission('financial.edit')) && (
                      <button
                        onClick={() => onOpenStripeInvoiceModal(p)}
                        className="px-3 py-1.5 bg-[#f0efff] hover:bg-[#e4e2ff] text-[#635bff] border border-[#635bff]/20 rounded-full text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer"
                        title="Gerar fatura Stripe com link de pagamento automático"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Fatura Stripe</span>
                      </button>
                    )}

                    {onMarkProjectAsPaid && remaining > 0 && (isOwner || hasPermission('financial.edit')) && (
                      <button
                        onClick={() => onMarkProjectAsPaid(p)}
                        className="px-3 py-1.5 bg-[#d4eddf] hover:bg-[#b8e3c9] text-[#1a6b3a] rounded-full text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer"
                        title="Marcar projeto como 100% pago e liquidar receita"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar como Pago</span>
                      </button>
                    )}

                    {client?.whatsapp && remaining > 0 && (
                      <button
                        onClick={() => {
                          const msg = `Olá, ${client.name}! Tudo bem? Gostaria de atualizar sobre o projeto "${p.name}". O valor restante pendente é de ${formatCurrency(remaining, p.currency)}. Próximo vencimento: ${p.nextPaymentDate ? formatDate(p.nextPaymentDate) : formatDate(p.dueDate)}. Obrigado!`;
                          onOpenWhatsAppCharge(client.whatsapp, msg);
                        }}
                        className="px-3.5 py-1.5 bg-[#fff3d6] hover:opacity-85 text-[#7a5400] rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Cobrar</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
