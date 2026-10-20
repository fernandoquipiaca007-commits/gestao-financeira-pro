-- ========================================================
-- ACERTO DE 21/10/2026 — Jorge e PayPal (respostas do Fernando)
--
-- Jorge: a cliente Nayara transferiu os R$ 2.325 do projeto diretamente para o Jorge (19/10).
--   Desses, R$ 1.000 eram a parte dele do lote de setembro (40%) → fica paga.
--   Os restantes R$ 1.325 foram entregues a mais: o Jorge deve-os à empresa e serão
--   descontados nas próximas distribuições → "Adiantamento a sócio" (não é custo).
--   O caixa não muda (saíram 2.325 nos dois casos); o "por enviar ao Jorge" passa a 0.
--
-- PayPal: os R$ 600 de 31/07 continuam congelados na PayPal, não se perderam.
--   Deixam de ser despesa e passam a reserva "Retido na PayPal": é dinheiro da empresa,
--   mas indisponível. O caixa sobe R$ 600 e o reservado também → o livre não muda.
--
-- Todas as alterações ficam em record_history (podem ser repostas).
-- ========================================================
BEGIN;

UPDATE public.expenses
SET paid = true,
    date = '2026-10-19',
    description = 'Jorge Reis (40%) - Lote de setembro (recebido via transferência da cliente Nayara)'
WHERE id = 'dist-2026-09-2';

UPDATE public.expenses
SET amount = 1325,
    category = 'Adiantamento a sócio',
    partner_name = 'Jorge Reis',
    description = 'Jorge Reis - recebeu R$ 2.325 da cliente Nayara; R$ 1.325 a mais, a descontar nas próximas distribuições'
WHERE id = 'exp-1792536229853' AND amount = 2325;

INSERT INTO public.cash_reserves (id, company_id, name, amount, currency, date, notes)
VALUES ('res-2026-07-paypal', 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733', 'Retido na PayPal', 600, 'BRL', '2026-07-31',
        'Dinheiro congelado na PayPal desde 31/07/2026. Quando for libertado, fechar esta reserva.')
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.expenses WHERE id = 'exp-1785516280216' AND description = 'Congelado na PayPal';

COMMIT;
