-- Compartilha um único Radar entre o dono e os parceiros convidados.
-- Idempotente e sem alterar o bloqueio das demais áreas criado em 0006.

alter table public.radar_papeis
  add column if not exists radar_owner uuid references auth.users(id) on delete cascade;

update public.radar_papeis set radar_owner = user_id
  where papel = 'dono' and radar_owner is null;

create or replace function public.radar_owner_atual()
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.radar_owner from public.radar_papeis p where p.user_id = auth.uid() and p.radar_owner is not null),
    auth.uid()
  );
$$;
revoke all on function public.radar_owner_atual() from public;
grant execute on function public.radar_owner_atual() to authenticated;

do $$ declare t text; begin
  foreach t in array array['radar_leads','radar_descartados','radar_envios','radar_funil','radar_bloqueados','radar_config'] loop
    execute format('drop policy if exists %I on public.%I', t || ': equipe lê', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner = (select public.radar_owner_atual()))', t || ': equipe lê', t);
    execute format('drop policy if exists %I on public.%I', t || ': equipe cria', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner = (select public.radar_owner_atual()))', t || ': equipe cria', t);
    execute format('drop policy if exists %I on public.%I', t || ': equipe altera', t);
    execute format('create policy %I on public.%I for update to authenticated using (owner = (select public.radar_owner_atual())) with check (owner = (select public.radar_owner_atual()))', t || ': equipe altera', t);
  end loop;
end $$;

drop policy if exists "radar_buscas: equipe lê" on public.radar_buscas;
create policy "radar_buscas: equipe lê" on public.radar_buscas for select to authenticated
  using (owner = (select public.radar_owner_atual()) and public.radar_tem_acesso());
drop policy if exists "radar_buscas: equipe pede" on public.radar_buscas;
create policy "radar_buscas: equipe pede" on public.radar_buscas for insert to authenticated
  with check (owner = (select public.radar_owner_atual()) and public.radar_tem_acesso() and status='pendente' and resultado is null and erro is null);

create or replace function public.radar_limitar_buscas()
returns trigger language plpgsql set search_path = '' as $$
declare limite integer; usadas integer;
begin
  new.owner := public.radar_owner_atual();
  limite := case new.modo when 'rapida' then 5 else 2 end;
  select count(*) into usadas from public.radar_buscas
    where owner=new.owner and modo=new.modo
      and (criado_em at time zone 'America/Fortaleza')::date = (now() at time zone 'America/Fortaleza')::date;
  if usadas >= limite then
    raise exception 'Limite diário de buscas % atingido (% por dia).', case new.modo when 'rapida' then 'rápidas' else 'completas' end, limite using errcode='P0001';
  end if;
  new.status := 'pendente'; new.resultado := null; new.erro := null;
  return new;
end; $$;

create or replace function public.radar_atualizar_busca(p_id uuid, p_status text, p_resultado jsonb default null, p_erro text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('rodando','concluida','falhou') then raise exception 'Status inválido'; end if;
  update public.radar_buscas set status=p_status, resultado=p_resultado, erro=left(p_erro,1000), atualizado_em=now()
    where id=p_id and owner=public.radar_owner_atual() and public.radar_tem_acesso()
      and ((status='pendente' and p_status in ('rodando','falhou')) or (status='rodando' and p_status in ('concluida','falhou')));
  if not found then raise exception 'Busca inexistente ou transição inválida'; end if;
end; $$;
revoke all on function public.radar_atualizar_busca(uuid,text,jsonb,text) from public;
grant execute on function public.radar_atualizar_busca(uuid,text,jsonb,text) to authenticated;
