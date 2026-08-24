import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Loader2, 
  MessageSquare, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  DollarSign, 
  Sparkles, 
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { CountryCode, COUNTRIES, LeadSubmission } from './types';
import { AGENCY_SERVICES } from './lib/data';
import { submitLeadToManagementSystem, buildWhatsAppLeadUrl, AGENCY_CONFIG } from './lib/supabase';

interface ContactFormProps {
  selectedServicePreset?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ selectedServicePreset }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CountryCode>('AO');
  const [service, setService] = useState<string>('Gestão de Tráfego Pago & Performance');
  const [businessType, setBusinessType] = useState<string>('Empresa / Negócio Local');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string>('Investimento Moderado');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSubmittedLead, setLastSubmittedLead] = useState<LeadSubmission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync preset if passed from outside
  useEffect(() => {
    if (selectedServicePreset) {
      setService(selectedServicePreset);
    }
  }, [selectedServicePreset]);

  // Additional combo services options
  const comboOptions = [
    'Edição de Vídeos para Anúncios',
    'Criação de Landing Page',
    'Montagem de Funil de Palestras',
    'Automações no WhatsApp & CRM',
    'Atendimento & Consultoria Personalizada',
    'Gestão Estratégica de Redes Sociais',
  ];

  const toggleAdditionalService = (item: string) => {
    if (additionalServices.includes(item)) {
      setAdditionalServices(additionalServices.filter(s => s !== item));
    } else {
      setAdditionalServices([...additionalServices, item]);
    }
  };

  const handleCountryChange = (cCode: CountryCode) => {
    setCountry(cCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      setErrorMessage('Por favor preencha seu Nome e WhatsApp de contato.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Format phone with country DDI if user did not include it
    let cleanPhone = whatsapp.trim();
    const ddi = COUNTRIES[country]?.ddi || '+244';
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith(ddi.replace('+', ''))) {
      cleanPhone = `${ddi} ${cleanPhone}`;
    }

    const leadData: LeadSubmission = {
      name: name.trim(),
      company: company.trim() ? `${company.trim()} (${businessType})` : businessType,
      whatsapp: cleanPhone,
      email: email.trim(),
      country,
      service,
      additionalServices,
      budgetRange,
      notes: notes.trim(),
    };

    try {
      // 1. Save directly to shared Supabase (clients table + notifications table)
      await submitLeadToManagementSystem(leadData);

      setLastSubmittedLead(leadData);
      setSuccess(true);

      // 2. Automatically prepare WhatsApp redirection
      const whatsappUrl = buildWhatsAppLeadUrl(leadData);

      // Open WhatsApp in new tab after 1.2s delay for seamless UX
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1200);

    } catch (err) {
      console.error('[Submit Error]', err);
      // Even if DB fails, allow WhatsApp redirect
      setLastSubmittedLead(leadData);
      setSuccess(true);
      const whatsappUrl = buildWhatsAppLeadUrl(leadData);
      window.open(whatsappUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="solicitar" className="py-20 lg:py-28 bg-[#f1edec] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Context & Instructions */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="inline-flex items-center space-x-2 bg-white border border-[#c4c7c7]/50 px-3.5 py-1 rounded-full text-xs font-semibold text-[#1c1b1b]">
              <Sparkles className="w-3.5 h-3.5 text-[#0050d7]" />
              <span>Atendimento Direto &bull; Proposta Sob Medida</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#1c1b1b] tracking-tight font-display">
              Solicite uma Proposta Estratégica para seu Negócio
            </h2>

            <p className="text-sm sm:text-base text-[#444747] leading-relaxed">
              Preencha os dados ao lado para receber um diagnóstico gratuito. Seus dados serão cadastrados em nosso sistema e você será encaminhado diretamente ao nosso WhatsApp para alinharmos os detalhes.
            </p>

            {/* Steps mini list */}
            <div className="space-y-4 pt-4 border-t border-[#c4c7c7]/40">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1b1b]">Cadastro Instantâneo</h4>
                  <p className="text-xs text-[#747878]">Seus dados entram diretamente na nossa base de atendimento prioritário.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#0050d7] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1b1b]">Direcionamento para WhatsApp</h4>
                  <p className="text-xs text-[#747878]">Você é levado ao WhatsApp com a mensagem formatada para atendimento rápido.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-full bg-[#1a6b3a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c1b1b]">Reunião &amp; Plano de Ação</h4>
                  <p className="text-xs text-[#747878]">Apresentamos o cronograma e iniciamos a estruturação das campanhas.</p>
                </div>
              </div>
            </div>

            {/* Direct Contact Card */}
            <div className="p-5 bg-white rounded-2xl border border-[#c4c7c7]/40 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#747878] block">
                Contato Direto da Agência
              </span>
              <p className="text-sm font-bold text-[#1c1b1b] flex items-center space-x-2">
                <span>WhatsApp:</span>
                <span className="text-[#0050d7]">{AGENCY_CONFIG.whatsappRaw}</span>
              </p>
              <p className="text-xs text-[#747878]">
                Email: {AGENCY_CONFIG.email}
              </p>
            </div>

          </div>

          {/* Right Lead Capture Form Card */}
          <div className="lg:col-span-7">
            <div className="boro-card p-6 sm:p-10 bg-white border border-[#c4c7c7]/50 shadow-xl relative">
              
              {/* Success Overlay Screen */}
              {success && lastSubmittedLead && (
                <div className="text-center py-10 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#d4eddf] text-[#1a6b3a] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#1c1b1b] font-display">
                      Solicitação Recebida com Sucesso!
                    </h3>
                    <p className="text-sm text-[#444747] max-w-md mx-auto">
                      Olá <strong>{lastSubmittedLead.name}</strong>, seus dados já foram sincronizados em nossa base. Estamos abrindo o seu WhatsApp para o atendimento personalizado...
                    </p>
                  </div>

                  <div className="p-4 bg-[#fcf8f8] rounded-2xl border border-[#c4c7c7]/40 max-w-md mx-auto text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#747878]">Serviço:</span>
                      <span className="font-bold text-[#1c1b1b]">{lastSubmittedLead.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#747878]">WhatsApp Cadastrado:</span>
                      <span className="font-bold text-[#1c1b1b]">{lastSubmittedLead.whatsapp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#747878]">País:</span>
                      <span className="font-bold text-[#1c1b1b]">{COUNTRIES[lastSubmittedLead.country]?.name}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={buildWhatsAppLeadUrl(lastSubmittedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="boro-btn-accent w-full sm:w-auto h-12 px-8 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Abrir WhatsApp Agora</span>
                    </a>

                    <button
                      onClick={() => {
                        setSuccess(false);
                        setName('');
                        setWhatsapp('');
                        setNotes('');
                      }}
                      className="boro-btn-secondary w-full sm:w-auto h-12 px-5 text-xs"
                    >
                      <span>Enviar Outra Solicitação</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lead Form */}
              {!success && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  <div className="border-b border-[#c4c7c7]/30 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-[#1c1b1b]">Formulário de Cadastro &amp; Atendimento</h3>
                    <p className="text-xs text-[#747878] mt-1">Preencha os campos abaixo com as informações do seu negócio.</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

                  {/* Nome e Empresa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        Seu Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: João Baptista"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="boro-input-box pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        Empresa / Escritório / Marca
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Ex: JB Soluções &amp; Serviços"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="boro-input-box pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* País e WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-5">
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        País / Região *
                      </label>
                      <select
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                        className="boro-input-box font-medium"
                      >
                        <option value="AO">🇦🇴 Angola (+244)</option>
                        <option value="BR">🇧🇷 Brasil (+55)</option>
                        <option value="PT">🇵🇹 Portugal (+351)</option>
                        <option value="US">🇺🇸 Estados Unidos (+1)</option>
                        <option value="OTHER">🌐 Outro País</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7">
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        Número de WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder={COUNTRIES[country]?.phonePlaceholder || '923 000 000'}
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="boro-input-box pl-10 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E-mail e Perfil do Negócio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        E-mail Comercial
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#747878] absolute left-3.5 top-3" />
                        <input
                          type="email"
                          placeholder="contato@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="boro-input-box pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                        Perfil do seu Negócio
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="boro-input-box"
                      >
                        <option value="Empresa / Negócio Local">Empresa / Negócio Local</option>
                        <option value="Infoprodutor / Mentor / Palestrante">Infoprodutor / Mentor / Palestrante</option>
                        <option value="Agência / Escritório de Advocacia/Contabilidade">Agência / Escritório / Consultoria</option>
                        <option value="E-commerce / Loja Virtual">E-commerce / Loja Virtual</option>
                        <option value="Profissional Liberal / Prestador de Serviços">Profissional Liberal / Autônomo</option>
                        <option value="Outro">Outro segmento</option>
                      </select>
                    </div>
                  </div>

                  {/* Serviço Principal */}
                  <div>
                    <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                      Serviço Principal de Interesse *
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="boro-input-box font-medium text-[#1c1b1b]"
                    >
                      {AGENCY_SERVICES.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                      <option value="Pacote Personalizado 360°">Pacote Personalizado 360°</option>
                    </select>
                  </div>

                  {/* Serviços Adicionais (Checkboxes) */}
                  <div>
                    <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-2">
                      Deseja adicionar outros serviços ao seu pacote?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comboOptions.map((opt, idx) => {
                        const isChecked = additionalServices.includes(opt);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => toggleAdditionalService(opt)}
                            className={`p-2.5 rounded-xl border text-left text-xs flex items-center space-x-2.5 transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#dbe1ff] border-[#0050d7] text-[#003da9] font-bold'
                                : 'bg-[#f1edec] border-transparent text-[#444747] hover:bg-[#e5e2e1]'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                              isChecked ? 'bg-[#0050d7] border-[#0050d7] text-white' : 'border-[#c4c7c7] bg-white'
                            }`}>
                              {isChecked ? '✓' : ''}
                            </span>
                            <span className="truncate">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Faixa de Investimento */}
                  <div>
                    <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                      Previsão de Investimento em Anúncios / Marketing
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="boro-input-box"
                    >
                      <option value="Inicial (Para validação)">Inicial (Para validação e testes)</option>
                      <option value="Moderado (Crescimento estável)">Moderado (Crescimento estável)</option>
                      <option value="Agressivo (Escala e liderança de mercado)">Agressivo (Escala e liderança de mercado)</option>
                      <option value="A definir em reunião estratégica">A definir em reunião estratégica</option>
                    </select>
                  </div>

                  {/* Observações / Descrição do Projeto */}
                  <div>
                    <label className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block mb-1.5">
                      Conte-nos brevemente sobre o seu momento atual e seus objetivos:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Queremos lotar uma palestra em Luanda no próximo mês; ou precisamos de mais clientes diários para nossa clínica/escritório..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="boro-input-box resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="boro-btn-primary w-full h-12 text-sm justify-center font-bold tracking-wide active:scale-98 shadow-lg cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Cadastrando e Gerando Atendimento...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Solicitação &amp; Falar no WhatsApp</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-[#747878] text-center mt-3 flex items-center justify-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1a6b3a]" />
                      <span>Seus dados estão protegidos e sincronizados com a Codeengine.</span>
                    </p>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
