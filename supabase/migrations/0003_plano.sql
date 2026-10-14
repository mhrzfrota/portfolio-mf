-- Plano do sistema interno (quadro estilo Trello): um registro por usuário
-- com o quadro inteiro (colunas e cartões) em JSON, no mesmo formato que o
-- app valida (ehQuadro). Mesmo modelo do calendário (0002_calendario.sql):
-- `versao` é a trava contra sobrescrever; o app só grava se a versão que ele
-- leu ainda for a atual, e recarrega quando outro aparelho salvou antes.

create table if not exists public.plano (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null,
  versao integer not null default 1,
  atualizado_em timestamptz not null default now(),
  constraint plano_dados_objeto check (jsonb_typeof(dados) = 'object'),
  constraint plano_dados_tamanho check (pg_column_size(dados) < 2000000)
);

alter table public.plano enable row level security;

-- Cada um lê, cria e altera só o próprio. Sem política de exclusão.
drop policy if exists "plano: dono lê" on public.plano;
create policy "plano: dono lê"
  on public.plano for select
  to authenticated
  using (owner = (select auth.uid()));

drop policy if exists "plano: dono cria" on public.plano;
create policy "plano: dono cria"
  on public.plano for insert
  to authenticated
  with check (owner = (select auth.uid()));

drop policy if exists "plano: dono altera" on public.plano;
create policy "plano: dono altera"
  on public.plano for update
  to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

-- A versão e a data são do banco, não do navegador.
create or replace function public.plano_carimbar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.versao := 1;
  else
    new.owner := old.owner;
    new.versao := old.versao + 1;
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists plano_carimbar on public.plano;
create trigger plano_carimbar
  before insert or update on public.plano
  for each row execute function public.plano_carimbar();

-- Conferência: deve listar a tabela com rowsecurity = true e 3 políticas.
select tablename, rowsecurity,
  (select count(*) from pg_policies where tablename = 'plano') as politicas
from pg_tables
where schemaname = 'public' and tablename = 'plano';
