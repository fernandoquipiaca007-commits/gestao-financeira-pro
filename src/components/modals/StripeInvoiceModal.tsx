import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MessageCircle,
  CreditCard,
  Calendar,
  Info,
} from 'lucide-react';
import { Project, Client, Income } from '../../types';
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

// Compute default due date (15 days from today)
function defaultDueDate(days = 15): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDatePT(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const QUICK_DATES = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '45 dias', days: 45 },
  { label: '60 dias', days: 60 },
];

export const StripeInvoiceModal: React.FC<StripeInvoiceModalProps> = ({
  project,
  client,
  incomes,
  onClose,
  onInvoiceCreated,
}) => {
  const openAmount = project.totalAmount - project.paidAmount;

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

  // Form fields
  const [clientEmail, setClientEmail] = useState(client?.email || '');
  const [clientName, setClientName] = useState(client?.name || '');
  const [amount, setAmount] = useState(() => {
    // Priority: 1) pending income amount, 2) open balance, 3) total project amount
    if (pendingIncome && pendingIncome.amount > 0) return String(pendingIncome.amount);
    if (openAmount > 0) return String(openAmount);
    if (project.totalAmount > 0) return String(project.totalAmount);
    return '';
  });
  const [description, setDescription] = useState(
    project.invoiceNotes || `Serviços de ${project.category} — ${project.name}`
  );
  const [footerText, setFooterText] = useState(project.invoiceFooter || '');
  const [dueDate, setDueDate] = useState(defaultDueDate(15));
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [selectedIncomeId, setSelectedIncomeId] = useState(pendingIncome?.id || '');

  const daysUntilDue = daysFromToday(dueDate);

  const handleCreate = async () => {
    if (!clientEmail) {
      setErrorMsg('O e-mail do cliente é obrigatório.');
      setStep('error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('O valor deve ser maior que zero.');
      setStep('error');
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
          currency: project.currency || 'BRL',
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar fatura no Stripe.';
      setErrorMsg(msg);
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

  const pendingIncomes = incomes.filter(
    (i) => i.projectId === project.id && i.status !== 'Recebido'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-[28px] border border-[#c4c7c7]/30 shadow-[0_24px_80px_rgba(0,0,0,0.15)] w-full max-w-2xl flex flex-col">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#635bff]/5 to-[#f7f3f2] px-8 py-6 border-b border-[#c4c7c7]/40 rounded-t-[28px] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#635bff]/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-[#635bff]" />
            </div>
            <div>
              <h2 className="font-bold text-[#1c1b1b] text-xl tracking-tight">Gerar Fatura Stripe</h2>
              <p className="text-sm text-[#747878] mt-0.5">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer mt-1 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="px-8 py-6 space-y-7">

          {/* FORM / ERROR */}
          {(step === 'form' || step === 'error') && (
            <>
              {errorMsg && (
                <div className="bg-[#fff5f5] border border-[#ba1a1a]/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#ba1a1a] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#ba1a1a]">Erro ao criar fatura</p>
                    <p className="text-sm text-[#ba1a1a]/80 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* ── Secção: Dados do Cliente ── */}
              <section>
                <p className="text-[11px] font-bold text-[#747878] uppercase tracking-widest mb-3">
                  Dados do Cliente
                </p>
                <div className="bg-[#f7f3f2] rounded-2xl p-5 border border-[#c4c7c7]/30 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#444747] block mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome do cliente ou empresa"
                      className="w-full bg-white border border-[#c4c7c7]/50 rounded-xl px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#444747] block mb-2">
                      E-mail <span className="text-[#ba1a1a]">*</span>
                      <span className="ml-1 text-[#747878] font-normal">(para onde a fatura será enviada)</span>
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full bg-white border border-[#c4c7c7]/50 rounded-xl px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* ── Secção: Valor ── */}
              <section>
                <p className="text-[11px] font-bold text-[#747878] uppercase tracking-widest mb-3">
                  Valor da Fatura
                </p>
                <div className="bg-[#f7f3f2] rounded-2xl p-5 border border-[#c4c7c7]/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-white border border-[#c4c7c7]/50 rounded-xl px-4 py-3 text-sm font-semibold text-[#635bff] shrink-0">
                      {project.currency || 'BRL'}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="flex-1 bg-white border border-[#c4c7c7]/50 rounded-xl px-4 py-3 text-lg font-semibold text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#747878]">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Orçamento total: <strong className="text-[#1c1b1b]">{formatCurrency(project.totalAmount, project.currency)}</strong>
                      {openAmount > 0 && (
                        <> · Saldo em aberto: <strong className="text-[#635bff]">{formatCurrency(openAmount, project.currency)}</strong></>
                      )}
                    </span>
                  </div>

                  {/* Receita a associar */}
                  {pendingIncomes.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-[#444747] block mb-2 mt-3">
                        Associar ao recebimento pendente
                      </label>
                      <select
                        value={selectedIncomeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedIncomeId(id);
                          // Auto-preencher o valor com o da receita selecionada
                          if (id) {
                            const inc = pendingIncomes.find((i) => i.id === id);
                            if (inc && inc.amount > 0) setAmount(String(inc.amount));
                          }
                        }}
                        className="w-full bg-white border border-[#c4c7c7]/50 rounded-xl px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] transition-all"
                      >
                        <option value="">— Não associar —</option>
                        {pendingIncomes.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.description} — {formatCurrency(i.amount, i.currency)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#747878] mt-1.5">
                        Quando o cliente pagar, este recebimento será automaticamente marcado como Recebido.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Secção: Descrição do Serviço ── */}
              <section>
                <p className="text-[11px] font-bold text-[#747878] uppercase tracking-widest mb-1">
                  Descrição do Serviço
                </p>
                <p className="text-xs text-[#747878] mb-3">
                  Este texto aparece na linha de item da fatura enviada ao cliente.
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Descreva o serviço prestado em detalhe. Exemplo: Gestão de tráfego pago — Meta Ads e Google Ads — Campanha para lançamento do evento XYZ, incluindo criação de públicos, criativos e relatórios mensais."
                  className="w-full bg-[#f7f3f2] border border-[#c4c7c7]/40 rounded-2xl px-5 py-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 focus:bg-white transition-all resize-y leading-relaxed"
                />
              </section>

              {/* ── Secção: Rodapé ── */}
              <section>
                <p className="text-[11px] font-bold text-[#747878] uppercase tracking-widest mb-1">
                  Rodapé da Fatura
                </p>
                <p className="text-xs text-[#747878] mb-3">
                  Aparece no final da fatura. Ideal para NIF/CNPJ, dados bancários, condições de pagamento ou notas legais.
                </p>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  rows={5}
                  placeholder={`Exemplo:\nNIF: 123456789\nIBAN: PT50 0000 0000 0000 0000 0000 0\nMBWAY: +351 912 345 678\n\nPagamento sujeito aos termos acordados no contrato de prestação de serviços.`}
                  className="w-full bg-[#f7f3f2] border border-[#c4c7c7]/40 rounded-2xl px-5 py-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 focus:bg-white transition-all resize-y leading-relaxed font-mono"
                />
              </section>

              {/* ── Secção: Data de Vencimento ── */}
              <section>
                <p className="text-[11px] font-bold text-[#747878] uppercase tracking-widest mb-3">
                  Data de Vencimento
                </p>
                <div className="bg-[#f7f3f2] rounded-2xl p-5 border border-[#c4c7c7]/30 space-y-4">
                  {/* Presets rápidos */}
                  <div>
                    <p className="text-xs font-semibold text-[#444747] mb-2">Prazo rápido</p>
                    <div className="flex gap-2 flex-wrap">
                      {QUICK_DATES.map((opt) => {
                        const dateStr = defaultDueDate(opt.days);
                        const isActive = dueDate === dateStr;
                        return (
                          <button
                            key={opt.days}
                            onClick={() => setDueDate(dateStr)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#635bff] text-white border-[#635bff] shadow-sm'
                                : 'bg-white text-[#444747] border-[#c4c7c7]/50 hover:border-[#635bff]/50 hover:text-[#635bff]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendário */}
                  <div>
                    <p className="text-xs font-semibold text-[#444747] mb-2">Ou escolha uma data específica</p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#747878] pointer-events-none" />
                      <input
                        type="date"
                        value={dueDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white border border-[#c4c7c7]/50 rounded-xl pl-11 pr-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Resumo */}
                  {dueDate && (
                    <div className="bg-[#635bff]/5 border border-[#635bff]/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-[#635bff] font-semibold">
                        📅 Vencimento: {formatDatePT(dueDate)}
                        <span className="font-normal text-[#635bff]/70 ml-1">({daysUntilDue} dias a partir de hoje)</span>
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Envio automático ── */}
              <div className="flex items-center justify-between bg-[#f7f3f2] rounded-2xl px-5 py-4 border border-[#c4c7c7]/30">
                <div>
                  <p className="text-sm font-semibold text-[#1c1b1b]">Enviar fatura por e-mail agora</p>
                  <p className="text-xs text-[#747878] mt-0.5">
                    A Stripe enviará automaticamente o link de pagamento ao cliente
                  </p>
                </div>
                <button
                  onClick={() => setSendEmailNow(!sendEmailNow)}
                  className={`w-12 h-6 rounded-full transition-all cursor-pointer relative shrink-0 ml-4 ${
                    sendEmailNow ? 'bg-[#635bff]' : 'bg-[#c4c7c7]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      sendEmailNow ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* ── Info Idioma ── */}
              <div className="flex items-start gap-2.5 text-xs text-[#747878]">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#635bff]" />
                <p>
                  A fatura será emitida em <strong>Português (pt-BR)</strong> com os valores em{' '}
                  <strong>{project.currency || 'BRL'}</strong>. O cliente receberá o link para pagamento online via Stripe.
                </p>
              </div>
            </>
          )}

          {/* CREATING */}
          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-16 h-16 rounded-full bg-[#635bff]/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#635bff] animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[#1c1b1b]">A criar fatura no Stripe...</p>
                <p className="text-sm text-[#747878] mt-1">Aguarde um momento, estamos a processar</p>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-[#f0fdf4] border border-[#22c55e]/40 rounded-2xl p-5">
                <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-[#16a34a]" />
                </div>
                <div>
                  <p className="font-bold text-[#15803d] text-base">Fatura criada com sucesso!</p>
                  {result.emailSent && (
                    <p className="text-sm text-[#16a34a] mt-0.5">
                      E-mail enviado ao cliente via Stripe.
                    </p>
                  )}
                  <p className="text-xs text-[#16a34a]/70 mt-0.5">ID: {result.invoiceId}</p>
                </div>
              </div>

              <div className="space-y-3">
                {result.invoiceUrl && (
                  <a
                    href={result.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-[#635bff] text-white rounded-2xl px-5 py-4 text-sm font-semibold hover:bg-[#5b52f0] transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <div>
                      <p>Abrir Fatura (link de pagamento)</p>
                      <p className="text-xs text-white/70 font-normal">Partilhe este link com o cliente</p>
                    </div>
                  </a>
                )}

                {result.invoicePdf && (
                  <a
                    href={result.invoicePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-[#f1edec] text-[#1c1b1b] rounded-2xl px-5 py-4 text-sm font-semibold hover:bg-[#e8e3e2] transition-colors border border-[#c4c7c7]/40"
                  >
                    <Download className="w-5 h-5" />
                    Baixar PDF da Fatura
                  </a>
                )}

                {client?.whatsapp && (
                  <button
                    onClick={openWhatsApp}
                    className="flex items-center gap-3 w-full bg-[#25d366]/10 text-[#128c4a] rounded-2xl px-5 py-4 text-sm font-semibold hover:bg-[#25d366]/20 transition-colors border border-[#25d366]/30 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar link por WhatsApp
                  </button>
                )}
              </div>

              <div className="bg-[#f7f3f2] rounded-2xl px-5 py-4 border border-[#c4c7c7]/30">
                <p className="text-xs text-[#747878] text-center leading-relaxed">
                  💡 Quando o cliente pagar, o sistema actualizará automaticamente o recebimento para <strong>"Recebido"</strong> via webhook da Stripe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-8 pb-8 pt-2 flex gap-3">
          {step === 'success' ? (
            <button
              onClick={onClose}
              className="flex-1 bg-[#1c1b1b] text-white rounded-2xl py-3.5 text-sm font-semibold hover:bg-[#2d2d2d] transition-colors cursor-pointer"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={step === 'creating'}
                className="flex-1 bg-[#f1edec] text-[#1c1b1b] rounded-2xl py-3.5 text-sm font-semibold hover:bg-[#e8e3e2] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={step === 'creating'}
                className="flex-1 bg-[#635bff] text-white rounded-2xl py-3.5 text-sm font-semibold hover:bg-[#5b52f0] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
