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
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10">
            <Handshake className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Parceiros & Comissões
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestão de quem indica clientes e repasse de comissões por projeto
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewPartnerModal}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-5 rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center space-x-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Parceiro</span>
        </button>
      </div>

      {/* Partners List & Cards */}
      {partners.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Handshake className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum parceiro cadastrado ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cadastre parceiros que passam clientes para o seu studio e configure comissões por porcentagem ou valor fixo em cada projeto!
          </p>
          <button
            onClick={onOpenNewPartnerModal}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
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
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{partner.name}</h3>
                      <p className="text-xs text-purple-400 font-semibold mt-0.5">
                        Comissão Padrão: {partner.defaultCommissionPercent}%
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditPartner(partner)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePartner(partner.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
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
                      <p className="text-[11px] text-slate-500 italic mt-2">"{partner.notes}"</p>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Projetos Indicados:</span>
                      <strong className="text-white">{partnerProjects.length}</strong>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>Comissões Pendentes:</span>
                      <strong>{formatCurrency(totalCommissionPending, sampleCurrency)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Comissões Pagas:</span>
                      <strong>{formatCurrency(totalCommissionPaid, sampleCurrency)}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {partner.whatsapp && (
                  <button
                    onClick={() =>
                      onOpenWhatsAppCharge(
                        partner.whatsapp!,
                        `Olá ${partner.name}, gostaria de falar sobre as comissões dos projetos indicados!`
                      )
                    }
                    className="mt-4 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
