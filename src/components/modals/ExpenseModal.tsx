import React, { useState, useEffect, useRef } from 'react';
import { X, Receipt, Save, Handshake, Upload, FileImage, Trash2, CheckCircle } from 'lucide-react';
import { Expense, ExpenseCategory, CurrencyCode, CURRENCIES, Partner } from '../../types';
import { getTodayIso } from '../../lib/storage';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt'> & { id?: string }) => void;
  expenseToEdit?: Expense | null;
  defaultCurrency: CurrencyCode;
  partners?: Partner[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  defaultCurrency,
  partners = [],
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('Hospedagem');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(150);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [date, setDate] = useState(getTodayIso());
  const [paid, setPaid] = useState<boolean>(false);
  const [partnerId, setPartnerId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
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
      if (!description) setDescription(`Comissão — ${p.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ficheiro muito grande. Tamanho máximo: 5MB.');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (isCommission && !partnerId) {
      alert('Seleciona o parceiro para a comissão.');
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
      partnerName: isCommission ? partnerName || undefined : undefined,
      receiptUrl: receiptUrl || undefined,
    });

    onClose();
  };

  const isImage = receiptPreview?.startsWith('data:image') || receiptPreview?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-xl border ${isCommission ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-200 text-slate-800 border-slate-300'}`}>
              {isCommission ? <Handshake className="w-5 h-5 stroke-[2.2]" /> : <Receipt className="w-5 h-5 stroke-[2.2]" />}
            </div>
            <h3 className="font-black text-slate-900 text-base">
              {expenseToEdit ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Categoria */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              Categoria da Despesa / Saída *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-500"
            >
              <option value="Retirada Própria">💸 Retirada Própria (Saída de Caixa / Gastos)</option>
              <option value="Internet">Internet</option>
              <option value="Hospedagem">Hospedagem</option>
              <option value="Domínio">Domínio</option>
              <option value="Publicidade">Publicidade</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Salário">Salário</option>
              <option value="Comissão Parceiro">🤝 Comissão Parceiro</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Info Retirada */}
          {category === 'Retirada Própria' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
              💡 <strong>Retirada de Caixa:</strong> Este valor é debitado imediatamente do seu <strong>Saldo Real em Caixa</strong>.
            </div>
          )}

          {/* Seletor de Parceiro (apenas para Comissão) */}
          {isCommission && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <p className="text-xs font-black text-purple-800 flex items-center gap-1.5">
                <Handshake className="w-4 h-4" /> Dados da Comissão do Parceiro
              </p>

              {partners.length === 0 ? (
                <p className="text-xs text-purple-700 font-semibold">
                  ⚠️ Nenhum parceiro cadastrado. Vai a <strong>Gestão de Parceiros</strong> para cadastrar.
                </p>
              ) : (
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Parceiro que vai receber a comissão *
                  </label>
                  <select
                    value={partnerId}
                    onChange={(e) => handlePartnerSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-purple-300 focus:border-purple-500 rounded-xl text-slate-900 text-xs font-bold focus:outline-none transition-all"
                  >
                    <option value="">— Seleciona o parceiro —</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.defaultCommissionPercent ? ` (${p.defaultCommissionPercent}% comissão)` : ''}
                      </option>
                    ))}
                  </select>
                  {partnerId && (
                    <p className="mt-1 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Parceiro selecionado: <strong>{partnerName}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              Descrição / Fornecedor *
            </label>
            <input
              type="text"
              required
              placeholder={isCommission ? `Ex: Comissão — ${partnerName || 'Nome do Parceiro'}` : 'Ex: Renovação Servidor Hostinger'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-500 placeholder-slate-400"
            />
          </div>

          {/* Valor & Moeda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">
                Valor ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-black text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">Moeda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-500"
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
              <label className="text-xs font-black text-slate-800 block mb-1">Data do Pagamento</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="flex flex-col justify-center pt-3">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600"
                />
                <span className="text-xs font-black text-slate-900">Já foi Pago?</span>
              </label>
            </div>
          </div>

          {/* Upload de Comprovativo */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5">
              Comprovativo de Pagamento <span className="text-slate-400 font-semibold">(opcional — imagem ou PDF)</span>
            </label>

            {receiptPreview ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                {isImage ? (
                  <img
                    src={receiptPreview}
                    alt="Comprovativo"
                    className="w-full max-h-40 object-contain bg-white"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileImage className="w-8 h-8 text-slate-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{receiptFileName || 'Comprovativo'}</p>
                      <p className="text-[11px] text-slate-500">Ficheiro anexado</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Comprovativo anexado
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-500">Clica para carregar comprovativo</span>
                <span className="text-[11px] text-slate-400">PNG, JPG, PDF — máx. 5MB</span>
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
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Despesa</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
