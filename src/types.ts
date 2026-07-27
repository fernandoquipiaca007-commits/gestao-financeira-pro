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
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real (Brasil)', flag: '🇧🇷', defaultCountry: 'BR' },
  AOA: { code: 'AOA', symbol: 'Kz', name: 'Kwanza (Angola)', flag: '🇦🇴', defaultCountry: 'AO' },
  USD: { code: 'USD', symbol: 'US$', name: 'Dólar (EUA)', flag: '🇺🇸', defaultCountry: 'US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (Portugal/UE)', flag: '🇵🇹', defaultCountry: 'PT' },
};

export const COUNTRIES: Record<CountryCode, { name: string; flag: string; defaultCurrency: CurrencyCode }> = {
  BR: { name: 'Brasil', flag: '🇧🇷', defaultCurrency: 'BRL' },
  AO: { name: 'Angola', flag: '🇦🇴', defaultCurrency: 'AOA' },
  PT: { name: 'Portugal', flag: '🇵🇹', defaultCurrency: 'EUR' },
  US: { name: 'Estados Unidos', flag: '🇺🇸', defaultCurrency: 'USD' },
  OTHER: { name: 'Outro País', flag: '🌐', defaultCurrency: 'BRL' },
};

export type ClientType = 'Tráfego Pago' | 'Desenvolvimento' | 'Consultoria' | 'Outro';

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
}

export type ProjectCategory = 'Tráfego Pago' | 'Website' | 'Landing Page' | 'Loja Virtual' | 'Automação' | 'Outro';

export type ProjectStatus = 'Em andamento' | 'Aguardando cliente' | 'Concluído' | 'Cancelado';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  category: ProjectCategory;
  totalAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  startDate: string;
  dueDate: string;
  nextPaymentDate?: string;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
}

export type IncomeStatus = 'Pendente' | 'Recebido' | 'Atrasado';

export type PaymentMethod = 'PIX' | 'Transferência' | 'Cartão' | 'Boleto' | 'Dinheiro' | 'Outro';

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
}

export type ExpenseCategory = 'Internet' | 'Hospedagem' | 'Domínio' | 'Publicidade' | 'Ferramentas' | 'Salário' | 'Outros';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  paid: boolean;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'project';
  color: string;
  description?: string;
  createdAt: string;
}

export type AgendaEventType = 'cobranca' | 'pagamento' | 'entrega' | 'compromisso' | 'alarme';

export interface AgendaEvent {
  id: string;
  title: string;
  type: AgendaEventType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  clientId?: string;
  projectId?: string;
  description?: string;
  status: 'pending' | 'completed';
  notifyPush?: boolean;
  createdAt: string;
}

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
}

export interface NotificationItem {
  id: string;
  type: 'due_today' | 'overdue' | 'project_due' | 'expense_due' | 'agenda_alarm';
  title: string;
  message: string;
  date: string;
  clientId?: string;
  projectId?: string;
  incomeId?: string;
  expenseId?: string;
  agendaEventId?: string;
  whatsappMessage?: string;
  whatsappPhone?: string;
  severity: 'high' | 'medium' | 'info';
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  role?: string;
  token?: string;
}
