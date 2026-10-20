/**
 * AURA — SUPERFÍCIES
 * AuroraBackground · GlassCard · CardHeader · StatCard · HeroNumber · PaymentCard3D · Well
 */
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from './cn';
import { fadeUp, spring } from '../motion/motion';
import { Delta } from './primitives';

/* ============================ AuroraBackground ============================ */
/**
 * Fundo translúcido OBRIGATÓRIO de todas as áreas autenticadas da app.
 * Gradiente prata→champanhe + 3 blobs aurora a derivar + grão subtil.
 * Montar UMA vez no topo da árvore (App shell). Nunca dentro de cards.
 */
export function AuroraBackground({ children, sheen = true, className }: {
  children: React.ReactNode; sheen?: boolean; className?: string;
}) {
  return (
    <div className={cn('aura-root aura-canvas', className)}>
      <div className="aura-canvas__aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      {sheen && <div className="aura-canvas__sheen" aria-hidden />}
      <div className="aura-canvas__noise" aria-hidden />
      {children}
    </div>
  );
}

/* ================================ GlassCard ================================ */
export type CardTone = 'glass' | 'strong' | 'subtle' | 'solid' | 'inverse' | 'accent' | 'highlight';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  interactive?: boolean;
  /** Efeito de pilha 3D (cartas por trás) — usar com tone="inverse" para listas de tarefas */
  stacked?: boolean;
  /** Anima a entrada (usar dentro de um contentor com variants={stagger()}) */
  animated?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside';
}

const toneClass: Record<CardTone, string> = {
  glass: 'aura-glass',
  strong: 'aura-glass aura-glass--strong',
  subtle: 'aura-glass aura-glass--subtle',
  solid: 'aura-card',
  inverse: 'aura-card aura-card--inverse',
  accent: 'aura-card aura-card--accent',
  highlight: 'aura-card aura-card--highlight',
};

export function GlassCard({ tone = 'glass', interactive, stacked, animated = true, as = 'div', className, children, ...rest }: GlassCardProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      variants={animated ? fadeUp : undefined}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={spring.smooth}
      className={cn(toneClass[tone], interactive && 'aura-glass--interactive', stacked && 'aura-stack', 'min-w-0', className)}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </Comp>
  );
}

/** Cabeçalho padrão de card: título + subtítulo + ação (seta ↗ ou menu) */
export function CardHeader({ title, subtitle, action, onOpen }: {
  title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; onOpen?: () => void;
}) {
  return (
    <div className="aura-card-head">
      <div className="min-w-0">
        <h3 className="aura-card-title">{title}</h3>
        {subtitle && <p className="aura-card-sub">{subtitle}</p>}
      </div>
      {action ??
        (onOpen && (
          <motion.button
            type="button"
            className="aura-icon-btn"
            aria-label={`Abrir ${typeof title === 'string' ? title : 'detalhe'}`}
            onClick={onOpen}
            whileHover={{ rotate: 45 }}
            transition={spring.snappy}
          >
            <ArrowUpRight />
          </motion.button>
        ))}
    </div>
  );
}

export const Well = ({ solid, className, children }: { solid?: boolean; className?: string; children: React.ReactNode }) => (
  <div className={cn('aura-well', solid && 'aura-well--solid', className)}>{children}</div>
);

/* ================================ StatCard ================================ */
/**
 * KPI. Contrato: label (sem dois pontos) · value · delta (vs período nomeado) · ícone opcional.
 * tone="accent" APENAS para o KPI mais importante do ecrã (máx. 1 por ecrã).
 * Números animam com NumberFlow (rolagem de dígitos) — nunca contadores caseiros.
 */
export function StatCard({ label, value, currency, delta, upIsGood = true, period = 'vs. mês anterior', icon, tone = 'glass', compact, className }: {
  label: string;
  value: number;
  currency?: string;
  delta?: number;
  upIsGood?: boolean;
  period?: string;
  icon?: React.ReactNode;
  tone?: 'glass' | 'accent' | 'solid' | 'subtle';
  compact?: boolean;
  className?: string;
}) {
  const onColor = tone === 'accent';
  return (
    <GlassCard tone={tone} className={cn('aura-stat', className)}>
      <div className="aura-stat__head">
        <span className="aura-stat__label">{label}</span>
        {icon && <span className="aura-stat__icon" aria-hidden>{icon}</span>}
      </div>
      <div className="aura-stat__value">
        <NumberFlow
          value={value}
          locales="pt-PT"
          format={currency
            ? { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 }
            : { notation: compact ? 'compact' : 'standard' }}
        />
      </div>
      {delta != null && (
        <div className="aura-stat__foot">
          <Delta value={delta} upIsGood={upIsGood} onColor={onColor} />
          <span>{period}</span>
        </div>
      )}
    </GlassCard>
  );
}

/* =============================== HeroNumber =============================== */
/** O número que lidera o ecrã (saldo total). Exatamente 1 por vista. Outfit 300. */
export function HeroNumber({ value, currency = 'EUR', label }: { value: number; currency?: string; label: string }) {
  return (
    <div>
      <p className="aura-overline" style={{ margin: 0 }}>{label}</p>
      <div className="aura-hero-number">
        <NumberFlow value={value} locales="pt-PT" format={{ style: 'currency', currency, maximumFractionDigits: 2 }} />
      </div>
    </div>
  );
}

/* ============================== PaymentCard3D ============================== */
/**
 * Cartão (conta/carteira) com inclinação 3D que segue o rato + reflexo de luz.
 * Desliga o tilt com prefers-reduced-motion e em ecrãs touch (sem hover).
 */
export function PaymentCard3D({ tone = 'ink', holder, last4, expiry, brand, status = 'Ativo', className }: {
  tone?: 'ink' | 'ember' | 'citrine';
  holder: string;
  last4: string;
  expiry: string;
  brand?: React.ReactNode;
  status?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), spring.float as never);
  const rotateX = useSpring(useTransform(py, [0, 1], [10, -10]), spring.float as never);
  const glare = useTransform([px, py], ([x, y]: number[]) => `radial-gradient(420px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.25), transparent 40%)`);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn('aura-paycard', tone === 'ember' && 'aura-paycard--ember', tone === 'citrine' && 'aura-paycard--citrine', className)}
    >
      <motion.span aria-hidden style={{ position: 'absolute', inset: 0, background: glare, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transform: 'translateZ(30px)' }}>
        <span className="aura-badge" style={{ background: 'rgba(255,255,255,.92)', color: 'var(--aura-ink-900)' }}>{status}</span>
        {brand}
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', transform: 'translateZ(40px)' }}>
        <div>
          <div className="aura-paycard__label">{holder}</div>
          <div className="aura-paycard__number">•••• •••• {last4}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="aura-paycard__label">Validade</div>
          <div className="aura-paycard__number">{expiry}</div>
        </div>
      </div>
    </motion.div>
  );
}
