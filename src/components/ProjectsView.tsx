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
  DollarSign,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Project, Client, ProjectStatus, ProjectCategory, CurrencyCode } from '../types';
import { formatCurrency, formatDate, getDaysDiff, generateWhatsAppLink } from '../lib/formatters';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  currencyFilter: CurrencyCode | 'ALL';
  initialStatusFilter?: string;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: Project) => void;
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
    <div className="space-y-6 pb-12">
      
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            Portfólio de Projetos
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Controlo operacional, valores recebidos/restantes e prazos de entrega
          </p>
        </div>

        <button
          onClick={onOpenNewProjectModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Projeto</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por projeto, cliente ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ativos">Apenas Ativos</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando cliente">Aguardando cliente</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas as Categorias</option>
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem projetos que correspondam aos filtros selecionados.
          </p>
          <button
            onClick={onOpenNewProjectModal}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const client = clientMap.get(p.clientId);
            const remaining = Math.max(0, p.totalAmount - p.paidAmount);
            const isFullyPaid = remaining === 0;
            const progressPct = p.totalAmount > 0 ? Math.min(100, Math.round((p.paidAmount / p.totalAmount) * 100)) : 0;
            const diffDays = getDaysDiff(p.dueDate);

            const isDeliverySoon = diffDays >= 0 && diffDays <= 2 && p.status !== 'Concluído';

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-sm rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {/* Accent top border if delivery is soon */}
                {isDeliverySoon && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-2xl" />
                )}

                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                      {p.category}
                    </span>
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Project Name & Client */}
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                    {p.name}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1 mb-4 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong className="text-slate-800">{client ? client.name : 'Cliente não encontrado'}</strong></span>
                    {client?.company && (
                      <span className="text-slate-400">({client.company})</span>
                    )}
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Valor Total:</span>
                      <strong className="text-slate-900 font-extrabold text-sm">
                        {formatCurrency(p.totalAmount, p.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Valor Já Pago:</span>
                      <span className="text-emerald-700 font-bold">
                        {formatCurrency(p.paidAmount, p.currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Valor Restante:</span>
                      <strong className={`font-extrabold ${remaining > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {formatCurrency(remaining, p.currency)}
                      </strong>
                    </div>

                    {/* Progress bar */}
                    <div className="pt-1.5">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 text-right mt-1 font-medium">
                        {progressPct}% liquidado
                      </div>
                    </div>
                  </div>

                  {/* Dates Details */}
                  <div className="space-y-1.5 text-xs text-slate-500 font-medium mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Previsão Entrega:
                      </span>
                      <strong className={`font-bold ${isDeliverySoon ? 'text-amber-700' : 'text-slate-700'}`}>
                        {formatDate(p.dueDate)}
                      </strong>
                    </div>

                    {p.nextPaymentDate && (
                      <div className="flex items-center justify-between text-amber-700 font-bold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                        <span>Próximo Pagamento:</span>
                        <strong>{formatDate(p.nextPaymentDate)}</strong>
                      </div>
                    )}
                  </div>

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
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar Projeto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all"
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
