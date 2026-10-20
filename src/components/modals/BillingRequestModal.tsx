import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Project, CurrencyCode, CURRENCIES } from '../../types';
import { BillingRequest, BILLING_STATUS_COLORS, getBillingStatusLabel } from '../../types/rbac';
import { useLanguage } from '../../contexts/LanguageContext';

interface BillingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    projectId?: string;
    amount: number;
    currency: CurrencyCode;
    description: string;
  }) => Promise<void>;
  onReview?: (data: {
    requestId: string;
    status: 'Aprovada' | 'Rejeitada' | 'Em análise';
    notes?: string;
  }) => Promise<void>;
  projects: Project[];
  requestToReview?: BillingRequest | null;
  defaultCurrency?: CurrencyCode;
  canApprove?: boolean;
}

export function BillingRequestModal({
  isOpen,
  onClose,
  onSave,
  onReview,
  projects,
  requestToReview,
  defaultCurrency = 'BRL',
  canApprove = false,
}: BillingRequestModalProps) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const isReviewMode = !!requestToReview;

  // Create Mode state
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [description, setDescription] = useState('');

  // Review Mode state
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (requestToReview) {
        setReviewNotes(requestToReview.reviewNotes || '');
      } else {
        setProjectId('');
        setAmount('');
        setCurrency(defaultCurrency);
        setDescription('');
        setReviewNotes('');
      }
      setError('');
    }
  }, [isOpen, requestToReview, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isEn ? 'Enter a valid amount greater than zero.' : 'Informe um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      setError(isEn ? 'Billing description is required.' : 'A descrição do faturação é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        projectId: projectId || undefined,
        amount: numAmount,
        currency,
        description: description.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? 'Error submitting request' : 'Erro ao submeter solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (status: 'Aprovada' | 'Rejeitada' | 'Em análise') => {
    if (!requestToReview || !onReview) return;
    setError('');

    if (status === 'Rejeitada' && !reviewNotes.trim()) {
      setError(isEn ? 'Please provide the rejection justification in the notes.' : 'Por favor, informe a justificativa da rejeição nas observações.');
      return;
    }

    setLoading(true);
    try {
      await onReview({
        requestId: requestToReview.id,
        status,
        notes: reviewNotes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : isEn ? 'Error processing request' : 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = requestToReview?.status ? BILLING_STATUS_COLORS[requestToReview.status] : undefined;

  return (
    <EditorPage
      title={<>{isReviewMode
                  ? (isEn ? 'Billing Request Review' : 'Análise de Solicitação de Faturação')
                  : (isEn ? 'New Billing Request' : 'Nova Solicitação de Faturação')}</>}
      trail={[isEn ? 'Billing' : 'Faturação']}
      subtitle={<>{isReviewMode
                  ? (isEn ? 'Review the request and generate income automatically' : 'Avalie o pedido e gere a receita automaticamente')
                  : (isEn ? 'Submit request for manager approval' : 'Submeta o pedido para aprovação do gestor')}</>}
      icon={<FileText className="w-5 h-5" />}
      onClose={onClose}
      
    >
      <div className="space-y-6 text-fg">

        {/* Content */}
        {isReviewMode ? (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-danger-soft border border-danger/20 rounded-md text-danger-fg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Request Summary Card */}
            <div className="p-4 bg-surface-2 border border-line-subtle rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-fg-secondary ">
                  {isEn ? 'Requester: ' : 'Solicitante: '}<strong className="text-fg ">{requestToReview.requestedByName || (isEn ? 'Employee' : 'Funcionário')}</strong>
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: statusStyle?.bg, color: statusStyle?.text }}
                >
                  {getBillingStatusLabel(requestToReview.status, lang)}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[13px] font-medium text-fg-secondary block">
                  {isEn ? 'Requested Amount' : 'Valor Solicitado'}
                </span>
                <div className="text-2xl font-semibold text-accent-soft-fg tracking-tight">
                  {requestToReview.currency} {requestToReview.amount.toLocaleString(isEn ? 'en-US' : 'pt-PT', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {requestToReview.projectName && (
                <div>
                  <span className="text-[13px] font-medium text-fg-secondary block">
                    {isEn ? 'Linked Project' : 'Projeto Vinculado'}
                  </span>
                  <span className="text-xs text-fg font-medium">{requestToReview.projectName}</span>
                </div>
              )}

              <div>
                <span className="text-[13px] font-medium text-fg-secondary block">
                  {isEn ? 'Work Description' : 'Descrição do Trabalho'}
                </span>
                <p className="text-xs text-fg-secondary mt-0.5 whitespace-pre-wrap">{requestToReview.description}</p>
              </div>
            </div>

            {/* Review Notes */}
            {canApprove && (
              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                  {isEn ? 'Notes / Justification' : 'Observações / Justificativa'}
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={isEn ? 'e.g. Approved per delivery of milestone 2. Revenue generated.' : 'Ex: Aprovado conforme entrega da etapa 2. Receita gerada.'}
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all resize-none"
                />
              </div>
            )}

            {/* Actions for Approver */}
            {canApprove && requestToReview.status !== 'Aprovada' && requestToReview.status !== 'Faturada' ? (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-line-subtle ">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Rejeitada')}
                  className="flex-1 px-4 py-2.5 bg-danger-soft hover:bg-[#ffb4ab] text-danger-fg rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isEn ? 'Reject' : 'Rejeitar'}</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Em análise')}
                  className="aura-btn aura-btn--secondary aura-btn--sm"
                >
                  {isEn ? 'Mark Under Review' : 'Marcar em Análise'}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Aprovada')}
                  className="aura-btn aura-btn--primary aura-btn--sm flex-1 justify-center"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#d4eddf]" />}
                  <span>{isEn ? 'Approve & Invoice' : 'Aprovar & Faturar'}</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-2 border-t border-line-subtle ">
                <button
                  type="button"
                  onClick={onClose}
                  className="aura-btn aura-btn--secondary aura-btn--sm"
                >
                  {isEn ? 'Close' : 'Fechar'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-danger-soft border border-danger/20 rounded-md text-danger-fg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Project Select */}
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Linked Project (Optional)' : 'Projeto Vinculado (Opcional)'}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-xs text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="" className="bg-glass-strong text-fg ">
                  {isEn ? 'No specific project' : 'Nenhum projeto específico'}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-glass-strong text-fg ">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                  {isEn ? 'Amount to Bill' : 'Valor a Faturar'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-xs text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                  {isEn ? 'Currency' : 'Moeda'}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-xs text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code} className="bg-glass-strong text-fg ">
                      {code} ({CURRENCIES[code].symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Service Description / Deliverable' : 'Descrição do Serviço / Entrega'}
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isEn ? 'e.g. Completed checkout design screens and client sign-off.' : 'Ex.: Design dos ecrãs de pagamento concluído e validado com o cliente.'}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-3 pt-2 border-t border-line-subtle ">
              <button
                type="button"
                onClick={onClose}
                className="aura-btn aura-btn--secondary aura-btn--sm flex-1"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="aura-btn aura-btn--primary aura-btn--sm flex-1 disabled:opacity-40 justify-center"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? (isEn ? 'Submitting...' : 'A enviar...') : (isEn ? 'Submit Request' : 'Enviar Solicitação')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </EditorPage>
  );
}
