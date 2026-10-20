-- ========================================================
-- INTEGRIDADE DE DADOS
-- 1. Histórico de alterações: cada INSERT/UPDATE/DELETE nas tabelas de negócio guarda a
--    versão anterior do registo. Nada apagado ou alterado por engano se perde.
-- 2. Receitas e projetos deixam de poder ficar órfãos: apagar um projeto ou cliente que
--    ainda tem histórico financeiro é recusado pela própria base de dados.
-- 3. Colunas que a aplicação já grava passam a existir em todas as instalações.
-- Idempotente: pode ser executada mais de uma vez.
-- ========================================================

-- --------------------------------------------------------
-- 3. Colunas esperadas pela aplicação
-- --------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
  ADD COLUMN IF NOT EXISTS invoice_notes  TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_ids JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS stripe_invoice_id  VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR,
  ADD COLUMN IF NOT EXISTS stripe_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_pdf TEXT,
  ADD COLUMN IF NOT EXISTS stripe_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_status      VARCHAR DEFAULT 'none';

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS receipt_url  TEXT;

-- --------------------------------------------------------
-- 1. Histórico de alterações
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.record_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  company_id  UUID,
  operation   TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_row     JSONB,
  new_row     JSONB,
  changed_by  UUID DEFAULT auth.uid(),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS record_history_record_idx  ON public.record_history (table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS record_history_company_idx ON public.record_history (company_id, changed_at DESC);

ALTER TABLE public.record_history ENABLE ROW LEVEL SECURITY;

-- Só o owner da empresa lê o histórico. Ninguém escreve diretamente: só o trigger.
DROP POLICY IF EXISTS "record_history_select" ON public.record_history;
CREATE POLICY "record_history_select" ON public.record_history FOR SELECT
  USING (company_id = public.get_user_company_id() AND public.is_owner());

CREATE OR REPLACE FUNCTION public.track_record_history()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_row JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_row := v_new;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    IF v_old = v_new THEN RETURN NEW; END IF;
    v_row := v_new;
  ELSE
    v_old := to_jsonb(OLD);
    v_row := v_old;
  END IF;

  INSERT INTO public.record_history (table_name, record_id, company_id, operation, old_row, new_row)
  VALUES (TG_TABLE_NAME, v_row->>'id', NULLIF(v_row->>'company_id', '')::uuid, TG_OP, v_old, v_new);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients', 'projects', 'incomes', 'expenses', 'partners',
    'agenda_events', 'categories', 'tasks', 'billing_requests', 'app_settings'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS track_history ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER track_history AFTER INSERT OR UPDATE OR DELETE ON public.%I '
        'FOR EACH ROW EXECUTE FUNCTION public.track_record_history()', t);
    END IF;
  END LOOP;
END;
$$;

-- Repõe um registo apagado a partir do histórico (só owner, só da própria empresa).
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
  IF h.table_name NOT IN ('clients', 'projects', 'incomes', 'expenses', 'partners', 'agenda_events', 'categories', 'tasks') THEN
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

-- --------------------------------------------------------
-- 2. Sem receitas nem projetos órfãos
--    ON DELETE SET NULL apagava em silêncio o vínculo entre a receita e o contrato/cliente.
--    Passa a RESTRICT: a base de dados recusa apagar um pai que ainda tem histórico.
-- --------------------------------------------------------
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT c.conname, c.conrelid::regclass AS child, a.attname AS col, c.confrelid::regclass AS parent
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND c.confdeltype = 'n'  -- ON DELETE SET NULL
      AND (c.conrelid, a.attname, c.confrelid) IN (
        ('public.incomes'::regclass,  'project_id', 'public.projects'::regclass),
        ('public.incomes'::regclass,  'client_id',  'public.clients'::regclass),
        ('public.projects'::regclass, 'client_id',  'public.clients'::regclass)
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.child, fk.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE RESTRICT',
      fk.child, fk.conname, fk.col, fk.parent);
  END LOOP;
END;
$$;
