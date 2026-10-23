-- Projetos vinculados: um projeto novo (ex.: a palestra de um mês) nasce de um projeto anterior.
-- covered_amount é a parte do valor que já foi paga por um pagamento anterior (do projeto de origem):
-- conta como paga no projeto, mas NÃO é uma receita nova e não mexe no caixa.
alter table public.projects
  add column if not exists parent_project_id text references public.projects(id) on delete set null,
  add column if not exists covered_amount numeric(12,2) not null default 0 check (covered_amount >= 0);

create index if not exists projects_parent_idx on public.projects (parent_project_id);
