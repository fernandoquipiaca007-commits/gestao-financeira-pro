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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/90 text-slate-900 font-sans shadow-xs">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Mobile Menu button */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center space-x-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                  Gestão<span className="text-emerald-600">FO</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold block tracking-wider uppercase">
                  Plataforma Financeira & Operacional
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar Trigger */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-500 text-sm transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-xs font-medium text-slate-500">Pesquisar clientes, projetos, faturas...</span>
              </div>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white text-slate-400 rounded-md border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2.5">
            
            {/* Currency Filter */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <span className="px-2 text-slate-500 hidden lg:inline-flex items-center gap-1 text-[11px]">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Moeda:
              </span>
              <button
                onClick={() => setActiveCurrencyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                  activeCurrencyFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
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
                    className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs ${
                      activeCurrencyFilter === code
                        ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
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
              className="relative p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Add Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Novo Registro</span>
              </button>

              {showQuickAddDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowQuickAddDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200/90 shadow-xl z-20 py-1.5 text-slate-700 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewProjectModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <FolderKanban className="w-4 h-4 text-emerald-600" />
                      <span>Novo Projeto</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewClientModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Novo Cliente</span>
                    </button>
                    <div className="my-1 border-t border-slate-150" />
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewIncomeModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <DollarSign className="w-4 h-4 text-teal-600" />
                      <span>Nova Receita</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAddDropdown(false);
                        onOpenNewExpenseModal();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <Receipt className="w-4 h-4 text-rose-600" />
                      <span>Nova Despesa / Saída</span>
                    </button>
                    {onOpenNewPartnerModal && (
                      <button
                        onClick={() => {
                          setShowQuickAddDropdown(false);
                          onOpenNewPartnerModal();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
                      >
                        <Handshake className="w-4 h-4 text-purple-600" />
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
                className="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all cursor-pointer"
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
