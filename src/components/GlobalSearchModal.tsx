import React, { useState, useEffect } from 'react';
import { Search, X, Users, FolderKanban, Phone, Building2, ChevronRight } from 'lucide-react';
import { Client, Project, Income } from '../types';
import { formatCurrency } from '../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  incomes: Income[];
  onSelectClient: (client: Client) => void;
  onSelectProject: (project: Project) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  incomes,
  onSelectClient,
  onSelectProject,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search Clients (by name, company, whatsapp, email, type)
  const matchedClients = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.whatsapp.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      )
    : [];

  // Search Projects (by name, category, client name)
  const matchedProjects = q
    ? projects.filter((p) => {
        const client = clients.find((c) => c.id === p.clientId);
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (client && client.name.toLowerCase().includes(q))
        );
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
          <input
            type="text"
            autoFocus
            placeholder="Pesquisar por cliente, projeto, telefone ou serviço..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 font-bold text-sm focus:outline-none placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!q ? (
            <div className="text-center py-12 text-slate-600 text-xs space-y-1">
              <p className="text-slate-900 font-black text-sm">Pesquisa Unificada do Sistema</p>
              <p className="font-semibold">Digite o nome do cliente, projeto, número de WhatsApp ou tipo de serviço para pesquisar instantaneamente.</p>
            </div>
          ) : matchedClients.length === 0 && matchedProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-700 font-extrabold text-sm">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Clients Results */}
              {matchedClients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600 stroke-[2.2]" /> Clientes ({matchedClients.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchedClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectClient(c);
                          onClose();
                        }}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-black text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                            {c.name}
                          </div>
                          <div className="text-xs text-slate-700 font-bold flex items-center gap-2 mt-0.5">
                            {c.company && <span>{c.company}</span>}
                            <span>• {c.type}</span>
                            <span>• {c.whatsapp}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {matchedProjects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-emerald-600 stroke-[2.2]" /> Projetos ({matchedProjects.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchedProjects.map((p) => {
                      const client = clients.find((c) => c.id === p.clientId);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            onSelectProject(p);
                            onClose();
                          }}
                          className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-700 font-bold flex items-center gap-2 mt-0.5">
                              <span>Cliente: {client?.name || '-'}</span>
                              <span>• {p.category}</span>
                              <span className="text-emerald-700 font-black">• {formatCurrency(p.totalAmount, p.currency)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
