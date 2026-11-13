// Gerado por pnpm build:api a partir de server/automacoes/. Não edite.

// server/automacoes/painel.ts
import { createClient } from "@supabase/supabase-js";

// server/automacoes/zernio.ts
var BASE = "https://zernio.com/api/v1";
var TIMEOUT = 8e3;
var ZernioErro = class extends Error {
  constructor(codigo) {
    super(`Zernio: ${codigo}`);
    this.codigo = codigo;
    this.name = "ZernioErro";
  }
};
async function requisitar(path, options = {}) {
  const key = process.env.ZERNIO_API_KEY?.trim();
  if (!key) throw new ZernioErro("chave_ausente");
  let url;
  try {
    url = new URL(`${BASE}${path}`);
  } catch {
    throw new ZernioErro("caminho_invalido");
  }
  if (!path.startsWith("/") || url.origin !== "https://zernio.com" || !url.pathname.startsWith("/api/v1/")) throw new ZernioErro("caminho_invalido");
  let response;
  try {
    response = await fetch(url, { method: options.method ?? "GET", headers: { Authorization: `Bearer ${key}`, ...options.body !== void 0 ? { "Content-Type": "application/json" } : {}, ...options.headers }, body: options.body === void 0 ? void 0 : JSON.stringify(options.body), signal: AbortSignal.timeout(options.timeoutMs ?? TIMEOUT), cache: "no-store", redirect: "error" });
  } catch {
    throw new ZernioErro("rede_ou_timeout");
  }
  if (!response.ok) {
    const status = response.status;
    let code = String(status);
    try {
      const data = await response.json();
      if (typeof data.code === "string" && /^[a-z0-9_-]{1,60}$/i.test(data.code)) code = data.code;
    } catch {
    }
    throw new ZernioErro(status >= 500 || status === 408 ? `incerto_${code}` : code);
  }
  if (response.status === 204) return void 0;
  try {
    return await response.json();
  } catch {
    throw new ZernioErro("resposta_invalida");
  }
}
async function listarContas() {
  const result = await requisitar("/accounts?platform=instagram");
  return (result.accounts ?? []).filter((a) => a && a.platform === "instagram" && typeof a._id === "string" && typeof a.username === "string").map((a) => ({ id: a._id, usuario: a.username, nome: typeof a.displayName === "string" ? a.displayName : null, foto: typeof a.profilePicture === "string" ? a.profilePicture : null }));
}
async function listarPublicacoes(accountId) {
  const result = await requisitar(`/accounts/${encodeURIComponent(accountId)}/posts`);
  return (result.posts ?? []).slice(0, 25).flatMap((p) => typeof p.id === "string" ? [{ id: p.id, legenda: p.message ?? null, miniatura: p.picture ?? null, link: p.permalink ?? null, tipo: p.mediaType === "video" ? "video" : p.mediaType === "carousel" ? "carrossel" : "imagem", criadaEm: p.createdTime ?? null }] : []);
}
async function listarWebhooks() {
  const result = await requisitar("/webhooks/settings");
  return Array.isArray(result.webhooks) ? result.webhooks : [];
}
async function registrarWebhook(url, secret) {
  const webhooks = await listarWebhooks();
  const existente = webhooks.find((w) => w?.url === url);
  const body = { name: "Automa\xE7\xF5es", url, secret, events: ["comment.received", "message.received"], isActive: true };
  if (existente && typeof existente._id === "string") {
    await requisitar("/webhooks/settings", { method: "PUT", body: { ...body, _id: existente._id } });
    return true;
  }
  await requisitar("/webhooks/settings", { method: "POST", body });
  return true;
}

// server/automacoes/painel.ts
var limite = /* @__PURE__ */ new Map();
var padrao = () => {
  const url = process.env.VITE_SUPABASE_URL, anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !service) throw new Error("supabase_ausente");
  return { anon: createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }), admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }), contas: listarContas, publicacoes: listarPublicacoes, webhooks: listarWebhooks, registrar: registrarWebhook };
};
var responder = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(body);
};
function erroCodigo(e) {
  return e instanceof ZernioErro ? e.codigo : "falha_interna";
}
function pedidoDoBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body;
  if (b.acao === "sincronizar-contas" || b.acao === "situacao" || b.acao === "registrar-webhook") return { acao: b.acao };
  if (b.acao === "publicacoes" && typeof b.contaId === "string" && b.contaId.length > 0 && b.contaId.length <= 200) return { acao: b.acao, contaId: b.contaId };
  return null;
}
function dentroDoLimite(id, agora) {
  const recentes = (limite.get(id) ?? []).filter((t) => agora - t < 6e4);
  if (recentes.length >= 30) {
    limite.set(id, recentes);
    return false;
  }
  recentes.push(agora);
  limite.set(id, recentes);
  if (limite.size > 5e3) {
    for (const [chave, vals] of limite) if (!vals.some((t) => agora - t < 6e4)) limite.delete(chave);
  }
  return true;
}
async function executar(p, owner, d) {
  if (p.acao === "sincronizar-contas") {
    const externas = (await d.contas()).filter((c) => c.id.length <= 200 && c.usuario.length >= 1).map((c) => ({ id: c.id, usuario: c.usuario.slice(0, 100), nome: c.nome ? c.nome.slice(0, 200) : null, foto: c.foto && c.foto.startsWith("https://") && c.foto.length <= 2048 ? c.foto : null }));
    const { data: atuais, error: erroLeitura } = await d.admin.from("auto_contas").select("id,ativa").eq("owner", owner);
    if (erroLeitura) throw new Error("banco_indisponivel");
    const porId = new Map((atuais ?? []).map((c) => [c.id, c]));
    const ids = new Set(externas.map((c) => c.id));
    if (externas.length) {
      const gravadas = await d.admin.from("auto_contas").upsert(externas.map((c) => ({ owner, id: c.id, usuario: c.usuario, nome: c.nome, foto: c.foto, ativa: porId.get(c.id)?.ativa ?? false, sincronizada_em: (/* @__PURE__ */ new Date()).toISOString() })), { onConflict: "owner,id" });
      if (gravadas.error) throw new Error("banco_indisponivel");
    }
    const sumidas = (atuais ?? []).filter((c) => !ids.has(c.id)).map((c) => c.id);
    if (sumidas.length) {
      const atualizada = await d.admin.from("auto_contas").update({ ativa: false, sincronizada_em: (/* @__PURE__ */ new Date()).toISOString() }).eq("owner", owner).in("id", sumidas);
      if (atualizada.error) throw new Error("banco_indisponivel");
    }
    return { ok: true, acao: p.acao, contas: externas.map((c) => ({ id: c.id, usuario: c.usuario, nome: c.nome, foto: c.foto, ativa: porId.get(c.id)?.ativa ?? false, sincronizadaEm: (/* @__PURE__ */ new Date()).toISOString() })) };
  }
  if (p.acao === "publicacoes") {
    const { data: conta, error } = await d.admin.from("auto_contas").select("id").eq("owner", owner).eq("id", p.contaId).maybeSingle();
    if (error || !conta) throw new Error("conta_nao_encontrada");
    return { ok: true, acao: p.acao, publicacoes: await d.publicacoes(p.contaId) };
  }
  const urlBase = process.env.AUTOMACOES_BASE_URL?.trim() ?? "";
  let webhookUrl = null;
  if (urlBase) {
    try {
      const u = new URL(urlBase);
      if (u.protocol === "https:" && u.username === "" && u.password === "") webhookUrl = new URL("/api/automacoes/webhook", u).toString();
    } catch {
    }
  }
  const secrets = Boolean(process.env.AUTOMACOES_WEBHOOK_SECRET?.trim()), key = Boolean(process.env.ZERNIO_API_KEY?.trim());
  const webhooks = key && webhookUrl ? await d.webhooks() : [];
  const webhookRegistrado = Boolean(webhookUrl && webhooks.some((w) => w?.url === webhookUrl && w?.isActive !== false));
  const situacao = { chaveConfigurada: key, segredoConfigurado: secrets, webhookRegistrado, webhookUrl };
  if (p.acao === "situacao") return { ok: true, acao: p.acao, situacao };
  if (!webhookUrl || !secrets || !key) throw new Error("configuracao_incompleta");
  await d.registrar(webhookUrl, process.env.AUTOMACOES_WEBHOOK_SECRET.trim());
  return { ok: true, acao: p.acao, situacao: { ...situacao, webhookRegistrado: true } };
}
async function executarPainel(req, res, dependencias) {
  if (req.method !== "POST") return responder(res, 405, { erro: "Use POST." });
  const raw = req.headers.authorization, auth = Array.isArray(raw) ? raw[0] : raw;
  const token = auth?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) return responder(res, 401, { erro: "Sess\xE3o ausente." });
  let d;
  try {
    d = dependencias ?? padrao();
  } catch {
    return responder(res, 503, { erro: "Supabase n\xE3o configurado." });
  }
  const { data, error } = await d.anon.auth.getUser(token);
  if (error || !data.user) return responder(res, 401, { erro: "Sess\xE3o inv\xE1lida ou expirada." });
  const agora = d.agora?.() ?? Date.now();
  if (!dentroDoLimite(data.user.id, agora)) return responder(res, 429, { erro: "Limite tempor\xE1rio atingido." });
  let body = req.body;
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString("utf8"));
    } catch {
      return responder(res, 400, { erro: "Pedido inv\xE1lido." });
    }
  }
  const pedido = pedidoDoBody(body);
  if (!pedido) return responder(res, 400, { erro: "A\xE7\xE3o inv\xE1lida." });
  const papel = await d.admin.from("radar_papeis").select("papel").eq("user_id", data.user.id).maybeSingle();
  if (papel.error) return responder(res, 503, { erro: "N\xE3o foi poss\xEDvel validar o acesso." });
  if (papel.data?.papel === "parceiro") return responder(res, 403, { erro: "Apenas o dono pode usar Automa\xE7\xF5es." });
  if (papel.data?.papel !== "dono") return responder(res, 403, { erro: "Acesso n\xE3o autorizado." });
  try {
    return responder(res, 200, await executar(pedido, data.user.id, d));
  } catch (e) {
    return responder(res, 502, { ok: false, erro: e instanceof Error && ["conta_nao_encontrada", "configuracao_incompleta"].includes(e.message) ? e.message : "N\xE3o foi poss\xEDvel concluir a a\xE7\xE3o.", ...e instanceof ZernioErro ? { codigo: erroCodigo(e) } : {} });
  }
}
var painel_default = executarPainel;
export {
  painel_default as default,
  executarPainel
};
