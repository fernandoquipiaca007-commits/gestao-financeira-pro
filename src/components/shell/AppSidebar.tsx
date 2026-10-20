import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ShellNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
}

/** Agrupamento fixo dos módulos (Regra 06 — navegação global). "Ajuda" e "Definições" ficam em baixo. */
export const NAV_GROUPS: { id: string; label: string; en: string; items: string[] }[] = [
  { id: 'work', label: 'Trabalho', en: 'Work', items: ['dashboard', 'calendar', 'projects', 'tasks'] },
  { id: 'money', label: 'Finanças', en: 'Finance', items: ['financial', 'billing', 'clients', 'partners', 'categories', 'reports'] },
  { id: 'account', label: 'Conta', en: 'Account', items: ['plans', 'users', 'audit'] },
];
export const NAV_FOOTER = ['docs', 'settings'];

interface Props {
  items: ShellNavItem[];
  active: string;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

function NavButton({ item, active, collapsed, onSelect }: { item: ShellNavItem; active: boolean; collapsed: boolean; onSelect: (id: string) => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`aura-sidebar__item relative w-full border-0 bg-transparent text-left !shadow-none ${active ? '!bg-transparent' : ''} ${collapsed ? 'justify-center !px-0' : ''}`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-full bg-primary shadow-primary-3d"
          transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
          aria-hidden
        />
      )}
      <Icon className="relative z-10 w-[19px] h-[19px] shrink-0" strokeWidth={1.6} />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <span className={`relative z-10 aura-count ml-auto ${active ? '!bg-white/20 !text-primary-fg' : ''}`}>{item.badge > 99 ? '99+' : item.badge}</span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute top-1.5 right-2.5 z-10 w-2 h-2 rounded-full bg-accent ring-2 ring-[var(--surface-1)]" aria-hidden />
      ) : null}
    </button>
  );
}

/**
 * Sidebar de vidro (desktop ≥1024), sempre encostada à margem esquerda.
 * Colapsada = uma bola flutuante no canto; ao clicar abre-se e fica aberta.
 */
export function AppSidebar({ items, active, collapsed, onToggle, onSelect }: Props) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const byId = new Map(items.map((i) => [i.id, i]));
  const footer = NAV_FOOTER.map((id) => byId.get(id)).filter(Boolean) as ShellNavItem[];

  const reduce = useReducedMotion();
  const activeItem = byId.get(active);
  const ActiveIcon = activeItem?.icon ?? LayoutGrid;
  const hasBadges = items.some((i) => (i.badge ?? 0) > 0);

  return (
    <>
    <AnimatePresence>
      {collapsed && (
        <motion.button
          key="sidebar-orb"
          type="button"
          onClick={onToggle}
          initial={{ opacity: 0, scale: 0.4, x: -24 }}
          animate={reduce ? { opacity: 1, scale: 1, x: 0 } : { opacity: 1, scale: 1, x: 0, y: [0, -7, 0] }}
          // y explícito na saída: a flutuação infinita impediria o AnimatePresence de terminar
          exit={{ opacity: 0, scale: 0.4, x: -24, y: 0, transition: { duration: 0.22 } }}
          transition={{
            default: { type: 'spring', stiffness: 320, damping: 24 },
            y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="hidden lg:flex fixed left-4 top-1/2 -mt-7 z-40 w-14 h-14 rounded-full items-center justify-center aura-glass aura-glass--bar !p-0 cursor-pointer"
          style={{ boxShadow: '0 12px 32px -8px rgba(0,0,0,0.35), 0 0 0 1px var(--divider), 0 0 28px -6px var(--color-primary, #4f46e5)' }}
          aria-label={en ? 'Open menu' : 'Abrir menu'}
          title={en ? 'Open menu' : 'Abrir menu'}
        >
          <span className="absolute inset-1 rounded-full bg-primary/10 animate-pulse" aria-hidden />
          <ActiveIcon className="relative w-5 h-5 text-primary" strokeWidth={1.8} />
          {hasBadges && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-[var(--surface-1)]" aria-hidden />
          )}
        </motion.button>
      )}
    </AnimatePresence>

    <aside
      className={`hidden lg:flex flex-col shrink-0 h-full pb-4 transition-[width,margin] duration-300 ease-[var(--ease-emphasized)] ${collapsed ? 'w-14 overflow-hidden' : 'w-[244px]'}`}
      aria-label={en ? 'Modules' : 'Módulos'}
      aria-hidden={collapsed || undefined}
    >
      <motion.nav
        initial={false}
        animate={collapsed ? { opacity: 0, scale: 0.85, x: -40 } : { opacity: 1, scale: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ transformOrigin: 'left center' }}
        className="aura-glass aura-glass--bar h-full w-[244px] flex flex-col p-2.5"
      >
        <div className="flex items-center justify-end px-1 pb-1">
          <button
            type="button"
            onClick={onToggle}
            tabIndex={collapsed ? -1 : undefined}
            className="aura-icon-btn aura-icon-btn--sm !bg-transparent !border-transparent !shadow-none hover:!bg-sunken"
            aria-label={en ? 'Hide menu' : 'Esconder menu'}
            title={en ? 'Hide menu' : 'Esconder menu'}
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto aura-scroll -mr-1 pr-1">
          {NAV_GROUPS.map((group) => {
            const groupItems = group.items.map((id) => byId.get(id)).filter(Boolean) as ShellNavItem[];
            if (!groupItems.length) return null;
            return (
              <div key={group.id} className="grid gap-0.5 mb-1">
                <div className="aura-sidebar__section !pt-3">{en ? group.en : group.label}</div>
                {groupItems.map((item) => (
                  <NavButton key={item.id} item={item} active={active === item.id} collapsed={false} onSelect={onSelect} />
                ))}
              </div>
            );
          })}
        </div>

        {footer.length > 0 && (
          <div className="grid gap-0.5 pt-2 mt-1 border-t border-[var(--divider)]">
            {footer.map((item) => (
              <NavButton key={item.id} item={item} active={active === item.id} collapsed={false} onSelect={onSelect} />
            ))}
          </div>
        )}
      </motion.nav>
    </aside>
    </>
  );
}
