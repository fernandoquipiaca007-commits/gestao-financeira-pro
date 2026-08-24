import React, { useState } from 'react';
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
} from 'lucide-react';
import { Client, Project, Income, CurrencyCode, COUNTRIES, CURRENCIES } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../lib/formatters';
import { useAuth } from '../contexts/AuthContext';

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
  const { isOwner, hasPermission, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const canCreate = isOwner || hasPermission('clients.create');
  const canEdit = isOwner || hasPermission('clients.edit');
  const canDelete = isOwner || hasPermission('clients.delete');
  const canViewFinancials = isOwner || hasPermission('financial.view');

  // Filter clients
  const filteredClients = clients.filter((c) => {
    // Currency filter
    if (currencyFilter !== 'ALL' && c.currency !== currencyFilter) return false;

    // Type filter
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;

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
      const name = c.name.toLowerCase();
      const company = c.company.toLowerCase();
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
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1b1b] tracking-tight">Clientes &amp; Contas</h1>
          <p className="text-sm text-[#747878] mt-1">
            Gestão da carteira de clientes, contactos e saldos pendentes
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewClientModal}
            className="inline-flex items-center space-x-2 bg-[#000000] hover:opacity-85 text-white px-5 py-2.5 rounded-[29px] text-sm font-medium transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, empresa ou WhatsApp..."
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-10 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Service Type Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'Tráfego Pago', 'Desenvolvimento', 'Consultoria', 'Outro'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer shrink-0 ${
                typeFilter === type
                  ? 'bg-[#000000] text-white'
                  : 'text-[#444747] hover:bg-[#f1edec]'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <Users className="w-12 h-12 text-[#c4c7c7] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-[#1c1b1b]">Nenhum cliente encontrado</h3>
          <p className="text-xs text-[#747878] mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL'
              ? 'Tente ajustar os filtros ou termos de pesquisa.'
              : 'Comece adicionando os primeiros clientes à sua base.'}
          </p>
          {canCreate && (
            <button
              onClick={onOpenNewClientModal}
              className="mt-4 inline-flex items-center space-x-2 bg-[#000000] text-white px-5 py-2.5 rounded-[29px] text-xs font-medium hover:opacity-85 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((c) => {
            const clientCountry = COUNTRIES[c.country || 'BR'];
            const clientCurrency = CURRENCIES[c.currency];

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
                className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Country Flag & Service Type Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[#747878] bg-[#f1edec] px-2.5 py-1 rounded-full">
                      <span>{clientCountry.flag}</span>
                      <span>{clientCountry.name}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dbe1ff] text-[#003da9]">
                      {c.type}
                    </span>
                  </div>

                  {/* Client Name & Company */}
                  <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight leading-snug group-hover:text-[#0050d7] transition-colors">
                    {c.name}
                  </h3>
                  {c.company && (
                    <p className="text-xs text-[#747878] flex items-center gap-1 mt-0.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#747878]" />
                      <span>{c.company}</span>
                    </p>
                  )}

                  {/* Contact Info Pills */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-[#747878]">
                    {c.whatsapp && (
                      <div className="flex items-center justify-between bg-[#f7f3f2] px-3 py-1.5 rounded-xl border border-[#c4c7c7]/30">
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-[#1a6b3a]" />
                          <span className="font-mono text-[#1c1b1b]">{c.whatsapp}</span>
                        </span>
                        <button
                          onClick={() => {
                            const text = `Olá, ${c.name}! Tudo bem?`;
                            onOpenWhatsAppCharge(c.whatsapp, text);
                          }}
                          className="text-[11px] font-semibold text-[#1a6b3a] hover:underline cursor-pointer"
                        >
                          Conversar
                        </button>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center space-x-1.5 px-1 text-[11px]">
                        <Mail className="w-3 h-3 text-[#747878]" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Projects and Financial Summary */}
                  <div className="bg-[#f7f3f2] p-4 rounded-[16px] border border-[#c4c7c7]/30 my-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#747878] flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-[#444747]" /> Projetos:
                      </span>
                      <strong className="text-[#1c1b1b] font-semibold">{projectsCount} projeto(s)</strong>
                    </div>

                    {canViewFinancials && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#747878] flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-[#1a6b3a]" /> Já pagou:
                          </span>
                          <strong className="text-[#1a6b3a] font-semibold">
                            {formatCurrency(totalPaid, c.currency)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#747878] flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-[#ba1a1a]" /> Ainda deve:
                          </span>
                          <strong className={totalOwed > 0 ? 'text-[#ba1a1a] font-semibold' : 'text-[#747878]'}>
                            {formatCurrency(totalOwed, c.currency)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-[#c4c7c7]/30">
                          <span className="text-[#747878] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#747878]" /> Último pagamento:
                          </span>
                          <span className="text-[#1c1b1b] font-medium">
                            {lastPaymentDate ? formatDate(lastPaymentDate) : '—'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => onEditClient(c)}
                        className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteClient(c.id)}
                        className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {c.whatsapp && (
                    <button
                      onClick={() => {
                        const text = `Olá, ${c.name}! Tudo bem?`;
                        onOpenWhatsAppCharge(c.whatsapp, text);
                      }}
                      className="px-3.5 py-1.5 bg-[#d4eddf] hover:opacity-85 text-[#1a6b3a] rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Mensagem</span>
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
