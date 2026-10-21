-- ========================================================
-- JORGE NUMA SÓ TRANSAÇÃO — 21/10/2026
-- A cliente Nayara enviou R$ 2.325 diretamente ao Jorge (19/10). No registo deve aparecer
-- UMA saída de R$ 2.325 para o Jorge, com R$ 1.000 = parte dele do lote de setembro e
-- R$ 1.325 a mais, que ele deve à empresa e se compensa no próximo pagamento.
-- Antes estava em duas linhas (1.000 distribuição + 1.325 adiantamento).
-- O caixa não muda (R$ 4.100). Tudo fica em record_history.
-- ========================================================
BEGIN;

UPDATE public.expenses
SET category = 'Distribuição a sócios',
    amount = 2325,
    advance_amount = 1325,
    partner_name = 'Jorge Reis',
    description = 'Enviado ao Jorge Reis (pago diretamente pela cliente Nayara): R$ 1.000 = parte dele do lote de setembro (40%) + R$ 1.325 a mais, que deve à empresa e será compensado no próximo pagamento'
WHERE id = 'exp-1792536229853';

-- A parte de R$ 1.000 já está dentro da transação acima.
DELETE FROM public.expenses WHERE id = 'dist-2026-09-2' AND amount = 1000;

COMMIT;
