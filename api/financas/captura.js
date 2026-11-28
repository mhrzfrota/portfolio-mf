// Gerado por pnpm build:api a partir de server/financas/captura.ts. Não edite.

// server/financas/captura.ts
import { Buffer } from "node:buffer";
import { createClient } from "@supabase/supabase-js";

// shared/financas/wallet.ts
var moneyHidden = false;
function formatBRL(value) {
  if (moneyHidden) return "R$ \u2022\u2022\u2022\u2022\u2022";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

// shared/financas/categorize.ts
function normalizeText(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}
var DEFAULT_EXPENSE_RULES = [
  // Transporte
  ["uber", "Transporte"],
  ["99app", "Transporte"],
  ["99 tecnologia", "Transporte"],
  ["cabify", "Transporte"],
  ["metro", "Transporte"],
  ["onibus", "Transporte"],
  ["estacionamento", "Transporte"],
  ["pedagio", "Transporte"],
  ["sem parar", "Transporte"],
  // Gasolina
  ["posto", "Gasolina"],
  ["ipiranga", "Gasolina"],
  ["shell", "Gasolina"],
  ["petrobras", "Gasolina"],
  ["combustivel", "Gasolina"],
  // Alimentação
  ["ifood", "Alimenta\xE7\xE3o"],
  ["ifd", "Alimenta\xE7\xE3o"],
  ["rappi", "Alimenta\xE7\xE3o"],
  ["mercado", "Alimenta\xE7\xE3o"],
  ["supermerc", "Alimenta\xE7\xE3o"],
  ["atacad", "Alimenta\xE7\xE3o"],
  ["carrefour", "Alimenta\xE7\xE3o"],
  ["assai", "Alimenta\xE7\xE3o"],
  ["pao de acucar", "Alimenta\xE7\xE3o"],
  ["padaria", "Alimenta\xE7\xE3o"],
  ["restaurante", "Alimenta\xE7\xE3o"],
  ["lanchonete", "Alimenta\xE7\xE3o"],
  ["pizzaria", "Alimenta\xE7\xE3o"],
  ["hamburg", "Alimenta\xE7\xE3o"],
  ["burger", "Alimenta\xE7\xE3o"],
  ["mc donalds", "Alimenta\xE7\xE3o"],
  ["mcdonalds", "Alimenta\xE7\xE3o"],
  ["acai", "Alimenta\xE7\xE3o"],
  ["cafeteria", "Alimenta\xE7\xE3o"],
  ["hortifruti", "Alimenta\xE7\xE3o"],
  ["acougue", "Alimenta\xE7\xE3o"],
  // Saúde
  ["farmacia", "Sa\xFAde"],
  ["drogaria", "Sa\xFAde"],
  ["drogasil", "Sa\xFAde"],
  ["pague menos", "Sa\xFAde"],
  ["raia", "Sa\xFAde"],
  ["laboratorio", "Sa\xFAde"],
  ["clinica", "Sa\xFAde"],
  ["dentista", "Sa\xFAde"],
  // Plano saúde
  ["unimed", "Plano sa\xFAde"],
  ["hapvida", "Plano sa\xFAde"],
  ["amil", "Plano sa\xFAde"],
  ["bradesco saude", "Plano sa\xFAde"],
  ["sulamerica", "Plano sa\xFAde"],
  // Assinaturas
  ["netflix", "Assinaturas"],
  ["spotify", "Assinaturas"],
  ["amazon prime", "Assinaturas"],
  ["prime video", "Assinaturas"],
  ["disney", "Assinaturas"],
  ["hbo", "Assinaturas"],
  ["max.com", "Assinaturas"],
  ["youtube premium", "Assinaturas"],
  ["apple.com", "Assinaturas"],
  ["apple com", "Assinaturas"],
  ["icloud", "Assinaturas"],
  ["google one", "Assinaturas"],
  ["chatgpt", "Assinaturas"],
  ["openai", "Assinaturas"],
  ["anthropic", "Assinaturas"],
  ["claude", "Assinaturas"],
  ["vivo", "Assinaturas"],
  ["claro", "Assinaturas"],
  ["tim s", "Assinaturas"],
  ["oi movel", "Assinaturas"],
  ["academia", "Assinaturas"],
  ["smart fit", "Assinaturas"],
  ["smartfit", "Assinaturas"],
  // Moradia
  ["aluguel", "Moradia"],
  ["condominio", "Moradia"],
  ["imobiliaria", "Moradia"],
  ["iptu", "Moradia"],
  // Contas da casa
  ["enel", "Luz"],
  ["energia", "Luz"],
  ["equatorial", "Luz"],
  ["coelba", "Luz"],
  ["celpe", "Luz"],
  ["cemig", "Luz"],
  ["copel", "Luz"],
  ["light ", "Luz"],
  ["sabesp", "\xC1gua"],
  ["embasa", "\xC1gua"],
  ["compesa", "\xC1gua"],
  ["cagece", "\xC1gua"],
  ["caesb", "\xC1gua"],
  ["sanepar", "\xC1gua"],
  ["saneamento", "\xC1gua"],
  ["comgas", "G\xE1s"],
  ["ultragaz", "G\xE1s"],
  ["supergasbras", "G\xE1s"],
  ["copagaz", "G\xE1s"],
  // Lazer
  ["cinema", "Lazer"],
  ["cinemark", "Lazer"],
  ["ingresso", "Lazer"],
  ["steam", "Lazer"],
  ["playstation", "Lazer"],
  ["xbox", "Lazer"],
  ["nintendo", "Lazer"],
  ["show ", "Lazer"],
  ["bar ", "Lazer"],
  ["cervejaria", "Lazer"],
  ["hotel", "Lazer"],
  ["airbnb", "Lazer"],
  ["viagem", "Lazer"],
  ["booking", "Lazer"]
];
function suggestCategory(description, userRules) {
  const normalized = normalizeText(description);
  const ordered = [...userRules].sort((a, b) => b.keyword.length - a.keyword.length);
  for (const rule of ordered) {
    if (rule.keyword && normalized.includes(rule.keyword)) return rule.category;
  }
  for (const [keyword, category] of DEFAULT_EXPENSE_RULES) {
    if (normalized.includes(keyword)) return category;
  }
  return null;
}
function suggestDefaultCategory(merchant) {
  return suggestCategory(merchant, []);
}

// shared/financas/captura.ts
function parseAmount(input) {
  let amount;
  if (typeof input === "number") {
    amount = Math.abs(input);
  } else if (typeof input === "string") {
    let text = input.trim().replace(/^−/, "-");
    const signBeforeCurrency = text.startsWith("-");
    if (signBeforeCurrency) text = text.slice(1).trimStart();
    text = text.replace(/^(?:R\$|\$)\s*/i, "");
    if (!signBeforeCurrency) text = text.replace(/^[-−]\s*/, "");
    if (/[ \u00a0\u202f]/.test(text)) {
      if (!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?$/.test(text)) return null;
      text = text.replace(/[ \u00a0\u202f]/g, "");
    }
    if (text.includes(",")) {
      if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text)) return null;
      text = text.replace(/\./g, "").replace(",", ".");
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
      return null;
    }
    amount = Number(text);
  } else {
    return null;
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e5) return null;
  return amount === Number(amount.toFixed(2)) ? amount : null;
}
function cleanMerchant(input) {
  if (typeof input !== "string" || input.includes("\0") || !input.isWellFormed()) return null;
  const compact = input.trim().replace(/\s+/gu, " ");
  return Array.from(compact).slice(0, 120).join("").trimEnd() || null;
}
function formatCaptureMessage(entry) {
  const money = formatBRL(entry.amount).replace(/[\u00a0\u202f]/g, " ");
  return (entry.duplicate ? "J\xE1 registrado: " : "") + [money, entry.title, entry.category].join(" \xB7 ");
}
var MAX_BYTES = 4096;
var BodyTooLarge = class extends Error {
};
function failure(status, message, extraHeaders) {
  return Response.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}
function methodNotAllowed() {
  return failure(405, "Use POST para registrar a compra.", { Allow: "POST" });
}
async function readJson(request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return null;
  const buffer = new Uint8Array(MAX_BYTES);
  let size = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > MAX_BYTES) {
        void reader.cancel().catch(() => {
        });
        throw new BodyTooLarge();
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, size)));
}
function captureInstant(value) {
  const parts = /^((?!0000)\d{4}-\d\d-\d\d)(?:[T ]((?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?)(Z|[+-]\d\d:\d\d)?)?$/i.exec(value.trim());
  if (!parts) return null;
  const [, day, time, zone] = parts;
  const midnight = /* @__PURE__ */ new Date(day + "T00:00:00Z");
  if (!Number.isFinite(midnight.valueOf()) || midnight.toISOString().slice(0, 10) !== day) return null;
  const instant = /* @__PURE__ */ new Date(day + "T" + (time ?? "00:00:00") + (zone ?? "-03:00"));
  return Number.isFinite(instant.valueOf()) ? instant.toISOString() : null;
}
async function handleCapture(request, capture) {
  if (request.method !== "POST") return methodNotAllowed();
  const token = /^Bearer[ \t]+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || !/^frt_[a-fA-F0-9]{48}$/.test(token)) return failure(401, "Token inv\xE1lido ou revogado.");
  let json;
  try {
    json = await readJson(request);
  } catch (err) {
    if (err instanceof BodyTooLarge) return failure(413, "O corpo excede 4 KB.");
    return failure(422, "Envie a compra em JSON v\xE1lido.");
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return failure(422, "Envie a compra em um objeto JSON.");
  const body = json;
  const amount = parseAmount(body.amount ?? body.valor);
  if (amount === null) return failure(422, "Valor da compra inv\xE1lido.");
  const merchant = cleanMerchant(body.merchant ?? body.estabelecimento);
  if (!merchant) return failure(422, "Informe o estabelecimento.");
  const card = body.card ?? body.cartao;
  if (card != null && typeof card !== "string") return failure(422, "Nome do cart\xE3o inv\xE1lido.");
  const cardLabel = cleanMerchant(card);
  if (typeof card === "string" && card.trim() && !cardLabel) return failure(422, "Nome do cart\xE3o inv\xE1lido.");
  const occurredAt = typeof body.occurred_at === "string" ? captureInstant(body.occurred_at) : null;
  if (body.occurred_at != null && !occurredAt) return failure(422, "Data da compra inv\xE1lida.");
  try {
    const { data, error } = await capture({
      p_token: token,
      p_amount: amount,
      p_merchant: merchant,
      p_card: cardLabel,
      p_occurred_at: occurredAt,
      p_default_category: suggestDefaultCategory(merchant)
    });
    if (error?.code === "28000") return failure(401, "Token inv\xE1lido ou revogado.");
    if (error?.code === "54000") return failure(429, "Limite por hora atingido. Tente mais tarde.");
    if (error?.code === "22023") return failure(422, "Dados da compra inv\xE1lidos.");
    if (!error && data) {
      const { id, title, amount: amount2, category, vault, occurred_at, duplicate } = data;
      const entry = { id, title, amount: amount2, category, vault, occurred_at, duplicate };
      return Response.json({ ok: true, message: formatCaptureMessage(entry), entry }, {
        headers: { "Cache-Control": "no-store" }
      });
    }
  } catch {
  }
  return failure(500, "N\xE3o foi poss\xEDvel confirmar a captura.");
}

// server/financas/captura.ts
var capturar = (args) => {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Captura indispon\xEDvel.");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return db.rpc("frtcash_capture_payment", args);
};
async function* blocos(req) {
  let recebeu = false;
  const leitor = !req.readableEnded && (req.iterator?.({ destroyOnReturn: false }) ?? req[Symbol.asyncIterator]?.());
  if (leitor) {
    try {
      for (let item = await leitor.next(); !item.done; item = await leitor.next()) {
        const bloco = Buffer.isBuffer(item.value) ? item.value : Buffer.from(item.value);
        if (bloco.length) {
          recebeu = true;
          yield bloco;
        }
      }
    } finally {
      await leitor.return?.();
    }
  }
  if (recebeu) return;
  const corpo = req.body;
  if (corpo instanceof Uint8Array) yield corpo;
  else if (corpo !== void 0) yield Buffer.from(typeof corpo === "string" ? corpo : JSON.stringify(corpo));
}
function requisicao(req) {
  const headers = new Headers();
  for (const nome of ["authorization", "content-length"]) {
    const valor = req.headers[nome];
    if (typeof valor === "string") headers.set(nome, valor);
  }
  const partes = blocos(req);
  const body = new ReadableStream({
    async pull(controle) {
      const item = await partes.next();
      if (item.done) controle.close();
      else controle.enqueue(item.value);
    },
    async cancel() {
      await partes.return(void 0);
      req.resume?.();
    }
  }, { highWaterMark: 0 });
  const init = { method: "POST", headers, body, duplex: "half" };
  return new Request("http://localhost/api/financas/captura", init);
}
async function executarCaptura(req, res, rpc = capturar) {
  const resposta = req.method === "POST" ? await handleCapture(requisicao(req), rpc) : methodNotAllowed();
  resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor));
  res.status(resposta.status).json(await resposta.json());
}
var captura_default = executarCaptura;
export {
  captura_default as default,
  executarCaptura
};
