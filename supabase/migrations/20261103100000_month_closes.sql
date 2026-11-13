-- Relatório de fecho de cada mês (o que entrou, deduções, divisão por sócio, retiradas e caixa final).
CREATE TABLE IF NOT EXISTS public.month_closes (
  id          VARCHAR(64) PRIMARY KEY,
  company_id  UUID NOT NULL REFERENCES public.companies(id),
  month       VARCHAR(7) NOT NULL,
  currency    VARCHAR(10) NOT NULL DEFAULT 'EUR',
  data        JSONB NOT NULL,
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, month)
);
ALTER TABLE public.month_closes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "month_closes_select" ON public.month_closes;
DROP POLICY IF EXISTS "month_closes_write" ON public.month_closes;
CREATE POLICY "month_closes_select" ON public.month_closes FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('reports.view')));
CREATE POLICY "month_closes_write" ON public.month_closes FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_owner())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_owner());
DROP TRIGGER IF EXISTS track_history ON public.month_closes;
CREATE TRIGGER track_history AFTER INSERT OR UPDATE OR DELETE ON public.month_closes
  FOR EACH ROW EXECUTE FUNCTION public.track_record_history();
