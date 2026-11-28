-- Finanças do portfólio. Schema completo do FRTCASH v3, reaplicável.
begin;

create extension if not exists pgcrypto;

create table if not exists public.frtcash_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  column_id text not null check (column_id in ('income', 'expense', 'debt')),
  occurred_at date not null,
  income_source text,
  category text,
  due_date date,
  vault text not null default 'personal' check (vault in ('personal', 'work')),
  fitid text,
  constraint frtcash_cards_user_fitid_key unique (user_id, fitid),
  source text not null default 'manual' check (source in ('manual', 'ofx', 'apple_pay', 'recurring')),
  merchant_key text,
  card_label text,
  recurring_id uuid,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.frtcash_investment_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  target_amount numeric(12, 2) not null check (target_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);

create index if not exists frtcash_cards_user_month_idx
  on public.frtcash_cards (user_id, occurred_at desc);

create index if not exists frtcash_goals_user_month_idx
  on public.frtcash_investment_goals (user_id, month_key);

create or replace function public.set_frtcash_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_frtcash_cards_updated_at on public.frtcash_cards;
create trigger set_frtcash_cards_updated_at
before update on public.frtcash_cards
for each row
execute function public.set_frtcash_updated_at();

drop trigger if exists set_frtcash_goals_updated_at on public.frtcash_investment_goals;
create trigger set_frtcash_goals_updated_at
before update on public.frtcash_investment_goals
for each row
execute function public.set_frtcash_updated_at();

alter table public.frtcash_cards enable row level security;
alter table public.frtcash_investment_goals enable row level security;

revoke all on public.frtcash_cards from public, anon, authenticated;
grant select, insert, update, delete on public.frtcash_cards to authenticated;
grant select, insert, update on public.frtcash_cards to service_role;
revoke all on public.frtcash_investment_goals from public, anon, authenticated;
grant select, insert, update, delete on public.frtcash_investment_goals to authenticated;
grant select, insert, update on public.frtcash_investment_goals to service_role;

drop policy if exists "frtcash cards select own" on public.frtcash_cards;
create policy "frtcash cards select own"
on public.frtcash_cards
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "frtcash cards insert own" on public.frtcash_cards;
create policy "frtcash cards insert own"
on public.frtcash_cards
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "frtcash cards update own" on public.frtcash_cards;
create policy "frtcash cards update own"
on public.frtcash_cards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "frtcash cards delete own" on public.frtcash_cards;
create policy "frtcash cards delete own"
on public.frtcash_cards
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "frtcash goals select own" on public.frtcash_investment_goals;
create policy "frtcash goals select own"
on public.frtcash_investment_goals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "frtcash goals insert own" on public.frtcash_investment_goals;
create policy "frtcash goals insert own"
on public.frtcash_investment_goals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "frtcash goals update own" on public.frtcash_investment_goals;
create policy "frtcash goals update own"
on public.frtcash_investment_goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "frtcash goals delete own" on public.frtcash_investment_goals;
create policy "frtcash goals delete own"
on public.frtcash_investment_goals
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists frtcash_cards_user_vault_idx
  on public.frtcash_cards (user_id, vault, occurred_at desc);

-- Regras aprendidas de categorização ("ifood" -> "Alimentação").
create table if not exists public.frtcash_category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, keyword)
);

drop trigger if exists set_frtcash_rules_updated_at on public.frtcash_category_rules;
create trigger set_frtcash_rules_updated_at
before update on public.frtcash_category_rules
for each row
execute function public.set_frtcash_updated_at();

alter table public.frtcash_category_rules enable row level security;

revoke all on public.frtcash_category_rules from public, anon, authenticated;
grant select, insert, update, delete on public.frtcash_category_rules to authenticated;
grant select, insert, update on public.frtcash_category_rules to service_role;

drop policy if exists "frtcash rules select own" on public.frtcash_category_rules;
create policy "frtcash rules select own"
on public.frtcash_category_rules
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "frtcash rules insert own" on public.frtcash_category_rules;
create policy "frtcash rules insert own"
on public.frtcash_category_rules
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "frtcash rules update own" on public.frtcash_category_rules;
create policy "frtcash rules update own"
on public.frtcash_category_rules
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "frtcash rules delete own" on public.frtcash_category_rules;
create policy "frtcash rules delete own"
on public.frtcash_category_rules
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists frtcash_cards_merchant_idx
  on public.frtcash_cards (user_id, merchant_key, occurred_at desc)
  where merchant_key is not null;
-- O ID do molde faz parte do histórico mesmo depois da exclusão do molde.
create unique index if not exists frtcash_cards_recurring_date_idx
  on public.frtcash_cards (user_id, recurring_id, occurred_at)
  where recurring_id is not null;

create table if not exists public.frtcash_capture_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60 and label ~ '[^[:space:]]'),
  vault text not null default 'personal' check (vault in ('personal', 'work')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null check (token_prefix ~ '^[0-9a-f]{8}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists frtcash_capture_tokens_user_idx
  on public.frtcash_capture_tokens (user_id);

create table if not exists public.frtcash_capture_log (
  token_id uuid not null references public.frtcash_capture_tokens(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists frtcash_capture_log_window_idx
  on public.frtcash_capture_log (token_id, created_at);

create table if not exists public.frtcash_category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vault text not null default 'personal' check (vault in ('personal', 'work')),
  category text not null check (category ~ '[^[:space:]]'),
  monthly_limit numeric(12,2) not null check (monthly_limit > 0 and monthly_limit <> 'NaN'::numeric),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vault, category)
);

create table if not exists public.frtcash_recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vault text not null default 'personal' check (vault in ('personal', 'work')),
  title text not null check (char_length(title) between 1 and 120 and title ~ '[^[:space:]]'),
  amount numeric(12,2) not null check (amount > 0 and amount <> 'NaN'::numeric),
  column_id text not null check (column_id in ('income', 'expense')),
  category text,
  income_source text,
  day_of_month integer not null check (day_of_month between 1 and 31),
  starts_on date not null check (isfinite(starts_on)),
  ends_on date check (ends_on is null or (isfinite(ends_on) and ends_on >= starts_on)),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists frtcash_recurring_user_vault_idx
  on public.frtcash_recurring (user_id, vault);
-- Até onde o molde já gerou. Sem isso, apagar o lançamento de um mês (conta
-- cancelada naquela vez) fazia a próxima geração recriá-lo.
alter table public.frtcash_recurring add column if not exists generated_until date;

drop trigger if exists set_frtcash_budgets_updated_at on public.frtcash_category_budgets;
create trigger set_frtcash_budgets_updated_at before update on public.frtcash_category_budgets
for each row execute function public.set_frtcash_updated_at();

drop trigger if exists set_frtcash_recurring_updated_at on public.frtcash_recurring;
create trigger set_frtcash_recurring_updated_at before update on public.frtcash_recurring
for each row execute function public.set_frtcash_updated_at();

alter table public.frtcash_capture_tokens enable row level security;
alter table public.frtcash_capture_log enable row level security;
alter table public.frtcash_category_budgets enable row level security;
alter table public.frtcash_recurring enable row level security;

-- Remove inclusive privilégios padrão de tabela do Supabase antes dos grants por coluna.
-- O log fica privado, sem policy nem grant de API.
revoke all privileges on table public.frtcash_capture_tokens, public.frtcash_capture_log,
  public.frtcash_category_budgets, public.frtcash_recurring from public, anon, authenticated, service_role;
grant select (id, user_id, label, vault, token_prefix, created_at, last_used_at, revoked_at),
      update (label, vault, revoked_at), delete on public.frtcash_capture_tokens to authenticated;
grant select, insert, update, delete on public.frtcash_category_budgets, public.frtcash_recurring to authenticated;

drop policy if exists "frtcash tokens read own" on public.frtcash_capture_tokens;
create policy "frtcash tokens read own" on public.frtcash_capture_tokens
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "frtcash tokens update active own" on public.frtcash_capture_tokens;
create policy "frtcash tokens update active own" on public.frtcash_capture_tokens
for update to authenticated using (user_id = (select auth.uid()) and revoked_at is null)
with check (user_id = (select auth.uid()));

drop policy if exists "frtcash tokens delete own" on public.frtcash_capture_tokens;
create policy "frtcash tokens delete own" on public.frtcash_capture_tokens
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "frtcash budgets own" on public.frtcash_category_budgets;
create policy "frtcash budgets own" on public.frtcash_category_budgets
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "frtcash recurring own" on public.frtcash_recurring;
create policy "frtcash recurring own" on public.frtcash_recurring
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Meta a Dois tem um plano por dono, no formato do cálculo em coupleGoal.ts.
create table if not exists public.frtcash_couple_plans (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.frtcash_couple_plans enable row level security;
revoke all on public.frtcash_couple_plans from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.frtcash_couple_plans to authenticated;

drop policy if exists "frtcash couple plans own" on public.frtcash_couple_plans;
create policy "frtcash couple plans own" on public.frtcash_couple_plans
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop trigger if exists set_frtcash_couple_plans_updated_at on public.frtcash_couple_plans;
create trigger set_frtcash_couple_plans_updated_at before update on public.frtcash_couple_plans
for each row execute function public.set_frtcash_updated_at();

create or replace function public.frtcash_create_capture_token(p_label text, p_vault text default 'personal')
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_label text := btrim(p_label);
  v_crypto_schema name;
  v_random bytea;
  v_token text;
  v_prefix text;
  v_id uuid;
begin
  if v_user is null then
    raise exception using errcode = '28000', message = 'Entre para criar um token.';
  end if;
  if v_label is null or char_length(v_label) not between 1 and 60 or v_label !~ '[^[:space:]]'
     or p_vault is null or p_vault not in ('personal', 'work') then
    raise exception using errcode = '22023', message = 'Nome do aparelho ou cofre inválido.';
  end if;

  -- Duas criações simultâneas do mesmo dono compartilham a contagem.
  perform pg_advisory_xact_lock(hashtextextended('frtcash:tokens:' || v_user::text, 0));
  if (select count(*) from public.frtcash_capture_tokens where user_id = v_user and revoked_at is null) >= 5 then
    raise exception using errcode = '54000', message = 'Limite de cinco aparelhos ativos.';
  end if;

  -- pgcrypto preexistente pode estar instalado em public ou em extensions.
  select n.nspname into strict v_crypto_schema
  from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';
  execute format('select %I.gen_random_bytes(24)', v_crypto_schema) into v_random;
  v_token := 'frt_' || encode(v_random, 'hex');
  v_prefix := substr(v_token, 5, 8);

  insert into public.frtcash_capture_tokens (user_id, label, vault, token_hash, token_prefix)
  values (v_user, v_label, p_vault, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_prefix)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'token', v_token, 'token_prefix', v_prefix, 'label', v_label, 'vault', p_vault);
end;
$$;
revoke all on function public.frtcash_create_capture_token(text, text) from public, anon, authenticated, service_role;
grant execute on function public.frtcash_create_capture_token(text, text) to authenticated;

create or replace function public.frtcash_capture_payment(
  p_token text, p_amount numeric, p_merchant text, p_card text default null,
  p_occurred_at timestamptz default null, p_default_category text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_device public.frtcash_capture_tokens%rowtype;
  v_entry public.frtcash_cards%rowtype;
  v_now timestamptz := now();
  v_title text := btrim(p_merchant);
  v_normalized text;
  v_key text;
  v_unaccent_schema name;
  v_category text;
  v_duplicate boolean;
begin
  if p_token is null or octet_length(p_token) <> 52 or p_token !~ '^frt_[0-9a-fA-F]{48}$' then
    raise exception using errcode = '28000', message = 'Token inválido ou revogado.';
  end if;

  select t.* into v_device from public.frtcash_capture_tokens t
  where t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and t.revoked_at is null
  for update;
  if not found then
    raise exception using errcode = '28000', message = 'Token inválido ou revogado.';
  end if;
  if p_amount is null or not (p_amount > 0 and p_amount <= 100000) or p_amount <> round(p_amount, 2) then
    raise exception using errcode = '22023', message = 'Valor inválido.';
  end if;
  if v_title is null or char_length(v_title) not between 1 and 120 or v_title !~ '[^[:space:]]' then
    raise exception using errcode = '22023', message = 'Estabelecimento inválido.';
  end if;
  if p_occurred_at is not null and not isfinite(p_occurred_at) then
    raise exception using errcode = '22023', message = 'Data inválida.';
  end if;

  -- A trava da linha protege a cota por aparelho. Esta protege a deduplicação
  -- por dono, inclusive quando a mesma compra chega por dois tokens diferentes.
  perform pg_advisory_xact_lock(hashtextextended('frtcash:captura:' || v_device.user_id::text, 0));
  delete from public.frtcash_capture_log
  where token_id = v_device.id and created_at <= v_now - interval '1 hour';
  if (select count(*) from public.frtcash_capture_log where token_id = v_device.id) >= 30 then
    raise exception using errcode = '54000', message = 'Limite de capturas por hora.';
  end if;
  insert into public.frtcash_capture_log (token_id, created_at) values (v_device.id, v_now);
  update public.frtcash_capture_tokens set last_used_at = greatest(last_used_at, v_now) where id = v_device.id;

  v_normalized := lower(normalize(v_title, NFC));
  select n.nspname into v_unaccent_schema
  from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'unaccent';
  if found then
    execute format('select %I.unaccent($1)', v_unaccent_schema) into v_normalized using v_normalized;
  else
    v_normalized := translate(v_normalized, 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ', 'aaaaaaeeeeiiiiooooouuuucnyy');
  end if;
  v_normalized := btrim(regexp_replace(v_normalized, '[[:space:]]+', ' ', 'g'));
  v_key := regexp_replace(v_normalized, '[^[:alnum:]]+', ' ', 'g');
  v_key := regexp_replace(v_key, '\m[0-9]+\M', ' ', 'g');
  v_key := nullif(btrim(regexp_replace(v_key, ' +', ' ', 'g')), '');

  -- Nomes só com números ou símbolos não têm chave. Nesse caso, só o título
  -- idêntico de outra captura identifica a loja, sem juntar comércios distintos.
  select c.* into v_entry from public.frtcash_cards c
  where c.user_id = v_device.user_id and c.column_id = 'expense' and c.amount = p_amount
    and (c.merchant_key = v_key or (v_key is null and c.merchant_key is null and c.source = 'apple_pay' and c.title = v_title))
    and c.captured_at between v_now - interval '3 minutes' and v_now + interval '3 minutes'
  order by c.captured_at desc, c.id limit 1;
  v_duplicate := found;

  if not v_duplicate then
    select nullif(btrim(c.category), '') into v_category from public.frtcash_cards c
    where c.user_id = v_device.user_id and c.column_id = 'expense'
      and (c.merchant_key = v_key or (v_key is null and c.merchant_key is null and c.source = 'apple_pay' and c.title = v_title))
    order by c.occurred_at desc, c.created_at desc, c.id limit 1;

    if v_category is null then
      select r.category into v_category from public.frtcash_category_rules r
      where r.user_id = v_device.user_id and btrim(r.keyword) <> '' and btrim(r.category) <> ''
        and (strpos(v_key, r.keyword) > 0 or strpos(v_normalized, r.keyword) > 0)
      order by char_length(r.keyword) desc, r.keyword, r.id limit 1;
    end if;
    if v_category is null then
      -- Mesmos valores de EXPENSE_CATEGORIES em lib/wallet.ts.
      v_category := case when p_default_category in (
        'Água', 'Luz', 'Gás', 'Apartamento', 'Plano saúde', 'Gasolina', 'Alimentação',
        'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Assinaturas', 'Outros'
      ) then p_default_category else 'Outros' end;
    end if;

    insert into public.frtcash_cards (
      id, user_id, title, amount, column_id, vault, occurred_at, category, source, merchant_key, card_label, captured_at
    ) values (
      'ap-' || gen_random_uuid()::text, v_device.user_id, v_title, p_amount, 'expense', v_device.vault,
      (coalesce(p_occurred_at, v_now) at time zone 'America/Fortaleza')::date, v_category, 'apple_pay', v_key,
      nullif(left(btrim(p_card), 120), ''), v_now
    ) returning * into v_entry;
  end if;

  return jsonb_build_object(
    'id', v_entry.id, 'title', v_entry.title, 'amount', v_entry.amount,
    'category', coalesce(nullif(btrim(v_entry.category), ''), 'Outros'),
    'vault', v_entry.vault, 'occurred_at', v_entry.occurred_at, 'duplicate', v_duplicate
  );
end;
$$;
revoke all on function public.frtcash_capture_payment(text, numeric, text, text, timestamptz, text)
  from public, anon, authenticated, service_role;
grant execute on function public.frtcash_capture_payment(text, numeric, text, text, timestamptz, text)
  to anon, authenticated;

create or replace function public.frtcash_materialize_recurring(p_until date default current_date)
returns integer
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_month_end date := (date_trunc('month', now() at time zone 'America/Fortaleza') + interval '1 month')::date - 1;
  v_until date := least(coalesce(p_until, current_date), v_month_end);
  v_inserted integer;
begin
  if v_user is null then
    raise exception using errcode = '28000', message = 'Entre para gerar os recorrentes.';
  end if;

  with modelos as (
    select r.*,
      greatest(
        date_trunc('month', r.starts_on::timestamp),
        -- generated_until vale mais que o último lançamento: o usuário pode ter apagado um mês.
        date_trunc('month', coalesce(r.generated_until, ultimo.occurred_at)::timestamp) + interval '1 month'
      ) as primeiro_mes,
      least(v_until, coalesce(r.ends_on, v_until)) as limite
    from public.frtcash_recurring r
    left join lateral (
      select c.occurred_at from public.frtcash_cards c
      where c.user_id = r.user_id and c.recurring_id = r.id
      order by c.occurred_at desc limit 1
    ) ultimo on true
    where r.user_id = v_user and r.active and r.starts_on <= v_until
  ),
  parcelas as (
    select m.*, parcela.dia
    from modelos m
    cross join lateral generate_series(m.primeiro_mes, date_trunc('month', m.limite::timestamp), interval '1 month') as meses(inicio)
    cross join lateral (
      select least(meses.inicio::date + (m.day_of_month - 1), (meses.inicio + interval '1 month')::date - 1) as dia
    ) parcela
    where parcela.dia between m.starts_on and m.limite
  ),
  inseridos as (
    insert into public.frtcash_cards (
      id, user_id, vault, title, amount, column_id, category, income_source, occurred_at, recurring_id, source
    )
    select 'rc-' || gen_random_uuid()::text, p.user_id, p.vault, p.title, p.amount, p.column_id,
      case when p.column_id = 'expense' then coalesce(nullif(btrim(p.category), ''), 'Outros') end,
      case when p.column_id = 'income' then coalesce(nullif(btrim(p.income_source), ''), 'Outros') end,
      p.dia, p.id, 'recurring'
    from parcelas p
    on conflict (user_id, recurring_id, occurred_at) where recurring_id is not null do nothing
    returning 1
  ),
  marcados as (
    update public.frtcash_recurring r set generated_until = x.ultimo_dia
    from (select id, max(dia) as ultimo_dia from parcelas group by id) x
    where r.id = x.id and (r.generated_until is null or r.generated_until < x.ultimo_dia)
    returning 1
  )
  select count(*)::integer into v_inserted from inseridos;

  return v_inserted;
end;
$$;
revoke all on function public.frtcash_materialize_recurring(date) from public, anon, authenticated, service_role;
grant execute on function public.frtcash_materialize_recurring(date) to authenticated;

commit;
