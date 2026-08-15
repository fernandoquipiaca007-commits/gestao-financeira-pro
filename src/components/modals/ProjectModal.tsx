import React, { useState, useEffect, useRef } from 'react';
import { X, FolderKanban, Save, DollarSign, Calendar, Handshake, Percent, UserCheck, Paperclip, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { Project, Client, ProjectCategory, ProjectStatus, CurrencyCode, CURRENCIES, Partner, ProjectAttachment } from '../../types';
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
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAttachments(projectToEdit.attachments || []);
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
      setAttachments([]);
      setHasPartner(false);
      setPartnerId('');
      setCommissionType('percent');
      setCommissionValue(10);
      setCommissionPaid(false);
    }
  }, [projectToEdit, isOpen, clients, defaultCurrency]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`O ficheiro "${file.name}" excede o tamanho máximo de 15MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Url = ev.target?.result as string;
        const newAtt: ProjectAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type || file.name.split('.').pop() || 'file',
          url: base64Url,
          createdAt: getTodayIso(),
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

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
      attachments,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {projectToEdit ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie os detalhes, finanças e arquivos do seu projeto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Identidade Visual"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Cliente *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all"
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando cliente">Aguardando cliente</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Valor Total ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Já Pago ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs font-semibold text-slate-500">Saldo Restante:</span>
              <span className="text-sm font-black text-slate-900">
                {formatCurrency(remainingAmount, currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Entrega
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Próx. Pagamento
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: File Attachments / Anexos */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" /> Ficheiros &amp; Anexos do Projeto ({attachments.length})
              </label>
              <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Anexar Ficheiro</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhum ficheiro anexado. Adicione listas de inscritos, relatórios, PDFs ou documentos do projeto.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{att.name}</span>
                      {att.size && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(att.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <a
                        href={att.url}
                        download={att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Baixar Ficheiro"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Remover Ficheiro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPartner}
                onChange={(e) => setHasPartner(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">Projeto com parceiro/comissão</span>
            </label>

            {hasPartner && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <select
                  required
                  value={partnerId}
                  onChange={(e) => handlePartnerChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="">Selecione o parceiro...</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Comissão" value={commissionValue} onChange={(e) => setCommissionValue(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                  <select value={commissionType} onChange={(e) => setCommissionType(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    <option value="percent">%</option>
                    <option value="fixed">Fixo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md cursor-pointer">
              {projectToEdit ? 'Atualizar Projeto' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
