import React, { useState } from 'react';
import { 
  TrendingUp, 
  Presentation, 
  Target, 
  Layers, 
  Layout, 
  Video, 
  Share2, 
  Zap, 
  Compass, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AGENCY_SERVICES } from './lib/data';
import { ServiceItem } from './types';

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos os Serviços' },
    { id: 'trafego', label: 'Tráfego & Campanhas' },
    { id: 'estrategia', label: 'Funis & Estratégia' },
    { id: 'web', label: 'Landing Pages & CRM' },
    { id: 'video', label: 'Vídeo & Social Media' },
  ];

  const filteredServices = activeCategory === 'todos' 
    ? AGENCY_SERVICES 
    : AGENCY_SERVICES.filter(s => s.category === activeCategory);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="w-6 h-6 stroke-[2.2]" />;
      case 'Presentation': return <Presentation className="w-6 h-6 stroke-[2.2]" />;
      case 'Target': return <Target className="w-6 h-6 stroke-[2.2]" />;
      case 'Layers': return <Layers className="w-6 h-6 stroke-[2.2]" />;
      case 'Layout': return <Layout className="w-6 h-6 stroke-[2.2]" />;
      case 'Video': return <Video className="w-6 h-6 stroke-[2.2]" />;
      case 'Share2': return <Share2 className="w-6 h-6 stroke-[2.2]" />;
      case 'Zap': return <Zap className="w-6 h-6 stroke-[2.2]" />;
      case 'Compass': return <Compass className="w-6 h-6 stroke-[2.2]" />;
      default: return <Sparkles className="w-6 h-6 stroke-[2.2]" />;
    }
  };

  const handleServiceClick = (service: ServiceItem) => {
    onSelectService(service.title);
    const element = document.querySelector('#solicitar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="servicos" className="py-20 lg:py-28 relative bg-[#fcf8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-[#dbe1ff] text-[#003da9] px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ecossistema de Soluções</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1c1b1b] tracking-tight font-display">
            Serviços Especializados para Escalar seu Faturamento
          </h2>

          <p className="text-base text-[#444747] leading-relaxed">
            Do primeiro clique até o fechamento da venda. Oferecemos soluções integradas com execução técnica impecável e acompanhamento diário de métricas.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                  : 'bg-white text-[#444747] border border-[#c4c7c7]/50 hover:bg-[#f1edec] hover:text-[#1c1b1b]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="boro-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200 bg-white"
            >
              <div>
                
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center group-hover:bg-[#0050d7] group-hover:text-white transition-colors duration-200 shadow-xs">
                    {getServiceIcon(service.iconName)}
                  </div>
                  <span className="boro-badge boro-badge-secondary text-[10px]">
                    {service.tag}
                  </span>
                </div>

                {/* Service Title & Description */}
                <h3 className="text-lg font-bold text-[#1c1b1b] group-hover:text-[#0050d7] transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-xs text-[#444747] leading-relaxed mt-2">
                  {service.shortDesc}
                </p>

                {/* Highlights List */}
                <div className="my-5 pt-4 border-t border-[#c4c7c7]/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#747878] block">
                    O que está incluso:
                  </span>
                  {service.highlights.map((h, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-[#1c1b1b]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0050d7] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#c4c7c7]/30">
                <button
                  onClick={() => handleServiceClick(service)}
                  className="w-full boro-btn-secondary text-xs h-10 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all justify-between px-4 cursor-pointer"
                >
                  <span>Solicitar este serviço</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Banner for Custom Combinations */}
        <div className="mt-12 p-6 sm:p-8 bg-gradient-to-r from-black via-[#111215] to-[#1b1c1c] rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="boro-badge boro-badge-accent text-white border-white/20">
              Pacotes Personalizados
            </span>
            <h4 className="text-xl sm:text-2xl font-bold font-display">
              Precisa de uma solução combinada para o seu projeto?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
              Montamos pacotes sob medida unindo Tráfego + Vídeos de Alta Conversão + Funil de Palestras + Landing Pages integradas.
            </p>
          </div>

          <button
            onClick={() => {
              onSelectService('Pacote Personalizado 360°');
              const el = document.querySelector('#solicitar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="boro-btn-accent text-xs sm:text-sm px-6 h-11 shrink-0 active:scale-95"
          >
            <span>Montar Pacote Personalizado</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
