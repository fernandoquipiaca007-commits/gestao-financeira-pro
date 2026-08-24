import React from 'react';
import { AGENCY_TESTIMONIALS } from './lib/data';
import { Star, Quote, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="depoimentos" className="py-20 lg:py-28 bg-[#fcf8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#d4eddf] text-[#1a6b3a] px-3.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Casos Reais &bull; Clientes Satisfeitos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1c1b1b] tracking-tight font-display">
            Quem Confia na Codeengine Não Para de Escalar
          </h2>

          <p className="text-base text-[#444747] leading-relaxed">
            Veja como ajudamos empresários, palestrantes e marcas em Angola, Brasil e Portugal a conquistarem resultados extraordinários.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AGENCY_TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="boro-card p-6 sm:p-8 bg-white flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                
                {/* Top Rating & Result Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span className="boro-badge boro-badge-success text-xs font-bold">
                    {t.results}
                  </span>
                </div>

                {/* Testimonial Quote */}
                <p className="text-xs sm:text-sm text-[#1c1b1b] leading-relaxed italic font-normal">
                  "{t.content}"
                </p>

                {/* Service Tag */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-[#0050d7] bg-[#dbe1ff] px-2.5 py-0.5 rounded-full inline-block">
                    {t.service}
                  </span>
                </div>

              </div>

              {/* Author Profile */}
              <div className="mt-6 pt-4 border-t border-[#c4c7c7]/30 flex items-center space-x-3.5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#0050d7]/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1c1b1b] truncate">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-[#747878] truncate">
                    {t.role} &bull; {t.company}
                  </p>
                  <p className="text-[10px] text-[#747878] font-medium mt-0.5">
                    {t.location}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
