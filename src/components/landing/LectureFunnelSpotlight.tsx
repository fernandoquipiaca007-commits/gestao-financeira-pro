import React from 'react';
import { 
  Presentation, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Flame,
  Clock,
  Send
} from 'lucide-react';

interface LectureFunnelSpotlightProps {
  onSelectService: (serviceName: string) => void;
}

export const LectureFunnelSpotlight: React.FC<LectureFunnelSpotlightProps> = ({ onSelectService }) => {
  const steps = [
    {
      step: '01',
      icon: <Users className="w-5 h-5 text-[#0050d7]" />,
      title: 'Captação de Inscritos Qualificados',
      desc: 'Anúncios ultra-segmentados no Meta & Google convidando o público ideal para o seu evento ou palestra ao vivo.',
    },
    {
      step: '02',
      icon: <CheckCircle2 className="w-5 h-5 text-[#1a6b3a]" />,
      title: 'Landing Page de Alta Conversão',
      desc: 'Página de inscrição rápida com taxa de conversão acima de 45%, capturando Nome, WhatsApp e E-mail.',
    },
    {
      step: '03',
      icon: <MessageSquare className="w-5 h-5 text-amber-500" />,
      title: 'Grupo VIP & Aquecimento no WhatsApp',
      desc: 'Comunidade exclusiva com conteúdos estratégicos pré-evento para aumentar o desejo e a autoridade.',
    },
    {
      step: '04',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      title: 'Lembretes & Fechamento em Massa',
      desc: 'Automação de alertas 1h, 15min e no início do evento. Taxa de presença recorde e pitch de vendas estruturado.',
    },
  ];

  return (
    <section id="funil-palestras" className="py-20 lg:py-24 bg-white border-y border-[#c4c7c7]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1 rounded-full text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>Metodologia Exclusiva Codeengine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1c1b1b] tracking-tight font-display">
              Funil de Palestras, Eventos &amp; Masterclasses
            </h2>
            <p className="text-sm sm:text-base text-[#444747]">
              A estratégia mais rápida e lucrativa para fechar contratos de alto valor e vender mentorias, consultorias e serviços corporativos.
            </p>
          </div>

          <button
            onClick={() => {
              onSelectService('Montagem de Funil de Palestras & Eventos');
              const el = document.querySelector('#solicitar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="boro-btn-primary text-xs sm:text-sm px-6 h-11 shrink-0 self-start md:self-auto shadow-md"
          >
            <span>Quero um Funil de Palestras</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Graphic Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="boro-card p-6 bg-[#fcf8f8] hover:bg-white relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#c4c7c7]/40 flex items-center justify-center shadow-xs">
                    {s.icon}
                  </div>
                  <span className="text-2xl font-black text-[#c4c7c7] font-display">
                    {s.step}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#1c1b1b] mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-[#444747] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#c4c7c7]/20 flex items-center text-[11px] font-semibold text-[#0050d7]">
                <span>Etapa {s.step} do Processo</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison / Case Snapshot */}
        <div className="mt-10 p-6 sm:p-8 bg-[#f1edec] rounded-3xl border border-[#c4c7c7]/40 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-2">
            <h4 className="text-base sm:text-lg font-bold text-[#1c1b1b]">
              Por que o Funil de Palestras gera mais fechamentos que anúncios comuns?
            </h4>
            <p className="text-xs sm:text-sm text-[#444747] leading-relaxed">
              Durante uma palestra ao vivo (presencial ou online), o cliente tem de 45 a 90 minutos de imersão direta com a sua autoridade. O índice de fechamento pós-palestra chega a ser <strong>5x a 8x maior</strong> que vendas frias de WhatsApp.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c4c7c7]/40 text-center space-y-1">
            <span className="text-[11px] font-bold text-[#747878] uppercase tracking-wider block">
              Média dos Nossos Funis
            </span>
            <div className="text-3xl font-black text-[#0050d7] font-display">70% a 85%</div>
            <p className="text-xs font-semibold text-[#1a6b3a]">Taxa de Presença Confirmada</p>
          </div>
        </div>

      </div>
    </section>
  );
};
