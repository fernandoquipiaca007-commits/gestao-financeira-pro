-- ========================================================
-- FECHO DE SETEMBRO 2026 — registos reais (aplicado em 2026-10-20)
-- Lote: 4 projetos de setembro (Diná "Novo Mês" 1.000, Euro 1.300, Rebeka 1.500, Julianna 1.800)
-- = R$ 5.600 recebidos; R$ 100 de taxas Stripe/PayPal → R$ 5.500 líquidos (valor do relatório aos sócios).
-- Antes deste lote o caixa estava a zero (projetos de jul/ago: 3.900 recebidos = 3.375 despesas + 525 comissões).
-- Idempotente: ON CONFLICT DO NOTHING.
-- ========================================================
BEGIN;

-- Receita que faltava: Julianna Costa — Funil de palestra
INSERT INTO public.incomes (id, company_id, client_id, project_id, description, amount, currency, due_date, received_date, payment_method, status, notes)
SELECT 'inc-2026-09-julianna', p.company_id, p.client_id, p.id, 'Pagamento - Funil de palestra', 1800, 'BRL', '2026-09-25', '2026-09-25', 'Transferência', 'Recebido',
       'Registado no fecho de setembro: pagamento total do projeto (já constava como pago no projeto).'
FROM public.projects p WHERE p.id = 'proj-1791497236372'
ON CONFLICT (id) DO NOTHING;

-- Reservas (escritas à mão)
INSERT INTO public.cash_reserves (id, company_id, name, amount, currency, date, notes) VALUES
  ('res-2026-09-meta30k', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Meta dos 30 mil', 1000, 'BRL', '2026-09-22', 'Reserva do lote de setembro.'),
  ('res-2026-09-ferramentas', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Ferramentas futuras', 600, 'BRL', '2026-09-22', 'Para assinaturas (Claude, Supabase…). As despesas pagas daqui reduzem a reserva.')
ON CONFLICT (id) DO NOTHING;

-- Custos do lote
INSERT INTO public.expenses (id, company_id, category, description, amount, currency, date, paid) VALUES
  ('exp-2026-09-taxas', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Taxas de pagamento', 'Taxas Stripe/PayPal - lote de setembro', 100, 'BRL', '2026-09-25', true),
  ('exp-2026-09-edicao', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Edição de vídeo', 'Edição - lote de setembro', 800, 'BRL', '2026-09-22', true),
  ('exp-2026-09-ferramentas', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Ferramentas', 'Ferramentas - lote de setembro', 600, 'BRL', '2026-09-22', true)
ON CONFLICT (id) DO NOTHING;

-- Distribuição aos sócios: R$ 2.500 (40% Fernando, 40% Jorge, 20% Valdimiro), enviada a 09/10/2026; Jorge ainda por enviar.
INSERT INTO public.expenses (id, company_id, category, description, amount, currency, date, paid, partner_name) VALUES
  ('dist-2026-09-1', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Distribuição a sócios', 'Fernando Quipiaca (40%) - Lote de setembro', 1000, 'BRL', '2026-10-09', true, 'Fernando Quipiaca'),
  ('dist-2026-09-2', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Distribuição a sócios', 'Jorge Reis (40%) - Lote de setembro', 1000, 'BRL', '2026-10-09', false, 'Jorge Reis'),
  ('dist-2026-09-3', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Distribuição a sócios', 'Valdimiro Grão (20%) - Lote de setembro', 500, 'BRL', '2026-10-09', true, 'Valdimiro Grão')
ON CONFLICT (id) DO NOTHING;

-- Percentagens dos sócios
UPDATE public.app_settings
SET profit_split = '[{"name":"Fernando Quipiaca","percent":40},{"name":"Jorge Reis","percent":40},{"name":"Valdimiro Grão","percent":20}]'::jsonb,
    updated_at = now()
WHERE company_id = 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733';

COMMIT;
