import type { Product } from '../types';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface PriceSheetOptions {
  /** Nome da doutora a quem se envia (opcional). */
  clientName?: string;
  /** 'range' mostra "R$ 1.200 – R$ 1.500"; 'from' mostra "a partir de R$ 1.200". */
  priceMode: 'range' | 'from';
  /** Resultados reais (anónimos), uma linha cada. */
  results: string[];
  validDays: number;
}

/** Resultados reais anónimos, do histórico dos projetos. */
export const DEFAULT_RESULTS = [
  'Advogada previdenciarista (professores): 14 contratos fechados com uma só palestra',
  'Funil de aposentadoria especial: 244 inscritos',
  'Campanha recuperada de outra agência: de 50 para cerca de 917 inscritos',
  'Funil mensal de aposentadoria de professores: 171 inscritos e 133 no grupo',
];

export function priceLabel(p: Product, mode: 'range' | 'from'): string {
  const per = p.billing === 'mensal' ? '/mês' : '';
  if (p.kind === 'adicional') return `+ ${brl(p.priceMin)}${per}`;
  if (mode === 'from' || p.priceMin === p.priceMax) return `${p.priceMin === p.priceMax ? '' : 'a partir de '}${brl(p.priceMin)}${per}`;
  return `${brl(p.priceMin)} – ${brl(p.priceMax)}${per}`;
}

/** Página HTML completa (com estilos próprios) pronta a abrir e imprimir em PDF. Nunca inclui as notas internas. */
export function buildPriceSheetHtml(products: Product[], o: PriceSheetOptions): string {
  const today = new Date();
  const valid = new Date(today.getTime() + o.validDays * 86400000).toLocaleDateString('pt-BR');
  const card = (p: Product) => `
    <section class="card${p.kind === 'plano' ? '' : ' card--small'}">
      <div class="card__head">
        <div>
          <span class="tag">${p.kind === 'adicional' ? 'Adicional' : p.kind === 'auxiliar' ? 'Para clientes parceiras' : p.billing === 'mensal' ? 'Mensal' : 'Por projeto'}</span>
          <h2>${esc(p.name)}</h2>
        </div>
        <div class="price">${esc(priceLabel(p, o.priceMode))}</div>
      </div>
      ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}
      ${p.includes.length ? `<ul>${p.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${p.conditions ? `<p class="cond">${esc(p.conditions)}</p>` : ''}
    </section>`;
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CodeEngine — Tabela de preços</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root { --ink:#16140f; --muted:#6b675e; --line:#e7e2d8; --accent:#e8621a; --soft:#fbf3ec; --bg:#fffdf9; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.55 Inter, system-ui, sans-serif; }
  .page { max-width: 820px; margin: 0 auto; padding: 48px 40px 56px; }
  header { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; border-bottom:1px solid var(--line); padding-bottom:24px; margin-bottom:28px; }
  .brand { font-weight:600; letter-spacing:.02em; font-size:14px; color:var(--muted); text-transform:uppercase; }
  h1 { font-family:'Instrument Serif', Georgia, serif; font-weight:400; font-size:44px; line-height:1.05; margin:6px 0 0; }
  .for { color:var(--muted); font-size:14px; text-align:right; }
  .intro { color:var(--muted); margin:0 0 28px; max-width:620px; }
  .card { border:1px solid var(--line); border-radius:16px; padding:22px 24px; margin-bottom:16px; background:#fff; break-inside:avoid; }
  .card--small { background:var(--soft); border-color:#f2e0d2; }
  .card__head { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
  .tag { display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--accent); }
  h2 { font-size:20px; margin:4px 0 0; font-weight:600; }
  .price { font-family:'Instrument Serif', Georgia, serif; font-size:26px; white-space:nowrap; }
  .summary { margin:10px 0 0; }
  ul { margin:12px 0 0; padding:0; list-style:none; columns:2; column-gap:28px; }
  li { padding-left:20px; position:relative; margin:0 0 6px; break-inside:avoid; font-size:14px; }
  li::before { content:'✓'; position:absolute; left:0; color:var(--accent); font-weight:600; }
  .cond { margin:12px 0 0; font-size:13px; color:var(--muted); border-top:1px dashed var(--line); padding-top:10px; }
  .results { margin-top:28px; padding:22px 24px; border-radius:16px; background:var(--ink); color:#fff; break-inside:avoid; }
  .results h3 { margin:0 0 10px; font-family:'Instrument Serif', Georgia, serif; font-weight:400; font-size:24px; }
  .results li::before { color:#ffb37f; }
  footer { margin-top:28px; color:var(--muted); font-size:13px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
  @media (max-width: 640px) { .page { padding:28px 18px; } header, .card__head { flex-direction:column; align-items:flex-start; } .for { text-align:left; } ul { columns:1; } h1 { font-size:36px; } }
  @media print { body { background:#fff; } .page { padding:24px; } @page { size:A4; margin:14mm; } }
</style></head><body><div class="page">
<header>
  <div><div class="brand">CodeEngine · Tráfego para advogados</div><h1>Planos e investimento</h1></div>
  <div class="for">${o.clientName ? `Proposta para<br><strong>${esc(o.clientName)}</strong><br>` : ''}${today.toLocaleDateString('pt-BR')}</div>
</header>
<p class="intro">Estruturamos campanhas que levam as pessoas certas até à sua palestra ou ao seu WhatsApp. Cuidamos da parte técnica — página, anúncios, rastreamento e acompanhamento — para que a doutora se concentre em atender e fechar contratos.</p>
${products.map(card).join('')}
${o.results.length ? `<div class="results"><h3>Resultados reais de clientes</h3><ul>${o.results.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
<footer><span>Valores válidos até ${valid}. A verba dos anúncios é paga diretamente ao Meta.</span><span>CodeEngine</span></footer>
</div></body></html>`;
}

/** Texto curto para colar no WhatsApp. */
export function buildPriceSheetText(products: Product[], o: PriceSheetOptions): string {
  const lines = [`*CodeEngine — Planos e investimento*${o.clientName ? `\nPara: ${o.clientName}` : ''}`, ''];
  for (const p of products) {
    lines.push(`*${p.name}* — ${priceLabel(p, o.priceMode)}`);
    if (p.summary) lines.push(p.summary);
    p.includes.forEach((i) => lines.push(`✓ ${i}`));
    if (p.conditions) lines.push(`_${p.conditions}_`);
    lines.push('');
  }
  if (o.results.length) { lines.push('*Resultados reais*'); o.results.forEach((r) => lines.push(`• ${r}`)); lines.push(''); }
  lines.push('A verba dos anúncios é paga diretamente ao Meta.');
  return lines.join('\n');
}
