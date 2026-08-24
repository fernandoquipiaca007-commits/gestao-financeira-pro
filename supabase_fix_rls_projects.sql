-- ============================================================
-- FASE 1: CORRIGIR RLS DOS PROJECTS
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Simplificar a política de SELECT para não depender de
--    colunas opcionais (assignment_type, assigned_to, project_assignments)
--    O owner já recebe TRUE de has_permission(), então isso é suficiente.

DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (
    company_id = public.get_user_company_id()
    AND public.has_permission('projects.view')
  );

-- 2. Verificar se as colunas opcionais existem e adicioná-las se não existirem
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Garantir que todos os projetos existentes têm assignment_type definido
UPDATE public.projects
SET assignment_type = 'available'
WHERE assignment_type IS NULL;

-- 4. Verificar resultado
SELECT
  id,
  name,
  status,
  company_id,
  assignment_type,
  assigned_to
FROM public.projects
LIMIT 10;
