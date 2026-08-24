import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Zap, 
  Play, 
  ShieldCheck, 
  BarChart3, 
  MousePointerClick,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AGENCY_CONFIG } from './lib/supabase';

interface HeroSectionProps {
  onSelectService?: (serviceName: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectService }) => {
  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 overflow-hidden opacity-60">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#0050d7]/15 to-transparent rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-[#1b1c1c]/10 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill Tag */}
            <div className="inline-flex items-center space-x-2 bg-white border border-[#c4c7c7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-3.5 py-1.5 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0050d7] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0050d7]"></span>
              </span>
              <span className="text-xs font-semibold text-[#1c1b1b] tracking-wide">
                Tráfego Pago &bull; Funis de Palestras &bull; Estratégias de Escala
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1c1b1b] tracking-tight leading-[1.08] font-display">
              Transformamos cliques em <span className="bg-gradient-to-r from-[#000000] via-[#0050d7] to-[#003da9] bg-clip-text text-transparent">faturamento real</span> para a sua empresa.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-[#444747] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              A <strong>{AGENCY_CONFIG.name}</strong> é a parceira estratégica que une gestão de tráfego de alta precisão, montagem de funis de palestras, landing pages ultra-rápidas e edição de vídeo profissional para acelerar seu crescimento.
            </p>

            {/* Key Value Checks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#1c1b1b]">
                <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] shrink-0 stroke-[2.5]" />
                <span>ROI Comprovado</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#1c1b1b]">
                <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] shrink-0 stroke-[2.5]" />
                <span>Atendimento Direto</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#1c1b1b]">
                <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] shrink-0 stroke-[2.5]" />
                <span>Angola &bull; Brasil &bull; Europa</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-4 justify-center lg:justify-start">
              <button
                onClick={() => scrollToSection('#solicitar')}
                className="boro-btn-primary h-12 text-sm px-7 shadow-[0_4px_20px_rgba(0,0,0,0.2)] active:scale-95"
              >
                <span>Solicitar Proposta Gratuita</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => scrollToSection('#servicos')}
                className="boro-btn-secondary h-12 text-sm px-6 hover:bg-[#e5e2e1]"
              >
                <span>Ver Nossos Serviços</span>
              </button>
            </div>

            {/* Trust Footer line */}
            <div className="pt-2 flex items-center justify-center lg:justify-start space-x-4 text-xs text-[#747878]">
              <div className="flex -space-x-2">
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Cliente" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Cliente" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" alt="Cliente" />
              </div>
              <span><strong>+100 clientes</strong> acelerados com alta conversão</span>
            </div>

          </div>

          {/* Right Column: Interactive Conversion Live Cockpit Preview */}
          <div className="lg:col-span-5">
            <div className="relative">
              
              {/* Outer decorative card */}
              <div className="boro-card p-6 bg-gradient-to-b from-white to-[#f7f3f2] border border-[#c4c7c7]/50 shadow-[0_20px_50px_rgba(0,0,0,0.06)] relative z-10">
                
                {/* Header of Cockpit Card */}
                <div className="flex items-center justify-between pb-4 border-b border-[#c4c7c7]/30">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1c1b1b]">Painel de Performance {AGENCY_CONFIG.name}</h4>
                      <p className="text-[10px] text-[#747878]">Métricas Consolidadas em Tempo Real</p>
                    </div>
                  </div>
                  <span className="boro-badge boro-badge-success text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b3a]"></span>
                    Campanhas Ativas
                  </span>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3.5 bg-white rounded-2xl border border-[#c4c7c7]/30 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#747878]">
                      <span>ROAS Médio</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#1a6b3a]" />
                    </div>
                    <div className="text-2xl font-black text-[#1c1b1b] mt-1 font-display">4.82x</div>
                    <span className="text-[10px] text-[#1a6b3a] font-medium">+34% vs mês anterior</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-[#c4c7c7]/30 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#747878]">
                      <span>Leads Captados</span>
                      <Users className="w-3.5 h-3.5 text-[#0050d7]" />
                    </div>
                    <div className="text-2xl font-black text-[#1c1b1b] mt-1 font-display">+14.280</div>
                    <span className="text-[10px] text-[#0050d7] font-medium">WhatsApp / CRM</span>
                  </div>
                </div>

                {/* Funnel Flow Simulation Item */}
                <div className="p-4 bg-[#111215] text-white rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">Funil de Palestras em Ação</span>
                    </div>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">Ao Vivo</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-zinc-300 text-[11px]">
                      <span>Inscrições na Landing Page</span>
                      <span className="font-bold text-white">1.840 inscritos</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#0050d7] h-full rounded-full w-[88%]"></div>
                    </div>

                    <div className="flex justify-between items-center text-zinc-300 text-[11px] pt-1">
                      <span>Presença Confirmada no WhatsApp</span>
                      <span className="font-bold text-emerald-400">76% taxa de presença</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#1a6b3a] h-full rounded-full w-[76%]"></div>
                    </div>
                  </div>
                </div>

                {/* Mini Live Conversion Notification */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-[#c4c7c7]/40 flex items-center space-x-3 text-xs shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-[#dbe1ff] text-[#003da9] flex items-center justify-center shrink-0">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1c1b1b] truncate">Novo contrato fechado</p>
                    <p className="text-[10px] text-[#747878] truncate">Lead de Meta Ads &rarr; WhatsApp &rarr; Fechamento</p>
                  </div>
                  <span className="text-[10px] text-[#1a6b3a] font-bold shrink-0">Agora</span>
                </div>

              </div>

              {/* Decorative floating badge */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white border border-[#c4c7c7]/50 shadow-lg px-4 py-2.5 rounded-2xl items-center space-x-3 z-20 animate-float">
                <div className="w-8 h-8 rounded-full bg-[#d4eddf] text-[#1a6b3a] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1c1b1b]">+R$ 5M+</div>
                  <div className="text-[10px] text-[#747878]">Faturamento Gerado</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
