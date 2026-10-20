import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/**
 * Mostra Markdown de forma segura (sem HTML cru). Com onToggleCheck, as checkboxes ficam clicáveis
 * e devolvem o índice da checkbox (ordem no texto).
 */
export function MarkdownView({ source, onToggleCheck, className = '' }: { source: string; onToggleCheck?: (index: number) => void; className?: string }) {
  let checkIndex = -1;
  return (
    <div className={`aura-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
          input: ({ type, checked }) => {
            if (type !== 'checkbox') return null;
            checkIndex += 1;
            const idx = checkIndex;
            return (
              <input
                type="checkbox"
                className="aura-check !w-[18px] !h-[18px] mr-2 align-[-3px]"
                checked={!!checked}
                disabled={!onToggleCheck}
                onChange={() => onToggleCheck?.(idx)}
              />
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

/** Alterna a n-ésima checkbox Markdown (- [ ] ↔ - [x]) no texto. */
export function toggleNthCheckbox(text: string, n: number) {
  let i = -1;
  return text.replace(/^(\s*[-*] )\[( |x|X)\]/gm, (m, prefix, mark) => {
    i += 1;
    if (i !== n) return m;
    return `${prefix}[${mark === ' ' ? 'x' : ' '}]`;
  });
}

/** Texto simples a partir de Markdown, para pré-visualizações curtas (cartões, listas). */
export function markdownToPlain(md: string) {
  return md
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*] \[( |x|X)\]\s*/gm, '• ')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^-{3,}$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
