import type {
  Automacao,
  DiagnosticoInput,
  DiagnosticoProvider,
  DiagnosticoReport,
  Objetivo,
  Oportunidade,
  PilarId,
  PilarScore,
  PlanoDia,
  Problema,
  Recomendacao,
} from "./types";

/**
 * Motor de diagnóstico com regras locais.
 *
 * As notas são determinísticas: derivam dos campos preenchidos (site,
 * Instagram, objetivo) mais um "ruído" estável calculado por hash do nome +
 * segmento — a mesma empresa sempre recebe o mesmo relatório. O conteúdo
 * textual vem de bibliotecas por segmento (veículos, alimentação, moda...)
 * com fallback genérico.
 *
 * Para trocar por uma IA de verdade, basta implementar `DiagnosticoProvider`
 * chamando sua API e devolvendo um `DiagnosticoReport` — a UI não muda.
 */

export const PILAR_LABELS: Record<PilarId, string> = {
  posicionamento: "Posicionamento",
  presenca: "Presença digital",
  conversao: "Conversão",
  autoridade: "Autoridade",
  automacao: "Automação",
};

const PILAR_ORDEM: PilarId[] = [
  "posicionamento",
  "presenca",
  "conversao",
  "autoridade",
  "automacao",
];

// ---------------------------------------------------------------------------
// Utilidades determinísticas
// ---------------------------------------------------------------------------

/** Hash FNV-1a — barato e estável entre execuções. */
function hashStr(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Ruído estável em [-spread, +spread] derivado de (seed, salt). */
function jitter(seed: number, salt: number, spread: number): number {
  const mixed = Math.imul(seed ^ Math.imul(salt, 0x9e3779b9), 0x85ebca6b);
  return (Math.abs(mixed) % (2 * spread + 1)) - spread;
}

const clampScore = (value: number) =>
  Math.min(88, Math.max(18, Math.round(value)));

// ---------------------------------------------------------------------------
// Classificação de segmento
// ---------------------------------------------------------------------------

type SegmentoClasse =
  | "veiculos"
  | "alimentacao"
  | "moda"
  | "saude"
  | "servicos"
  | "geral";

const CLASSE_PATTERNS: Array<[SegmentoClasse, RegExp]> = [
  [
    "veiculos",
    /ve[ií]culo|carro|auto|moto|seminovo|concession[aá]ria|multimarca/i,
  ],
  [
    "alimentacao",
    /restaurante|lanch|hamburg|pizza|comida|aliment|delivery|caf[eé]|padaria|a[cç]a[ií]/i,
  ],
  [
    "moda",
    /moda|roupa|vestu[aá]rio|boutique|cal[cç]ado|acess[oó]rio|loja de roupa/i,
  ],
  [
    "saude",
    /cl[ií]nica|sa[uú]de|odonto|dent|est[eé]tica|fisio|psic[oó]|m[eé]dic|nutri|academia|personal/i,
  ],
  [
    "servicos",
    /advocacia|advogad|contabil|consultor|imobili[aá]ria|corretor|arquitet|engenharia|ag[eê]ncia|manuten[cç][aã]o|reforma/i,
  ],
];

export function classificarSegmento(segmento: string): SegmentoClasse {
  for (const [classe, pattern] of CLASSE_PATTERNS) {
    if (pattern.test(segmento)) return classe;
  }
  return "geral";
}

// ---------------------------------------------------------------------------
// Notas por pilar
// ---------------------------------------------------------------------------

function calcularPilares(input: DiagnosticoInput): Record<PilarId, number> {
  const temSite = input.site.trim().length > 3;
  const temInstagram = input.instagram.trim().length > 1;
  const seed = hashStr(
    `${input.empresa}|${input.segmento}|${input.objetivo}`.toLowerCase().trim()
  );

  const focoEmVenda = input.objetivo === "vendas" || input.objetivo === "leads";

  return {
    posicionamento: clampScore(
      46 + (temSite ? 6 : 0) + (temInstagram ? 4 : -6) + jitter(seed, 1, 6)
    ),
    presenca: clampScore(
      36 + (temSite ? 16 : 0) + (temInstagram ? 12 : -4) + jitter(seed, 2, 5)
    ),
    conversao: clampScore(
      34 +
        (temSite ? 14 : 0) +
        (temInstagram ? 4 : 0) +
        (focoEmVenda ? -4 : 2) +
        jitter(seed, 3, 6)
    ),
    autoridade: clampScore(
      38 +
        (temInstagram ? 12 : -6) +
        (temSite ? 6 : 0) +
        (input.objetivo === "autoridade" ? -5 : 3) +
        jitter(seed, 4, 6)
    ),
    automacao: clampScore(
      26 +
        (temSite ? 6 : 0) +
        (input.objetivo === "organizacao" ? -4 : 4) +
        jitter(seed, 5, 7)
    ),
  };
}

/** Peso de cada pilar na nota geral muda conforme o objetivo declarado. */
const PESOS: Record<Objetivo, Record<PilarId, number>> = {
  vendas: {
    posicionamento: 0.2,
    presenca: 0.2,
    conversao: 0.3,
    autoridade: 0.15,
    automacao: 0.15,
  },
  leads: {
    posicionamento: 0.15,
    presenca: 0.25,
    conversao: 0.3,
    autoridade: 0.15,
    automacao: 0.15,
  },
  autoridade: {
    posicionamento: 0.25,
    presenca: 0.2,
    conversao: 0.15,
    autoridade: 0.3,
    automacao: 0.1,
  },
  organizacao: {
    posicionamento: 0.15,
    presenca: 0.15,
    conversao: 0.2,
    autoridade: 0.15,
    automacao: 0.35,
  },
};

function notaGeral(
  scores: Record<PilarId, number>,
  objetivo: Objetivo
): number {
  const pesos = PESOS[objetivo];
  const soma = PILAR_ORDEM.reduce(
    (acc, pilar) => acc + scores[pilar] * pesos[pilar],
    0
  );
  return Math.round(soma);
}

// ---------------------------------------------------------------------------
// Resumo por pilar (3 faixas)
// ---------------------------------------------------------------------------

const RESUMOS: Record<PilarId, [string, string, string]> = {
  posicionamento: [
    "A mensagem não deixa claro por que escolher você e não o concorrente.",
    "Há uma direção, mas a promessa central ainda não está afiada.",
    "Posicionamento claro — agora é amplificar essa mensagem.",
  ],
  presenca: [
    "Os canais digitais não sustentam o negócio hoje: quem procura, não encontra.",
    "Presença existe, mas sem constância nem padrão profissional.",
    "Boa presença — o próximo passo é transformar alcance em receita.",
  ],
  conversao: [
    "Interesse chega, mas não existe um caminho claro até a compra.",
    "A conversão acontece, porém depende demais de esforço manual.",
    "Funil saudável — dá para otimizar com testes e dados.",
  ],
  autoridade: [
    "Falta prova social visível: depoimentos, resultados e bastidores.",
    "Alguma prova social existe, mas está dispersa e mal aproveitada.",
    "Autoridade em construção sólida — mantenha o ritmo de conteúdo.",
  ],
  automacao: [
    "Processos manuais consomem horas que deveriam virar atendimento e venda.",
    "Algumas rotinas fluem, mas dados e follow-up ainda são manuais.",
    "Operação organizada — automações avançadas podem escalar o resultado.",
  ],
};

function resumoDoPilar(pilar: PilarId, score: number): string {
  const faixa = score < 45 ? 0 : score < 65 ? 1 : 2;
  return RESUMOS[pilar][faixa];
}

// ---------------------------------------------------------------------------
// Problemas
// ---------------------------------------------------------------------------

type ProblemaTemplate = { titulo: string; detalhe: string };

const PROBLEMAS: Record<
  PilarId,
  { critico: ProblemaTemplate; atencao: ProblemaTemplate }
> = {
  posicionamento: {
    critico: {
      titulo: "Promessa de valor indefinida",
      detalhe:
        "Quem visita seus canais não entende em segundos o que você vende, para quem e qual o diferencial. Isso derruba o aproveitamento de todo o tráfego que chega.",
    },
    atencao: {
      titulo: "Diferencial pouco explícito",
      detalhe:
        "A comunicação descreve o que o negócio faz, mas não por que ele é a melhor escolha do segmento. A mensagem precisa de um ângulo único.",
    },
  },
  presenca: {
    critico: {
      titulo: "Presença digital abaixo do necessário",
      detalhe:
        "Os pontos de contato (site, perfil, Google) estão incompletos ou desatualizados. Na prática, o negócio é invisível para quem pesquisa antes de comprar.",
    },
    atencao: {
      titulo: "Canais sem constância",
      detalhe:
        "Existe presença, mas sem frequência de publicação nem identidade visual consistente — o que passa impressão de negócio parado.",
    },
  },
  conversao: {
    critico: {
      titulo: "Sem caminho claro de conversão",
      detalhe:
        "Não há uma chamada única e visível levando o interessado para a próxima etapa (WhatsApp, formulário ou proposta). Interesse gerado está sendo desperdiçado.",
    },
    atencao: {
      titulo: "Fricção no contato",
      detalhe:
        "O interessado precisa de muitos passos até falar com você. Cada passo extra derruba uma parte das conversões.",
    },
  },
  autoridade: {
    critico: {
      titulo: "Prova social invisível",
      detalhe:
        "Depoimentos, avaliações e resultados de clientes não aparecem nos canais. Sem prova, o preço vira o único critério de decisão.",
    },
    atencao: {
      titulo: "Prova social subaproveitada",
      detalhe:
        "Os depoimentos existem, mas ficam escondidos em conversas privadas em vez de virarem conteúdo público.",
    },
  },
  automacao: {
    critico: {
      titulo: "Operação 100% manual",
      detalhe:
        "Atendimento, follow-up e controle de dados dependem de memória e planilhas soltas. Leads esfriam e horas de trabalho se perdem toda semana.",
    },
    atencao: {
      titulo: "Follow-up sem processo",
      detalhe:
        "O primeiro atendimento acontece, mas quem não fecha na hora raramente recebe um retorno estruturado depois.",
    },
  },
};

function montarProblemas(scores: Record<PilarId, number>): Problema[] {
  return PILAR_ORDEM.filter(pilar => scores[pilar] < 62)
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, 4)
    .map(pilar => {
      const severidade = scores[pilar] < 48 ? "critico" : "atencao";
      const template = PROBLEMAS[pilar][severidade];
      return { pilar, severidade, ...template } as Problema;
    });
}

// ---------------------------------------------------------------------------
// Oportunidades
// ---------------------------------------------------------------------------

const OPORTUNIDADES_PILAR: Record<PilarId, Oportunidade> = {
  posicionamento: {
    titulo: "Reposicionar a mensagem central",
    detalhe:
      "Uma promessa clara nos primeiros segundos de contato aumenta o aproveitamento de todo o tráfego já existente — sem gastar mais em anúncio.",
  },
  presenca: {
    titulo: "Ocupar as buscas do segmento",
    detalhe:
      "Perfil do Google, site rápido e publicações constantes colocam o negócio na frente de quem já está procurando exatamente o que você vende.",
  },
  conversao: {
    titulo: "Encurtar o caminho até o WhatsApp",
    detalhe:
      "Uma chamada única e visível em todos os canais transforma curiosos em conversas reais — é a melhoria de maior impacto imediato.",
  },
  autoridade: {
    titulo: "Transformar clientes satisfeitos em conteúdo",
    detalhe:
      "Depoimentos, avaliações e bastidores publicados com recorrência reduzem a objeção de confiança e sustentam preços melhores.",
  },
  automacao: {
    titulo: "Automatizar o funil de atendimento",
    detalhe:
      "Respostas automáticas, follow-up programado e dados centralizados recuperam vendas que hoje esfriam por falta de retorno.",
  },
};

const OPORTUNIDADE_CLASSE: Record<SegmentoClasse, Oportunidade> = {
  veiculos: {
    titulo: "Catálogo de estoque integrado ao WhatsApp",
    detalhe:
      "Cada veículo com página própria, fotos padronizadas e botão de interesse direto — o estoque vira máquina de gerar conversas qualificadas.",
  },
  alimentacao: {
    titulo: "Cardápio digital com pedido direto",
    detalhe:
      "Um cardápio próprio com pedido pelo WhatsApp reduz dependência de aplicativos e taxas, e ainda gera base de clientes para recompra.",
  },
  moda: {
    titulo: "Vitrine digital com reserva de peças",
    detalhe:
      "Lançamentos publicados com link de reserva criam senso de urgência e transformam seguidores em fila de espera.",
  },
  saude: {
    titulo: "Agendamento online com confirmação automática",
    detalhe:
      "Agenda integrada com lembretes automáticos reduz faltas e libera a recepção para atendimento de qualidade.",
  },
  servicos: {
    titulo: "Funil de orçamento estruturado",
    detalhe:
      "Formulário inteligente que qualifica o pedido antes da conversa: você chega na negociação sabendo exatamente o que o cliente precisa.",
  },
  geral: {
    titulo: "Central de dados do cliente",
    detalhe:
      "Concentrar contatos, histórico e interesse em um só lugar cria base para campanhas de recompra e decisões guiadas por dados.",
  },
};

function montarOportunidades(
  scores: Record<PilarId, number>,
  classe: SegmentoClasse
): Oportunidade[] {
  const piores = [...PILAR_ORDEM].sort((a, b) => scores[a] - scores[b]);
  return [
    OPORTUNIDADE_CLASSE[classe],
    ...piores.slice(0, 3).map(pilar => OPORTUNIDADES_PILAR[pilar]),
  ];
}

// ---------------------------------------------------------------------------
// Recomendações prioritárias
// ---------------------------------------------------------------------------

const RECOMENDACOES: Record<PilarId, Recomendacao> = {
  posicionamento: {
    pilar: "posicionamento",
    titulo: "Definir e publicar a nova proposta de valor",
    detalhe:
      "Reescrever bio, capa do site e mensagem de saudação com a mesma promessa central — uma frase, repetida em todos os canais.",
  },
  presenca: {
    pilar: "presenca",
    titulo: "Padronizar os pontos de contato",
    detalhe:
      "Atualizar perfil do Google, fixar destaques no Instagram e garantir site rápido no celular — os três lugares onde o cliente decide se confia.",
  },
  conversao: {
    pilar: "conversao",
    titulo: "Criar uma chamada única de conversão",
    detalhe:
      "Um botão de WhatsApp com mensagem pré-preenchida em site, bio e posts. Uma ação, sem fricção, medida semanalmente.",
  },
  autoridade: {
    pilar: "autoridade",
    titulo: "Montar rotina de prova social",
    detalhe:
      "Pedir avaliação a todo cliente satisfeito e publicar 2 depoimentos por semana em formato padronizado.",
  },
  automacao: {
    pilar: "automacao",
    titulo: "Ativar follow-up automático",
    detalhe:
      "Resposta imediata fora do horário + retorno programado em 24h e 72h para quem não fechou. Nenhum lead esfria sem receber contato.",
  },
};

function montarRecomendacoes(scores: Record<PilarId, number>): Recomendacao[] {
  return [...PILAR_ORDEM]
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, 4)
    .map(pilar => RECOMENDACOES[pilar]);
}

// ---------------------------------------------------------------------------
// Proposta de valor e headline por segmento
// ---------------------------------------------------------------------------

const PROPOSTAS: Record<SegmentoClasse, (i: DiagnosticoInput) => string> = {
  veiculos: i =>
    `A ${i.empresa} vende mais que carros: vende a segurança de comprar um veículo revisado, com procedência documentada e negociação transparente — do primeiro clique à entrega da chave.`,
  alimentacao: i =>
    `A ${i.empresa} entrega mais que comida: entrega a certeza de um pedido rápido, do jeito que o cliente gosta, com a mesma qualidade em todo pedido.`,
  moda: i =>
    `A ${i.empresa} não vende só peças: vende a confiança de se vestir bem para cada ocasião, com curadoria que economiza o tempo de quem escolhe.`,
  saude: i =>
    `A ${i.empresa} oferece mais que consultas: oferece um cuidado contínuo, com agendamento sem fricção e acompanhamento de verdade entre uma visita e outra.`,
  servicos: i =>
    `A ${i.empresa} resolve o problema de quem precisa de ${i.segmento.toLowerCase()} com escopo claro, prazo cumprido e comunicação direta — sem surpresa no final.`,
  geral: i =>
    `A ${i.empresa} é a escolha de quem busca ${i.segmento.toLowerCase()} com atendimento próximo, entrega consistente e um processo de compra simples do início ao fim.`,
};

const HEADLINES: Record<SegmentoClasse, (i: DiagnosticoInput) => string> = {
  veiculos: () =>
    "Seu próximo carro, revisado e com procedência verificada — simule a entrada e receba resposta em minutos no WhatsApp.",
  alimentacao: () =>
    "Peça em 3 cliques e receba quentinho: cardápio completo, pedido direto no WhatsApp, sem taxa de aplicativo.",
  moda: () =>
    "Os lançamentos que combinam com você, antes de todo mundo — reserve sua peça pelo WhatsApp.",
  saude: () =>
    "Agende sua avaliação em menos de 1 minuto — horários reais, confirmação automática, sem telefone ocupado.",
  servicos: i =>
    `Orçamento claro e resposta no mesmo dia para ${i.segmento.toLowerCase()} — conte seu projeto e receba os próximos passos.`,
  geral: i =>
    `${i.empresa}: atendimento direto, entrega no prazo e a solução certa para o que você precisa — comece pelo WhatsApp.`,
};

// ---------------------------------------------------------------------------
// Ideias de conteúdo
// ---------------------------------------------------------------------------

const CONTEUDO_CLASSE: Record<SegmentoClasse, string[]> = {
  veiculos: [
    "Tour em vídeo de 60s por um veículo do estoque, destacando revisão e procedência",
    "“Chegou hoje”: série fixa apresentando cada carro novo no pátio",
    "Bastidores da inspeção: o checklist que todo carro passa antes de ir à vitrine",
    "Cliente retirando a chave + depoimento de 30 segundos",
    "Comparativo honesto entre dois modelos do estoque para o mesmo perfil de uso",
    "Guia rápido: documentos e entrada necessários para financiar sem dor de cabeça",
  ],
  alimentacao: [
    "Bastidores do preparo do prato mais pedido",
    "“Por trás do balcão”: apresentação da equipe e do cuidado com ingredientes",
    "Cliente experimentando + reação espontânea",
    "Combo da semana com link de pedido direto",
    "Antes e depois da montagem de um pedido grande",
    "Enquete: qual sabor entra no cardápio no próximo mês?",
  ],
  moda: [
    "Prova real: a mesma peça montada em 3 looks diferentes",
    "Chegou na loja: unboxing da nova coleção",
    "Cliente estilizada com peças da loja + depoimento",
    "Guia de tamanhos sem mistério: como escolher certo pelo WhatsApp",
    "Bastidores da curadoria: por que essa peça entrou na coleção",
    "Combina ou não combina? Série de composições comentadas",
  ],
  saude: [
    "Mito ou verdade sobre o tratamento mais procurado",
    "Tour pela estrutura da clínica em 45 segundos",
    "Depoimento de paciente (com autorização) sobre a evolução do tratamento",
    "“O que acontece na primeira consulta” — reduzindo o medo de quem adia",
    "Dica prática da semana relacionada à especialidade",
    "Apresentação da equipe: quem cuida de você",
  ],
  servicos: [
    "Caso real: problema do cliente, solução aplicada e resultado (antes/depois)",
    "Erros mais comuns que os clientes cometem antes de procurar um especialista",
    "Bastidores de um projeto em andamento",
    "Resposta em vídeo às 5 dúvidas mais frequentes do orçamento",
    "Checklist gratuito relacionado ao serviço, entregue via WhatsApp",
    "Depoimento de cliente destacando prazo e comunicação",
  ],
  geral: [
    "História da empresa: por que ela existe e para quem",
    "Bastidores da operação em um dia comum",
    "Depoimento de cliente com resultado concreto",
    "Resposta às 5 perguntas mais frequentes antes da compra",
    "Antes e depois de um cliente atendido",
    "Oferta da semana com chamada direta para o WhatsApp",
  ],
};

// ---------------------------------------------------------------------------
// Automações
// ---------------------------------------------------------------------------

const AUTOMACOES_BASE: Automacao[] = [
  {
    titulo: "Resposta imediata no WhatsApp",
    detalhe:
      "Mensagem automática de boas-vindas com as 3 perguntas que qualificam o interesse — funciona 24h, inclusive fora do horário comercial.",
  },
  {
    titulo: "Follow-up programado",
    detalhe:
      "Quem demonstrou interesse e não fechou recebe retorno automático em 24h e 72h. É a automação com maior retorno imediato.",
  },
  {
    titulo: "Central de leads",
    detalhe:
      "Todo contato de site, Instagram e WhatsApp cai em uma base única com origem, interesse e status — fim das oportunidades perdidas em conversas soltas.",
  },
];

const AUTOMACAO_CLASSE: Record<SegmentoClasse, Automacao> = {
  veiculos: {
    titulo: "Alerta de estoque por perfil",
    detalhe:
      "Cliente procurou um SUV até R$ 80 mil e não encontrou? Quando entrar um no pátio, ele recebe aviso automático no WhatsApp.",
  },
  alimentacao: {
    titulo: "Campanha de recompra",
    detalhe:
      "Cliente que não pede há 15 dias recebe um cupom automático de volta — recuperação de receita sem esforço da equipe.",
  },
  moda: {
    titulo: "Aviso de reposição e lançamento",
    detalhe:
      "Peça esgotada gera lista de espera automática; quando repõe, as clientes interessadas são avisadas na hora.",
  },
  saude: {
    titulo: "Confirmação e lembrete de consulta",
    detalhe:
      "Confirmação automática no agendamento + lembrete 24h antes. Reduz faltas e libera a recepção do telefone.",
  },
  servicos: {
    titulo: "Esteira de proposta",
    detalhe:
      "Pedido de orçamento gera resposta com prazo estimado, coleta de informações e lembrete interno para a proposta não atrasar.",
  },
  geral: {
    titulo: "Relatório semanal automático",
    detalhe:
      "Toda segunda-feira, um resumo de contatos recebidos, origem e conversões chega pronto no seu WhatsApp ou e-mail.",
  },
};

// ---------------------------------------------------------------------------
// Plano de 7 dias
// ---------------------------------------------------------------------------

function montarPlano(
  input: DiagnosticoInput,
  classe: SegmentoClasse,
  scores: Record<PilarId, number>
): PlanoDia[] {
  const piorPilar = [...PILAR_ORDEM].sort((a, b) => scores[a] - scores[b])[0];

  return [
    {
      dia: 1,
      foco: "Posicionamento",
      acoes: [
        "Aprovar a nova proposta de valor e a headline sugerida",
        "Reescrever a bio do Instagram e a descrição do Google com a nova mensagem",
      ],
    },
    {
      dia: 2,
      foco: "Presença digital",
      acoes: [
        "Atualizar fotos, horários e informações no perfil do Google",
        "Organizar os destaques do Instagram: quem somos, prova social, como comprar",
      ],
    },
    {
      dia: 3,
      foco: "Conversão",
      acoes: [
        "Instalar botão de WhatsApp com mensagem pré-preenchida no site e na bio",
        "Definir a chamada única que todos os canais vão repetir",
      ],
    },
    {
      dia: 4,
      foco: "Conteúdo",
      acoes: [
        "Gravar e publicar a primeira ideia da lista de conteúdo",
        "Agendar os próximos 3 posts da semana",
      ],
    },
    {
      dia: 5,
      foco: "Automação",
      acoes: [
        "Ativar a resposta automática de boas-vindas no WhatsApp",
        `Configurar: ${AUTOMACAO_CLASSE[classe].titulo.toLowerCase()}`,
      ],
    },
    {
      dia: 6,
      foco: "Autoridade",
      acoes: [
        "Pedir avaliação no Google para os 5 últimos clientes satisfeitos",
        "Publicar o primeiro depoimento em formato padronizado",
      ],
    },
    {
      dia: 7,
      foco: "Revisão e métricas",
      acoes: [
        "Medir: contatos recebidos, origem e respostas da semana",
        `Priorizar a próxima ação no pilar mais fraco (${PILAR_LABELS[piorPilar].toLowerCase()})`,
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Provider de regras locais
// ---------------------------------------------------------------------------

/** Monta o relatório completo de forma síncrona e determinística. */
export function gerarRelatorio(input: DiagnosticoInput): DiagnosticoReport {
  const scores = calcularPilares(input);
  const classe = classificarSegmento(input.segmento);

  const pilares: PilarScore[] = PILAR_ORDEM.map(id => ({
    id,
    label: PILAR_LABELS[id],
    score: scores[id],
    resumo: resumoDoPilar(id, scores[id]),
  }));

  return {
    input,
    notaGeral: notaGeral(scores, input.objetivo),
    pilares,
    problemas: montarProblemas(scores),
    oportunidades: montarOportunidades(scores, classe),
    recomendacoes: montarRecomendacoes(scores),
    propostaDeValor: PROPOSTAS[classe](input),
    headline: HEADLINES[classe](input),
    ideiasDeConteudo: CONTEUDO_CLASSE[classe],
    automacoes: [AUTOMACAO_CLASSE[classe], ...AUTOMACOES_BASE],
    plano7Dias: montarPlano(input, classe, scores),
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Provider padrão: regras locais + latência simulada (a tela de processamento
 * controla o ritmo da experiência; aqui só garantimos que o resultado não
 * chega "instantâneo demais" a ponto de parecer falso).
 */
export const localRulesProvider: DiagnosticoProvider = {
  async analyze(input) {
    await sleep(600);
    return gerarRelatorio(input);
  },
};

/**
 * Esqueleto para a futura integração com IA: aponte para um endpoint que
 * receba o input e devolva um `DiagnosticoReport` no mesmo formato.
 *
 *   const provider = createApiProvider("/api/diagnostico");
 */
export function createApiProvider(endpoint: string): DiagnosticoProvider {
  return {
    async analyze(input) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error(`Diagnóstico indisponível (HTTP ${response.status})`);
      }
      return (await response.json()) as DiagnosticoReport;
    },
  };
}
