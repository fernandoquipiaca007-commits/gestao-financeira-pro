-- ========================================================
-- CONVERSAS DO WHATSAPP (SÓ LEITURA)
-- Mensagens recebidas pela API oficial (webhook) e, em modo coexistência, as enviadas
-- pela app do telemóvel (echoes). O sistema nunca envia mensagens: só guarda o que chega.
-- Só o serviço (função whatsapp-webhook) escreve; a equipa da empresa só lê.
-- Idempotente.
-- ========================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id            VARCHAR(128) PRIMARY KEY,            -- id da mensagem na Meta (wamid…)
  company_id    UUID NOT NULL REFERENCES public.companies(id),
  contact_phone VARCHAR(32) NOT NULL,                -- só dígitos, com indicativo
  contact_name  VARCHAR(255),
  direction     VARCHAR(3) NOT NULL CHECK (direction IN ('in', 'out')),
  message_type  VARCHAR(32) NOT NULL DEFAULT 'text',
  body          TEXT,
  sent_at       TIMESTAMPTZ NOT NULL,
  client_id     VARCHAR(64) REFERENCES public.clients(id) ON DELETE SET NULL,
  processed_at  TIMESTAMPTZ,                         -- quando a rotina diária já a analisou
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_contact_idx ON public.whatsapp_messages (company_id, contact_phone, sent_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_messages_unprocessed_idx ON public.whatsapp_messages (company_id, sent_at) WHERE processed_at IS NULL;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_select" ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_owner() OR public.has_permission('clients.view')));
-- Sem políticas de INSERT/UPDATE/DELETE: só a função (service role) escreve.
