import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import type { CaptureEntry } from "./captura.ts";

const migration = readFileSync(new URL("../../supabase/migrations/0010_financas.sql", import.meta.url), "utf8");
const dono = "11111111-1111-4111-8111-111111111111";
const parceiro = "22222222-2222-4222-8222-222222222222";
const db = new PGlite();
const localPgcrypto = /select n\.nspname into strict v_crypto_schema[\s\S]*?where e\.extname = 'pgcrypto';/;
const sqlTeste = migration.replace("create extension if not exists pgcrypto;", "")
  .replace(localPgcrypto, "v_crypto_schema := 'extensions';");

beforeAll(async () => {
  expect(migration).toContain("create extension if not exists pgcrypto;");
  expect(migration).toMatch(localPgcrypto);
  // Apenas a fonte de bytes de pgcrypto é substituída. SHA-256, RLS e RPCs rodam no Postgres em memória.
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create schema extensions;
    grant usage on schema auth, public, extensions to anon, authenticated, service_role;
    create function extensions.gen_random_bytes(n int) returns bytea language sql volatile as $$
      select decode(string_agg(lpad(to_hex((random()*255)::int), 2, '0'), ''), 'hex') from generate_series(1,n) $$;
  `);
  await db.exec(sqlTeste);
}, 30000);

beforeEach(async () => {
  await db.exec("truncate auth.users cascade");
  await db.query("insert into auth.users values ($1), ($2)", [dono, parceiro]);
});
afterAll(async () => { await db.close(); });

async function como<T>(papel: "anon" | "authenticated", usuario: string | null, sql: string, args: unknown[] = []) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuario ?? ""]);
  await db.exec("set role " + papel);
  try {
    return (await db.query<T>(sql, args)).rows;
  } finally {
    await db.exec("reset role");
  }
}
async function aparelho(usuario = dono, cofre = "personal") {
  type Token = { id: string; token: string; token_prefix: string };
  const [linha] = await como<{ r: Token }>("authenticated", usuario,
    "select frtcash_create_capture_token('iPhone', $1) r", [cofre]);
  return linha.r;
}
async function capturar(token: string, valor: number, loja: string, categoria: string | null = null, data: string | null = null) {
  const [linha] = await como<{ r: CaptureEntry }>("anon", null,
    "select frtcash_capture_payment($1,$2,$3,'Carteira',$4,$5) r", [token, valor, loja, data, categoria]);
  return linha.r;
}
async function gerar(ate: string, usuario = dono) {
  return (await como<{ n: number }>("authenticated", usuario, "select frtcash_materialize_recurring($1) n", [ate]))[0].n;
}

test("reaplica 0010 com dados existentes e preserva o lançamento", async () => {
  const token = await aparelho();
  const original = await capturar(token.token, 23, "A");
  await db.exec(sqlTeste);
  expect(await capturar(token.token, 23, "A")).toEqual({ ...original, duplicate: true });
});

test("guarda apenas o SHA-256 e restringe as colunas e a criação de tokens", async () => {
  const { token, id, token_prefix } = await aparelho();
  expect(token).toMatch(/^frt_[a-f0-9]{48}$/);
  const { rows: [registro] } = await db.query("select * from frtcash_capture_tokens where id=$1", [id]);
  expect(registro.token_hash).toBe(createHash("sha256").update(token).digest("hex"));
  expect(token_prefix).toBe(token.slice(4, 12));
  expect(JSON.stringify(registro)).not.toContain(token);
  expect(await como("authenticated", dono, "select id from frtcash_capture_tokens")).toEqual([{ id }]);
  expect(await como("authenticated", parceiro, "select id from frtcash_capture_tokens")).toEqual([]);
  await expect(como("authenticated", dono, "select token_hash from frtcash_capture_tokens")).rejects.toMatchObject({ code: "42501" });
  await expect(como("authenticated", dono, "insert into frtcash_capture_tokens default values")).rejects.toMatchObject({ code: "42501" });
  await expect(como("anon", null, "select frtcash_create_capture_token('x')")).rejects.toMatchObject({ code: "42501" });
});

test("o parceiro não lê nem altera dados do dono e anon não lê as tabelas", async () => {
  const { token } = await aparelho();
  await capturar(token, 10, "Teste");
  await como("authenticated", dono, "insert into frtcash_category_budgets(category, monthly_limit) values ('Saúde',100)");
  for (const tabela of ["frtcash_cards", "frtcash_category_budgets", "frtcash_capture_tokens"]) {
    expect(await como("authenticated", parceiro, "select id from " + tabela)).toEqual([]);
    await expect(como("anon", null, "select id from " + tabela)).rejects.toMatchObject({ code: "42501" });
  }
  expect(await como("authenticated", parceiro, "delete from frtcash_cards returning id")).toEqual([]);
  await expect(como("authenticated", parceiro,
    "insert into frtcash_category_budgets(user_id,category,monthly_limit) values ($1,'Saúde',100)", [dono]))
    .rejects.toMatchObject({ code: "42501" });
  await expect(como("authenticated", dono, "select * from frtcash_capture_log")).rejects.toMatchObject({ code: "42501" });
});

test("identifica duplicata entre aparelhos e admite outra compra fora dos três minutos", async () => {
  const a = await aparelho(dono, "work"), b = await aparelho();
  const primeira = await capturar(a.token, 23.9, "Café São José #123", "Alimentação", "2024-03-01T02:30Z");
  expect(primeira).toMatchObject({ duplicate: false, title: "Café São José #123", vault: "work", occurred_at: "2024-02-29" });
  expect(primeira.id).toMatch(/^ap-/);
  expect(await capturar(b.token, 23.9, "CAFE SAO JOSE 88", null, "2020-01-01")).toEqual({ ...primeira, duplicate: true });
  await db.query("update frtcash_cards set captured_at = now() - interval '181 seconds' where id=$1", [primeira.id]);
  const nova = await capturar(b.token, 23.9, "Café São José", null);
  expect(nova.duplicate).toBe(false);
  expect(nova.id).not.toBe(primeira.id);
  const { rows } = await db.query("select source, merchant_key, card_label from frtcash_cards order by id");
  expect(rows).toHaveLength(2);
  expect(rows[0]).toEqual({ source: "apple_pay", merchant_key: "cafe sao jose", card_label: "Carteira" });
});

test("prioriza histórico, regra mais longa, categoria padrão válida e Outros", async () => {
  const { token } = await aparelho();
  await como("authenticated", dono, "insert into frtcash_category_rules(user_id,keyword,category) values ($1,'posto','Transporte'), ($1,'posto norte','Gasolina')", [dono]);
  await como("authenticated", parceiro, "insert into frtcash_category_rules(user_id,keyword,category) values ($1,'posto norte filial','Saúde')", [parceiro]);
  const primeira = await capturar(token, 100, "POSTO NORTE Filial 17", "Lazer");
  expect(primeira.category).toBe("Gasolina");
  await como("authenticated", dono, "update frtcash_cards set category='Transporte' where id=$1", [primeira.id]);
  expect((await capturar(token, 90, "Posto Norte Filial 28", "Lazer")).category).toBe("Transporte");
  expect((await capturar(token, 6, "Loja A", "Saúde")).category).toBe("Saúde");
  expect((await capturar(token, 7, "Loja B", "Inventada")).category).toBe("Outros");
});

test("conta 30 capturas por hora, incluindo repetidas, separadamente por aparelho", async () => {
  const a = await aparelho(), b = await aparelho();
  for (let i = 0; i < 30; i++) await capturar(a.token, 10, "Loja");
  await expect(capturar(a.token, 10, "Loja")).rejects.toMatchObject({ code: "54000" });
  expect((await capturar(b.token, 9, "Outra")).duplicate).toBe(false);
  await db.query("update frtcash_capture_log set created_at=now()-interval '61 minutes' where token_id=$1", [a.id]);
  expect((await capturar(a.token, 12, "Nova")).duplicate).toBe(false);
});

test("nega token revogado e libera sua vaga entre os cinco ativos", async () => {
  const a = await aparelho();
  for (let i = 1; i < 5; i++) await aparelho();
  await expect(aparelho()).rejects.toMatchObject({ code: "54000" });
  await como("authenticated", dono, "update frtcash_capture_tokens set revoked_at=now() where id=$1", [a.id]);
  await expect(capturar(a.token, 12, "Loja")).rejects.toMatchObject({ code: "28000" });
  expect((await aparelho()).id).not.toBe(a.id);
});

test("limita o dia 31 a fevereiro e conserva a exclusão da última parcela", async () => {
  await como("authenticated", dono, `insert into frtcash_recurring(title,amount,column_id,day_of_month,starts_on,ends_on)
    values ('Mensal',10,'expense',31,'2024-01-01','2024-03-31'),('Outro',5,'income',31,'2023-02-01','2023-02-28')`);
  expect(await gerar("2024-02-29", parceiro)).toBe(0);
  expect(await gerar("2024-02-29")).toBe(3);
  const parcelas = await como<{ dia: string }>("authenticated", dono, "select occurred_at::text dia from frtcash_cards order by 1");
  expect(parcelas.map(p => p.dia)).toEqual(["2023-02-28", "2024-01-31", "2024-02-29"]);
  expect(await gerar("2024-02-29")).toBe(0);
  await como("authenticated", dono, "delete from frtcash_cards where occurred_at='2024-02-29'");
  expect(await gerar("2024-02-29")).toBe(0);
  expect(await gerar("2024-04-30")).toBe(1);
  expect(await como("authenticated", dono, "select occurred_at::text dia from frtcash_cards where title='Mensal' order by 1"))
    .toEqual([{ dia: "2024-01-31" }, { dia: "2024-03-31" }]);
});

test("a Meta a Dois aceita só objeto e só o dono pode ler ou alterar seu plano", async () => {
  await como("authenticated", dono, "insert into frtcash_couple_plans(plan) values ($1)", [{ goal: 1000 }]);
  expect(await como("authenticated", dono, "select plan from frtcash_couple_plans")).toEqual([{ plan: { goal: 1000 } }]);
  expect(await como("authenticated", parceiro, "select plan from frtcash_couple_plans")).toEqual([]);
  expect(await como("authenticated", parceiro, "update frtcash_couple_plans set plan='{}' returning plan")).toEqual([]);
  await expect(como("authenticated", parceiro, "insert into frtcash_couple_plans(user_id,plan) values ($1,'{}')", [dono]))
    .rejects.toMatchObject({ code: "42501" });
  await expect(como("authenticated", dono, "update frtcash_couple_plans set plan='[]'")).rejects.toMatchObject({ code: "23514" });
  await expect(como("anon", null, "select plan from frtcash_couple_plans")).rejects.toMatchObject({ code: "42501" });
});
