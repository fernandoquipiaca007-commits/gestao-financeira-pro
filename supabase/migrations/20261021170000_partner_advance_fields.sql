-- ========================================================
-- ADIANTAMENTOS A SÓCIOS NUMA SÓ TRANSAÇÃO
-- advance_amount: parte de um envio a um sócio que é dívida dele à empresa
--   (ex.: enviados R$ 2.325, dos quais R$ 1.325 a mais → advance_amount = 1325).
-- settled_by_advance: distribuição paga com essa dívida (compensação) — não sai dinheiro do caixa.
-- Só estrutura; idempotente.
-- ========================================================
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settled_by_advance BOOLEAN NOT NULL DEFAULT false;
