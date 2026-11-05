-- O dinheiro real é o que fica na Stripe, em euros. Cada entrada guarda o faturado (moeda do contrato)
-- e o que chegou de facto: bruto, câmbio da Stripe, cada taxa e o líquido (fixo).
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS settled_currency VARCHAR(10),
  ADD COLUMN IF NOT EXISTS settled_gross NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS settled_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS settled_rate NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS settled_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS settled_date DATE,
  ADD COLUMN IF NOT EXISTS stripe_ref VARCHAR(64);

-- Fecho de caixa: saldo confirmado numa data. O caixa passa a ser este saldo + o que entra e sai depois.
CREATE TABLE IF NOT EXISTS public.cash_checkpoints (
  id          VARCHAR(64) PRIMARY KEY,
  company_id  UUID NOT NULL REFERENCES public.companies(id),
  date        DATE NOT NULL,
  currency    VARCHAR(10) NOT NULL DEFAULT 'EUR',
  amount      NUMERIC(15,2) NOT NULL,
  notes       TEXT,
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cash_checkpoints_company_idx ON public.cash_checkpoints (company_id, date);
ALTER TABLE public.cash_checkpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cash_checkpoints_select" ON public.cash_checkpoints;
DROP POLICY IF EXISTS "cash_checkpoints_write" ON public.cash_checkpoints;
CREATE POLICY "cash_checkpoints_select" ON public.cash_checkpoints FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());
CREATE POLICY "cash_checkpoints_write" ON public.cash_checkpoints FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_owner())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_owner());
DROP TRIGGER IF EXISTS track_history ON public.cash_checkpoints;
CREATE TRIGGER track_history AFTER INSERT OR UPDATE OR DELETE ON public.cash_checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.track_record_history();
