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
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Filter clients
  const filteredClients = clients.filter((c) => {
    // Currency filter
    if (currencyFilter !== 'ALL' && c.currency !== currencyFilter) return false;

    // Type filter
    if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.whatsapp.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">Base de Clientes</h2>
            <p className="text-xs text-[#747878] mt-0.5">Clientes cadastrados com histórico financeiro, projetos e contatos</p>
          </div>
        </div>

        <button
          onClick={onOpenNewClientModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#c4c7c7]/40 p-4 rounded-[22px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, empresa, e-mail, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-sm font-medium focus:outline-none cursor-pointer"
        >
          <option value="ALL">Todos os Tipos</option>
          <option value="Tráfego Pago">Tráfego Pago</option>
          <option value="Desenvolvimento">Desenvolvimento</option>
          <option value="Consultoria">Consultoria</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-[#c4c7c7] mx-auto" />
          <h3 className="text-sm font-semibold text-[#1c1b1b]">Nenhum cliente encontrado</h3>
          <p className="text-xs text-[#747878] max-w-sm mx-auto">
            Não existem clientes cadastrados para os critérios selecionados.
          </p>
          <button
            onClick={onOpenNewClientModal}
            className="px-5 py-2 bg-[#000000] text-white font-medium text-xs rounded-[29px] inline-flex items-center gap-1.5 hover:opacity-85 transition-all"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((c) => {
            const clientProjects = projects.filter((p) => p.clientId === c.id || (p.clientIds && p.clientIds.includes(c.id)));
            const projectsCount = clientProjects.length;
            const clientIncomes = incomes.filter((i) => i.clientId === c.id);
            const totalPaid = clientIncomes
              .filter((i) => i.status === 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);
            const totalOwed = clientIncomes
              .filter((i) => i.status !== 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);
            const receivedIncomes = clientIncomes
              .filter((i) => i.status === 'Recebido')
              .sort((a, b) => (b.receivedDate || b.dueDate).localeCompare(a.receivedDate || a.dueDate));
            const lastPaymentDate = receivedIncomes.length > 0
              ? (receivedIncomes[0].receivedDate || receivedIncomes[0].dueDate)
              : null;
            const countryInfo = COUNTRIES[c.country] || COUNTRIES.OTHER;
            const currencyInfo = CURRENCIES[c.currency] || CURRENCIES.BRL;

            return (
              <div
                key={c.id}
                className="bg-white border border-[#c4c7c7]/40 hover:border-[#c4c7c7] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-[22px] p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Header: Flag, Currency badge & Type pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#f1edec] text-[#444747] text-[11px] font-semibold flex items-center gap-1.5">
                      <span>{countryInfo.flag}</span>
                      <span>{c.type}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-[#dbe1ff] text-[#003da9] text-[11px] font-semibold">
                      {currencyInfo.symbol} {c.currency}
                    </span>
                  </div>

                  {/* Client Name & Company */}
                  <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight group-hover:text-[#0050d7] transition-colors">
                    {c.name}
                  </h3>

                  {c.company && (
                    <div className="flex items-center space-x-1.5 text-xs text-[#747878] mt-0.5 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-[#747878] shrink-0" />
                      <span>{c.company}</span>
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs mb-4 pt-2 border-t border-[#c4c7c7]/40">
                    {c.whatsapp && (
                      <div className="flex items-center justify-between text-[#1c1b1b]">
                        <span className="flex items-center gap-1.5 text-[#747878]">
                          <MessageCircle className="w-3.5 h-3.5 text-[#1a6b3a]" /> WhatsApp:
                        </span>
                        <a
                          href={generateWhatsAppLink(c.whatsapp, `Olá, ${c.name}!`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#1c1b1b] hover:text-[#0050d7] hover:underline flex items-center gap-1"
                        >
                          {c.whatsapp} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center justify-between text-[#1c1b1b]">
                        <span className="flex items-center gap-1.5 text-[#747878]">
                          <Mail className="w-3.5 h-3.5 text-[#0050d7]" /> E-mail:
                        </span>
                        <a
                          href={`mailto:${c.email}`}
                          className="font-medium text-[#1c1b1b] hover:text-[#0050d7] hover:underline truncate max-w-[160px]"
                        >
                          {c.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Client Financial Metrics */}
                  <div className="bg-[#f7f3f2] p-4 rounded-[16px] border border-[#c4c7c7]/30 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#747878] flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-[#444747]" /> Projetos:
                      </span>
                      <strong className="text-[#1c1b1b] font-semibold">{projectsCount} projeto(s)</strong>
                    </div>

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
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(c)}
                      className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(c.id)}
                      className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
