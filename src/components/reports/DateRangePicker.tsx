import React from 'react';
import { CalendarRange } from 'lucide-react';

export interface DateRange { from: string; to: string } // 'YYYY-MM-DD'; '' = sem limite

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Atalhos como no gerador de relatórios do Meta. */
export function rangePresets(today = new Date()): { id: string; pt: string; en: string; range: DateRange }[] {
  const y = today.getFullYear();
  const m = today.getMonth();
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  return [
    { id: 'today', pt: 'Hoje', en: 'Today', range: { from: iso(today), to: iso(today) } },
    { id: '7d', pt: 'Últimos 7 dias', en: 'Last 7 days', range: { from: daysAgo(6), to: iso(today) } },
    { id: '30d', pt: 'Últimos 30 dias', en: 'Last 30 days', range: { from: daysAgo(29), to: iso(today) } },
    { id: 'month', pt: 'Este mês', en: 'This month', range: { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) } },
    { id: 'lastMonth', pt: 'Mês passado', en: 'Last month', range: { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) } },
    { id: '90d', pt: 'Últimos 3 meses', en: 'Last 3 months', range: { from: iso(new Date(y, m - 2, 1)), to: iso(new Date(y, m + 1, 0)) } },
    { id: 'year', pt: 'Este ano', en: 'This year', range: { from: `${y}-01-01`, to: `${y}-12-31` } },
    { id: 'all', pt: 'Todo o histórico', en: 'All time', range: { from: '', to: '' } },
  ];
}

export function rangeLabel(r: DateRange, en = false): string {
  const fmt = (s: string) => s.split('-').reverse().join('/');
  if (!r.from && !r.to) return en ? 'All time' : 'Todo o histórico';
  if (r.from && r.to) return r.from === r.to ? fmt(r.from) : `${fmt(r.from)} – ${fmt(r.to)}`;
  return r.from ? `${en ? 'From' : 'Desde'} ${fmt(r.from)}` : `${en ? 'Until' : 'Até'} ${fmt(r.to)}`;
}

export function DateRangePicker({ value, onChange, lang }: { value: DateRange; onChange: (r: DateRange) => void; lang: 'pt' | 'en' }) {
  const en = lang === 'en';
  const presets = rangePresets();
  const active = presets.find((p) => p.range.from === value.from && p.range.to === value.to)?.id;
  const input = 'w-full px-3 py-2 bg-surface-2 border border-line-subtle rounded-md text-fg text-xs font-medium focus:outline-none focus:border-accent cursor-pointer';

  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.range)}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${active === p.id ? 'bg-primary text-primary-fg shadow-primary-3d' : 'bg-surface-2 text-fg-secondary hover:text-fg border border-line-subtle'}`}
          >
            {en ? p.en : p.pt}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2">
        <CalendarRange className="w-4 h-4 text-fg-muted" />
        <label className="sr-only" htmlFor="report-from">{en ? 'From' : 'De'}</label>
        <input
          id="report-from"
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          className={input}
          aria-label={en ? 'From' : 'De'}
        />
        <span className="text-[12px] text-fg-muted">{en ? 'to' : 'até'}</span>
        <input
          id="report-to"
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          className={input}
          aria-label={en ? 'To' : 'Até'}
        />
      </div>
    </div>
  );
}
