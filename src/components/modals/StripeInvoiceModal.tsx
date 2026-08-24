import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Send,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MessageCircle,
  CreditCard,
} from 'lucide-react';
import { Project, Client, Income, CurrencyCode } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';

interface StripeInvoiceModalProps {
  project: Project;
  client: Client | undefined;
  incomes: Income[];
  onClose: () => void;
  onInvoiceCreated: (incomeId: string, stripeData: {
    stripeInvoiceId: string;
    stripeInvoiceUrl: string;
    stripeInvoicePdf: string;
    stripeCustomerId: string;
    stripeStatus: string;
  }) => void;
}

type Step = 'form' | 'creating' | 'success' | 'error';

const DUE_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '45 dias', value: 45 },
  { label: '60 dias', value: 60 },
];

export const StripeInvoiceModal: React.FC<StripeInvoiceModalProps> = ({
  project,
  client,
  incomes,
  onClose,
  onInvoiceCreated,
}) => {
  // Calcular valor em aberto do projecto
  const openAmount = project.totalAmount - project.paidAmount;

  // Pré-seleccionar a receita pendente ligada ao projecto (se existir)
  const pendingIncome = incomes.find(
    (i) => i.projectId === project.id && i.status !== 'Recebido'
  );

  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{
    invoiceId: string;
    invoiceUrl: string;
    invoicePdf: string;
    customerId: string;
    emailSent: boolean;
  } | null>(null);

  // Campos do formulário
  const [clientEmail, setClientEmail] = useState(client?.email || '');
  const [clientName, setClientName] = useState(client?.name || '');
  const [amount, setAmount] = useState(String(openAmount > 0 ? openAmount : project.totalAmount));
  const [description, setDescription] = useState(
    project.invoiceNotes || `Serviços de ${project.category} — ${project.name}`
  );
  const [footerText, setFooterText] = useState(project.invoiceFooter || '');
  const [daysUntilDue, setDaysUntilDue] = useState(15);
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [selectedIncomeId, setSelectedIncomeId] = useState(pendingIncome?.id || '');

  const handleCreate = async () => {
    if (!clientEmail) {
      setErrorMsg('O e-mail do cliente é obrigatório.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('O valor deve ser maior que zero.');
      return;
    }

    setStep('creating');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-invoice', {
        body: {
          projectId: project.id,
          incomeId: selectedIncomeId || null,
          clientEmail: clientEmail.trim(),
          clientName: clientName.trim(),
          clientWhatsapp: client?.whatsapp || '',
          amount: Number(amount),
          currency: project.currency,
          description: description.trim(),
          footerText: footerText.trim(),
          daysUntilDue,
          sendEmailNow,
          companyId: project.companyId || '',
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro desconhecido');
      }

      setResult({
        invoiceId: data.invoiceId,
        invoiceUrl: data.invoiceUrl,
        invoicePdf: data.invoicePdf,
        customerId: data.customerId,
        emailSent: data.emailSent,
      });

      // Notificar o App que a fatura foi criada para actualizar o estado
      if (selectedIncomeId) {
        onInvoiceCreated(selectedIncomeId, {
          stripeInvoiceId: data.invoiceId,
          stripeInvoiceUrl: data.invoiceUrl,
          stripeInvoicePdf: data.invoicePdf,
          stripeCustomerId: data.customerId,
          stripeStatus: 'open',
        });
      }

      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao criar fatura no Stripe.');
      setStep('error');
    }
  };

  const openWhatsApp = () => {
    if (!client?.whatsapp || !result?.invoiceUrl) return;
    const phone = client.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${client.name}! 😊\n\nSegue o link para pagamento do serviço "${project.name}":\n\n${result.invoiceUrl}\n\nQualquer dúvida estou à disposição!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const currencyLabel = project.currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] border border-[#c4c7c7]/30 shadow-[0_8px_40px_rgba(0,0,0,0.1)] w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 rounded-t-[24px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#635bff]/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#635bff]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1c1b1b] text-base">Gerar Fatura Stripe</h3>
              <p className="text-xs text-[#747878]">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP: FORM */}
          {(step === 'form' || step === 'error') && (
            <>
              {errorMsg && (
                <div className="bg-[#fff5f5] border border-[#ba1a1a]/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#ba1a1a]">{errorMsg}</p>
                </div>
              )}

              {/* Cliente */}
              <div className="bg-[#f7f3f2] rounded-xl p-3 border border-[#c4c7c7]/30">
                <p className="text-[10px] font-semibold text-[#747878] uppercase tracking-widest mb-2">Cliente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#747878] block mb-1">Nome</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3 py-2 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#747878] block mb-1">
                      E-mail <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3 py-2 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60"
                    />
                  </div>
                </div>
              </div>

              {/* Valor e moeda */}
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Valor da Fatura ({currencyLabel})
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#747878] font-medium">{currencyLabel}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="flex-1 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60"
                  />
                </div>
                {openAmount > 0 && (
                  <p className="text-[11px] text-[#747878] mt-1">
                    Saldo em aberto do projecto: <strong>{formatCurrency(openAmount, project.currency)}</strong>
                  </p>
                )}
              </div>

              {/* Receita a associar */}
              {incomes.filter(i => i.projectId === project.id && i.status !== 'Recebido').length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                    Associar à Receita Pendente
                  </label>
                  <select
                    value={selectedIncomeId}
                    onChange={(e) => setSelectedIncomeId(e.target.value)}
                    className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60"
                  >
                    <option value="">— Não associar a nenhuma receita —</option>
                    {incomes
                      .filter(i => i.projectId === project.id && i.status !== 'Recebido')
                      .map(i => (
                        <option key={i.id} value={i.id}>
                          {i.description} — {formatCurrency(i.amount, i.currency)}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-[#747878] mt-1">
                    Quando o cliente pagar, esta receita será marcada como Recebida automaticamente.
                  </p>
                </div>
              )}

              {/* Descrição do serviço */}
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Descrição do Serviço (aparece na fatura)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60 resize-none"
                />
              </div>

              {/* Rodapé */}
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Rodapé da Fatura (NIF, dados bancários, condições)
                </label>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  rows={2}
                  placeholder="Ex: CNPJ: 00.000.000/0001-00 | PIX: chave@email.com"
                  className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff]/60 resize-none"
                />
              </div>

              {/* Prazo */}
              <div>
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Prazo de Pagamento
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DUE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDaysUntilDue(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        daysUntilDue === opt.value
                          ? 'bg-[#635bff] text-white border-[#635bff]'
                          : 'bg-[#f1edec] text-[#444747] border-[#c4c7c7]/40 hover:border-[#635bff]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Envio automático */}
              <div className="flex items-center justify-between bg-[#f7f3f2] rounded-xl p-3 border border-[#c4c7c7]/30">
                <div>
                  <p className="text-sm font-medium text-[#1c1b1b]">Enviar por e-mail agora</p>
                  <p className="text-xs text-[#747878]">Stripe envia o e-mail com o link de pagamento ao cliente</p>
                </div>
                <button
                  onClick={() => setSendEmailNow(!sendEmailNow)}
                  className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${
                    sendEmailNow ? 'bg-[#635bff]' : 'bg-[#c4c7c7]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      sendEmailNow ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          )}

          {/* STEP: CREATING */}
          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-[#635bff] animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1c1b1b]">A criar fatura no Stripe...</p>
                <p className="text-xs text-[#747878] mt-1">Aguarde um momento</p>
              </div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#22c55e]/30 rounded-xl p-4">
                <CheckCircle2 className="w-6 h-6 text-[#16a34a] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#15803d]">Fatura criada com sucesso!</p>
                  {result.emailSent && (
                    <p className="text-xs text-[#16a34a] mt-0.5">E-mail enviado ao cliente via Stripe.</p>
                  )}
                </div>
              </div>

              <div className="bg-[#f7f3f2] rounded-xl p-4 border border-[#c4c7c7]/30 space-y-3">
                <p className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest">Acções</p>

                {/* Link da Fatura */}
                {result.invoiceUrl && (
                  <a
                    href={result.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full bg-[#635bff] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#5b52f0] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Fatura (link do cliente)
                  </a>
                )}

                {/* Baixar PDF */}
                {result.invoicePdf && (
                  <a
                    href={result.invoicePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full bg-[#f1edec] text-[#1c1b1b] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#e8e3e2] transition-colors border border-[#c4c7c7]/40"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF da Fatura
                  </a>
                )}

                {/* Enviar por WhatsApp */}
                {client?.whatsapp && (
                  <button
                    onClick={openWhatsApp}
                    className="flex items-center gap-2 w-full bg-[#25d366]/10 text-[#128c4a] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#25d366]/20 transition-colors border border-[#25d366]/30 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar link por WhatsApp
                  </button>
                )}

                {/* Enviar Resend (toggle) */}
                {!result.emailSent && (
                  <p className="text-xs text-[#747878] text-center">
                    O e-mail não foi enviado automaticamente. Pode copiar o link acima e enviar manualmente.
                  </p>
                )}
              </div>

              <p className="text-[11px] text-[#747878] text-center">
                Quando o cliente pagar, o sistema actualizará automaticamente a receita para "Recebido".
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#c4c7c7]/40 flex gap-3">
          {step === 'success' ? (
            <button
              onClick={onClose}
              className="flex-1 bg-[#1c1b1b] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#2d2d2d] transition-colors cursor-pointer"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={step === 'creating'}
                className="flex-1 bg-[#f1edec] text-[#1c1b1b] rounded-xl py-2.5 text-sm font-medium hover:bg-[#e8e3e2] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={step === 'error' ? handleCreate : handleCreate}
                disabled={step === 'creating'}
                className="flex-1 bg-[#635bff] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#5b52f0] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {step === 'creating' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A criar...</>
                ) : step === 'error' ? (
                  'Tentar novamente'
                ) : (
                  <><FileText className="w-4 h-4" /> Criar Fatura</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
