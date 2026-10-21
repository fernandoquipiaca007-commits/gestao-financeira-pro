import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Mail,
  Building2,
  FolderKanban,
  DollarSign,
  Edit3,
  Trash2,
  Calendar,
  ExternalLink,
  Filter,
  Globe,
  Star,
  BellRing,
} from 'lucide-react';
import { ClientFollowUpPanel, stageInfo, todayISO } from './clients/ClientFollowUpPanel';
import { PipelineStage, Client, Project, Income, CurrencyCode, CountryCode, COUNTRIES, CURRENCIES, DEFAULT_CLIENT_NICHES } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../lib/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  currencyFilter: CurrencyCode | 'ALL';
  onOpenNewClientModal: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  projects,
  incomes,
  currencyFilter,
  onOpenNewClientModal,
  onEditClient,
  onDeleteClient,
  onOpenWhatsAppCharge,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { isOwner, hasPermission, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  // Fase do funil: 'ALL', uma fase, 'FAV' (preferidas) ou 'DUE' (contactar hoje / em atraso)
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'ALL' | 'FAV' | 'DUE'>('ALL');
  const today = todayISO();

  const canCreate = isOwner || hasPermission('clients.create');
  const canEdit = isOwner || hasPermission('clients.edit');
  const canDelete = isOwner || hasPermission('clients.delete');
  const canViewFinancials = isOwner || hasPermission('financial.view');

  const allClientCategories = useMemo(() => {
    const set = new Set<string>();
    // Predefined popular niches
    (DEFAULT_CLIENT_NICHES as readonly string[]).forEach((n) => set.add(n));
    // Any existing categories from clients
    clients.forEach((c) => {
      if (c.type && c.type.trim()) set.add(c.type.trim());
    });
    return Array.from(set);
  }, [clients]);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    // Currency filter
    if (currencyFilter !== 'ALL' && c.currency !== currencyFilter) return false;

    // Type filter
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;

    // Funil comercial
    if (stageFilter === 'FAV' && !c.isFavorite) return false;
    if (stageFilter === 'DUE' && !(c.nextContactDate && c.nextContactDate <= today)) return false;
    if (stageFilter !== 'ALL' && stageFilter !== 'FAV' && stageFilter !== 'DUE' && c.pipelineStage !== stageFilter) return false;

    // Scope check: if user is employee with ASSIGNED scope, check if they have a project for this client
    if (!isOwner && !hasPermission('clients.view', 'ALL')) {
      const hasAssignedProject = projects.some(
        p => (p.clientId === c.id || p.clientIds?.includes(c.id)) && p.assignedTo === userProfile?.id
      );
      if (!hasAssignedProject) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const company = (c.company || '').toLowerCase();
      const email = c.email?.toLowerCase() || '';
      const phone = c.whatsapp?.toLowerCase() || '';
      const notes = c.notes?.toLowerCase() || '';
      return (
        name.includes(q) ||
        company.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        notes.includes(q)
      );
    }

    return true;
  }).sort((a, b) => {
    // Primeiro quem tem contacto marcado (mais cedo primeiro), depois as preferidas, depois o nome.
    const da = a.nextContactDate || '9999', dbb = b.nextContactDate || '9999';
    if (da !== dbb) return da.localeCompare(dbb);
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) return a.isFavorite ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const popularPills = [
    { key: 'ALL', label: isEn ? 'All' : 'Todos' },
    { key: 'Tráfego Pago', label: isEn ? 'Paid Traffic' : 'Tráfego Pago' },
    { key: 'Desenvolvimento', label: isEn ? 'Development' : 'Desenvolvimento' },
    { key: 'Consultoria', label: isEn ? 'Consulting' : 'Consultoria' },
    { key: 'Design & Branding', label: isEn ? 'Design & Branding' : 'Design & Branding' },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
            {isEn ? 'Clients' : 'Clientes'}
          </h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
            {isEn ? 'Contacts, terms and what each client owes.' : 'Contactos, condições e o que cada cliente deve.'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewClientModal}
            className="aura-btn aura-btn--primary inline-flex shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'New client' : 'Novo cliente'}</span>
          </button>
        )}
      </div>

      <ClientFollowUpPanel clients={clients} isEn={isEn} active={stageFilter} onSelect={setStageFilter} onOpenClient={canEdit ? onEditClient : undefined} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-glass border border-line-subtle p-4 rounded-xl shadow-glass">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by name, company, or WhatsApp...' : 'Buscar por nome, empresa ou WhatsApp...'}
            className="w-full bg-surface-2 border border-line-subtle rounded-full pl-10 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>

        {/* Service Type Filter: Quick Pills + Dropdown for all professions */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs flex-wrap sm:flex-nowrap gap-y-2">
          {popularPills.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
 typeFilter === tab.key
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'text-fg-secondary hover:bg-sunken '
 }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Complete Professions / Niches Dropdown */}
          <div className="relative shrink-0">
            <select
              value={popularPills.some(p => p.key === typeFilter) ? '' : typeFilter}
              onChange={(e) => {
                if (e.target.value) setTypeFilter(e.target.value);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border border-line-subtle cursor-pointer focus:outline-none transition-all ${
 !popularPills.some(p => p.key === typeFilter) && typeFilter !== 'ALL'
 ? 'bg-primary shadow-primary-3d text-primary-fg border-black'
 : 'bg-surface-2 text-fg hover:bg-surface-3 '
 }`}
            >
              <option value="" className="bg-glass-strong text-fg ">
                {!popularPills.some(p => p.key === typeFilter) && typeFilter !== 'ALL'
                  ? (isEn ? `Niche: ${typeFilter}` : `Nicho: ${typeFilter}`)
                  : (isEn ? 'More Niches / Professions ▾' : 'Mais Nichos / Profissões ▾')}
              </option>
              {allClientCategories
                .filter((cat) => !popularPills.some(p => p.key === cat) && cat !== 'Outro')
                .map((cat) => (
                  <option key={cat} value={cat} className="bg-glass-strong text-fg ">
                    {cat}
                  </option>
                ))}
              <option value="Outro" className="bg-glass-strong text-fg ">
                {isEn ? 'Other' : 'Outro'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center shadow-glass">
          <Users className="w-12 h-12 text-fg-disabled mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-fg ">
            {isEn ? 'No clients found' : 'Nenhum cliente encontrado'}
          </h3>
          <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL'
              ? (isEn ? 'Try adjusting filters or search terms.' : 'Tente ajustar os filtros ou termos de pesquisa.')
              : (isEn ? 'Start by adding your first clients to your database.' : 'Comece adicionando os primeiros clientes à sua base.')}
          </p>
          {canCreate && (
            <button
              onClick={onOpenNewClientModal}
              className="aura-btn aura-btn--primary aura-btn--sm mt-4 inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Create Client' : 'Criar Cliente'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((c) => {
            const rawCountry = (c.country || 'BR').trim().toUpperCase();
            const countryCode: CountryCode = rawCountry === 'BRASIL' || rawCountry === 'BRAZIL' ? 'BR'
              : rawCountry === 'ANGOLA' ? 'AO'
              : rawCountry === 'PORTUGAL' ? 'PT'
              : rawCountry === 'ESTADOS UNIDOS' || rawCountry === 'USA' || rawCountry === 'US' ? 'US'
              : (rawCountry in COUNTRIES ? (rawCountry as CountryCode) : 'OTHER');
            const clientCountry = COUNTRIES[countryCode] || COUNTRIES['BR'];
            const clientCurrency = CURRENCIES[c.currency] || CURRENCIES['BRL'] || Object.values(CURRENCIES)[0];

            // Projects of this client
            const clientProjects = projects.filter(
              (p) => p.clientId === c.id || p.clientIds?.includes(c.id)
            );
            const projectsCount = clientProjects.length;

            // Financial stats of this client
            const clientIncomes = incomes.filter((i) => i.clientId === c.id);
            const totalPaid = clientIncomes
              .filter((i) => i.status === 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);

            const totalOwed = clientIncomes
              .filter((i) => i.status !== 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);

            // Last payment date
            const lastPaymentDate = clientIncomes
              .filter((i) => i.status === 'Recebido' && i.receivedDate)
              .sort((a, b) => (b.receivedDate || '').localeCompare(a.receivedDate || ''))[0]?.receivedDate;

            return (
              <div
                key={c.id}
                className="bg-glass border border-line-subtle rounded-xl p-5 shadow-glass hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Country Flag & Service Type Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted bg-surface-2 px-2.5 py-1 rounded-full">
                      <Globe className="w-3.5 h-3.5 text-fg-muted " />
                      <span>{clientCountry?.name || c.country || 'Brasil'}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent-soft-fg ">
                      {c.type}
                    </span>
                  </div>

                  {/* Client Name & Company */}
                  <h3 className="text-base font-semibold text-fg tracking-tight leading-snug group-hover:text-accent-soft-fg transition-colors flex items-center gap-1.5">
                    {c.isFavorite && <Star className="w-4 h-4 text-warning-fg shrink-0" fill="currentColor" aria-label={isEn ? 'Favourite' : 'Preferida'} />}
                    <span>{c.name || (isEn ? 'Unnamed Client' : 'Cliente')}</span>
                  </h3>
                  {(c.pipelineStage || c.rating || c.contractType) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {c.pipelineStage && <span className={stageInfo(c.pipelineStage).cls}>{isEn ? stageInfo(c.pipelineStage).en : stageInfo(c.pipelineStage).pt}</span>}
                      {c.rating ? <span className="text-warning-fg tracking-tight" title={`${c.rating}/5`}>{'★'.repeat(c.rating)}</span> : null}
                      {c.contractType && <span className="text-fg-secondary">{c.contractType}</span>}
                    </div>
                  )}
                  {(c.nextContactDate || c.nextAction) && (
                    <div className={`mt-2 flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] ${c.nextContactDate && c.nextContactDate <= today ? 'bg-warning-soft text-warning-fg' : 'bg-surface-2 text-fg-secondary'}`}>
                      <BellRing className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {c.nextContactDate && <strong className="font-semibold">{c.nextContactDate < today ? (isEn ? 'Overdue · ' : 'Em atraso · ') : c.nextContactDate === today ? (isEn ? 'Today · ' : 'Hoje · ') : `${formatDate(c.nextContactDate)} · `}</strong>}
                        {c.nextAction || (isEn ? 'Get in touch' : 'Entrar em contacto')}
                      </span>
                    </div>
                  )}
                  {c.summary && <p className="mt-2 mb-0 text-[12px] leading-relaxed text-fg-secondary line-clamp-3" title={c.summary}>{c.summary}</p>}
                  {c.company && (
                    <p className="text-xs text-fg-muted flex items-center gap-1 mt-0.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-fg-muted " />
                      <span>{c.company}</span>
                    </p>
                  )}

                  {(c.contactName || c.city || (c.tags && c.tags.length > 0)) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {c.contactName && <span className="text-[12px] text-fg-secondary">{c.contactName}{c.contactRole ? ` · ${c.contactRole}` : ''}</span>}
                      {c.city && <span className="aura-badge !font-medium">{c.city}</span>}
                      {(c.tags || []).slice(0, 3).map((tag) => <span key={tag} className="aura-badge aura-badge--accent !font-medium">{tag}</span>)}
                    </div>
                  )}

                  {/* Contact Info Pills */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-fg-muted ">
                    {c.whatsapp && (
                      <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5 rounded-md border border-line-subtle ">
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-success-fg " />
                          <span className="font-mono text-fg ">{c.whatsapp}</span>
                        </span>
                        <button
                          onClick={() => {
                            const text = isEn ? `Hello, ${c?.name || ''}! How are you?` : `Olá, ${c?.name || ''}! Tudo bem?`;
                            onOpenWhatsAppCharge(c.whatsapp, text);
                          }}
                          className="text-[11px] font-semibold text-success-fg hover:underline cursor-pointer"
                        >
                          {isEn ? 'Chat' : 'Conversar'}
                        </button>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center space-x-1.5 px-1 text-[11px]">
                        <Mail className="w-3 h-3 text-fg-muted " />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Projects and Financial Summary */}
                  <div className="bg-surface-2 p-4 rounded-lg border border-line-subtle my-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-fg-secondary " /> {isEn ? 'Projects:' : 'Projetos:'}
                      </span>
                      <strong className="text-fg font-semibold">
                        {projectsCount} {projectsCount === 1 ? (isEn ? 'project' : 'projeto') : (isEn ? 'projects' : 'projetos')}
                      </strong>
                    </div>

                    {canViewFinancials && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-success-fg " /> {isEn ? 'Already paid:' : 'Já pagou:'}
                          </span>
                          <strong className="text-success-fg font-semibold">
                            {formatCurrency(totalPaid, c.currency)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-danger-fg " /> {isEn ? 'Still owes:' : 'Ainda deve:'}
                          </span>
                          <strong className={totalOwed > 0 ? 'text-danger-fg font-semibold' : 'text-fg-muted '}>
                            {formatCurrency(totalOwed, c.currency)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-line-subtle ">
                          <span className="text-fg-muted flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-fg-muted " /> {isEn ? 'Last payment:' : 'Último pagamento:'}
                          </span>
                          <span className="text-fg font-medium">
                            {lastPaymentDate ? formatDate(lastPaymentDate) : '—'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-line-subtle flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => onEditClient(c)}
                        className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Edit Client' : 'Editar Cliente'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteClient(c.id)}
                        className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Delete Client' : 'Eliminar Cliente'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {c.whatsapp && (
                    <button
                      onClick={() => {
                        const text = isEn ? `Hello, ${c?.name || ''}! How are you?` : `Olá, ${c?.name || ''}! Tudo bem?`;
                        onOpenWhatsAppCharge(c.whatsapp, text);
                      }}
                      className="px-3.5 py-1.5 bg-success-soft hover:opacity-85 text-success-fg rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Message' : 'Mensagem'}</span>
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
