-- ========================================================
-- RBAC MIGRATION — HIERARQUIA DE ACESSOS, CARGOS E PERMISSÕES
-- Sistema de Gestão Financeira Pro
-- Owner: fernandoquipiaca007@gmail.com
-- ========================================================

-- Enable UUID extension (already exists, just ensure)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. NOVAS TABELAS DO SISTEMA RBAC
-- ========================================================

-- 1.1 EMPRESAS
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL DEFAULT 'Minha Empresa',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 PERFIS DE UTILIZADOR (estende auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Utilizador',
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  avatar_url TEXT,
  temp_password VARCHAR(255),
  must_change_password BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 CATÁLOGO DE PERMISSÕES
CREATE TABLE IF NOT EXISTS public.permissions (
  id VARCHAR(64) PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  scope_options TEXT[] DEFAULT ARRAY['ALL','ASSIGNED','OWN']
);

-- 1.4 PERMISSÕES PADRÃO POR CARGO
CREATE TABLE IF NOT EXISTS public.role_default_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(20) NOT NULL,
  permission_id VARCHAR(64) REFERENCES public.permissions(id) ON DELETE CASCADE,
  default_scope VARCHAR(20) DEFAULT 'ALL',
  UNIQUE(role, permission_id)
);

-- 1.5 PERMISSÕES CUSTOMIZADAS POR UTILIZADOR
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission_id VARCHAR(64) REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope VARCHAR(20) DEFAULT 'ALL',
  granted BOOLEAN DEFAULT TRUE,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- 1.6 ATRIBUIÇÃO DE PROJETOS
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id VARCHAR(64) REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.user_profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assumed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'released')),
  UNIQUE(project_id, user_id)
);

-- 1.7 TAREFAS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id VARCHAR(64) REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Disponível'
    CHECK (status IN ('Disponível','Aguardando','Em andamento','Em revisão','Concluída','Cancelada')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 LOG DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(128),
  changes JSONB,
  result VARCHAR(20) DEFAULT 'success' CHECK (result IN ('success','error','denied')),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 2. MIGRAÇÃO DAS TABELAS EXISTENTES
-- ========================================================

-- 2.1 Adicionar company_id e created_by às tabelas existentes
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'company'
    CHECK (assignment_type IN ('company','employee','available')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.user_profiles(id);

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

ALTER TABLE public.agenda_events
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- ========================================================
-- 3. INSERIR CATÁLOGO DE PERMISSÕES
-- ========================================================

INSERT INTO public.permissions (id, resource, action, description, scope_options) VALUES
  -- Dashboard
  ('dashboard.view',       'dashboard', 'view',        'Ver dashboard e métricas gerais', ARRAY['ALL','OWN']),
  ('dashboard.financial',  'dashboard', 'financial',   'Ver dados financeiros no dashboard', ARRAY['ALL']),
  -- Utilizadores
  ('users.view',           'users',     'view',        'Ver lista de utilizadores', ARRAY['ALL']),
  ('users.create',         'users',     'create',      'Criar novos utilizadores', ARRAY['ALL']),
  ('users.edit',           'users',     'edit',        'Editar utilizadores', ARRAY['ALL']),
  ('users.delete',         'users',     'delete',      'Eliminar utilizadores', ARRAY['ALL']),
  ('users.permissions',    'users',     'permissions', 'Gerir permissões de utilizadores', ARRAY['ALL']),
  ('users.suspend',        'users',     'suspend',     'Suspender/reativar utilizadores', ARRAY['ALL']),
  -- Clientes
  ('clients.view',         'clients',   'view',        'Ver clientes', ARRAY['ALL','ASSIGNED','OWN']),
  ('clients.create',       'clients',   'create',      'Criar clientes', ARRAY['ALL']),
  ('clients.edit',         'clients',   'edit',        'Editar clientes', ARRAY['ALL','ASSIGNED','OWN']),
  ('clients.delete',       'clients',   'delete',      'Eliminar clientes', ARRAY['ALL']),
  -- Projetos
  ('projects.view',        'projects',  'view',        'Ver projetos', ARRAY['ALL','ASSIGNED','OWN']),
  ('projects.create',      'projects',  'create',      'Criar projetos', ARRAY['ALL']),
  ('projects.edit',        'projects',  'edit',        'Editar projetos', ARRAY['ALL','ASSIGNED','OWN']),
  ('projects.delete',      'projects',  'delete',      'Eliminar projetos', ARRAY['ALL']),
  ('projects.assign',      'projects',  'assign',      'Atribuir projetos a funcionários', ARRAY['ALL']),
  ('projects.assume',      'projects',  'assume',      'Assumir projetos disponíveis', ARRAY['ALL']),
  -- Tarefas
  ('tasks.view',           'tasks',     'view',        'Ver tarefas', ARRAY['ALL','ASSIGNED','OWN']),
  ('tasks.create',         'tasks',     'create',      'Criar tarefas', ARRAY['ALL']),
  ('tasks.edit',           'tasks',     'edit',        'Editar tarefas', ARRAY['ALL','ASSIGNED','OWN']),
  ('tasks.delete',         'tasks',     'delete',      'Eliminar tarefas', ARRAY['ALL']),
  ('tasks.assign',         'tasks',     'assign',      'Atribuir tarefas', ARRAY['ALL']),
  ('tasks.complete',       'tasks',     'complete',    'Concluir tarefas', ARRAY['ALL','ASSIGNED']),
  -- Financeiro
  ('financial.view',       'financial', 'view',        'Ver receitas e despesas', ARRAY['ALL']),
  ('financial.create',     'financial', 'create',      'Criar lançamentos financeiros', ARRAY['ALL']),
  ('financial.edit',       'financial', 'edit',        'Editar lançamentos financeiros', ARRAY['ALL']),
  ('financial.delete',     'financial', 'delete',      'Eliminar lançamentos financeiros', ARRAY['ALL']),
  -- Parceiros
  ('partners.view',        'partners',  'view',        'Ver parceiros', ARRAY['ALL']),
  ('partners.create',      'partners',  'create',      'Criar parceiros', ARRAY['ALL']),
  ('partners.edit',        'partners',  'edit',        'Editar parceiros', ARRAY['ALL']),
  ('partners.delete',      'partners',  'delete',      'Eliminar parceiros', ARRAY['ALL']),
  -- Agenda
  ('calendar.view',        'calendar',  'view',        'Ver agenda', ARRAY['ALL','ASSIGNED','OWN']),
  ('calendar.create',      'calendar',  'create',      'Criar eventos na agenda', ARRAY['ALL']),
  ('calendar.edit',        'calendar',  'edit',        'Editar eventos na agenda', ARRAY['ALL','OWN']),
  -- Categorias
  ('categories.view',      'categories','view',        'Ver categorias', ARRAY['ALL']),
  ('categories.create',    'categories','create',      'Criar categorias', ARRAY['ALL']),
  ('categories.edit',      'categories','edit',        'Editar categorias', ARRAY['ALL']),
  -- Relatórios
  ('reports.view',         'reports',   'view',        'Ver relatórios gerenciais', ARRAY['ALL']),
  -- Configurações
  ('settings.view',        'settings',  'view',        'Ver configurações', ARRAY['ALL','OWN']),
  ('settings.edit',        'settings',  'edit',        'Editar configurações da empresa', ARRAY['ALL']),
  -- Auditoria
  ('audit.view',           'audit',     'view',        'Ver logs de auditoria', ARRAY['ALL'])
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 4. PERMISSÕES PADRÃO POR CARGO
-- ========================================================

-- OWNER: tem TUDO (gerido via código, não via tabela)
-- Registamos apenas como referência — is_owner() bypassa tudo

-- ADMIN defaults
INSERT INTO public.role_default_permissions (role, permission_id, default_scope) VALUES
  ('admin', 'dashboard.view',      'ALL'),
  ('admin', 'dashboard.financial', 'ALL'),
  ('admin', 'users.view',          'ALL'),
  ('admin', 'clients.view',        'ALL'),
  ('admin', 'clients.create',      'ALL'),
  ('admin', 'clients.edit',        'ALL'),
  ('admin', 'clients.delete',      'ALL'),
  ('admin', 'projects.view',       'ALL'),
  ('admin', 'projects.create',     'ALL'),
  ('admin', 'projects.edit',       'ALL'),
  ('admin', 'projects.delete',     'ALL'),
  ('admin', 'projects.assign',     'ALL'),
  ('admin', 'tasks.view',          'ALL'),
  ('admin', 'tasks.create',        'ALL'),
  ('admin', 'tasks.edit',          'ALL'),
  ('admin', 'tasks.delete',        'ALL'),
  ('admin', 'tasks.assign',        'ALL'),
  ('admin', 'tasks.complete',      'ALL'),
  ('admin', 'financial.view',      'ALL'),
  ('admin', 'financial.create',    'ALL'),
  ('admin', 'financial.edit',      'ALL'),
  ('admin', 'financial.delete',    'ALL'),
  ('admin', 'partners.view',       'ALL'),
  ('admin', 'partners.create',     'ALL'),
  ('admin', 'partners.edit',       'ALL'),
  ('admin', 'partners.delete',     'ALL'),
  ('admin', 'calendar.view',       'ALL'),
  ('admin', 'calendar.create',     'ALL'),
  ('admin', 'calendar.edit',       'ALL'),
  ('admin', 'categories.view',     'ALL'),
  ('admin', 'categories.create',   'ALL'),
  ('admin', 'categories.edit',     'ALL'),
  ('admin', 'reports.view',        'ALL'),
  ('admin', 'settings.view',       'ALL')
ON CONFLICT (role, permission_id) DO NOTHING;

-- EMPLOYEE defaults
INSERT INTO public.role_default_permissions (role, permission_id, default_scope) VALUES
  ('employee', 'dashboard.view',   'OWN'),
  ('employee', 'clients.view',     'ASSIGNED'),
  ('employee', 'clients.create',   'ALL'),
  ('employee', 'clients.edit',     'OWN'),
  ('employee', 'projects.view',    'ASSIGNED'),
  ('employee', 'projects.edit',    'ASSIGNED'),
  ('employee', 'projects.assume',  'ALL'),
  ('employee', 'tasks.view',       'ASSIGNED'),
  ('employee', 'tasks.edit',       'ASSIGNED'),
  ('employee', 'tasks.complete',   'ASSIGNED'),
  ('employee', 'calendar.view',    'ASSIGNED'),
  ('employee', 'calendar.create',  'ALL'),
  ('employee', 'calendar.edit',    'OWN'),
  ('employee', 'categories.view',  'ALL'),
  ('employee', 'settings.view',    'OWN')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ========================================================
-- 5. MIGRAÇÃO DE DADOS EXISTENTES → EMPRESA DO OWNER
-- ========================================================
-- NOTA: Execute este bloco após criar o utilizador owner no Supabase Auth
-- e depois de o utilizador ter feito o primeiro login para criar o user_profile.
-- Ou execute manualmente substituindo <OWNER_AUTH_USER_ID> e <COMPANY_ID>.

-- Este script é IDEMPOTENTE (pode ser reexecutado com segurança).

DO $$
DECLARE
  v_owner_email TEXT := 'fernandoquipiaca007@gmail.com';
  v_owner_id UUID;
  v_company_id UUID;
BEGIN
  -- Obter ID do owner
  SELECT id INTO v_owner_id FROM auth.users WHERE email = v_owner_email LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE NOTICE 'Owner com email % não encontrado em auth.users. Migração de dados adiada.', v_owner_email;
    RETURN;
  END IF;

  -- Obter ou criar empresa do owner
  SELECT id INTO v_company_id FROM public.companies WHERE created_by = v_owner_id LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name, created_by)
    VALUES ('Studio Digital', v_owner_id)
    RETURNING id INTO v_company_id;
  END IF;

  -- Criar user_profile do owner se não existir
  INSERT INTO public.user_profiles (id, company_id, email, name, role, status)
  VALUES (v_owner_id, v_company_id, v_owner_email, 'Fernando', 'owner', 'active')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = 'owner',
    status = 'active';

  -- Migrar dados existentes → company_id do owner
  UPDATE public.clients
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.projects
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.incomes
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.expenses
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.categories
    SET company_id = v_company_id
    WHERE company_id IS NULL;

  UPDATE public.agenda_events
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.partners
    SET company_id = v_company_id, created_by = v_owner_id
    WHERE company_id IS NULL;

  UPDATE public.notifications
    SET company_id = v_company_id, user_id = v_owner_id
    WHERE company_id IS NULL;

  RAISE NOTICE 'Migração concluída: company_id=%, owner_id=%', v_company_id, v_owner_id;
END $$;

-- ========================================================
-- FIM DA MIGRAÇÃO
-- ========================================================
