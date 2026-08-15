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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Base de Clientes</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Clientes cadastrados com histórico financeiro, projetos e contatos</p>
          </div>
        </div>

        <button
          onClick={onOpenNewClientModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome, empresa, e-mail, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem clientes cadastrados para os critérios selecionados.
          </p>
          <button
            onClick={onOpenNewClientModal}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((c) => {
            // Compute Client Stats:
            const clientProjects = projects.filter((p) => p.clientId === c.id);
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
                className="bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-sm rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Top Header: Flag, Currency badge & Type pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 flex items-center gap-1.5">
                      <span>{countryInfo.flag}</span>
                      <span>{c.type}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      {currencyInfo.symbol} {c.currency}
                    </span>
                  </div>

                  {/* Client Name & Company */}
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    {c.name}
                  </h3>

                  {c.company && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mt-0.5 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.company}</span>
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs mb-4 pt-2 border-t border-slate-100">
                    {c.whatsapp && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp:
                        </span>
                        <a
                          href={generateWhatsAppLink(c.whatsapp, `Olá, ${c.name}!`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-800 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          {c.whatsapp} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Mail className="w-3.5 h-3.5 text-blue-500" /> E-mail:
                        </span>
                        <a
                          href={`mailto:${c.email}`}
                          className="font-bold text-slate-800 hover:text-blue-700 hover:underline truncate max-w-[160px]"
                        >
                          {c.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Client Financial Metrics */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-500" /> Projetos:
                      </span>
                      <strong className="text-slate-900 font-bold">{projectsCount} projeto(s)</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Já pagou:
                      </span>
                      <strong className="text-emerald-700 font-bold">
                        {formatCurrency(totalPaid, c.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Ainda deve:
                      </span>
                      <strong className={totalOwed > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                        {formatCurrency(totalOwed, c.currency)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Último pagamento:
                      </span>
                      <span className="text-slate-700 font-bold">
                        {lastPaymentDate ? formatDate(lastPaymentDate) : '—'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(c)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Mensagem WA</span>
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
