/**
 * Esconde credenciais antes de qualquer texto ir para os agentes, o log ou o
 * relatório. Prefixos conhecidos, JWT, chave de acesso AWS e, no genérico,
 * só sequência de alta entropia (maiúscula, minúscula e número juntos, sem
 * separador): slug de link ("react-19-2-released-with-...") e hash de commit
 * não são segredo e precisam sobreviver, senão os links das notícias quebram.
 */
export function ocultarSegredos(texto: string): string {
  return texto
    .replace(/(?:sk-|sk_(?:live|test)_|rk_(?:live|test)_|sb_secret_|sbp_|ghp_|gho_|github_pat_|xox[a-z]*-)[A-Za-z0-9_-]+/gi, "[oculto]")
    .replace(/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[oculto]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[oculto]")
    .replace(/\b(?=[A-Za-z0-9]*[a-z])(?=[A-Za-z0-9]*[A-Z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{32,}\b/g, "[oculto]");
}
