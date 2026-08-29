import React, { useState } from 'react';
import { Navbar } from './landing/Navbar';
import { HeroSection } from './landing/HeroSection';
import { MetricsBar } from './landing/MetricsBar';
import { ServicesSection } from './landing/ServicesSection';
import { LectureFunnelSpotlight } from './landing/LectureFunnelSpotlight';
import { HowItWorksSection } from './landing/HowItWorksSection';
import { TestimonialsSection } from './landing/TestimonialsSection';
import { FaqSection } from './landing/FaqSection';
import { ContactForm } from './landing/ContactForm';
import { Footer } from './landing/Footer';
import { FloatingWhatsApp } from './landing/FloatingWhatsApp';
import { ArrowLeft, ExternalLink, Globe, Sparkles, Layers } from 'lucide-react';

interface LandingPageViewProps {
  onBackToDashboard?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onBackToDashboard }) => {
  const [selectedService, setSelectedService] = useState<string>('Gestão de Tráfego Pago & Performance');

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] flex flex-col font-sans -m-4 sm:-m-6 lg:-m-8">
      
      {/* Top Floating Management Bar */}
      {onBackToDashboard && (
        <div className="bg-black text-white px-4 py-2 text-xs flex items-center justify-between z-50 sticky top-0 shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold">Visualização do Site &bull; Codeengine</span>
            <span className="hidden sm:inline text-zinc-400">| Sincronizado com a base de dados do sistema</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToDashboard}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Sistema</span>
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-1">
        <HeroSection onSelectService={(s) => setSelectedService(s)} />
        <MetricsBar />
        <ServicesSection onSelectService={(s) => setSelectedService(s)} />
        <LectureFunnelSpotlight onSelectService={(s) => setSelectedService(s)} />
        <HowItWorksSection />
        <TestimonialsSection />
        <ContactForm selectedServicePreset={selectedService} />
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp */}
      <FloatingWhatsApp />
    </div>
  );
};
