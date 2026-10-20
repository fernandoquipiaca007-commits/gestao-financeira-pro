import React from 'react';

/** Tooltip de vidro escuro para todos os gráficos Recharts (legível nos dois temas). */
export function AuraTooltip({ active, payload, label, format, labels }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string; payload?: Record<string, unknown> }[];
  label?: string | number;
  format: (v: number) => string;
  labels?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="aura-tooltip !pointer-events-none min-w-[150px]">
      {label != null && <div className="opacity-70 mb-1 capitalize">{String(label)}</div>}
      <div className="grid gap-1">
        {payload.map((p) => (
          <div key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} aria-hidden />
            <span className="opacity-80 flex-1">{labels?.[String(p.dataKey)] ?? p.name}</span>
            <span className="aura-tooltip__value tabular-nums">{format(Number(p.value) || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Legenda compacta (≥2 séries). O texto usa tokens de texto; a cor só no marcador. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-fg-secondary">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Valores compactos para eixos: 1,2 mil · 3,4 M */
export function compactNumber(v: number, lang: 'pt' | 'en' = 'pt') {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}
