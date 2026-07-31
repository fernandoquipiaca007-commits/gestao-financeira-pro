import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Save, DollarSign, Calendar, Handshake, Percent, UserCheck } from 'lucide-react';
import { Project, Client, ProjectCategory, ProjectStatus, CurrencyCode, CURRENCIES, Partner } from '../../types';
import { getTodayIso, addDaysIso } from '../../lib/storage';
import { formatCurrency } from '../../lib/formatters';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => void;
  projectToEdit?: Project | null;
  clients: Client[];
  partners?: Partner[];
  defaultCurrency: CurrencyCode;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  clients,
  partners = [],
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

  // Partner & Commission State
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionValue, setCommissionValue] = useState<number>(10);
  const [commissionPaid, setCommissionPaid] = useState(false);

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
      setHasPartner(!!projectToEdit.partnerId);
      setPartnerId(projectToEdit.partnerId || '');
      setCommissionType(projectToEdit.commissionType || 'percent');
      setCommissionValue(projectToEdit.commissionValue ?? 10);
      setCommissionPaid(projectToEdit.commissionPaid || false);
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
      setHasPartner(false);
      setPartnerId('');
      setCommissionType('percent');
      setCommissionValue(10);
      setCommissionPaid(false);
    }
  }, [projectToEdit, isOpen, clients, defaultCurrency]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const client = clients.find((c) => c.id === cId);
    if (client) {
      setCurrency(client.currency);
    }
  };

  const handlePartnerChange = (pId: string) => {
    setPartnerId(pId);
    const partner = partners.find((p) => p.id === pId);
    if (partner && partner.defaultCommissionPercent !== undefined) {
      setCommissionType('percent');
      setCommissionValue(partner.defaultCommissionPercent);
    }
  };

  if (!isOpen) return null;

  const numTotal = Number(totalAmount) || 0;
  const numPaid = Number(paidAmount) || 0;
  const remainingAmount = Math.max(0, numTotal - numPaid);

  // Commission Calculation
  let calculatedCommission = 0;
  if (hasPartner && partnerId) {
    if (commissionType === 'percent') {
      calculatedCommission = (numTotal * (Number(commissionValue) || 0)) / 100;
    } else {
      calculatedCommission = Number(commissionValue) || 0;
    }
  }
  const netStudioAmount = Math.max(0, numTotal - calculatedCommission);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    const selectedPartner = partners.find((p) => p.id === partnerId);

    onSave({
      id: projectToEdit?.id,
      name: name.trim(),
      clientId,
      category,
      totalAmount: numTotal,
      paidAmount: numPaid,
      currency,
      startDate,
      dueDate,
      nextPaymentDate: nextPaymentDate ? nextPaymentDate : undefined,
      status,
      notes: notes.trim(),
      partnerId: hasPartner ? partnerId : undefined,
      partnerName: hasPartner ? selectedPartner?.name : undefined,
      commissionType: hasPartner ? commissionType : undefined,
      commissionValue: hasPartner ? Number(commissionValue) || 0 : undefined,
      commissionAmount: hasPartner ? calculatedCommission : undefined,
      commissionPaid: hasPartner ? commissionPaid : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {projectToEdit ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <p className="text-xs text-slate-400">
                Cadastre o valor, prazos e comissão do parceiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Website Institucional"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Cliente *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - [{c.currency}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              >
                <option value="Website">Website</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Loja Virtual">Loja Virtual</option>
                <option value="Tráfego Pago">Tráfego Pago</option>
                <option value="Automação">Automação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-bold text-emerald-400"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando cliente">Aguardando cliente</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Valor Total do Projeto ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-base font-bold text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Valor Já Pago / Entrada ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-base font-bold text-emerald-400 placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-semibold">
              <span className="text-slate-400">Saldo Restante a Receber:</span>
              <span className="text-amber-400 font-extrabold text-sm">
                {formatCurrency(remainingAmount, currency)}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Previsão de Entrega
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Próximo Pagamento
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Partner & Commission Section */}
          <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPartner}
                  onChange={(e) => setHasPartner(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-800"
                />
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4 text-purple-400" />
                  Projeto em Parceria / Indicação (Comissão)
                </span>
              </label>
            </div>

            {hasPartner && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Parceiro *
                    </label>
                    <select
                      required={hasPartner}
                      value={partnerId}
                      onChange={(e) => handlePartnerChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione o parceiro...</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.defaultCommissionPercent}% comissão)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Tipo
                      </label>
                      <select
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value as 'percent' | 'fixed')}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-2 py-2 text-xs text-white"
                      >
                        <option value="percent">Porcentagem (%)</option>
                        <option value="fixed">Valor Fixo ({CURRENCIES[currency]?.symbol})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Comissão
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                        placeholder="10"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Partner Live Breakdown Box */}
                {partnerId && (
                  <div className="p-3 bg-slate-900 border border-purple-800/40 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>💰 Valor Total do Projeto:</span>
                      <strong className="text-white">{formatCurrency(numTotal, currency)}</strong>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>🤝 Comissão do Parceiro ({commissionType === 'percent' ? `${commissionValue}%` : 'Fixo'}):</span>
                      <strong className="text-purple-400">{formatCurrency(calculatedCommission, currency)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                      <span>✨ Seu Valor Líquido (Studio):</span>
                      <span>{formatCurrency(netStudioAmount, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{projectToEdit ? 'Salvar Alterações' : 'Criar Projeto'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
