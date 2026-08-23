import React, { useState, useEffect } from 'react';
import { X, Users, Globe, Building2, Phone, Mail, Save } from 'lucide-react';
import { Client, CountryCode, CurrencyCode, COUNTRIES, CURRENCIES, ClientType } from '../../types';
import { getTodayIso } from '../../lib/storage';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<ClientType>('Desenvolvimento');
  const [country, setCountry] = useState<CountryCode>('BR');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setCompany(clientToEdit.company);
      setWhatsapp(clientToEdit.whatsapp);
      setEmail(clientToEdit.email);
      setType(clientToEdit.type);
      setCountry(clientToEdit.country);
      setCurrency(clientToEdit.currency);
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setCompany('');
      setWhatsapp('');
      setEmail('');
      setType('Desenvolvimento');
      setCountry('BR');
      setCurrency('BRL');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  // Handle country selection to auto-select currency
  const handleCountryChange = (cCode: CountryCode) => {
    setCountry(cCode);
    const defaultCurr = COUNTRIES[cCode]?.defaultCurrency || 'BRL';
    setCurrency(defaultCurr);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: clientToEdit?.id,
      name: name.trim(),
      company: company.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      type,
      country,
      currency,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-[#c4c7c7]/30 rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#c4c7c7]/40 flex items-center justify-between bg-[#f7f3f2]">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-[#f1edec] text-[#444747] flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">
              {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Nome */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mirtes Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Empresa
            </label>
            <input
              type="text"
              placeholder="Ex: Mirtes Moda & Estilo"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          {/* WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                WhatsApp
              </label>
              <input
                type="text"
                placeholder="+55 11 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Tipo & País */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                Tipo de Serviço
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ClientType)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="Tráfego Pago">Tráfego Pago</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
                País do Cliente
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              >
                <option value="AO">🇦🇴 Angola</option>
                <option value="BR">🇧🇷 Brasil</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="OTHER">🌐 Outro País</option>
              </select>
            </div>
          </div>

          {/* Moeda Associada */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Moeda de Cobrança Padrão do Cliente
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] font-medium focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            >
              <option value="AOA">🇦🇴 Kwanza (Kz / AOA)</option>
              <option value="BRL">🇧🇷 Real (R$ / BRL)</option>
              <option value="USD">🇺🇸 Dólar (US$ / USD)</option>
              <option value="EUR">🇵🇹 Euro (€ / EUR)</option>
            </select>
            <span className="text-xs text-[#747878] mt-1 block">
              Projetos e faturas deste cliente adotarão esta moeda por padrão.
            </span>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Anotações adicionais sobre o cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Footer controls */}
          <div className="pt-3 border-t border-[#c4c7c7]/40 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Cliente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
