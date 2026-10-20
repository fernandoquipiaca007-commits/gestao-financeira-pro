import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckSquare, DollarSign, FileText, FolderKanban, Handshake, Plus, Receipt, Search, UserPlus, Users } from 'lucide-react';
import { CurrencyCode, UserSession } from '../types';
import { getRoleLabel } from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_CONFIG } from '../config/app';
import { AccountMenu, CurrencyMenu, MenuPanel, usePopover } from './shell/HeaderMenus';

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
  onOpenSubscriptionModal?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
}

/**
 * Barra superior de vidro (Aura 2.0): marca · pesquisa ⌘K · moeda, notificações, Novo e conta.
 * Tema, idioma, sincronizar, definições e sair vivem no menu da conta.
 */
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
  onSync,
  isSyncing,
  setActiveTab,
  userSession,
  onLogout,
}) => {
  const { userProfile, isOwner, hasPermission } = useAuth();
  const { mode, setMode } = useTheme();
  const { t, lang, toggleLang } = useLanguage();
  const quick = usePopover();
  const en = lang === 'en';

  const can = (perm: string) => isOwner || hasPermission(perm);
  const items: { show: boolean; label: string; icon: React.ComponentType<{ className?: string }>; run?: () => void; sep?: boolean }[] = [
    { show: can('projects.create'), label: t('header.newProject', en ? 'New project' : 'Novo projeto'), icon: FolderKanban, run: onOpenNewProjectModal },
    { show: can('tasks.create') && !!onOpenNewTaskModal, label: t('header.newTask', en ? 'New task' : 'Nova tarefa'), icon: CheckSquare, run: onOpenNewTaskModal },
    { show: can('clients.create'), label: t('header.newClient', en ? 'New client' : 'Novo cliente'), icon: Users, run: onOpenNewClientModal },
    { show: can('financial.create'), label: t('header.newIncome', en ? 'New income' : 'Nova receita'), icon: DollarSign, run: onOpenNewIncomeModal, sep: true },
    { show: can('financial.create'), label: t('header.newExpense', en ? 'New expense' : 'Nova despesa'), icon: Receipt, run: onOpenNewExpenseModal },
    { show: can('billing.request') && !!onOpenNewBillingModal, label: en ? 'Billing request' : 'Pedido de faturação', icon: FileText, run: onOpenNewBillingModal, sep: true },
    { show: can('partners.create') && !!onOpenNewPartnerModal, label: t('header.newPartner', en ? 'New partner' : 'Novo parceiro'), icon: Handshake, run: onOpenNewPartnerModal },
    { show: can('users.create') && !!onOpenNewUserModal, label: t('header.newUser', en ? 'New user' : 'Novo utilizador'), icon: UserPlus, run: onOpenNewUserModal },
  ].filter((i) => i.show);

  const name = userProfile?.name || userSession?.name || (en ? 'User' : 'Utilizador');
  const [brandA, ...brandB] = APP_CONFIG.name.split(' ');

  return (
    <header className="relative z-30 shrink-0 px-3 sm:px-4 lg:px-6 pt-3">
      <div className="w-full max-w-[1720px] mx-auto aura-glass aura-glass--bar !rounded-full flex items-center justify-between gap-2 sm:gap-3 h-[64px] pl-2.5 pr-2">
        {/* Marca */}
        <button type="button" onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2.5 shrink-0 cursor-pointer rounded-full pr-2" aria-label={APP_CONFIG.name}>
          <img src="/logo.png" alt="" className="w-10 h-10 rounded-full object-cover shadow-accent-3d" />
          <span className="hidden sm:block font-display text-[18px] tracking-[-0.02em] leading-none text-fg">
            <span className="font-medium">{brandA}</span>{brandB.length ? <span className="font-light text-fg-secondary"> {brandB.join(' ')}</span> : null}
          </span>
        </button>

        {/* Pesquisa */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="hidden md:flex flex-1 max-w-[560px] items-center gap-2.5 h-11 px-4 rounded-full bg-surface-1/45 hover:bg-surface-1/80 border border-line-subtle text-fg-muted text-sm transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" strokeWidth={1.7} />
          <span className="flex-1 text-left truncate">{t('header.searchPlaceholder', en ? 'Search clients, projects, invoices…' : 'Pesquisar clientes, projetos, faturas…')}</span>
          <kbd className="aura-kbd">⌘K</kbd>
        </button>

        {/* Ações */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button type="button" onClick={onOpenGlobalSearch} className="md:hidden aura-icon-btn" aria-label={en ? 'Search' : 'Pesquisar'}>
            <Search />
          </button>

          {(isOwner || hasPermission('financial.view')) && (
            <CurrencyMenu value={activeCurrencyFilter} onChange={setActiveCurrencyFilter} lang={lang} />
          )}

          <button type="button" onClick={onOpenNotifications} className="aura-icon-btn" aria-label={en ? `Notifications (${unreadNotificationsCount} unread)` : `Notificações (${unreadNotificationsCount} por ler)`}>
            <Bell />
            {unreadNotificationsCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="aura-count absolute -top-1 -right-1 !min-w-[19px] !h-[19px] !text-[10px] shadow-[0_0_0_2px_var(--surface-1)]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </motion.span>
            )}
          </button>

          {items.length > 0 && (
            <div ref={quick.ref} className="relative">
              <button type="button" className="aura-btn aura-btn--primary !px-4 sm:!px-5" aria-haspopup="menu" aria-expanded={quick.open} onClick={() => quick.setOpen(!quick.open)}>
                <Plus strokeWidth={2.2} />
                <span className="hidden sm:inline">{t('header.new', en ? 'New' : 'Novo')}</span>
              </button>
              <MenuPanel open={quick.open} width={236}>
                {items.map((it) => (
                  <React.Fragment key={it.label}>
                    {it.sep && <div className="aura-menu__sep" />}
                    <button type="button" role="menuitem" className="aura-menu__item" onClick={() => { quick.setOpen(false); it.run?.(); }}>
                      <it.icon />
                      <span>{it.label}</span>
                    </button>
                  </React.Fragment>
                ))}
              </MenuPanel>
            </div>
          )}

          <AccountMenu
            name={name}
            email={userProfile?.email || userSession?.email}
            roleLabel={userProfile ? getRoleLabel(userProfile.role, lang) : ''}
            lang={lang}
            mode={mode}
            onMode={setMode}
            onToggleLang={toggleLang}
            onSync={onSync}
            isSyncing={isSyncing}
            onSettings={() => setActiveTab('settings')}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};
