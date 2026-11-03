-- Parceiros do Radar, fila de buscas e bloqueio das demais áreas.
-- Idempotente: pode ser reaplicada sem duplicar objetos ou políticas.

create table if not exists public.radar_papeis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('dono','parceiro')),
  nome text,
  criado_em timestamptz not null default now()
);
alter table public.radar_papeis enable row level security;
drop policy if exists "radar_papeis: próprio lê" on public.radar_papeis;
create policy "radar_papeis: próprio lê" on public.radar_papeis for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.radar_eh_parceiro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.radar_papeis where user_id = auth.uid() and papel = 'parceiro');
$$;
revoke all on function public.radar_eh_parceiro() from public;
grant execute on function public.radar_eh_parceiro() to authenticated;

-- O cadastro do Supabase pode estar aberto: conta nova sem papel não usa a busca
-- (que gasta Google Places e Anthropic). O dono é quem já tinha o Radar
-- (radar_config importada em 2026-10-25), sem e-mail neste repositório público.
alter table public.radar_papeis drop constraint if exists radar_papeis_papel_check;
alter table public.radar_papeis add constraint radar_papeis_papel_check check (papel in ('dono','parceiro'));
insert into public.radar_papeis (user_id, papel)
  select c.owner, 'dono' from public.radar_config c
  where not exists (select 1 from public.radar_papeis p where p.user_id = c.owner)
on conflict (user_id) do nothing;

create or replace function public.radar_tem_acesso()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.radar_papeis where user_id = auth.uid());
$$;
revoke all on function public.radar_tem_acesso() from public;
grant execute on function public.radar_tem_acesso() to authenticated;

do $$ declare t text; begin
  foreach t in array array['calendario','plano'] loop
    execute format('drop policy if exists %I on public.%I', t || ': parceiro bloqueado', t);
    execute format('create policy %I on public.%I as restrictive for all to authenticated using (not public.radar_eh_parceiro()) with check (not public.radar_eh_parceiro())', t || ': parceiro bloqueado', t);
  end loop;
  foreach t in array array['noite_relatorios','cerebro_notas','cerebro_sync'] loop
    execute format('drop policy if exists %I on public.%I', t || ': parceiro bloqueado', t);
    execute format('create policy %I on public.%I as restrictive for select to authenticated using (not public.radar_eh_parceiro())', t || ': parceiro bloqueado', t);
  end loop;
end $$;

create table if not exists public.radar_buscas (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  modo text not null check (modo in ('rapida','completa')),
  nicho text not null,
  regiao text not null,
  quantidade integer not null,
  status text not null default 'pendente' check (status in ('pendente','rodando','concluida','falhou')),
  resultado jsonb,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key(owner,id),
  constraint radar_buscas_quantidade check ((modo='rapida' and quantidade between 1 and 10) or (modo='completa' and quantidade between 1 and 15)),
  constraint radar_buscas_textos check (length(trim(nicho)) between 2 and 100 and length(trim(regiao)) between 2 and 120),
  constraint radar_buscas_resultado check (resultado is null or (jsonb_typeof(resultado)='object' and pg_column_size(resultado)<200000))
);
create index if not exists radar_buscas_owner_criado_idx on public.radar_buscas(owner, criado_em desc);
alter table public.radar_buscas enable row level security;
drop policy if exists "radar_buscas: dono lê" on public.radar_buscas;
create policy "radar_buscas: dono lê" on public.radar_buscas for select to authenticated using (owner=(select auth.uid()));
drop policy if exists "radar_buscas: dono pede" on public.radar_buscas;
create policy "radar_buscas: dono pede" on public.radar_buscas for insert to authenticated
  with check (owner=(select auth.uid()) and public.radar_tem_acesso() and status='pendente' and resultado is null and erro is null);

create or replace function public.radar_limitar_buscas()
returns trigger language plpgsql set search_path = '' as $$
declare limite integer; usadas integer;
begin
  if auth.uid() is not null then new.owner := auth.uid(); end if;
  limite := case new.modo when 'rapida' then 5 else 2 end;
  select count(*) into usadas from public.radar_buscas
    where owner=new.owner and modo=new.modo
      and (criado_em at time zone 'America/Fortaleza')::date = (now() at time zone 'America/Fortaleza')::date;
  if usadas >= limite then
    raise exception 'Limite diário de buscas % atingido (% por dia).', case new.modo when 'rapida' then 'rápidas' else 'completas' end, limite
      using errcode='P0001';
  end if;
  new.status := 'pendente'; new.resultado := null; new.erro := null;
  return new;
end; $$;
drop trigger if exists radar_buscas_limite on public.radar_buscas;
create trigger radar_buscas_limite before insert on public.radar_buscas for each row execute function public.radar_limitar_buscas();

create or replace function public.radar_atualizar_busca(p_id uuid, p_status text, p_resultado jsonb default null, p_erro text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('rodando','concluida','falhou') then raise exception 'Status inválido'; end if;
  update public.radar_buscas set status=p_status, resultado=p_resultado, erro=left(p_erro,1000), atualizado_em=now()
    where id=p_id and owner=auth.uid()
      and ((status='pendente' and p_status in ('rodando','falhou')) or (status='rodando' and p_status in ('concluida','falhou')));
  if not found then raise exception 'Busca inexistente ou transição inválida'; end if;
end; $$;
revoke all on function public.radar_atualizar_busca(uuid,text,jsonb,text) from public;
grant execute on function public.radar_atualizar_busca(uuid,text,jsonb,text) to authenticated;

-- Constantes espelhadas em shared/radar/buscas.ts para testes sem banco.
comment on trigger radar_buscas_limite on public.radar_buscas is 'America/Fortaleza: rapida 5/dia; completa 2/dia por owner';
