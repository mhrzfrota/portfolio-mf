export type ModoBusca = "rapida" | "completa";
export type StatusBusca = "pendente" | "rodando" | "concluida" | "falhou";
export const LIMITES_BUSCA: Record<
  ModoBusca,
  { quantidade: number; porDia: number }
> = {
  rapida: { quantidade: 10, porDia: 5 },
  completa: { quantidade: 15, porDia: 2 },
};
export type BuscaRadar = {
  id: string;
  owner?: string;
  modo: ModoBusca;
  nicho: string;
  regiao: string;
  quantidade: number;
  status: StatusBusca;
  resultado?: Record<string, unknown>;
  erro?: string;
  criado_em: string;
  atualizado_em: string;
};
export function validarPedidoBusca(modo: ModoBusca, entrada: unknown) {
  const x = entrada as Record<string, unknown>;
  const nicho = typeof x?.nicho === "string" ? x.nicho.trim() : "";
  const regiao = typeof x?.regiao === "string" ? x.regiao.trim() : "";
  const quantidade = Number(x?.quantidade);
  if (nicho.length < 2 || nicho.length > 100)
    throw new Error("Nicho deve ter entre 2 e 100 caracteres.");
  if (regiao.length < 2 || regiao.length > 120)
    throw new Error("Região deve ter entre 2 e 120 caracteres.");
  if (
    !Number.isSafeInteger(quantidade) ||
    quantidade < 1 ||
    quantidade > LIMITES_BUSCA[modo].quantidade
  )
    throw new Error(
      `Quantidade deve ficar entre 1 e ${LIMITES_BUSCA[modo].quantidade}.`
    );
  return { modo, nicho, regiao, quantidade };
}
export function dentroDoLimiteDiario(modo: ModoBusca, usadas: number) {
  return usadas < LIMITES_BUSCA[modo].porDia;
}
