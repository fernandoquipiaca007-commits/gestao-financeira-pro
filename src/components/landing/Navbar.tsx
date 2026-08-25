import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Menu, X, PhoneCall, ShieldCheck, Layers } from 'lucide-react';
import { AGENCY_CONFIG } from './lib/supabase';

interface NavbarProps {
  onOpenLeadModal?: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLeadModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', href: '#inicio' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Funil de Palestras', href: '#funil-palestras' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-[#c4c7c7]/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a
          href="#inicio"
          onClick={(e) => { e.preventDefault(); handleNavClick('#inicio'); }}
          className="flex items-center space-x-2.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-all">
            <Layers className="w-5 h-5 stroke-[2.4] text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-tight text-[#1c1b1b] font-display">
                {AGENCY_CONFIG.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0050d7]"></span>
            </div>
            <span className="text-[10px] font-semibold text-[#747878] tracking-widest uppercase -mt-1">
              Performance &amp; Growth
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 bg-[#f1edec]/80 backdrop-blur-sm border border-[#c4c7c7]/30 px-3 py-1.5 rounded-full">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              className="px-3.5 py-1.5 text-xs font-medium text-[#444747] hover:text-[#1c1b1b] hover:bg-white rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          <a
            href={`https://wa.me/${AGENCY_CONFIG.whatsappDigits}?text=${encodeURIComponent('Olá Codeengine! Gostaria de tirar uma dúvida rápida sobre os serviços de tráfego e funis.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="boro-btn-secondary text-xs px-3.5 h-10 inline-flex"
            title="Falar no WhatsApp"
          >
            <PhoneCall className="w-3.5 h-3.5 stroke-[2.2] text-[#0050d7]" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          <a
            href="#solicitar"
            onClick={(e) => { e.preventDefault(); handleNavClick('#solicitar'); }}
            className="boro-btn-primary text-xs px-5 h-10 inline-flex shadow-[0_4px_14px_rgba(0,0,0,0.15)] active:scale-95"
          >
            <span>Solicitar Orçamento</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center space-x-2 lg:hidden">
          <a
            href="#solicitar"
            onClick={(e) => { e.preventDefault(); handleNavClick('#solicitar'); }}
            className="boro-btn-primary text-xs px-3.5 h-9"
          >
            <span>Orçamento</span>
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1] transition-all"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#c4c7c7]/40 shadow-xl px-4 pt-3 pb-6 space-y-3 animate-fade-in mt-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                className="block px-3 py-2.5 text-sm font-medium text-[#1c1b1b] hover:bg-[#f1edec] rounded-xl transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#c4c7c7]/30 flex flex-col gap-2">
            <a
              href="#solicitar"
              onClick={(e) => { e.preventDefault(); handleNavClick('#solicitar'); }}
              className="boro-btn-primary w-full justify-center h-11 text-sm"
            >
              <span>Solicitar Orçamento Gratuito</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`https://wa.me/${AGENCY_CONFIG.whatsappDigits}?text=${encodeURIComponent('Olá Codeengine! Gostaria de conversar com um especialista.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="boro-btn-secondary w-full justify-center h-11 text-sm"
            >
              <PhoneCall className="w-4 h-4 text-[#0050d7]" />
              <span>Falar no WhatsApp ({AGENCY_CONFIG.whatsappRaw})</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
