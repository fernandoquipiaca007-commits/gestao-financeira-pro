-- ========================================================
-- FICHA COMPLETA DO CLIENTE E IDIOMA DO UTILIZADOR (trazidos do SaaS)
-- Só acrescenta colunas opcionais; nenhum registo existente é alterado. Idempotente.
-- ========================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(120),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_role VARCHAR(120),
  ADD COLUMN IF NOT EXISTS preferred_channel VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS source VARCHAR(80);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS language VARCHAR(5);
