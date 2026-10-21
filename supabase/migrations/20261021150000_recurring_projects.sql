-- ========================================================
-- PROJETOS RECORRENTES
-- billing_type: 'unico' (feito de uma vez) | 'mensal' | 'trimestral' | 'anual'.
-- Nos recorrentes, cada período gera uma cobrança (receita pendente) com o valor
-- recurring_amount, na data de início + N períodos, até recurring_end (se houver).
-- Só estrutura; os projetos existentes ficam 'unico'. Idempotente.
-- ========================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) NOT NULL DEFAULT 'unico',
  ADD COLUMN IF NOT EXISTS recurring_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS recurring_end DATE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_billing_type_check') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_billing_type_check
      CHECK (billing_type IN ('unico', 'mensal', 'trimestral', 'anual'));
  END IF;
END;
$$;
