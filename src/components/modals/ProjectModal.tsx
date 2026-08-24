import React, { useState, useEffect, useRef } from 'react';
import { X, FolderKanban, Save, UserCheck, Paperclip, Upload, FileText, Download, Trash2, User, Users, Globe } from 'lucide-react';
import { Project, Client, ProjectCategory, ProjectStatus, CurrencyCode, CURRENCIES, Partner, ProjectAttachment } from '../../types';
import { UserProfile, ProjectAssignmentType } from '../../types/rbac';
import { getTodayIso, addDaysIso } from '../../lib/storage';
import { formatCurrency } from '../../lib/formatters';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => void;
  projectToEdit?: Project | null;
  clients: Client[];
  partners?: Partner[];
  employees?: UserProfile[];
  defaultCurrency: CurrencyCode;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  clients,
  partners = [],
  employees = [],
  defaultCurrency,
}) => {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
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

  // RBAC Assignment State
  const [assignmentType, setAssignmentType] = useState<ProjectAssignmentType>('company');
  const [assignedTo, setAssignedTo] = useState<string>('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClientId(projectToEdit.clientId);
      const initialClientIds = projectToEdit.clientIds && projectToEdit.clientIds.length > 0
        ? projectToEdit.clientIds
        : (projectToEdit.clientId ? [projectToEdit.clientId] : []);
      setSelectedClientIds(initialClientIds);
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
      setAssignmentType(projectToEdit.assignmentType || 'company');
      setAssignedTo(projectToEdit.assignedTo || '');
    } else {
      setName('');
      const firstClient = clients[0];
      if (firstClient) {
        setClientId(firstClient.id);
        setSelectedClientIds([firstClient.id]);
        setCurrency(firstClient.currency || defaultCurrency);
      } else {
        setClientId('');
        setSelectedClientIds([]);
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
      setAssignmentType('company');
      setAssignedTo('');
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
    setSelectedClientIds((prev) => {
      const rest = prev.filter((id) => id !== cId);
      return [cId, ...rest];
    });
    const client = clients.find((c) => c.id === cId);
    if (client) {
      setCurrency(client.currency);
    }
  };

  const handleToggleAdditionalClient = (cId: string) => {
    if (cId === clientId) return;
    setSelectedClientIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
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

  let calculatedCommission = 0;
  if (hasPartner && partnerId) {
    if (commissionType === 'percent') {
      calculatedCommission = (numTotal * (Number(commissionValue) || 0)) / 100;
    } else {
      calculatedCommission = Number(commissionValue) || 0;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    const selectedPartner = partners.find((p) => p.id === partnerId);
    const finalClientIds = Array.from(new Set([clientId, ...selectedClientIds])).filter(Boolean);

    onSave({
      id: projectToEdit?.id,
      name: name.trim(),
      clientId: finalClientIds[0] || clientId,
      clientIds: finalClientIds,
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
      assignmentType,
      assignedTo: assignmentType === 'employee' ? assignedTo : undefined,
      assignedToName: assignmentType === 'employee' ? employees.find(e => e.id === assignedTo)?.name : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
      <div className="bg-white border border-[#c4c7c7]/30 rounded-[24px] w-full max-w-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#c4c7c7]/40 bg-[#f7f3f2] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <FolderKanban className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1c1b1b]">
                {projectToEdit ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <p className="text-xs text-[#747878]">
                Gerencie os detalhes, finanças e arquivos do seu projeto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Identidade Visual"
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Cliente Principal *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="">Selecione o cliente principal...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - [{c.currency}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multiple Clients Selection Box */}
          {clients.length > 1 && (
            <div className="bg-[#f7f3f2] border border-[#c4c7c7]/30 p-3.5 rounded-[16px] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#0050d7]" />
                  Clientes Participantes do Projeto ({selectedClientIds.length})
                </span>
                <span className="text-[11px] text-[#747878]">
                  Marque se o projeto envolve múltiplos clientes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-36 overflow-y-auto">
                {clients.map((c) => {
                  const isPrimary = c.id === clientId;
                  const isChecked = selectedClientIds.includes(c.id);

                  return (
                    <label
                      key={c.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isPrimary
                          ? 'bg-[#dbe1ff] text-[#003da9] border-[#003da9]/20'
                          : isChecked
                          ? 'bg-white text-[#1c1b1b] border-[#c4c7c7] font-semibold'
                          : 'bg-white/60 text-[#444747] border-[#c4c7c7]/30 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPrimary}
                        onChange={() => handleToggleAdditionalClient(c.id)}
                        className="rounded border-[#c4c7c7] text-[#000000] focus:ring-0 w-4 h-4 cursor-pointer accent-[#000000]"
                      />
                      <span className="truncate">
                        {c.name} {isPrimary ? '👑 (Principal)' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* RBAC Assignment Section */}
          <div className="bg-[#f7f3f2] border border-[#c4c7c7]/30 p-4 rounded-[18px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0050d7]" />
                Responsabilidade & Atribuição do Projeto
              </span>
              <span className="text-[11px] text-[#747878]">Quem executará este projeto?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('company');
                  setAssignedTo('');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                  assignmentType === 'company'
                    ? 'border-[#000000] bg-white text-[#1c1b1b] shadow-xs'
                    : 'border-[#c4c7c7]/40 bg-white/50 text-[#747878] hover:bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    assignmentType === 'company' ? 'bg-[#000000] text-white' : 'bg-[#e5e2e1] text-[#747878]'
                  }`}
                >
                  🏢
                </div>
                <div>
                  <div className="text-xs font-semibold">Empresa</div>
                  <div className="text-[10px] text-[#747878]">Sem responsável direto</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('employee')}
                className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                  assignmentType === 'employee'
                    ? 'border-[#000000] bg-white text-[#1c1b1b] shadow-xs'
                    : 'border-[#c4c7c7]/40 bg-white/50 text-[#747878] hover:bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    assignmentType === 'employee' ? 'bg-[#0050d7] text-white' : 'bg-[#e5e2e1] text-[#747878]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Funcionário</div>
                  <div className="text-[10px] text-[#747878]">Atribuir a membro</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignmentType('available');
                  setAssignedTo('');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                  assignmentType === 'available'
                    ? 'border-[#000000] bg-white text-[#1c1b1b] shadow-xs'
                    : 'border-[#c4c7c7]/40 bg-white/50 text-[#747878] hover:bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    assignmentType === 'available' ? 'bg-[#003da9] text-white' : 'bg-[#e5e2e1] text-[#747878]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Disponível</div>
                  <div className="text-[10px] text-[#747878]">Para equipa assumir</div>
                </div>
              </button>
            </div>

            {/* Employee selection dropdown if 'employee' is selected */}
            {assignmentType === 'employee' && (
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                  Selecionar Funcionário Responsável *
                </label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full bg-white border border-[#c4c7c7]/40 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] font-medium focus:outline-none focus:border-[#000000] transition-all"
                >
                  <option value="">Selecione o membro da equipa...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role === 'admin' ? 'Admin' : 'Funcionário'}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
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
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando cliente">Aguardando cliente</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[16px]">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Valor Total ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Já Pago ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border-t border-[#c4c7c7]/40 pt-3">
              <span className="text-xs text-[#747878]">Saldo Restante:</span>
              <span className="text-sm font-medium text-[#000000]">
                {formatCurrency(remainingAmount, currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Entrega
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Próx. Pagamento
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
              />
            </div>
          </div>

          {/* Section: File Attachments / Anexos */}
          <div className="p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[16px] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#0050d7]" /> Ficheiros &amp; Anexos do Projeto ({attachments.length})
              </label>
              <label className="px-3 py-1.5 bg-white hover:bg-[#f1edec] text-[#1c1b1b] border border-[#c4c7c7]/40 rounded-full text-xs font-medium flex items-center space-x-1 cursor-pointer transition-all">
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
              <p className="text-xs text-[#747878] italic">
                Nenhum ficheiro anexado. Adicione listas de inscritos, relatórios, PDFs ou documentos do projeto.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#c4c7c7]/30 rounded-xl text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-[#747878] shrink-0" />
                      <span className="font-medium text-[#1c1b1b] truncate">{att.name}</span>
                      {att.size && (
                        <span className="text-[10px] text-[#747878] shrink-0">
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
                        className="p-1.5 text-[#0050d7] hover:bg-[#f1edec] rounded-full transition-colors"
                        title="Baixar Ficheiro"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
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

          <div className="p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[16px] space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPartner}
                onChange={(e) => setHasPartner(e.target.checked)}
                className="w-4 h-4 text-[#000000] rounded border-[#c4c7c7] focus:ring-0 accent-[#000000]"
              />
              <span className="text-xs font-medium text-[#1c1b1b]">Projeto com parceiro/comissão</span>
            </label>

            {hasPartner && (
              <div className="space-y-3 border-t border-[#c4c7c7]/40 pt-3">
                <select
                  required
                  value={partnerId}
                  onChange={(e) => handlePartnerChange(e.target.value)}
                  className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3 py-2 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000]"
                >
                  <option value="">Selecione o parceiro...</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Comissão" value={commissionValue} onChange={(e) => setCommissionValue(Number(e.target.value))} className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3 py-2 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000]" />
                  <select value={commissionType} onChange={(e) => setCommissionType(e.target.value as any)} className="w-full bg-white border border-[#c4c7c7]/35 rounded-xl px-3 py-2 text-xs text-[#1c1b1b] focus:outline-none focus:border-[#000000]">
                    <option value="percent">%</option>
                    <option value="fixed">Fixo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#c4c7c7]/40">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[29px] bg-[#f1edec] text-sm font-medium text-[#1c1b1b] hover:bg-[#e5e2e1] cursor-pointer transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[#000000] text-white text-sm font-medium rounded-[29px] hover:opacity-85 cursor-pointer active:scale-95 transition-all">
              {projectToEdit ? 'Atualizar Projeto' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
