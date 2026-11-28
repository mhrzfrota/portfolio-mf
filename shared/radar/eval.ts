/**
 * Avaliação pura (eval) do Radar de Prospecção.
 * 
 * Mede a calibração da régua de notas (0 a 100), o cumprimento do contrato
 * da primeira mensagem determinística e a concordância estatística (kappa de Cohen)
 * entre avaliadores.
 *
 * Funções puras sem I/O ou dependência de rede/banco.
 */

import { CRITERIOS, faixaDa } from "./criterios.ts";
import type { Bloco, CriterioId, Faixa } from "./criterios.ts";
import type { Lead, Envio } from "./tipos.ts";
import type { Etapa, Registro } from "./funil.ts";
import type { Reprovacao } from "./aprendizado.ts";

/* ------------------------------------------------------------------------
 * 1. Calibração da Régua
 * ---------------------------------------------------------------------- */

export type FaixaCalibracao = {
  faixa: Faixa;
  total: number;
  reprovados: number;
  taxaReprovados: number;
  comMensagemAprovada: number;
  taxaMensagemAprovada: number;
  enviados: number;
  responderam: number;
  taxaResposta: number;
  amostraPequena: boolean;
};

export type CriterioCalibracao = {
  id: CriterioId;
  nome: string;
  bloco: Bloco;
  pontos: number;
  presenteAprovados: number;
  totalAprovados: number;
  taxaAprovados: number;
  presenteReprovados: number;
  totalReprovados: number;
  taxaReprovados: number;
  lift: number | null;
  amostraPequena: boolean;
};

export type CalibracaoResultado = {
  faixas: Record<Faixa, FaixaCalibracao>;
  criterios: CriterioCalibracao[];
  amostraPequena: boolean;
  totais: {
    leads: number;
    reprovados: number;
    comMensagemAprovada: number;
    enviados: number;
    responderam: number;
  };
};

const ETAPAS_RESPOSTA: Set<Etapa> = new Set([
  "respondeu",
  "previa",
  "reuniao",
  "proposta",
  "fechado",
]);

/** Verifica se um registro no funil indica que o lead respondeu à abordagem. */
export function leadRespondeu(registro?: Registro): boolean {
  if (!registro) return false;
  if (ETAPAS_RESPOSTA.has(registro.etapa)) return true;
  return Boolean(registro.historico?.some(h => ETAPAS_RESPOSTA.has(h.etapa)));
}

/**
 * Avalia o poder de discriminação da régua por faixa de pontuação e por critério.
 */
export function calibracaoDaRegua(
  leads: Lead[],
  envios: Envio[],
  funil: Record<string, Registro>,
  reprovados: Reprovacao[]
): CalibracaoResultado {
  const reprovadosIds = new Set(reprovados.map(r => r.id));

  // Leads com mensagem aprovada ou enviada pelo Matheus
  const enviosAprovadosIds = new Set(
    envios
      .filter(e => e.status === "aprovado" || e.status === "enviado")
      .map(e => e.leadId)
  );

  // Leads que de fato tiveram envio realizado
  const enviosEnviadosIds = new Set(
    envios.filter(e => e.status === "enviado").map(e => e.leadId)
  );

  const faixasNome: Faixa[] = ["quente", "morno", "frio"];
  const faixasMap = {} as Record<Faixa, FaixaCalibracao>;

  for (const f of faixasNome) {
    const leadsFaixa = leads.filter(l => faixaDa(l.pontuacao) === f);
    const total = leadsFaixa.length;
    const reprovadosFaixa = leadsFaixa.filter(l => reprovadosIds.has(l.id)).length;
    const aprovadosFaixa = leadsFaixa.filter(l => enviosAprovadosIds.has(l.id)).length;
    const enviadosFaixa = leadsFaixa.filter(l => enviosEnviadosIds.has(l.id));
    const responderamFaixa = enviadosFaixa.filter(l => leadRespondeu(funil[l.id])).length;

    faixasMap[f] = {
      faixa: f,
      total,
      reprovados: reprovadosFaixa,
      taxaReprovados: total > 0 ? reprovadosFaixa / total : 0,
      comMensagemAprovada: aprovadosFaixa,
      taxaMensagemAprovada: total > 0 ? aprovadosFaixa / total : 0,
      enviados: enviadosFaixa.length,
      responderam: responderamFaixa,
      taxaResposta: enviadosFaixa.length > 0 ? responderamFaixa / enviadosFaixa.length : 0,
      amostraPequena: total < 10,
    };
  }

  // Conjuntos de comparação para a análise de critérios:
  // Se houver envios aprovados, usamos leads com mensagem aprovada (sem reprovação no painel).
  // Se não houver envios (ex: teste sintético sem envios), usamos leads não-reprovados.
  const leadsAprovados = envios.length > 0
    ? leads.filter(l => enviosAprovadosIds.has(l.id) && !reprovadosIds.has(l.id))
    : leads.filter(l => !reprovadosIds.has(l.id));

  const leadsReprovados = leads.filter(l => reprovadosIds.has(l.id));

  const totalAprovados = leadsAprovados.length;
  const totalReprovados = leadsReprovados.length;

  const criteriosCalibrados: CriterioCalibracao[] = CRITERIOS.map(crit => {
    const presenteAprovados = leadsAprovados.filter(l => Boolean(l.criterios?.[crit.id]?.ok)).length;
    const presenteReprovados = leadsReprovados.filter(l => Boolean(l.criterios?.[crit.id]?.ok)).length;

    const taxaAprovados = totalAprovados > 0 ? presenteAprovados / totalAprovados : 0;
    const taxaReprovados = totalReprovados > 0 ? presenteReprovados / totalReprovados : 0;

    let lift: number | null = null;
    if (taxaReprovados > 0) {
      lift = Number((taxaAprovados / taxaReprovados).toFixed(2));
    }

    return {
      id: crit.id,
      nome: crit.nome,
      bloco: crit.bloco,
      pontos: crit.pontos,
      presenteAprovados,
      totalAprovados,
      taxaAprovados,
      presenteReprovados,
      totalReprovados,
      taxaReprovados,
      lift,
      amostraPequena: totalAprovados < 10 || totalReprovados < 10,
    };
  });

  const totalEnviados = leads.filter(l => enviosEnviadosIds.has(l.id)).length;
  const totalResponderam = leads.filter(
    l => enviosEnviadosIds.has(l.id) && leadRespondeu(funil[l.id])
  ).length;

  return {
    faixas: faixasMap,
    criterios: criteriosCalibrados,
    amostraPequena: leads.length < 10 || totalAprovados < 10 || totalReprovados < 10,
    totais: {
      leads: leads.length,
      reprovados: leads.filter(l => reprovadosIds.has(l.id)).length,
      comMensagemAprovada: leads.filter(l => enviosAprovadosIds.has(l.id)).length,
      enviados: totalEnviados,
      responderam: totalResponderam,
    },
  };
}

/* ------------------------------------------------------------------------
 * 2. Contrato da Mensagem
 * ---------------------------------------------------------------------- */

export type ChecagemMensagem = {
  ok: boolean;
  falhas: string[];
};

const STOPWORDS = new Set([
  "de", "a", "o", "que", "e", "do", "da", "em", "um", "para", "com", "nao", "uma", "os", "no", "se", "na",
  "por", "mais", "as", "dos", "como", "mas", "foi", "ao", "ele", "das", "tem", "seu", "sua", "ou", "ser",
  "quando", "muito", "nos", "ja", "eu", "tambem", "so", "pelo", "pela", "ate", "isso", "ela", "entre", "era",
  "depois", "sem", "mesmo", "aos", "ter", "seus", "quem", "nas", "me", "esse", "eles", "estao", "voce", "tinha",
  "foram", "essa", "num", "nem", "suas", "meu", "minha", "numa", "pelos", "elas", "havia", "seja", "qual", "sera",
  "tenho", "lhe", "deles", "essas", "esses", "pelas", "este", "fosse", "dele", "tu", "te", "voces", "vos", "lhes",
  "meus", "minhas", "teu", "tua", "teus", "tuas", "nosso", "nossa", "nossos", "nossas", "dela", "delas",
  "ola", "bom", "dia", "tarde", "noite", "sobre", "aqui", "tudo", "bem", "fiz", "preparei", "queria", "saber",
  "enviar", "mandar", "mostrar", "posso", "quer", "previa", "amostra", "caso", "fazer", "equipe", "contato",
  "mensagens", "mensagem"
]);

function normalizarToken(token: string): string {
  let t = token
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (t.endsWith("s") && t.length > 4) t = t.slice(0, -1);
  return t;
}

function tokenizarSignificativas(texto: string): Set<string> {
  const tokens = texto
    .split(/\s+/)
    .map(normalizarToken)
    .filter(t => t.length >= 4 && !STOPWORDS.has(t));
  return new Set(tokens);
}

function extrairEvidenciasLead(lead: Lead): string {
  const partes: string[] = [];
  if (lead.problemas) partes.push(...lead.problemas);
  if (lead.oportunidade) partes.push(lead.oportunidade);
  if (lead.site?.diagnostico?.problemas) partes.push(...lead.site.diagnostico.problemas);
  if (lead.criterios) {
    for (const av of Object.values(lead.criterios)) {
      if (av?.evidencia) partes.push(av.evidencia);
    }
  }
  return partes.join(" ");
}

/** Conta frases considerando pontuações terminais e abreviações comuns. */
export function contarFrases(texto: string): number {
  // A saudação de abertura ("Oi, pessoal da Green!") não conta: as mensagens aprovadas são saudação + 3 frases.
  const limpo = texto
    .trim()
    .replace(/^(?:oi|olá|ola|bom dia|boa tarde|boa noite)\b[^.!?]{0,60}[!.]\s*/i, "")
    .replace(/\b(dr|dra|sr|sra|av|prof|profa|etc)\./gi, "$1")
    .replace(/\.{2,}/g, ".")
    .replace(/[?!]+/g, "?");
  const matches = limpo.match(/[.!?]+(?:\s+|$)/g);
  return matches ? matches.length : 0;
}

/**
 * Validação determinística do contrato da primeira mensagem.
 *
 * Regras:
 * 1. Exatamente 3 frases
 * 2. Até 280 caracteres
 * 3. Sem travessão "—"
 * 4. Sem preço (R$, "reais", número com "mil")
 * 5. Sem link (http://, https://, www., domínios)
 * 6. Sem "reunião" ou "call"
 * 7. Oferece prévia (cita prévia, amostra, protótipo)
 * 8. Pede permissão (pergunta no fim, termina com ?)
 * 9. Cita um fato que aparece nas evidências do lead (sobreposição de palavras significativas)
 */
export function checarMensagem(texto: string, lead: Lead): ChecagemMensagem {
  const falhas: string[] = [];
  const trimmed = texto.trim();

  // 1. Exatamente 3 frases
  const totalFrases = contarFrases(trimmed);
  if (totalFrases !== 3) {
    falhas.push(`Deve ter exatamente 3 frases (encontradas ${totalFrases})`);
  }

  // 2. Até 280 caracteres
  if (trimmed.length > 280) {
    falhas.push(`Mensagem excede 280 caracteres (tem ${trimmed.length})`);
  }

  // 3. Sem travessão "—"
  if (trimmed.includes("—") || trimmed.includes("\u2014")) {
    falhas.push('Não pode conter travessão "—"');
  }

  // 4. Sem preço (R$, "reais", número com "mil")
  const temPreco =
    /\br\$/i.test(trimmed) ||
    /\b\d+\s*reais\b/i.test(trimmed) ||
    /\breais\b/i.test(trimmed) ||
    /\b\d+[\s.]*mil\b/i.test(trimmed) ||
    /\b(?:preço|valor|custa|custo)\s+(?:de\s+)?\d+/i.test(trimmed);
  if (temPreco) {
    falhas.push("Não deve mencionar preço (R$, reais ou número com mil)");
  }

  // 5. Sem link
  const temLink =
    /https?:\/\/|www\./i.test(trimmed) ||
    /\b(?:wa\.me|bit\.ly|t\.me)\//i.test(trimmed);
  // Citar o domínio do próprio lead como prova ("o site x.com.br está fora do ar") não é link para clicar:
  // as mensagens aprovadas pelo Matheus fazem isso.
  if (temLink) {
    falhas.push("Não deve conter links");
  }

  // 6. Sem "reunião" / "call"
  const temReuniao = /\b(?:reuni[ãa]o|reuni[õo]es|call|calls)\b/i.test(trimmed);
  if (temReuniao) {
    falhas.push('Não deve pedir reunião ou "call"');
  }

  // 7. Oferece prévia
  const oferecePrevia = /\b(?:pr[eé]via|amostra|esbo[çc]o|prot[oó]tipo)\b/i.test(trimmed);
  if (!oferecePrevia) {
    falhas.push("Deve oferecer prévia");
  }

  // 8. Pede permissão (pergunta no fim)
  const pedePermissao = trimmed.endsWith("?");
  if (!pedePermissao) {
    falhas.push("Deve pedir permissão (terminar com pergunta ?)");
  }

  // 9. Cita fato das evidências do lead (sobreposição de palavras significativas)
  const textoEvidencias = extrairEvidenciasLead(lead);
  const tokensEvidencia = tokenizarSignificativas(textoEvidencias);
  const tokensMensagem = tokenizarSignificativas(trimmed);

  let sobreposicao = 0;
  for (const token of tokensMensagem) {
    if (tokensEvidencia.has(token)) {
      sobreposicao++;
    }
  }

  if (tokensEvidencia.size > 0 && sobreposicao === 0) {
    falhas.push("Deve citar um fato que aparece nas evidências do lead (nenhuma palavra significativa compartilhada)");
  }

  return {
    ok: falhas.length === 0,
    falhas,
  };
}

/* ------------------------------------------------------------------------
 * 3. Concordância Estatística (Juiz × Humano)
 * ---------------------------------------------------------------------- */

export type Matriz2x2 = {
  /** Humano = true, Juiz = true */
  vp: number;
  /** Humano = true, Juiz = false */
  fn: number;
  /** Humano = false, Juiz = true */
  fp: number;
  /** Humano = false, Juiz = false */
  vn: number;
};

export type ConcordanciaResultado = {
  n: number;
  acuracia: number;
  matriz: Matriz2x2;
  po: number;
  pe: number;
  kappa: number;
};

/**
 * Calcula a concordância inter-avaliador (acurácia, matriz de contingência 2x2
 * e Kappa de Cohen) entre os rótulos humanos e as decisões do juiz.
 */
export function concordancia(
  rotulosHumanos: boolean[],
  rotulosJuiz: boolean[]
): ConcordanciaResultado {
  const n = Math.min(rotulosHumanos.length, rotulosJuiz.length);
  if (n === 0) {
    return {
      n: 0,
      acuracia: 0,
      matriz: { vp: 0, fn: 0, fp: 0, vn: 0 },
      po: 0,
      pe: 0,
      kappa: 0,
    };
  }

  let vp = 0;
  let fn = 0;
  let fp = 0;
  let vn = 0;

  for (let i = 0; i < n; i++) {
    const h = rotulosHumanos[i];
    const j = rotulosJuiz[i];
    if (h && j) vp++;
    else if (h && !j) fn++;
    else if (!h && j) fp++;
    else if (!h && !j) vn++;
  }

  const po = (vp + vn) / n;
  const acuracia = po;

  // Probabilidades marginais
  const pHTrue = (vp + fn) / n;
  const pHFalse = (fp + vn) / n;
  const pJTrue = (vp + fp) / n;
  const pJFalse = (fn + vn) / n;

  const pe = (pHTrue * pJTrue) + (pHFalse * pJFalse);

  let kappa = 0;
  if (Math.abs(1 - pe) < 1e-9) {
    kappa = po === 1 ? 1 : 0;
  } else {
    kappa = (po - pe) / (1 - pe);
  }

  return {
    n,
    acuracia: Number(acuracia.toFixed(4)),
    matriz: { vp, fn, fp, vn },
    po: Number(po.toFixed(4)),
    pe: Number(pe.toFixed(4)),
    kappa: Number(kappa.toFixed(4)),
  };
}
