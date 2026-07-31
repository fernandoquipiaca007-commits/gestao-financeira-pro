import React, { useState, useEffect } from 'react';
import { X, Handshake, User, Phone, Mail, Percent, FileText } from 'lucide-react';
import { Partner } from '../../types';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partnerData: Omit<Partner, 'id' | 'createdAt'> & { id?: string }) => void;
  partnerToEdit?: Partner | null;
}

export function PartnerModal({ isOpen, onClose, onSave, partnerToEdit }: PartnerModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {partnerToEdit ? 'Editar Parceiro' : 'Novo Parceiro / Indicador'}
              </h3>
              <p className="text-xs text-slate-400">
                Cadastre quem indica clientes e recebe comissão por projeto
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Parceiro *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                WhatsApp de Contato
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+244923000000"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Comissão Padrão (%)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={defaultCommissionPercent}
                  onChange={(e) => setDefaultCommissionPercent(parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail (opcional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parceiro@email.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações / Acordo de Parceria
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Recebe 10% de comissão em projetos de Websites e Landing Pages que indicar."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
              />
            </div>
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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              {partnerToEdit ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
