-- Relatório da noite: um relatório por dia, gerado no Mac pela rotina
-- `pnpm noite` (Codex + Claude) e lido pela aba Noite do sistema interno.
-- Escrita só pelo script (service role, que ignora RLS). O app só lê.

create table if not exists public.noite_relatorios (
  owner uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  versao smallint not null default 1,
  relatorio jsonb not null check (jsonb_typeof(relatorio) = 'object'),
  gerado_em timestamptz not null default now(),
  primary key (owner, dia)
);

create index if not exists noite_relatorios_dia_idx on public.noite_relatorios (owner, dia desc);

alter table public.noite_relatorios enable row level security;

-- Só o dono lê. Sem política de escrita para `authenticated`.
drop policy if exists "noite_relatorios: dono lê" on public.noite_relatorios;
create policy "noite_relatorios: dono lê"
  on public.noite_relatorios for select
  to authenticated
  using (owner = (select auth.uid()));

-- Conferência: deve listar a tabela com rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'noite_relatorios';
