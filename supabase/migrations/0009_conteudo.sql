-- Estúdio de Conteúdo do sistema interno: um registro por usuário
-- com o estúdio inteiro (peças, notas e temáticas) em JSON, no mesmo formato que o
-- app valida (ehEstudio). Mesmo modelo do calendário (0002_calendario.sql):
-- `versao` é a trava contra sobrescrever; o app só grava se a versão que ele
-- leu ainda for a atual, e recarrega quando outro aparelho salvou antes.

create table if not exists public.conteudo (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null,
  versao integer not null default 1,
  atualizado_em timestamptz not null default now(),
  constraint conteudo_dados_objeto check (jsonb_typeof(dados) = 'object'),
  constraint conteudo_dados_tamanho check (pg_column_size(dados) < 2000000)
);

alter table public.conteudo enable row level security;

-- Cada um lê, cria e altera só o próprio. Sem política de exclusão.
drop policy if exists "conteudo: dono lê" on public.conteudo;
create policy "conteudo: dono lê"
  on public.conteudo for select
  to authenticated
  using (owner = (select auth.uid()));

drop policy if exists "conteudo: dono cria" on public.conteudo;
create policy "conteudo: dono cria"
  on public.conteudo for insert
  to authenticated
  with check (owner = (select auth.uid()));

drop policy if exists "conteudo: dono altera" on public.conteudo;
create policy "conteudo: dono altera"
  on public.conteudo for update
  to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

-- A versão e a data são do banco, não do navegador.
create or replace function public.conteudo_carimbar()
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

drop trigger if exists conteudo_carimbar on public.conteudo;
create trigger conteudo_carimbar
  before insert or update on public.conteudo
  for each row execute function public.conteudo_carimbar();

-- Conferência: deve listar a tabela com rowsecurity = true e 3 políticas.
select tablename, rowsecurity,
  (select count(*) from pg_policies where tablename = 'conteudo') as politicas
from pg_tables
where schemaname = 'public' and tablename = 'conteudo';
