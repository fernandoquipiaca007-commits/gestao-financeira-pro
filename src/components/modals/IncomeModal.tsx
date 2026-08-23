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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-[#c4c7c7]/30 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#f7f3f2] p-5 border-b border-[#c4c7c7]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">
              {incomeToEdit ? 'Editar Receita' : 'Cadastrar Nova Receita'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Cliente */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Cliente *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Projeto Vinculado (Opcional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Descrição da Cobrança *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 2ª Parcela - Landing Page Mirtes"
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
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#000000] font-medium placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Data Prevista
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Forma Pgt
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncomeStatus)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="Pendente">Pendente</option>
                <option value="Recebido">Recebido</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          {/* Footer controls */}
          <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Receita</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
