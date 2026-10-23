import React, { useMemo, useState } from 'react';
import { Plus, Send, Edit3, Lock } from 'lucide-react';
import type { Product, Project } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { priceLabel } from '../../lib/priceSheet';
import { ProductEditor, emptyProduct } from './ProductEditor';
import { PriceSheetModal } from './PriceSheetModal';

const KIND_TITLE: Record<Product['kind'], { pt: string; en: string }> = {
  plano: { pt: 'Planos principais', en: 'Main plans' },
  adicional: { pt: 'Adicionais', en: 'Add-ons' },
  auxiliar: { pt: 'Trabalhos auxiliares', en: 'Auxiliary work' },
};

/** Produtos e preços: a tabela de preços da empresa, para dar preços, gerar propostas e criar projetos. */
export function ProductsView({ products, projects, isEn, canEdit, onSave }: {
  products: Product[];
  projects: Project[];
  isEn: boolean;
  canEdit: boolean;
  onSave: (p: Product) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Quanto se fechou de facto em cada plano (projetos criados a partir dele).
  const stats = useMemo(() => {
    const m = new Map<string, { count: number; sum: number }>();
    projects.filter((p) => p.productId).forEach((p) => {
      const s = m.get(p.productId!) || { count: 0, sum: 0 };
      s.count += 1; s.sum += p.totalAmount;
      m.set(p.productId!, s);
    });
    return m;
  }, [projects]);

  const groups = (['plano', 'adicional', 'auxiliar'] as const).map((k) => ({ k, list: products.filter((p) => p.kind === k) })).filter((g) => g.list.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">{isEn ? 'Products & prices' : 'Produtos e preços'}</h1>
          <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">{isEn ? 'What we sell, how much, and what it includes.' : 'O que vendemos, quanto custa e o que inclui.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSheetOpen(true)} className="aura-btn aura-btn--secondary inline-flex"><Send className="w-4 h-4" />{isEn ? 'Price list to send' : 'Tabela para enviar'}</button>
          {canEdit && <button type="button" onClick={() => setEditing(emptyProduct((products.at(-1)?.sortOrder || 0) + 10))} className="aura-btn aura-btn--primary inline-flex"><Plus className="w-4 h-4" />{isEn ? 'New plan' : 'Novo plano'}</button>}
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.k} className="space-y-3">
          <h2 className="aura-h4 m-0">{isEn ? KIND_TITLE[g.k].en : KIND_TITLE[g.k].pt}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {g.list.map((p) => {
              const st = stats.get(p.id);
              return (
                <article key={p.id} className={`bg-glass border border-line-subtle rounded-xl p-5 shadow-glass flex flex-col gap-3 ${p.active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-fg m-0">{p.name}</h3>
                      <span className="text-[12px] text-fg-muted">{p.billing === 'mensal' ? (isEn ? 'Monthly' : 'Mensal') : (isEn ? 'Per project' : 'Por projeto')}{p.active ? '' : (isEn ? ' · inactive' : ' · inativo')}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-[22px] leading-tight text-fg">{priceLabel(p, 'range')}</div>
                    </div>
                  </div>
                  {p.summary && <p className="m-0 text-sm text-fg-secondary">{p.summary}</p>}
                  {!!p.includes.length && (
                    <ul className="m-0 pl-0 list-none grid gap-1">
                      {p.includes.map((i) => <li key={i} className="text-[13px] text-fg flex gap-2"><span className="text-success-fg">✓</span>{i}</li>)}
                    </ul>
                  )}
                  {p.conditions && <p className="m-0 text-[12px] text-fg-muted border-t border-dashed border-line-subtle pt-2">{p.conditions}</p>}
                  {p.internalNotes && <p className="m-0 text-[12px] rounded-md bg-surface-2 px-3 py-2 text-fg-secondary"><Lock className="inline w-3 h-3 mr-1 -mt-0.5" />{p.internalNotes}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-line-subtle">
                    <span className="text-[12px] text-fg-muted">
                      {st ? `${st.count} ${isEn ? (st.count === 1 ? 'project' : 'projects') : st.count === 1 ? 'projeto' : 'projetos'} · ${isEn ? 'average' : 'média'} ${formatCurrency(st.sum / st.count, p.currency)}` : (isEn ? 'No projects yet' : 'Ainda sem projetos')}
                    </span>
                    {canEdit && <button type="button" onClick={() => setEditing(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-soft-fg hover:underline cursor-pointer"><Edit3 className="w-3.5 h-3.5" />{isEn ? 'Edit' : 'Editar'}</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {products.length === 0 && <p className="text-sm text-fg-muted">{isEn ? 'No plans yet.' : 'Ainda sem planos.'}</p>}

      <ProductEditor product={editing} isEn={isEn} onClose={() => setEditing(null)} onSave={onSave} />
      {sheetOpen && <PriceSheetModal products={products} isEn={isEn} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
