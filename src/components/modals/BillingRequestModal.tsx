import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Project, CurrencyCode, CURRENCIES } from '../../types';
import { BillingRequest, BILLING_STATUS_COLORS } from '../../types/rbac';

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
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      setError('A descrição do faturamento é obrigatória.');
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
      setError(err instanceof Error ? err.message : 'Erro ao submeter solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (status: 'Aprovada' | 'Rejeitada' | 'Em análise') => {
    if (!requestToReview || !onReview) return;
    setError('');

    if (status === 'Rejeitada' && !reviewNotes.trim()) {
      setError('Por favor, informe a justificativa da rejeição nas observações.');
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
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = requestToReview?.status ? BILLING_STATUS_COLORS[requestToReview.status] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] border border-[#c4c7c7]/30 shadow-[0_8px_40px_rgba(0,0,0,0.06)] w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 rounded-t-[24px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#0050d7] text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">
                {isReviewMode ? 'Análise de Solicitação de Faturamento' : 'Nova Solicitação de Faturamento'}
              </h3>
              <p className="text-xs text-[#747878]">
                {isReviewMode ? 'Avalie o pedido e gere a receita automaticamente' : 'Submeta o pedido para aprovação do gestor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isReviewMode ? (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Request Summary Card */}
            <div className="p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-wider">
                  Solicitante: <strong className="text-[#1c1b1b]">{requestToReview.requestedByName || 'Funcionário'}</strong>
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: statusStyle?.bg, color: statusStyle?.text }}
                >
                  {requestToReview.status}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-wider block">Valor Solicitado</span>
                <div className="text-2xl font-semibold text-[#0050d7] tracking-tight">
                  {requestToReview.currency} {requestToReview.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {requestToReview.projectName && (
                <div>
                  <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-wider block">Projeto Vinculado</span>
                  <span className="text-xs text-[#1c1b1b] font-medium">{requestToReview.projectName}</span>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-[#747878] uppercase tracking-wider block">Descrição do Trabalho</span>
                <p className="text-xs text-[#444747] mt-0.5 whitespace-pre-wrap">{requestToReview.description}</p>
              </div>
            </div>

            {/* Review Notes */}
            {canApprove && (
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Observações / Justificativa
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ex: Aprovado conforme entrega da etapa 2. Receita gerada."
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-xs text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
                />
              </div>
            )}

            {/* Actions for Approver */}
            {canApprove && requestToReview.status !== 'Aprovada' && requestToReview.status !== 'Faturada' ? (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#c4c7c7]/40">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Rejeitada')}
                  className="flex-1 px-4 py-2.5 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#93000a] rounded-[29px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeitar</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Em análise')}
                  className="px-4 py-2.5 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] rounded-[29px] text-xs font-medium transition-all cursor-pointer"
                >
                  Marcar em Análise
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleReviewAction('Aprovada')}
                  className="flex-1 px-4 py-2.5 bg-[#000000] hover:opacity-85 text-white rounded-[29px] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#d4eddf]" />}
                  <span>Aprovar &amp; Faturar</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-2 border-t border-[#c4c7c7]/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-xs font-medium"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#93000a] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Project Select */}
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Projeto Vinculado (Opcional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Nenhum projeto específico</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Valor a Faturar
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Moeda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all cursor-pointer"
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code} ({CURRENCIES[code].symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Descrição do Serviço / Entrega
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Conclusão do design das telas de pagamento e validação com o cliente."
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-xs text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-3 pt-2 border-t border-[#c4c7c7]/40">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-xs font-medium transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-[#000000] hover:opacity-85 disabled:opacity-40 text-white font-medium text-xs rounded-[29px] flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'A enviar...' : 'Enviar Solicitação'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
