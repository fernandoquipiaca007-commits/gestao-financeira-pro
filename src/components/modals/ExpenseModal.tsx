import React, { useState, useEffect, useRef } from 'react';
import { confirmAction, toast } from '../../lib/feedback';
import { EditorPage } from '../shell/EditorPage';
import { X, Receipt, Save, Handshake, Upload, FileImage, Trash2, CheckCircle } from 'lucide-react';
import { Expense, ExpenseCategory, CurrencyCode, CURRENCIES, Partner, getExpenseCategoryLabel } from '../../types';
import { getTodayIso } from '../../lib/storage';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt'> & { id?: string }) => void;
  expenseToEdit?: Expense | null;
  defaultCurrency: CurrencyCode;
  partners?: Partner[];
  categories?: import('../../types').CategoryItem[];
  /** Reservas abertas de onde a despesa pode ser paga. */
  reserves?: import('../../types').CashReserve[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  defaultCurrency,
  partners = [],
  categories = [],
  reserves = [],
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [category, setCategory] = useState<ExpenseCategory>('Hospedagem');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(150);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [date, setDate] = useState(getTodayIso());
  const [paid, setPaid] = useState<boolean>(false);
  const [partnerId, setPartnerId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [reserveId, setReserveId] = useState('');
  // Envio a sócio: parte que é dívida dele à empresa; e se a linha é uma compensação (sem dinheiro).
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [settledByAdvance, setSettledByAdvance] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setCurrency(expenseToEdit.currency);
      setDate(expenseToEdit.date);
      setPaid(expenseToEdit.paid);
      setPartnerId(expenseToEdit.partnerId || '');
      setPartnerName(expenseToEdit.partnerName || '');
      setReceiptUrl(expenseToEdit.receiptUrl || '');
      setReserveId(expenseToEdit.reserveId || '');
      setAdvanceAmount(expenseToEdit.advanceAmount || 0);
      setSettledByAdvance(Boolean(expenseToEdit.settledByAdvance));
      setReceiptPreview(expenseToEdit.receiptUrl || '');
      setReceiptFileName('');
    } else {
      setCategory('Hospedagem');
      setDescription('');
      setAmount(150);
      setCurrency(defaultCurrency);
      setDate(getTodayIso());
      setPaid(false);
      setPartnerId('');
      setPartnerName('');
      setReceiptUrl('');
      setReserveId('');
      setAdvanceAmount(0);
      setSettledByAdvance(false);
      setReceiptPreview('');
      setReceiptFileName('');
    }
  }, [expenseToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const isCommission = category === 'Comissão Parceiro';

  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    if (newCat === 'Retirada Própria') setPaid(true);
    if (newCat !== 'Comissão Parceiro') {
      setPartnerId('');
      setPartnerName('');
    }
  };

  const handlePartnerSelect = (pid: string) => {
    setPartnerId(pid);
    const p = partners.find((x) => x.id === pid);
    if (p) {
      setPartnerName(p.name);
      if (!description) setDescription(`${isEn ? 'Commission' : 'Comissão'} - ${p.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ tone: 'warning', title: isEn ? 'File too large. Maximum size: 5MB.' : 'Ficheiro muito grande. Tamanho máximo: 5MB.' });
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setReceiptUrl(base64);
      setReceiptPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl('');
    setReceiptPreview('');
    setReceiptFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const defaultExpensePresets: ExpenseCategory[] = [
    'Retirada Própria',
    'Internet',
    'Hospedagem',
    'Domínio',
    'Publicidade',
    'Ferramentas',
    'Salário',
    'Comissão Parceiro',
    'Outros',
  ];
  const allExpenseCategoryNames = Array.from(
    new Set([
      ...categories.map((c) => c.name),
      ...defaultExpensePresets,
      ...(category ? [category] : []),
    ])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (isCommission && !partnerId) {
      toast({ tone: 'warning', title: isEn ? 'Select the partner for the commission.' : 'Seleciona o parceiro para a comissão.' });
      return;
    }

    onSave({
      id: expenseToEdit?.id,
      category,
      description: description.trim(),
      amount: Number(amount) || 0,
      currency,
      date,
      paid,
      partnerId: isCommission ? partnerId || undefined : undefined,
      // o nome do sócio numa distribuição também se mantém ao editar
      partnerName: isCommission || category === 'Distribuição a sócios' ? partnerName || undefined : undefined,
      receiptUrl: receiptUrl || undefined,
      reserveId: reserveId || undefined,
      // só faz sentido em envios a sócios; nas outras despesas fica a zero
      advanceAmount: category === 'Distribuição a sócios' ? Math.min(Math.max(0, Number(advanceAmount) || 0), Number(amount) || 0) : 0,
      settledByAdvance: category === 'Distribuição a sócios' ? settledByAdvance : false,
    });

    onClose();
  };

  const isImage = receiptPreview?.startsWith('data:image') || receiptPreview?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <EditorPage
      title={<>{expenseToEdit
                ? (isEn ? 'Edit Expense' : 'Editar Despesa')
                : (isEn ? 'New expense' : 'Nova despesa')}</>}
      trail={[isEn ? 'Finance' : 'Financeiro']}
      
      icon={<Handshake className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
            <button
              type="button"
              onClick={onClose}
              className="aura-btn aura-btn--ghost"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="aura-btn aura-btn--primary"
             form="expense-form">
              <Save className="w-4 h-4 stroke-[2]" />
              <span>{isEn ? 'Save Expense' : 'Guardar Despesa'}</span>
            </button>
          </>}
    >
      <form id="expense-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>

          {/* Categoria */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Expense / Outflow Category *' : 'Categoria da Despesa / Saída *'}
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
            >
              {allExpenseCategoryNames.map((catName) => (
                <option key={catName} value={catName}>
                  {getExpenseCategoryLabel(catName as ExpenseCategory, lang)}
                </option>
              ))}
            </select>
          </div>

          {category === 'Distribuição a sócios' && (
            <div className="grid gap-1.5">
              <label className="block text-xs font-medium text-fg-secondary">{isEn ? 'Partner name' : 'Sócio'}</label>
              <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="aura-input w-full" placeholder={isEn ? 'e.g. Jorge Reis' : 'Ex.: Jorge Reis'} />
              <label className="block text-xs font-medium text-fg-secondary mt-1">{isEn ? 'Advance part (owed to the company)' : 'Parte adiantada (deve à empresa)'}</label>
              <input type="number" min="0" step="any" value={advanceAmount} disabled={settledByAdvance} onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)} className="aura-input w-full" />
              <p className="m-0 text-[11px] text-fg-muted">
                {isEn ? 'If the partner received more than their share, write how much is extra: it becomes a debt to the company, compensated in the next distribution.' : 'Se o sócio recebeu mais do que lhe cabe, escreva quanto é a mais: fica como dívida dele à empresa, compensada na próxima distribuição.'}
              </p>
              <label className="flex items-center gap-2 text-xs text-fg-secondary cursor-pointer mt-1">
                <input type="checkbox" checked={settledByAdvance} onChange={(e) => setSettledByAdvance(e.target.checked)} />
                {isEn ? 'Compensated in the advance (no money leaves the cash)' : 'Compensado no adiantamento (não sai dinheiro do caixa)'}
              </label>
            </div>
          )}

          {reserves.some((r) => !r.closed) && (
            <div>
              <label className="block text-xs font-medium text-fg-secondary mb-1.5">{isEn ? 'Paid from reserve (optional)' : 'Paga com a reserva (opcional)'}</label>
              <select value={reserveId} onChange={(e) => setReserveId(e.target.value)} className="aura-input w-full">
                <option value="">{isEn ? 'No reserve (free cash)' : 'Sem reserva (caixa livre)'}</option>
                {reserves.filter((r) => !r.closed || r.id === reserveId).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Info Retirada */}
          {category === 'Retirada Própria' && (
            <div className="p-3 bg-warning-soft border border-[#f0d080]/50 rounded-md text-xs text-warning-fg font-medium">
              {isEn
                ? 'Cash Outflow: This amount is deducted immediately from your Real Cash Balance.'
                : 'Retirada de Caixa: Este valor é debitado imediatamente do seu Saldo Real em Caixa.'}
            </div>
          )}

          {/* Seletor de Parceiro (apenas para Comissao) */}
          {isCommission && (
            <div className="p-4 bg-surface-2 border border-line-subtle rounded-md space-y-3">
              <p className="text-[13px] font-medium text-fg-secondary flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-accent-soft-fg " /> {isEn ? 'Partner Commission Data' : 'Dados da Comissão do Parceiro'}
              </p>

              {partners.length === 0 ? (
                <p className="text-xs text-fg-secondary font-medium">
                  {isEn
                    ? 'No partner registered. Go to Partners Management to register.'
                    : 'Ainda não tem parceiros. Adicione-os em Parceiros.'}
                </p>
              ) : (
                <div>
                  <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                    {isEn ? 'Partner receiving the commission *' : 'Parceiro que vai receber a comissão *'}
                  </label>
                  <select
                    value={partnerId}
                    onChange={(e) => handlePartnerSelect(e.target.value)}
                    className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
                  >
                    <option value="">{isEn ? 'Select partner' : 'Seleciona o parceiro'}</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.defaultCommissionPercent ? ` (${p.defaultCommissionPercent}% ${isEn ? 'commission' : 'comissão'})` : ''}
                      </option>
                    ))}
                  </select>
                  {partnerId && (
                    <p className="mt-1.5 text-[11px] text-success-fg font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {isEn ? 'Selected partner:' : 'Parceiro selecionado:'} <strong>{partnerName}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Descricao */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Description / Supplier *' : 'Descrição / Fornecedor *'}
            </label>
            <input
              type="text"
              required
              placeholder={isCommission ? (isEn ? `Ex: Commission - ${partnerName || 'Partner Name'}` : `Ex: Comissão - ${partnerName || 'Nome do Parceiro'}`) : (isEn ? 'Ex: Hostinger Server Renewal' : 'Ex: Renovação Servidor Hostinger')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* Valor & Moeda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Amount' : 'Valor'} ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Currency' : 'Moeda'}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="AOA">AOA (Kz)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Data & Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Payment Date' : 'Data do Pagamento'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              />
            </div>
            <div className="flex flex-col justify-center pt-3">
              <label className="text-[13px] font-medium text-fg-secondary block mb-2">
                {isEn ? 'Payment status' : 'Estado do pagamento'}
              </label>
              <div className="flex rounded-full bg-surface-2 border border-line-subtle p-0.5 w-fit gap-0.5">
                <button
                  type="button"
                  onClick={() => setPaid(false)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
 !paid
 ? 'bg-primary shadow-primary-3d text-primary-fg '
 : 'text-fg-secondary hover:text-fg '
 }`}
                >
                  {isEn ? 'Pending' : 'Pendente'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaid(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
 paid
 ? 'bg-primary shadow-primary-3d text-primary-fg '
 : 'text-fg-secondary hover:text-fg '
 }`}
                >
                  {isEn ? 'Paid' : 'Pago'}
                </button>
              </div>
            </div>
          </div>

          {/* Upload de Comprovativo */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Payment Receipt / Proof' : 'Comprovativo de Pagamento'}{' '}
              <span className="text-fg-disabled normal-case tracking-normal font-normal">
                {isEn ? '(optional - image or PDF)' : '(opcional - imagem ou PDF)'}
              </span>
            </label>

            {receiptPreview ? (
              <div className="border border-line-subtle rounded-lg overflow-hidden bg-surface-2 ">
                {isImage ? (
                  <img
                    src={receiptPreview}
                    alt={isEn ? 'Proof' : 'Comprovativo'}
                    className="w-full max-h-40 object-contain bg-glass-strong "
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileImage className="w-8 h-8 text-fg-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-fg truncate">
                        {receiptFileName || (isEn ? 'Proof' : 'Comprovativo')}
                      </p>
                      <p className="text-[11px] text-fg-muted ">{isEn ? 'Attached file' : 'Ficheiro anexado'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 border-t border-line-subtle bg-surface-2 ">
                  <span className="text-[11px] text-success-fg font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {isEn ? 'Receipt attached' : 'Comprovativo anexado'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-[11px] text-danger-fg hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> {isEn ? 'Remove' : 'Remover'}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-line hover:border-[#747878] rounded-lg cursor-pointer bg-surface-2 hover:bg-sunken transition-colors">
                <Upload className="w-5 h-5 text-fg-muted mb-1" />
                <span className="text-xs font-medium text-fg-muted ">
                  {isEn ? 'Click to upload proof' : 'Clica para carregar comprovativo'}
                </span>
                <span className="text-[11px] text-fg-disabled ">PNG, JPG, PDF - max. 5MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer */}
          

        </form>
    </EditorPage>
  );
};
