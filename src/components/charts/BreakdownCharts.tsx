import React from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AuraTooltip } from './AuraTooltip';

const VIZ = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)'];

/** Donut (≤6 fatias) com valor ao centro e legenda com montantes. 2px de ar entre fatias. */
export function DonutBreakdown({ data, format, centerLabel, centerValue }: {
  data: { name: string; value: number }[];
  format: (v: number) => string;
  centerLabel: string;
  centerValue: string;
}) {
  const slices = data.slice(0, 6);
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="@container"><div className="grid gap-5 items-center @lg:grid-cols-[180px_minmax(0,1fr)]">
      <div className="relative h-[180px] w-[180px] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={2} stroke="var(--surface-1)" strokeWidth={2} cornerRadius={4} animationDuration={900}>
              {slices.map((_, i) => <Cell key={i} fill={VIZ[i]} />)}
            </Pie>
            <Tooltip content={<AuraTooltip format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            <div className="text-[11px] text-fg-muted">{centerLabel}</div>
            <div className="font-display text-[19px] leading-tight text-fg tracking-[-0.02em]">{centerValue}</div>
          </div>
        </div>
      </div>
      <ul className="grid gap-2.5 m-0 p-0 list-none">
        {slices.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: VIZ[i] }} aria-hidden />
            <span className="flex-1 text-fg-secondary truncate">{d.name}</span>
            <span className="text-fg-muted tabular-nums text-[12px]">{Math.round((d.value / total) * 100)}%</span>
            <span className="text-fg font-medium tabular-nums">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div></div>
  );
}

/** Sparkline para KPIs (sem eixos). Cor herdada (currentColor) para funcionar sobre o card Ember. */
export function Sparkline({ values, color = 'currentColor', height = 40 }: { values: number[]; color?: string; height?: number }) {
  const data = values.map((v, i) => ({ i, v }));
  const id = React.useId().replace(/:/g, '');
  return (
    <div style={{ height, color }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="currentColor" strokeWidth={2} fill={`url(#s-${id})`} dot={false} isAnimationActive animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barra de antiguidade das contas a receber (segmentos animados + legenda). */
export function AgingBar({ buckets, format }: { buckets: { label: string; value: number }[]; format: (v: number) => string }) {
  const total = buckets.reduce((s, b) => s + b.value, 0);
  const colors = ['var(--viz-3)', 'var(--warning)', 'var(--viz-2)', 'var(--danger)', 'var(--aura-ember-800)'];
  if (total <= 0) return <div className="aura-progress aura-progress--sm" aria-hidden />;
  return (
    <div className="grid gap-2.5">
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={buckets.map((b) => `${b.label}: ${format(b.value)}`).join(', ')}>
        {buckets.map((b, i) => b.value > 0 && (
          <motion.span
            key={b.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ background: colors[i] }}
            initial={{ width: 0 }}
            animate={{ width: `${(b.value / total) * 100}%` }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-muted">
        {buckets.map((b, i) => b.value > 0 && (
          <span key={b.label} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: colors[i] }} aria-hidden />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
