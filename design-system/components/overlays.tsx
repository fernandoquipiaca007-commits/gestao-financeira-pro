/**
 * AURA — OVERLAYS
 * Modal (desktop) ↔ BottomSheet (mobile) automático · Drawer · Menu · Tooltip · useMediaQuery
 * Regras:
 *  - Esc fecha · clique no backdrop fecha (exceto formulários com alterações → confirmar) · foco preso dentro.
 *  - Foco inicial no 1º campo (formulário) ou no botão de cancelar (ação destrutiva).
 *  - Ação destrutiva: botão "danger" com verbo explícito ("Eliminar cliente"), nunca "Sim".
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { backdrop, drawer as drawerV, modal as modalV, popover, sheet as sheetV } from '../motion/motion';

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}

function useOverlayBehavior(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea, button:not([data-close])');
      first?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose, panel]);
}

/* ================================= Modal ================================= */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

/** Em <768px renderiza como BottomSheet automaticamente (mesma API). */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panel);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="aura-backdrop" variants={backdrop} initial="hidden" animate="show" exit="exit" onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(isMobile ? 'aura-sheet' : 'aura-modal', !isMobile && size === 'lg' && 'aura-modal--lg')}
            variants={isMobile ? sheetV : modalV}
            initial="hidden"
            animate="show"
            exit="exit"
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          >
            {isMobile && <div className="aura-sheet__grabber" aria-hidden />}
            <div className="aura-modal__head">
              <div>
                <h2 id={titleId} className="aura-modal__title">{title}</h2>
                {description && <p className="aura-modal__desc">{description}</p>}
              </div>
              <button className="aura-icon-btn aura-icon-btn--sm" aria-label="Fechar" data-close onClick={onClose}><X /></button>
            </div>
            <div className="aura-modal__body">{children}</div>
            {footer && <div className="aura-modal__foot">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ================================= Drawer ================================= */
/** Painel lateral para DETALHE de um registo (cliente, fatura) sem perder o contexto da lista. */
export function Drawer({ open, onClose, title, children, footer }: Omit<ModalProps, 'size' | 'description'>) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panel);
  if (isMobile) return <Modal open={open} onClose={onClose} title={title} footer={footer}>{children}</Modal>;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="aura-backdrop" variants={backdrop} initial="hidden" animate="show" exit="exit" onClick={onClose} />
          <motion.aside ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="aura-drawer" variants={drawerV} initial="hidden" animate="show" exit="exit">
            <div className="aura-modal__head">
              <h2 id={titleId} className="aura-modal__title">{title}</h2>
              <button className="aura-icon-btn aura-icon-btn--sm" aria-label="Fechar" data-close onClick={onClose}><X /></button>
            </div>
            <div className="aura-modal__body" style={{ flex: 1 }}>{children}</div>
            {footer && <div className="aura-modal__foot">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ================================== Menu ================================== */
/** Menu contextual ancorado (kebab "⋯", user chip). Fecha ao clicar fora / Esc. */
export function Menu({ trigger, children, align = 'end', label = 'Mais ações' }: {
  trigger: (p: { open: boolean; toggle: () => void }) => React.ReactNode; children: React.ReactNode; align?: 'start' | 'end'; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            className="aura-menu"
            variants={popover}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ position: 'absolute', top: 'calc(100% + 8px)', [align === 'end' ? 'right' : 'left']: 0, ['--origin' as string]: align === 'end' ? 'top right' : 'top left' }}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const MenuItem = ({ icon, danger, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; danger?: boolean }) => (
  <button role="menuitem" type="button" className={cn('aura-menu__item', danger && 'aura-menu__item--danger')} {...rest}>{icon}{children}</button>
);
export const MenuSeparator = () => <div className="aura-menu__sep" role="separator" />;
export const MenuLabel = ({ children }: { children: React.ReactNode }) => <div className="aura-menu__label">{children}</div>;

/* ================================= Tooltip ================================= */
/** Tooltip de ajuda (não usar para informação essencial — essa vai no ecrã). Atraso de 350ms. */
export function Tooltip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactElement; side?: 'top' | 'bottom' }) {
  const [show, setShow] = useState(false);
  const timer = useRef<number>(0);
  const id = useId();
  const open = () => { timer.current = window.setTimeout(() => setShow(true), 350); };
  const close = () => { window.clearTimeout(timer.current); setShow(false); };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={open} onMouseLeave={close} onFocus={open} onBlur={close}>
      {React.cloneElement(children, { 'aria-describedby': id } as never)}
      <AnimatePresence>
        {show && (
          <motion.span
            id={id}
            role="tooltip"
            className="aura-tooltip"
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            style={{ position: 'absolute', left: '50%', translateX: '-50%', whiteSpace: 'nowrap', [side === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)' }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
