/**
 * A régua da nota de 0 a 100. Fonte única: o agente lê por
 * `pnpm radar:lead -- criterios`, o scripts/lead.ts calcula com ela e o painel
 * mostra a conta lead a lead. Os pesos somam 100.
 *
 * Três blocos: o quanto o negócio precisa (necessidade), o quanto pode e
 * costuma investir (capacidade) e se dá para chegar em quem decide (acesso).
 */

import type { Servico, SituacaoSite } from "./tipos.ts";

/** O que a MF Services pode vender para o lead. */
export const SERVICOS: Record<Servico, string> = {
  site: "Site institucional",
  "landing-page": "Landing page",
  "pagina-de-vendas": "Página de vendas",
  vsl: "VSL",
  catalogo: "Catálogo",
  "loja-online": "Loja online",
};

export type Bloco = "necessidade" | "capacidade" | "acesso";

export type CriterioId =
  | "presenca_web"
  | "so_insta_whats"
  | "concorrente_melhor"
  | "investe_divulgacao"
  | "frequencia_posts"
  | "boas_avaliacoes"
  | "valor_agregado"
  | "crescimento"
  | "porte_ideal"
  | "decisor_identificado";

export type Criterio = {
  id: CriterioId;
  bloco: Bloco;
  nome: string;
  /** Pontuação máxima. */
  pontos: number;
  /** Quando conta como atendido, e que evidência o agente precisa trazer. */
  regra: string;
};

export const BLOCOS: Record<Bloco, string> = {
  necessidade: "Necessidade",
  capacidade: "Capacidade de investir",
  acesso: "Acesso a quem decide",
};

/** Pontos de `presenca_web` por situação do site. */
export const PONTOS_SITE: Record<SituacaoSite, number> = {
  "sem-site": 25,
  ruim: 20,
  mediano: 10,
  bom: 0,
};

export const NOMES_SITE: Record<SituacaoSite, string> = {
  "sem-site": "Sem site",
  ruim: "Site ruim",
  mediano: "Site mediano",
  bom: "Site bom",
};

export const CRITERIOS: Criterio[] = [
  {
    id: "presenca_web",
    bloco: "necessidade",
    nome: "Presença na web",
    pontos: 25,
    regra:
      "Sem site próprio (link da bio é WhatsApp, Linktree ou nada, e a busca pelo nome não acha domínio) = 25. " +
      "Site ruim (2 ou mais: não se adapta ao celular, lento, sem HTTPS, rodapé com ano antigo, fora do ar, visual amador) = 20. " +
      "Site mediano (1 problema) = 10. Site bom = 0. Evidência: saída do diagnóstico-site ou a busca feita.",
  },
  {
    id: "so_insta_whats",
    bloco: "necessidade",
    nome: "Vende só pelo Instagram ou WhatsApp",
    pontos: 10,
    regra: "Pedido, orçamento ou agendamento só pelo direct ou WhatsApp (\"chama no direct\", \"orçamento pelo whats\", catálogo nos destaques).",
  },
  {
    id: "concorrente_melhor",
    bloco: "necessidade",
    nome: "Concorrente com site melhor",
    pontos: 10,
    regra: "Concorrente direto, na mesma cidade e segmento, com site claramente melhor. Evidência: o site do concorrente.",
  },
  {
    id: "investe_divulgacao",
    bloco: "capacidade",
    nome: "Investe em divulgação",
    pontos: 10,
    regra: "Anúncio ativo na Biblioteca de Anúncios do Meta, ou foto e vídeo de produção profissional, ou parceria paga com influenciador.",
  },
  {
    id: "frequencia_posts",
    bloco: "capacidade",
    nome: "Posta com frequência",
    pontos: 5,
    regra: "8 posts ou mais nos últimos 30 dias (reels contam).",
  },
  {
    id: "boas_avaliacoes",
    bloco: "capacidade",
    nome: "Boas avaliações no Google",
    pontos: 10,
    regra: "Nota 4,5 ou mais com pelo menos 30 avaliações no Google. Evidência: link do Google Maps.",
  },
  {
    id: "valor_agregado",
    bloco: "capacidade",
    nome: "Serviço de valor agregado",
    pontos: 10,
    regra: "Ticket médio alto: clínica, estética, odontologia, advocacia, arquitetura, imobiliária, escola, turismo, evento, mentoria, curso, veículo.",
  },
  {
    id: "crescimento",
    bloco: "capacidade",
    nome: "Em crescimento",
    pontos: 10,
    regra: "Nova unidade, serviço novo, inauguração, contratando ou lançamento nos últimos 90 dias. Evidência: o post ou a notícia.",
  },
  {
    id: "porte_ideal",
    bloco: "acesso",
    nome: "Porte ideal",
    pontos: 5,
    regra: "Entre 1 mil e 100 mil seguidores: grande o bastante para pagar, pequeno o bastante para não ter agência.",
  },
  {
    id: "decisor_identificado",
    bloco: "acesso",
    nome: "Decisor identificado",
    pontos: 5,
    regra: "Nome do dono ou sócio aparece no perfil, no site ou nos posts.",
  },
];

/** Faixa da nota, para cor e filtro. */
export type Faixa = "quente" | "morno" | "frio";

export const FAIXAS: Record<Faixa, { nome: string; minimo: number }> = {
  quente: { nome: "Quente", minimo: 70 },
  morno: { nome: "Morno", minimo: 50 },
  frio: { nome: "Frio", minimo: 0 },
};

export function faixaDa(pontuacao: number): Faixa {
  if (pontuacao >= FAIXAS.quente.minimo) return "quente";
  if (pontuacao >= FAIXAS.morno.minimo) return "morno";
  return "frio";
}

/** Só entra lead que postou nos últimos 30 dias (pedido do Matheus em 2026-10-19). */
export const DIAS_ATIVO = 30;
