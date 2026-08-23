import React, { useState } from 'react';
import { Handshake, Plus, Phone, Mail, Trash2, Edit2, MessageCircle } from 'lucide-react';
import { Partner, Project, CurrencyCode, AppSettings } from '../types';
import { formatCurrency } from '../lib/formatters';

interface PartnersViewProps {
  partners: Partner[];
  projects: Project[];
  settings: AppSettings;
  currencyFilter: CurrencyCode | 'ALL';
  onOpenNewPartnerModal: () => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partnerId: string) => void;
  onOpenWhatsAppCharge: (phone: string, text: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  projects,
  settings,
  currencyFilter,
  onOpenNewPartnerModal,
  onEditPartner,
  onDeletePartner,
  onOpenWhatsAppCharge,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <button
          onClick={onOpenNewPartnerModal}
          className="bg-[#000000] hover:opacity-85 text-white font-medium py-2.5 px-5 rounded-[29px] transition-all flex items-center justify-center space-x-2 text-sm w-full sm:w-auto cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Novo Parceiro</span>
        </button>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((partner) => {
            const partnerProjects = projects.filter((p) => p.partnerId === partner.id);
            const totalCommissionPending = partnerProjects
              .filter((p) => !p.commissionPaid && (p.commissionAmount || 0) > 0)
              .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);
            const totalCommissionPaid = partnerProjects
              .filter((p) => p.commissionPaid && (p.commissionAmount || 0) > 0)
              .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);

            const sampleCurrency = partnerProjects[0]?.currency || settings.defaultCurrency;

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
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1.5 rounded-full text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
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
                  <div className="p-4 bg-[#f7f3f2] border border-[#c4c7c7]/30 rounded-[16px] space-y-2 text-xs">
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
                </div>

                {/* Footer WA Button */}
                {partner.whatsapp && (
                  <div className="pt-4 mt-4 border-t border-[#c4c7c7]/40">
                    <button
                      onClick={() =>
                        onOpenWhatsAppCharge(
                          partner.whatsapp!,
                          `Olá, ${partner.name}! Passando para conversar sobre as comissões pendentes.`
                        )
                      }
                      className="w-full py-2 px-3 bg-[#dbe1ff] hover:opacity-85 text-[#003da9] rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
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
