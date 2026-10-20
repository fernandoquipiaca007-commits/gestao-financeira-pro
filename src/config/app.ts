// src/config/app.ts
// ============================================================
// Configuração central da aplicação — sem hardcoding
// Todas as referências de marca e suporte utilizam estas constantes
// ============================================================

export const APP_CONFIG = {
  /** Nome comercial do produto */
  name: (import.meta as any).env?.VITE_APP_NAME || 'CodeEngine Gestão',

  /** Tagline / descrição curta */
  tagline: 'Gestão financeira e operacional da CodeEngine',

  /** E-mail de suporte ao cliente */
  supportEmail: (import.meta as any).env?.VITE_SUPPORT_EMAIL || 'suporte@codeengine.pro',

  /** WhatsApp de suporte (ex: 5511999999999) */
  supportWhatsapp: (import.meta as any).env?.VITE_SUPPORT_WHATSAPP || '',

  /** URL base da aplicação */
  appUrl: (import.meta as any).env?.VITE_APP_URL || window.location.origin,

  /** Versão da aplicação */
  version: '2.0.0',
} as const;

/** Configuração da agência / landing page */
export const AGENCY_CONFIG = {
  name: (import.meta as any).env?.VITE_AGENCY_NAME || APP_CONFIG.name,
  whatsappRaw: (import.meta as any).env?.VITE_AGENCY_WHATSAPP || APP_CONFIG.supportWhatsapp,
  whatsappDigits: ((import.meta as any).env?.VITE_AGENCY_WHATSAPP || APP_CONFIG.supportWhatsapp).replace(/\D/g, ''),
  email: (import.meta as any).env?.VITE_AGENCY_EMAIL || APP_CONFIG.supportEmail,
} as const;
