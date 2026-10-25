/**
 * Contrato do Radar. O agente grava leads neste formato em radar_leads no Supabase
 * (pelo scripts/lead.ts, que valida e tira duplicado) e o painel lê o mesmo
 * arquivo. Mudou aqui, muda nos dois lados.
 */

import type { CriterioId } from "./criterios.ts";

export type Servico = "site" | "landing-page" | "pagina-de-vendas" | "vsl" | "catalogo" | "loja-online";

/** Como está a presença na web: decide os pontos do critério `presenca_web`. */
export type SituacaoSite = "sem-site" | "ruim" | "mediano" | "bom";

/** Um critério avaliado. Só pontua com `ok: true`, `evidencia` e `fonte`. */
export type Avaliacao = {
  ok: boolean;
  /** O fato observado, verificável por quem abrir a fonte. Ex.: "Link da bio é wa.me, sem domínio próprio". */
  evidencia: string;
  /** URL onde a evidência pode ser conferida (perfil, post, site, Google Maps, Biblioteca de Anúncios). */
  fonte?: string;
  /** Só em `presenca_web`. */
  nivel?: SituacaoSite;
};

/** Sinais objetivos do scripts/diagnostico-site.ts. */
export type DiagnosticoSite = {
  url: string;
  urlFinal?: string;
  /** Código HTTP final; ausente quando o domínio não respondeu. */
  status?: number;
  https: boolean;
  /** Tempo até a resposta, em milissegundos. */
  tempoRespostaMs?: number;
  /** Tamanho do HTML, em KB. */
  tamanhoHtmlKb?: number;
  viewport: boolean;
  titulo?: string;
  descricao?: string;
  /** Wix, WordPress, Linktree, Google Sites... quando dá para identificar. */
  plataforma?: string;
  /** Maior ano de copyright encontrado no HTML. */
  anoCopyright?: number;
  jquery?: string;
  temWhatsapp: boolean;
  temFormulario: boolean;
  /** Pixel do Meta, Google Analytics ou Tag Manager: sinal de que investe em anúncio. */
  rastreamento: string[];
  /** PageSpeed mobile (0 a 100), quando rodou com --psi. */
  pagespeedMobile?: number;
  /** Frases prontas em PT-BR, uma por problema. */
  problemas: string[];
  situacaoSugerida: SituacaoSite;
  analisadoEm: string;
};

export type Concorrente = {
  nome: string;
  site: string;
  /** Por que o site dele é melhor, em uma frase. */
  observacao: string;
};

export type Lead = {
  /** Slug do @ do Instagram, sem o @. Ex.: "clinicabela.ce". */
  id: string;
  nome: string;
  segmento: string;
  cidade: string;
  /** Sigla da UF, maiúscula. */
  uf: string;
  instagram: {
    usuario: string;
    seguidores?: number;
    /** Data do post mais recente (fora os fixados), AAAA-MM-DD. */
    ultimoPost: string;
    postsUltimos30Dias?: number;
    linkBio?: string;
    bio?: string;
  };
  site: {
    url?: string;
    diagnostico?: DiagnosticoSite;
  };
  google?: {
    nota?: number;
    avaliacoes?: number;
    url?: string;
  };
  contato: {
    whatsapp?: string;
    telefone?: string;
    email?: string;
  };
  /** Dono ou sócio, quando aparece no perfil ou no site. */
  decisor?: string;
  problemas: string[];
  oportunidade: string;
  servicos: Servico[];
  criterios: Record<CriterioId, Avaliacao>;
  concorrentes?: Concorrente[];
  abordagem: {
    canal: "whatsapp" | "instagram" | "email";
    mensagem: string;
    followup?: string;
  };
  /** Calculada pelo scripts/lead.ts a partir dos critérios. Não escrever à mão. */
  pontuacao: number;
  analisadoEm: string;
  fontes: string[];
};

/** Analisado e recusado: fica registrado para o agente não analisar de novo. */
export type Descartado = {
  instagram: string;
  nome?: string;
  cidade?: string;
  uf?: string;
  site?: string;
  telefone?: string;
  motivo: string;
  data: string;
};

export type ArquivoLeads = { leads: Lead[] };
export type ArquivoDescartados = { descartados: Descartado[] };

/* ------------------------------------------------------------------------
 * Fila de envio (2026-10-23). O Matheus aprova no painel; o agente envia pelo
 * Direct do @emefeservices (Chrome logado), dentro dos limites do config.
 * Ideias trazidas do Harvey: cliente ideal num arquivo, fila de aprovação,
 * limite por dia, pausa geral e lista de quem não quer receber.
 * ---------------------------------------------------------------------- */

/** rascunho → aprovado | reprovado; aprovado → enviando → enviado | falhou; falhou → aprovado; qualquer um antes de enviado → cancelado. */
export type StatusEnvio = "rascunho" | "aprovado" | "reprovado" | "enviando" | "enviado" | "falhou" | "cancelado";

/** primeira: a mensagem que abre a conversa. followup: uma só, se não responder em `followupDias`. */
export type TipoEnvio = "primeira" | "followup";

export type Envio = {
  /** `${leadId}:${tipo}`. Um lead tem no máximo uma primeira e um followup. */
  id: string;
  leadId: string;
  canal: "instagram";
  /** @ do Instagram do lead, sem o @. */
  destino: string;
  tipo: TipoEnvio;
  mensagem: string;
  status: StatusEnvio;
  criadoEm: string;
  /** Quando foi aprovado ou reprovado. */
  decididoEm?: string;
  motivoReprova?: string;
  /** followup: não sai antes desta data (ISO). */
  agendadoPara?: string;
  enviadoEm?: string;
  /** Última falha ao enviar (perfil sem botão de mensagem, Direct bloqueado...). */
  erro?: string;
};

/** Pediu para não receber mais ou não deve ser abordado: vale para sempre. */
export type Bloqueado = {
  instagram: string;
  motivo: string;
  data: string;
};

/** Perfil do cliente ideal e regras de envio (radar_config no Supabase). Lido pelo /prospectar, pelo /enviar e pelo painel. */
export type ConfigRadar = {
  clienteIdeal: {
    /** Quem é, em uma frase. */
    descricao: string;
    nichos: string[];
    regioes: string[];
    /** O que faz um lead ser bom (sinais que o agente procura). */
    sinais: string[];
    /** Quem não entra. */
    fora: string[];
  };
  oferta: {
    /** O que a primeira mensagem oferece, sem vender. */
    primeira: string;
    /** Dias sem resposta até o followup ficar pronto para aprovar. */
    followupDias: number;
  };
  envio: {
    canal: "instagram";
    /** Conta que envia, sem o @. */
    conta: string;
    limiteDiario: number;
    /** Espera entre um Direct e outro, em segundos (sorteada entre os dois). */
    intervaloMinSeg: number;
    intervaloMaxSeg: number;
    /** Janela de envio no horário de Fortaleza, "HH:MM". */
    janela: { inicio: string; fim: string };
    /** Só de segunda a sexta. */
    soDiasUteis: boolean;
    /** Pausa geral: nada sai enquanto estiver true. */
    pausado: boolean;
    /** Nota mínima para o painel sugerir a fila. */
    notaMinima: number;
  };
};

export type ArquivoEnvios = { envios: Envio[] };
export type ArquivoBloqueados = { bloqueados: Bloqueado[] };
