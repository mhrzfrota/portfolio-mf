import assert from "node:assert/strict";
import { test, vi } from "vitest";
import { handleCapture, type CapturePaymentArgs } from "./captura.ts";
import type { CaptureEntry } from "./captura.ts";

const address = "https://frtcash.example/api/financas/captura";
const token = "frt_" + "ab".repeat(24);
const authorization = "Bearer " + token;
const purchase = { amount: 12.5, merchant: "iFood" };
const entry: CaptureEntry = {
  id: "ap-compra", title: "iFood", amount: 12.5, category: "Alimentação",
  vault: "personal", occurred_at: "2026-11-26", duplicate: false,
};

function post(body: string, auth: string | null = authorization, extra: Record<string, string> = {}) {
  const headers = new Headers({ "Content-Type": "application/json", ...extra });
  if (auth) headers.set("Authorization", auth);
  return new Request(address, { method: "POST", headers, body });
}

const unexpectedRpc = async () => assert.fail("Esta requisição não deve invocar a RPC");

async function assertError(response: Response, status: number, message?: string) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["message", "ok"]);
  assert.equal(body.ok, false);
  assert.equal(typeof body.message, "string");
  assert.ok(body.message.length > 0 && !body.message.includes(token));
  if (message) assert.equal(body.message, message);
}

test("exige o token no Bearer antes de ler o JSON ou chamar a RPC", async () => {
  const rpc = vi.fn(unexpectedRpc);
  for (const auth of [null, "Basic " + token, "Bearer frt_curto", authorization + " extra", "Bearer frt_" + "z".repeat(48)]) {
    await assertError(await handleCapture(post("json quebrado", auth), rpc), 401);
  }
  const request = new Request(address + "?token=" + token, {
    method: "POST", body: JSON.stringify({ ...purchase, token }),
  });
  await assertError(await handleCapture(request, rpc), 401);
  assert.equal(rpc.mock.calls.length, 0);
});

test("responde 405 aos outros métodos e anuncia POST", async () => {
  for (const method of ["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await handleCapture(new Request(address, { method }), unexpectedRpc);
    await assertError(response, 405);
    assert.equal(response.headers.get("allow"), "POST");
  }
});

test("rejeita um corpo declarado acima de 4096 bytes", async () => {
  const request = post(JSON.stringify(purchase), authorization, { "Content-Length": "4097" });
  await assertError(await handleCapture(request, unexpectedRpc), 413);
});

test("mede bytes de todos os blocos mesmo com Content-Length ausente ou menor", async () => {
  const text = JSON.stringify({ ...purchase, extra: "é".repeat(2200) });
  const bytes = new TextEncoder().encode(text);
  assert.ok(text.length < 4096 && bytes.length > 4096);
  for (const declaredLength of [null, "64"]) {
    const headers = new Headers({ Authorization: authorization });
    if (declaredLength) headers.set("Content-Length", declaredLength);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 2000));
        controller.enqueue(bytes.subarray(2000));
        controller.close();
      },
    });
    const init = { method: "POST", headers, body, duplex: "half" };
    await assertError(await handleCapture(new Request(address, init), unexpectedRpc), 413);
  }
});

test("aceita exatamente 4096 bytes", async () => {
  const response = await handleCapture(post(JSON.stringify(purchase).padEnd(4096)), async () => ({ data: entry, error: null }));
  assert.equal(response.status, 200);
});

test("recusa UTF-8 inválido, JSON malformado e valores que não são objetos", async () => {
  for (const body of ["", "{", "null", "[]", "32", '"compra"']) {
    await assertError(await handleCapture(post(body), unexpectedRpc), 422);
  }
  const invalidUtf8 = new Request(address, {
    method: "POST", headers: { Authorization: authorization }, body: new Uint8Array([0xff]),
  });
  await assertError(await handleCapture(invalidUtf8, unexpectedRpc), 422);
});

test("valida valor, estabelecimento, cartão e data antes da RPC", async () => {
  const rpc = vi.fn(unexpectedRpc);
  for (const input of [
    {}, { ...purchase, amount: 0 }, { ...purchase, amount: "1,234" }, { ...purchase, merchant: "  " },
    { ...purchase, merchant: 9 }, { ...purchase, card: false }, { ...purchase, card: "a\0b" },
    { ...purchase, occurred_at: 42 }, { ...purchase, occurred_at: "2026-02-29" },
    { ...purchase, occurred_at: "2026-06-31" }, { ...purchase, occurred_at: "2026-05-01T24:01Z" },
  ]) await assertError(await handleCapture(post(JSON.stringify(input)), rpc), 422);
  assert.equal(rpc.mock.calls.length, 0);
});

test("normaliza o payload em português e só encaminha os argumentos da captura", async () => {
  const rpc = vi.fn(async (args: CapturePaymentArgs) => {
    assert.deepEqual(args, {
      p_token: token, p_amount: 12.5, p_merchant: "iFood", p_card: "Cartão final 1234",
      p_occurred_at: "2026-11-27T01:15:00.000Z", p_default_category: "Alimentação",
    });
    return { data: { ...entry, token_hash: "campo interno" }, error: null };
  });
  const request = post(JSON.stringify({
    valor: "-R$\u00a012,50", estabelecimento: "  iFood ", cartao: "  Cartão  final 1234 ",
    occurred_at: "2026-11-26T22:15:00-03:00", vault: "work", p_default_category: "Lazer", user_id: "intruso",
  }));
  const response = await handleCapture(request, rpc);
  assert.equal(rpc.mock.calls.length, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, message: "R$ 12,50 · iFood · Alimentação", entry });
});

test("aceita os nomes em inglês e conserva opcionais ausentes como nulos", async () => {
  const response = await handleCapture(post(JSON.stringify({ amount: "$12.50", merchant: "Loja ZZ", card: "  " })), async (args) => {
    assert.deepEqual(args, {
      p_token: token, p_amount: 12.5, p_merchant: "Loja ZZ", p_card: null, p_occurred_at: null, p_default_category: null,
    });
    return { data: { ...entry, title: "Loja ZZ", category: "Outros" }, error: null };
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "R$ 12,50 · Loja ZZ · Outros");
});

test("preserva a data local de Fortaleza e aceita um dia bissexto", async () => {
  for (const [input, expected] of [
    ["2024-02-29", "2024-02-29T03:00:00.000Z"],
    ["2026-11-26T23:50:00", "2026-11-27T02:50:00.000Z"],
    ["2026-11-27T01:15:00Z", "2026-11-27T01:15:00.000Z"],
  ]) {
    const response = await handleCapture(post(JSON.stringify({ ...purchase, occurred_at: input })), async (args) => {
      assert.equal(args.p_occurred_at, expected);
      return { data: entry, error: null };
    });
    assert.equal(response.status, 200);
  }
});

test("devolve o lançamento original e sinaliza duplicata na mensagem", async () => {
  const original = { ...entry, duplicate: true };
  const response = await handleCapture(post(JSON.stringify(purchase)), async () => ({ data: original, error: null }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, message: "Já registrado: R$ 12,50 · iFood · Alimentação", entry: original });
});

for (const [code, status] of [["28000", 401], ["54000", 429], ["22023", 422], ["XX000", 500]] as const) {
  test("traduz SQLSTATE " + code + " para HTTP " + status + " com mensagem pública", async () => {
    const request = post(JSON.stringify(purchase));
    const error = { code, message: token, details: JSON.stringify(purchase) };
    await assertError(await handleCapture(request, async () => ({ data: null, error })), status);
  });
}

test("oculta detalhes de exceções de transporte e de respostas sem dados", async () => {
  const failing = async () => { throw new Error(token); };
  for (const rpc of [failing, async () => ({ data: null, error: null })]) {
    const response = await handleCapture(post(JSON.stringify(purchase)), rpc);
    await assertError(response, 500, "Não foi possível confirmar a captura.");
  }
});
