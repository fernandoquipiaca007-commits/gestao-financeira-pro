import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { Income, Client, Project, CurrencyCode, IncomeStatus, PaymentMethod, CURRENCIES } from '../../types';
import { getTodayIso } from '../../lib/storage';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: Omit<Income, 'id' | 'createdAt'> & { id?: string }) => void;
  incomeToEdit?: Income | null;
  clients: Client[];
  projects: Project[];
  defaultCurrency: CurrencyCode;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  incomeToEdit,
  clients,
  projects,
  defaultCurrency,
}) => {
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(600);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [dueDate, setDueDate] = useState(getTodayIso());
  const [receivedDate, setReceivedDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [status, setStatus] = useState<IncomeStatus>('Pendente');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (incomeToEdit) {
      setClientId(incomeToEdit.clientId);
      setProjectId(incomeToEdit.projectId || '');
      setDescription(incomeToEdit.description);
      setAmount(incomeToEdit.amount);
      setCurrency(incomeToEdit.currency);
      setDueDate(incomeToEdit.dueDate);
      setReceivedDate(incomeToEdit.receivedDate || '');
      setPaymentMethod(incomeToEdit.paymentMethod || 'PIX');
      setStatus(incomeToEdit.status);
      setNotes(incomeToEdit.notes || '');
    } else {
      const firstClient = clients[0];
      if (firstClient) {
        setClientId(firstClient.id);
        setCurrency(firstClient.currency || defaultCurrency);
      } else {
        setClientId('');
        setCurrency(defaultCurrency);
      }
      setProjectId('');
      setDescription('Parcela do Projeto');
      setAmount(600);
      setDueDate(getTodayIso());
      setReceivedDate('');
      setPaymentMethod('PIX');
      setStatus('Pendente');
      setNotes('');
    }
  }, [incomeToEdit, isOpen, clients, defaultCurrency]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const client = clients.find((c) => c.id === cId);
    if (client) {
      setCurrency(client.currency);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !description.trim()) return;

    onSave({
      id: incomeToEdit?.id,
      clientId,
      projectId: projectId ? projectId : undefined,
      description: description.trim(),
      amount: Number(amount) || 0,
      currency,
      dueDate,
      receivedDate: status === 'Recebido' ? (receivedDate || getTodayIso()) : undefined,
      paymentMethod,
      status,
      notes: notes.trim(),
    });

    onClose();
  };

  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              {incomeToEdit ? 'Editar Receita' : 'Cadastrar Nova Receita'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Cliente */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Cliente *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || c.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Projeto (Opcional) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Projeto Vinculado (Opcional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="">Sem projeto específico</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Descrição da Cobrança *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 2ª Parcela - Landing Page Mirtes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Valor & Moeda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Valor ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-bold text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-teal-500"
              >
                <option value="AOA">AOA (Kz)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Data Prevista, Forma Pgt, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Data Prevista
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Forma Pgt
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="PIX">PIX</option>
                <option value="Transferência">Transferência</option>
                <option value="Cartão">Cartão</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncomeStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="Pendente">Pendente</option>
                <option value="Recebido">Recebido</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          {/* Footer controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl flex items-center space-x-2 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Receita</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
