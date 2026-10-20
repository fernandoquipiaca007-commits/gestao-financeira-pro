import React, { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AuraTooltip, compactNumber } from './AuraTooltip';

const axis = { fontSize: 11, fill: 'var(--chart-axis)' };

/** Fluxo/tendência: linhas de 2px, área a ~12%, crosshair e ponto final. */
export function AreaTrend({ data, series, height = 260, format, lang = 'pt' }: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color: string }[];
  height?: number;
  format: (v: number) => string;
  lang?: 'pt' | 'en';
}) {
  const uid = useId().replace(/:/g, '');
  const labels = Object.fromEntries(series.map((s) => [s.key, s.label]));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis tick={axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => compactNumber(v, lang)} />
          <Tooltip cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1, strokeDasharray: '0' }} content={<AuraTooltip format={format} labels={labels} />} />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#g-${uid}-${s.key})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface-1)', fill: s.color }}
              animationDuration={900 + i * 150}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras comparativas: ≤24px, topo arredondado 4px, 2px de ar entre séries. */
export function BarCompare({ data, series, height = 260, format, lang = 'pt', layout = 'horizontal' }: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color: string }[];
  height?: number;
  format: (v: number) => string;
  lang?: 'pt' | 'en';
  layout?: 'horizontal' | 'vertical';
}) {
  const labels = Object.fromEntries(series.map((s) => [s.key, s.label]));
  const vertical = layout === 'vertical';
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'} margin={{ top: 8, right: vertical ? 16 : 8, left: vertical ? 4 : -12, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={vertical} horizontal={!vertical} stroke="var(--chart-grid)" />
          {vertical ? (
            <>
              <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => compactNumber(v, lang)} />
              <YAxis type="category" dataKey="label" tick={{ ...axis, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => compactNumber(v, lang)} />
            </>
          )}
          <Tooltip cursor={{ fill: 'var(--surface-sunken)' }} content={<AuraTooltip format={format} labels={labels} />} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={24} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} animationDuration={800 + i * 120} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Previsão: uma série, linha de referência no zero (quando há valores negativos). */
export function ForecastLine({ data, height = 200, format, lang = 'pt' }: {
  data: { label: string; saldo: number }[];
  height?: number;
  format: (v: number) => string;
  lang?: 'pt' | 'en';
}) {
  const uid = useId().replace(/:/g, '');
  const min = Math.min(...data.map((d) => d.saldo));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 20, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`f-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-3)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--viz-3)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={2} tickMargin={8} />
          <YAxis tick={axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => compactNumber(v, lang)} />
          {min < 0 && <ReferenceLine y={0} stroke="var(--danger)" strokeOpacity={0.5} />}
          <Tooltip cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }} content={<AuraTooltip format={format} labels={{ saldo: lang === 'en' ? 'Projected cash' : 'Caixa previsto' }} />} />
          <Area type="monotone" dataKey="saldo" stroke="var(--viz-3)" strokeWidth={2} fill={`url(#f-${uid})`} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface-1)', fill: 'var(--viz-3)' }} animationDuration={1000} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
