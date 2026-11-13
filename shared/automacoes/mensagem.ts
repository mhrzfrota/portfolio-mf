export function montarMensagem(modelo: string, { usuario }: { usuario: string | null | undefined }): string {
  const nome = usuario?.trim().replace(/^@+/, "") ?? "";
  return modelo.replace(/@?\{usuario\}/g, nome ? `@${nome}` : "").replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}
