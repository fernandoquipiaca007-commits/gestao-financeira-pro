-- ========================================================
-- RESTAURAÇÃO DE DADOS DO BACKUP (23/08/2026)
-- Adiciona colunas necessárias se não existirem e restaura
-- todos os dados vinculados ao Owner (fernandoquipiaca007@gmail.com)
-- ========================================================

-- 0. Garantir extensões e colunas adicionais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rating INT DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS partner_id VARCHAR(64);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'percent';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_value NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS partner_id VARCHAR(64);
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false;

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS partner_id VARCHAR(64);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.agenda_events ADD COLUMN IF NOT EXISTS company_id UUID;

-- 1. Executar bloco de restauração
DO $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
BEGIN
  -- Obter ID do Owner
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'fernandoquipiaca007@gmail.com' LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador fernandoquipiaca007@gmail.com não encontrado no auth.users';
  END IF;

  -- Obter ou Criar Empresa
  SELECT company_id INTO v_company_id FROM public.user_profiles WHERE id = v_owner_id LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name, created_by)
    VALUES ('Studio Digital', v_owner_id)
    RETURNING id INTO v_company_id;

    INSERT INTO public.user_profiles (id, company_id, email, name, role, status)
    VALUES (v_owner_id, v_company_id, 'fernandoquipiaca007@gmail.com', 'Fernando', 'owner', 'active')
    ON CONFLICT (id) DO UPDATE SET company_id = v_company_id, role = 'owner';
  END IF;

  RAISE NOTICE 'Restaurando dados para a Empresa: % (Owner: %)', v_company_id, v_owner_id;

  -- ========================================================
  -- 2. RESTAURAR PARCEIROS (Jorge Reis)
  -- ========================================================
  INSERT INTO public.partners (id, company_id, name, whatsapp, email, default_commission_percent, notes, created_at)
  VALUES
    ('part-1785524214631', v_company_id, 'Jorge Reis', '+5548 9960-2082', '', 25.00, 'O Jorge tem muitas alunas que ele passa para me de forma qualificada', '2026-07-31T00:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    whatsapp = EXCLUDED.whatsapp,
    default_commission_percent = EXCLUDED.default_commission_percent,
    notes = EXCLUDED.notes;

  -- ========================================================
  -- 3. RESTAURAR CLIENTES (6 Clientes)
  -- ========================================================
  INSERT INTO public.clients (id, company_id, name, company, whatsapp, email, type, country, currency, notes, created_at)
  VALUES
    ('cli-1785547084206', v_company_id, 'Dra Adv Brennda Fernandes', 'Escritório Brennda Fernandes', '+5561 9205-3947', '', 'Tráfego Pago', 'BR', 'BRL', 'O seu orçamento vai ter', '2026-08-01T00:00:00Z'),
    ('cli-1785505932220', v_company_id, 'Dra.Larisse Frutuoso', 'Escritório Frutuoso', '+55 92 8416-1450', '', 'Desenvolvimento', 'BR', 'BRL', '', '2026-07-31T00:00:00Z'),
    ('cli-1785505793585', v_company_id, 'Raquel Rinaldi', 'Raquel Rinaldi', '+55 21 99487-7080', '', 'Tráfego Pago', 'BR', 'BRL', 'Estamos em pausa', '2026-07-31T00:00:00Z'),
    ('cli-1785505706686', v_company_id, 'Dra. Juliana Rosa Santos Oliveira', 'Juliana  Oliveira', '+55 12 99237-6414', '', 'Tráfego Pago', 'BR', 'BRL', 'Não  tem muito experiência', '2026-07-31T00:00:00Z'),
    ('cli-1785505495540', v_company_id, 'Dra  Diná Neres', 'Escritório  Diná Neres', '+55 86 8120-7124', 'dinaneres.adv@gmail.com', 'Tráfego Pago', 'BR', 'BRL', 'É  uma senhora de idade avançada', '2026-07-31T00:00:00Z'),
    ('cli-1785505210347', v_company_id, 'Dra Mirtes R Silva', 'Escritório R Silva', '+55 92 8505-3815', 'mirtesrsilva@rotadocente.com', 'Tráfego Pago', 'BR', 'BRL', 'Uma Dra bem legal.', '2026-07-31T00:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    company = EXCLUDED.company,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    type = EXCLUDED.type,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    notes = EXCLUDED.notes;

  -- ========================================================
  -- 4. RESTAURAR PROJETOS (6 Projetos)
  -- ========================================================
  INSERT INTO public.projects (id, company_id, name, client_id, category, total_amount, paid_amount, currency, start_date, due_date, next_payment_date, status, notes, rating, partner_id, partner_name, commission_type, commission_value, commission_amount, commission_paid, created_at)
  VALUES
    ('proj-1785796414164', v_company_id, 'Campanha para palestra Rota docente 2', 'cli-1785505210347', 'Tráfego Pago', 600, 0, 'BRL', '2026-08-03', '2026-08-26', '2026-08-10', 'Em andamento', '', 0, NULL, NULL, 'percent', 0, 0, false, '2026-08-03T00:00:00Z'),
    ('proj-1785547228781', v_company_id, 'Captação de leds qualificados', 'cli-1785547084206', 'Website', 800, 0, 'BRL', '2026-08-01', '2026-08-16', '2026-08-22', 'Aguardando cliente', '', 0, NULL, NULL, 'percent', 0, 0, false, '2026-08-01T00:00:00Z'),
    ('proj-1785507274542', v_company_id, 'Campanha para palestra Benéfico do Deficientes', 'cli-1785505706686', 'Tráfego Pago', 1500, 0, 'BRL', '2026-07-31', '2026-08-15', '2026-08-30', 'Em andamento', 'Esse projecto em tenho que ajudar a Dra a aplicar a estratégia', 0, NULL, NULL, 'percent', 0, 0, false, '2026-07-31T00:00:00Z'),
    ('proj-1785506978773', v_company_id, 'Campanha para palestra', 'cli-1785505495540', 'Tráfego Pago', 600, 600, 'BRL', '2026-07-30', '2026-08-12', '2026-07-31', 'Concluído', 'Uma Campanha boa.', 0, 'part-1785524214631', 'Jorge Reis', 'percent', 25, 150, true, '2026-07-31T00:00:00Z'),
    ('proj-1785506871335', v_company_id, 'Campanha para palestra Rota docente 1', 'cli-1785505210347', 'Tráfego Pago', 1200, 1200, 'BRL', '2026-07-01', '2026-08-10', '2026-08-05', 'Concluído', 'Foi um sucesso', 0, NULL, NULL, 'percent', 0, 0, false, '2026-07-31T00:00:00Z'),
    ('proj-1785506543292', v_company_id, 'Captação de leds', 'cli-1785505932220', 'Tráfego Pago', 1500, 1500, 'BRL', '2026-07-26', '2026-08-15', '2026-08-15', 'Concluído', 'Ela é bem ocupada por isso ela de um contacto alternativo:\nLanding Page\ntráfego', 0, 'part-1785524214631', 'Jorge Reis', 'percent', 25, 375, true, '2026-07-31T00:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    client_id = EXCLUDED.client_id,
    category = EXCLUDED.category,
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    currency = EXCLUDED.currency,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    rating = EXCLUDED.rating,
    partner_id = EXCLUDED.partner_id,
    partner_name = EXCLUDED.partner_name,
    commission_type = EXCLUDED.commission_type,
    commission_value = EXCLUDED.commission_value,
    commission_amount = EXCLUDED.commission_amount,
    commission_paid = EXCLUDED.commission_paid;

  -- ========================================================
  -- 5. RESTAURAR RECEITAS (7 Receitas)
  -- ========================================================
  INSERT INTO public.incomes (id, company_id, client_id, project_id, description, amount, currency, due_date, received_date, payment_method, status, notes, commission_amount, commission_paid, created_at)
  VALUES
    ('inc-1787090600871', v_company_id, 'cli-1785505932220', 'proj-1785506543292', 'Parcela do Projeto', 1500, 'BRL', '2026-08-18', '2026-08-18', 'Cartão', 'Recebido', '', 0, false, '2026-08-18T00:00:00Z'),
    ('inc-1786830764463', v_company_id, 'cli-1785505210347', 'proj-1785796414164', 'Parcela do Projeto', 600, 'BRL', '2026-08-13', '2026-08-15', 'Boleto', 'Recebido', '', 0, false, '2026-08-15T00:00:00Z'),
    ('inc-pend-1785796415459', v_company_id, 'cli-1785505210347', 'proj-1785796414164', 'Saldo Restante - Campanha para palestra Rota docente 2', 600, 'BRL', '2026-08-10', NULL, 'PIX', 'Pendente', '', 0, false, '2026-08-03T00:00:00Z'),
    ('inc-1785767809311', v_company_id, 'cli-1785505210347', 'proj-1785506871335', 'Parcela do Projeto', 600, 'BRL', '2026-08-03', '2026-08-03', 'PIX', 'Recebido', '', 0, false, '2026-08-03T00:00:00Z'),
    ('inc-pend-1785547229480', v_company_id, 'cli-1785547084206', 'proj-1785547228781', 'Saldo Restante - Captação de leds qualificados', 800, 'BRL', '2026-08-22', NULL, 'PIX', 'Pendente', '', 0, false, '2026-08-01T00:00:00Z'),
    ('inc-1785506979100', v_company_id, 'cli-1785505495540', 'proj-1785506978773', 'Pagamento Inicial - Campanha para palestra', 600, 'BRL', '2026-07-30', '2026-07-30', 'PIX', 'Recebido', '', 0, false, '2026-07-31T00:00:00Z'),
    ('inc-1785506872166', v_company_id, 'cli-1785505210347', 'proj-1785506871335', 'Pagamento Inicial - Campanha para palestra Rota docente 1', 600, 'BRL', '2026-07-01', '2026-07-01', 'PIX', 'Recebido', '', 0, false, '2026-07-31T00:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    client_id = EXCLUDED.client_id,
    project_id = EXCLUDED.project_id,
    description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    due_date = EXCLUDED.due_date,
    received_date = EXCLUDED.received_date,
    payment_method = EXCLUDED.payment_method,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;

  -- ========================================================
  -- 6. RESTAURAR DESPESAS (5 Despesas)
  -- ========================================================
  INSERT INTO public.expenses (id, company_id, category, description, amount, currency, date, paid, created_at)
  VALUES
    ('exp-1787525801828', v_company_id, 'Retirada Própria', 'Envio para angola', 975, 'BRL', '2026-08-21', true, '2026-08-23T00:00:00Z'),
    ('exp-1787090866425', v_company_id, 'Retirada Própria', 'Envio para Angola', 600, 'BRL', '2026-08-18', true, '2026-08-18T00:00:00Z'),
    ('exp-1786450785407', v_company_id, 'Salário', 'Já está em angola', 900, 'BRL', '2026-08-11', true, '2026-08-11T00:00:00Z'),
    ('exp-1786002003803', v_company_id, 'Salário', 'Necessidades pessoais ( congresso) 50 mil Kwanzas', 300, 'BRL', '2026-08-06', true, '2026-08-06T00:00:00Z'),
    ('exp-1785516280216', v_company_id, 'Outros', 'Congelado na PayPal', 600, 'BRL', '2026-07-31', true, '2026-07-31T00:00:00Z')
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    date = EXCLUDED.date,
    paid = EXCLUDED.paid;

  RAISE NOTICE 'Restauração de dados concluída com sucesso!';
END $$;
