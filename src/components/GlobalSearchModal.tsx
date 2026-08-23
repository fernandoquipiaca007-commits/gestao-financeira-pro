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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white border border-[#c4c7c7]/30 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input */}
        <div className="bg-[#f7f3f2] p-4 border-b border-[#c4c7c7]/40 flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#747878] stroke-[2.2]" />
          <input
            type="text"
            autoFocus
            placeholder="Pesquisar por cliente, projeto, telefone ou serviço..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[#1c1b1b] font-normal text-sm focus:outline-none placeholder-[#c4c7c7]"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!q ? (
            <div className="text-center py-12 text-[#747878] text-xs space-y-1">
              <p className="text-[#1c1b1b] font-semibold text-base">Pesquisa Unificada do Sistema</p>
              <p className="text-sm text-[#747878]">Digite o nome do cliente, projeto, número de WhatsApp ou tipo de serviço para pesquisar instantaneamente.</p>
            </div>
          ) : matchedClients.length === 0 && matchedProjects.length === 0 ? (
            <div className="text-center py-12 text-[#747878] font-normal text-sm">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Clients Results */}
              {matchedClients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#0050d7] stroke-[2.2]" /> Clientes ({matchedClients.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchedClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectClient(c);
                          onClose();
                        }}
                        className="p-3.5 bg-[#f7f3f2] hover:bg-[#f1edec] border border-[#c4c7c7]/30 rounded-[16px] cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-[#1c1b1b] text-sm group-hover:text-[#0050d7] transition-colors">
                            {c.name}
                          </div>
                          <div className="text-sm text-[#747878] flex items-center gap-2 mt-0.5">
                            {c.company && <span>{c.company}</span>}
                            <span>• {c.type}</span>
                            <span>• {c.whatsapp}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#c4c7c7] group-hover:text-[#0050d7] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {matchedProjects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-[#444747] stroke-[2.2]" /> Projetos ({matchedProjects.length})
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
                          className="p-3.5 bg-[#f7f3f2] hover:bg-[#f1edec] border border-[#c4c7c7]/30 rounded-[16px] cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-semibold text-[#1c1b1b] text-sm group-hover:text-[#0050d7] transition-colors">
                              {p.name}
                            </div>
                            <div className="text-sm text-[#747878] flex items-center gap-2 mt-0.5">
                              <span>Cliente: {client?.name || '-'}</span>
                              <span>• {p.category}</span>
                              <span className="text-[#0050d7]">• {formatCurrency(p.totalAmount, p.currency)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#c4c7c7] group-hover:text-[#0050d7] transition-colors" />
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
