import React, { useState } from 'react';
import { FAQ_ITEMS } from './lib/data';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle } from 'lucide-react';
import { AGENCY_CONFIG } from './lib/supabase';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-24 bg-white border-t border-[#c4c7c7]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center space-x-2 bg-[#f1edec] px-3.5 py-1 rounded-full text-xs font-semibold text-[#1c1b1b]">
            <HelpCircle className="w-3.5 h-3.5 text-[#0050d7]" />
            <span>Perguntas Frequentes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#1c1b1b] tracking-tight font-display">
            Tire Suas Dúvidas Sobre Nossos Serviços
          </h2>

          <p className="text-sm text-[#444747]">
            Tudo o que você precisa saber antes de iniciar seu projeto conosco.
          </p>
        </div>

        {/* FAQ Accordions */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="boro-card border border-[#c4c7c7]/40 overflow-hidden transition-all bg-[#fcf8f8]"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-[#1c1b1b]">
                    {item.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full bg-[#f1edec] flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-black text-white' : 'text-[#1c1b1b]'}`}>
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#444747] leading-relaxed border-t border-[#c4c7c7]/20 bg-white">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions prompt */}
        <div className="mt-10 p-6 bg-[#f1edec] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-[#1c1b1b]">Ainda tem alguma pergunta específica?</h4>
            <p className="text-xs text-[#747878] mt-0.5">Fale diretamente com um de nossos especialistas no WhatsApp.</p>
          </div>

          <a
            href={`https://wa.me/${AGENCY_CONFIG.whatsappDigits}?text=${encodeURIComponent('Olá! Estive a ver o site da Codeengine e tenho uma dúvida antes de preencher a proposta.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="boro-btn-secondary text-xs px-4 h-10 inline-flex shrink-0 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-[#1a6b3a]" />
            <span>Tirar Dúvida no WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
};
