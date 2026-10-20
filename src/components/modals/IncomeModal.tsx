import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, DollarSign, Save } from 'lucide-react';
import { Income, Client, Project, CurrencyCode, IncomeStatus, PaymentMethod, CURRENCIES, getIncomeStatusLabel, getPaymentMethodLabel } from '../../types';
import { getTodayIso } from '../../lib/storage';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const isEn = lang === 'en';
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
      setDescription(isEn ? 'Project Installment' : 'Parcela do Projeto');
      setAmount(600);
      setDueDate(getTodayIso());
      setReceivedDate('');
      setPaymentMethod('PIX');
      setStatus('Pendente');
      setNotes('');
    }
  }, [incomeToEdit, isOpen, clients, defaultCurrency, isEn]);

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
    <EditorPage
      title={<>{incomeToEdit
                ? (isEn ? 'Edit Revenue' : 'Editar Receita')
                : (isEn ? 'New income' : 'Nova receita')}</>}
      trail={[isEn ? 'Finance' : 'Financeiro']}
      
      icon={<DollarSign className="w-5 h-5" />}
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
             form="income-form">
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isEn ? 'Save Revenue' : 'Guardar Receita'}</span>
            </button>
          </>}
    >
      <form id="income-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>

          {/* Cliente */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Client *' : 'Cliente *'}
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
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
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Linked Project (Optional)' : 'Projeto Vinculado (Opcional)'}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
            >
              <option value="">{isEn ? 'No specific project' : 'Sem projeto específico'}</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Invoice / Charge Description *' : 'Descrição da Cobrança *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? 'Ex: 2nd Installment - Landing Page' : 'Ex: 2ª Parcela - Landing Page Mirtes'}
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
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg font-medium focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
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

          {/* Data Prevista, Forma Pgt, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Due Date' : 'Data Prevista'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Payment Method' : 'Forma Pgt'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="PIX">PIX</option>
                <option value="Transferência">{isEn ? 'Transfer' : 'Transferência'}</option>
                <option value="Cartão">{isEn ? 'Card' : 'Cartão'}</option>
                <option value="Boleto">{isEn ? 'Bank Slip / Invoice' : 'Boleto'}</option>
                <option value="Dinheiro">{isEn ? 'Cash' : 'Dinheiro'}</option>
                <option value="Outro">{isEn ? 'Other' : 'Outro'}</option>
              </select>
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Status' : 'Estado'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncomeStatus)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="Pendente">{getIncomeStatusLabel('Pendente', lang)}</option>
                <option value="Recebido">{getIncomeStatusLabel('Recebido', lang)}</option>
                <option value="Atrasado">{getIncomeStatusLabel('Atrasado', lang)}</option>
              </select>
            </div>
          </div>

          {/* Footer controls */}
          

        </form>
    </EditorPage>
  );
};
