import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { X, Handshake, User, Phone, Mail, Percent, FileText } from 'lucide-react';
import { Partner } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partnerData: Omit<Partner, 'id' | 'createdAt'> & { id?: string }) => void;
  partnerToEdit?: Partner | null;
}

export function PartnerModal({ isOpen, onClose, onSave, partnerToEdit }: PartnerModalProps) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [defaultCommissionPercent, setDefaultCommissionPercent] = useState(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (partnerToEdit) {
      setName(partnerToEdit.name || '');
      setWhatsapp(partnerToEdit.whatsapp || '');
      setEmail(partnerToEdit.email || '');
      setDefaultCommissionPercent(partnerToEdit.defaultCommissionPercent ?? 10);
      setNotes(partnerToEdit.notes || '');
    } else {
      setName('');
      setWhatsapp('');
      setEmail('');
      setDefaultCommissionPercent(10);
      setNotes('');
    }
  }, [partnerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: partnerToEdit?.id,
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      defaultCommissionPercent: Number(defaultCommissionPercent) || 0,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <EditorPage
      title={<>{partnerToEdit ? (isEn ? 'Edit Partner' : 'Editar Parceiro') : (isEn ? 'New Partner / Referrer' : 'Novo Parceiro / Indicador')}</>}
      trail={[isEn ? 'Partners' : 'Parceiros']}
      subtitle={<>{isEn ? 'People who refer clients and earn a commission per project' : 'Quem lhe indica clientes e recebe comissão por projeto'}</>}
      icon={<Handshake className="w-5 h-5" />}
      onClose={onClose}
      actions={<>
            <button
              type="button"
              onClick={onClose}
              className="aura-btn aura-btn--ghost"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="aura-btn aura-btn--primary"
             form="partner-form">
              {partnerToEdit ? (isEn ? 'Save changes' : 'Guardar alterações') : (isEn ? 'Add partner' : 'Adicionar parceiro')}
            </button>
          </>}
    >
      <form id="partner-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Partner Name *' : 'Nome do Parceiro *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEn ? 'e.g. John Doe' : 'Ex: Carlos Mendes'}
                className="w-full bg-surface-2 border border-line-subtle rounded-md pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'WhatsApp' : 'WhatsApp de contacto'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+244923000000"
                  className="w-full bg-surface-2 border border-line-subtle rounded-md pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Default Commission (%)' : 'Comissão Padrão (%)'}
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={defaultCommissionPercent}
                  onChange={(e) => setDefaultCommissionPercent(parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  className="w-full bg-surface-2 border border-line-subtle rounded-md pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Email (optional)' : 'E-mail (opcional)'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parceiro@email.com"
                className="w-full bg-surface-2 border border-line-subtle rounded-md pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Notes / Partnership Agreement' : 'Observações / Acordo de Parceria'}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-fg-muted absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isEn ? 'e.g. Receives 10% commission on website and landing page projects referred.' : 'Ex: Recebe 10% de comissão em projetos de Websites e Landing Pages que indicar.'}
                className="w-full bg-surface-2 border border-line-subtle rounded-md pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all resize-none"
              />
            </div>
          </div>

          
        </form>
    </EditorPage>
  );
}
