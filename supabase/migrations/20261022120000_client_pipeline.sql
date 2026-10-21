-- Acompanhamento comercial de cada cliente (CRM leve): em que fase está, quando voltar a falar
-- com ela, o que fazer a seguir e um resumo das conversas. Todos opcionais.
alter table public.clients
  add column if not exists pipeline_stage text,
  add column if not exists is_favorite boolean not null default false,
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists contract_type text,
  add column if not exists next_contact_date date,
  add column if not exists next_action text,
  add column if not exists last_contact_at date,
  add column if not exists summary text;

alter table public.clients drop constraint if exists clients_pipeline_stage_check;
alter table public.clients add constraint clients_pipeline_stage_check check (
  pipeline_stage is null or pipeline_stage in
  ('lead', 'negociacao', 'quase_fechar', 'contrato_fechado', 'em_execucao', 'recorrente', 'pausado', 'inativo', 'perdido')
);

create index if not exists clients_next_contact_idx on public.clients (company_id, next_contact_date);
