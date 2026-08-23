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
      if (!description) setDescription(`Comissão - ${p.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ficheiro muito grande. Tamanho maximo: 5MB.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-[#c4c7c7]/30 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-5 border-b border-[#c4c7c7]/40 flex items-center justify-between bg-[#f7f3f2] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              {isCommission ? <Handshake className="w-4 h-4 stroke-[2.2]" /> : <Receipt className="w-4 h-4 stroke-[2.2]" />}
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">
              {expenseToEdit ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Categoria */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Categoria da Despesa / Saída *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            >
              <option value="Retirada Própria">Retirada Própria (Saída de Caixa / Gastos)</option>
              <option value="Internet">Internet</option>
              <option value="Hospedagem">Hospedagem</option>
              <option value="Domínio">Domínio</option>
              <option value="Publicidade">Publicidade</option>
              <option value="Ferramentas">Ferramentas</option>
              <option value="Salário">Salário</option>
              <option value="Comissão Parceiro">Comissão Parceiro</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Info Retirada */}
          {category === 'Retirada Própria' && (
            <div className="p-3 bg-[#fff3d6] border border-[#f0d080]/50 rounded-xl text-xs text-[#7a5400] font-medium">
              Retirada de Caixa: Este valor é debitado imediatamente do seu Saldo Real em Caixa.
            </div>
          )}

          {/* Seletor de Parceiro (apenas para Comissao) */}
          {isCommission && (
            <div className="p-4 bg-[#f1edec] border border-[#c4c7c7]/40 rounded-xl space-y-3">
              <p className="text-[11px] font-semibold text-[#444747] uppercase tracking-widest flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-[#0050d7]" /> Dados da Comissao do Parceiro
              </p>

              {partners.length === 0 ? (
                <p className="text-xs text-[#444747] font-medium">
                  Nenhum parceiro cadastrado. Va a Gestao de Parceiros para cadastrar.
                </p>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                    Parceiro que vai receber a comissao *
                  </label>
                  <select
                    value={partnerId}
                    onChange={(e) => handlePartnerSelect(e.target.value)}
                    className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
                  >
                    <option value="">Seleciona o parceiro</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.defaultCommissionPercent ? ` (${p.defaultCommissionPercent}% comissao)` : ''}
                      </option>
                    ))}
                  </select>
                  {partnerId && (
                    <p className="mt-1.5 text-[11px] text-[#1a6b3a] font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Parceiro selecionado: <strong>{partnerName}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Descricao */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Descricao / Fornecedor *
            </label>
            <input
              type="text"
              required
              placeholder={isCommission ? `Ex: Comissao - ${partnerName || 'Nome do Parceiro'}` : 'Ex: Renovacao Servidor Hostinger'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          {/* Valor & Moeda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Valor ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Moeda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="AOA">AOA (Kz)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (euro)</option>
              </select>
            </div>
          </div>

          {/* Data & Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Data do Pagamento</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
            <div className="flex flex-col justify-center pt-3">
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-2">
                Status de Pagamento
              </label>
              <div className="flex rounded-[29px] bg-[#f1edec] border border-[#c4c7c7]/40 p-0.5 w-fit gap-0.5">
                <button
                  type="button"
                  onClick={() => setPaid(false)}
                  className={`px-3.5 py-1.5 rounded-[29px] text-xs font-medium transition-all cursor-pointer ${!paid ? 'bg-[#000000] text-white' : 'text-[#444747] hover:text-[#1c1b1b]'}`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setPaid(true)}
                  className={`px-3.5 py-1.5 rounded-[29px] text-xs font-medium transition-all cursor-pointer ${paid ? 'bg-[#000000] text-white' : 'text-[#444747] hover:text-[#1c1b1b]'}`}
                >
                  Pago
                </button>
              </div>
            </div>
          </div>

          {/* Upload de Comprovativo */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Comprovativo de Pagamento <span className="text-[#c4c7c7] normal-case tracking-normal font-normal">(opcional - imagem ou PDF)</span>
            </label>

            {receiptPreview ? (
              <div className="border border-[#c4c7c7]/40 rounded-[16px] overflow-hidden bg-[#f7f3f2]">
                {isImage ? (
                  <img
                    src={receiptPreview}
                    alt="Comprovativo"
                    className="w-full max-h-40 object-contain bg-white"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileImage className="w-8 h-8 text-[#747878] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1c1b1b] truncate">{receiptFileName || 'Comprovativo'}</p>
                      <p className="text-[11px] text-[#747878]">Ficheiro anexado</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#c4c7c7]/40 bg-[#f7f3f2]">
                  <span className="text-[11px] text-[#1a6b3a] font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Comprovativo anexado
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="text-[11px] text-[#93000a] hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#c4c7c7] hover:border-[#747878] rounded-[16px] cursor-pointer bg-[#f7f3f2] hover:bg-[#f1edec] transition-colors">
                <Upload className="w-5 h-5 text-[#747878] mb-1" />
                <span className="text-xs font-medium text-[#747878]">Clica para carregar comprovativo</span>
                <span className="text-[11px] text-[#c4c7c7]">PNG, JPG, PDF - max. 5MB</span>
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
          <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center space-x-2 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 stroke-[2]" />
              <span>Salvar Despesa</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
