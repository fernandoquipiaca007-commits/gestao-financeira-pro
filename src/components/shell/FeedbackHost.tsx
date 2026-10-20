import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { dismissToast, getConfirm, getToasts, resolveConfirm, subscribeFeedback } from '../../lib/feedback';
import { useLanguage } from '../../contexts/LanguageContext';

const icons = { neutral: Info, success: CheckCircle2, danger: XCircle, warning: AlertTriangle };

/** Mostra os toasts e o modal de confirmação pedidos por src/lib/feedback.ts. Montar uma vez. */
export function FeedbackHost() {
  const toasts = useSyncExternalStore(subscribeFeedback, getToasts);
  const confirm = useSyncExternalStore(subscribeFeedback, getConfirm);
  const { lang } = useLanguage();
  const en = lang === 'en';
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm) return;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') resolveConfirm(false); };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [confirm]);

  return createPortal(
    <>
      <div className="aura-toaster" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.tone || 'neutral'];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="aura-toast"
                role={t.tone === 'danger' ? 'alert' : 'status'}
              >
                <span className={`aura-toast__icon ${t.tone && t.tone !== 'neutral' ? `aura-toast__icon--${t.tone}` : ''}`}><Icon size={16} /></span>
                <div className="min-w-0">
                  <div className="aura-toast__title">{t.title}</div>
                  {t.description && <div className="aura-toast__desc">{t.description}</div>}
                  {t.action && (
                    <button type="button" className="aura-btn aura-btn--link mt-1.5 !text-[var(--aura-ember-300)]" onClick={() => { t.action!.onClick(); dismissToast(t.id); }}>
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button type="button" className="aura-toast__close" aria-label={en ? 'Close' : 'Fechar'} onClick={() => dismissToast(t.id)}><X size={16} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirm && (
          <>
            <motion.div className="aura-backdrop !z-[1090]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => resolveConfirm(false)} />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="aura-modal !z-[1095] !w-[min(460px,calc(100vw-32px))]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
            >
              <div className="aura-modal__head">
                <div>
                  <h2 id="confirm-title" className="aura-modal__title">{confirm.title}</h2>
                  {confirm.description && <p className="aura-modal__desc">{confirm.description}</p>}
                </div>
              </div>
              <div className="aura-modal__foot">
                <button ref={cancelRef} type="button" className="aura-btn aura-btn--ghost" onClick={() => resolveConfirm(false)}>{confirm.cancelLabel || (en ? 'Cancel' : 'Cancelar')}</button>
                <button type="button" className={`aura-btn ${confirm.danger ? 'aura-btn--danger' : 'aura-btn--primary'}`} onClick={() => resolveConfirm(true)}>{confirm.confirmLabel}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
