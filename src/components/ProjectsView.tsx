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
} from 'lucide-react';
import { Project, Client, ProjectStatus, CurrencyCode } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../lib/formatters';

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
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
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
  onOpenWhatsAppCharge,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    // Currency filter
    if (currencyFilter !== 'ALL' && p.currency !== currencyFilter) return false;

    // Status filter
    if (statusFilter === 'ativos' && (p.status === 'Concluído' || p.status === 'Cancelado')) return false;
    if (statusFilter === 'atencao' && p.status !== 'Aguardando cliente' && getDaysDiff(p.dueDate) > 1) return false;
    if (statusFilter !== 'ALL' && statusFilter !== 'ativos' && statusFilter !== 'atencao' && p.status !== statusFilter) {
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

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">Projetos &amp; Operações</h2>
            <p className="text-xs text-[#747878] mt-0.5">Gerenciamento de contratos, entregas, pagamentos e repasses</p>
          </div>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white text-sm font-medium rounded-[29px] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar projeto, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-9 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Filters Dropdowns */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full p-1 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-[#000000] text-white'
                  : 'text-[#444747] hover:text-[#1c1b1b]'
              }`}
            >
              Todos ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('Em andamento')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'Em andamento'
                  ? 'bg-[#000000] text-white'
                  : 'text-[#444747] hover:text-[#1c1b1b]'
              }`}
            >
              Em andamento
            </button>
            <button
              onClick={() => setStatusFilter('Concluído')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'Concluído'
                  ? 'bg-[#000000] text-white'
                  : 'text-[#444747] hover:text-[#1c1b1b]'
              }`}
            >
              Concluídos
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#f1edec] border border-[#c4c7c7]/35 text-[#1c1b1b] text-sm font-medium rounded-full px-4 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="Tráfego Pago">Tráfego Pago</option>
            <option value="Website">Website</option>
            <option value="Landing Page">Landing Page</option>
            <option value="Loja Virtual">Loja Virtual</option>
            <option value="Automação">Automação</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <FolderKanban className="w-12 h-12 text-[#c4c7c7] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#1c1b1b]">Nenhum projeto encontrado</h3>
          <p className="text-xs text-[#747878] mt-1 max-w-sm mx-auto">
            Não existem projetos que correspondam aos filtros selecionados ou nenhum projeto foi cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const client = clientMap.get(p.clientId);
            const remaining = Math.max(0, p.totalAmount - p.paidAmount);
            const isFullyPaid = remaining === 0;
            const isCompletedOrPaid = p.status === 'Concluído' || isFullyPaid;
            const progressPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paidAmount / p.totalAmount) * 100)) : 0;
            const diffDays = getDaysDiff(p.dueDate);

            const isDeliverySoon = diffDays >= 0 && diffDays <= 2 && p.status !== 'Concluído';

            const linkedClientIds = p.clientIds && p.clientIds.length > 0 ? p.clientIds : [p.clientId];
            const linkedClients = linkedClientIds.map((id) => clientMap.get(id)).filter(Boolean) as Client[];
            const primaryClient = linkedClients[0] || clientMap.get(p.clientId);

            return (
              <div
                key={p.id}
                className="bg-white border border-[#c4c7c7]/40 hover:border-[#c4c7c7] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-[22px] p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {isDeliverySoon && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#fff3d6] rounded-t-[22px]" />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f1edec] text-[#444747] text-[11px] font-semibold">
                      {p.category}
                    </span>
                    {getStatusBadge(p.status)}
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

                  {/* Financial Breakdown Card */}
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

                  {/* Dates Details */}
                  <div className="space-y-2 text-xs text-[#1c1b1b] mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[#747878]">
                        <Calendar className="w-3.5 h-3.5 text-[#747878]" /> Previsão Entrega:
                      </span>
                      <strong className={`font-medium ${isDeliverySoon ? 'text-[#7a5400]' : 'text-[#1c1b1b]'}`}>
                        {formatDate(p.dueDate)}
                      </strong>
                    </div>

                    {!isCompletedOrPaid && p.nextPaymentDate && (
                      <div className="flex items-center justify-between text-[#7a5400] font-medium bg-[#fff3d6] px-3 py-1.5 rounded-xl text-xs">
                        <span>Próximo Pagamento:</span>
                        <strong className="text-[#7a5400] text-xs font-semibold">{formatDate(p.nextPaymentDate)}</strong>
                      </div>
                    )}

                    {isCompletedOrPaid && (
                      <div className="flex items-center justify-between text-[#1a6b3a] font-medium bg-[#d4eddf] px-3 py-1.5 rounded-xl text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#1a6b3a]" /> Projeto Liquidado
                        </span>
                        <strong className="text-[#1a6b3a] font-semibold">100% Pago</strong>
                      </div>
                    )}
                  </div>

                  {/* Project Attachments / Ficheiros */}
                  {p.attachments && p.attachments.length > 0 && (
                    <div className="mb-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 p-3 rounded-[16px] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#1c1b1b]">
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-[#0050d7]" /> Ficheiros do Projeto ({p.attachments.length})
                        </span>
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {p.attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between bg-white p-1.5 px-2.5 rounded-xl border border-[#c4c7c7]/30 text-[11px]">
                            <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                              <FileText className="w-3.5 h-3.5 text-[#747878] shrink-0" />
                              <span className="font-medium text-[#1c1b1b] truncate" title={att.name}>{att.name}</span>
                            </div>
                            <a
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-[#0050d7] hover:bg-[#f1edec] rounded-full transition-colors shrink-0 ml-1 flex items-center gap-1 font-medium cursor-pointer"
                              title="Baixar ficheiro"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Baixar</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.notes && (
                    <p className="text-xs text-[#747878] italic bg-[#f7f3f2] p-2.5 rounded-xl mb-4 line-clamp-2 border border-[#c4c7c7]/30">
                      &ldquo;{p.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditProject(p)}
                      className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                      title="Editar Projeto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onDuplicateProject?.(p)}
                      className="p-1.5 text-[#747878] hover:text-[#0050d7] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                      title="Replicar Projeto Recorrente (Novo Mês)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
                      title="Excluir Projeto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

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
            );
          })}
        </div>
      )}

    </div>
  );
};
