import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowUpRight, Briefcase, CalendarClock, FolderKanban, Handshake, Receipt, TrendingUp, Users } from 'lucide-react';
import { fadeUp } from './DashboardCards';

type Tone = 'neutral' | 'danger' | 'warning' | 'success';

export interface Indicator {
  id: string;
  label: string;
  value: string;
  note: string;
  tone?: Tone;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

const toneIcon: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-fg',
  danger: 'bg-danger-soft text-danger-fg',
  warning: 'bg-warning-soft text-warning-fg',
  success: 'bg-success-soft text-success-fg',
};
const toneValue: Record<Tone, string> = { neutral: 'text-fg', danger: 'text-danger-fg', warning: 'text-fg', success: 'text-success-fg' };

/** Mosaico de indicador: rótulo, valor (Outfit), contexto e "↗" para o módulo. Altura uniforme, sem cortes. */
export function IndicatorTile({ ind }: { ind: Indicator }) {
  const Icon = ind.icon;
  const tone = ind.tone || 'neutral';
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      onClick={ind.onClick}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="aura-glass group min-w-0 p-3.5 sm:p-5 text-left flex flex-col gap-2.5 sm:gap-3 cursor-pointer"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-fg-secondary leading-snug">{ind.label}</span>
        <span className={`grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 ${toneIcon[tone]}`}><Icon className="w-[17px] h-[17px]" /></span>
      </span>
      <span className={`font-display font-normal text-[19px] sm:text-[26px] leading-none tracking-[-0.03em] break-words ${toneValue[tone]}`}>{ind.value}</span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[var(--divider)]">
        <span className="text-[12.5px] text-fg-muted leading-snug">{ind.note}</span>
        <ArrowUpRight className="w-4 h-4 shrink-0 text-fg-muted transition-transform group-hover:rotate-45 group-hover:text-fg" />
      </span>
    </motion.button>
  );
}

export function IndicatorsGrid({ items }: { items: Indicator[] }) {
  return <div className="grid gap-3 sm:gap-5 grid-cols-2 xl:grid-cols-4">{items.map((i) => <IndicatorTile key={i.id} ind={i} />)}</div>;
}

export const INDICATOR_ICONS = { AlertTriangle, CalendarClock, Receipt, TrendingUp, Briefcase, Handshake, FolderKanban, Users };
