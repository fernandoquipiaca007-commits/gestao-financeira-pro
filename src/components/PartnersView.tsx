import React, { useState } from 'react';
import { Handshake, Plus, Phone, Mail, Trash2, Edit2, MessageCircle, CheckCircle2, Clock, DollarSign, FolderKanban, Check } from 'lucide-react';
import { Partner, Project, Expense, CurrencyCode, AppSettings } from '../types';
import { formatCurrency } from '../lib/formatters';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">
              Parceiros &amp; Comissões
            </h1>
            <p className="text-xs text-[#747878] mt-0.5">
              Gestão de quem indica clientes e repasse de comissões por projeto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewExpenseModal && (
            <button
              onClick={onOpenNewExpenseModal}
              className="bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] border border-[#c4c7c7]/40 font-medium py-2.5 px-4 rounded-[29px] transition-all flex items-center justify-center space-x-1.5 text-sm cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-[#747878]" />
              <span>Lançar Despesa de Comissão</span>
            </button>
          )}

          <button
            onClick={onOpenNewPartnerModal}
            className="bg-[#000000] hover:opacity-85 text-white font-medium py-2.5 px-5 rounded-[29px] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Novo Parceiro</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {partners.length > 0 && (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Pesquisar parceiro por nome ou notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full text-[#1c1b1b] text-xs placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterPendingOnly(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                !filterPendingOnly ? 'bg-[#000000] text-white' : 'bg-[#f1edec] text-[#444747] hover:bg-[#e5e2e1]'
              }`}
            >
              Todos ({partners.length})
            </button>
            <button
              onClick={() => setFilterPendingOnly(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterPendingOnly ? 'bg-[#7a5400] text-white' : 'bg-[#fff3d6] text-[#7a5400] hover:bg-[#ffecc0]'
              }`}
            >
              Comissões Pendentes
            </button>
          </div>
        </div>
      )}

      {/* Partners List & Cards */}
      {partners.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 rounded-full bg-[#f1edec] text-[#747878] flex items-center justify-center mx-auto">
            <Handshake className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-[#1c1b1b]">Nenhum parceiro cadastrado ainda</h3>
          <p className="text-xs text-[#747878] max-w-md mx-auto">
            Cadastre parceiros que passam clientes para o seu studio e configure comissões por porcentagem ou valor fixo em cada projeto!
          </p>
          <button
            onClick={onOpenNewPartnerModal}
            className="px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white text-xs font-medium rounded-[29px] transition-all inline-flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Cadastrar Primeiro Parceiro</span>
          </button>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white border border-[#c4c7c7]/40 rounded-[22px] p-12 text-center space-y-3">
          <Handshake className="w-10 h-10 text-[#c4c7c7] mx-auto" />
          <h3 className="text-sm font-semibold text-[#1c1b1b]">Nenhum parceiro encontrado com este filtro</h3>
          <button
            onClick={() => { setSearchTerm(''); setFilterPendingOnly(false); }}
            className="px-4 py-2 bg-[#f1edec] text-[#1c1b1b] text-xs font-medium rounded-full hover:bg-[#e5e2e1]"
          >
            Limpar Filtros
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
                className="bg-white border border-[#c4c7c7]/40 hover:border-[#c4c7c7] p-5 rounded-[22px] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1c1b1b] tracking-tight">{partner.name}</h3>
                      <p className="text-xs text-[#0050d7] font-medium mt-0.5">
                        Comissão Padrão: {partner.defaultCommissionPercent}%
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditPartner(partner)}
                        className="p-1.5 rounded-full text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] transition-colors cursor-pointer"
                        title="Editar Parceiro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1.5 rounded-full text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                        title="Excluir Parceiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-[#747878] mb-4">
                    {partner.whatsapp && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-[#747878]" />
                        <span>{partner.whatsapp}</span>
                      </div>
                    )}
                    {partner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-[#747878]" />
                        <span>{partner.email}</span>
                      </div>
                    )}
                    {partner.notes && (
                      <p className="text-xs text-[#747878] italic mt-2 bg-[#f7f3f2] p-2.5 rounded-xl border border-[#c4c7c7]/30">&ldquo;{partner.notes}&rdquo;</p>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[16px] space-y-2 text-xs mb-4">
                    <div className="flex justify-between text-[#1c1b1b]">
                      <span className="text-[#747878]">Projetos Indicados:</span>
                      <strong className="font-semibold">{partnerProjects.length}</strong>
                    </div>
                    <div className="flex justify-between text-[#7a5400] font-medium">
                      <span>Comissões Pendentes:</span>
                      <strong>{formatCurrency(totalCommissionPending, sampleCurrency)}</strong>
                    </div>
                    <div className="flex justify-between text-[#1a6b3a] font-medium pt-1.5 border-t border-[#c4c7c7]/30">
                      <span>Comissões Repassadas:</span>
                      <strong>{formatCurrency(totalCommissionPaid, sampleCurrency)}</strong>
                    </div>
                  </div>

                  {/* Partner's Projects & Commission Status */}
                  {partnerProjects.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#747878] uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" /> Projetos &amp; Repasses ({partnerProjects.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {partnerProjects.map((proj) => {
                          const commAmount = proj.commissionAmount || (proj.commissionValue && proj.commissionType === 'percent' ? (proj.totalAmount * proj.commissionValue) / 100 : proj.commissionValue) || 0;

                          return (
                            <div
                              key={proj.id}
                              className="p-3 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[14px] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-[#1c1b1b] block truncate">{proj.name}</span>
                                <div className="flex items-center gap-2 text-[11px] text-[#747878] mt-0.5">
                                  <span>Total: {formatCurrency(proj.totalAmount, proj.currency)}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-[#1c1b1b]">
                                    Comissão: {formatCurrency(commAmount, proj.currency)}
                                  </span>
                                </div>
                              </div>

                              {onToggleProjectCommissionPaid && (
                                <button
                                  type="button"
                                  onClick={() => onToggleProjectCommissionPaid(proj)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    proj.commissionPaid
                                      ? 'bg-[#d4eddf] text-[#1a6b3a] border border-[#1a6b3a]/20 hover:opacity-85'
                                      : 'bg-[#000000] text-white hover:opacity-85 active:scale-95'
                                  }`}
                                  title={proj.commissionPaid ? 'Clique para desmarcar repasse' : 'Clique para marcar comissão como Paga/Repassada'}
                                >
                                  {proj.commissionPaid ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Repassado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Pagar Comissão</span>
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
                      <span className="text-[10px] font-semibold text-[#747878] uppercase tracking-widest block">
                        Histórico de Despesas de Repasse ({partnerExpenses.length})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {partnerExpenses.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between text-[11px] bg-[#f7f3f2]/80 p-1.5 px-2.5 rounded-lg border border-[#c4c7c7]/20">
                            <span className="truncate text-[#1c1b1b]">{exp.description}</span>
                            <span className={`font-semibold shrink-0 ml-2 ${exp.paid ? 'text-[#1a6b3a]' : 'text-[#7a5400]'}`}>
                              {formatCurrency(exp.amount, exp.currency)} {exp.paid ? '✓' : '(pendente)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer WA Button */}
                {partner.whatsapp && (
                  <div className="pt-4 mt-2 border-t border-[#c4c7c7]/40">
                    <button
                      onClick={() =>
                        onOpenWhatsAppCharge(
                          partner.whatsapp!,
                          `Olá, ${partner.name}! Passando para conversar sobre as comissões dos projetos indicados.`
                        )
                      }
                      className="w-full py-2 px-3 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] border border-[#c4c7c7]/40 rounded-full text-xs font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#0050d7]" />
                      <span>Falar sobre Comissões</span>
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
