import React, { useState } from 'react';
import { Handshake, Plus, Phone, Mail, Trash2, Edit2, MessageCircle, CheckCircle2, Clock, DollarSign, FolderKanban, Check } from 'lucide-react';
import { Partner, Project, Expense, CurrencyCode, AppSettings } from '../types';
import { formatCurrency } from '../lib/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface PartnersViewProps {
  partners: Partner[];
  projects: Project[];
  expenses?: Expense[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  initialFilter?: string;
  onOpenNewPartnerModal: () => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partnerId: string) => void;
  onToggleProjectCommissionPaid?: (project: Project) => void;
  onOpenNewExpenseModal?: () => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  projects,
  expenses = [],
  settings,
  currencyFilter,
  initialFilter,
  onOpenNewPartnerModal,
  onEditPartner,
  onDeletePartner,
  onToggleProjectCommissionPaid,
  onOpenNewExpenseModal,
  onOpenWhatsAppCharge,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [filterPendingOnly, setFilterPendingOnly] = useState(initialFilter === 'pendentes');

  React.useEffect(() => {
    if (initialFilter === 'pendentes') {
      setFilterPendingOnly(true);
    }
  }, [initialFilter]);

  const filteredPartners = partners.filter((p) => {
    if (filterPendingOnly) {
      const partnerProjects = projects.filter((proj) => proj.partnerId === p.id);
      const hasPending = partnerProjects.some((proj) => !proj.commissionPaid && ((proj.commissionAmount || 0) > 0 || (proj.commissionValue || 0) > 0));
      if (!hasPending) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-glass border border-line-subtle p-5 rounded-xl shadow-glass">
        <div className="flex items-center space-x-3.5">
          <div>
            <h1 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
              {isEn ? 'Partners' : 'Parceiros'}
            </h1>
            <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
              {isEn ? 'Who refers clients to you and the commission on each project.' : 'Quem lhe indica clientes e a comissão de cada projeto.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewExpenseModal && (
            <button
              onClick={onOpenNewExpenseModal}
              className="aura-btn aura-btn--secondary justify-center"
            >
              <DollarSign className="w-4 h-4 text-fg-muted " />
              <span>{isEn ? 'Record Commission Expense' : 'Lançar Despesa de Comissão'}</span>
            </button>
          )}

          <button
            onClick={onOpenNewPartnerModal}
            className="aura-btn aura-btn--primary justify-center shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{isEn ? 'New partner' : 'Novo parceiro'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {partners.length > 0 && (
        <div className="bg-glass border border-line-subtle rounded-xl p-4 shadow-glass flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder={isEn ? 'Search partner by name or notes...' : 'Pesquisar parceiro por nome ou notas...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-surface-2 border border-line-subtle rounded-full text-fg text-xs placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterPendingOnly(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
 !filterPendingOnly
 ? 'bg-primary shadow-primary-3d text-primary-fg'
 : 'bg-surface-2 text-fg-secondary hover:bg-surface-3 '
 }`}
            >
              {isEn ? `All (${partners.length})` : `Todos (${partners.length})`}
            </button>
            <button
              onClick={() => setFilterPendingOnly(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
 filterPendingOnly
 ? 'bg-warning text-white'
 : 'bg-warning-soft text-warning-fg hover:bg-[#ffecc0] '
 }`}
            >
              {isEn ? 'Pending commissions' : 'Comissões pendentes'}
            </button>
          </div>
        </div>
      )}

      {/* Partners List & Cards */}
      {partners.length === 0 ? (
        <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center space-y-4 shadow-glass">
          <div className="w-16 h-16 rounded-full bg-surface-2 text-fg-muted flex items-center justify-center mx-auto">
            <Handshake className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-fg ">
            {isEn ? 'No partners registered yet' : 'Ainda não tem parceiros'}
          </h3>
          <p className="text-xs text-fg-muted max-w-md mx-auto">
            {isEn
              ? 'Add the people who refer clients to you and set their commission per project, as a percentage or a fixed amount.'
              : 'Adicione quem lhe indica clientes e defina a comissão de cada projeto, em percentagem ou valor fixo.'}
          </p>
          <button
            onClick={onOpenNewPartnerModal}
            className="aura-btn aura-btn--primary aura-btn--sm inline-flex"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{isEn ? 'Add first partner' : 'Adicionar primeiro parceiro'}</span>
          </button>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-glass border border-line-subtle rounded-xl p-12 text-center space-y-3">
          <Handshake className="w-10 h-10 text-fg-disabled mx-auto" />
          <h3 className="text-sm font-semibold text-fg ">
            {isEn ? 'No partners found with this filter' : 'Nenhum parceiro encontrado com este filtro'}
          </h3>
          <button
            onClick={() => { setSearchTerm(''); setFilterPendingOnly(false); }}
            className="aura-btn aura-btn--secondary aura-btn--sm"
          >
            {isEn ? 'Clear filters' : 'Limpar filtros'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPartners.map((partner) => {
            const partnerProjects = projects.filter((p) => p.partnerId === partner.id);
            const partnerExpenses = expenses.filter(
              (e) => (e.category === 'Comissão Parceiro' || e.partnerId === partner.id) && e.partnerId === partner.id
            );

            // Calculate commission amounts
            const totalCommissionPending = partnerProjects
              .filter((p) => !p.commissionPaid && (p.commissionAmount || (p.commissionValue && p.commissionType === 'percent' ? (p.totalAmount * p.commissionValue) / 100 : p.commissionValue) || 0) > 0)
              .reduce((sum, p) => {
                const amt = p.commissionAmount || (p.commissionValue && p.commissionType === 'percent' ? (p.totalAmount * p.commissionValue) / 100 : p.commissionValue) || 0;
                return sum + amt;
              }, 0);

            const totalCommissionPaidProjects = partnerProjects
              .filter((p) => p.commissionPaid)
              .reduce((sum, p) => {
                const amt = p.commissionAmount || (p.commissionValue && p.commissionType === 'percent' ? (p.totalAmount * p.commissionValue) / 100 : p.commissionValue) || 0;
                return sum + amt;
              }, 0);

            const totalPaidExpenses = partnerExpenses
              .filter((e) => e.paid)
              .reduce((sum, e) => sum + e.amount, 0);

            const totalCommissionPaid = Math.max(totalCommissionPaidProjects, totalPaidExpenses);
            const sampleCurrency = partnerProjects[0]?.currency || partnerExpenses[0]?.currency || settings.defaultCurrency;

            const isExpanded = expandedPartnerId === partner.id || partnerProjects.length <= 2;

            return (
              <div
                key={partner.id}
                className="bg-glass border border-line-subtle hover:border-line-strong p-5 rounded-xl transition-all shadow-glass hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-fg tracking-tight">{partner.name}</h3>
                      <p className="text-xs text-accent-soft-fg font-medium mt-0.5">
                        {isEn ? 'Default Commission: ' : 'Comissão Padrão: '}{partner.defaultCommissionPercent}%
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditPartner(partner)}
                        className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-sunken transition-colors cursor-pointer"
                        title={isEn ? 'Edit Partner' : 'Editar Parceiro'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1.5 rounded-full text-fg-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                        title={isEn ? 'Delete Partner' : 'Eliminar Parceiro'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-fg-muted mb-4">
                    {partner.whatsapp && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-fg-muted " />
                        <span className="text-fg font-mono">{partner.whatsapp}</span>
                      </div>
                    )}
                    {partner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-fg-muted " />
                        <span className="text-fg ">{partner.email}</span>
                      </div>
                    )}
                    {partner.notes && (
                      <p className="text-xs text-fg-muted italic mt-2 bg-surface-2 p-2.5 rounded-md border border-line-subtle ">&ldquo;{partner.notes}&rdquo;</p>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-surface-2 border border-line-subtle rounded-lg space-y-2 text-xs mb-4">
                    <div className="flex justify-between text-fg ">
                      <span className="text-fg-muted ">{isEn ? 'Referred Projects:' : 'Projetos Indicados:'}</span>
                      <strong className="font-semibold">{partnerProjects.length}</strong>
                    </div>
                    <div className="flex justify-between text-warning-fg font-medium">
                      <span>{isEn ? 'Pending commissions:' : 'Comissões pendentes:'}</span>
                      <strong>{formatCurrency(totalCommissionPending, sampleCurrency)}</strong>
                    </div>
                    <div className="flex justify-between text-success-fg font-medium pt-1.5 border-t border-line-subtle ">
                      <span>{isEn ? 'Paid commissions:' : 'Comissões pagas:'}</span>
                      <strong>{formatCurrency(totalCommissionPaid, sampleCurrency)}</strong>
                    </div>
                  </div>

                  {/* Partner's Projects & Commission Status */}
                  {partnerProjects.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-[13px] font-medium text-fg-secondary ">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" /> {isEn ? 'Projects & Payouts' : 'Projetos & Repasses'} ({partnerProjects.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {partnerProjects.map((proj) => {
                          const commAmount = proj.commissionAmount || (proj.commissionValue && proj.commissionType === 'percent' ? (proj.totalAmount * proj.commissionValue) / 100 : proj.commissionValue) || 0;

                          return (
                            <div
                              key={proj.id}
                              className="p-3 bg-surface-2 border border-line-subtle rounded-md flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-fg block truncate">{proj.name}</span>
                                <div className="flex items-center gap-2 text-[11px] text-fg-muted mt-0.5">
                                  <span>Total: {formatCurrency(proj.totalAmount, proj.currency)}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-fg ">
                                    {isEn ? 'Commission: ' : 'Comissão: '}{formatCurrency(commAmount, proj.currency)}
                                  </span>
                                </div>
                              </div>

                              {onToggleProjectCommissionPaid && (
                                <button
                                  type="button"
                                  onClick={() => onToggleProjectCommissionPaid(proj)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
 proj.commissionPaid
 ? 'bg-success-soft text-success-fg border border-success/20 hover:opacity-85'
 : 'bg-primary shadow-primary-3d text-primary-fg hover:opacity-85 active:scale-95'
 }`}
                                  title={proj.commissionPaid ? (isEn ? 'Click to unmark payout' : 'Clique para desmarcar repasse') : (isEn ? 'Click to mark commission as Paid/Transferred' : 'Clique para marcar comissão como Paga/Repassada')}
                                >
                                  {proj.commissionPaid ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>{isEn ? 'Paid' : 'Repassado'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>{isEn ? 'Pay Commission' : 'Pagar Comissão'}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Registered Commission Expenses */}
                  {partnerExpenses.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <span className="text-[13px] font-medium text-fg-secondary block">
                        {isEn ? 'Payout Expenses History' : 'Histórico de Despesas de Repasse'} ({partnerExpenses.length})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {partnerExpenses.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between text-[11px] bg-surface-2/80 p-1.5 px-2.5 rounded-sm border border-line-subtle ">
                            <span className="truncate text-fg ">{exp.description}</span>
                            <span className={`font-semibold shrink-0 ml-2 ${exp.paid ? 'text-success-fg ' : 'text-warning-fg '}`}>
                              {formatCurrency(exp.amount, exp.currency)} {exp.paid ? (isEn ? '(paid)' : '(pago)') : (isEn ? '(pending)' : '(pendente)')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer WA Button */}
                {partner.whatsapp && (
                  <div className="pt-4 mt-2 border-t border-line-subtle ">
                    <button
                      onClick={() =>
                        onOpenWhatsAppCharge(
                          partner.whatsapp!,
                          isEn
                            ? `Hello, ${partner.name}! Reaching out regarding commissions for referred projects.`
                            : `Olá, ${partner.name}! Passando para conversar sobre as comissões dos projetos indicados.`
                        )
                      }
                      className="w-full py-2 px-3 bg-surface-2 hover:bg-surface-3 text-fg border border-line-subtle rounded-full text-xs font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-accent-soft-fg " />
                      <span>{isEn ? 'Discuss commissions' : 'Falar sobre comissões'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
