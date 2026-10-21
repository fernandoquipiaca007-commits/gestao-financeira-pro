-- ========================================================
-- ACERTO DO CAIXA — 21/10/2026 (explicação do Fernando)
--
-- Antes da Nayara, o caixa tinha R$ 2.600: 1.000 da Meta dos 30 mil, 1.000 para enviar
-- ao Jorge e 600 para ferramentas. A Nayara pagou R$ 2.325 diretamente ao Jorge:
--   · R$ 1.000 pagaram a parte dele de setembro;
--   · R$ 1.325 ficaram a mais com ele → adiantamento, a compensar nos próximos pagamentos.
-- Os R$ 1.000 que eram para o Jorge ficaram no caixa da empresa → vão para a reserva
-- (Meta dos 30 mil passa a R$ 2.000). Com a Karen (R$ 1.500), o caixa é R$ 4.100:
--   R$ 2.000 reserva + R$ 600 ferramentas futuras + R$ 1.500 livres.
--
-- Correções:
--   1) O adiantamento do Jorge tinha voltado a R$ 2.325 (contava os R$ 1.000 duas vezes) → R$ 1.325.
--   2) PayPal: os R$ 600 congelados não contam no caixa → saída "Valor retido" (não é custo);
--      a reserva "Retido na PayPal" fecha. Quando o dinheiro for libertado, regista-se a entrada.
--   3) Meta dos 30 mil: R$ 1.000 → R$ 2.000.
-- ========================================================
BEGIN;

UPDATE public.expenses
SET amount = 1325,
    description = 'Jorge Reis - recebeu R$ 2.325 da cliente Nayara (R$ 1.000 eram a parte dele); R$ 1.325 a mais, a compensar nos próximos pagamentos'
WHERE id = 'exp-1792536229853';

INSERT INTO public.expenses (id, company_id, category, description, amount, currency, date, paid)
VALUES ('exp-2026-07-paypal-retido', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Valor retido',
        'Congelado na PayPal (não se perdeu; registar a entrada quando for libertado)', 600, 'BRL', '2026-07-31', true)
ON CONFLICT (id) DO NOTHING;

UPDATE public.cash_reserves
SET closed = true, notes = 'Fechada em 21/10/2026: o valor congelado passou a "Valor retido" (fora do caixa).'
WHERE id = 'res-2026-07-paypal';

UPDATE public.cash_reserves
SET amount = 2000, notes = 'Reserva do lote de setembro (R$ 1.000) + R$ 1.000 que eram para o Jorge e ficaram no caixa, porque a cliente Nayara lhe pagou diretamente.'
WHERE id = 'res-2026-09-meta30k';

COMMIT;
