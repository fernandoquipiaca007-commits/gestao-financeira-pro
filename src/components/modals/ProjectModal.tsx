import React, { useState, useEffect, useRef } from 'react';
import { confirmAction, toast } from '../../lib/feedback';
import { EditorPage } from '../shell/EditorPage';
import { RichTextField } from '../editor/RichTextField';
import { X, FolderKanban, Save, UserCheck, Paperclip, Upload, FileText, Download, Trash2, User, Users, Globe, Building2 } from 'lucide-react';
import { Project, Client, ProjectCategory, ProjectStatus, CurrencyCode, CURRENCIES, Partner, ProjectAttachment, getProjectStatusLabel, BillingType, BILLING_TYPE_LABELS } from '../../types';
import { UserProfile, ProjectAssignmentType } from '../../types/rbac';
import { getTodayIso, addDaysIso } from '../../lib/storage';
import { formatCurrency } from '../../lib/formatters';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => void;
  projectToEdit?: Project | null;
  clients: Client[];
  partners?: Partner[];
  employees?: UserProfile[];
  categories?: import('../../types').CategoryItem[];
  defaultCurrency: CurrencyCode;
  /** Planos da tabela de preços, para escolher ao criar o projeto */
  products?: import('../../types').Product[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  clients,
  partners = [],
  employees = [],
  categories = [],
  defaultCurrency,
  products = [],
}) => {
  const { lang, isEn, t } = useLanguage();
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [category, setCategory] = useState<ProjectCategory>('Website');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  // Único (feito de uma vez) ou recorrente: cada período gera uma cobrança automática.
  const [billingType, setBillingType] = useState<BillingType>('unico');
  const [recurringAmount, setRecurringAmount] = useState<number>(0);
  const [recurringEnd, setRecurringEnd] = useState('');
  const isRecurring = billingType !== 'unico';
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [startDate, setStartDate] = useState(getTodayIso());
  const [dueDate, setDueDate] = useState(addDaysIso(30));
  const [nextPaymentDate, setNextPaymentDate] = useState(addDaysIso(15));
  // Entrega sem data definida (ex.: funis sem fim marcado)
  const [noDueDate, setNoDueDate] = useState(false);
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

  // Invoice / Stripe Customization State
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');

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
      setProductId(projectToEdit.productId || '');
      setTotalAmount(projectToEdit.totalAmount);
      setPaidAmount(projectToEdit.paidAmount);
      setBillingType(projectToEdit.billingType || 'unico');
      setRecurringAmount(projectToEdit.recurringAmount || 0);
      setRecurringEnd(projectToEdit.recurringEnd || '');
      setCurrency(projectToEdit.currency);
      setStartDate(projectToEdit.startDate);
      setDueDate(projectToEdit.dueDate || addDaysIso(30));
      setNoDueDate(!projectToEdit.dueDate);
      setNextPaymentDate(projectToEdit.nextPaymentDate || '');
      setStatus(projectToEdit.status);
      setNotes(projectToEdit.notes || '');
      setAttachments(projectToEdit.attachments || []);
      setHasPartner(!!projectToEdit.partnerId);
      setPartnerId(projectToEdit.partnerId || '');
      setCommissionType(projectToEdit.commissionType || 'percent');
      setCommissionValue(projectToEdit.commissionValue ?? 10);
      setCommissionPaid(projectToEdit.commissionPaid || false);
      setInvoiceNotes(projectToEdit.invoiceNotes || '');
      setInvoiceFooter(projectToEdit.invoiceFooter || '');
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
      setCategory(categories.length > 0 ? categories[0].name : 'Website');
      setTotalAmount(0);
      setPaidAmount(0);
      setProductId('');
      setBillingType('unico');
      setRecurringAmount(0);
      setRecurringEnd('');
      setStartDate(getTodayIso());
      setDueDate(addDaysIso(30));
      setNoDueDate(false);
      setNextPaymentDate(addDaysIso(15));
      setStatus('Em andamento');
      setNotes('');
      setAttachments([]);
      setHasPartner(false);
      setPartnerId('');
      setCommissionType('percent');
      setCommissionValue(10);
      setCommissionPaid(false);
      setInvoiceNotes('');
      setInvoiceFooter('');
      setAssignmentType('company');
      setAssignedTo('');
    }
  }, [projectToEdit, isOpen, clients, defaultCurrency]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 15 * 1024 * 1024) {
        toast({ tone: 'warning', title: isEn ? `The file "${file.name}" exceeds the maximum 15MB limit.` : `O ficheiro "${file.name}" excede o tamanho máximo de 15MB.` });
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
  const isFullyPaid = numTotal > 0 && numPaid >= numTotal;
  const remainingAmount = Math.max(0, numTotal - numPaid);

  let calculatedCommission = 0;
  if (hasPartner && partnerId) {
    if (commissionType === 'percent') {
      calculatedCommission = (numTotal * (Number(commissionValue) || 0)) / 100;
    } else {
      calculatedCommission = Number(commissionValue) || 0;
    }
  }

  // Dynamic categories combined with standard project presets and current category
  const defaultProjectPresets = ['Website', 'Landing Page', 'Loja Virtual', 'Tráfego Pago', 'Automação', 'Consultoria', 'Design', 'Outro'];
  const availableProjectCategories = Array.from(
    new Set([
      ...categories.map((c) => c.name),
      ...defaultProjectPresets,
      ...(category ? [category] : []),
    ])
  );

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
      productId: productId || undefined,
      billingType,
      recurringAmount: isRecurring ? Number(recurringAmount) || 0 : undefined,
      recurringEnd: isRecurring ? recurringEnd || undefined : undefined,
      currency,
      startDate,
      dueDate: noDueDate ? '' : dueDate,
      // pago na totalidade: não há próximo pagamento
      // recorrente: as datas de cobrança são automáticas; pago na totalidade: não há próximo pagamento
      nextPaymentDate: !isRecurring && !isFullyPaid && nextPaymentDate ? nextPaymentDate : undefined,
      status,
      notes: notes.trim(),
      attachments,
      partnerId: hasPartner ? partnerId : undefined,
      partnerName: hasPartner ? selectedPartner?.name : undefined,
      commissionType: hasPartner ? commissionType : undefined,
      commissionValue: hasPartner ? Number(commissionValue) || 0 : undefined,
      commissionAmount: hasPartner ? calculatedCommission : undefined,
      commissionPaid: hasPartner ? commissionPaid : undefined,
      invoiceNotes: invoiceNotes.trim() || undefined,
      invoiceFooter: invoiceFooter.trim() || undefined,
      assignmentType,
      assignedTo: assignmentType === 'employee' ? assignedTo : undefined,
      assignedToName: assignmentType === 'employee' ? employees.find(e => e.id === assignedTo)?.name : undefined,
    });

    onClose();
  };

  return (
    <EditorPage
      title={<>{projectToEdit ? (isEn ? 'Edit project' : 'Editar projeto') : (isEn ? 'New project' : 'Novo projeto')}</>}
      trail={[isEn ? 'Projects' : 'Projetos']}
      subtitle={<>{isEn ? 'Details, clients, finances and files.' : 'Detalhes, clientes, finanças e ficheiros do projeto.'}</>}
      icon={<FolderKanban className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
            <button type="button" onClick={onClose} className="aura-btn aura-btn--ghost">
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button type="submit" className="aura-btn aura-btn--primary" form="project-form">
              {projectToEdit ? (isEn ? 'Save changes' : 'Guardar alterações') : (isEn ? 'Create project' : 'Criar projeto')}
            </button>
          </>}
    >
      <form id="project-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>
          
          <div className="grid gap-5">
            {products.some((p) => p.active || p.id === productId) && (
              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5" htmlFor="pm-product">{isEn ? 'Plan (price list)' : 'Plano (tabela de preços)'}</label>
                <select
                  id="pm-product"
                  value={productId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setProductId(id);
                    const prod = products.find((x) => x.id === id);
                    if (!prod || projectToEdit) return;
                    // Preenche o que dá para preencher; o valor fechado escreve-se a seguir.
                    if (!name.trim()) setName(prod.name);
                    if (prod.billing === 'mensal') { setBillingType('mensal'); setRecurringAmount(prod.priceMin); }
                    else { setBillingType('unico'); setTotalAmount(prod.priceMin); }
                    if (categories.some((c) => c.name === 'Tráfego Pago')) setCategory('Tráfego Pago' as ProjectCategory);
                  }}
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg cursor-pointer focus:outline-none focus:border-accent"
                >
                  <option value="">{isEn ? 'No plan' : 'Sem plano'}</option>
                  {products.filter((p) => p.active || p.id === productId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.priceMin === p.priceMax ? formatCurrency(p.priceMin, p.currency) : `${formatCurrency(p.priceMin, p.currency)} a ${formatCurrency(p.priceMax, p.currency)}`}{p.billing === 'mensal' ? (isEn ? '/month' : '/mês') : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Project name *' : 'Nome do projeto *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEn ? "e.g. Brand Identity & Redesign" : "Ex: Identidade Visual"}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Primary client *' : 'Cliente principal *'}
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm font-medium text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="">{isEn ? 'Select primary client...' : 'Selecione o cliente principal...'}</option>
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
            <div className="bg-surface-2 border border-line-subtle p-3.5 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-accent-soft-fg " />
                  {isEn ? `Participating Project Clients (${selectedClientIds.length})` : `Clientes participantes (${selectedClientIds.length})`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {clients.map((c) => {
                  const isPrimary = c.id === clientId;
                  const isChecked = selectedClientIds.includes(c.id);

                  return (
                    <label
                      key={c.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-md border text-xs font-medium cursor-pointer transition-all ${
 isPrimary
 ? 'bg-accent-soft text-accent-soft-fg border-accent/20'
 : isChecked
 ? 'bg-glass-strong text-fg border-line font-semibold'
 : 'bg-white/60 text-fg-secondary border-line-subtle hover:bg-surface-1 '
 }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPrimary}
                        onChange={() => handleToggleAdditionalClient(c.id)}
                        className="rounded border-line text-fg focus:ring-0 w-4 h-4 cursor-pointer accent-[#000000]"
                      />
                      <span className="truncate">
                        {c.name} {isPrimary ? (isEn ? '(Primary)' : '(Principal)') : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* RBAC Assignment Section */}
          <div className="bg-surface-2 border border-line-subtle p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <Users className="w-4 h-4 text-accent-soft-fg " />
                {isEn ? 'Project owner' : 'Responsável pelo projeto'}
              </span>
              <span className="text-[11px] text-fg-muted ">{isEn ? 'Who will execute this project?' : 'Quem executará este projeto?'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('company');
                  setAssignedTo('');
                }}
                className={`p-2.5 rounded-md border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
 assignmentType === 'company'
 ? 'border-fg bg-glass-strong text-fg shadow-xs'
 : 'border-line-subtle bg-white/50 text-fg-muted hover:bg-surface-1 '
 }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
 assignmentType === 'company' ? 'bg-primary shadow-primary-3d text-primary-fg ' : 'bg-surface-3 text-fg-muted'
 }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{isEn ? 'Company' : 'Empresa'}</div>
                  <div className="text-[10px] text-fg-muted ">{isEn ? 'No direct assignee' : 'Sem responsável direto'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('employee')}
                className={`p-2.5 rounded-md border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
 assignmentType === 'employee'
 ? 'border-fg bg-glass-strong text-fg shadow-xs'
 : 'border-line-subtle bg-white/50 text-fg-muted hover:bg-surface-1 '
 }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
 assignmentType === 'employee' ? 'bg-accent text-white' : 'bg-surface-3 text-fg-muted'
 }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{isEn ? 'Employee' : 'Funcionário'}</div>
                  <div className="text-[10px] text-fg-muted ">{isEn ? 'Assign to member' : 'Atribuir a membro'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignmentType('available');
                  setAssignedTo('');
                }}
                className={`p-2.5 rounded-md border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
 assignmentType === 'available'
 ? 'border-fg bg-glass-strong text-fg shadow-xs'
 : 'border-line-subtle bg-white/50 text-fg-muted hover:bg-surface-1 '
 }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
 assignmentType === 'available' ? 'bg-accent-hover text-white' : 'bg-surface-3 text-fg-muted'
 }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{isEn ? 'Available' : 'Disponível'}</div>
                  <div className="text-[10px] text-fg-muted ">{isEn ? 'For team to take on' : 'Para equipa assumir'}</div>
                </div>
              </button>
            </div>

            {/* Employee selection dropdown if 'employee' is selected */}
            {assignmentType === 'employee' && (
              <div className="pt-2">
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                  {isEn ? 'Select Assigned Employee *' : 'Selecionar Funcionário Responsável *'}
                </label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full bg-glass-strong border border-line-subtle rounded-md px-3.5 py-2.5 text-sm text-fg font-medium focus:outline-none focus:border-accent transition-all cursor-pointer"
                >
                  <option value="">{isEn ? 'Select team member...' : 'Selecione o membro da equipa...'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role === 'admin' ? 'Admin' : (isEn ? 'Employee' : 'Funcionário')}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Category' : 'Categoria'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer font-medium"
              >
                {availableProjectCategories.map((catName) => (
                  <option key={catName} value={catName}>
                    ● {catName}
                  </option>
                ))}
              </select>
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
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Status' : 'Estado'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="Em andamento">{getProjectStatusLabel('Em andamento', lang)}</option>
                <option value="Aguardando cliente">{getProjectStatusLabel('Aguardando cliente', lang)}</option>
                <option value="Concluído">{getProjectStatusLabel('Concluído', lang)}</option>
                <option value="Cancelado">{getProjectStatusLabel('Cancelado', lang)}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Billing type' : 'Tipo de cobrança'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(BILLING_TYPE_LABELS) as BillingType[]).map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setBillingType(bt)}
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-all cursor-pointer ${billingType === bt ? 'border-fg bg-surface-2 text-fg shadow-xs' : 'border-line-subtle text-fg-secondary hover:border-line-strong bg-glass-strong'}`}
                >
                  {isEn ? BILLING_TYPE_LABELS[bt].en : BILLING_TYPE_LABELS[bt].pt}
                </button>
              ))}
            </div>
            <p className="mt-1.5 mb-0 text-[12px] text-fg-muted">
              {isRecurring
                ? (isEn ? 'A pending charge is created automatically for each period, 30 days before it is due.' : 'É criada automaticamente uma cobrança pendente em cada período, 30 dias antes do vencimento, a partir da data de início.')
                : (isEn ? 'Done once: total amount and what has been paid.' : 'Feito de uma só vez: valor total e o que já foi pago.')}
            </p>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-2 border border-line-subtle rounded-lg">
              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                  {isEn ? 'Amount per period' : `Valor por ${BILLING_TYPE_LABELS[billingType].period}`} ({CURRENCIES[currency]?.symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-glass-strong border border-line-subtle rounded-md px-3.5 py-2.5 text-sm font-medium text-fg focus:outline-none focus:border-accent "
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">{isEn ? 'Contract end (optional)' : 'Fim do contrato (opcional)'}</label>
                <input
                  type="date"
                  value={recurringEnd}
                  min={startDate || undefined}
                  onChange={(e) => setRecurringEnd(e.target.value)}
                  className="w-full bg-glass-strong border border-line-subtle rounded-md px-3.5 py-2.5 text-sm font-medium text-fg focus:outline-none focus:border-accent "
                />
              </div>
              <p className="sm:col-span-2 m-0 text-[12px] text-fg-muted border-t border-line-subtle pt-3">
                {isEn ? 'Paid so far:' : 'Pago até agora:'} <strong className="text-fg font-medium">{formatCurrency(numPaid, currency)}</strong> · {isEn ? 'mark each charge as received in Finance.' : 'marque cada cobrança como recebida no Financeiro.'}
              </p>
            </div>
          )}

          {!isRecurring && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-2 border border-line-subtle rounded-lg">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Total amount' : 'Valor total'} ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-glass-strong border border-line-subtle rounded-md px-3.5 py-2.5 text-sm font-medium text-fg focus:outline-none focus:border-accent "
              />
              {(() => {
                const prod = products.find((x) => x.id === productId);
                if (!prod || prod.billing === 'mensal') return null;
                const out = totalAmount < prod.priceMin || totalAmount > prod.priceMax;
                return (
                  <p className={`m-0 mt-1 text-[12px] ${out ? 'text-warning-fg' : 'text-fg-muted'}`}>
                    {isEn ? 'Plan range: ' : 'Faixa do plano: '}{formatCurrency(prod.priceMin, prod.currency)}{prod.priceMax !== prod.priceMin ? ` – ${formatCurrency(prod.priceMax, prod.currency)}` : ''}
                    {out ? (isEn ? ' · outside the range' : ' · fora da faixa') : ''}
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Amount paid' : 'Já pago'} ({CURRENCIES[currency]?.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-glass-strong border border-line-subtle rounded-md px-3.5 py-2.5 text-sm font-medium text-fg focus:outline-none focus:border-accent "
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border-t border-line-subtle pt-3">
              <span className="text-xs text-fg-muted ">{isEn ? 'Remaining:' : 'Em falta:'}</span>
              <span className="text-sm font-medium text-fg ">
                {formatCurrency(remainingAmount, currency)}
              </span>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Start Date' : 'Início'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent "
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Due Date' : 'Entrega'}
              </label>
              {noDueDate ? (
                <div className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg-muted">{isEn ? 'No date set' : 'Data indefinida'}</div>
              ) : (
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent "
                />
              )}
              <label className="mt-1.5 flex items-center gap-2 text-[12px] text-fg-secondary cursor-pointer">
                <input type="checkbox" checked={noDueDate} onChange={(e) => setNoDueDate(e.target.checked)} />
                {isEn ? 'No end date yet' : 'Data indefinida'}
              </label>
            </div>

            {!isFullyPaid && !isRecurring && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Next Payment' : 'Próx. Pagamento'}
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent "
              />
            </div>
            )}
          </div>

          {/* Descrição rica do projeto */}
          <RichTextField
            id="project-notes"
            label={isEn ? 'Project description' : 'Descrição do projeto'}
            value={notes}
            onChange={setNotes}
            lang={isEn ? 'en' : 'pt'}
            template="project"
          />

          {/* Section: File Attachments / Anexos */}
          <div className="p-4 bg-surface-2 border border-line-subtle rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-accent-soft-fg " /> {isEn ? 'Project Files & Attachments' : 'Ficheiros & Anexos do Projeto'} ({attachments.length})
              </label>
              <label className="px-3 py-1.5 bg-glass-strong hover:bg-sunken text-fg border border-line-subtle rounded-full text-xs font-medium flex items-center space-x-1 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{isEn ? 'Attach File' : 'Anexar Ficheiro'}</span>
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
              <p className="text-xs text-fg-muted italic">
                {isEn ? 'No files attached. Add attendee lists, reports, PDFs, or project documents.' : 'Nenhum ficheiro anexado. Adicione listas de inscritos, relatórios, PDFs ou documentos do projeto.'}
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-glass-strong border border-line-subtle rounded-md text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-fg-muted shrink-0" />
                      <span className="font-medium text-fg truncate">{att.name}</span>
                      {att.size && (
                        <span className="text-[10px] text-fg-muted shrink-0">
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
                        className="p-1.5 text-accent-soft-fg hover:bg-sunken rounded-full transition-colors"
                        title={isEn ? 'Download File' : 'Baixar Ficheiro'}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                        title={isEn ? 'Remove File' : 'Remover Ficheiro'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Dados Padrão para Fatura Stripe */}
          <div className="p-4 bg-surface-2 border border-line-subtle rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#635bff] " /> {isEn ? 'Stripe Invoice Details (Optional)' : 'Dados para Faturas Stripe (Opcional)'}
              </label>
              <span className="text-[11px] text-fg-muted ">{isEn ? 'Auto-prefilled on invoice' : 'Preenchimento automático na fatura'}</span>
            </div>
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                {isEn ? 'Service Description (Invoice item)' : 'Descrição do Serviço (Item na fatura)'}
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder={isEn ? "e.g. Paid Traffic Management - Month 1" : "Ex: Gestão de Tráfego Pago - 1º Mês"}
                className="w-full bg-glass-strong border border-line-subtle rounded-md px-3 py-2 text-xs text-fg focus:outline-none focus:border-[#635bff]/60 transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1">
                {isEn ? 'Standard Invoice Footer (Bank details, Tax ID, notes)' : 'Rodapé Padrão da Fatura (PIX, CNPJ, dados bancários)'}
              </label>
              <textarea
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                rows={2}
                placeholder={isEn ? "e.g. Bank: Chase | IBAN/Tax ID: US123456789" : "Ex.: IBAN: XX00 0000 0000 0000 0000 0 | NIF: 000000000"}
                className="w-full bg-glass-strong border border-line-subtle rounded-md px-3 py-2 text-xs text-fg focus:outline-none focus:border-[#635bff]/60 resize-none transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-surface-2 border border-line-subtle rounded-lg space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPartner}
                onChange={(e) => setHasPartner(e.target.checked)}
                className="w-4 h-4 text-fg rounded border-line focus:ring-0 accent-[#000000]"
              />
              <span className="text-xs font-medium text-fg ">{isEn ? 'Project with partner/commission' : 'Projeto com parceiro/comissão'}</span>
            </label>

            {hasPartner && (
              <div className="space-y-3 border-t border-line-subtle pt-3">
                <select
                  required
                  value={partnerId}
                  onChange={(e) => handlePartnerChange(e.target.value)}
                  className="w-full bg-glass-strong border border-line-subtle rounded-md px-3 py-2 text-xs text-fg focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">{isEn ? 'Select partner...' : 'Selecione o parceiro...'}</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder={isEn ? "Commission" : "Comissão"} value={commissionValue} onChange={(e) => setCommissionValue(Number(e.target.value))} className="w-full bg-glass-strong border border-line-subtle rounded-md px-3 py-2 text-xs text-fg focus:outline-none focus:border-accent " />
                  <select value={commissionType} onChange={(e) => setCommissionType(e.target.value as any)} className="w-full bg-glass-strong border border-line-subtle rounded-md px-3 py-2 text-xs text-fg focus:outline-none focus:border-accent cursor-pointer">
                    <option value="percent">%</option>
                    <option value="fixed">{isEn ? 'Fixed' : 'Fixo'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          
        </form>
    </EditorPage>
  );
};
