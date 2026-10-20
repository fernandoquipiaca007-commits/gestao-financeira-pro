/**
 * AURA — FEEDBACK
 * Progress · Segments · ProgressRing · Skeleton · EmptyState · Alert · ToastProvider/useToast
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from './cn';
import { duration, ease, toast as toastVariants } from '../motion/motion';

/* =============================== Progress =============================== */
/** Barra com trilho em listras diagonais (o "por preencher" é visível, não vazio). */
export function Progress({ value, max = 100, tone = 'accent', size = 'md', label, valueLabel }: {
  value: number; max?: number; tone?: 'accent' | 'ink' | 'highlight' | 'success'; size?: 'sm' | 'md' | 'lg';
  label: string; valueLabel?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('aura-progress', tone !== 'accent' && `aura-progress--${tone}`, size !== 'md' && `aura-progress--${size}`)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={valueLabel}
    >
      <motion.div
        className="aura-progress__bar"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: duration.slower * 1.5, ease: ease.emphasized }}
      />
    </div>
  );
}

/** Distribuição em segmentos (ex.: estado das faturas: Pago 62% · Pendente 30% · Vencido 8%). */
export function Segments({ items }: {
  items: { label: string; value: number; tone: 'highlight' | 'ink' | 'muted' | 'accent' | 'hatch' }[];
}) {
  const bg: Record<string, React.CSSProperties> = {
    highlight: { background: 'var(--highlight)', color: 'var(--highlight-fg)' },
    ink: { background: 'var(--surface-inverse)', color: 'var(--text-inverse)' },
    muted: { background: 'var(--aura-ink-400)', color: '#fff' },
    accent: { background: 'var(--accent-gradient)', color: '#fff' },
    hatch: { background: 'var(--hatch-bg)', color: 'var(--text-secondary)' },
  };
  return (
    <div className="aura-segments" role="img" aria-label={items.map((i) => `${i.label} ${i.value}%`).join(', ')}>
      {items.map((it, i) => (
        <motion.span
          key={it.label}
          style={{ ...bg[it.tone], ['--w' as string]: Math.max(it.value, 4) }}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.1 + i * 0.08, duration: duration.slow, ease: ease.emphasized }}
        >
          {it.value >= 12 ? it.label : ''}
        </motion.span>
      ))}
    </div>
  );
}

/* ============================== ProgressRing ============================== */
/** Anel com marcas de minutos (estilo cronómetro). Centro aceita qualquer conteúdo. */
export function ProgressRing({ value, size = 200, stroke = 14, ticks = true, children, label }: {
  value: number; size?: number; stroke?: number; ticks?: boolean; children?: React.ReactNode; label: string;
}) {
  const r = (size - stroke) / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, maxWidth: '100%' }} role="img" aria-label={`${label}: ${pct}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
        {ticks && <circle className="aura-ring__ticks" cx={size / 2} cy={size / 2} r={r + stroke / 2 + 6} fill="none" strokeWidth={6} />}
        <circle className="aura-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <motion.circle
          className="aura-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.2, ease: ease.emphasized }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  );
}

/* ================================ Skeleton ================================ */
/** Usar no 1º carregamento. Em refetch, manter o conteúdo antigo a 60% de opacidade (sem "flash"). */
export const Skeleton = ({ w = '100%', h = 14, r, className }: { w?: number | string; h?: number | string; r?: number; className?: string }) => (
  <span className={cn('aura-skeleton', className)} style={{ display: 'block', width: w, height: h, borderRadius: r }} aria-hidden />
);

export function StatCardSkeleton() {
  return (
    <div className="aura-glass aura-stat" aria-busy="true" aria-label="A carregar indicador">
      <Skeleton w="40%" />
      <Skeleton w="65%" h={36} r={10} />
      <Skeleton w="50%" h={20} r={999} />
    </div>
  );
}

/* =============================== EmptyState =============================== */
/** Estado vazio = convite à 1ª ação. Diz o que vai aparecer aqui e como começar. */
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="aura-empty">
      <motion.div
        className="aura-empty__art"
        initial={{ rotate: -14, scale: 0.85, opacity: 0 }}
        animate={{ rotate: -6, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        {icon}
      </motion.div>
      <h3 className="aura-empty__title">{title}</h3>
      <p className="aura-empty__desc">{description}</p>
      {action}
    </div>
  );
}

/* ================================= Alert ================================= */
const alertIcon = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle, accent: Info };
export function Alert({ tone = 'info', title, children, action }: {
  tone?: keyof typeof alertIcon; title?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const Icon = alertIcon[tone];
  return (
    <div className={cn('aura-alert', tone !== 'info' && `aura-alert--${tone}`)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="aura-alert__title">{title}</div>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}

/* ================================= Toast ================================= */
type ToastTone = 'neutral' | 'success' | 'danger' | 'warning';
interface ToastItem { id: number; title: string; description?: string; tone: ToastTone; action?: { label: string; onClick: () => void } }

const ToastCtx = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

/** Montar 1x no topo da app. Toasts: 4s (8s se tiver ação "Anular"). Máx. 3 visíveis. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l.slice(-2), { ...t, id }]);
    window.setTimeout(() => dismiss(id), t.action ? 8000 : 4000);
  }, [dismiss]);

  const icons = { neutral: Info, success: CheckCircle2, danger: XCircle, warning: AlertTriangle };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="aura-toaster" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.tone];
            return (
              <motion.div key={t.id} layout variants={toastVariants} initial="hidden" animate="show" exit="exit" className="aura-toast" role="status">
                <span className={cn('aura-toast__icon', t.tone !== 'neutral' && `aura-toast__icon--${t.tone}`)}><Icon size={16} /></span>
                <div style={{ minWidth: 0 }}>
                  <div className="aura-toast__title">{t.title}</div>
                  {t.description && <div className="aura-toast__desc">{t.description}</div>}
                  {t.action && (
                    <button className="aura-btn aura-btn--link" style={{ color: 'var(--aura-ember-300)', marginTop: 6 }} onClick={() => { t.action!.onClick(); dismiss(t.id); }}>
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button className="aura-toast__close" aria-label="Fechar notificação" onClick={() => dismiss(t.id)}><X size={16} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast precisa de <ToastProvider>');
  return ctx.push;
}
