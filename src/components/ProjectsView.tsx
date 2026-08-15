import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
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
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Em andamento
          </span>
        );
      case 'Aguardando cliente':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Aguardando cliente
          </span>
        );
      case 'Concluído':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
          </span>
        );
      case 'Cancelado':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
            <FolderKanban className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Projetos &amp; Operações</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Gerenciamento de contratos, entregas, pagamentos e repasses</p>
          </div>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar projeto, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters Dropdowns */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('Em andamento')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'Em andamento'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em andamento
            </button>
            <button
              onClick={() => setStatusFilter('Concluído')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'Concluído'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídos
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-sm rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {isDeliverySoon && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-2xl" />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-black border border-slate-300 shadow-2xs">
                      {p.category}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>

                  <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                    {p.name}
                  </h3>

                  <div className="flex items-center justify-between mt-1 mb-3">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-800 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0 stroke-[2.2]" />
                      <span><strong className="text-slate-950 font-black">{client ? client.name : 'Cliente não encontrado'}</strong></span>
                      {client?.company && (
                        <span className="text-slate-700 font-bold">({client.company})</span>
                      )}
                    </div>
                  </div>

                  {/* Star Rating Bar */}
                  <div className="flex items-center space-x-1 mb-4 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-300 w-fit shadow-2xs">
                    <span className="text-[11px] font-black text-slate-800 mr-1">Avaliação:</span>
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
                              ? 'fill-amber-400 text-amber-500 stroke-[2]'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="bg-slate-100/90 p-3.5 rounded-xl border border-slate-300 mb-4 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-extrabold">Valor Total:</span>
                      <strong className="text-slate-950 font-black text-sm">
                        {formatCurrency(p.totalAmount, p.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-extrabold">Valor Já Pago:</span>
                      <strong className="text-emerald-700 font-black">
                        {formatCurrency(p.paidAmount, p.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-300">
                      <span className="text-slate-800 font-extrabold">Valor Restante:</span>
                      <strong className={`font-black ${remaining > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                        {formatCurrency(remaining, p.currency)}
                      </strong>
                    </div>

                    <div className="pt-1.5">
                      <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden border border-slate-300">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-600' : 'bg-amber-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-800 text-right mt-1 font-black">
                        {progressPct}% liquidado
                      </div>
                    </div>
                  </div>

                  {/* Dates Details */}
                  <div className="space-y-2 text-xs text-slate-800 font-bold mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-800 font-extrabold">
                        <Calendar className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" /> Previsão Entrega:
                      </span>
                      <strong className={`font-black ${isDeliverySoon ? 'text-amber-800' : 'text-slate-900'}`}>
                        {formatDate(p.dueDate)}
                      </strong>
                    </div>

                    {!isCompletedOrPaid && p.nextPaymentDate && (
                      <div className="flex items-center justify-between text-amber-950 font-black bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                        <span>Próximo Pagamento:</span>
                        <strong className="text-amber-950 text-sm font-black">{formatDate(p.nextPaymentDate)}</strong>
                      </div>
                    )}

                    {isCompletedOrPaid && (
                      <div className="flex items-center justify-between text-emerald-950 font-black bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs shadow-2xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" /> Projeto Liquidado
                        </span>
                        <strong className="text-emerald-900 font-black">100% Pago</strong>
                      </div>
                    )}
                  </div>

                  {/* Project Attachments / Ficheiros */}
                  {p.attachments && p.attachments.length > 0 && (
                    <div className="mb-4 bg-slate-100 border border-slate-300 p-2.5 rounded-xl space-y-1.5 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-900">
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-blue-700 stroke-[2.2]" /> Ficheiros do Projeto ({p.attachments.length})
                        </span>
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {p.attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-300 text-[11px]">
                            <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                              <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="font-bold text-slate-900 truncate" title={att.name}>{att.name}</span>
                            </div>
                            <a
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors shrink-0 ml-1 flex items-center gap-1 font-black cursor-pointer"
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
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg mb-4 line-clamp-2 border border-slate-200">
                      &ldquo;{p.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditProject(p)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar Projeto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onDuplicateProject?.(p)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Replicar Projeto Recorrente (Novo Mês)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Cobrar Restante</span>
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
