-- ========================================================
-- RLS POLICIES + DATABASE FUNCTIONS — RBAC SECURITY LAYER
-- Sistema de Gestão Financeira Pro
-- ========================================================

-- ========================================================
-- 1. FUNÇÕES HELPER (executam com SECURITY DEFINER para aceder
--    a tabelas de permissões sem expor ao cliente)
-- ========================================================

-- 1.1 Obter company_id do utilizador autenticado
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 1.2 Obter role do utilizador autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 1.3 Verificar se o utilizador é OWNER
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'owner' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- 1.4 Verificar se o utilizador tem uma permissão específica
-- Lógica: OWNER tem tudo; outros verificam user_permissions (override) ou role_default_permissions
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR;
  v_custom_granted BOOLEAN;
  v_has_role_default BOOLEAN;
BEGIN
  -- OWNER tem acesso total
  IF public.is_owner() THEN RETURN TRUE; END IF;

  -- Verificar status da conta
  IF (SELECT status FROM public.user_profiles WHERE id = auth.uid()) != 'active' THEN
    RETURN FALSE;
  END IF;

  v_role := public.get_user_role();

  -- Verificar override customizado do utilizador
  SELECT granted INTO v_custom_granted
  FROM public.user_permissions
  WHERE user_id = auth.uid() AND permission_id = p_permission_id;

  IF FOUND THEN
    RETURN v_custom_granted;
  END IF;

  -- Verificar permissão padrão do cargo
  SELECT EXISTS(
    SELECT 1 FROM public.role_default_permissions
    WHERE role = v_role AND permission_id = p_permission_id
  ) INTO v_has_role_default;

  RETURN v_has_role_default;
END;
$$;

-- 1.5 Verificar scope do utilizador para uma permissão
CREATE OR REPLACE FUNCTION public.get_permission_scope(p_permission_id TEXT)
RETURNS VARCHAR
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR;
  v_scope VARCHAR;
BEGIN
  IF public.is_owner() THEN RETURN 'ALL'; END IF;

  v_role := public.get_user_role();

  -- Verificar override customizado
  SELECT scope INTO v_scope
  FROM public.user_permissions
  WHERE user_id = auth.uid() AND permission_id = p_permission_id AND granted = TRUE;

  IF FOUND THEN RETURN v_scope; END IF;

  -- Verificar default do cargo
  SELECT default_scope INTO v_scope
  FROM public.role_default_permissions
  WHERE role = v_role AND permission_id = p_permission_id;

  IF FOUND THEN RETURN v_scope; END IF;

  RETURN NULL; -- Sem permissão
END;
$$;

-- 1.6 Verificar se o utilizador está ativo na mesma empresa
CREATE OR REPLACE FUNCTION public.is_same_company(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT company_id = p_company_id AND status = 'active'
     FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- ========================================================
-- 2. FUNÇÃO ESPECIAL: ASSUMIR PROJETO (anti-concorrência)
-- ========================================================

CREATE OR REPLACE FUNCTION public.assume_project(p_project_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_company_id UUID;
  v_project_company UUID;
  v_assignment_type VARCHAR;
  v_existing_assignment UUID;
  v_assignment_id UUID;
BEGIN
  -- Verificar permissão
  IF NOT public.has_permission('projects.assume') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para assumir projetos');
  END IF;

  v_company_id := public.get_user_company_id();

  -- Verificar se o projeto existe e pertence à mesma empresa
  SELECT company_id, assignment_type INTO v_project_company, v_assignment_type
  FROM public.projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projeto não encontrado');
  END IF;

  IF v_project_company != v_company_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  IF v_assignment_type != 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projeto não está disponível para assumir');
  END IF;

  -- LOCK para evitar concorrência (SELECT FOR UPDATE)
  SELECT id INTO v_existing_assignment
  FROM public.project_assignments
  WHERE project_id = p_project_id AND status = 'active'
  FOR UPDATE NOWAIT;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projeto já foi assumido por outro utilizador');
  END IF;

  -- Atribuir projeto
  INSERT INTO public.project_assignments (project_id, user_id, assigned_by, assumed_at, status)
  VALUES (p_project_id, v_user_id, v_user_id, NOW(), 'active')
  RETURNING id INTO v_assignment_id;

  -- Actualizar o projeto
  UPDATE public.projects
  SET assignment_type = 'employee', assigned_to = v_user_id
  WHERE id = p_project_id;

  -- Log de auditoria
  INSERT INTO public.audit_logs (company_id, user_id, action, resource_type, resource_id, result)
  VALUES (v_company_id, v_user_id, 'project.assume', 'project', p_project_id, 'success');

  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id);

EXCEPTION WHEN lock_not_available THEN
  RETURN jsonb_build_object('success', false, 'error', 'Projeto já foi assumido por outro utilizador neste momento');
END;
$$;

-- ========================================================
-- 3. REMOVER POLÍTICAS ANTIGAS (abertas) E CRIAR NOVAS
-- ========================================================

-- -------------------- COMPANIES --------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_all" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (id = public.get_user_company_id());
CREATE POLICY "companies_insert" ON public.companies FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "companies_update" ON public.companies FOR UPDATE
  USING (id = public.get_user_company_id() AND public.is_owner());

-- -------------------- USER_PROFILES --------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_all" ON public.user_profiles;

-- SELECT: ver utilizadores da mesma empresa
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.is_owner()
      OR public.has_permission('users.view')
      OR id = auth.uid()
    )
  );

-- INSERT: apenas OWNER pode criar novos perfis
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.is_owner()
  );

-- UPDATE: OWNER pode editar todos; utilizador pode editar o próprio (campos limitados via app)
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND (public.is_owner() OR id = auth.uid())
    AND NOT (id = auth.uid() AND public.get_user_role() != 'owner' AND role = 'owner')
  );

-- DELETE: apenas OWNER (nunca pode deletar a si mesmo)
CREATE POLICY "user_profiles_delete" ON public.user_profiles FOR DELETE
  USING (
    public.is_owner()
    AND id != auth.uid()
    AND company_id = public.get_user_company_id()
  );

-- -------------------- PERMISSIONS (read-only para todos) --------------------
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (TRUE);

-- -------------------- ROLE_DEFAULT_PERMISSIONS --------------------
ALTER TABLE public.role_default_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_defaults_select" ON public.role_default_permissions;
CREATE POLICY "role_defaults_select" ON public.role_default_permissions FOR SELECT USING (TRUE);
CREATE POLICY "role_defaults_modify" ON public.role_default_permissions FOR ALL
  USING (public.is_owner());

-- -------------------- USER_PERMISSIONS --------------------
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_permissions_all" ON public.user_permissions;

CREATE POLICY "user_permissions_select" ON public.user_permissions FOR SELECT
  USING (
    public.is_owner()
    OR user_id = auth.uid()
    OR public.has_permission('users.permissions')
  );

CREATE POLICY "user_permissions_modify" ON public.user_permissions FOR ALL
  USING (
    public.is_owner()
    OR (public.has_permission('users.permissions')
        AND (SELECT role FROM public.user_profiles WHERE id = user_id) != 'owner')
  );

-- -------------------- CLIENTS --------------------
DROP POLICY IF EXISTS "Permitir tudo em clients" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('clients.view')
    AND (
      public.get_permission_scope('clients.view') = 'ALL'
      OR EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.project_assignments pa ON pa.project_id = p.id
        WHERE p.client_id = clients.id
        AND pa.user_id = auth.uid()
        AND pa.status = 'active'
      )
    )
  );

CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('clients.create')
  );

CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('clients.edit')
  );

CREATE POLICY "clients_delete" ON public.clients FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('clients.delete')
  );

-- -------------------- PROJECTS --------------------
DROP POLICY IF EXISTS "Permitir tudo em projects" ON public.projects;

CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.has_permission('projects.view')
      AND (
        public.get_permission_scope('projects.view') = 'ALL'
        OR assignment_type = 'available'
        OR assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_assignments
          WHERE project_id = projects.id AND user_id = auth.uid() AND status = 'active'
        )
      )
    )
  );

CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('projects.create')
  );

CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND (
      public.has_permission('projects.edit')
      AND (
        public.get_permission_scope('projects.edit') = 'ALL'
        OR assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_assignments
          WHERE project_id = projects.id AND user_id = auth.uid() AND status = 'active'
        )
      )
    )
  );

CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('projects.delete')
  );

-- -------------------- PROJECT_ASSIGNMENTS --------------------
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proj_assign_select" ON public.project_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "proj_assign_insert" ON public.project_assignments FOR INSERT
  WITH CHECK (
    public.has_permission('projects.assign')
    OR (public.has_permission('projects.assume') AND user_id = auth.uid())
  );

CREATE POLICY "proj_assign_update" ON public.project_assignments FOR UPDATE
  USING (public.is_owner() OR public.has_permission('projects.assign'));

-- -------------------- TASKS --------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('tasks.view')
    AND (
      public.get_permission_scope('tasks.view') = 'ALL'
      OR status = 'Disponível'
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('tasks.create')
  );

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('tasks.edit')
    AND (
      public.get_permission_scope('tasks.edit') = 'ALL'
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('tasks.delete')
  );

-- -------------------- INCOMES --------------------
DROP POLICY IF EXISTS "Permitir tudo em incomes" ON public.incomes;

CREATE POLICY "incomes_select" ON public.incomes FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.view')
  );

CREATE POLICY "incomes_insert" ON public.incomes FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.create')
  );

CREATE POLICY "incomes_update" ON public.incomes FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.edit')
  );

CREATE POLICY "incomes_delete" ON public.incomes FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.delete')
  );

-- -------------------- EXPENSES --------------------
DROP POLICY IF EXISTS "Permitir tudo em expenses" ON public.expenses;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.view')
  );

CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.create')
  );

CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.edit')
  );

CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('financial.delete')
  );

-- -------------------- CATEGORIES --------------------
DROP POLICY IF EXISTS "Permitir tudo em categories" ON public.categories;

CREATE POLICY "categories_select" ON public.categories FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('categories.view')
  );

CREATE POLICY "categories_insert" ON public.categories FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('categories.create')
  );

CREATE POLICY "categories_update" ON public.categories FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('categories.edit')
  );

CREATE POLICY "categories_delete" ON public.categories FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('categories.create')
  );

-- -------------------- AGENDA_EVENTS --------------------
DROP POLICY IF EXISTS "Permitir tudo em agenda_events" ON public.agenda_events;

CREATE POLICY "agenda_select" ON public.agenda_events FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('calendar.view')
    AND (
      public.get_permission_scope('calendar.view') = 'ALL'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "agenda_insert" ON public.agenda_events FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('calendar.create')
  );

CREATE POLICY "agenda_update" ON public.agenda_events FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('calendar.edit')
    AND (
      public.get_permission_scope('calendar.edit') = 'ALL'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "agenda_delete" ON public.agenda_events FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND (public.is_owner() OR public.has_permission('calendar.edit'))
    AND (
      public.get_user_role() IN ('owner','admin')
      OR created_by = auth.uid()
    )
  );

-- -------------------- NOTIFICATIONS --------------------
DROP POLICY IF EXISTS "Permitir tudo em notifications" ON public.notifications;

CREATE POLICY "notif_select" ON public.notifications FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND (user_id = auth.uid() OR public.get_user_role() IN ('owner','admin'))
  );

CREATE POLICY "notif_insert" ON public.notifications FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "notif_update" ON public.notifications FOR UPDATE
  USING (company_id = public.get_user_company_id());

CREATE POLICY "notif_delete" ON public.notifications FOR DELETE
  USING (company_id = public.get_user_company_id() AND public.is_owner());

-- -------------------- APP_SETTINGS --------------------
DROP POLICY IF EXISTS "Permitir tudo em app_settings" ON public.app_settings;

CREATE POLICY "settings_select" ON public.app_settings FOR SELECT
  USING (TRUE); -- settings são públicas para autenticados

CREATE POLICY "settings_update" ON public.app_settings FOR UPDATE
  USING (public.has_permission('settings.edit'));

CREATE POLICY "settings_insert" ON public.app_settings FOR INSERT
  WITH CHECK (public.is_owner());

-- -------------------- PARTNERS --------------------
DROP POLICY IF EXISTS "Permitir tudo em partners" ON public.partners;

CREATE POLICY "partners_select" ON public.partners FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('partners.view')
  );

CREATE POLICY "partners_insert" ON public.partners FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.has_permission('partners.create')
  );

CREATE POLICY "partners_update" ON public.partners FOR UPDATE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('partners.edit')
  );

CREATE POLICY "partners_delete" ON public.partners FOR DELETE
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('partners.delete')
  );

-- -------------------- AUDIT_LOGS --------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('audit.view')
  );

CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

-- ========================================================
-- FIM DAS RLS POLICIES
-- ========================================================
