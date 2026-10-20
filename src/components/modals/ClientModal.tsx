import React, { useState, useEffect } from 'react';
import { EditorPage } from '../shell/EditorPage';
import { RichTextField } from '../editor/RichTextField';
import { ClientProfileFields, type ClientProfile } from './ClientProfileFields';
import { X, Users, Globe, Building2, Phone, Mail, Save } from 'lucide-react';
import { Client, CountryCode, CurrencyCode, COUNTRIES, CURRENCIES, ClientType, DEFAULT_CLIENT_NICHES } from '../../types';
import { getTodayIso } from '../../lib/storage';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<ClientType>('Desenvolvimento');
  const [customType, setCustomType] = useState('');
  const [country, setCountry] = useState<CountryCode>('BR');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [notes, setNotes] = useState('');
  const [profile, setProfile] = useState<ClientProfile>({});

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setCompany(clientToEdit.company);
      setWhatsapp(clientToEdit.whatsapp);
      setEmail(clientToEdit.email);
      const isPredefined = (DEFAULT_CLIENT_NICHES as readonly string[]).includes(clientToEdit.type);
      if (isPredefined) {
        setType(clientToEdit.type);
        setCustomType('');
      } else {
        setType('Outro');
        setCustomType(clientToEdit.type);
      }
      setCountry(clientToEdit.country);
      setCurrency(clientToEdit.currency);
      setNotes(clientToEdit.notes || '');
      setProfile({
        taxId: clientToEdit.taxId, website: clientToEdit.website, address: clientToEdit.address, city: clientToEdit.city,
        postalCode: clientToEdit.postalCode, contactName: clientToEdit.contactName, contactRole: clientToEdit.contactRole,
        preferredChannel: clientToEdit.preferredChannel, paymentTermsDays: clientToEdit.paymentTermsDays, tags: clientToEdit.tags, source: clientToEdit.source,
      });
    } else {
      setName('');
      setCompany('');
      setWhatsapp('');
      setEmail('');
      setType('Desenvolvimento');
      setCustomType('');
      setCountry('BR');
      setCurrency('BRL');
      setNotes('');
      setProfile({});
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

    const finalType = (type === 'Outro' && customType.trim()) ? customType.trim() : type;

    onSave({
      id: clientToEdit?.id,
      name: name.trim(),
      company: company.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      type: finalType,
      country,
      currency,
      notes: notes.trim(),
      ...profile,
    });

    onClose();
  };

  return (
    <EditorPage
      title={<>{clientToEdit ? (isEn ? 'Edit client' : 'Editar cliente') : (isEn ? 'New client' : 'Novo cliente')}</>}
      trail={[isEn ? 'Clients' : 'Clientes']}
      
      icon={<Users className="w-5 h-5" />}
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
             form="client-form">
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isEn ? 'Save Client' : 'Guardar Cliente'}</span>
            </button>
          </>}
    >
      <form id="client-form" className="space-y-6 text-fg" onSubmit={handleSubmit}>
          
          {/* Nome */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Client Name *' : 'Nome do Cliente *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? 'e.g. John Doe' : 'Ex: Mirtes Silva'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Company' : 'Empresa'}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'e.g. Acme Corporation' : 'Ex: Mirtes Moda & Estilo'}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                WhatsApp
              </label>
              <input
                type="text"
                placeholder="+55 11 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Email' : 'E-mail'}
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
          </div>

          {/* Tipo & País */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Niche / Service Type' : 'Nicho / Tipo de Serviço'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ClientType)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                {DEFAULT_CLIENT_NICHES.map((niche) => (
                  <option key={niche} value={niche} className="bg-glass-strong text-fg ">
                    {niche === 'Outro' ? (isEn ? 'Other' : 'Outro') : niche}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Client Country' : 'País do Cliente'}
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
              >
                <option value="AO" className="bg-glass-strong text-fg ">Angola (+244)</option>
                <option value="BR" className="bg-glass-strong text-fg ">{isEn ? 'Brazil (+55)' : 'Brasil (+55)'}</option>
                <option value="PT" className="bg-glass-strong text-fg ">Portugal (+351)</option>
                <option value="US" className="bg-glass-strong text-fg ">{isEn ? 'United States (+1)' : 'Estados Unidos (+1)'}</option>
                <option value="OTHER" className="bg-glass-strong text-fg ">{isEn ? 'Other Country' : 'Outro País'}</option>
              </select>
            </div>
          </div>

          {/* Especificar nicho quando 'Outro' for selecionado */}
          {type === 'Outro' && (
            <div>
              <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
                {isEn ? 'Specify Client Niche / Profession' : 'Especificar Nicho / Profissão do Cliente'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'e.g. Healthcare, Legal, Restaurant...' : 'Ex: Medicina & Clínicas, Advocacia, Restaurante...'}
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
              />
            </div>
          )}

          {/* Moeda Associada */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Default Billing Currency' : 'Moeda de Cobrança Padrão do Cliente'}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg font-medium focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
            >
              <option value="AOA" className="bg-glass-strong text-fg ">Kwanza (Kz / AOA)</option>
              <option value="BRL" className="bg-glass-strong text-fg ">Real (R$ / BRL)</option>
              <option value="USD" className="bg-glass-strong text-fg ">{isEn ? 'US Dollar ($ / USD)' : 'Dólar (US$ / USD)'}</option>
              <option value="EUR" className="bg-glass-strong text-fg ">Euro (€ / EUR)</option>
            </select>
            <span className="text-xs text-fg-muted mt-1 block">
              {isEn ? 'Projects and invoices for this client will use this currency by default.' : 'Projetos e faturas deste cliente adotarão esta moeda por padrão.'}
            </span>
          </div>

          {/* Ficha completa + notas ricas */}
          <ClientProfileFields value={profile} onChange={setProfile} lang={isEn ? 'en' : 'pt'} />

          <RichTextField
            id="client-notes"
            label={isEn ? 'Notes' : 'Notas'}
            value={notes}
            onChange={setNotes}
            lang={isEn ? 'en' : 'pt'}
            template="client"
          />

          {/* Footer controls */}
          

        </form>
    </EditorPage>
  );
};
