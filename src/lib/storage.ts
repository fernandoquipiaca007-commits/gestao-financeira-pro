import { Client, Project, Income, Expense, AppSettings } from '../types';

const CLIENTS_KEY = 'gfo_clients_v1';
const PROJECTS_KEY = 'gfo_projects_v1';
const INCOMES_KEY = 'gfo_incomes_v1';
const EXPENSES_KEY = 'gfo_expenses_v1';
const SETTINGS_KEY = 'gfo_settings_v1';

// Get today's ISO date string YYYY-MM-DD
export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'BRL',
  userName: 'Gestor',
  businessName: 'Studio Digital',
  exchangeRates: {
    BRL: 1,
    AOA: 165,
    USD: 0.18,
    EUR: 0.16,
  },
};

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Mirtes Silva',
    company: 'Mirtes Moda & Estilo',
    whatsapp: '+5511987654321',
    email: 'mirtes@moda.com.br',
    type: 'Tráfego Pago',
    country: 'BR',
    currency: 'BRL',
    notes: 'Cliente recorrente de tráfego pago e gestão de Landing Pages.',
    createdAt: getTodayIso(),
  },
  {
    id: 'cli-2',
    name: 'João Pedro',
    company: 'JP Construções',
    whatsapp: '+5521998877665',
    email: 'joao@jpconstrucoes.com',
    type: 'Desenvolvimento',
    country: 'BR',
    currency: 'BRL',
    notes: 'Pagamento pendente da segunda parcela.',
    createdAt: addDaysIso(-30),
  },
  {
    id: 'cli-3',
    name: 'Empresa ABC',
    company: 'ABC Logística Ltda',
    whatsapp: '+5511976543210',
    email: 'contato@empresaabc.com',
    type: 'Desenvolvimento',
    country: 'BR',
    currency: 'BRL',
    notes: 'Website institucional em fase final de entrega.',
    createdAt: addDaysIso(-15),
  },
  {
    id: 'cli-4',
    name: 'Mateus Manuel',
    company: 'Luanda Tech & Services',
    whatsapp: '+244923456789',
    email: 'mateus@luandatech.ao',
    type: 'Desenvolvimento',
    country: 'AO',
    currency: 'AOA',
    notes: 'Cliente de Angola - Prestação de serviços web.',
    createdAt: addDaysIso(-20),
  },
  {
    id: 'cli-5',
    name: 'Sarah Jenkins',
    company: 'Nexus AI Solutions',
    whatsapp: '+14155552671',
    email: 'sarah@nexusai.io',
    type: 'Consultoria',
    country: 'US',
    currency: 'USD',
    notes: 'Consultoria de Automação e Sistemas Web nos EUA.',
    createdAt: addDaysIso(-45),
  },
  {
    id: 'cli-6',
    name: 'Nuno Costa',
    company: 'Lisboa Digital Studio',
    whatsapp: '+351912345678',
    email: 'nuno@lisboadigital.pt',
    type: 'Tráfego Pago',
    country: 'PT',
    currency: 'EUR',
    notes: 'Cliente de Portugal para campanhas de Meta e Google Ads.',
    createdAt: addDaysIso(-10),
  },
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Landing Page de Vendas',
    clientId: 'cli-1', // Mirtes
    category: 'Landing Page',
    totalAmount: 1200,
    paidAmount: 600,
    currency: 'BRL',
    startDate: addDaysIso(-10),
    dueDate: addDaysIso(5),
    nextPaymentDate: addDaysIso(0), // Hoje
    status: 'Em andamento',
    notes: 'Valor total R$ 1.200, pago R$ 600, falta R$ 600. Próximo pagamento hoje.',
    createdAt: addDaysIso(-10),
  },
  {
    id: 'proj-2',
    name: 'Website Institucional',
    clientId: 'cli-3', // Empresa ABC
    category: 'Website',
    totalAmount: 3500,
    paidAmount: 1750,
    currency: 'BRL',
    startDate: addDaysIso(-20),
    dueDate: addDaysIso(1), // Amanhã entrega!
    nextPaymentDate: addDaysIso(1),
    status: 'Em andamento',
    notes: 'Entrega do site amanhã.',
    createdAt: addDaysIso(-20),
  },
  {
    id: 'proj-3',
    name: 'Loja Virtual e Automação',
    clientId: 'cli-2', // João Pedro
    category: 'Loja Virtual',
    totalAmount: 2800,
    paidAmount: 1400,
    currency: 'BRL',
    startDate: addDaysIso(-35),
    dueDate: addDaysIso(-5), // Atrasado há 5 dias!
    nextPaymentDate: addDaysIso(-5),
    status: 'Aguardando cliente',
    notes: 'Segunda parcela com atraso de 5 dias.',
    createdAt: addDaysIso(-35),
  },
  {
    id: 'proj-4',
    name: 'Website Institucional Angola',
    clientId: 'cli-4', // Mateus Manuel
    category: 'Website',
    totalAmount: 350000,
    paidAmount: 200000,
    currency: 'AOA',
    startDate: addDaysIso(-15),
    dueDate: addDaysIso(10),
    nextPaymentDate: addDaysIso(3),
    status: 'Em andamento',
    notes: 'Projeto em Kwanza (Angola). Total 350.000 Kz.',
    createdAt: addDaysIso(-15),
  },
  {
    id: 'proj-5',
    name: 'Sistema Web SaaS AI',
    clientId: 'cli-5', // Sarah Jenkins
    category: 'Automação',
    totalAmount: 2300,
    paidAmount: 2300,
    currency: 'USD',
    startDate: addDaysIso(-40),
    dueDate: addDaysIso(-5),
    nextPaymentDate: undefined,
    status: 'Concluído',
    notes: 'Sistema entregue e 100% pago em Dólar.',
    createdAt: addDaysIso(-40),
  },
  {
    id: 'proj-6',
    name: 'Campanha Tráfego Pago Europa',
    clientId: 'cli-6', // Nuno Costa
    category: 'Tráfego Pago',
    totalAmount: 1500,
    paidAmount: 750,
    currency: 'EUR',
    startDate: addDaysIso(-8),
    dueDate: addDaysIso(12),
    nextPaymentDate: addDaysIso(4),
    status: 'Em andamento',
    notes: 'Gestão de tráfego pago em Euros.',
    createdAt: addDaysIso(-8),
  },
];

const DEFAULT_INCOMES: Income[] = [
  {
    id: 'inc-1',
    clientId: 'cli-1', // Mirtes
    projectId: 'proj-1',
    description: '1ª Parcela - Landing Page Mirtes',
    amount: 600,
    currency: 'BRL',
    dueDate: addDaysIso(-10),
    receivedDate: addDaysIso(-10),
    paymentMethod: 'PIX',
    status: 'Recebido',
    createdAt: addDaysIso(-10),
  },
  {
    id: 'inc-2',
    clientId: 'cli-1', // Mirtes
    projectId: 'proj-1',
    description: '2ª Parcela - Landing Page Mirtes',
    amount: 600,
    currency: 'BRL',
    dueDate: addDaysIso(0), // Hoje!
    paymentMethod: 'PIX',
    status: 'Pendente',
    createdAt: addDaysIso(-10),
  },
  {
    id: 'inc-3',
    clientId: 'cli-2', // João Pedro
    projectId: 'proj-3',
    description: '2ª Parcela - Loja Virtual JP',
    amount: 1400,
    currency: 'BRL',
    dueDate: addDaysIso(-5), // Atrasado há 5 dias!
    paymentMethod: 'PIX',
    status: 'Atrasado',
    createdAt: addDaysIso(-35),
  },
  {
    id: 'inc-4',
    clientId: 'cli-3', // Empresa ABC
    projectId: 'proj-2',
    description: 'Sinal - Website Empresa ABC',
    amount: 1750,
    currency: 'BRL',
    dueDate: addDaysIso(-20),
    receivedDate: addDaysIso(-20),
    paymentMethod: 'Transferência',
    status: 'Recebido',
    createdAt: addDaysIso(-20),
  },
  {
    id: 'inc-5',
    clientId: 'cli-4', // Mateus Manuel
    projectId: 'proj-4',
    description: 'Adiantamento Website Angola',
    amount: 200000,
    currency: 'AOA',
    dueDate: addDaysIso(-15),
    receivedDate: addDaysIso(-15),
    paymentMethod: 'Transferência',
    status: 'Recebido',
    createdAt: addDaysIso(-15),
  },
  {
    id: 'inc-6',
    clientId: 'cli-5', // Sarah
    projectId: 'proj-5',
    description: 'Pagamento Integral Sistema Web USA',
    amount: 2300,
    currency: 'USD',
    dueDate: addDaysIso(-5),
    receivedDate: addDaysIso(-5),
    paymentMethod: 'Transferência',
    status: 'Recebido',
    createdAt: addDaysIso(-40),
  },
  {
    id: 'inc-7',
    clientId: 'cli-6', // Nuno Costa
    projectId: 'proj-6',
    description: 'Sinal Tráfego Pago Portugal',
    amount: 750,
    currency: 'EUR',
    dueDate: addDaysIso(-8),
    receivedDate: addDaysIso(-8),
    paymentMethod: 'Cartão',
    status: 'Recebido',
    createdAt: addDaysIso(-8),
  },
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Hospedagem',
    description: 'Renovação Servidor Hostinger',
    amount: 280,
    currency: 'BRL',
    date: addDaysIso(7), // Vence em 7 dias!
    paid: false,
    createdAt: getTodayIso(),
  },
  {
    id: 'exp-2',
    category: 'Ferramentas',
    description: 'Assinatura Claude & Gemini API',
    amount: 220,
    currency: 'BRL',
    date: addDaysIso(-2),
    paid: true,
    createdAt: addDaysIso(-2),
  },
  {
    id: 'exp-3',
    category: 'Domínio',
    description: 'Renovação domínios de clientes (.com.br / .ao)',
    amount: 150,
    currency: 'BRL',
    date: addDaysIso(-10),
    paid: true,
    createdAt: addDaysIso(-10),
  },
  {
    id: 'exp-4',
    category: 'Internet',
    description: 'Fibra Óptica Escritório',
    amount: 130,
    currency: 'BRL',
    date: addDaysIso(12),
    paid: false,
    createdAt: getTodayIso(),
  },
];

export function getStoredClients(): Client[] {
  const item = localStorage.getItem(CLIENTS_KEY);
  if (!item) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
    return DEFAULT_CLIENTS;
  }
  try {
    return JSON.parse(item);
  } catch {
    return DEFAULT_CLIENTS;
  }
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function getStoredProjects(): Project[] {
  const item = localStorage.getItem(PROJECTS_KEY);
  if (!item) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS;
  }
  try {
    return JSON.parse(item);
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getStoredIncomes(): Income[] {
  const item = localStorage.getItem(INCOMES_KEY);
  if (!item) {
    localStorage.setItem(INCOMES_KEY, JSON.stringify(DEFAULT_INCOMES));
    return DEFAULT_INCOMES;
  }
  try {
    return JSON.parse(item);
  } catch {
    return DEFAULT_INCOMES;
  }
}

export function saveIncomes(incomes: Income[]): void {
  localStorage.setItem(INCOMES_KEY, JSON.stringify(incomes));
}

export function getStoredExpenses(): Expense[] {
  const item = localStorage.getItem(EXPENSES_KEY);
  if (!item) {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(DEFAULT_EXPENSES));
    return DEFAULT_EXPENSES;
  }
  try {
    return JSON.parse(item);
  } catch {
    return DEFAULT_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getStoredSettings(): AppSettings {
  const item = localStorage.getItem(SETTINGS_KEY);
  if (!item) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(item) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
  localStorage.setItem(INCOMES_KEY, JSON.stringify(DEFAULT_INCOMES));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(DEFAULT_EXPENSES));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}

export function clearAllData(): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify([]));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  localStorage.setItem(INCOMES_KEY, JSON.stringify([]));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}

export function exportBackupData(): string {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    clients: getStoredClients(),
    projects: getStoredProjects(),
    incomes: getStoredIncomes(),
    expenses: getStoredExpenses(),
    settings: getStoredSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.clients && Array.isArray(parsed.clients)) saveClients(parsed.clients);
    if (parsed.projects && Array.isArray(parsed.projects)) saveProjects(parsed.projects);
    if (parsed.incomes && Array.isArray(parsed.incomes)) saveIncomes(parsed.incomes);
    if (parsed.expenses && Array.isArray(parsed.expenses)) saveExpenses(parsed.expenses);
    if (parsed.settings && typeof parsed.settings === 'object') saveSettings(parsed.settings);
    return true;
  } catch (err) {
    console.error('Failed to import data', err);
    return false;
  }
}

