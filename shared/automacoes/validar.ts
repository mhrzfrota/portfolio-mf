import { LIMITES, type AutomacaoRascunho, type Botao, type Correspondencia, type Gatilho } from "./tipos.ts";

const gatilhosValidos = new Set<Gatilho>(["comentario", "direct", "story"]);
const correspondenciasValidas = new Set<Correspondencia>(["contem", "palavra", "exata"]);
const texto = (x: unknown, max: number) => typeof x === "string" && x.trim().length <= max;
const listaTexto = (x: unknown, maxItens: number, maxTexto: number) => Array.isArray(x) && x.length <= maxItens && x.every(v => texto(v, maxTexto));

export function validarRascunho(x: unknown): { ok: true; valor: AutomacaoRascunho } | { ok: false; erros: string[] } {
  const erros: string[] = [];
  if (!x || typeof x !== "object" || Array.isArray(x)) return { ok: false, erros: ["Automação inválida."] };
  const v = x as Record<string, unknown>;
  if (!texto(v.nome, LIMITES.nome) || !String(v.nome).trim()) erros.push("Nome inválido.");
  if (typeof v.ativa !== "boolean") erros.push("Estado da automação inválido.");
  if (!Array.isArray(v.contas) || v.contas.length === 0 || v.contas.some(a => typeof a !== "string" || !a.trim() || a.length > 200)) erros.push("Selecione ao menos uma conta.");
  if (!Array.isArray(v.gatilhos) || !v.gatilhos.length || v.gatilhos.some(g => !gatilhosValidos.has(g as Gatilho))) erros.push("Selecione gatilhos válidos.");
  if (!listaTexto(v.posts, LIMITES.posts, 200) || (Array.isArray(v.posts) && v.posts.some((p: unknown) => typeof p !== "string" || !p.trim()))) erros.push("Lista de publicações inválida.");
  if (!listaTexto(v.palavras, LIMITES.palavras, LIMITES.palavra) || (Array.isArray(v.palavras) && v.palavras.some((p: unknown) => typeof p !== "string" || !p.trim()))) erros.push("Lista de palavras inválida.");
  if (!correspondenciasValidas.has(v.correspondencia as Correspondencia)) erros.push("Correspondência inválida.");
  if (!listaTexto(v.respostasPublicas, LIMITES.respostasPublicas, LIMITES.respostaPublica)) erros.push("Respostas públicas inválidas.");
  if (typeof v.mensagem !== "string" || v.mensagem.length > LIMITES.mensagem) erros.push("Mensagem inválida.");
  if (!Array.isArray(v.botoes) || v.botoes.length > LIMITES.botoes || v.botoes.some(b => {
    if (!b || typeof b !== "object") return true;
    const botao = b as Botao;
    if (!texto(botao.titulo, LIMITES.botaoTitulo) || !botao.titulo.trim() || !texto(botao.url, 2048)) return true;
    try { const url = new URL(botao.url); return url.protocol !== "https:" || !url.hostname || Boolean(url.username || url.password); } catch { return true; }
  })) erros.push("Botões inválidos. Use título curto e URL HTTPS.");
  if (erros.length) return { ok: false, erros };
  const palavras = [...new Set((v.palavras as string[]).map(p => p.trim()).filter(Boolean))];
  const respostasPublicas = (v.respostasPublicas as string[]).map(s => s.trim()).filter(Boolean);
  return { ok: true, valor: {
    nome: (v.nome as string).trim(), ativa: v.ativa as boolean,
    contas: [...new Set((v.contas as string[]).map(s => s.trim()))],
    gatilhos: [...new Set(v.gatilhos as Gatilho[])],
    posts: [...new Set((v.posts as string[]).map(s => s.trim()))], palavras,
    correspondencia: v.correspondencia as Correspondencia,
    respostasPublicas, mensagem: v.mensagem as string,
    botoes: (v.botoes as Botao[]).map(b => ({ titulo: b.titulo.trim(), url: b.url.trim() })),
  } };
}
