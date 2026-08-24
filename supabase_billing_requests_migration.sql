-- ========================================================
-- FASE 2: MÓDULO DE SOLICITAÇÕES DE FATURAMENTO & APROVAÇÕES
-- ========================================================

-- 1. TABELA DE SOLICITAÇÕES DE FATURAMENTO
CREATE TABLE IF NOT EXISTS public.billing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  project_id VARCHAR(64) REFERENCES public.projects(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Solicitada'
    CHECK (status IN ('Solicitada', 'Em análise', 'Aprovada', 'Rejeitada', 'Faturada')),
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  income_id VARCHAR(64) REFERENCES public.incomes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_billing_requests_company ON public.billing_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_requests_requested_by ON public.billing_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_billing_requests_status ON public.billing_requests(status);
CREATE INDEX IF NOT EXISTS idx_billing_requests_project ON public.billing_requests(project_id);

-- 2. HABILITAR RLS
ALTER TABLE public.billing_requests ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA BILLING_REQUESTS
DROP POLICY IF EXISTS "billing_requests_select" ON public.billing_requests;
CREATE POLICY "billing_requests_select" ON public.billing_requests
  FOR SELECT USING (
    company_id = get_user_company_id()
    AND (
      get_user_role() IN ('owner', 'admin')
      OR requested_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "billing_requests_insert" ON public.billing_requests;
CREATE POLICY "billing_requests_insert" ON public.billing_requests
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id()
    AND requested_by = auth.uid()
    AND (
      is_owner()
      OR has_permission('billing.request', 'ALL')
      OR has_permission('billing.create', 'ALL')
    )
  );

DROP POLICY IF EXISTS "billing_requests_update" ON public.billing_requests;
CREATE POLICY "billing_requests_update" ON public.billing_requests
  FOR UPDATE USING (
    company_id = get_user_company_id()
    AND (
      is_owner()
      OR has_permission('billing.approve', 'ALL')
      OR (requested_by = auth.uid() AND status = 'Solicitada')
    )
  );

DROP POLICY IF EXISTS "billing_requests_delete" ON public.billing_requests;
CREATE POLICY "billing_requests_delete" ON public.billing_requests
  FOR DELETE USING (
    company_id = get_user_company_id()
    AND (
      is_owner()
      OR (requested_by = auth.uid() AND status = 'Solicitada')
    )
  );

-- 4. FUNÇÃO DATABASE PARA APROVAÇÃO SEGURA DE FATURAMENTO
CREATE OR REPLACE FUNCTION public.approve_billing_request(
  p_request_id UUID,
  p_income_id VARCHAR(64) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_company_id UUID;
  v_user_role VARCHAR(20);
  v_request RECORD;
  v_project RECORD;
  v_client_id VARCHAR(64);
  v_generated_income_id VARCHAR(64);
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  v_company_id := get_user_company_id();
  v_user_role := get_user_role();

  -- Buscar a solicitação com lock
  SELECT * INTO v_request
  FROM public.billing_requests
  WHERE id = p_request_id AND company_id = v_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação de faturamento não encontrada');
  END IF;

  -- Regra: funcionário não pode aprovar sua própria solicitação
  IF v_user_role NOT IN ('owner', 'admin') AND v_request.requested_by = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode aprovar a sua própria solicitação de faturamento');
  END IF;

  -- Validar permissão se não for owner
  IF v_user_role != 'owner' AND NOT has_permission('billing.approve', 'ALL') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para aprovar faturamento');
  END IF;

  IF v_request.status IN ('Aprovada', 'Faturada') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta solicitação já foi aprovada anteriormente');
  END IF;

  -- Obter dados do projeto vinculado
  IF v_request.project_id IS NOT NULL THEN
    SELECT * INTO v_project FROM public.projects WHERE id = v_request.project_id;
    v_client_id := v_project.client_id;
  END IF;

  -- Se não foi fornecido income_id, gerar nova receita
  v_generated_income_id := p_income_id;
  IF v_generated_income_id IS NULL THEN
    v_generated_income_id := 'inc-bill-' || substr(md5(random()::text), 1, 10);
    
    INSERT INTO public.incomes (
      id, company_id, client_id, project_id, description, amount, currency,
      due_date, status, payment_method, created_by
    ) VALUES (
      v_generated_income_id,
      v_company_id,
      COALESCE(v_client_id, 'cli-default'),
      v_request.project_id,
      'Faturamento: ' || v_request.description,
      v_request.amount,
      v_request.currency,
      CURRENT_DATE,
      'Pendente',
      'Transferência',
      v_user_id
    );
  END IF;

  -- Atualizar status da solicitação
  UPDATE public.billing_requests
  SET
    status = 'Aprovada',
    reviewed_by = v_user_id,
    reviewed_at = NOW(),
    review_notes = p_notes,
    income_id = v_generated_income_id,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log de auditoria
  INSERT INTO public.audit_logs (company_id, user_id, action, resource_type, resource_id, result, changes)
  VALUES (
    v_company_id,
    v_user_id,
    'billing.approve',
    'billing_request',
    p_request_id::text,
    'success',
    jsonb_build_object('amount', v_request.amount, 'currency', v_request.currency, 'income_id', v_generated_income_id)
  );

  RETURN jsonb_build_object('success', true, 'income_id', v_generated_income_id);
END;
$$;
