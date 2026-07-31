import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Globe,
  FolderKanban,
  Users,
  DollarSign,
  Receipt,
  Menu,
  Sparkles,
  LogOut,
  User as UserIcon,
  Handshake,
} from 'lucide-react';
import { CurrencyCode, CURRENCIES, UserSession } from '../types';

interface HeaderProps {
  activeCurrencyFilter: CurrencyCode | 'ALL';
  setActiveCurrencyFilter: (curr: CurrencyCode | 'ALL') => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenGlobalSearch: () => void;
  onOpenNewClientModal: () => void;
  onOpenNewProjectModal: () => void;
  onOpenNewIncomeModal: () => void;
  onOpenNewExpenseModal: () => void;
  onOpenNewPartnerModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCurrencyFilter,
  setActiveCurrencyFilter,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenGlobalSearch,
  onOpenNewClientModal,
  onOpenNewProjectModal,
  onOpenNewIncomeModal,
  onOpenNewExpenseModal,
  onOpenNewPartnerModal,
  activeTab,
  setActiveTab,
  toggleMobileMenu,
  userSession,
  onLogout,
}) => {
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Mobile Menu button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center space-x-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="font-semibold text-lg tracking-tight text-white block leading-tight">
                  Gestão<span className="text-emerald-400">FO</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block tracking-wide uppercase">
                  Financeira & Operacional
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar Trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 text-sm transition-all shadow-inner group cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span>Pesquisar cliente, projeto, telefone...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-slate-900 text-slate-400 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Currency Filter */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-medium">
              <span className="px-2 text-slate-400 hidden lg:inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Moeda:
              </span>
              <button
                onClick={() => setActiveCurrencyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCurrencyFilter === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Todas
              </button>
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const curr = CURRENCIES[code];
                return (
                  <button
                    key={code}
                    onClick={() => setActiveCurrencyFilter(code)}
                    className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      activeCurrencyFilter === code
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title={curr.name}
                  >
                    <span>{curr.flag}</span>
                    <span className="hidden sm:inline">{code}</span>
                  </button>
                );
              })}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Notificações e Alertas"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center animate-pulse shadow-md">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Add Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Novo</span>
              </button>

              {showQuickAddDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowQuickAddDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-20 py-1.5 text-slate-200 text-sm">
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewProjectModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <FolderKanban className="w-4 h-4 text-emerald-400" />
                      <span>Novo Projeto</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewClientModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Novo Cliente</span>
                    </button>
                    <div className="my-1 border-t border-slate-700/60" />
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewIncomeModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-teal-400" />
                      <span>Nova Receita</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewExpenseModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 flex items-center space-x-2.5 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 text-rose-400" />
                      <span>Nova Despesa / Saída</span>
                    </button>
                    {onOpenNewPartnerModal && (
                      <button
                        onClick={() => {
                          setShowQuickAddDropdown(false);
                          onOpenNewPartnerModal();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-700/70 flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <Handshake className="w-4 h-4 text-purple-400" />
                        <span>Novo Parceiro</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Profile & Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
                title="Sair do Sistema (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
