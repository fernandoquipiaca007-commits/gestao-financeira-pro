-- ========================================================
-- SISTEMA DE GESTÃO FINANCEIRA, PROJETOS E AGENDA MULTI-MOEDA
-- SCHEMA PARA SUPABASE POSTGRESQL (COM POLÍTICAS DE ACESSO RLS)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  type VARCHAR(50) DEFAULT 'Outro',
  country VARCHAR(10) DEFAULT 'BR',
  currency VARCHAR(10) DEFAULT 'BRL',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS public.projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_id VARCHAR(64) REFERENCES public.clients(id) ON DELETE SET NULL,
  category VARCHAR(50) DEFAULT 'Outro',
  total_amount NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'BRL',
  start_date DATE,
  due_date DATE,
  next_payment_date DATE,
  status VARCHAR(50) DEFAULT 'Em andamento',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE RECEITAS (INCOMES)
CREATE TABLE IF NOT EXISTS public.incomes (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id VARCHAR(64) REFERENCES public.projects(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'BRL',
  due_date DATE NOT NULL,
  received_date DATE,
  payment_method VARCHAR(50) DEFAULT 'PIX',
  status VARCHAR(20) DEFAULT 'Pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE DESPESAS (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(50) NOT NULL DEFAULT 'Outros',
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'BRL',
  date DATE NOT NULL,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'project')),
  color VARCHAR(20) DEFAULT '#10B981',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE AGENDA / EVENTOS
CREATE TABLE IF NOT EXISTS public.agenda_events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('cobranca', 'pagamento', 'entrega', 'compromisso', 'alarme')),
  date DATE NOT NULL,
  time VARCHAR(10),
  client_id VARCHAR(64) REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id VARCHAR(64) REFERENCES public.projects(id) ON DELETE SET NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  notify_push BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  date DATE NOT NULL,
  client_id VARCHAR(64),
  project_id VARCHAR(64),
  income_id VARCHAR(64),
  expense_id VARCHAR(64),
  whatsapp_message TEXT,
  whatsapp_phone VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA DE CONFIGURAÇÕES E TAXAS DE CÂMBIO
CREATE TABLE IF NOT EXISTS public.app_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  default_currency VARCHAR(10) DEFAULT 'BRL',
  user_name VARCHAR(255) DEFAULT 'Gestor',
  business_name VARCHAR(255) DEFAULT 'Studio Digital',
  exchange_rates JSONB DEFAULT '{"BRL": 1, "AOA": 165, "USD": 0.18, "EUR": 0.16}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INSERIR CONFIGURAÇÃO INICIAL
INSERT INTO public.app_settings (id, default_currency, user_name, business_name)
VALUES ('default', 'BRL', 'Gestor', 'Studio Digital')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- POLÍTICAS DE SEGURANÇA (RLS POLICIES FOR FULL CRUD ACCESS)
-- ========================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em clients" ON public.clients;
CREATE POLICY "Permitir tudo em clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em projects" ON public.projects;
CREATE POLICY "Permitir tudo em projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em incomes" ON public.incomes;
CREATE POLICY "Permitir tudo em incomes" ON public.incomes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em expenses" ON public.expenses;
CREATE POLICY "Permitir tudo em expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em categories" ON public.categories;
CREATE POLICY "Permitir tudo em categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em agenda_events" ON public.agenda_events;
CREATE POLICY "Permitir tudo em agenda_events" ON public.agenda_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em notifications" ON public.notifications;
CREATE POLICY "Permitir tudo em notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo em app_settings" ON public.app_settings;
CREATE POLICY "Permitir tudo em app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
