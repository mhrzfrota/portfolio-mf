import type { Automacao, AutomacaoRascunho, Conta, Evento } from "./tipos.ts";

export function automacaoDaLinha(l: Record<string, any>): Automacao {
  return { id: l.id, nome: l.nome, ativa: l.ativa, contas: l.contas ?? [], gatilhos: l.gatilhos ?? [], posts: l.posts ?? [], palavras: l.palavras ?? [], correspondencia: l.correspondencia, respostasPublicas: l.respostas_publicas ?? [], mensagem: l.mensagem, botoes: l.botoes ?? [], criadaEm: l.criada_em, atualizadaEm: l.atualizada_em, versao: l.versao };
}
export function automacaoParaLinha(a: AutomacaoRascunho, owner: string, id?: string, versao?: number) {
  return { ...(id ? { id } : {}), owner, nome: a.nome, ativa: a.ativa, contas: a.contas, gatilhos: a.gatilhos, posts: a.posts, palavras: a.palavras, correspondencia: a.correspondencia, respostas_publicas: a.respostasPublicas, mensagem: a.mensagem, botoes: a.botoes, ...(versao ? { versao } : {}) };
}
export function contaDaLinha(l: Record<string, any>): Conta {
  return { id: l.id, usuario: l.usuario, nome: l.nome, foto: l.foto, ativa: l.ativa, sincronizadaEm: l.sincronizada_em };
}
export function eventoDaLinha(l: Record<string, any>): Evento {
  return { id: l.id, contaId: l.conta_id, automacaoId: l.automacao_id, tipo: l.tipo, usuario: l.usuario, texto: l.texto, postId: l.post_id, situacao: l.situacao, erro: l.erro, criadoEm: l.criado_em };
}
