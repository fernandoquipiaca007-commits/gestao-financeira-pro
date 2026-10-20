-- ========================================================
-- RESERVAS DE CAIXA E DIVISÃO ENTRE SÓCIOS
-- Reserva: dinheiro que continua em caixa mas já tem destino (ex.: "Meta dos 30 mil",
-- "Ferramentas"). O valor é escrito à mão. Uma despesa pode sair de uma reserva
-- (expenses.reserve_id), e o que sobra da reserva é o valor reservado menos essas despesas.
-- Divisão entre sócios: percentagens guardadas nas definições (app_settings.profit_split).
-- Só estrutura; nenhum registo existente é alterado. Idempotente.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.cash_reserves (
  id          VARCHAR(64) PRIMARY KEY,
  company_id  UUID NOT NULL REFERENCES public.companies(id),
  name        VARCHAR(255) NOT NULL,
  amount      NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency    VARCHAR(10) NOT NULL DEFAULT 'BRL',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  closed      BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_reserves_company_idx ON public.cash_reserves (company_id);

ALTER TABLE public.cash_reserves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_reserves_select" ON public.cash_reserves;
DROP POLICY IF EXISTS "cash_reserves_insert" ON public.cash_reserves;
DROP POLICY IF EXISTS "cash_reserves_update" ON public.cash_reserves;
DROP POLICY IF EXISTS "cash_reserves_delete" ON public.cash_reserves;

CREATE POLICY "cash_reserves_select" ON public.cash_reserves FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());
CREATE POLICY "cash_reserves_insert" ON public.cash_reserves FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('financial.edit')));
CREATE POLICY "cash_reserves_update" ON public.cash_reserves FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('financial.edit')))
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "cash_reserves_delete" ON public.cash_reserves FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_owner());

-- Uma reserva com despesas ligadas não pode ser apagada (fecha-se em vez disso).
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS reserve_id VARCHAR(64) REFERENCES public.cash_reserves(id) ON DELETE RESTRICT;

-- [{ "name": "Fernando Quipiaca", "percent": 40 }, ...]
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS profit_split JSONB DEFAULT '[]'::jsonb;

-- Histórico de alterações também nas reservas.
DROP TRIGGER IF EXISTS track_history ON public.cash_reserves;
CREATE TRIGGER track_history AFTER INSERT OR UPDATE OR DELETE ON public.cash_reserves
  FOR EACH ROW EXECUTE FUNCTION public.track_record_history();

-- Reservas apagadas também podem ser repostas.
CREATE OR REPLACE FUNCTION public.restore_deleted_record(p_history_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h public.record_history%ROWTYPE;
  v_inserted INT;
BEGIN
  IF NOT public.is_owner() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Só o owner pode repor registos.');
  END IF;

  SELECT * INTO h FROM public.record_history WHERE id = p_history_id;
  IF NOT FOUND OR h.company_id IS DISTINCT FROM public.get_user_company_id() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registo de histórico não encontrado.');
  END IF;
  IF h.operation <> 'DELETE' OR h.old_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Só registos apagados podem ser repostos.');
  END IF;
  IF h.table_name NOT IN ('clients', 'projects', 'incomes', 'expenses', 'partners', 'agenda_events', 'categories', 'tasks', 'cash_reserves') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta tabela não pode ser reposta.');
  END IF;

  EXECUTE format(
    'INSERT INTO public.%1$I SELECT * FROM jsonb_populate_record(NULL::public.%1$I, $1) ON CONFLICT (id) DO NOTHING',
    h.table_name
  ) USING h.old_row;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já existe um registo com este ID.');
  END IF;
  RETURN jsonb_build_object('success', true, 'table', h.table_name, 'id', h.record_id);
END;
$$;

REVOKE ALL ON FUNCTION public.restore_deleted_record(BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_deleted_record(BIGINT) TO authenticated;
