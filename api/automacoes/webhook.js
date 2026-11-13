// Gerado por pnpm build:api a partir de server/automacoes/. Não edite.

// server/automacoes/webhook.ts
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// shared/automacoes/casar.ts
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
}
function casa(automacao, evento) {
  if (!automacao.contas.includes(evento.contaId) || !automacao.gatilhos.includes(evento.tipo)) return false;
  if (evento.tipo === "comentario" && automacao.posts.length && (!evento.postId || !automacao.posts.includes(evento.postId))) return false;
  if (!automacao.palavras.length) return true;
  const texto = normalizar(evento.texto ?? "");
  return automacao.palavras.some((p) => {
    const palavra = normalizar(p);
    if (!palavra) return false;
    if (automacao.correspondencia === "exata") return texto === palavra;
    if (automacao.correspondencia === "contem") return texto.includes(palavra);
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaparRegex(palavra)}(?:$|[^\\p{L}\\p{N}])`, "u").test(texto);
  });
}
function escaparRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function escolher(automacoes, evento) {
  return automacoes.filter((a) => a.ativa && casa(a, evento)).sort(
    (a, b) => especificidade(b, evento) - especificidade(a, evento) || Date.parse(b.atualizadaEm) - Date.parse(a.atualizadaEm)
  )[0] ?? null;
}
function especificidade(a, evento) {
  return (evento.tipo === "comentario" && a.posts.includes(evento.postId ?? "") ? 4 : 0) + (a.palavras.length ? 2 : 0);
}

// shared/automacoes/linha.ts
function automacaoDaLinha(l) {
  return { id: l.id, nome: l.nome, ativa: l.ativa, contas: l.contas ?? [], gatilhos: l.gatilhos ?? [], posts: l.posts ?? [], palavras: l.palavras ?? [], correspondencia: l.correspondencia, respostasPublicas: l.respostas_publicas ?? [], mensagem: l.mensagem, botoes: l.botoes ?? [], criadaEm: l.criada_em, atualizadaEm: l.atualizada_em, versao: l.versao };
}

// shared/automacoes/mensagem.ts
function montarMensagem(modelo, { usuario }) {
  const nome = usuario?.trim().replace(/^@+/, "") ?? "";
  return modelo.replace(/@?\{usuario\}/g, nome ? `@${nome}` : "").replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

// server/automacoes/zernio.ts
import { createHmac, timingSafeEqual } from "node:crypto";
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
async function responderComentarioPrivado(accountId, postId, commentId, message, botoes, timeoutMs) {
  return requisitar(`/inbox/comments/${encodeURIComponent(postId)}/${encodeURIComponent(commentId)}/private-reply`, { method: "POST", timeoutMs, body: { accountId, message: message.slice(0, botoes.length ? 640 : 1e3), ...botoes.length ? { buttons: botoes.map((b) => ({ type: "url", title: b.titulo.slice(0, 20), url: b.url })) } : {} } });
}
async function responderComentarioPublico(accountId, postId, commentId, message, timeoutMs) {
  return requisitar(`/inbox/comments/${encodeURIComponent(postId)}`, { method: "POST", timeoutMs, body: { accountId, message, commentId }, headers: { "Idempotency-Key": `auto-${commentId}` } });
}
async function enviarDirect(accountId, conversationId, message, botoes, timeoutMs) {
  return requisitar(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", timeoutMs, body: { accountId, message: message.slice(0, botoes.length ? 640 : 1e3), ...botoes.length ? { buttons: botoes.map((b) => ({ type: "url", title: b.titulo.slice(0, 20), url: b.url })) } : {} } });
}
function assinaturaConfere(raw, signature, secret = process.env.AUTOMACOES_WEBHOOK_SECRET) {
  const header = Array.isArray(signature) ? signature[0] : signature;
  if (!secret?.trim() || !header || !/^[a-f0-9]{64}$/i.test(header)) return false;
  const esperado = createHmac("sha256", secret.trim()).update(raw).digest();
  return timingSafeEqual(esperado, Buffer.from(header, "hex"));
}

// server/automacoes/webhook.ts
var dbPadrao = () => {
  const url = process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_indisponivel");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};
var resposta = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
};
async function corpoCru(req) {
  const limite = 1e6;
  const blocos = [];
  let tamanho = 0;
  if (typeof req[Symbol.asyncIterator] === "function") {
    for await (const parte of req) {
      const b2 = Buffer.isBuffer(parte) ? parte : Buffer.from(parte);
      tamanho += b2.length;
      if (tamanho > limite) throw new Error("corpo_grande");
      blocos.push(b2);
    }
  }
  if (tamanho > 0) return Buffer.concat(blocos);
  const corpo = req.body;
  const b = Buffer.isBuffer(corpo) ? corpo : typeof corpo === "string" ? Buffer.from(corpo) : corpo && typeof corpo === "object" ? Buffer.from(JSON.stringify(corpo)) : Buffer.alloc(0);
  if (b.length > limite) throw new Error("corpo_grande");
  return b;
}
function statusDeErro(e) {
  if (e instanceof ZernioErro) return { situacao: /^(incerto_|rede_ou_timeout)/.test(e.codigo) ? "incerto" : "falhou", codigo: e.codigo.slice(0, 100) };
  return { situacao: "incerto", codigo: "falha_interna" };
}
async function processarAviso(aviso, dependencias) {
  if (!aviso || aviso.test || !["comment.received", "message.received"].includes(aviso.event ?? "") || aviso.account?.platform !== "instagram" || !aviso.account.id) return;
  const comentario = aviso.event === "comment.received" ? aviso.comment : void 0;
  const msg = aviso.event === "message.received" ? aviso.message : void 0;
  if (comentario && (comentario.platform !== "instagram" || comentario.author?.isOwnAccount)) return;
  if (msg && (msg.platform !== "instagram" || msg.direction !== "incoming" || msg.metadata?.standby || aviso.metadata?.standby || msg.metadata?.isStoryMention || aviso.metadata?.isStoryMention || msg.attachments?.some((a) => a.originalType === "story_mention"))) return;
  if (!comentario && !msg) return;
  const contaId = aviso.account.id;
  const tipo = comentario ? "comentario" : msg?.metadata?.storyReply || aviso.metadata?.storyReply ? "story" : "direct";
  const prazo = Date.now() + 4e3;
  const tempoRestante = () => {
    const restante = prazo - Date.now() - 100;
    if (restante <= 0) throw new ZernioErro("incerto_timeout");
    return restante;
  };
  const id = comentario?.id ?? msg?.platformMessageId;
  if (!id || id.length > 240 || comentario && !comentario.platformPostId) return;
  const evento = { id, contaId, automacaoId: null, tipo, usuario: comentario?.author?.username ?? msg?.sender?.username ?? null, texto: comentario?.text ?? msg?.text ?? null, postId: comentario?.platformPostId ?? null, situacao: "ignorado", erro: null, criadoEm: (/* @__PURE__ */ new Date()).toISOString() };
  const d = dependencias ?? { db: dbPadrao(), enviarDirect, responderComentarioPrivado, responderComentarioPublico };
  const { data: conta, error: erroConta } = await d.db.from("auto_contas").select("owner,ativa").eq("id", contaId).maybeSingle();
  if (erroConta || !conta?.ativa || !conta.owner) return;
  const owner = conta.owner;
  const criado = await d.db.from("auto_eventos").insert({ owner, id, conta_id: contaId, automacao_id: null, tipo, usuario: evento.usuario, texto: evento.texto, post_id: evento.postId, situacao: "ignorado", erro: null }).select("id").single();
  if (criado.error) {
    if (criado.error.code === "23505") return;
    throw new Error("evento_nao_registrado");
  }
  const atualizar = async (situacao, automacaoId = null, erro = null) => {
    await d.db.from("auto_eventos").update({ situacao, automacao_id: automacaoId, erro }).eq("owner", owner).eq("id", id);
  };
  try {
    const { data: linhas, error } = await d.db.from("auto_automacoes").select("*").eq("owner", owner).eq("ativa", true);
    if (error) throw new Error("automacoes_indisponiveis");
    const automacoes = (linhas ?? []).map((l) => automacaoDaLinha(l));
    const automacao = escolher(automacoes, evento);
    if (!automacao) {
      await atualizar("ignorado");
      return;
    }
    await atualizar("incerto", automacao.id);
    const mensagem = montarMensagem(automacao.mensagem, { usuario: evento.usuario });
    if (tipo === "comentario") {
      await d.responderComentarioPrivado(contaId, comentario.platformPostId, id, mensagem, automacao.botoes, tempoRestante());
      if (automacao.respostasPublicas.length) {
        const n = Number.parseInt(createHash("sha256").update(id).digest("hex").slice(0, 8), 16) % automacao.respostasPublicas.length;
        await d.responderComentarioPublico(contaId, comentario.platformPostId, id, automacao.respostasPublicas[n], tempoRestante());
      }
    } else {
      if (!msg?.conversationId) throw new ZernioErro("conversa_ausente");
      await d.enviarDirect(contaId, msg.conversationId, mensagem, automacao.botoes, tempoRestante());
    }
    await atualizar("enviado", automacao.id);
  } catch (e) {
    const falha = statusDeErro(e);
    await atualizar(falha.situacao, void 0, falha.codigo);
  }
}
async function handler(req, res) {
  if (req.method !== "POST") return resposta(res, 405, { erro: "Use POST." });
  let raw;
  try {
    raw = await corpoCru(req);
  } catch {
    return resposta(res, 413, { erro: "Corpo inv\xE1lido." });
  }
  if (!assinaturaConfere(raw, req.headers["x-zernio-signature"])) return resposta(res, 401, { erro: "Assinatura inv\xE1lida." });
  let aviso;
  try {
    aviso = JSON.parse(raw.toString("utf8"));
  } catch {
    return resposta(res, 400, { erro: "JSON inv\xE1lido." });
  }
  try {
    await processarAviso(aviso);
    return resposta(res, 200, { ok: true });
  } catch {
    return resposta(res, 503, { erro: "Evento n\xE3o processado." });
  }
}
var config = { api: { bodyParser: false } };
export {
  config,
  corpoCru,
  handler as default,
  processarAviso
};
