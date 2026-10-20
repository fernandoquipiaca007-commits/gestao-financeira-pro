/**
 * AURA — MODELOS DE PÁGINA (ver rules/02-page-templates.md)
 * PageHeader · FormPage · FormSection · SectionNav · ActionBar · useUnsavedChangesGuard
 * Independente do router: recebe callbacks (onBack, onCancel). Com React Router, passa navigate().
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { cn } from './cn';
import { page as pageVariants } from '../motion/motion';
import { Breadcrumb } from './navigation';
import { Button } from './primitives';

/* =============================== PageHeader =============================== */
export function PageHeader({ title, description, breadcrumb, actions, onBack, meta }: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  onBack?: () => void;
  /** Linha de estado por baixo do título (badge de estado, cliente, prazo) */
  meta?: React.ReactNode;
}) {
  useEffect(() => { document.title = `${title} · CodeEngine Manager`; }, [title]);
  return (
    <header className="aura-page-head" style={{ alignItems: 'flex-start' }}>
      <div style={{ minWidth: 0, display: 'grid', gap: 6 }}>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {onBack && (
            <button className="aura-icon-btn aura-icon-btn--sm" aria-label="Voltar" onClick={onBack}><ArrowLeft /></button>
          )}
          <h1 className="aura-h1" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
        </div>
        {meta && <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>{meta}</div>}
        {description && <p className="aura-secondary" style={{ margin: 0 }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </header>
  );
}

/* ================================ ActionBar ================================ */
/**
 * Barra de ações sticky do formulário. Desktop: topo. Mobile: fundo, ação principal a toda a largura.
 * O botão principal fica desativado sem alterações e mostra loading ao guardar.
 */
export function ActionBar({ breadcrumb, onBack, primaryLabel, onPrimary, onCancel, dirty, saving, extra }: {
  breadcrumb: { label: string; href?: string }[];
  onBack?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  onCancel: () => void;
  dirty: boolean;
  saving?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="aura-glass aura-glass--strong aura-actionbar" role="region" aria-label="Ações do formulário">
      <div className="aura-actionbar__crumbs">
        {onBack && <button className="aura-icon-btn aura-icon-btn--sm" aria-label="Voltar" onClick={onBack}><ArrowLeft /></button>}
        <Breadcrumb items={breadcrumb} />
        {dirty && !saving && <span className="aura-badge aura-badge--warning">Alterações por guardar</span>}
      </div>
      <div className="aura-actionbar__actions">
        {extra}
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={onPrimary} disabled={!dirty} loading={saving}>{primaryLabel}</Button>
      </div>
    </div>
  );
}

/* =============================== SectionNav =============================== */
/** Nav lateral com âncoras; realça a secção visível (IntersectionObserver). Escondida <1024px. */
export function SectionNav({ sections }: { sections: { id: string; label: string; danger?: boolean; invalid?: boolean }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav className="aura-sectionnav" aria-label="Secções do formulário">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn('aura-sectionnav__item', s.danger && 'aura-sectionnav__item--danger')}
          aria-current={active === s.id ? 'location' : undefined}
          onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
        >
          {s.label}
          {s.invalid && <span className="aura-sectionnav__dot" aria-label="tem erros" />}
        </a>
      ))}
    </nav>
  );
}

/* =============================== FormSection =============================== */
export function FormSection({ id, title, description, danger, children }: {
  id: string; title: string; description?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('aura-formsection', danger && 'aura-formsection--danger')} aria-labelledby={`${id}-title`}>
      <header>
        <h2 id={`${id}-title`} className="aura-h3" style={{ margin: 0 }}>{title}</h2>
        {description && <p className="aura-secondary" style={{ margin: '4px 0 0', fontSize: 'var(--text-body-sm)' }}>{description}</p>}
      </header>
      <div className="aura-formsection__fields">{children}</div>
    </section>
  );
}

/** Linha com 2 campos curtos relacionados (no mobile empilha). Nunca 3. */
export const FieldRow = ({ children }: { children: [React.ReactNode, React.ReactNode] }) => (
  <div className="aura-fieldrow">{children}</div>
);

/* ================================= FormPage ================================= */
/**
 * Página de criar/editar (modelo C). Uso:
 * <FormPage actionBar={<ActionBar … />} sections={[{id:'geral',label:'Geral'}, …]} onSubmit={save}>
 *   <FormSection id="geral" title="Geral" description="…">…</FormSection>
 * </FormPage>
 */
export function FormPage({ actionBar, sections, onSubmit, children }: {
  actionBar: React.ReactNode;
  sections: { id: string; label: string; danger?: boolean; invalid?: boolean }[];
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSubmit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSubmit]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" exit="exit" className="aura-formpage">
      {actionBar}
      <div className="aura-formpage__body">
        <SectionNav sections={sections} />
        <form ref={formRef} className="aura-formpage__form" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          {children}
        </form>
      </div>
    </motion.div>
  );
}

/* ========================= useUnsavedChangesGuard ========================= */
/**
 * Protege contra perder alterações: fechar/recarregar o separador (beforeunload).
 * Para navegação interna, chamar `confirmLeave()` antes de navegar e mostrar o Modal
 * "Descartar alterações?" [Continuar a editar] [Descartar] quando devolve false.
 * Com React Router v7 usar também `useBlocker(dirty)`.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return { confirmLeave: () => !dirty };
}
