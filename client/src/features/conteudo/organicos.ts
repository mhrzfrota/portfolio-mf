import { hojeISO } from "../plano/store.ts";
import { ETAPAS, filtrarPecas, type Estudio, type NovaPeca, type Peca } from "./estudio.ts";

/**
 * Ritmo do Matheus (decisão de 2026-11-18): um post caprichado por semana e,
 * em volta dele, orgânicos curtos no formato "comenta a palavra que eu te
 * mando", com a resposta automática no direct pelo Zernio.
 *
 * Sem campo novo no estúdio: o orgânico é a peça da temática ORGANICO, criada
 * na primeira vez que ele usa um modelo.
 */
export const ORGANICO = { nome: "Orgânico (comenta e recebe)", cor: "#30D158" } as const;

export type ModeloOrganico = {
  id: string;
  titulo: string;
  /** O que aparece no vídeo, em uma frase. */
  mostra: string;
  /** Palavra que a pessoa comenta e que o Zernio escuta. */
  palavra: string;
  /** O que chega no direct. */
  entrega: string;
  publico: "dev" | "negocio";
};

export const MODELOS: ModeloOrganico[] = [
  { id: "skill", titulo: "Uma skill do Claude trabalhando", mostra: "A skill /save fechando a sessão sozinha e gravando tudo no lugar certo.", palavra: "SKILL", entrega: "O arquivo da skill pronto para instalar.", publico: "dev" },
  { id: "prompt", titulo: "O prompt que escreve minha proposta", mostra: "Cola o resumo da conversa com o cliente e sai a proposta formatada.", palavra: "PROMPT", entrega: "O prompt completo em texto.", publico: "dev" },
  { id: "brief", titulo: "O brief que faz o Codex acertar", mostra: "Um brief fechado virando código em minutos, sem retrabalho.", palavra: "BRIEF", entrega: "O modelo de brief em Markdown.", publico: "dev" },
  { id: "cerebro", titulo: "As pastas do meu segundo cérebro", mostra: "Tour de 20 segundos pelo vault: clientes, projetos, conteúdo.", palavra: "CEREBRO", entrega: "A estrutura de pastas e o CLAUDE.md de base.", publico: "dev" },
  { id: "checklist", titulo: "Checklist antes de entregar um site", mostra: "Favicon, mobile, ortografia e segurança conferidos um a um.", palavra: "CHECKLIST", entrega: "O checklist em PDF.", publico: "dev" },
  { id: "stack", titulo: "As ferramentas que eu uso no dia", mostra: "Tela por tela: Claude Code, Codex, Vercel, Supabase.", palavra: "STACK", entrega: "A lista com link de cada ferramenta.", publico: "dev" },
  { id: "codigo", titulo: "O efeito do meu portfólio", mostra: "A animação de rolagem com peso funcionando no celular.", palavra: "CODIGO", entrega: "O trecho de código do componente.", publico: "dev" },
  { id: "ganchos", titulo: "Os ganchos que mais deram certo", mostra: "Três ganchos lado a lado com o alcance de cada um.", palavra: "GANCHO", entrega: "A lista de 30 ganchos.", publico: "dev" },
  { id: "automacao", titulo: "Esta automação, ao vivo", mostra: "Alguém comenta e o direct chega em 2 segundos.", palavra: "AUTOMACAO", entrega: "O passo a passo para montar a sua.", publico: "dev" },
  { id: "contrato", titulo: "O contrato que uso com cliente", mostra: "As 5 cláusulas que já me salvaram de dor de cabeça.", palavra: "CONTRATO", entrega: "O modelo de contrato editável.", publico: "dev" },
  { id: "diagnostico", titulo: "Diagnóstico grátis do seu site", mostra: "Abro o site de um negócio e aponto 3 coisas que travam a venda.", palavra: "DIAGNOSTICO", entrega: "Um formulário curto; eu respondo com o diagnóstico.", publico: "negocio" },
  { id: "abordagem", titulo: "A mensagem que fecha cliente no WhatsApp", mostra: "A mensagem na tela, linha por linha, e por que cada uma existe.", palavra: "MENSAGEM", entrega: "O modelo de mensagem para copiar.", publico: "negocio" },
  { id: "preco", titulo: "Quanto cobrar por um site", mostra: "A planilha que eu uso para chegar no preço.", palavra: "PRECO", entrega: "A planilha de precificação.", publico: "negocio" },
  { id: "catalogo", titulo: "Catálogo que vende pelo WhatsApp", mostra: "Um catálogo de loja local, do produto até o botão de pedir.", palavra: "CATALOGO", entrega: "O link de um catálogo de exemplo.", publico: "negocio" },
  { id: "antes-depois", titulo: "Antes e depois de um site de cliente", mostra: "O site velho e o novo, lado a lado, em 10 segundos.", palavra: "SITE", entrega: "O que mudou e por quê, em uma página.", publico: "negocio" },
  { id: "bio", titulo: "A bio de Instagram que converte", mostra: "Reescrevo a bio de um negócio local em 3 linhas.", palavra: "BIO", entrega: "O modelo de bio para preencher.", publico: "negocio" },
];

/** O texto do roteiro já com a chamada e a configuração do Zernio. */
export function pecaDoModelo(m: ModeloOrganico, tematica: string, data: string): NovaPeca {
  return {
    etapa: "ideias",
    titulo: m.titulo,
    tematica,
    formato: "reel",
    profundidade: "raso",
    data,
    gancho: `${m.titulo}. Comenta ${m.palavra} que eu te mando.`,
    roteiro: [
      `O que mostrar:\n${m.mostra}`,
      `Chamada no fim:\nComenta ${m.palavra} que eu te mando no direct.`,
      `No Zernio:\nPalavra-chave ${m.palavra}. Direct: ${m.entrega}`,
    ].join("\n\n"),
    checklist: [
      { id: globalThis.crypto.randomUUID(), texto: "Deixar o material pronto para enviar", feito: false },
      { id: globalThis.crypto.randomUUID(), texto: `Ligar a palavra ${m.palavra} no Zernio`, feito: false },
      { id: globalThis.crypto.randomUUID(), texto: "Gravar (15 a 30 s)", feito: false },
    ],
  };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const somar = (data: string, dias: number) => {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return iso(d);
};
export const segundaDe = (data: string) => {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
};

export type Semana = {
  inicio: string;
  fim: string;
  /** Dia sugerido para o caprichado (quinta) e para os orgânicos (terça). */
  diaCaprichado: string;
  diaOrganico: string;
  caprichado: Peca[];
  organicos: Peca[];
};

export function idOrganico(e: Estudio): string | null {
  return e.tematicas.find((t) => t.nome === ORGANICO.nome)?.id ?? null;
}

/** As próximas semanas (a atual primeiro), com o que já está marcado em cada uma. */
export function semanas(e: Estudio, quantas = 6, hoje = hojeISO()): Semana[] {
  const org = idOrganico(e);
  const todas = filtrarPecas(e);
  const primeira = segundaDe(hoje);
  return Array.from({ length: quantas }, (_, i) => {
    const inicio = somar(primeira, i * 7);
    const fim = somar(inicio, 6);
    const daSemana = todas.filter((p) => p.data >= inicio && p.data <= fim).sort((a, b) => a.data.localeCompare(b.data));
    return {
      inicio,
      fim,
      // Na semana atual, dia que já passou vira hoje
      diaCaprichado: [somar(inicio, 3), hoje].sort()[1],
      diaOrganico: [somar(inicio, 1), hoje].sort()[1],
      caprichado: daSemana.filter((p) => !org || p.tematica !== org),
      organicos: daSemana.filter((p) => !!org && p.tematica === org),
    };
  });
}

/** Ideias para o caprichado: sem data, ainda não publicadas e fora dos orgânicos. */
export function ideiasLivres(e: Estudio): Peca[] {
  const org = idOrganico(e);
  return ETAPAS.filter((x) => x.id !== "publicado")
    .flatMap((x) => e.pecas[x.id])
    .filter((p) => !p.data && (!org || p.tematica !== org));
}

/** Semanas anteriores com post publicado, para ver o ritmo. */
export function ultimasPublicadas(e: Estudio, quantas = 4): Peca[] {
  return [...e.pecas.publicado].sort((a, b) => (b.data || b.publicadoEm).localeCompare(a.data || a.publicadoEm)).slice(0, quantas);
}
