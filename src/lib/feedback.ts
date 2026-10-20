/**
 * Feedback global (Regra 04 do design system Aura) — substitui alert()/confirm() do browser.
 *   toast({ tone: 'success', title: 'Projeto atualizado' })
 *   if (await confirmAction({ title: 'Eliminar o cliente X?', description: '…', confirmLabel: 'Eliminar cliente', danger: true })) { … }
 * O <FeedbackHost /> (montado uma vez no App) mostra os toasts e o modal.
 */
export type ToastTone = 'neutral' | 'success' | 'danger' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Ação opcional (ex.: "Anular"). Toasts com ação ficam 8s. */
  action?: { label: string; onClick: () => void };
}

export interface ToastItem extends ToastOptions { id: number; key: string }

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions { resolve: (ok: boolean) => void }

type Listener = () => void;
const listeners = new Set<Listener>();
let toasts: ToastItem[] = [];
let confirmReq: ConfirmRequest | null = null;
let seq = 0;

const emit = () => listeners.forEach((l) => l());

export function subscribeFeedback(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
export const getToasts = () => toasts;
export const getConfirm = () => confirmReq;

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Mostra um toast. A mesma mensagem nos últimos segundos substitui a anterior (sem empilhar). Máx. 3. */
export function toast(opts: ToastOptions) {
  const key = `${opts.tone || 'neutral'}|${opts.title}|${opts.description || ''}`;
  toasts = toasts.filter((t) => t.key !== key);
  const item: ToastItem = { tone: 'neutral', ...opts, id: ++seq, key };
  toasts = [...toasts, item].slice(-3);
  emit();
  const ms = opts.tone === 'danger' ? 7000 : opts.action ? 8000 : 4000;
  window.setTimeout(() => dismissToast(item.id), ms);
}

/** Pede confirmação num modal Aura. Resolve true (confirmar) ou false (cancelar/Esc/fora). */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmReq?.resolve(false);
    confirmReq = { ...opts, resolve };
    emit();
  });
}

export function resolveConfirm(ok: boolean) {
  const r = confirmReq;
  confirmReq = null;
  emit();
  r?.resolve(ok);
}
