import React from 'react';
import { Layers, Phone, Mail, MapPin, Heart, ShieldCheck } from 'lucide-react';
import { AGENCY_CONFIG } from './lib/supabase';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111215] text-white pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-zinc-800">
          
          {/* Brand & Bio */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <Layers className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-display">
                {AGENCY_CONFIG.name}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Agência de Performance, Tráfego Pago e Funis de Alta Conversão. Impulsionando empresas, palestrantes e profissionais liberais em Angola, Brasil e Portugal.
            </p>

            <div className="flex items-center space-x-3 text-xs text-zinc-400 pt-2">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Atendimento Ativo</span>
              </div>
              <span>&bull;</span>
              <span>WhatsApp Oficial: {AGENCY_CONFIG.whatsappRaw}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button onClick={() => scrollTo('#inicio')} className="hover:text-white transition-colors cursor-pointer">
                  Início
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#servicos')} className="hover:text-white transition-colors cursor-pointer">
                  Serviços
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#funil-palestras')} className="hover:text-white transition-colors cursor-pointer">
                  Funil de Palestras
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#como-funciona')} className="hover:text-white transition-colors cursor-pointer">
                  Como Funciona
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#solicitar')} className="hover:text-white transition-colors cursor-pointer">
                  Solicitar Proposta
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('#faq')} className="hover:text-white transition-colors cursor-pointer">
                  Dúvidas Frequentes
                </button>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
              Soluções
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>Tráfego Pago &bull; Meta &amp; Google</li>
              <li>Funis para Palestras</li>
              <li>Landing Pages Ultra-Rápidas</li>
              <li>Edição de Vídeos para Anúncios</li>
              <li>Gestão de Redes &amp; Contas</li>
              <li>Automação no WhatsApp</li>
            </ul>
          </div>

          {/* Contact & Presence */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
              Contato &amp; Presença
            </h4>
            <div className="space-y-2.5 text-xs text-zinc-400">
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#0050d7]" />
                <span>{AGENCY_CONFIG.whatsappRaw}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#0050d7]" />
                <span>{AGENCY_CONFIG.email}</span>
              </p>
              <p className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#0050d7]" />
                <span>Luanda &bull; São Paulo &bull; Lisboa</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>&copy; {new Date().getFullYear()} {AGENCY_CONFIG.name}. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-4 text-zinc-400">
            <span>Privacidade</span>
            <span>&bull;</span>
            <span>Termos de Serviço</span>
            <span>&bull;</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Base Segura</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
