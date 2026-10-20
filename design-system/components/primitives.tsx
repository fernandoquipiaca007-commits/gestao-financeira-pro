/**
 * AURA — PRIMITIVOS
 * Button · IconButton · Badge · Delta · Status · Chip · Avatar · AvatarGroup · Kbd · Spinner
 * Dependências do projeto: react 19, motion, lucide-react, clsx, tailwind-merge.
 * Estilos: design-system/styles/aura.css (classes .aura-*).
 */
import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { cn } from './cn';
import { spring } from '../motion/motion';

/* ================================ Button ================================ */
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: 'pill' | 'square' | 'icon';
  block?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Regras:
 * - 1 botão `primary` OU `accent` por zona de ação. `accent` só para o CTA mais importante do ecrã.
 * - Rótulo = verbo + objeto ("Criar fatura", "Exportar CSV"). Nunca "OK"/"Clique aqui".
 * - Botão só-ícone exige `aria-label`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', shape = 'pill', block, loading, leftIcon, rightIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={disabled || loading ? undefined : { scale: 0.97, y: 1 }}
      transition={spring.snappy}
      className={cn(
        'aura-btn',
        `aura-btn--${variant}`,
        size !== 'md' && `aura-btn--${size}`,
        shape === 'square' && 'aura-btn--square',
        shape === 'icon' && 'aura-btn--icon',
        block && 'aura-btn--block',
        className,
      )}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="aura-spinner" aria-hidden />}
      {leftIcon}
      {children != null && <span>{children}</span>}
      {rightIcon}
    </motion.button>
  );
});

/* ============================== IconButton ============================== */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  tone?: 'glass' | 'dark';
  size?: 'sm' | 'md';
  /** Mostra ponto de notificação (ember). `pulse` para novidades em tempo real. */
  dot?: boolean | 'pulse';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tone = 'glass', size = 'md', dot, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn('aura-icon-btn', tone === 'dark' && 'aura-icon-btn--dark', size === 'sm' && 'aura-icon-btn--sm', className)}
      {...rest}
    >
      {children}
      {dot && <span className={cn('aura-icon-btn__dot', dot === 'pulse' && 'aura-icon-btn__dot--pulse')} aria-hidden />}
    </button>
  );
});

/* ================================ Badge ================================ */
export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'highlight' | 'inverse' | 'on-color' | 'outline';

export function Badge({ tone = 'neutral', size = 'md', icon, className, children }: {
  tone?: Tone; size?: 'md' | 'lg'; icon?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <span className={cn('aura-badge', tone !== 'neutral' && `aura-badge--${tone}`, size === 'lg' && 'aura-badge--lg', className)}>
      {icon}
      {children}
    </span>
  );
}

/* ================================ Delta ================================ */
/**
 * Variação vs período. A cor depende de DIREÇÃO × "subir é bom?".
 * Ex.: despesas a subir = mau → <Delta value={5} upIsGood={false} />
 * Sempre com seta (nunca só cor) e com o período escrito ao lado.
 */
export function Delta({ value, upIsGood = true, onColor, suffix = '%', className }: {
  value: number; upIsGood?: boolean; onColor?: boolean; suffix?: string; className?: string;
}) {
  const up = value >= 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('aura-badge', onColor ? 'aura-badge--on-color' : good ? 'aura-badge--success' : 'aura-badge--danger', className)}>
      <Icon aria-hidden />
      <span className="aura-num">{Math.abs(value).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}{suffix}</span>
      <span className="sr-only">{up ? 'subida' : 'descida'}</span>
    </span>
  );
}

/* ================================ Status ================================ */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export function Status({ tone = 'neutral', children }: { tone?: StatusTone; children: React.ReactNode }) {
  return <span className={cn('aura-status', `aura-status--${tone}`)}>{children}</span>;
}

/** Mapa de estados do domínio → tom visual (usar SEMPRE este mapa, nunca inventar cores) */
export const DOMAIN_STATUS: Record<string, StatusTone> = {
  Recebido: 'success',
  Pago: 'success',
  Concluído: 'success',
  Concluída: 'success',
  Ativo: 'success',
  Pendente: 'warning',
  'Em andamento': 'info',
  'Em progresso': 'info',
  Atrasado: 'danger',
  Vencido: 'danger',
  Cancelado: 'neutral',
  Inativo: 'neutral',
};

/* ================================= Chip ================================= */
export function Chip({ selected, onRemove, icon, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean; onRemove?: () => void; icon?: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={selected} className={cn('aura-chip', className)} {...rest}>
      {icon}
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remover"
          className="aura-chip__remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRemove(); } }}
        >
          <X size={12} />
        </span>
      )}
    </button>
  );
}

/* ================================ Avatar ================================ */
export function Avatar({ src, name, size = 'md', presence, className }: {
  src?: string; name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; presence?: boolean; className?: string;
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <span className={cn('aura-avatar', size !== 'md' && `aura-avatar--${size}`, className)} title={name}>
      {src ? <img src={src} alt={name} loading="lazy" /> : <span aria-hidden>{initials}</span>}
      {!src && <span className="sr-only">{name}</span>}
      {presence && <span className="aura-avatar__presence" aria-label="online" />}
    </span>
  );
}

export function AvatarGroup({ people, max = 4, size = 'sm' }: {
  people: { name: string; src?: string }[]; max?: number; size?: 'xs' | 'sm' | 'md';
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="aura-avatar-group">
      {shown.map((p) => <Avatar key={p.name} {...p} size={size} />)}
      {rest > 0 && <span className={cn('aura-avatar', `aura-avatar--${size}`)} style={{ background: 'var(--surface-inverse)', color: 'var(--text-inverse)' }}>+{rest}</span>}
    </span>
  );
}

/* ============================== Kbd · Spinner ============================== */
export const Kbd = ({ children }: { children: React.ReactNode }) => <kbd className="aura-kbd">{children}</kbd>;
export const Spinner = ({ className }: { className?: string }) => <span className={cn('aura-spinner', className)} role="status" aria-label="A carregar" />;
