-- ========================================================
-- CONFIGURAÇÕES E CATEGORIAS POR EMPRESA
-- A aplicação grava app_settings com company_id e email_settings, mas essas colunas não
-- existiam: todas as gravações de configurações falhavam e nunca chegavam ao servidor.
-- As políticas antigas deixavam qualquer visitante ler as configurações e qualquer
-- utilizador autenticado alterar configurações e categorias de qualquer empresa.
-- Idempotente. Não altera registos existentes: a linha 'default' fica como está e é
-- copiada para a linha da empresa que a aplicação procura.
-- ========================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS app_settings_company_id_key ON public.app_settings (company_id);

-- A aplicação lê/grava a linha 'settings-<company_id>'. Num sistema de uma só empresa,
-- essa linha nasce com os valores da linha 'default' (nome do negócio, moeda, câmbios).
INSERT INTO public.app_settings (id, company_id, default_currency, user_name, business_name, exchange_rates, updated_at)
SELECT 'settings-' || c.id, c.id, d.default_currency, d.user_name, d.business_name, d.exchange_rates, now()
FROM public.companies c
CROSS JOIN LATERAL (SELECT * FROM public.app_settings WHERE id = 'default') d
WHERE (SELECT count(*) FROM public.companies) = 1
ON CONFLICT DO NOTHING;

-- app_settings: só a própria empresa lê; só quem pode editar configurações grava.
DROP POLICY IF EXISTS "app_settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update" ON public.app_settings;
DROP POLICY IF EXISTS "settings_select" ON public.app_settings;
DROP POLICY IF EXISTS "settings_insert" ON public.app_settings;
DROP POLICY IF EXISTS "settings_update" ON public.app_settings;

CREATE POLICY "settings_select" ON public.app_settings FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());
CREATE POLICY "settings_insert" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('settings.edit')));
CREATE POLICY "settings_update" ON public.app_settings FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('settings.edit')))
  WITH CHECK (company_id = public.get_user_company_id());

-- categories: tudo limitado à própria empresa.
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_owner());
