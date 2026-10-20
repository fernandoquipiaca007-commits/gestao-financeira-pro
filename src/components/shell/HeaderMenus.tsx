import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Globe, Lightbulb, LogOut, Monitor, Moon, RefreshCw, Settings, Sun } from 'lucide-react';
import { CurrencyCode, CURRENCIES } from '../../types';

/** Abre/fecha um menu ancorado; fecha ao clicar fora ou com Esc. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

export function MenuPanel({ open, children, width = 248, align = 'right' }: { open: boolean; children: React.ReactNode; width?: number; align?: 'left' | 'right' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }}
          className="aura-menu absolute top-[calc(100%+10px)] z-50"
          style={{ width, [align]: 0, transformOrigin: align === 'right' ? 'top right' : 'top left' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------- Moeda ----------------------------- */
export function CurrencyMenu({ value, onChange, lang }: { value: CurrencyCode | 'ALL'; onChange: (v: CurrencyCode | 'ALL') => void; lang: string }) {
  const { open, setOpen, ref } = usePopover();
  const en = lang === 'en';
  const pick = (v: CurrencyCode | 'ALL') => { onChange(v); setOpen(false); };
  return (
    <div ref={ref} className="relative hidden md:block">
      <button type="button" className="aura-chip !h-11 !px-3.5" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} title={en ? 'Filter by currency' : 'Filtrar por moeda'}>
        <Globe size={15} className="text-fg-muted" />
        <span className="font-medium text-fg">{value === 'ALL' ? (en ? 'All' : 'Todas') : value}</span>
        <ChevronDown size={14} className="text-fg-muted" />
      </button>
      <MenuPanel open={open} width={232}>
        <div className="aura-menu__label">{en ? 'Show values in' : 'Mostrar valores em'}</div>
        <button type="button" role="menuitem" className="aura-menu__item" onClick={() => pick('ALL')}>
          <Globe />
          <span className="flex-1">{en ? 'All currencies' : 'Todas as moedas'}</span>
          {value === 'ALL' && <Check className="!text-accent" />}
        </button>
        <div className="aura-menu__sep" />
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <button key={code} type="button" role="menuitem" className="aura-menu__item" onClick={() => pick(code)}>
            <span className="aura-kbd !min-w-[38px]">{code}</span>
            <span className="flex-1">{CURRENCIES[code]?.name || code}</span>
            {value === code && <Check className="!text-accent" />}
          </button>
        ))}
      </MenuPanel>
    </div>
  );
}

/* ----------------------------- Conta ----------------------------- */
interface AccountMenuProps {
  name: string;
  email?: string;
  roleLabel: string;
  lang: string;
  mode: 'light' | 'dark' | 'system';
  onMode: (m: 'light' | 'dark' | 'system') => void;
  onToggleLang: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onSettings: () => void;
  onFeedback?: () => void;
  onLogout?: () => void;
}

export function AccountMenu({ name, email, roleLabel, lang, mode, onMode, onToggleLang, onSync, isSyncing, onSettings, onFeedback, onLogout }: AccountMenuProps) {
  const { open, setOpen, ref } = usePopover();
  const en = lang === 'en';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';
  const modes = [
    { id: 'light' as const, label: en ? 'Light' : 'Claro', icon: Sun },
    { id: 'dark' as const, label: en ? 'Dark' : 'Escuro', icon: Moon },
    { id: 'system' as const, label: en ? 'Auto' : 'Auto', icon: Monitor },
  ];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={en ? 'Account menu' : 'Menu da conta'}
        className="flex items-center gap-2.5 h-11 pl-1 pr-1 sm:pr-3 rounded-full bg-surface-1/60 hover:bg-surface-1 border border-line-subtle transition-colors cursor-pointer"
      >
        <span className="aura-avatar aura-avatar--sm">{initials}</span>
        <span className="hidden xl:grid text-left leading-tight">
          <span className="text-[13px] font-medium text-fg max-w-[130px] truncate">{name}</span>
          <span className="text-[11px] text-fg-muted">{roleLabel}</span>
        </span>
        <ChevronDown size={14} className="hidden sm:block text-fg-muted" />
      </button>
      <MenuPanel open={open} width={272}>
        <div className="flex items-center gap-3 px-3 pt-2 pb-3">
          <span className="aura-avatar">{initials}</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-fg truncate">{name}</span>
            {email && <span className="block text-xs text-fg-muted truncate">{email}</span>}
          </span>
          <span className="aura-badge ml-auto">{roleLabel}</span>
        </div>
        <div className="aura-menu__label">{en ? 'Appearance' : 'Aparência'}</div>
        <div className="px-2 pb-2">
          <div className="aura-segmented w-full" role="radiogroup" aria-label={en ? 'Theme' : 'Tema'}>
            {modes.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className="aura-segmented__item flex-1 inline-flex items-center justify-center gap-1.5" onClick={() => onMode(m.id)}>
                <m.icon size={14} />{m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="aura-menu__sep" />
        <button type="button" role="menuitem" className="aura-menu__item" onClick={onToggleLang}>
          <Globe /><span className="flex-1">{en ? 'Language' : 'Idioma'}</span><span className="aura-kbd">{en ? 'EN' : 'PT'}</span>
        </button>
        {onSync && (
          <button type="button" role="menuitem" className="aura-menu__item" onClick={() => { onSync(); setOpen(false); }} disabled={isSyncing}>
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} /><span className="flex-1">{isSyncing ? (en ? 'Syncing…' : 'A sincronizar…') : (en ? 'Sync data' : 'Sincronizar dados')}</span>
          </button>
        )}
        <button type="button" role="menuitem" className="aura-menu__item" onClick={() => { onSettings(); setOpen(false); }}>
          <Settings /><span className="flex-1">{en ? 'Settings' : 'Definições'}</span>
        </button>
        {onFeedback && (
          <button type="button" role="menuitem" className="aura-menu__item" onClick={() => { onFeedback(); setOpen(false); }}>
            <Lightbulb /><span className="flex-1">{en ? 'Suggest an improvement' : 'Sugerir melhoria'}</span>
          </button>
        )}
        {onLogout && (
          <>
            <div className="aura-menu__sep" />
            <button type="button" role="menuitem" className="aura-menu__item aura-menu__item--danger" onClick={onLogout}>
              <LogOut /><span className="flex-1">{en ? 'Sign out' : 'Terminar sessão'}</span>
            </button>
          </>
        )}
      </MenuPanel>
    </div>
  );
}
