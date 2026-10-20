/**
 * AURA — NAVEGAÇÃO
 * PillNav · Rail · Tabs · BottomNav · Breadcrumb · Pagination · UserChip · BrandMark
 */
import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from './cn';
import { spring } from '../motion/motion';
import { Avatar } from './primitives';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
}

/* ================================ PillNav ================================ */
/** Navegação principal no topo (desktop ≥1024). Indicador "Ink 3D" desliza entre itens. */
export function PillNav({ items, active, onSelect, label = 'Navegação principal' }: {
  items: NavItem[]; active: string; onSelect: (id: string) => void; label?: string;
}) {
  return (
    <nav className="aura-pillnav" aria-label={label}>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            className="aura-pillnav__item"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(it.id)}
          >
            {isActive && (
              <motion.span
                layoutId="pillnav-indicator"
                className="aura-pillnav__indicator"
                style={{ inset: 0 }}
                transition={spring.smooth}
              />
            )}
            <span style={{ position: 'relative' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ================================= Rail ================================= */
/** Barra lateral de ícones (desktop/tablet). Grupos em cápsulas de vidro. Tooltip = label. */
export function Rail({ groups, active, onSelect }: {
  groups: NavItem[][]; active: string; onSelect: (id: string) => void;
}) {
  return (
    <nav className="aura-rail" aria-label="Módulos">
      {groups.map((group, gi) => (
        <div className="aura-rail__group" key={gi}>
          {group.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className="aura-rail__item"
              aria-label={label}
              title={label}
              aria-current={id === active ? 'page' : undefined}
              onClick={() => onSelect(id)}
            >
              {Icon && <Icon size={20} strokeWidth={1.6} />}
              {badge ? <span className="aura-count">{badge > 99 ? '99+' : badge}</span> : null}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

/* ================================= Tabs ================================= */
export function Tabs({ items, active, onSelect, label }: {
  items: { id: string; label: string; count?: number }[]; active: string; onSelect: (id: string) => void; label: string;
}) {
  return (
    <div className="aura-tabs" role="tablist" aria-label={label}>
      {items.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            className="aura-tab"
            onClick={() => onSelect(t.id)}
            style={isActive ? { ['--tw' as string]: 1 } : undefined}
          >
            {t.label}
            {t.count != null && <span className="aura-count aura-count--muted" style={{ marginLeft: 8 }}>{t.count}</span>}
            {isActive && (
              <motion.span
                layoutId={`tabs-${label}`}
                transition={spring.smooth}
                style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =============================== BottomNav =============================== */
/**
 * Mobile (<768): 4 destinos + FAB central para a ação nº 1 (ex.: "Nova transação").
 * Máximo 5 alvos. O resto vai para "Mais" (sheet).
 */
export function BottomNav({ items, active, onSelect, onFab, fabLabel = 'Criar' }: {
  items: NavItem[]; active: string; onSelect: (id: string) => void; onFab?: () => void; fabLabel?: string;
}) {
  const half = Math.ceil(items.length / 2);
  const render = (it: NavItem) => {
    const Icon = it.icon;
    const isActive = it.id === active;
    return (
      <button key={it.id} type="button" className="aura-bottomnav__item" aria-current={isActive ? 'page' : undefined} onClick={() => onSelect(it.id)}>
        <motion.span animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.08 : 1 }} transition={spring.snappy} style={{ display: 'grid' }}>
          {Icon && <Icon size={22} strokeWidth={isActive ? 2 : 1.7} />}
        </motion.span>
        {it.label}
      </button>
    );
  };
  return (
    <nav className="aura-bottomnav" aria-label="Navegação">
      {items.slice(0, half).map(render)}
      {onFab && (
        <motion.button type="button" className="aura-bottomnav__fab" aria-label={fabLabel} onClick={onFab} whileTap={{ scale: 0.92 }} transition={spring.snappy}>
          <Plus size={24} />
        </motion.button>
      )}
      {items.slice(half).map(render)}
    </nav>
  );
}

/* ============================== Breadcrumb ============================== */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Caminho">
      <ol className="aura-breadcrumb" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {last ? <span aria-current="page">{it.label}</span> : <a href={it.href}>{it.label}</a>}
              {!last && <ChevronRight size={14} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ============================== Pagination ============================== */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav className="aura-pagination" aria-label="Paginação">
      <button className="aura-pagination__item" aria-label="Página anterior" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16} /></button>
      {list.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - list[i - 1] > 1 && <span className="aura-muted">…</span>}
          <button className="aura-pagination__item" aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)}>{p}</button>
        </React.Fragment>
      ))}
      <button className="aura-pagination__item" aria-label="Página seguinte" disabled={page === pages} onClick={() => onPage(page + 1)}><ChevronRight size={16} /></button>
    </nav>
  );
}

/* =============================== UserChip =============================== */
export function UserChip({ name, email, avatar, onClick }: { name: string; email: string; avatar?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aura-glass aura-glass--strong"
      style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px 0 6px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--glass-border)' }}
    >
      <Avatar name={name} src={avatar} />
      <span className="hidden md:grid" style={{ textAlign: 'left', lineHeight: 1.25 }}>
        <span style={{ fontWeight: 500, fontSize: 'var(--text-body-sm)' }}>{name}</span>
        <span className="aura-muted" style={{ fontSize: 'var(--text-caption)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
      </span>
      <ChevronDown size={16} className="aura-muted" aria-hidden />
    </button>
  );
}

/* =============================== BrandMark =============================== */
/** Logótipo em cápsula de vidro: monograma ember + nome. */
export function BrandMark({ name = 'CodeEngine', compact }: { name?: string; compact?: boolean }) {
  return (
    <span className="aura-glass aura-glass--strong" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: 52, padding: compact ? 6 : '0 18px 0 6px', borderRadius: 999 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent-3d)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        CE
      </span>
      {!compact && <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>{name}</span>}
    </span>
  );
}
