import React from 'react';
import { motion, type Variants } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { ArrowDownRight, ArrowUpRight, Minus, Plus, Wallet } from 'lucide-react';
import { AgingBar, Sparkline } from '../charts/BreakdownCharts';
import { CurrencySwitcher } from './CurrencySwitcher';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/** Card de vidro do painel: título + subtítulo curto + ação "↗" opcional. */
export function DashCard({ title, subtitle, onOpen, openLabel, action, className = '', children }: {
  title?: string; subtitle?: string; onOpen?: () => void; openLabel?: string; action?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <motion.section variants={fadeUp} className={`aura-glass min-w-0 flex flex-col ${className}`}>
      {(title || action || onOpen) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[17px] font-medium tracking-[-0.015em] text-fg m-0">{title}</h2>}
            {subtitle && <p className="text-[12.5px] text-fg-muted mt-0.5 mb-0">{subtitle}</p>}
          </div>
          {action}
          {onOpen && (
            <motion.button type="button" onClick={onOpen} whileHover={{ rotate: 45 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="aura-icon-btn aura-icon-btn--sm shrink-0" aria-label={openLabel || title}>
              <ArrowUpRight />
            </motion.button>
          )}
        </header>
      )}
      <div className="flex-1 px-5 pb-5 pt-4 min-w-0">{children}</div>
    </motion.section>
  );
}

/** Variação vs período anterior: seta + texto (nunca só cor). */
export function DeltaPill({ value, upIsGood = true, onColor, suffix }: { value: number | null; upIsGood?: boolean; onColor?: boolean; suffix: string }) {
  if (value == null || !isFinite(value)) return <span className={onColor ? 'text-white/80 text-[12.5px]' : 'text-fg-muted text-[12.5px]'}>{suffix}</span>;
  const up = value >= 0;
  const good = up === upIsGood;
  const Icon = Math.abs(value) < 0.5 ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = onColor ? 'aura-badge--on-color' : good ? 'aura-badge--success' : 'aura-badge--danger';
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px]">
      <span className={`aura-badge ${tone}`}><Icon />{Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0).replace('.', ',')}%</span>
      <span className={onColor ? 'text-white/80' : 'text-fg-muted'}>{suffix}</span>
    </span>
  );
}

const currencyFormat = (currency: string) => ({ style: 'currency' as const, currency, maximumFractionDigits: 2 });

/** Card herói: o número que lidera o ecrã (1 por vista). Flutua subtilmente. */
export function HeroBalance({ value, currency, locale, lang, net, netLabel, onIncome, onExpense, breakdown, onOpenReserves }: {
  value: number; currency: string; locale: string; lang: 'pt' | 'en'; net: string; netLabel: string; onIncome?: () => void; onExpense?: () => void;
  /** Onde está o caixa: livre, reservado (com destino) e por enviar aos sócios. */
  breakdown?: { free: string; reserved: string; owed: string; hasReserved: boolean; hasOwed: boolean };
  onOpenReserves?: () => void;
}) {
  const en = lang === 'en';
  return (
    <motion.section variants={fadeUp} className="aura-glass aura-float aura-float--slow min-w-0 p-5 sm:p-6 flex flex-col justify-between gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-fg-secondary"><span className="aura-stat__icon !w-8 !h-8"><Wallet /></span>{en ? 'Cash balance' : 'Saldo em caixa'}</span>
        <CurrencySwitcher fallback={currency} lang={lang} />
      </div>
      <div>
        <div className={`font-display font-light leading-none tracking-[-0.04em] text-[42px] sm:text-[52px] ${value < 0 ? 'text-danger-fg' : 'text-fg'}`}>
          <NumberFlow value={value} locales={locale} format={currencyFormat(currency)} />
        </div>
        <p className="mt-2.5 mb-0 text-[13px] text-fg-muted">{netLabel} <strong className="text-fg font-medium">{net}</strong></p>
        {breakdown && (breakdown.hasReserved || breakdown.hasOwed) && (
          <button type="button" onClick={onOpenReserves} className="mt-3 w-full grid grid-cols-3 gap-2 text-left rounded-xl border border-line-subtle bg-surface-2/60 p-2.5 cursor-pointer hover:bg-surface-2 transition-colors">
            <span className="min-w-0"><span className="block text-[11px] text-fg-muted">{en ? 'Free' : 'Livre'}</span><strong className="block text-[13px] font-medium text-fg truncate">{breakdown.free}</strong></span>
            <span className="min-w-0"><span className="block text-[11px] text-fg-muted">{en ? 'Reserved' : 'Reservado'}</span><strong className="block text-[13px] font-medium text-fg truncate">{breakdown.reserved}</strong></span>
            <span className="min-w-0"><span className="block text-[11px] text-fg-muted">{en ? 'Owed to partners' : 'Por enviar a sócios'}</span><strong className="block text-[13px] font-medium text-warning-fg truncate">{breakdown.owed}</strong></span>
          </button>
        )}
      </div>
      {(onIncome || onExpense) && (
        <div className="grid grid-cols-2 gap-2">
          {onIncome && <button type="button" onClick={onIncome} className="aura-btn aura-btn--primary"><Plus />{en ? 'Income' : 'Receita'}</button>}
          {onExpense && <button type="button" onClick={onExpense} className="aura-btn aura-btn--secondary"><Minus />{en ? 'Expense' : 'Despesa'}</button>}
        </div>
      )}
    </motion.section>
  );
}

/** KPI Ember (único destaque do ecrã) com sparkline. */
export function KpiAccent({ label, value, currency, locale, delta, deltaSuffix, spark, onClick }: {
  label: string; value: number; currency: string; locale: string; delta: number | null; deltaSuffix: string; spark: number[]; onClick?: () => void;
}) {
  return (
    <motion.button type="button" variants={fadeUp} onClick={onClick} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="aura-card aura-card--accent min-w-0 p-5 sm:p-6 text-left flex flex-col justify-between gap-4 cursor-pointer">
      <span className="text-[13px] font-medium text-white/85">{label}</span>
      <div className="font-display font-normal leading-none tracking-[-0.035em] text-[34px] sm:text-[38px] text-white">
        <NumberFlow value={value} locales={locale} format={{ ...currencyFormat(currency), maximumFractionDigits: 0 }} />
      </div>
      <div className="text-white/90 -mx-1"><Sparkline values={spark} height={44} /></div>
      <DeltaPill value={delta} onColor suffix={deltaSuffix} />
    </motion.button>
  );
}

/** KPI "A receber" com barra de antiguidade. */
export function KpiReceivable({ label, value, currency, locale, aging, format, footnote, onClick }: {
  label: string; value: number; currency: string; locale: string; aging: { label: string; value: number }[]; format: (v: number) => string; footnote: string; onClick?: () => void;
}) {
  return (
    <motion.button type="button" variants={fadeUp} onClick={onClick} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="aura-glass min-w-0 p-5 sm:p-6 text-left flex flex-col justify-between gap-4 cursor-pointer">
      <span className="text-[13px] font-medium text-fg-secondary">{label}</span>
      <div className="font-display font-normal leading-none tracking-[-0.035em] text-[34px] sm:text-[38px] text-fg">
        <NumberFlow value={value} locales={locale} format={{ ...currencyFormat(currency), maximumFractionDigits: 0 }} />
      </div>
      <AgingBar buckets={aging} format={format} />
      <span className="text-[12.5px] text-fg-muted">{footnote}</span>
    </motion.button>
  );
}
