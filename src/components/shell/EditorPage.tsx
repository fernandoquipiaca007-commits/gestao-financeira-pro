import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Ecrã completo para criar/editar (Regra 01 e modelo C da Regra 02).
 * Substitui os modais grandes: fundo translúcido Aura, barra superior fixa
 * com "Voltar" + caminho + ações, coluna de formulário até 760px alinhada
 * à esquerda e navegação de secções opcional.
 *
 * As ações (Guardar/Cancelar) ficam no topo no desktop e no fundo no mobile.
 * Para botões de submit fora do <form>, usar o atributo form="<id do form>".
 */
export interface EditorSection { id: string; label: string; danger?: boolean }

interface Props {
  title: React.ReactNode;
  /** Caminho mostrado antes do título, ex.: ['Projetos'] */
  trail?: string[];
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  sections?: EditorSection[];
  /** Largura da coluna principal (padrão 760) */
  width?: 'form' | 'wide';
  children: React.ReactNode;
}

export function EditorPage({ title, trail = [], subtitle, icon, onClose, actions, sections, width = 'form', children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 96, behavior: 'smooth' });
  };

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-page-title"
      className="aura-root aura-canvas aura-app fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="aura-canvas__aurora" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="aura-canvas__grid" aria-hidden="true" />
        <div className="aura-canvas__vignette" aria-hidden="true" />
      <div className="aura-canvas__noise" aria-hidden="true" />

      {/* Barra superior */}
      <div className="shrink-0 px-3 sm:px-4 lg:px-6 pt-3">
        <div className="mx-auto max-w-[1240px] aura-glass aura-glass--strong !rounded-full flex items-center gap-3 h-[60px] pl-2 pr-2">
          <button type="button" onClick={onClose} className="aura-icon-btn aura-icon-btn--sm shrink-0" aria-label="Voltar">
            <ArrowLeft />
          </button>
          <nav aria-label="Caminho" className="min-w-0 flex-1">
            <ol className="aura-breadcrumb m-0 p-0 list-none min-w-0">
              {trail.map((t) => (
                <li key={t} className="hidden sm:flex items-center gap-2 shrink-0"><span>{t}</span><span aria-hidden>›</span></li>
              ))}
              <li aria-current="page" className="truncate font-medium text-fg">{title}</li>
            </ol>
          </nav>
          {actions && <div className="hidden md:flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Conteúdo */}
      <div ref={scrollRef} className="aura-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-6 pb-32 md:pb-16">
        <div className={`mx-auto max-w-[1240px] grid gap-10 pt-8 ${sections?.length ? 'lg:grid-cols-[208px_minmax(0,1fr)]' : ''}`}>
          {sections?.length ? (
            <nav className="hidden lg:grid aura-sectionnav h-max" aria-label="Secções">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); goTo(s.id); }} className={`aura-sectionnav__item ${s.danger ? 'aura-sectionnav__item--danger' : ''}`}>
                  {s.label}
                </a>
              ))}
            </nav>
          ) : null}
          <div className={`min-w-0 w-full ${width === 'form' ? 'max-w-[760px]' : 'max-w-[1100px]'}`}>
            <header className="flex items-start gap-4 mb-8">
              {icon && <span className="aura-stat__icon !w-12 !h-12 shrink-0 bg-glass-strong shadow-glass">{icon}</span>}
              <div className="min-w-0">
                <h1 id="editor-page-title" className="aura-h1 m-0">{title}</h1>
                {subtitle && <p className="mt-1.5 mb-0 text-fg-secondary text-[15px]">{subtitle}</p>}
              </div>
            </header>
            {children}
          </div>
        </div>
      </div>

      {/* Ações no mobile */}
      {actions && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-10 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] aura-glass aura-glass--strong !rounded-b-none flex gap-2 [&>*:last-child]:flex-1">
          {actions}
        </div>
      )}
    </motion.div>,
    document.body,
  );
}

/** Secção do formulário: título + descrição curta + campos (divisor entre secções). */
export function EditorSection({ id, title, description, danger, children }: {
  id: string; title: string; description?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <section id={id} className={`aura-formsection ${danger ? 'aura-formsection--danger' : ''}`} aria-labelledby={`${id}-t`}>
      <header>
        <h2 id={`${id}-t`} className="aura-h3 m-0">{title}</h2>
        {description && <p className="mt-1 mb-0 text-fg-secondary text-[13px]">{description}</p>}
      </header>
      <div className="aura-formsection__fields">{children}</div>
    </section>
  );
}
