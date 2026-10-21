import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { PIPELINE_STAGES, type Client, type PipelineStage } from '../../types';

export type ClientProfile = Pick<Client, 'taxId' | 'website' | 'address' | 'city' | 'postalCode' | 'contactName' | 'contactRole' | 'preferredChannel' | 'paymentTermsDays' | 'tags' | 'source'
  | 'pipelineStage' | 'isFavorite' | 'rating' | 'contractType' | 'nextContactDate' | 'nextAction' | 'lastContactAt' | 'summary'>;

const input = 'w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all';
const label = 'text-[13px] font-medium text-fg-secondary block mb-1.5';

function Field({ id, text, children }: { id: string; text: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={label}>{text}</label>
      {children}
    </div>
  );
}

/** Secções extra da ficha de cliente: identificação fiscal, contacto, morada, condições e etiquetas. */
export function ClientProfileFields({ value, onChange, lang }: { value: ClientProfile; onChange: (v: ClientProfile) => void; lang: 'pt' | 'en' }) {
  const en = lang === 'en';
  const [tagDraft, setTagDraft] = useState('');
  const set = <K extends keyof ClientProfile>(k: K, v: ClientProfile[K]) => onChange({ ...value, [k]: v });
  const addTag = () => {
    const t = tagDraft.trim().replace(/,$/, '');
    if (!t) return;
    const tags = Array.from(new Set([...(value.tags || []), t]));
    set('tags', tags);
    setTagDraft('');
  };

  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="aura-h4 m-0">{en ? 'Sales follow-up' : 'Acompanhamento comercial'}</h3>
          <button
            type="button"
            onClick={() => set('isFavorite', !value.isFavorite)}
            aria-pressed={Boolean(value.isFavorite)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${value.isFavorite ? 'bg-warning-soft text-warning-fg' : 'bg-surface-2 text-fg-secondary hover:bg-sunken'}`}
          >
            <Star size={14} fill={value.isFavorite ? 'currentColor' : 'none'} />
            {en ? 'Favourite' : 'Preferida'}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cp-stage" text={en ? 'Stage' : 'Fase'}>
            <select id="cp-stage" className={`${input} cursor-pointer`} value={value.pipelineStage || ''} onChange={(e) => set('pipelineStage', (e.target.value || undefined) as PipelineStage | undefined)}>
              <option value="">{en ? 'Not defined' : 'Não definida'}</option>
              {PIPELINE_STAGES.map((st) => <option key={st.key} value={st.key}>{en ? st.en : st.pt}</option>)}
            </select>
          </Field>
          <Field id="cp-rating" text={en ? 'Rating (1–5)' : 'Classificação (1–5)'}>
            <select id="cp-rating" className={`${input} cursor-pointer`} value={value.rating ?? ''} onChange={(e) => set('rating', e.target.value === '' ? undefined : Number(e.target.value))}>
              <option value="">—</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
          </Field>
          <Field id="cp-contract" text={en ? 'Contract type' : 'Tipo de contrato'}>
            <input id="cp-contract" className={input} value={value.contractType || ''} onChange={(e) => set('contractType', e.target.value)} placeholder={en ? 'e.g. Talk funnel, monthly traffic' : 'ex.: Funil de palestra, tráfego mensal'} />
          </Field>
          <Field id="cp-last" text={en ? 'Last contact' : 'Último contacto'}>
            <input id="cp-last" type="date" className={input} value={value.lastContactAt || ''} onChange={(e) => set('lastContactAt', e.target.value || undefined)} />
          </Field>
          <Field id="cp-next" text={en ? 'Next contact' : 'Próximo contacto'}>
            <input id="cp-next" type="date" className={input} value={value.nextContactDate || ''} onChange={(e) => set('nextContactDate', e.target.value || undefined)} />
          </Field>
          <Field id="cp-action" text={en ? 'Next step' : 'Próximo passo'}>
            <input id="cp-action" className={input} value={value.nextAction || ''} onChange={(e) => set('nextAction', e.target.value)} placeholder={en ? 'e.g. Send proposal' : 'ex.: Enviar proposta'} />
          </Field>
        </div>
        <Field id="cp-summary" text={en ? 'Conversation summary' : 'Resumo das conversas'}>
          <textarea id="cp-summary" rows={5} className={`${input} resize-y`} value={value.summary || ''} onChange={(e) => set('summary', e.target.value)} placeholder={en ? 'What was agreed, values, objections, history…' : 'O que foi combinado, valores, objeções, histórico…'} />
        </Field>
      </section>

      <section className="grid gap-4">
        <h3 className="aura-h4 m-0">{en ? 'Contact & billing' : 'Contacto e faturação'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cp-contact" text={en ? 'Contact person' : 'Pessoa de contacto'}>
            <input id="cp-contact" className={input} value={value.contactName || ''} onChange={(e) => set('contactName', e.target.value)} placeholder={en ? 'e.g. Ana Ribeiro' : 'ex.: Ana Ribeiro'} />
          </Field>
          <Field id="cp-role" text={en ? 'Role' : 'Cargo'}>
            <input id="cp-role" className={input} value={value.contactRole || ''} onChange={(e) => set('contactRole', e.target.value)} placeholder={en ? 'e.g. Finance director' : 'ex.: Diretora financeira'} />
          </Field>
          <Field id="cp-tax" text={en ? 'Tax ID' : 'NIF / NIPC'}>
            <input id="cp-tax" className={input} value={value.taxId || ''} onChange={(e) => set('taxId', e.target.value)} placeholder="ex.: 500 123 456" />
          </Field>
          <Field id="cp-site" text="Website">
            <input id="cp-site" type="url" className={input} value={value.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </Field>
          <Field id="cp-channel" text={en ? 'Preferred channel' : 'Canal preferido'}>
            <select id="cp-channel" className={`${input} cursor-pointer`} value={value.preferredChannel || ''} onChange={(e) => set('preferredChannel', (e.target.value || undefined) as ClientProfile['preferredChannel'])}>
              <option value="">{en ? 'Not defined' : 'Não definido'}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">{en ? 'Phone' : 'Telefone'}</option>
            </select>
          </Field>
          <Field id="cp-terms" text={en ? 'Payment terms (days)' : 'Prazo de pagamento (dias)'}>
            <input id="cp-terms" type="number" min={0} max={365} inputMode="numeric" className={input} value={value.paymentTermsDays ?? ''} onChange={(e) => set('paymentTermsDays', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="ex.: 30" />
          </Field>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="aura-h4 m-0">{en ? 'Address' : 'Morada'}</h3>
        <Field id="cp-address" text={en ? 'Street address' : 'Morada'}>
          <input id="cp-address" className={input} value={value.address || ''} onChange={(e) => set('address', e.target.value)} placeholder={en ? 'Street, number, floor' : 'Rua, número, andar'} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cp-city" text={en ? 'City' : 'Cidade'}>
            <input id="cp-city" className={input} value={value.city || ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field id="cp-postal" text={en ? 'Postal code' : 'Código postal'}>
            <input id="cp-postal" className={input} value={value.postalCode || ''} onChange={(e) => set('postalCode', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="aura-h4 m-0">{en ? 'Organisation' : 'Organização'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cp-source" text={en ? 'How they found you' : 'Como chegou até si'}>
            <input id="cp-source" className={input} value={value.source || ''} onChange={(e) => set('source', e.target.value)} placeholder={en ? 'e.g. Referral, Instagram' : 'ex.: Indicação, Instagram'} />
          </Field>
          <Field id="cp-tags" text={en ? 'Tags' : 'Etiquetas'}>
            <input
              id="cp-tags"
              className={input}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder={en ? 'Type and press Enter' : 'Escreva e carregue Enter'}
            />
          </Field>
        </div>
        {!!value.tags?.length && (
          <div className="flex flex-wrap gap-2">
            {value.tags.map((t) => (
              <span key={t} className="aura-chip !cursor-default">
                {t}
                <button type="button" className="aura-chip__remove cursor-pointer" aria-label={en ? `Remove ${t}` : `Remover ${t}`} onClick={() => set('tags', (value.tags || []).filter((x) => x !== t))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
