import { CRITERIOS, PONTOS_SITE, type Criterio } from "./criterios.ts";
import type { Avaliacao, Lead } from "./tipos.ts";

export type Parcela = {
  criterio: Criterio;
  avaliacao?: Avaliacao;
  obtidos: number;
};

/**
 * Pontos de um critério. Sem evidência e fonte não pontua: a nota tem de
 * poder ser conferida por quem abrir o link.
 */
export function pontosDe(criterio: Criterio, avaliacao: Avaliacao | undefined): number {
  if (!avaliacao?.ok || !avaliacao.evidencia?.trim() || !avaliacao.fonte?.trim()) return 0;
  if (criterio.id === "presenca_web") return avaliacao.nivel ? PONTOS_SITE[avaliacao.nivel] : 0;
  return criterio.pontos;
}

export function detalharPontuacao(criterios: Lead["criterios"]): Parcela[] {
  return CRITERIOS.map((criterio) => {
    const avaliacao = criterios[criterio.id];
    return { criterio, avaliacao, obtidos: pontosDe(criterio, avaliacao) };
  });
}

export function calcularPontuacao(criterios: Lead["criterios"]): number {
  return detalharPontuacao(criterios).reduce((soma, parcela) => soma + parcela.obtidos, 0);
}
