import React from 'react';
import { MessageSquare, PhoneCall } from 'lucide-react';
import { AGENCY_CONFIG } from './lib/supabase';

export const FloatingWhatsApp: React.FC = () => {
  const whatsappUrl = `https://wa.me/${AGENCY_CONFIG.whatsappDigits}?text=${encodeURIComponent('Olá equipa da Codeengine! Vim pelo site e gostaria de falar com um especialista em tráfego e funis.')}`;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center bg-[#1a6b3a] hover:bg-[#155a30] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-[0_8px_25px_rgba(26,107,58,0.4)] hover:shadow-[0_10px_30px_rgba(26,107,58,0.5)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
        title="Falar no WhatsApp com a Codeengine"
      >
        {/* Pulsing ring indicator */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
        </span>

        {/* WhatsApp Icon */}
        <div className="flex items-center justify-center">
          <MessageSquare className="w-5 h-5 fill-white stroke-none" />
        </div>

        {/* Text for desktop */}
        <div className="hidden sm:flex flex-col ml-2.5 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 leading-none">
            Online Agora
          </span>
          <span className="text-xs font-bold leading-tight mt-0.5">
            Falar no WhatsApp
          </span>
        </div>
      </a>
    </div>
  );
};
