import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Globe, LayoutDashboard, LogOut, Menu, Moon, Plus, RefreshCw, Sun, Wallet, FolderKanban, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NAV_FOOTER, NAV_GROUPS, ShellNavItem } from './AppSidebar';

interface Props {
  items: ShellNavItem[];
  active: string;
  onSelect: (id: string) => void;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  onCreate: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onLogout: () => void;
}

/**
 * Mobile (<1024): barra inferior flutuante com 4 destinos + botão "Criar" ao centro.
 * "Mais" abre uma folha (bottom sheet) com todos os módulos e preferências.
 */
export function MobileNav({ items, active, onSelect, moreOpen, setMoreOpen, onCreate, isDark, onToggleTheme, onToggleLang, onSync, isSyncing, onLogout }: Props) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const has = (id: string) => items.some((i) => i.id === id);
  const go = (id: string) => { onSelect(id); setMoreOpen(false); };
  const primary = [
    { id: 'dashboard', label: en ? 'Home' : 'Painel', icon: LayoutDashboard },
    { id: 'projects', label: en ? 'Projects' : 'Projetos', icon: FolderKanban },
  ].filter((i) => has(i.id));
  const secondary = [{ id: 'financial', label: en ? 'Finance' : 'Financeiro', icon: Wallet }].filter((i) => has(i.id));
  const byId = new Map(items.map((i) => [i.id, i]));

  const Tab = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }) => (
    <button type="button" className="aura-bottomnav__item" aria-current={active === id ? 'page' : undefined} onClick={() => go(id)}>
      <Icon size={22} strokeWidth={active === id ? 2 : 1.7} />
      {label}
    </button>
  );

  return (
    <>
      <nav className="aura-bottomnav lg:!hidden" aria-label={en ? 'Navigation' : 'Navegação'}>
        {primary.map((t) => <Tab key={t.id} {...t} />)}
        <motion.button type="button" className="aura-bottomnav__fab" aria-label={en ? 'Create' : 'Criar'} onClick={onCreate} whileTap={{ scale: 0.92 }}>
          <Plus size={24} />
        </motion.button>
        {secondary.map((t) => <Tab key={t.id} {...t} />)}
        <button type="button" className="aura-bottomnav__item" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}>
          <Menu size={22} strokeWidth={1.7} />
          {en ? 'More' : 'Mais'}
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div className="aura-backdrop lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMoreOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={en ? 'All modules' : 'Todos os módulos'}
              className="aura-sheet lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', stiffness: 180, damping: 26 } }}
              exit={{ y: '100%', transition: { duration: 0.2 } }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 120) setMoreOpen(false); }}
            >
              <div className="aura-sheet__grabber" aria-hidden />
              <div className="flex items-center justify-between px-5 pt-2 pb-1">
                <h2 className="aura-modal__title">{en ? 'All modules' : 'Todos os módulos'}</h2>
                <button type="button" className="aura-icon-btn aura-icon-btn--sm" aria-label={en ? 'Close' : 'Fechar'} onClick={() => setMoreOpen(false)}><X /></button>
              </div>
              <div className="overflow-y-auto px-3 pb-4">
                {[...NAV_GROUPS, { id: 'help', label: 'Ajuda e definições', en: 'Help & settings', items: NAV_FOOTER }].map((g) => {
                  const list = g.items.map((id) => byId.get(id)).filter(Boolean) as ShellNavItem[];
                  if (!list.length) return null;
                  return (
                    <div key={g.id}>
                      <div className="aura-sidebar__section">{en ? g.en : g.label}</div>
                      <div className="grid grid-cols-3 gap-2">
                        {list.map(({ id, label, icon: Icon, badge }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => go(id)}
                            aria-current={active === id ? 'page' : undefined}
                            className={`relative grid justify-items-center gap-1.5 rounded-lg px-2 py-3 text-[12px] font-medium text-center border ${active === id ? 'bg-primary text-primary-fg border-transparent shadow-primary-3d' : 'bg-glass-strong text-fg-secondary border-line-subtle'}`}
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.6} />
                            <span className="leading-tight">{label}</span>
                            {badge ? <span className="aura-count absolute top-1.5 right-1.5">{badge > 99 ? '99+' : badge}</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="aura-sidebar__section">{en ? 'Preferences' : 'Preferências'}</div>
                <div className="grid gap-1">
                  <button type="button" className="aura-sidebar__item border-0 bg-transparent w-full" onClick={onToggleLang}><Globe className="w-[19px] h-[19px]" />{en ? 'Mudar para Português' : 'Switch to English'}</button>
                  <button type="button" className="aura-sidebar__item border-0 bg-transparent w-full" onClick={onToggleTheme}>{isDark ? <Sun className="w-[19px] h-[19px]" /> : <Moon className="w-[19px] h-[19px]" />}{isDark ? (en ? 'Light mode' : 'Modo claro') : (en ? 'Dark mode' : 'Modo escuro')}</button>
                  {onSync && <button type="button" className="aura-sidebar__item border-0 bg-transparent w-full" onClick={() => { onSync(); setMoreOpen(false); }}><RefreshCw className={`w-[19px] h-[19px] ${isSyncing ? 'animate-spin' : ''}`} />{en ? 'Sync data' : 'Sincronizar dados'}</button>}
                  <button type="button" className="aura-sidebar__item border-0 bg-transparent w-full !text-danger-fg" onClick={onLogout}><LogOut className="w-[19px] h-[19px]" />{en ? 'Sign out' : 'Terminar sessão'}</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
