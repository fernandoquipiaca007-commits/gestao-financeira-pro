export type CurrencyCode = 'BRL' | 'AOA' | 'USD' | 'EUR';
export type CountryCode = 'AO' | 'BR' | 'PT' | 'US' | 'OTHER';

export interface CountryConfig {
  name: string;
  flag: string;
  ddi: string;
  defaultCurrency: CurrencyCode;
  phonePlaceholder: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  AO: { name: 'Angola', flag: '🇦🇴', ddi: '+244', defaultCurrency: 'AOA', phonePlaceholder: '923 000 000' },
  BR: { name: 'Brasil', flag: '🇧🇷', ddi: '+55', defaultCurrency: 'BRL', phonePlaceholder: '(11) 98765-4321' },
  PT: { name: 'Portugal', flag: '🇵🇹', ddi: '+351', defaultCurrency: 'EUR', phonePlaceholder: '912 345 678' },
  US: { name: 'Estados Unidos', flag: '🇺🇸', ddi: '+1', defaultCurrency: 'USD', phonePlaceholder: '(555) 000-0000' },
  OTHER: { name: 'Outro País', flag: '🌐', ddi: '+', defaultCurrency: 'USD', phonePlaceholder: 'Seu número com DDI' },
};

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; flag: string }> = {
  AOA: { symbol: 'Kz', name: 'Kwanza', flag: '🇦🇴' },
  BRL: { symbol: 'R$', name: 'Real', flag: '🇧🇷' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇵🇹' },
  USD: { symbol: 'US$', name: 'Dólar', flag: '🇺🇸' },
};

export type ServiceId = 
  | 'trafego-pago'
  | 'funil-palestras'
  | 'gestao-marketing'
  | 'estruturacao-campanhas'
  | 'landing-pages'
  | 'edicao-video'
  | 'gestao-redes'
  | 'automacoes-crm'
  | 'consultoria-estrategica';

export interface ServiceItem {
  id: ServiceId;
  title: string;
  shortDesc: string;
  fullDesc: string;
  category: 'trafego' | 'web' | 'video' | 'estrategia';
  tag: string;
  highlights: string[];
  deliverables: string[];
  recommendedFor: string;
  iconName: string;
}

export interface LeadSubmission {
  name: string;
  company: string;
  whatsapp: string;
  email: string;
  country: CountryCode;
  service: string;
  additionalServices: string[];
  budgetRange: string;
  notes: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar: string;
  rating: number;
  results: string;
  content: string;
  service: string;
}
