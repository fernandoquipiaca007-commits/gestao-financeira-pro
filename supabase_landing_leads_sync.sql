-- ========================================================
-- SINCRONIZAÇÃO DE LEADS DA LANDING PAGE COM SISTEMA DE GESTÃO
-- Execute este script no Supabase SQL Editor do projeto:
-- https://supabase.com/dashboard/project/ixwcdkkskhcmwdopexwt/sql
-- ========================================================

-- 1. FUNÇÃO RPC COM SECURITY DEFINER (Bypassa RLS de forma segura para o cadastro público)
CREATE OR REPLACE FUNCTION public.submit_landing_lead(
  p_name TEXT,
  p_company TEXT DEFAULT '',
  p_whatsapp TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_type TEXT DEFAULT 'Tráfego Pago',
  p_country TEXT DEFAULT 'AO',
  p_currency TEXT DEFAULT 'AOA',
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id VARCHAR(64);
  v_notif_id VARCHAR(64);
  v_company_id UUID;
BEGIN
  -- Obter a company_id da empresa ativa
  SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;

  -- Se não existir na tabela companies, buscar do perfil do proprietário
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id FROM public.user_profiles WHERE company_id IS NOT NULL LIMIT 1;
  END IF;

  -- Gerar ID único para o cliente
  v_client_id := 'client_' || replace(uuid_generate_v4()::text, '-', '');

  -- 1. Inserir na tabela de clientes
  INSERT INTO public.clients (
    id,
    company_id,
    name,
    company,
    whatsapp,
    email,
    type,
    country,
    currency,
    notes,
    created_at
  )
  VALUES (
    v_client_id,
    v_company_id,
    TRIM(p_name),
    TRIM(p_company),
    TRIM(p_whatsapp),
    TRIM(p_email),
    p_type,
    p_country,
    p_currency,
    p_notes,
    CURRENT_TIMESTAMP
  );

  -- 2. Inserir notificação para o gestor / admin
  v_notif_id := 'notif_' || replace(uuid_generate_v4()::text, '-', '');
  INSERT INTO public.notifications (
    id,
    company_id,
    type,
    title,
    message,
    date,
    client_id,
    whatsapp_message,
    whatsapp_phone,
    severity,
    read,
    created_at
  )
  VALUES (
    v_notif_id,
    v_company_id,
    'new_lead',
    '🚀 Novo Lead Captado na Landing Page!',
    'Cliente ' || TRIM(p_name) || COALESCE(' (' || NULLIF(TRIM(p_company), '') || ')', '') || ' solicitou serviço: ' || p_type || '. WhatsApp: ' || TRIM(p_whatsapp),
    CURRENT_DATE,
    v_client_id,
    'Olá ' || TRIM(p_name) || ', recebemos sua solicitação na Codeengine!',
    TRIM(p_whatsapp),
    'high',
    false,
    CURRENT_TIMESTAMP
  );

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'company_id', v_company_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Conceder permissão de execução para a chave anon (pública) e authenticated
GRANT EXECUTE ON FUNCTION public.submit_landing_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_landing_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_landing_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 2. POLÍTICAS RLS PARA PERMITIR INSERÇÕES ANÔNIMAS DIRETAS (Fallback)
DROP POLICY IF EXISTS "clients_anon_insert" ON public.clients;
CREATE POLICY "clients_anon_insert" ON public.clients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notif_anon_insert" ON public.notifications;
CREATE POLICY "notif_anon_insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- 3. TRIGGER DE AUTO-ATRIBUIÇÃO DE COMPANY_ID
CREATE OR REPLACE FUNCTION public.set_lead_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT id INTO NEW.company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    IF NEW.company_id IS NULL THEN
      SELECT company_id INTO NEW.company_id FROM public.user_profiles WHERE company_id IS NOT NULL LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_client_company_id ON public.clients;
CREATE TRIGGER trg_set_client_company_id
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_lead_company_id();

DROP TRIGGER IF EXISTS trg_set_notif_company_id ON public.notifications;
CREATE TRIGGER trg_set_notif_company_id
BEFORE INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_lead_company_id();
