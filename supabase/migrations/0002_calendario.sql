-- Calendário do sistema interno: um registro por usuário com a agenda inteira
-- (calendários e eventos) em JSON, no mesmo formato que o app valida.
-- `versao` é a trava contra sobrescrever: o app só grava se a versão que ele
-- leu ainda for a atual; se outro aparelho salvou antes, ele recarrega.

create table if not exists public.calendario (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null,
  versao integer not null default 1,
  atualizado_em timestamptz not null default now(),
  constraint calendario_dados_objeto check (jsonb_typeof(dados) = 'object'),
  constraint calendario_dados_tamanho check (pg_column_size(dados) < 2000000)
);

alter table public.calendario enable row level security;

-- Cada um lê, cria e altera só o próprio. Sem política de exclusão.
drop policy if exists "calendario: dono lê" on public.calendario;
create policy "calendario: dono lê"
  on public.calendario for select
  to authenticated
  using (owner = (select auth.uid()));

drop policy if exists "calendario: dono cria" on public.calendario;
create policy "calendario: dono cria"
  on public.calendario for insert
  to authenticated
  with check (owner = (select auth.uid()));

drop policy if exists "calendario: dono altera" on public.calendario;
create policy "calendario: dono altera"
  on public.calendario for update
  to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

-- A versão e a data são do banco, não do navegador.
create or replace function public.calendario_carimbar()
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

drop trigger if exists calendario_carimbar on public.calendario;
create trigger calendario_carimbar
  before insert or update on public.calendario
  for each row execute function public.calendario_carimbar();

-- Conferência: deve listar a tabela com rowsecurity = true e 3 políticas.
select tablename, rowsecurity,
  (select count(*) from pg_policies where tablename = 'calendario') as politicas
from pg_tables
where schemaname = 'public' and tablename = 'calendario';
