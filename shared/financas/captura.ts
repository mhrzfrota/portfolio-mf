import { suggestDefaultCategory } from "./categorize.ts";
import { formatBRL, type Vault } from "./wallet.ts";

export type CaptureEntry = {
  id: string;
  title: string;
  amount: number;
  category: string;
  vault: Vault;
  occurred_at: string;
  duplicate: boolean;
};

export function parseAmount(input: unknown): number | null {
  let amount: number;
  if (typeof input === "number") {
    amount = Math.abs(input);
  } else if (typeof input === "string") {
    let text = input.trim().replace(/^−/, "-");
    const signBeforeCurrency = text.startsWith("-");
    if (signBeforeCurrency) text = text.slice(1).trimStart();
    text = text.replace(/^(?:R\$|\$)\s*/i, "");
    if (!signBeforeCurrency) text = text.replace(/^[-−]\s*/, "");

    // Atalhos pode usar espaço comum, inquebrável ou fino como separador de milhares.
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

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;
  return amount === Number(amount.toFixed(2)) ? amount : null;
}

export function cleanMerchant(input: unknown): string | null {
  if (typeof input !== "string" || input.includes("\0") || !input.isWellFormed()) return null;
  const compact = input.trim().replace(/\s+/gu, " ");
  return Array.from(compact).slice(0, 120).join("").trimEnd() || null;
}

export function formatCaptureMessage(entry: Pick<CaptureEntry, "amount" | "title" | "category" | "duplicate">): string {
  const money = formatBRL(entry.amount).replace(/[\u00a0\u202f]/g, " ");
  return (entry.duplicate ? "Já registrado: " : "") + [money, entry.title, entry.category].join(" · ");
}

export type CapturePaymentArgs = {
  p_token: string;
  p_amount: number;
  p_merchant: string;
  p_card?: string | null;
  p_occurred_at?: string | null;
  p_default_category?: string | null;
};

export type CapturePayment = (args: CapturePaymentArgs) => PromiseLike<{
  data: CaptureEntry | null;
  error: { code: string } | null;
}>;

const MAX_BYTES = 4096;
class BodyTooLarge extends Error {}

function failure(status: number, message: string, extraHeaders?: Record<string, string>): Response {
  return Response.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

export function methodNotAllowed(): Response {
  return failure(405, "Use POST para registrar a compra.", { Allow: "POST" });
}

async function readJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return null;
  const buffer = new Uint8Array(MAX_BYTES);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > MAX_BYTES) {
        void reader.cancel().catch(() => {});
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

// Sem fuso explícito, uma data da Carteira pertence ao calendário de Fortaleza.
function captureInstant(value: string): string | null {
  const parts = /^((?!0000)\d{4}-\d\d-\d\d)(?:[T ]((?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?)(Z|[+-]\d\d:\d\d)?)?$/i.exec(value.trim());
  if (!parts) return null;
  const [, day, time, zone] = parts;
  const midnight = new Date(day + "T00:00:00Z");
  if (!Number.isFinite(midnight.valueOf()) || midnight.toISOString().slice(0, 10) !== day) return null;
  const instant = new Date(day + "T" + (time ?? "00:00:00") + (zone ?? "-03:00"));
  return Number.isFinite(instant.valueOf()) ? instant.toISOString() : null;
}

export async function handleCapture(request: Request, capture: CapturePayment): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed();
  const token = /^Bearer[ \t]+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || !/^frt_[a-fA-F0-9]{48}$/.test(token)) return failure(401, "Token inválido ou revogado.");

  let json: unknown;
  try {
    json = await readJson(request);
  } catch (err) {
    if (err instanceof BodyTooLarge) return failure(413, "O corpo excede 4 KB.");
    return failure(422, "Envie a compra em JSON válido.");
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return failure(422, "Envie a compra em um objeto JSON.");
  const body = json as Record<string, unknown>;
  const amount = parseAmount(body.amount ?? body.valor);
  if (amount === null) return failure(422, "Valor da compra inválido.");
  const merchant = cleanMerchant(body.merchant ?? body.estabelecimento);
  if (!merchant) return failure(422, "Informe o estabelecimento.");

  const card = body.card ?? body.cartao;
  if (card != null && typeof card !== "string") return failure(422, "Nome do cartão inválido.");
  const cardLabel = cleanMerchant(card);
  if (typeof card === "string" && card.trim() && !cardLabel) return failure(422, "Nome do cartão inválido.");

  const occurredAt = typeof body.occurred_at === "string" ? captureInstant(body.occurred_at) : null;
  if (body.occurred_at != null && !occurredAt) return failure(422, "Data da compra inválida.");

  try {
    const { data, error } = await capture({
      p_token: token,
      p_amount: amount,
      p_merchant: merchant,
      p_card: cardLabel,
      p_occurred_at: occurredAt,
      p_default_category: suggestDefaultCategory(merchant),
    });
    if (error?.code === "28000") return failure(401, "Token inválido ou revogado.");
    if (error?.code === "54000") return failure(429, "Limite por hora atingido. Tente mais tarde.");
    if (error?.code === "22023") return failure(422, "Dados da compra inválidos.");
    if (!error && data) {
      const { id, title, amount, category, vault, occurred_at, duplicate } = data;
      const entry = { id, title, amount, category, vault, occurred_at, duplicate };
      return Response.json({ ok: true, message: formatCaptureMessage(entry), entry }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch {
    // Uma falha de transporte ou configuração não deve expor detalhes da RPC ao Atalhos.
  }
  return failure(500, "Não foi possível confirmar a captura.");
}
