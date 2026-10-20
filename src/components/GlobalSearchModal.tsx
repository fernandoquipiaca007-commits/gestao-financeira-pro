import React, { useState, useEffect } from 'react';
import { Search, X, Users, FolderKanban, Phone, Building2, ChevronRight } from 'lucide-react';
import { Client, Project, Income } from '../types';
import { formatCurrency } from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        // Esc fecha a pesquisa, como em qualquer paleta ⌘K
        e.preventDefault();
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-[rgba(18,17,14,0.34)] backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-glass-strong border border-line-subtle rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-[56px]">
        
        {/* Search Input */}
        <div className="bg-surface-2 p-4 border-b border-line-subtle flex items-center space-x-3">
          <Search className="w-5 h-5 text-fg-muted stroke-[2.2]" />
          <input
            type="text"
            autoFocus
            placeholder={lang === 'en' ? "Search by client, project, phone or service..." : "Pesquisar por cliente, projeto, telefone ou serviço..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-fg font-normal text-sm focus:outline-none placeholder:text-fg-muted "
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!q ? (
            <div className="text-center py-12 text-fg-muted text-xs space-y-1">
              <p className="text-fg font-semibold text-base">
                {lang === 'en' ? "Unified System Search" : "Pesquisa Unificada do Sistema"}
              </p>
              <p className="text-sm text-fg-muted ">
                {lang === 'en'
                  ? "Type client name, project, WhatsApp number or service type to search instantly."
                  : "Digite o nome do cliente, projeto, número de WhatsApp ou tipo de serviço para pesquisar instantaneamente."}
              </p>
            </div>
          ) : matchedClients.length === 0 && matchedProjects.length === 0 ? (
            <div className="text-center py-12 text-fg-muted font-normal text-sm">
              {lang === 'en' ? `No results found for "${query}".` : `Nenhum resultado encontrado para "${query}".`}
            </div>
          ) : (
            <>
              {/* Clients Results */}
              {matchedClients.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[13px] font-medium text-fg-secondary flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-accent-soft-fg stroke-[2.2]" />
                    {lang === 'en' ? `Clients (${matchedClients.length})` : `Clientes (${matchedClients.length})`}
                  </div>
                  <div className="space-y-1.5">
                    {matchedClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectClient(c);
                          onClose();
                        }}
                        className="p-3.5 bg-surface-2 hover:bg-sunken border border-line-subtle rounded-lg cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-fg text-sm group-hover:text-accent-soft-fg transition-colors">
                            {c.name}
                          </div>
                          <div className="text-sm text-fg-muted flex items-center gap-2 mt-0.5">
                            {c.company && <span>{c.company}</span>}
                            <span>• {c.type}</span>
                            <span>• {c.whatsapp}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-fg-disabled group-hover:text-accent-soft-fg transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Results */}
              {matchedProjects.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[13px] font-medium text-fg-secondary flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-fg-secondary stroke-[2.2]" />
                    {lang === 'en' ? `Projects (${matchedProjects.length})` : `Projetos (${matchedProjects.length})`}
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
                          className="p-3.5 bg-surface-2 hover:bg-sunken border border-line-subtle rounded-lg cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-semibold text-fg text-sm group-hover:text-accent-soft-fg transition-colors">
                              {p.name}
                            </div>
                            <div className="text-sm text-fg-muted flex items-center gap-2 mt-0.5">
                              <span>{lang === 'en' ? 'Client' : 'Cliente'}: {client?.name || '-'}</span>
                              <span>• {p.category}</span>
                              <span className="text-accent-soft-fg ">• {formatCurrency(p.totalAmount, p.currency)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-fg-disabled group-hover:text-accent-soft-fg transition-colors" />
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
