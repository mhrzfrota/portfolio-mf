import assert from "node:assert/strict";
import { test } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  cardToRow, createCaptureToken, deleteBudget, deleteRecurring, listCaptureTokens, loadBudgets,
  loadRecurring, materializeRecurring, renameCaptureToken, revokeCaptureToken, rowToCard,
  saveRecurring, upsertBudget, type Database, type RecurringInput,
} from "./dados.ts";
import type { WalletCard } from "@shared/financas/wallet";

// O SDK real monta a requisição. O fetch em memória substitui todo acesso ao Supabase.
function fakeSupabase(data: unknown, status = 200) {
  const calls: Request[] = [];
  const client = createClient<Database>("https://frtcash.example", "anon-de-teste", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        calls.push(new Request(input, init));
        return data === undefined ? new Response(null, { status }) : Response.json(data, { status });
      },
    },
  });
  return { client, calls };
}

const simpleCard: WalletCard = {
  id: "manual-1", title: "Café", column: "expense", amount: 9.5,
  category: "Alimentação", createdAt: "2026-11-27T10:00:00Z",
};

test("preserva a origem, o cartão e o instante de captura na ida e volta", () => {
  const row: Database["public"]["Tables"]["frtcash_cards"]["Row"] = {
    id: "ap-teste", user_id: "dono", title: "Café", amount: 9.5, column_id: "expense",
    vault: "work", fitid: null, source: "apple_pay", merchant_key: "cafe", card_label: "Trabalho",
    recurring_id: null, captured_at: "2026-11-27T01:10:00Z", occurred_at: "2026-11-26",
    income_source: null, category: "Alimentação", due_date: null,
    created_at: "2026-11-27T01:10:00Z", updated_at: "2026-11-27T02:10:00Z",
  };
  const card = rowToCard(row);
  assert.equal(card.merchantKey, "cafe");
  assert.equal(card.cardLabel, "Trabalho");
  assert.equal(card.capturedAt, row.captured_at);
  const saved = cardToRow(card, row.user_id);
  assert.deepEqual({ ...saved, updated_at: row.updated_at }, row);

  const recurringRow = { ...row, source: "recurring" as const, recurring_id: "molde", captured_at: null };
  const recurringCard = rowToCard(recurringRow);
  assert.equal(recurringCard.recurringId, "molde");
  assert.equal(cardToRow(recurringCard, row.user_id).recurring_id, "molde");
});

test("aceita cartões locais antigos e conserva o FITID de importações", () => {
  assert.equal(cardToRow(simpleCard, "dono").source, "manual");
  const imported = cardToRow({ ...simpleCard, fitid: "origem-42" }, "dono");
  assert.equal(imported.source, "ofx");
  assert.equal(imported.fitid, "origem-42");
  assert.equal(imported.vault, "personal");
  assert.equal(imported.captured_at, null);
});

test("cria token no cofre padrão e lista só os campos públicos do aparelho", async () => {
  const created = { id: "um", label: "iPhone", vault: "personal", token: "segredo-simulado", token_prefix: "0123abcd" };
  const creation = fakeSupabase(created);
  assert.deepEqual(await createCaptureToken(creation.client, " iPhone "), created);
  assert.ok(creation.calls[0].url.endsWith("/rpc/frtcash_create_capture_token"));
  assert.deepEqual(await creation.calls[0].json(), { p_label: "iPhone", p_vault: "personal" });

  const listing = fakeSupabase([]);
  assert.deepEqual(await listCaptureTokens(listing.client), []);
  const fields = new URL(listing.calls[0].url).searchParams.get("select")?.split(",");
  assert.deepEqual(fields, ["id", "label", "vault", "token_prefix", "created_at", "last_used_at", "revoked_at"]);
});

test("renomeia e revoga um aparelho pelo ID", async () => {
  const rename = fakeSupabase({ id: "um", label: "Novo" });
  const renamed = await renameCaptureToken(rename.client, "um", " Novo ");
  assert.equal(renamed.label, "Novo");
  assert.deepEqual(await rename.calls[0].json(), { label: "Novo" });
  assert.equal(new URL(rename.calls[0].url).searchParams.get("id"), "eq.um");

  const revoke = fakeSupabase(undefined, 204);
  await revokeCaptureToken(revoke.client, "um");
  const request = revoke.calls[0];
  assert.equal(request.method, "PATCH");
  assert.equal(new URL(request.url).searchParams.get("revoked_at"), "is.null");
  const { revoked_at } = await request.json();
  assert.ok(Number.isFinite(Date.parse(revoked_at)));
});

test("traduz o limite de aparelhos em mensagem para a tela", async () => {
  const { client } = fakeSupabase({ code: "54000", message: "detalhe interno" }, 400);
  await assert.rejects(createCaptureToken(client, "iPhone"), /cinco aparelhos ativos/);
});

test("salva um teto mensal pela chave dono, cofre e categoria", async () => {
  const limit = { id: "um", vault: "work", category: "Gasolina", monthly_limit: 300 };
  const { client, calls } = fakeSupabase(limit);
  assert.deepEqual(await upsertBudget(client, "work", "Gasolina", 300), limit);
  const request = calls[0];
  assert.equal(new URL(request.url).searchParams.get("on_conflict"), "user_id,vault,category");
  assert.deepEqual(await request.json(), { vault: "work", category: "Gasolina", monthly_limit: 300 });
});

test("carrega limites e recorrentes pelo cofre e exclui pelo ID", async () => {
  for (const [table, load, remove] of [
    ["frtcash_category_budgets", loadBudgets, deleteBudget],
    ["frtcash_recurring", loadRecurring, deleteRecurring],
  ] as const) {
    const listing = fakeSupabase([]);
    await load(listing.client, "personal");
    const url = new URL(listing.calls[0].url);
    assert.equal(url.pathname, "/rest/v1/" + table);
    assert.equal(url.searchParams.get("vault"), "eq.personal");
    const deletion = fakeSupabase(undefined, 204);
    await remove(deletion.client, "um");
    assert.equal(deletion.calls[0].method, "DELETE");
    assert.equal(new URL(deletion.calls[0].url).searchParams.get("id"), "eq.um");
  }
});

test("insere e edita o molde com os campos da entrada ou da saída", async () => {
  const draft: RecurringInput = {
    vault: "work", title: "  Mensalidade  ", amount: 70, column_id: "expense", day_of_month: 31,
    starts_on: "2024-01-31", category: "Assinaturas",
  };
  const { client, calls } = fakeSupabase({ id: "um" });
  await saveRecurring(client, draft);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(await calls[0].json(), {
    ...draft, title: "Mensalidade", income_source: null, ends_on: null,
  });
  await saveRecurring(client, { ...draft, id: "um", column_id: "income", income_source: "Freelancer", active: false });
  assert.equal(calls[1].method, "PATCH");
  assert.equal(new URL(calls[1].url).searchParams.get("id"), "eq.um");
  assert.deepEqual(await calls[1].json(), {
    ...draft, column_id: "income", title: "Mensalidade", category: null,
    income_source: "Freelancer", ends_on: null, active: false,
  });
});

test("materializa até a data pedida ou usa o padrão do banco, inclusive quando criou zero", async () => {
  const { client, calls } = fakeSupabase(0);
  assert.equal(await materializeRecurring(client), 0);
  assert.equal(await materializeRecurring(client, "2026-11-27"), 0);
  assert.ok(calls[0].url.endsWith("/rpc/frtcash_materialize_recurring"));
  assert.deepEqual(await calls[0].json(), {});
  assert.deepEqual(await calls[1].json(), { p_until: "2026-11-27" });
});
