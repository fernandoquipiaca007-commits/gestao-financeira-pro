-- Produtos e preços: os planos que a CodeEngine vende, com a faixa de preço e o que inclui.
-- Usados para dar preços, gerar a tabela de preços para as doutoras e criar projetos.
CREATE TABLE IF NOT EXISTS public.products (
  id           VARCHAR(64) PRIMARY KEY,
  company_id   UUID NOT NULL REFERENCES public.companies(id),
  name         VARCHAR(255) NOT NULL,
  kind         VARCHAR(20) NOT NULL DEFAULT 'plano' CHECK (kind IN ('plano', 'adicional', 'auxiliar')),
  billing      VARCHAR(20) NOT NULL DEFAULT 'unico' CHECK (billing IN ('unico', 'mensal')),
  price_min    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (price_min >= 0),
  price_max    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (price_max >= 0),
  currency     VARCHAR(10) NOT NULL DEFAULT 'BRL',
  summary      TEXT,
  includes     TEXT[] NOT NULL DEFAULT '{}',
  conditions   TEXT,
  internal_notes TEXT,
  active       BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID DEFAULT auth.uid(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  CHECK (price_max >= price_min)
);

CREATE INDEX IF NOT EXISTS products_company_idx ON public.products (company_id, sort_order);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('projects.edit')));
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('projects.edit')))
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_owner());

DROP TRIGGER IF EXISTS track_history ON public.products;
CREATE TRIGGER track_history AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.track_record_history();

-- Projeto criado a partir de um plano (para saber quanto se fecha em cada plano).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS product_id VARCHAR(64) REFERENCES public.products(id) ON DELETE SET NULL;
