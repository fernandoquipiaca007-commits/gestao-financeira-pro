-- ============================================================
-- STRIPE INVOICE INTEGRATION — Alterações ao Schema
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar campos Stripe à tabela incomes
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS stripe_invoice_id        VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_customer_id       VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_invoice_url       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_pdf       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_receipt_url       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status            VARCHAR DEFAULT 'none';

-- Índice para busca rápida por stripe_invoice_id (usado no webhook)
CREATE INDEX IF NOT EXISTS idx_incomes_stripe_invoice_id
  ON public.incomes(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- 2. Adicionar campos de configuração de fatura à tabela projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
  ADD COLUMN IF NOT EXISTS invoice_notes  TEXT;

-- 3. Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'incomes'
  AND column_name LIKE 'stripe_%'
ORDER BY column_name;
