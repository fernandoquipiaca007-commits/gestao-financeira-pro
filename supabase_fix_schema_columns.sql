-- ============================================================
-- ATUALIZAÇÃO DO SCHEMA SUPABASE: PROJETOS E RECEITAS
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/tjtcasgstldhtkgtsmqj/sql
-- ============================================================

-- 1. Adicionar colunas faltantes na tabela public.projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
  ADD COLUMN IF NOT EXISTS invoice_notes  TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_ids JSONB DEFAULT '[]'::jsonb;

-- 2. Adicionar colunas Stripe na tabela public.incomes
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS stripe_invoice_id        VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_customer_id       VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_invoice_url       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_pdf       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_receipt_url       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status            VARCHAR DEFAULT 'none';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_incomes_company_id ON public.incomes(company_id);
CREATE INDEX IF NOT EXISTS idx_incomes_stripe_invoice_id ON public.incomes(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- 4. Confirmação
SELECT 'Colunas e índices atualizados com sucesso!' as status;
