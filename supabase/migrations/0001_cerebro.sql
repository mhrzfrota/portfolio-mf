-- Cérebro: snapshot do vault (Obsidian) dentro do Supabase do portfólio.
-- O vault continua sendo a fonte da verdade; estas tabelas são a vitrine.
-- Escrita só pelo script `pnpm cerebro:sync` (service role). O app lê.

create table if not exists public.cerebro_notas (
  owner uuid not null references auth.users (id) on delete cascade,
  path text not null,
  pasta text not null,
  titulo text not null,
  tags text[] not null default '{}',
  status text,
  frontmatter jsonb not null default '{}'::jsonb,
  links text[] not null default '{}',
  palavras integer not null default 0,
  chars integer not null default 0,
  tokens integer not null default 0,
  resumo text,
  corpo text,
  modificado timestamptz not null,
  sincronizado_em timestamptz not null default now(),
  primary key (owner, path)
);

create index if not exists cerebro_notas_pasta_idx on public.cerebro_notas (owner, pasta);
create index if not exists cerebro_notas_modificado_idx on public.cerebro_notas (owner, modificado desc);

create table if not exists public.cerebro_sync (
  id bigint generated always as identity primary key,
  owner uuid not null references auth.users (id) on delete cascade,
  executado_em timestamptz not null default now(),
  notas integer not null,
  tokens integer not null,
  duracao_ms integer not null default 0,
  foco jsonb
);

create index if not exists cerebro_sync_owner_idx on public.cerebro_sync (owner, executado_em desc);

alter table public.cerebro_notas enable row level security;
alter table public.cerebro_sync enable row level security;

-- Só o dono lê. Não há política de escrita para `authenticated`: o app não grava,
-- o script grava com a service role, que ignora RLS.
drop policy if exists "cerebro_notas: dono lê" on public.cerebro_notas;
create policy "cerebro_notas: dono lê"
  on public.cerebro_notas for select
  to authenticated
  using (owner = (select auth.uid()));

drop policy if exists "cerebro_sync: dono lê" on public.cerebro_sync;
create policy "cerebro_sync: dono lê"
  on public.cerebro_sync for select
  to authenticated
  using (owner = (select auth.uid()));

-- Conferência: deve listar as duas tabelas com rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename like 'cerebro_%';
