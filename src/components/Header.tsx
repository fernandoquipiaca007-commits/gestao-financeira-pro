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
  LogOut,
  Handshake,
  CheckSquare,
  UserPlus,
  FileText,
} from 'lucide-react';
import { CurrencyCode, CURRENCIES, UserSession } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';

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
  onOpenNewTaskModal?: () => void;
  onOpenNewUserModal?: () => void;
  onOpenNewBillingModal?: () => void;
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
  onOpenNewTaskModal,
  onOpenNewUserModal,
  onOpenNewBillingModal,
  activeTab,
  setActiveTab,
  toggleMobileMenu,
  userSession,
  onLogout,
}) => {
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const { userProfile, isOwner, hasPermission } = useAuth();

  const canCreateClient = isOwner || hasPermission('clients.create');
  const canCreateProject = isOwner || hasPermission('projects.create');
  const canCreateTask = isOwner || hasPermission('tasks.create');
  const canCreateBilling = isOwner || hasPermission('billing.request');
  const canCreateFinancial = isOwner || hasPermission('financial.create');
  const canCreatePartner = isOwner || hasPermission('partners.create');
  const canCreateUser = isOwner || hasPermission('users.create');

  const roleStyle = userProfile?.role ? ROLE_COLORS[userProfile.role] : undefined;

  return (
    <header className="sticky top-0 z-30 bg-[#fcf8f8]/95 backdrop-blur-md border-b border-[#c4c7c7]/40">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14 gap-2">

          {/* Left: Brand & Mobile Menu button */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-full text-[#444747] hover:bg-[#f1edec] transition-colors cursor-pointer"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer flex items-center space-x-2.5 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#000000] flex items-center justify-center text-white shrink-0">
                <span className="text-sm font-semibold tracking-tight">G</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-base tracking-tight text-[#1c1b1b] block leading-tight">
                  Gestão<span className="text-[#0050d7]">FO</span>
                </span>
                <span className="text-[9px] text-[#747878] font-medium tracking-widest uppercase hidden xs:block">
                  Plataforma Financeira
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar Trigger (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-[#f1edec] hover:bg-[#ebe7e7] border border-[#c4c7c7]/35 text-[#444747] text-sm transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-[#747878]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#747878]">Pesquisar clientes, projetos, faturas...</span>
              </div>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white text-[#747878] rounded-md border border-[#c4c7c7]/50">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">

            {/* Search Trigger Button (Mobile Only) */}
            <button
              onClick={onOpenGlobalSearch}
              className="md:hidden p-2 rounded-full bg-[#f1edec] border border-[#c4c7c7]/35 text-[#444747] hover:bg-[#ebe7e7] cursor-pointer"
              title="Pesquisar"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Currency Filter (visible for those with financial access) */}
            {(isOwner || hasPermission('financial.view')) && (
              <div className="flex items-center bg-[#f1edec] p-0.5 rounded-full border border-[#c4c7c7]/35 text-xs">
                <span className="px-1.5 text-[#747878] hidden xl:inline-flex items-center gap-1 text-[11px] font-medium">
                  <Globe className="w-3 h-3" strokeWidth={1.5} />
                </span>

                {/* Desktop / Tablet Currency Buttons */}
                <div className="hidden sm:flex items-center space-x-0.5">
                  <button
                    onClick={() => setActiveCurrencyFilter('ALL')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer text-xs font-medium ${
                      activeCurrencyFilter === 'ALL'
                        ? 'bg-[#000000] text-white'
                        : 'text-[#444747] hover:text-[#1c1b1b] hover:bg-[#ebe7e7]'
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
                        className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer text-xs font-medium ${
                          activeCurrencyFilter === code
                            ? 'bg-[#000000] text-white'
                            : 'text-[#444747] hover:text-[#1c1b1b] hover:bg-[#ebe7e7]'
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
                  className="sm:hidden bg-transparent text-[#1c1b1b] font-medium text-[11px] rounded-full px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">🌐 Todas</option>
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code}>
                      {CURRENCIES[code].flag} {code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full bg-[#f1edec] border border-[#c4c7c7]/35 hover:bg-[#ebe7e7] text-[#444747] hover:text-[#1c1b1b] transition-all cursor-pointer"
              title="Notificações e Alertas"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ba1a1a] text-white font-semibold text-[9px] flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Add Button & Dropdown */}
            {(canCreateProject || canCreateClient || canCreateTask || canCreateFinancial) && (
              <div className="relative">
                <button
                  onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#000000] hover:opacity-85 text-white font-medium text-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">Novo</span>
                </button>

                {showQuickAddDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowQuickAddDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 rounded-[18px] bg-white border border-[#c4c7c7]/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-20 py-2 text-[#1c1b1b] text-sm overflow-hidden">
                      {canCreateProject && (
                        <button
                          onClick={() => { setShowQuickAddDropdown(false); onOpenNewProjectModal(); }}
                          className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                        >
                          <FolderKanban className="w-4 h-4 text-[#0050d7]" strokeWidth={1.5} />
                          <span className="font-medium text-sm">Novo Projeto</span>
                        </button>
                      )}

                      {canCreateTask && onOpenNewTaskModal && (
                        <button
                          onClick={() => { setShowQuickAddDropdown(false); onOpenNewTaskModal(); }}
                          className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                        >
                          <CheckSquare className="w-4 h-4 text-[#003da9]" strokeWidth={1.5} />
                          <span className="font-medium text-sm">Nova Tarefa</span>
                        </button>
                      )}

                      {canCreateBilling && onOpenNewBillingModal && (
                        <button
                          onClick={() => { setShowQuickAddDropdown(false); onOpenNewBillingModal(); }}
                          className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                        >
                          <FileText className="w-4 h-4 text-[#0050d7]" strokeWidth={1.5} />
                          <span className="font-medium text-sm">Solicitar Faturamento</span>
                        </button>
                      )}

                      {canCreateClient && (
                        <button
                          onClick={() => { setShowQuickAddDropdown(false); onOpenNewClientModal(); }}
                          className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                        >
                          <Users className="w-4 h-4 text-[#444747]" strokeWidth={1.5} />
                          <span className="font-medium text-sm">Novo Cliente</span>
                        </button>
                      )}

                      {canCreateFinancial && (
                        <>
                          <div className="my-1 border-t border-[#c4c7c7]/40" />
                          <button
                            onClick={() => { setShowQuickAddDropdown(false); onOpenNewIncomeModal(); }}
                            className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                          >
                            <DollarSign className="w-4 h-4 text-[#1a6b3a]" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Nova Receita</span>
                          </button>
                          <button
                            onClick={() => { setShowQuickAddDropdown(false); onOpenNewExpenseModal?.(); }}
                            className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                          >
                            <Receipt className="w-4 h-4 text-[#ba1a1a]" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Nova Despesa</span>
                          </button>
                        </>
                      )}

                      {canCreatePartner && onOpenNewPartnerModal && (
                        <button
                          onClick={() => { setShowQuickAddDropdown(false); onOpenNewPartnerModal(); }}
                          className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                        >
                          <Handshake className="w-4 h-4 text-[#444747]" strokeWidth={1.5} />
                          <span className="font-medium text-sm">Novo Parceiro</span>
                        </button>
                      )}

                      {canCreateUser && onOpenNewUserModal && (
                        <>
                          <div className="my-1 border-t border-[#c4c7c7]/40" />
                          <button
                            onClick={() => { setShowQuickAddDropdown(false); onOpenNewUserModal(); }}
                            className="w-full px-4 py-2 text-left hover:bg-[#f7f3f2] flex items-center space-x-3 transition-colors cursor-pointer text-[#1c1b1b]"
                          >
                            <UserPlus className="w-4 h-4 text-[#000000]" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Novo Utilizador</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Profile Pill & Role Badge */}
            {userProfile && (
              <div className="hidden sm:flex items-center space-x-2 bg-[#f1edec] pl-2 pr-3 py-1 rounded-full border border-[#c4c7c7]/35">
                <div className="w-6 h-6 rounded-full bg-[#000000] text-white flex items-center justify-center text-xs font-semibold">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#1c1b1b] max-w-[100px] truncate">
                  {userProfile.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: roleStyle?.bg || '#000000', color: roleStyle?.text || '#ffffff' }}
                >
                  {ROLE_LABELS[userProfile.role]}
                </span>
              </div>
            )}

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden sm:flex p-2 rounded-full bg-[#f1edec] border border-[#c4c7c7]/35 hover:bg-[#ffdad6] hover:text-[#93000a] text-[#747878] transition-all cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
