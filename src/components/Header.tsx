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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-900 font-sans shadow-xs">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Brand & Mobile Menu button */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 shrink-0">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center space-x-2.5 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>
              <div>
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 block leading-tight">
                  Gestão<span className="text-emerald-600">FO</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-600 font-black hidden xs:block tracking-widest uppercase">
                  Plataforma Financeira &amp; Operacional
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar Trigger (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-8">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-300 text-slate-700 text-sm transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                <span className="text-xs font-bold text-slate-700">Pesquisar clientes, projetos, faturas...</span>
              </div>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white text-slate-600 font-bold rounded-md border border-slate-300 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">

            {/* Search Trigger Button (Mobile Only) */}
            <button
              onClick={onOpenGlobalSearch}
              className="md:hidden p-2 rounded-xl bg-slate-100/90 border border-slate-200/80 text-slate-700 hover:text-slate-900 cursor-pointer"
              title="Pesquisar"
            >
              <Search className="w-4 h-4" />
            </button>
            
            {/* Currency Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-300 text-xs font-bold">
              <span className="px-1.5 text-slate-800 hidden xl:inline-flex items-center gap-1 text-[11px] font-extrabold">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Moeda:
              </span>
              
              {/* Desktop / Tablet Currency Buttons */}
              <div className="hidden sm:flex items-center space-x-0.5">
                <button
                  onClick={() => setActiveCurrencyFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    activeCurrencyFilter === 'ALL'
                      ? 'bg-white text-slate-900 font-black shadow-xs border border-slate-300'
                      : 'text-slate-700 hover:text-slate-950 font-bold'
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
                      className={`px-1.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs ${
                        activeCurrencyFilter === code
                          ? 'bg-white text-slate-900 font-black shadow-xs border border-slate-300'
                          : 'text-slate-700 hover:text-slate-950 font-bold'
                      }`}
                      title={curr.name}
                    >
                      <span>{curr.flag}</span>
                      <span className="hidden lg:inline">{code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Compact Currency Select */}
              <select
                value={activeCurrencyFilter}
                onChange={(e) => setActiveCurrencyFilter(e.target.value as CurrencyCode | 'ALL')}
                className="sm:hidden bg-white text-slate-900 font-extrabold text-[11px] rounded-lg px-2 py-1 border border-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🌐 Todas</option>
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {CURRENCIES[code].flag} {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
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
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
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
                        onOpenNewExpenseModal?.();
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
                className="hidden sm:flex p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all cursor-pointer"
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
