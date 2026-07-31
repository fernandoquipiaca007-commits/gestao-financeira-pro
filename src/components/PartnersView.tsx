import React, { useState } from 'react';
import { Handshake, Plus, Phone, Mail, Percent, Trash2, Edit2, CheckCircle2, Clock, MessageCircle, DollarSign } from 'lucide-react';
import { Partner, Project, CurrencyCode, AppSettings } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../lib/formatters';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Parceiros &amp; Comissões
            </h1>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Gestão de quem indica clientes e repasse de comissões por projeto
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewPartnerModal}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Parceiro</span>
        </button>
      </div>

      {/* Partners List & Cards */}
      {partners.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto">
            <Handshake className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">Nenhum parceiro cadastrado ainda</h3>
          <p className="text-xs text-slate-600 font-semibold max-w-md mx-auto">
            Cadastre parceiros que passam clientes para o seu studio e configure comissões por porcentagem ou valor fixo em cada projeto!
          </p>
          <button
            onClick={onOpenNewPartnerModal}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Primeiro Parceiro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-white border border-slate-200/90 hover:border-slate-300 p-5 rounded-2xl transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">{partner.name}</h3>
                      <p className="text-xs text-purple-700 font-extrabold mt-0.5">
                        Comissão Padrão: {partner.defaultCommissionPercent}%
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditPartner(partner)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-700 font-semibold mb-4">
                    {partner.whatsapp && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{partner.whatsapp}</span>
                      </div>
                    )}
                    {partner.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{partner.email}</span>
                      </div>
                    )}
                    {partner.notes && (
                      <p className="text-xs text-slate-600 italic mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">&ldquo;{partner.notes}&rdquo;</p>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-bold">
                    <div className="flex justify-between text-slate-800">
                      <span>Projetos Indicados:</span>
                      <strong className="text-slate-900">{partnerProjects.length}</strong>
                    </div>
                    <div className="flex justify-between text-amber-800 font-extrabold">
                      <span>Comissões Pendentes:</span>
                      <strong>{formatCurrency(totalCommissionPending, sampleCurrency)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-extrabold pt-1 border-t border-slate-200">
                      <span>Comissões Repassadas:</span>
                      <strong>{formatCurrency(totalCommissionPaid, sampleCurrency)}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer WA Button */}
                {partner.whatsapp && (
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() =>
                        onOpenWhatsAppCharge(
                          partner.whatsapp!,
                          `Olá, ${partner.name}! Passando para conversar sobre as comissões pendentes.`
                        )
                      }
                      className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 stroke-[2.2]" />
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
