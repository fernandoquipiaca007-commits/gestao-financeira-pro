import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bold, CheckSquare, Heading2, Link2, List, Minus, Quote, Sparkles } from 'lucide-react';
import { MarkdownView, toggleNthCheckbox } from './MarkdownView';

export type RichTemplate = 'task' | 'project' | 'client';

const TEMPLATES: Record<RichTemplate, { pt: string; en: string }> = {
  task: {
    pt: '## Objetivo\n\n\n## Contexto\n\n\n## Critérios de aceitação\n- \n\n## Checklist\n- [ ] \n- [ ] \n\n## Links\n- ',
    en: '## Goal\n\n\n## Context\n\n\n## Acceptance criteria\n- \n\n## Checklist\n- [ ] \n- [ ] \n\n## Links\n- ',
  },
  project: {
    pt: '## Âmbito\n\n\n## Entregáveis\n- [ ] \n- [ ] \n\n## Marcos\n- \n\n## Notas de faturação\n',
    en: '## Scope\n\n\n## Deliverables\n- [ ] \n- [ ] \n\n## Milestones\n- \n\n## Billing notes\n',
  },
  client: {
    pt: '## Contexto\n\n\n## Preferências\n- Canal preferido: \n- Melhor horário: \n\n## Histórico\n- ',
    en: '## Context\n\n\n## Preferences\n- Preferred channel: \n- Best time: \n\n## History\n- ',
  },
};

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  lang: 'pt' | 'en';
  template?: RichTemplate;
  placeholder?: string;
  hint?: string;
}

/**
 * Campo de descrição rica (Markdown). Barra simples, Escrever/Pré-visualizar, modelo para começar,
 * cresce com o conteúdo e guarda texto simples — compatível com as colunas TEXT existentes.
 */
export function RichTextField({ id, label, value, onChange, lang, template, placeholder, hint }: Props) {
  const en = lang === 'en';
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(320, el.scrollHeight + 2)}px`;
  }, [value, tab]);

  // Ctrl/⌘+B para negrito dentro do campo
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); wrap('**', '**', en ? 'bold text' : 'texto em negrito'); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  });

  const apply = (next: string, selStart: number, selEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(selStart, selEnd); });
  };
  const wrap = (before: string, after: string, fallback: string) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || fallback;
    apply(value.slice(0, a) + before + sel + after + value.slice(b), a + before.length, a + before.length + sel.length);
  };
  const linePrefix = (prefix: string) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const lineStart = value.lastIndexOf('\n', a - 1) + 1;
    const block = value.slice(lineStart, b);
    const changed = block.split('\n').map((l) => (l.startsWith(prefix) ? l : prefix + l)).join('\n');
    apply(value.slice(0, lineStart) + changed + value.slice(b), lineStart, lineStart + changed.length);
  };
  const insertBlock = (text: string) => {
    const el = ref.current; if (!el) return;
    const a = el.selectionStart;
    const pre = a > 0 && value[a - 1] !== '\n' ? '\n' : '';
    apply(value.slice(0, a) + pre + text + value.slice(a), a + pre.length + text.length, a + pre.length + text.length);
  };

  const tools = [
    { icon: Heading2, label: en ? 'Heading' : 'Título', run: () => linePrefix('## ') },
    { icon: Bold, label: en ? 'Bold (Ctrl+B)' : 'Negrito (Ctrl+B)', run: () => wrap('**', '**', en ? 'bold text' : 'texto em negrito') },
    { icon: List, label: en ? 'List' : 'Lista', run: () => linePrefix('- ') },
    { icon: CheckSquare, label: 'Checklist', run: () => linePrefix('- [ ] ') },
    { icon: Link2, label: 'Link', run: () => wrap('[', '](https://)', en ? 'link text' : 'texto do link') },
    { icon: Quote, label: en ? 'Quote' : 'Citação', run: () => linePrefix('> ') },
    { icon: Minus, label: en ? 'Divider' : 'Divisor', run: () => insertBlock('\n---\n') },
  ];
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="aura-field">
      <div className="flex items-center justify-between gap-3">
        <label className="aura-label" htmlFor={id}>{label}</label>
        <div className="aura-segmented" role="tablist" aria-label={label}>
          <button type="button" role="tab" aria-selected={tab === 'write'} className="aura-segmented__item" onClick={() => setTab('write')}>{en ? 'Write' : 'Escrever'}</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} className="aura-segmented__item" onClick={() => setTab('preview')}>{en ? 'Preview' : 'Pré-visualizar'}</button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface-1/70 overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-ring)] transition-shadow">
        {tab === 'write' ? (
          <>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--divider)] px-2 py-1.5 bg-surface-2/60">
              {tools.map((t) => (
                <button key={t.label} type="button" onClick={t.run} title={t.label} aria-label={t.label} className="grid place-items-center w-8 h-8 rounded-md text-fg-secondary hover:bg-sunken hover:text-fg cursor-pointer">
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
              {template && !value.trim() && (
                <button type="button" onClick={() => onChange(TEMPLATES[template][en ? 'en' : 'pt'])} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-[12.5px] font-medium text-accent-soft-fg hover:bg-accent-soft cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" />{en ? 'Use template' : 'Usar modelo'}
                </button>
              )}
            </div>
            <textarea
              ref={ref}
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || (en ? 'Write freely. Use the toolbar for headings, lists and checklists.' : 'Escreva à vontade. Use a barra para títulos, listas e checklists.')}
              className="block w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-[1.65] text-fg placeholder:text-fg-muted outline-none font-sans"
              style={{ minHeight: 320 }}
            />
          </>
        ) : (
          <div className="min-h-[320px] px-5 py-4">
            {value.trim()
              ? <MarkdownView source={value} onToggleCheck={(i) => onChange(toggleNthCheckbox(value, i))} />
              : <p className="text-fg-muted text-sm m-0">{en ? 'Nothing to preview yet.' : 'Ainda não há nada para pré-visualizar.'}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-[12px] text-fg-muted">
        <span>{hint || (en ? 'Markdown supported: ## heading, **bold**, - list, - [ ] checklist' : 'Suporta Markdown: ## título, **negrito**, - lista, - [ ] checklist')}</span>
        <span className="tabular-nums shrink-0">{words} {en ? 'words' : 'palavras'}</span>
      </div>
    </div>
  );
}
