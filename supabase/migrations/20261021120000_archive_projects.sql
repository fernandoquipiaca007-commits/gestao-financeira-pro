-- ========================================================
-- ARQUIVAR PROJETOS
-- Um projeto arquivado continua guardado (com receitas e histórico), mas sai do valor a
-- receber, dos projetos ativos e dos alertas. Ex.: clientes que ficaram "Aguardando
-- cliente" e não se sabe se voltam. Só estrutura; idempotente.
-- ========================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
