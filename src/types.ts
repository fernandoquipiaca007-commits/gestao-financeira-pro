export type CurrencyCode = 'BRL' | 'AOA' | 'USD' | 'EUR';

export type CountryCode = 'BR' | 'AO' | 'PT' | 'US' | 'OTHER';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  defaultCountry: CountryCode;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real (Brasil)', flag: '', defaultCountry: 'BR' },
  AOA: { code: 'AOA', symbol: 'Kz', name: 'Kwanza (Angola)', flag: '', defaultCountry: 'AO' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar (EUA)', flag: '', defaultCountry: 'US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (Portugal/UE)', flag: '', defaultCountry: 'PT' },
};

export const COUNTRIES: Record<CountryCode, { name: string; flag: string; defaultCurrency: CurrencyCode }> = {
  BR: { name: 'Brasil', flag: '', defaultCurrency: 'BRL' },
  AO: { name: 'Angola', flag: '', defaultCurrency: 'AOA' },
  PT: { name: 'Portugal', flag: '', defaultCurrency: 'EUR' },
  US: { name: 'Estados Unidos', flag: '', defaultCurrency: 'USD' },
  OTHER: { name: 'Outro País', flag: '', defaultCurrency: 'BRL' },
};

export type ClientType =
  | 'Tráfego Pago'
  | 'Desenvolvimento'
  | 'Consultoria'
  | 'Design & Branding'
  | 'Social Media'
  | 'Advocacia & Jurídico'
  | 'Contabilidade & Finanças'
  | 'Arquitetura & Engenharia'
  | 'Saúde & Clínicas'
  | 'Imobiliária & Corretores'
  | 'E-commerce & Varejo'
  | 'Fotografia & Audiovisual'
  | 'Educação & Cursos'
  | 'Estética & Beleza'
  | 'Prestação de Serviços'
  | 'Outro'
  | (string & {});

export const DEFAULT_CLIENT_NICHES = [
  'Tráfego Pago',
  'Desenvolvimento',
  'Consultoria',
  'Design & Branding',
  'Social Media',
  'Advocacia & Jurídico',
  'Contabilidade & Finanças',
  'Arquitetura & Engenharia',
  'Saúde & Clínicas',
  'Imobiliária & Corretores',
  'E-commerce & Varejo',
  'Fotografia & Audiovisual',
  'Educação & Cursos',
  'Estética & Beleza',
  'Prestação de Serviços',
  'Outro',
] as const;

export interface Client {
  id: string;
  name: string;
  company: string;
  whatsapp: string;
  email: string;
  type: ClientType;
  country: CountryCode;
  currency: CurrencyCode;
  notes?: string;
  createdAt: string;
  // Ficha completa (migração 014 — todos opcionais)
  taxId?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  contactName?: string;
  contactRole?: string;
  preferredChannel?: 'whatsapp' | 'email' | 'phone';
  paymentTermsDays?: number;
  tags?: string[];
  source?: string;
}

// ----------------------------------------------------
// PARTNER / PARCERIAS & COMISSÕES
// ----------------------------------------------------
export interface Partner {
  id: string;
  name: string;
  whatsapp?: string;
  email?: string;
  defaultCommissionPercent?: number; // e.g. 10 (%)
  notes?: string;
  createdAt: string;
}

export type ProjectCategory = 'Tráfego Pago' | 'Website' | 'Landing Page' | 'Loja Virtual' | 'Automação' | 'Outro' | (string & {});

export type ProjectStatus = 'Em andamento' | 'Aguardando cliente' | 'Concluído' | 'Cancelado';

export interface ProjectAttachment {
  id: string;
  name: string;
  size?: number; // bytes
  type?: string; // mime type
  url: string; // base64 or URL
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientIds?: string[];
  category: ProjectCategory;
  totalAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  startDate: string;
  dueDate: string;
  nextPaymentDate?: string;
  status: ProjectStatus;
  notes?: string;
  rating?: number; // 0 to 5 stars
  attachments?: ProjectAttachment[];
  createdAt: string;
  // Partner & Commission fields
  partnerId?: string;
  partnerName?: string;
  commissionType?: 'percent' | 'fixed';
  commissionValue?: number; // e.g. 10 for 10% or 5000 for fixed amount
  commissionAmount?: number; // calculated total commission amount
  commissionPaid?: boolean; // whether commission was paid out to partner
  // RBAC fields
  companyId?: string;
  createdBy?: string;
  assignmentType?: 'company' | 'employee' | 'available';
  assignedTo?: string; // user_id do funcionário responsável
  assignedToName?: string;
  // Invoice / Stripe
  invoiceFooter?: string; // Rodapé personalizado da fatura (NIF, dados bancários, etc.)
  invoiceNotes?: string;  // Descrição do serviço para fatura
}

export type IncomeStatus = 'Pendente' | 'Recebido' | 'Atrasado';

export const INCOME_STATUS_LABELS: Record<IncomeStatus, { pt: string; en: string }> = {
  Pendente: { pt: 'Pendente', en: 'Pending' },
  Recebido: { pt: 'Recebido', en: 'Received' },
  Atrasado: { pt: 'Atrasado', en: 'Overdue' },
};

export function getIncomeStatusLabel(status: IncomeStatus, lang: 'pt' | 'en' = 'pt'): string {
  return INCOME_STATUS_LABELS[status]?.[lang] || status;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, { pt: string; en: string }> = {
  'Em andamento': { pt: 'Em andamento', en: 'In Progress' },
  'Aguardando cliente': { pt: 'Aguardando cliente', en: 'Waiting for Client' },
  'Concluído': { pt: 'Concluído', en: 'Completed' },
  'Cancelado': { pt: 'Cancelado', en: 'Canceled' },
};

export function getProjectStatusLabel(status: ProjectStatus, lang: 'pt' | 'en' = 'pt'): string {
  return PROJECT_STATUS_LABELS[status]?.[lang] || status;
}

export type PaymentMethod = 'PIX' | 'Transferência' | 'Cartão' | 'Boleto' | 'Dinheiro' | 'Outro';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { pt: string; en: string }> = {
  PIX: { pt: 'PIX', en: 'PIX' },
  'Transferência': { pt: 'Transferência Bancária', en: 'Bank Transfer' },
  'Cartão': { pt: 'Cartão de Crédito/Débito', en: 'Credit/Debit Card' },
  Boleto: { pt: 'Boleto Bancário', en: 'Bank Slip' },
  Dinheiro: { pt: 'Dinheiro', en: 'Cash' },
  Outro: { pt: 'Outro', en: 'Other' },
};

export function getPaymentMethodLabel(method: PaymentMethod, lang: 'pt' | 'en' = 'pt'): string {
  return PAYMENT_METHOD_LABELS[method]?.[lang] || method;
}

export interface Income {
  id: string;
  clientId: string;
  projectId?: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: string;
  receivedDate?: string;
  paymentMethod?: PaymentMethod;
  status: IncomeStatus;
  notes?: string;
  createdAt: string;
  // Partner & Commission fields
  partnerId?: string;
  partnerName?: string;
  commissionAmount?: number;
  commissionPaid?: boolean;
  // Stripe Invoice fields
  stripeInvoiceId?: string;
  stripeCustomerId?: string;
  stripeInvoiceUrl?: string;   // hosted invoice URL
  stripeInvoicePdf?: string;   // PDF download URL
  stripeReceiptUrl?: string;   // receipt URL after payment
  stripeStatus?: 'none' | 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
}

export type ExpenseCategory = 'Internet' | 'Hospedagem' | 'Domínio' | 'Publicidade' | 'Ferramentas' | 'Salário' | 'Edição de vídeo' | 'Taxas de pagamento' | 'Retirada Própria' | 'Distribuição a sócios' | 'Comissão Parceiro' | 'Outros' | (string & {});

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, { pt: string; en: string }> = {
  Internet: { pt: 'Internet', en: 'Internet' },
  Hospedagem: { pt: 'Hospedagem', en: 'Hosting' },
  'Domínio': { pt: 'Domínio', en: 'Domain' },
  Publicidade: { pt: 'Publicidade / Tráfego', en: 'Advertising / Ads' },
  Ferramentas: { pt: 'Softwares & Ferramentas', en: 'Software & Tools' },
  'Salário': { pt: 'Salário & Equipa', en: 'Salary & Team' },
  'Edição de vídeo': { pt: 'Edição de vídeo', en: 'Video editing' },
  'Taxas de pagamento': { pt: 'Taxas de pagamento (Stripe/PayPal)', en: 'Payment fees (Stripe/PayPal)' },
  'Retirada Própria': { pt: 'Retirada Própria / Pró-labore', en: 'Owner Withdrawal' },
  'Distribuição a sócios': { pt: 'Distribuição a sócios', en: 'Partner distribution' },
  'Comissão Parceiro': { pt: 'Comissão de Parceiro', en: 'Partner Commission' },
  Outros: { pt: 'Outros Custos', en: 'Other Costs' },
};

/** Saídas que repartem o resultado pelos donos: saem do caixa, mas não são custo do negócio. */
export const PROFIT_DISTRIBUTION_CATEGORIES: ExpenseCategory[] = ['Retirada Própria', 'Distribuição a sócios'];
export const isProfitDistribution = (e: { category: ExpenseCategory }) => PROFIT_DISTRIBUTION_CATEGORIES.includes(e.category);

export function getExpenseCategoryLabel(category: ExpenseCategory, lang: 'pt' | 'en' = 'pt'): string {
  return EXPENSE_CATEGORY_LABELS[category]?.[lang] || category;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  paid: boolean;
  partnerId?: string;
  partnerName?: string;
  receiptUrl?: string;
  /** Reserva de caixa de onde saiu o dinheiro (ex.: "Ferramentas"). */
  reserveId?: string;
  createdAt: string;
}

/** Dinheiro que continua em caixa mas já tem destino. O valor é escrito à mão. */
export interface CashReserve {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  notes?: string;
  closed: boolean;
  createdAt: string;
}

/** Percentagem de cada sócio na divisão do resultado. */
export interface PartnerShare {
  name: string;
  percent: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'project';
  color: string;
  description?: string;
  createdAt: string;
}

export type AgendaEventType = 'cobranca' | 'pagamento' | 'entrega' | 'compromisso' | 'alarme' | 'comissao';

export const AGENDA_EVENT_TYPE_LABELS: Record<AgendaEventType, { pt: string; en: string }> = {
  cobranca: { pt: 'Cobrança', en: 'Collection' },
  pagamento: { pt: 'Data de Pagamento', en: 'Payment Due' },
  entrega: { pt: 'Data de Entrega', en: 'Delivery Date' },
  compromisso: { pt: 'Compromisso', en: 'Meeting / Appointment' },
  alarme: { pt: 'Alarme / Lembrete', en: 'Alarm / Reminder' },
  comissao: { pt: 'Pagamento de Comissão', en: 'Commission Payment' },
};

export function getAgendaEventTypeLabel(type: AgendaEventType, lang: 'pt' | 'en' = 'pt'): string {
  return AGENDA_EVENT_TYPE_LABELS[type]?.[lang] || type;
}

export interface AgendaEvent {
  id: string;
  title: string;
  type: AgendaEventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  clientId?: string;
  projectId?: string;
  partnerId?: string;
  description?: string;
  status: 'pending' | 'completed';
  notifyPush?: boolean;
  createdAt: string;
}

import { ResendEmailSettings } from './types/email';

export interface AppSettings {
  defaultCurrency: CurrencyCode;
  userName: string;
  businessName: string;
  exchangeRates: {
    BRL: number; // 1
    AOA: number; // e.g. 165 AOA per 1 BRL
    USD: number; // e.g. 0.18 USD per 1 BRL
    EUR: number; // e.g. 0.16 EUR per 1 BRL
  };
  emailSettings?: ResendEmailSettings;
  language?: 'pt' | 'en';
  /** Divisão do resultado entre sócios (soma 100%). */
  profitSplit?: PartnerShare[];
}

export interface NotificationItem {
  id: string;
  type: 'due_today' | 'overdue' | 'project_due' | 'expense_due' | 'agenda_alarm' | 'partner_commission' | 'new_lead';
  title: string;
  message: string;
  date: string;
  clientId?: string;
  projectId?: string;
  incomeId?: string;
  expenseId?: string;
  agendaEventId?: string;
  partnerId?: string;
  whatsappMessage?: string;
  whatsappPhone?: string;
  severity: 'high' | 'medium' | 'info';
  read?: boolean;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  role?: string;
  companyId?: string;
  status?: string;
  token?: string;
}
