import type { Automacao, Evento } from "./tipos.ts";

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
}

export function casa(automacao: Automacao, evento: Evento): boolean {
  if (!automacao.contas.includes(evento.contaId) || !automacao.gatilhos.includes(evento.tipo)) return false;
  if (evento.tipo === "comentario" && automacao.posts.length && (!evento.postId || !automacao.posts.includes(evento.postId))) return false;
  if (!automacao.palavras.length) return true;
  const texto = normalizar(evento.texto ?? "");
  return automacao.palavras.some(p => {
    const palavra = normalizar(p);
    if (!palavra) return false;
    if (automacao.correspondencia === "exata") return texto === palavra;
    if (automacao.correspondencia === "contem") return texto.includes(palavra);
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaparRegex(palavra)}(?:$|[^\\p{L}\\p{N}])`, "u").test(texto);
  });
}

function escaparRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function escolher(automacoes: Automacao[], evento: Evento): Automacao | null {
  return automacoes.filter(a => a.ativa && casa(a, evento)).sort((a, b) =>
    especificidade(b, evento) - especificidade(a, evento) || Date.parse(b.atualizadaEm) - Date.parse(a.atualizadaEm)
  )[0] ?? null;
}

function especificidade(a: Automacao, evento: Evento) {
  return (evento.tipo === "comentario" && a.posts.includes(evento.postId ?? "") ? 4 : 0) + (a.palavras.length ? 2 : 0);
}
