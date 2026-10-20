/**
 * AURA — FORMULÁRIOS
 * Field · Input · SearchInput · MoneyInput · Textarea · Select · Checkbox · Radio · Switch · SegmentedControl
 * Regras:
 *  - Todo o controlo tem <label> visível (placeholder NÃO é label).
 *  - Erro: borda danger + mensagem abaixo que diz COMO corrigir ("Indique um email válido, ex.: ana@empresa.pt").
 *  - Validar ao sair do campo (blur) e ao submeter; nunca enquanto o utilizador escreve a 1ª vez.
 *  - Mobile: inputs com 16px+ (evita zoom no iOS) → já garantido por --text-body ≥ 15px + font-size: max(16px) abaixo.
 */
import React, { forwardRef, useId } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Search } from 'lucide-react';
import { cn } from './cn';
import { spring } from '../motion/motion';
import { Kbd } from './primitives';

/* ================================= Field ================================= */
export function Field({ label, hint, error, required, htmlFor, children, className }: {
  label: string; hint?: string; error?: string; required?: boolean; htmlFor: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('aura-field', className)}>
      <label className="aura-label" htmlFor={htmlFor}>
        {label} {required && <span className="aura-label__req" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p className="aura-error" id={`${htmlFor}-error`} role="alert">
          <AlertCircle size={14} aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p className="aura-hint" id={`${htmlFor}-hint`}>{hint}</p>
      ) : null}
    </div>
  );
}

/* ================================= Input ================================= */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  leftIcon?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', pill, leftIcon, prefix, suffix, invalid, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div
      className={cn('aura-input-wrap', size !== 'md' && `aura-input-wrap--${size}`, pill && 'aura-input-wrap--pill', className)}
      aria-invalid={invalid || undefined}
    >
      {leftIcon}
      {prefix && <span className="aura-input-affix">{prefix}</span>}
      <input
        ref={ref}
        id={inputId}
        className="aura-input"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : `${inputId}-hint`}
        style={{ fontSize: 'max(16px, var(--text-body))' }}
        {...rest}
      />
      {suffix && <span className="aura-input-affix">{suffix}</span>}
    </div>
  );
});

/** Pesquisa global (topbar). Atalho ⌘K / Ctrl K abre a command palette. */
export function SearchInput({ shortcut = true, className, ...rest }: InputProps & { shortcut?: boolean }) {
  return (
    <Input
      pill
      leftIcon={<Search aria-hidden />}
      suffix={shortcut ? <Kbd>⌘K</Kbd> : undefined}
      placeholder="Pesquisar clientes, faturas, projetos…"
      type="search"
      className={className}
      {...rest}
    />
  );
}

/** Valor monetário: prefixo da moeda, teclado decimal no mobile, alinhado à direita. */
export const MoneyInput = forwardRef<HTMLInputElement, InputProps & { currencySymbol?: string }>(function MoneyInput(
  { currencySymbol = '€', ...rest },
  ref,
) {
  return <Input ref={ref} inputMode="decimal" prefix={currencySymbol} style={{ textAlign: 'right' }} {...rest} />;
});

/* =============================== Textarea =============================== */
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cn('aura-textarea', className)} {...rest} />;
});

/* ================================ Select ================================ */
/** Select nativo (melhor no mobile). Para pesquisa/multi-seleção usar um Combobox sobre .aura-menu. */
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}>(function Select({ options, className, ...rest }, ref) {
  return (
    <select ref={ref} className={cn('aura-select', className)} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
});

/* ============================ Checkbox · Radio ============================ */
export function Checkbox({ label, description, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode; description?: React.ReactNode;
}) {
  const box = <input type="checkbox" className={cn('aura-check', className)} {...rest} />;
  if (!label) return box;
  return (
    <label className="aura-option">
      {box}
      <span>
        {label}
        {description && <span className="aura-option__desc">{description}</span>}
      </span>
    </label>
  );
}

export function Radio({ label, description, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode; description?: React.ReactNode;
}) {
  return (
    <label className="aura-option">
      <input type="radio" className="aura-radio" {...rest} />
      <span>
        {label}
        {description && <span className="aura-option__desc">{description}</span>}
      </span>
    </label>
  );
}

/* ================================ Switch ================================ */
export function Switch({ label, accent, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; accent?: boolean }) {
  return (
    <label className="aura-option" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <input type="checkbox" role="switch" className={cn('aura-switch', accent && 'aura-switch--accent')} {...rest} />
    </label>
  );
}

/* =========================== SegmentedControl =========================== */
/** Alterna vistas/períodos (7D · 30D · 90D · 12M). Indicador desliza com layoutId. */
export function SegmentedControl<T extends string>({ value, onChange, options, label, id = 'seg' }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; id?: string;
}) {
  return (
    <div className="aura-segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className="aura-segmented__item"
            style={active ? { background: 'transparent', boxShadow: 'none' } : undefined}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                layoutId={`${id}-indicator`}
                transition={spring.smooth}
                style={{ position: 'absolute', inset: 0, zIndex: -1, borderRadius: 999, background: 'var(--surface-1)', boxShadow: 'var(--shadow-sm)' }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
