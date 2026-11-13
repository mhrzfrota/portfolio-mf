import { createHmac, timingSafeEqual } from "node:crypto";
import type { Botao, Publicacao } from "../../shared/automacoes/tipos.ts";

const BASE = "https://zernio.com/api/v1";
const TIMEOUT = 8_000;
export type ContaZernio = { id: string; usuario: string; nome: string | null; foto: string | null };
export type AvisoZernio = {
  test?: boolean;
  event?: string;
  account?: { id?: string; platform?: string };
  comment?: { id?: string; platform?: string; platformPostId?: string; text?: string; author?: { id?: string; username?: string; isOwnAccount?: boolean } };
  message?: { platform?: string; platformMessageId?: string; direction?: string; text?: string | null; conversationId?: string; sender?: { id?: string; username?: string }; metadata?: { storyReply?: unknown; isStoryMention?: boolean; standby?: boolean } ; attachments?: { originalType?: string; type?: string }[] };
  metadata?: { storyReply?: unknown; isStoryMention?: boolean; standby?: boolean };
};

export class ZernioErro extends Error {
  constructor(public codigo: string) { super(`Zernio: ${codigo}`); this.name = "ZernioErro"; }
}

async function requisitar<T>(path: string, options: { method?: string; body?: unknown; headers?: Record<string,string>; timeoutMs?: number } = {}): Promise<T> {
  const key = process.env.ZERNIO_API_KEY?.trim();
  if (!key) throw new ZernioErro("chave_ausente");
  let url: URL;
  try { url = new URL(`${BASE}${path}`); } catch { throw new ZernioErro("caminho_invalido"); }
  if (!path.startsWith("/") || url.origin !== "https://zernio.com" || !url.pathname.startsWith("/api/v1/")) throw new ZernioErro("caminho_invalido");
  let response: Response;
  try {
    response = await fetch(url, { method: options.method ?? "GET", headers: { Authorization: `Bearer ${key}`, ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}), ...options.headers }, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: AbortSignal.timeout(options.timeoutMs ?? TIMEOUT), cache: "no-store", redirect: "error" });
  } catch { throw new ZernioErro("rede_ou_timeout"); }
  if (!response.ok) {
    const status = response.status;
    let code = String(status);
    try { const data = await response.json() as { code?: unknown }; if (typeof data.code === "string" && /^[a-z0-9_-]{1,60}$/i.test(data.code)) code = data.code; } catch { /* resposta não é exibida nem propagada */ }
    throw new ZernioErro(status >= 500 || status === 408 ? `incerto_${code}` : code);
  }
  if (response.status === 204) return undefined as T;
  try { return await response.json() as T; } catch { throw new ZernioErro("resposta_invalida"); }
}

export async function listarContas(): Promise<ContaZernio[]> {
  const result = await requisitar<{ accounts?: any[] }>("/accounts?platform=instagram");
  return (result.accounts ?? []).filter(a => a && a.platform === "instagram" && typeof a._id === "string" && typeof a.username === "string")
    .map(a => ({ id: a._id, usuario: a.username, nome: typeof a.displayName === "string" ? a.displayName : null, foto: typeof a.profilePicture === "string" ? a.profilePicture : null }));
}

export async function listarPublicacoes(accountId: string): Promise<Publicacao[]> {
  const result = await requisitar<{ posts?: any[] }>(`/accounts/${encodeURIComponent(accountId)}/posts`);
  return (result.posts ?? []).slice(0,25).flatMap(p => typeof p.id === "string" ? [{ id: p.id, legenda: p.message ?? null, miniatura: p.picture ?? null, link: p.permalink ?? null, tipo: p.mediaType === "video" ? "video" as const : p.mediaType === "carousel" ? "carrossel" as const : "imagem" as const, criadaEm: p.createdTime ?? null }] : []);
}

export async function responderComentarioPrivado(accountId: string, postId: string, commentId: string, message: string, botoes: Botao[], timeoutMs?: number) {
  return requisitar(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/private-reply`, { method: "POST", timeoutMs, body: { accountId, message: message.slice(0, botoes.length ? 640 : 1000), ...(botoes.length ? { buttons: botoes.map(b => ({ type: "url", title: b.titulo.slice(0,20), url: b.url })) } : {}) } });
}
export async function responderComentarioPublico(accountId: string, postId: string, commentId: string, message: string, timeoutMs?: number) {
  return requisitar(`/inbox/comments/${encodeURIComponent(postId)}`, { method: "POST", timeoutMs, body: { accountId, message, commentId }, headers: { "Idempotency-Key": `auto-${commentId}` } });
}
export async function enviarDirect(accountId: string, conversationId: string, message: string, botoes: Botao[], timeoutMs?: number) {
  return requisitar(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", timeoutMs, body: { accountId, message: message.slice(0, botoes.length ? 640 : 1000), ...(botoes.length ? { buttons: botoes.map(b => ({ type: "url", title: b.titulo.slice(0,20), url: b.url })) } : {}) } });
}

export async function listarWebhooks(): Promise<any[]> {
  const result = await requisitar<{ webhooks?: any[] }>("/webhooks/settings");
  return Array.isArray(result.webhooks) ? result.webhooks : [];
}
export async function registrarWebhook(url: string, secret: string): Promise<boolean> {
  const webhooks = await listarWebhooks();
  const existente = webhooks.find(w => w?.url === url);
  const body = { name: "Automações", url, secret, events: ["comment.received", "message.received"], isActive: true };
  if (existente && typeof existente._id === "string") {
    await requisitar("/webhooks/settings", { method: "PUT", body: { ...body, _id: existente._id } });
    return true;
  }
  await requisitar("/webhooks/settings", { method: "POST", body });
  return true;
}

export function assinaturaConfere(raw: Buffer | string, signature: string | string[] | undefined, secret = process.env.AUTOMACOES_WEBHOOK_SECRET): boolean {
  const header = Array.isArray(signature) ? signature[0] : signature;
  if (!secret?.trim() || !header || !/^[a-f0-9]{64}$/i.test(header)) return false;
  const esperado = createHmac("sha256", secret.trim()).update(raw).digest();
  return timingSafeEqual(esperado, Buffer.from(header, "hex"));
}
