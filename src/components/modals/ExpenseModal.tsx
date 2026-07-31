import React, { useState, useEffect } from 'react';
import { X, Receipt, Save } from 'lucide-react';
import { Expense, ExpenseCategory, CurrencyCode, CURRENCIES } from '../../types';
import { getTodayIso } from '../../lib/storage';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt'> & { id?: string }) => void;
  expenseToEdit?: Expense | null;
  defaultCurrency: CurrencyCode;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  defaultCurrency,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('Hospedagem');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(150);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [date, setDate] = useState(getTodayIso());
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setCurrency(expenseToEdit.currency);
      setDate(expenseToEdit.date);
      setPaid(expenseToEdit.paid);
    } else {
      setCategory('Hospedagem');
      setDescription('');
      setAmount(150);
      setCurrency(defaultCurrency);
      setDate(getTodayIso());
      setPaid(false);
    }
  }, [expenseToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSave({
      id: expenseToEdit?.id,
      category,
      description: description.trim(),
      amount: Number(amount) || 0,
      currency,
      date,
      paid,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-800 border border-slate-300">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              {expenseToEdit ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
          >
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
              onChange={(e) => {
                const newCat = e.target.value as ExpenseCategory;
                setCategory(newCat);
                if (newCat === 'Retirada Própria') {
                  setPaid(true);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-500"
            >
              <option value="Retirada Própria">💸 Retirada Própria (Saída de Caixa / Gastos)</option>
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

          {category === 'Retirada Própria' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
              💡 <strong>Retirada de Caixa:</strong> Este valor é debitado imediatamente do seu <strong>Saldo Real em Caixa</strong> (disponível em conta).
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
              placeholder="Ex: Renovação Servidor Hostinger"
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
              <label className="text-xs font-black text-slate-800 block mb-1">
                Moeda
              </label>
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
              <label className="text-xs font-black text-slate-800 block mb-1">
                Data do Vencimento
              </label>
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
                <span className="text-xs font-black text-slate-900">
                  Já foi Pago?
                </span>
              </label>
            </div>
          </div>

          {/* Footer controls */}
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
