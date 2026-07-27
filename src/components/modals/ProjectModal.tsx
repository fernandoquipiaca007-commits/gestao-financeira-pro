import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Save, DollarSign, Calendar } from 'lucide-react';
import { Project, Client, ProjectCategory, ProjectStatus, CurrencyCode, CURRENCIES } from '../../types';
import { getTodayIso, addDaysIso } from '../../lib/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => void;
  projectToEdit?: Project | null;
  clients: Client[];
  defaultCurrency: CurrencyCode;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  clients,
  defaultCurrency,
}) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Website');
  const [totalAmount, setTotalAmount] = useState<number>(1200);
  const [paidAmount, setPaidAmount] = useState<number>(600);
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [startDate, setStartDate] = useState(getTodayIso());
  const [dueDate, setDueDate] = useState(addDaysIso(15));
  const [nextPaymentDate, setNextPaymentDate] = useState(addDaysIso(0));
  const [status, setStatus] = useState<ProjectStatus>('Em andamento');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClientId(projectToEdit.clientId);
      setCategory(projectToEdit.category);
      setTotalAmount(projectToEdit.totalAmount);
      setPaidAmount(projectToEdit.paidAmount);
      setCurrency(projectToEdit.currency);
      setStartDate(projectToEdit.startDate);
      setDueDate(projectToEdit.dueDate);
      setNextPaymentDate(projectToEdit.nextPaymentDate || '');
      setStatus(projectToEdit.status);
      setNotes(projectToEdit.notes || '');
    } else {
      setName('');
      const firstClient = clients[0];
      if (firstClient) {
        setClientId(firstClient.id);
        setCurrency(firstClient.currency || defaultCurrency);
      } else {
        setClientId('');
        setCurrency(defaultCurrency);
      }
      setCategory('Website');
      setTotalAmount(1200);
      setPaidAmount(600);
      setStartDate(getTodayIso());
      setDueDate(addDaysIso(15));
      setNextPaymentDate(addDaysIso(0));
      setStatus('Em andamento');
      setNotes('');
    }
  }, [projectToEdit, isOpen, clients, defaultCurrency]);

  // When client selection changes, inherit client's default currency
  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const client = clients.find((c) => c.id === cId);
    if (client) {
      setCurrency(client.currency);
    }
  };

  if (!isOpen) return null;

  const remainingAmount = Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    onSave({
      id: projectToEdit?.id,
      name: name.trim(),
      clientId,
      category,
      totalAmount: Number(totalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      currency,
      startDate,
      dueDate,
      nextPaymentDate: nextPaymentDate ? nextPaymentDate : undefined,
      status,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              {projectToEdit ? 'Editar Projeto' : 'Cadastrar Novo Projeto'}
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
          
          {/* Nome do Projeto */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Landing Page de Vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cliente & Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cliente *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              >
                {clients.length === 0 ? (
                  <option value="">Nenhum cliente cadastrado</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || c.currency})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="Website">Website</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Loja Virtual">Loja Virtual</option>
                <option value="Tráfego Pago">Tráfego Pago</option>
                <option value="Automação">Automação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Financeiro: Valor Total, Pago & Moeda */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Valores do Projeto
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-bold text-emerald-400"
              >
                <option value="AOA">AOA (Kz)</option>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Valor Total ({CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Valor Já Pago ({CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">Falta Pagar (Calculado):</span>
              <strong className="text-amber-400 font-bold text-sm">
                {CURRENCIES[currency]?.symbol} {remainingAmount.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Dates: Start, Due, Next Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Data de Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Data Entrega
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Próximo Pgt
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Status do Projeto
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="Em andamento">Em andamento</option>
              <option value="Aguardando cliente">Aguardando cliente</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Anotações sobre escopo, links, detalhes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Controls */}
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
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center space-x-2 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Projeto</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
