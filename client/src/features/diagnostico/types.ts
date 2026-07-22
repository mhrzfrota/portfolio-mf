/**
 * Tipos do MF Diagnóstico IA.
 *
 * O contrato central é `DiagnosticoProvider`: hoje o app usa um provider de
 * regras locais (`engine.ts`), mas qualquer backend de IA que devolva um
 * `DiagnosticoReport` pode ser plugado sem tocar na interface.
 */

export type Objetivo = "vendas" | "leads" | "autoridade" | "organizacao";

export const OBJETIVOS: Array<{ id: Objetivo; label: string; hint: string }> = [
  { id: "vendas", label: "Vendas", hint: "Vender mais pelo digital" },
  { id: "leads", label: "Leads", hint: "Gerar contatos qualificados" },
  { id: "autoridade", label: "Autoridade", hint: "Ser referência no segmento" },
  {
    id: "organizacao",
    label: "Organização",
    hint: "Organizar processos e dados",
  },
];

export type DiagnosticoInput = {
  empresa: string;
  segmento: string;
  /** URL ou domínio; vazio = negócio ainda sem site. */
  site: string;
  /** Handle do Instagram ou descrição livre do perfil. */
  instagram: string;
  objetivo: Objetivo;
};

export type PilarId =
  | "posicionamento"
  | "presenca"
  | "conversao"
  | "autoridade"
  | "automacao";

export type PilarScore = {
  id: PilarId;
  label: string;
  /** 0 a 100. */
  score: number;
  resumo: string;
};

export type Severidade = "critico" | "atencao";

export type Problema = {
  pilar: PilarId;
  severidade: Severidade;
  titulo: string;
  detalhe: string;
};

export type Oportunidade = {
  titulo: string;
  detalhe: string;
};

export type Recomendacao = {
  pilar: PilarId;
  titulo: string;
  detalhe: string;
};

export type Automacao = {
  titulo: string;
  detalhe: string;
};

export type PlanoDia = {
  dia: number;
  foco: string;
  acoes: string[];
};

export type DiagnosticoReport = {
  input: DiagnosticoInput;
  notaGeral: number;
  pilares: PilarScore[];
  problemas: Problema[];
  oportunidades: Oportunidade[];
  recomendacoes: Recomendacao[];
  propostaDeValor: string;
  headline: string;
  ideiasDeConteudo: string[];
  automacoes: Automacao[];
  plano7Dias: PlanoDia[];
};

export interface DiagnosticoProvider {
  analyze(input: DiagnosticoInput): Promise<DiagnosticoReport>;
}
