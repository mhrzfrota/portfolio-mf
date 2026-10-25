-- Dados privados do Radar de Prospecção, um conjunto por usuário.
-- A service role do Mac administra as tabelas. O painel só altera dados próprios.

create table if not exists public.radar_leads (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null, dados jsonb not null, pontuacao integer not null,
  faixa text not null check (faixa in ('quente','morno','frio')),
  analisado_em date not null, atualizado_em timestamptz not null default now(),
  primary key (owner,id), check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);
create table if not exists public.radar_descartados (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chave text not null, dados jsonb not null, primary key (owner,chave),
  check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);
create table if not exists public.radar_envios (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null, lead_id text not null,
  status text not null check (status in ('rascunho','aprovado','reprovado','enviando','enviado','falhou','cancelado')),
  dados jsonb not null, versao integer not null default 1,
  atualizado_em timestamptz not null default now(), primary key (owner,id),
  check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);
create index if not exists radar_envios_status_idx on public.radar_envios(owner,status);
create table if not exists public.radar_funil (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id text not null, dados jsonb not null, versao integer not null default 1,
  atualizado_em timestamptz not null default now(), primary key (owner,lead_id),
  check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);
create table if not exists public.radar_bloqueados (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  usuario text not null, dados jsonb not null, primary key (owner,usuario),
  check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);
create table if not exists public.radar_config (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dados jsonb not null, versao integer not null default 1, atualizado_em timestamptz not null default now(),
  check (jsonb_typeof(dados) = 'object'), check (pg_column_size(dados) < 2000000)
);

do $$ declare t text; begin
  foreach t in array array['radar_leads','radar_descartados','radar_envios','radar_funil','radar_bloqueados','radar_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono lê', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner = (select auth.uid()))', t || ': dono lê', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono cria', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner = (select auth.uid()))', t || ': dono cria', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono altera', t);
    execute format('create policy %I on public.%I for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()))', t || ': dono altera', t);
  end loop;
end $$;

create or replace function public.radar_carimbar_versao()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.versao := 1;
  else new.owner := old.owner; new.versao := old.versao + 1;
  end if;
  new.atualizado_em := now(); return new;
end; $$;
drop trigger if exists radar_envios_carimbar on public.radar_envios;
create trigger radar_envios_carimbar before insert or update on public.radar_envios for each row execute function public.radar_carimbar_versao();
drop trigger if exists radar_funil_carimbar on public.radar_funil;
create trigger radar_funil_carimbar before insert or update on public.radar_funil for each row execute function public.radar_carimbar_versao();
drop trigger if exists radar_config_carimbar on public.radar_config;
create trigger radar_config_carimbar before insert or update on public.radar_config for each row execute function public.radar_carimbar_versao();
