import React from 'react';
import { HOW_IT_WORKS_STEPS } from './lib/data';
import { Sparkles, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="py-20 lg:py-28 bg-[#fcf8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-[#f1edec] border border-[#c4c7c7]/50 text-[#1c1b1b] px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#0050d7]" />
            <span>Processo Ágil &amp; Transparente</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1c1b1b] tracking-tight font-display">
            Como Funciona Nossa Parceria
          </h2>

          <p className="text-base text-[#444747] leading-relaxed">
            Sem burocracia ou processos lentos. Estruturamos e colocamos sua operação digital no ar com velocidade e foco em retorno sobre o investimento.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 relative">
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <div
              key={idx}
              className="boro-card p-6 bg-white flex flex-col justify-between relative group hover:border-[#000000] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0050d7] bg-[#dbe1ff] px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                  <span className="text-3xl font-black text-[#e5e2e1] font-display group-hover:text-black transition-colors">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1c1b1b] mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs text-[#444747] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#c4c7c7]/30 flex items-center space-x-2 text-[11px] font-semibold text-[#747878]">
                <span className="w-2 h-2 rounded-full bg-[#1a6b3a]"></span>
                <span>Fase Concluída em 48-72h</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
