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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800 border border-blue-200">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Nome */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mirtes Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              Empresa
            </label>
            <input
              type="text"
              placeholder="Ex: Mirtes Moda & Estilo"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          {/* WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                placeholder="+55 11 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Tipo & País */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">
                Tipo de Serviço
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ClientType)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="Tráfego Pago">Tráfego Pago</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">
                País do Cliente
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500"
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
            <label className="text-xs font-black text-slate-800 block mb-1">
              Moeda de Cobrança Padrão do Cliente
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-black focus:outline-none focus:border-blue-500 text-emerald-700"
            >
              <option value="AOA">🇦🇴 Kwanza (Kz / AOA)</option>
              <option value="BRL">🇧🇷 Real (R$ / BRL)</option>
              <option value="USD">🇺🇸 Dólar (US$ / USD)</option>
              <option value="EUR">🇵🇹 Euro (€ / EUR)</option>
            </select>
            <span className="text-xs text-slate-600 font-semibold mt-1 block">
              Projetos e faturas deste cliente adotarão esta moeda por padrão.
            </span>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Anotações adicionais sobre o cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Footer controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
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
