import React, { useState, useEffect } from 'react';
import { 
  Play, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Scale, 
  ShieldCheck, 
  Clock, 
  Video,
  Award
} from 'lucide-react';
import { LAWYER_VIDEO_TESTIMONIALS } from '../lib/data';
import { VideoTestimonial } from '../types';

export const TestimonialsSection: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoTestimonial | null>(null);

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVideo(null);
      }
    };
    if (selectedVideo) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedVideo]);

  const featuredTestimonial = LAWYER_VIDEO_TESTIMONIALS.find(t => t.isFeatured) || LAWYER_VIDEO_TESTIMONIALS[0];
  const galleryTestimonials = LAWYER_VIDEO_TESTIMONIALS.filter(t => !t.isFeatured);

  const scrollToContact = () => {
    const el = document.getElementById('solicitar') || document.getElementById('contato') || document.querySelector('#solicitar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="depoimentos" className="py-20 lg:py-28 bg-[#fcf8f8] relative overflow-hidden scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 lg:mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#d4eddf] text-[#1a6b3a] px-3.5 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Experiências Reais &bull; Prova Social</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1c1b1b] tracking-tight font-display">
            Quem já confiou na CodeEngine
          </h2>

          <p className="text-base sm:text-lg text-[#444747] leading-relaxed">
            Resultados reais de profissionais que utilizaram nossas estratégias de tráfego pago, funis e aquisição de clientes.
          </p>
        </div>

        {/* 1. FEATURED TESTIMONIAL (Dra. Dina Neres) */}
        {featuredTestimonial && (
          <div className="max-w-5xl mx-auto mb-16">
            <div className="boro-card p-6 sm:p-10 bg-white border border-[#c4c7c7]/50 shadow-xl relative overflow-hidden group hover:border-[#000000]/20 transition-all">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left: Video Preview Card with Central Play Button */}
                <div className="lg:col-span-5 flex justify-center">
                  <div 
                    onClick={() => featuredTestimonial.videoUrl && setSelectedVideo(featuredTestimonial)}
                    className="relative w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black cursor-pointer group/video border border-black/10 transform transition-transform duration-300 group-hover:scale-[1.01]"
                  >
                    {/* Poster Image */}
                    <img 
                      src={featuredTestimonial.thumbnailUrl || '/videos/dra-dina-neres-thumb.jpg'} 
                      alt={featuredTestimonial.name}
                      className="w-full h-full object-cover object-center group-hover/video:scale-105 transition-transform duration-500"
                    />

                    {/* Dark gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover/video:bg-black/30 transition-colors duration-300"></div>

                    {/* Top Tag Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-white/10">
                        <Video className="w-3 h-3 text-[#0050d7]" />
                        <span>Depoimento em Vídeo</span>
                      </span>

                      {featuredTestimonial.duration && (
                        <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
                          {featuredTestimonial.duration}
                        </span>
                      )}
                    </div>

                    {/* Center Animated Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/95 text-[#000000] flex items-center justify-center shadow-2xl pl-1 transform group-hover/video:scale-110 group-hover/video:bg-[#0050d7] group-hover/video:text-white transition-all duration-300">
                        <Play className="w-7 h-7 fill-current stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Bottom label overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                      <p className="text-xs font-bold truncate">{featuredTestimonial.name}</p>
                      <p className="text-[10px] text-zinc-300 truncate">{featuredTestimonial.role} &bull; {featuredTestimonial.specialty}</p>
                    </div>

                  </div>
                </div>

                {/* Right: Testimonial Details & Authority Copy */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Category & Badge */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0050d7] bg-[#dbe1ff] px-3 py-1 rounded-full">
                      {featuredTestimonial.serviceCategory}
                    </span>
                    <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1a6b3a] bg-[#d4eddf] px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Depoimento em Destaque</span>
                    </span>
                  </div>

                  {/* Client Identification */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight font-display">
                      {featuredTestimonial.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#747878] mt-1 font-medium">
                      <Scale className="w-4 h-4 text-[#0050d7] shrink-0" />
                      <span>{featuredTestimonial.role}</span>
                      {featuredTestimonial.specialty && (
                        <>
                          <span>&bull;</span>
                          <span>{featuredTestimonial.specialty}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Highlight Quote Box */}
                  <div className="p-5 sm:p-6 bg-[#fcf8f8] rounded-2xl border-l-4 border-l-[#0050d7] border border-[#c4c7c7]/30 relative">
                    <p className="text-sm sm:text-base text-[#1c1b1b] leading-relaxed italic font-medium">
                      &ldquo;{featuredTestimonial.highlightQuote}&rdquo;
                    </p>
                  </div>

                  {featuredTestimonial.fullDescription && (
                    <p className="text-xs sm:text-sm text-[#444747] leading-relaxed">
                      {featuredTestimonial.fullDescription}
                    </p>
                  )}

                  {/* Play Action Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => featuredTestimonial.videoUrl && setSelectedVideo(featuredTestimonial)}
                      className="boro-btn-primary h-12 px-7 text-xs sm:text-sm shadow-lg group/btn cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current mr-1" />
                      <span>Assistir Depoimento em Vídeo</span>
                    </button>

                    <button
                      type="button"
                      onClick={scrollToContact}
                      className="boro-btn-secondary h-12 px-6 text-xs sm:text-sm hover:bg-[#e5e2e1] cursor-pointer"
                    >
                      <span>Quero Resultados Semelhantes</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* 2. GALLERY OF OTHER TESTIMONIALS (Prepared for Future Videos) */}
        {galleryTestimonials.length > 0 && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border-b border-[#c4c7c7]/30 pb-3 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#1c1b1b] font-display flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#0050d7]" />
                <span>Outros Casos &amp; Experiências</span>
              </h3>
              <span className="text-xs text-[#747878] font-medium">
                Galeria de Advogadas &amp; Parceiros
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryTestimonials.map((item) => (
                <div
                  key={item.id}
                  className="boro-card p-6 bg-white border border-[#c4c7c7]/40 flex flex-col justify-between hover:border-[#000000]/20 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3.5">
                    
                    {/* Header: Specialty & Role */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#0050d7] bg-[#dbe1ff] px-2.5 py-0.5 rounded-full">
                        {item.serviceCategory}
                      </span>

                      {item.isUpcoming ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#747878] bg-[#f1edec] px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-[#747878]" />
                          <span>Em Breve</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#1a6b3a] bg-[#d4eddf] px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-[#1a6b3a]" />
                          <span>Disponível</span>
                        </span>
                      )}
                    </div>

                    {/* Identification */}
                    <div>
                      <h4 className="text-base font-bold text-[#1c1b1b] group-hover:text-[#0050d7] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#747878] mt-0.5">
                        {item.role} &bull; {item.specialty}
                      </p>
                    </div>

                    {/* Quote / Summary */}
                    <p className="text-xs text-[#444747] leading-relaxed italic bg-[#fcf8f8] p-3.5 rounded-xl border border-[#c4c7c7]/20">
                      &ldquo;{item.highlightQuote}&rdquo;
                    </p>

                  </div>

                  {/* Card Action Button */}
                  <div className="mt-5 pt-3 border-t border-[#c4c7c7]/20">
                    {item.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(item)}
                        className="boro-btn-secondary w-full h-10 text-xs font-semibold justify-center hover:bg-[#e5e2e1] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-[#0050d7] mr-1" />
                        <span>Assistir Depoimento</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-[#747878] py-1 font-medium">
                        <span className="flex items-center space-x-1.5">
                          <Video className="w-3.5 h-3.5 text-[#747878]" />
                          <span>Depoimento em gravação</span>
                        </span>
                        <span className="text-[11px] text-[#0050d7] font-bold">Novos Vídeos</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. BOTTOM CALL TO ACTION BOX */}
        <div className="max-w-4xl mx-auto mt-16 p-8 sm:p-10 bg-[#111215] text-white rounded-3xl shadow-xl text-center space-y-5 relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black font-display tracking-tight text-white">
              Quer alcançar resultados semelhantes?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed font-normal">
              Converse com a nossa equipe estratégica e descubra como estruturar sua máquina de atração de clientes qualificados.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToContact}
              className="inline-flex items-center justify-center space-x-2 bg-white text-[#1c1b1b] hover:bg-[#f1edec] font-bold text-sm px-8 h-12 rounded-full shadow-lg hover:scale-105 active:scale-98 transition-all cursor-pointer"
            >
              <span>Falar com a CodeEngine</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. HIGH-END VIDEO PLAYBACK MODAL */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative w-full max-w-md bg-[#111215] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-[#16181d]">
              <div className="min-w-0 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white truncate">{selectedVideo.name}</span>
                  <span className="text-[10px] bg-[#0050d7] text-white px-2 py-0.5 rounded-full font-semibold">
                    {selectedVideo.role}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{selectedVideo.serviceCategory}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Fechar vídeo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black flex items-center justify-center overflow-hidden flex-1 max-h-[70vh]">
              {selectedVideo.videoUrl && (
                <video
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.thumbnailUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[70vh] object-contain rounded-b-none"
                >
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#16181d] border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px]">CodeEngine &bull; Performance &amp; Growth</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  scrollToContact();
                }}
                className="text-white font-bold text-xs bg-[#0050d7] hover:bg-[#003da9] px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                Solicitar Proposta
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
