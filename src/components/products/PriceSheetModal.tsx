import React, { useMemo, useState } from 'react';
import { X, Printer, Copy, Check } from 'lucide-react';
import type { Product } from '../../types';
import { buildPriceSheetHtml, buildPriceSheetText, DEFAULT_RESULTS } from '../../lib/priceSheet';

const input = 'w-full bg-surface-2 border border-line-subtle rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent';

/** Escolher os planos, ver a tabela de preços e imprimir em PDF ou copiar para o WhatsApp. */
export function PriceSheetModal({ products, isEn, onClose }: { products: Product[]; isEn: boolean; onClose: () => void }) {
  const active = products.filter((p) => p.active);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(active.filter((p) => p.kind !== 'auxiliar').map((p) => p.id)));
  const [clientName, setClientName] = useState('');
  const [priceMode, setPriceMode] = useState<'range' | 'from'>('range');
  const [showResults, setShowResults] = useState(true);
  const [copied, setCopied] = useState(false);

  const chosen = active.filter((p) => picked.has(p.id));
  const opts = { clientName: clientName.trim() || undefined, priceMode, results: showResults ? DEFAULT_RESULTS : [], validDays: 15 };
  const html = useMemo(() => buildPriceSheetHtml(chosen, opts), [chosen, clientName, priceMode, showResults]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setPicked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 300);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(buildPriceSheetText(chosen, opts)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão */ }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch sm:items-center justify-center bg-black/40 sm:p-6" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface-1 w-full sm:max-w-6xl h-full sm:h-[90vh] sm:rounded-2xl border border-line-subtle shadow-glass grid lg:grid-cols-[320px_minmax(0,1fr)] overflow-hidden text-fg">
        <aside className="p-5 border-b lg:border-b-0 lg:border-r border-line-subtle overflow-y-auto grid content-start gap-4">
          <div className="flex items-center justify-between">
            <h2 className="aura-h4 m-0">{isEn ? 'Price list' : 'Tabela de preços'}</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-sunken cursor-pointer" aria-label={isEn ? 'Close' : 'Fechar'}><X className="w-4 h-4" /></button>
          </div>
          <label className="grid gap-1 text-[13px] text-fg-secondary">{isEn ? 'For (client name, optional)' : 'Para (nome da doutora, opcional)'}
            <input className={input} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Dra …" />
          </label>
          <div className="grid gap-1.5">
            <span className="text-[13px] text-fg-secondary">{isEn ? 'Plans to include' : 'Planos a incluir'}</span>
            {active.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="mt-1" checked={picked.has(p.id)} onChange={() => toggle(p.id)} />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
          <label className="grid gap-1 text-[13px] text-fg-secondary">{isEn ? 'Show price as' : 'Mostrar o preço como'}
            <select className={`${input} cursor-pointer`} value={priceMode} onChange={(e) => setPriceMode(e.target.value as 'range' | 'from')}>
              <option value="range">{isEn ? 'Range (R$ 1,200 – R$ 1,500)' : 'Faixa (R$ 1.200 – R$ 1.500)'}</option>
              <option value="from">{isEn ? 'From (from R$ 1,200)' : 'A partir de (a partir de R$ 1.200)'}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} />{isEn ? 'Show real results (anonymous)' : 'Mostrar resultados reais (anónimos)'}</label>
          <div className="grid gap-2 pt-2">
            <button type="button" onClick={print} disabled={!chosen.length} className="aura-btn aura-btn--primary inline-flex justify-center"><Printer className="w-4 h-4" />{isEn ? 'Open to print / save PDF' : 'Abrir para imprimir / guardar PDF'}</button>
            <button type="button" onClick={copy} disabled={!chosen.length} className="aura-btn aura-btn--secondary inline-flex justify-center">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy text for WhatsApp' : 'Copiar texto para WhatsApp')}</button>
          </div>
          <p className="m-0 text-[12px] text-fg-muted">{isEn ? 'Internal notes are never included.' : 'As notas internas nunca entram na tabela.'}</p>
        </aside>
        <iframe title={isEn ? 'Preview' : 'Pré-visualização'} srcDoc={html} className="w-full h-full min-h-[60vh] bg-white border-0" />
      </div>
    </div>
  );
}
