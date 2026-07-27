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
  Globe,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-400" />
            Clientes
          </h2>
          <p className="text-sm text-slate-400">
            Base de clientes, associados aos respetivos países, moedas e histórico financeiro
          </p>
        </div>

        <button
          onClick={onOpenNewClientModal}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, empresa, e-mail, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem clientes cadastrados para os critérios selecionados.
          </p>
          <button
            onClick={onOpenNewClientModal}
            className="px-4 py-2 bg-blue-500 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((c) => {
            // Compute Client Stats:
            // Projects count
            const clientProjects = projects.filter((p) => p.clientId === c.id);
            const projectsCount = clientProjects.length;

            // Incomes for this client
            const clientIncomes = incomes.filter((i) => i.clientId === c.id);

            // Total paid
            const totalPaid = clientIncomes
              .filter((i) => i.status === 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);

            // Total owed
            const totalOwed = clientIncomes
              .filter((i) => i.status !== 'Recebido')
              .reduce((sum, i) => sum + i.amount, 0);

            // Last payment date
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
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Header: Flag, Currency badge & Type pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                      <span>{countryInfo.flag}</span>
                      <span>{c.type}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                      Moeda: {currencyInfo.symbol} ({c.currency})
                    </span>
                  </div>

                  {/* Client Name & Company */}
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                    {c.name}
                  </h3>

                  {c.company && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{c.company}</span>
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs mb-4 pt-2 border-t border-slate-800/80">
                    {c.whatsapp && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp:
                        </span>
                        <a
                          href={generateWhatsAppLink(c.whatsapp, `Olá, ${c.name}!`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          {c.whatsapp} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-blue-400" /> E-mail:
                        </span>
                        <a
                          href={`mailto:${c.email}`}
                          className="font-medium hover:text-blue-400 hover:underline truncate max-w-[160px]"
                        >
                          {c.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Client Financial Metrics */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-400" /> Projetos:
                      </span>
                      <strong className="text-white">{projectsCount} projeto(s)</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Quanto já pagou:
                      </span>
                      <strong className="text-emerald-400">
                        {formatCurrency(totalPaid, c.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-rose-400" /> Quanto ainda deve:
                      </span>
                      <strong className={totalOwed > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {formatCurrency(totalOwed, c.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> Último pagamento:
                      </span>
                      <span className="text-slate-300 font-medium">
                        {lastPaymentDate ? formatDate(lastPaymentDate) : 'Nenhum'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(c)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Mensagem WhatsApp</span>
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
