/**
 * Em que pé está cada lead. Desde 2026-10-23 mora em radar_funil no Supabase (o agente
 * que envia e lê as respostas precisa ver o mesmo que o painel), atrás desta
 * interface: quando for para o Supabase, troca o armazém e as telas ficam.
 */

/** novo → abordado (primeira enviada) → respondeu → previa (prévia da página enviada) → reuniao → proposta → fechado; descartado em qualquer ponto. */
export type Etapa = "novo" | "abordado" | "respondeu" | "previa" | "reuniao" | "proposta" | "fechado" | "descartado";

export const ETAPAS: Record<Etapa, string> = {
  novo: "Novo",
  abordado: "Abordado",
  respondeu: "Respondeu",
  previa: "Prévia enviada",
  reuniao: "Reunião",
  proposta: "Proposta",
  fechado: "Fechado",
  descartado: "Descartado",
};

export type Registro = {
  etapa: Etapa;
  anotacao: string;
  atualizadoEm: string;
  /** Cada mudança de etapa, da mais antiga para a mais nova. */
  historico?: { etapa: Etapa; em: string }[];
};

export type ArquivoFunil = { registros: Record<string, Registro> };

export const REGISTRO_VAZIO: Registro = { etapa: "novo", anotacao: "", atualizadoEm: "" };
