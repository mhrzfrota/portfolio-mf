-- Automações Instagram. Idempotente; aplicar separadamente após revisão.

create or replace function public.auto_textos_ate(p_itens text[], p_limite integer)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(bool_and(length(valor) <= p_limite), true) from unnest(p_itens) as item(valor);
$$;

create table if not exists public.auto_contas (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  usuario text not null check (length(usuario) between 1 and 100),
  nome text,
  foto text,
  ativa boolean not null default false,
  sincronizada_em timestamptz,
  primary key (owner,id),
  check (nome is null or length(nome) <= 200),
  check (foto is null or (length(foto) <= 2048 and foto like 'https://%'))
);

create table if not exists public.auto_automacoes (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 1 and 80),
  ativa boolean not null default false,
  contas text[] not null default '{}',
  gatilhos text[] not null,
  posts text[] not null default '{}',
  palavras text[] not null default '{}',
  correspondencia text not null check (correspondencia in ('contem','palavra','exata')),
  respostas_publicas text[] not null default '{}',
  mensagem text not null default '',
  botoes jsonb not null default '[]'::jsonb,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  versao integer not null default 1,
  primary key (owner,id),
  check (cardinality(contas) between 1 and 100),
  check (cardinality(gatilhos) between 1 and 3 and gatilhos <@ array['comentario','direct','story']::text[]),
  check (cardinality(posts) <= 25 and array_position(posts, null) is null),
  check (cardinality(palavras) <= 20 and array_position(palavras, null) is null and public.auto_textos_ate(palavras,40)),
  check (cardinality(respostas_publicas) <= 5 and array_position(respostas_publicas, null) is null and public.auto_textos_ate(respostas_publicas,300)),
  check (length(mensagem) <= 1000),
  check (jsonb_typeof(botoes) = 'array' and jsonb_array_length(botoes) <= 2 and pg_column_size(botoes) <= 8192),
  check (versao >= 1)
);
create index if not exists auto_automacoes_owner_ativa_idx on public.auto_automacoes(owner,ativa);

create table if not exists public.auto_eventos (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 240),
  conta_id text not null check (length(conta_id) between 1 and 200),
  automacao_id uuid,
  tipo text not null check (tipo in ('comentario','direct','story')),
  usuario text,
  texto text,
  post_id text,
  situacao text not null check (situacao in ('enviado','ignorado','falhou','incerto')),
  erro text,
  criado_em timestamptz not null default now(),
  primary key (owner,id),
  check (usuario is null or length(usuario) <= 200),
  check (texto is null or length(texto) <= 2000),
  check (post_id is null or length(post_id) <= 200),
  check (erro is null or length(erro) <= 120)
);
create index if not exists auto_eventos_owner_criado_idx on public.auto_eventos(owner,criado_em desc);

create or replace function public.auto_carimbar_versao()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.versao := 1;
  else
    if new.versao is distinct from old.versao then raise exception 'Versão desatualizada' using errcode='40001'; end if;
    new.owner := old.owner; new.versao := old.versao + 1;
  end if;
  new.atualizada_em := now(); return new;
end; $$;
drop trigger if exists auto_automacoes_carimbar on public.auto_automacoes;
create trigger auto_automacoes_carimbar before insert or update on public.auto_automacoes for each row execute function public.auto_carimbar_versao();

alter table public.auto_contas enable row level security;
alter table public.auto_automacoes enable row level security;
alter table public.auto_eventos enable row level security;
revoke all on public.auto_contas, public.auto_automacoes, public.auto_eventos from anon;

drop policy if exists "auto_contas: dono lê" on public.auto_contas;
create policy "auto_contas: dono lê" on public.auto_contas for select to authenticated using (owner=(select auth.uid()));
drop policy if exists "auto_contas: dono ativa" on public.auto_contas;
create policy "auto_contas: dono ativa" on public.auto_contas for update to authenticated using (owner=(select auth.uid())) with check (owner=(select auth.uid()));
revoke all on public.auto_contas from authenticated;
grant select on public.auto_contas to authenticated;
grant update (ativa) on public.auto_contas to authenticated;

drop policy if exists "auto_automacoes: dono lê" on public.auto_automacoes;
create policy "auto_automacoes: dono lê" on public.auto_automacoes for select to authenticated using (owner=(select auth.uid()));
drop policy if exists "auto_automacoes: dono cria" on public.auto_automacoes;
create policy "auto_automacoes: dono cria" on public.auto_automacoes for insert to authenticated with check (owner=(select auth.uid()));
drop policy if exists "auto_automacoes: dono altera" on public.auto_automacoes;
create policy "auto_automacoes: dono altera" on public.auto_automacoes for update to authenticated using (owner=(select auth.uid())) with check (owner=(select auth.uid()));
drop policy if exists "auto_automacoes: dono remove" on public.auto_automacoes;
create policy "auto_automacoes: dono remove" on public.auto_automacoes for delete to authenticated using (owner=(select auth.uid()));
revoke all on public.auto_automacoes from authenticated;
grant select,insert,update,delete on public.auto_automacoes to authenticated;

drop policy if exists "auto_eventos: dono lê" on public.auto_eventos;
create policy "auto_eventos: dono lê" on public.auto_eventos for select to authenticated using (owner=(select auth.uid()));
revoke all on public.auto_eventos from authenticated;
grant select on public.auto_eventos to authenticated;

do $$ declare t text; begin
  foreach t in array array['auto_contas','auto_automacoes','auto_eventos'] loop
    execute format('drop policy if exists %I on public.%I', t || ': parceiro bloqueado', t);
    execute format('create policy %I on public.%I as restrictive for all to authenticated using (not public.radar_eh_parceiro()) with check (not public.radar_eh_parceiro())', t || ': parceiro bloqueado', t);
  end loop;
end $$;

grant all on public.auto_contas, public.auto_automacoes, public.auto_eventos to service_role;
