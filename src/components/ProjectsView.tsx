import React, { useState, useEffect } from 'react';
import { confirmAction, toast } from '../lib/feedback';
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
  Archive,
  ArchiveRestore,
  Link2,
} from 'lucide-react';
import { Project, Client, ProjectStatus, CurrencyCode, getProjectStatusLabel, BILLING_TYPE_LABELS } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../lib/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { markdownToPlain } from './editor/MarkdownView';
import { ProjectDetailView } from './projects/ProjectDetailView';
import type { Income, AgendaEvent } from '../types';
import type { Task } from '../types/rbac';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  categories?: import('../types').CategoryItem[];
  currencyFilter: CurrencyCode | 'ALL';
  initialStatusFilter?: string;
  initialCategoryFilter?: string;
  onOpenNewProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onDuplicateProject?: (project: Project) => void;
  /** Cria um projeto novo vinculado a este (ex.: a palestra do mês) */
  onLinkProject?: (project: Project) => void;
  onRateProject?: (project: Project, rating: number) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleArchiveProject?: (project: Project) => void;
  onMarkProjectAsPaid?: (project: Project) => void;
  onAssumeProject?: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
  onOpenStripeInvoiceModal?: (project: Project) => void;
  /** Para a página completa do projeto */
  incomes?: Income[];
  tasks?: Task[];
  agendaEvents?: AgendaEvent[];
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  categories = [],
  currencyFilter,
  initialStatusFilter,
  initialCategoryFilter,
  onOpenNewProjectModal,
  onEditProject,
  onDuplicateProject,
  onLinkProject,
  onRateProject,
  onDeleteProject,
  onToggleArchiveProject,
  onMarkProjectAsPaid,
  onAssumeProject,
  onOpenWhatsAppCharge,
  onOpenStripeInvoiceModal,
  incomes = [],
  tasks = [],
  agendaEvents = [],
}) => {
  // Projeto aberto na página completa (null = lista)
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  // A área que faz scroll é o <main> da app, não a janela.
  useEffect(() => { (document.querySelector('main.aura-scroll') || document.scrollingElement)?.scrollTo({ top: 0 }); }, [openProjectId]);
  const { isOwner, hasPermission, userProfile } = useAuth();
  const { lang, isEn, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter || 'ALL');
  // "project:<id>" vem do painel: mostra só esse projeto até o utilizador mudar de filtro ou pedir "Ver todos"
  const focusFrom = (v?: string) => (v && v.startsWith('project:') ? v.slice('project:'.length) : null);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter && !focusFrom(initialStatusFilter) ? initialStatusFilter : 'ALL');
  const [focusId, setFocusId] = useState<string | null>(focusFrom(initialStatusFilter));
  const [assumingProjectId, setAssumingProjectId] = useState<string | null>(null);

  // Sync filters whenever initialStatusFilter prop changes (e.g. clicking dashboard KPIs)
  React.useEffect(() => {
    if (!initialStatusFilter) return;
    const id = focusFrom(initialStatusFilter);
    setFocusId(id);
    setStatusFilter(id ? 'ALL' : initialStatusFilter);
  }, [initialStatusFilter]);

  const pickStatus = (value: string) => { setFocusId(null); setStatusFilter(value); };

  const canCreate = isOwner || hasPermission('projects.create');
  const canEdit = isOwner || hasPermission('projects.edit');
  const canDelete = isOwner || hasPermission('projects.delete');
  const canAssume = hasPermission('projects.assume');

  const clientMap = new Map<string, Client>(clients.map((c) => [c.id, c]));
  const focusProject = focusId ? projects.find((p) => p.id === focusId) : undefined;

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (focusProject) return p.id === focusProject.id;

    // Currency filter
    if (currencyFilter !== 'ALL' && p.currency !== currencyFilter) return false;

    // Arquivados só aparecem no filtro "Arquivados"
    if (statusFilter === 'arquivados') return Boolean(p.archived);
    if (p.archived) return false;

    // Assignment & Status filter
    if (statusFilter === 'MINE') {
      if (p.assignedTo !== userProfile?.id) return false;
    } else if (statusFilter === 'AVAILABLE') {
      if (p.assignmentType !== 'available') return false;
    } else if (statusFilter === 'ativos') {
      if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
    } else if (statusFilter === 'atencao') {
      if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
      const days = getDaysDiff(p.dueDate);
      if (p.status !== 'Aguardando cliente' && (!p.dueDate || days > 1)) return false;
    } else if (statusFilter === 'a-receber') {
      if (p.totalAmount - p.paidAmount <= 0) return false;
    } else if (
      statusFilter !== 'ALL' &&
      statusFilter !== 'ativos' &&
      statusFilter !== 'atencao' &&
      statusFilter !== 'a-receber' &&
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
      const clientName = client?.name?.toLowerCase() || '';
      const clientCompany = client?.company?.toLowerCase() || '';
      const projName = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
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
        toast({ tone: 'danger', title: res.error || (isEn ? 'Could not take on the project.' : 'Não foi possível assumir o projeto.') });
      }
    } finally {
      setAssumingProjectId(null);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Em andamento':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-info-soft text-blue-800 border border-blue-200/60 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {getProjectStatusLabel('Em andamento', lang)}
          </span>
        );
      case 'Aguardando cliente':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-warning-soft text-warning-fg border border-amber-200/60 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {getProjectStatusLabel('Aguardando cliente', lang)}
          </span>
        );
      case 'Concluído':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-success-soft text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {getProjectStatusLabel('Concluído', lang)}
          </span>
        );
      case 'Cancelado':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-danger-soft text-rose-800 border border-rose-200/60 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {getProjectStatusLabel('Cancelado', lang)}
          </span>
        );
    }
  };

  const availableCount = projects.filter(p => p.assignmentType === 'available').length;
  const myProjectsCount = projects.filter(p => p.assignedTo === userProfile?.id).length;

  // Unique categories for filtering (dynamic + presets + project categories)
  const defaultProjectPresets = ['Website', 'Landing Page', 'Loja Virtual', 'Tráfego Pago', 'Automação', 'Consultoria', 'Design'];
  const allProjectCategories = Array.from(
    new Set([
      ...(categories || []).filter(c => c?.name && c.type !== 'expense').map(c => c.name),
      ...defaultProjectPresets,
      ...projects.map(p => p.category).filter(Boolean),
    ])
  );

  const openProject = openProjectId ? projects.find((p) => p.id === openProjectId) : undefined;
  if (openProject) {
    return (
      <ProjectDetailView
        project={openProject}
        clients={clients}
        incomes={incomes}
        tasks={tasks}
        agendaEvents={agendaEvents}
        isEn={isEn}
        canEdit={canEdit}
        canViewFinancials={isOwner || hasPermission('financial.view')}
        onBack={() => setOpenProjectId(null)}
        onEdit={onEditProject}
        onOpenWhatsApp={onOpenWhatsAppCharge}
        allProjects={projects}
        onOpenProject={setOpenProjectId}
        onLink={canCreate ? onLinkProject : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">{t('projects.title')}</h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {t('projects.subtitle')}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewProjectModal}
            className="aura-btn aura-btn--primary inline-flex shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('projects.newProject')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-glass border border-line-subtle rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setFocusId(null); setSearchTerm(e.target.value); }}
              placeholder={isEn ? "Search by project, client or service..." : "Pesquisar por projeto, cliente ou serviço..."}
              className="w-full bg-surface-2 border border-line-subtle rounded-full pl-10 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => { setFocusId(null); setCategoryFilter(e.target.value); }}
              className="w-full sm:w-48 bg-surface-2 border border-line-subtle rounded-full px-4 py-2 text-xs font-medium text-fg focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">{t('projects.allCategories')}</option>
              {allProjectCategories.map(cat => (
                <option key={cat} value={cat}>
                  ● {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Scope Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => pickStatus('ALL')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'ALL' && !focusProject
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {isEn ? 'All' : 'Todos'} ({projects.length})
          </button>

          {myProjectsCount > 0 && (
            <button
              onClick={() => pickStatus('MINE')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 statusFilter === 'MINE'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isEn ? 'My Projects' : 'Meus Projetos'} ({myProjectsCount})</span>
            </button>
          )}

          {availableCount > 0 && (
            <button
              onClick={() => pickStatus('AVAILABLE')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 statusFilter === 'AVAILABLE'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'bg-info-soft text-blue-800 hover:opacity-85'
 }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isEn ? 'Available to Take On' : 'Disponíveis para Assumir'} ({availableCount})</span>
            </button>
          )}

          <button
            onClick={() => pickStatus('ativos')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'ativos'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {isEn ? 'Active' : 'Ativos'}
          </button>

          <button
            onClick={() => pickStatus('a-receber')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'a-receber'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {isEn ? 'Receivable' : 'A receber'} ({projects.filter((p) => !p.archived && p.totalAmount - p.paidAmount > 0).length})
          </button>

          {projects.some((p) => p.archived) && (
          <button
            onClick={() => pickStatus('arquivados')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'arquivados' ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs' : 'text-fg-secondary hover:bg-sunken '
            }`}
          >
            {isEn ? 'Archived' : 'Arquivados'} ({projects.filter((p) => p.archived).length})
          </button>
          )}

          <button
            onClick={() => pickStatus('atencao')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'atencao'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-warning-fg hover:bg-warning-soft '
 }`}
          >
            {isEn ? 'Deadlines and alerts' : 'Prazos e alertas'}
          </button>

          <button
            onClick={() => pickStatus('Em andamento')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'Em andamento'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {getProjectStatusLabel('Em andamento', lang)}
          </button>

          <button
            onClick={() => pickStatus('Aguardando cliente')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'Aguardando cliente'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {getProjectStatusLabel('Aguardando cliente', lang)}
          </button>

          <button
            onClick={() => pickStatus('Concluído')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
 statusFilter === 'Concluído'
 ? 'bg-primary shadow-primary-3d text-primary-fg shadow-xs'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
          >
            {getProjectStatusLabel('Concluído', lang)}
          </button>
        </div>
      </div>

      {focusProject && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-subtle bg-glass px-4 py-3 shadow-sm">
          <span className="text-sm text-fg-secondary">
            {isEn ? 'Showing project' : 'A mostrar o projeto'} <strong className="font-semibold text-fg">{focusProject.name}</strong>
          </span>
          <button type="button" onClick={() => setFocusId(null)} className="aura-btn aura-btn--secondary aura-btn--sm">
            {isEn ? 'Show all projects' : 'Ver todos os projetos'}
          </button>
        </div>
      )}

      {/* Projects List Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center shadow-sm">
          <FolderKanban className="w-12 h-12 text-fg-muted mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-bold text-fg ">{t('projects.empty')}</h3>
          <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? (isEn ? 'Try changing the filters or search term above.' : 'Tente alterar os filtros ou termo de busca acima.')
              : (isEn ? 'Start by adding your first operational project.' : 'Comece adicionando seu primeiro projeto operacional.')}
          </p>
          {canCreate && (
            <button
              onClick={onOpenNewProjectModal}
              className="aura-btn aura-btn--primary aura-btn--sm mt-4 inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Create Project' : 'Criar Projeto'}</span>
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
            const isUrgent = !!p.dueDate && daysToDue <= 2 && p.status !== 'Concluído' && p.status !== 'Cancelado' && p.status !== 'Aguardando cliente';

            const isAssignedToMe = p.assignedTo === userProfile?.id;
            const isAvailable = p.assignmentType === 'available';

            const catItem = (categories || []).find(c => c?.name && c.name.toLowerCase() === p.category?.toLowerCase());
            const catColor = catItem?.color || '#0050d7';

            return (
              <div
                key={p.id}
                className={`bg-glass border rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
 isAvailable
 ? 'border-fg/40 ring-2 ring-black/10'
 : isUrgent
 ? 'border-rose-200 '
 : 'border-line-subtle '
 }`}
              >
                <div>
                  {/* Top Bar: Category, Status, Responsible Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold"
                      style={
                        catItem
                          ? {
                              backgroundColor: `${catColor}15`,
                              color: catColor,
                              border: `1px solid ${catColor}30`,
                            }
                          : {
                              backgroundColor: '#f4f5f7',
                              color: '#444747',
                              border: '1px solid #e5e7eb',
                            }
                      }
                    >
                      {p.category}
                    </span>
                    {p.billingType && p.billingType !== 'unico' && (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-soft text-accent-soft-fg" title={isEn ? 'Recurring project: a charge is created each period' : 'Projeto recorrente: é criada uma cobrança em cada período'}>
                        {isEn ? BILLING_TYPE_LABELS[p.billingType].en : BILLING_TYPE_LABELS[p.billingType].pt} · {formatCurrency(p.recurringAmount || 0, p.currency)}/{BILLING_TYPE_LABELS[p.billingType].period}
                      </span>
                    )}
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Responsible / Assignment Banner */}
                  <div className="mb-3">
                    {isAvailable ? (
                      <div className="bg-info-soft border border-blue-200/60 p-2.5 rounded-lg flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          {isEn ? 'Available Project' : 'Projeto Disponível'}
                        </span>
                        {canAssume && (
                          <button
                            onClick={() => handleAssume(p.id)}
                            disabled={assumingProjectId === p.id}
                            className="aura-btn aura-btn--primary aura-btn--sm inline-flex disabled:opacity-50"
                          >
                            {assumingProjectId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Hand className="w-3 h-3" />
                            )}
                            <span>{isEn ? 'Take on' : 'Assumir'}</span>
                          </button>
                        )}
                      </div>
                    ) : p.assignmentType === 'employee' ? (
                      <div className="inline-flex items-center space-x-1.5 text-xs text-fg-secondary bg-surface-2 border border-line-subtle px-2.5 py-1 rounded-full font-medium">
                        <User className="w-3.5 h-3.5 text-fg-muted" />
                        <span>
                          {p.assignedToName || (isEn ? 'Employee' : 'Funcionário')} {isAssignedToMe && (isEn ? '(You)' : '(Tu)')}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 text-xs text-fg-muted bg-surface-2 border border-line-subtle px-2.5 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Company' : 'Empresa'}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-fg tracking-tight leading-snug m-0">
                    <button type="button" onClick={() => setOpenProjectId(p.id)} className="text-left hover:underline underline-offset-2 cursor-pointer" title={isEn ? 'Open project' : 'Abrir projeto'}>
                      {p.name}
                    </button>
                  </h3>

                  <div className="flex items-center justify-between mt-1.5 mb-3">
                    <div className="flex items-start space-x-1.5 text-xs text-fg-muted ">
                      <Building2 className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" />
                      <div>
                        {linkedClients.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-fg font-medium">
                              {linkedClients.map((c) => c?.name || '').filter(Boolean).join(' & ')}
                            </strong>
                            <span className="px-1.5 py-0.5 rounded-full bg-info-soft text-blue-800 text-[10px] font-semibold">
                              {linkedClients.length} {isEn ? 'Clients' : 'Clientes'}
                            </span>
                          </div>
                        ) : (
                          <span>
                            <strong className="text-fg font-medium">{primaryClient?.name || (isEn ? 'Client not found' : 'Cliente não encontrado')}</strong>
                            {primaryClient?.company && (
                              <span className="text-fg-muted ml-1">({primaryClient.company})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Bar */}
                  <div className="flex items-center space-x-1 mb-4 bg-surface-2 border border-line-subtle px-2.5 py-1 rounded-full w-fit">
                    <span className="text-[11px] text-fg-muted font-medium mr-1">{isEn ? 'Rating:' : 'Avaliação:'}</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRateProject?.(p, p.rating === star ? 0 : star);
                        }}
                        className="p-0.5 transition-transform hover:scale-125 cursor-pointer"
                        title={isEn ? `Rate as ${star} star(s)` : `Classificar como ${star} estrela(s)`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
 (p.rating || 0) >= star
 ? 'fill-[#000000] text-fg '
 : 'text-gray-300 hover:text-fg '
 }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Financial Breakdown Card (hidden for employee without financial view) */}
                  {(isOwner || hasPermission('financial.view')) && (
                    <div className="bg-surface-2 p-4 rounded-lg border border-line-subtle mb-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-fg-muted ">{isEn ? 'Total amount:' : 'Valor total:'}</span>
                        <strong className="text-fg font-bold text-sm">
                          {formatCurrency(p.totalAmount, p.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-fg-muted ">{isEn ? 'Paid:' : 'Já pago:'}</span>
                        <strong className="text-success-fg font-semibold">
                          {formatCurrency(p.paidAmount, p.currency)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-line-subtle ">
                        <span className="text-fg-muted ">{isEn ? 'Remaining:' : 'Em falta:'}</span>
                        <strong className={`font-semibold ${remaining > 0 ? 'text-warning-fg ' : 'text-fg-muted '}`}>
                          {formatCurrency(remaining, p.currency)}
                        </strong>
                      </div>

                      <div className="pt-1.5">
                        <div className="w-full bg-surface-3 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-600' : 'bg-primary shadow-primary-3d '}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-fg-muted text-right mt-1 font-medium">
                          {progressPct}% {isEn ? 'settled' : 'liquidado'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates Details */}
                  <div className="space-y-2 text-xs text-fg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-fg-muted ">
                        <Calendar className="w-3.5 h-3.5 text-fg-muted " /> {isEn ? 'Expected delivery:' : 'Entrega prevista:'}
                      </span>
                      <strong className={isUrgent ? 'text-danger-fg font-semibold' : 'text-fg font-medium'}>
                        {p.dueDate ? formatDate(p.dueDate) : (isEn ? 'No date set' : 'Data indefinida')}
                        {!p.dueDate || p.status === 'Concluído' || p.status === 'Cancelado' ? '' : daysToDue >= 0 ? ` (${isEn ? `in ${daysToDue}d` : `em ${daysToDue}d`})` : ` (${isEn ? `overdue ${Math.abs(daysToDue)}d` : `atrasado ${Math.abs(daysToDue)}d`})`}
                      </strong>
                    </div>

                    {p.nextPaymentDate && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-fg-muted ">
                          <Clock className="w-3.5 h-3.5 text-fg-muted " /> {isEn ? 'Next Payment:' : 'Próx. Pagamento:'}
                        </span>
                        <strong className="text-fg font-medium">{formatDate(p.nextPaymentDate)}</strong>
                      </div>
                    )}

                    {p.partnerName && (
                      <div className="flex items-center justify-between pt-1 border-t border-line-subtle text-[11px]">
                        <span className="text-fg-muted ">{isEn ? 'Referring Partner:' : 'Parceiro Indicador:'}</span>
                        <span className="text-fg font-medium">{p.partnerName}</span>
                      </div>
                    )}
                  </div>

                  {/* File Attachments Pills */}
                  {p.attachments && p.attachments.length > 0 && (
                    <div className="mb-4 pt-2 border-t border-line-subtle ">
                      <div className="flex items-center space-x-1.5 mb-2 text-[13px] font-medium text-fg-secondary ">
                        <Paperclip className="w-3.5 h-3.5 text-fg-muted " />
                        <span>{isEn ? 'Attached Files' : 'Ficheiros Anexados'} ({p.attachments.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            download={att.name}
                            className="aura-btn aura-btn--secondary aura-btn--sm inline-flex"
                            title={`${isEn ? 'Download' : 'Descarregar'} ${att.name}`}
                          >
                            <FileText className="w-3 h-3 text-accent-soft-fg " />
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <Download className="w-3 h-3 text-fg-muted " />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.notes && (
                    <button type="button" onClick={() => setOpenProjectId(p.id)} className="w-full text-left p-3 bg-surface-2 rounded-md border border-line-subtle text-[12.5px] leading-relaxed text-fg-secondary mb-1 whitespace-pre-line cursor-pointer hover:border-line-strong transition-colors">
                      <span className="line-clamp-3">{markdownToPlain(p.notes)}</span>
                    </button>
                  )}
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <button type="button" onClick={() => setOpenProjectId(p.id)} className="text-[12px] font-semibold text-accent-soft-fg hover:underline cursor-pointer">
                      {isEn ? 'View full project →' : 'Ver projeto completo →'}
                    </button>
                    {canCreate && onLinkProject && (
                      <button type="button" onClick={() => onLinkProject(p)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent-soft-fg hover:underline cursor-pointer" title={isEn ? 'Create a new project linked to this one' : 'Criar um projeto novo vinculado a este'}>
                        <Link2 className="w-3.5 h-3.5" /> {isEn ? 'Link new project' : 'Vincular novo projeto'}
                      </button>
                    )}
                    {p.parentProjectId && (() => { const par = projects.find((x) => x.id === p.parentProjectId); return par ? (
                      <button type="button" onClick={() => setOpenProjectId(par.id)} className="text-[11px] text-fg-muted hover:underline cursor-pointer truncate max-w-full" title={par.name}>↳ {isEn ? 'from' : 'de'} {par.name}</button>
                    ) : null; })()}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-line-subtle flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => onEditProject(p)}
                        className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Edit Project' : 'Editar Projeto'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canCreate && onDuplicateProject && (
                      <button
                        onClick={() => onDuplicateProject(p)}
                        className="p-1.5 text-fg-muted hover:text-accent-soft-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Duplicate Recurring Project (New Month)' : 'Replicar Projeto Recorrente (Novo Mês)'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    {canCreate && onToggleArchiveProject && (
                      <button
                        onClick={() => onToggleArchiveProject(p)}
                        className="p-1.5 text-fg-muted hover:text-accent-soft-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                        title={p.archived ? (isEn ? 'Unarchive project' : 'Desarquivar projeto') : (isEn ? 'Archive project (leaves receivables and alerts)' : 'Arquivar projeto (sai do valor a receber e dos alertas)')}
                      >
                        {p.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Delete Project' : 'Eliminar Projeto'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {onOpenStripeInvoiceModal && remaining > 0 && (isOwner || hasPermission('financial.edit')) && (
                      <button
                        onClick={() => onOpenStripeInvoiceModal(p)}
                        className="px-3 py-1.5 bg-surface-2 hover:bg-[#eceef2] text-[#635bff] border border-line-subtle rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                        title={isEn ? 'Generate Stripe invoice with automatic payment link' : 'Gerar fatura Stripe com link de pagamento automático'}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Stripe Invoice' : 'Fatura Stripe'}</span>
                      </button>
                    )}

                    {onMarkProjectAsPaid && remaining > 0 && (isOwner || hasPermission('financial.edit')) && (
                      <button
                        onClick={() => onMarkProjectAsPaid(p)}
                        className="px-3 py-1.5 bg-success-soft hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                        title={isEn ? 'Mark project as 100% paid and settle revenue' : 'Marcar projeto como 100% pago e liquidar receita'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Mark as Paid' : 'Marcar como Pago'}</span>
                      </button>
                    )}

                    {client?.whatsapp && remaining > 0 && (
                      <button
                        onClick={() => {
                          const clientName = client?.name || '';
                          const projName = p?.name || '';
                          const msg = isEn
                            ? `Hello, ${clientName}! Quick update regarding project "${projName}". The outstanding balance is ${formatCurrency(remaining, p.currency)}. Due date: ${p.nextPaymentDate ? formatDate(p.nextPaymentDate) : formatDate(p.dueDate)}. Thank you!`
                            : `Olá, ${clientName}! Tudo bem? Gostaria de atualizar sobre o projeto "${projName}". O valor restante pendente é de ${formatCurrency(remaining, p.currency)}. Próximo vencimento: ${p.nextPaymentDate ? formatDate(p.nextPaymentDate) : formatDate(p.dueDate)}. Obrigado!`;
                          onOpenWhatsAppCharge(client.whatsapp, msg);
                        }}
                        className="px-3.5 py-1.5 bg-warning-soft hover:bg-amber-100 text-warning-fg border border-amber-200/60 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Charge' : 'Cobrar'}</span>
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
