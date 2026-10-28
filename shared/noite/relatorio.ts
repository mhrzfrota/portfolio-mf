/**
 * Relatório da noite: o contrato entre a rotina que roda no Mac
 * (`scripts/noite/`, Codex + Claude) e a aba Noite do sistema interno.
 *
 * Números e horários vêm do coletor (git, sessões, vault), nunca do modelo.
 * Textos (resumo, insights, ideias) vêm do Claude, que lê o que o coletor
 * juntou e o que o Codex pesquisou (notícias e leitura técnica do dia).
 */

export const VERSAO_RELATORIO = 1 as const;

export type Prioridade = "alta" | "media" | "baixa";
export const PRIORIDADES: readonly Prioridade[] = ["alta", "media", "baixa"];

export type TipoMomento = "commit" | "sessao" | "marco" | "vault" | "deploy";
export const TIPOS_MOMENTO: readonly TipoMomento[] = ["commit", "sessao", "marco", "vault", "deploy"];

export type StatusProjeto = "avancou" | "travado" | "novo" | "entregue";
export const STATUS_PROJETO: readonly StatusProjeto[] = ["avancou", "travado", "novo", "entregue"];

export type TipoInsight = "oportunidade" | "risco" | "padrao";
export const TIPOS_INSIGHT: readonly TipoInsight[] = ["oportunidade", "risco", "padrao"];

/**
 * Onde a notícia mexe com a MF: o mercado dos clientes, o crescimento da
 * empresa, IA e mercado dev, ou as ferramentas do dia a dia.
 */
export type CategoriaNoticia = "mercado" | "crescimento" | "ia" | "devs" | "ferramentas";
export const CATEGORIAS_NOTICIA: readonly CategoriaNoticia[] = ["mercado", "crescimento", "ia", "devs", "ferramentas"];

export type ResumoPlano = {
  criados: { titulo: string; coluna: "fazer" | "agenda" | "ideias"; evidencia: string }[];
  concluidos: { titulo: string; evidencia: string }[];
  erro?: string;
};

export type FormatoConteudo = "reel" | "carrossel" | "post" | "story";
export const FORMATOS_CONTEUDO: readonly FormatoConteudo[] = ["reel", "carrossel", "post", "story"];

/** Calculadas pelo coletor. */
export type Metricas = {
  commits: number;
  repositorios: number;
  arquivosAlterados: number;
  linhasMais: number;
  linhasMenos: number;
  sessoesClaude: number;
  sessoesCodex: number;
  pedidos: number;
  notasDoVault: number;
  /** HH:MM no fuso de Fortaleza, ou null sem atividade */
  primeiraAtividade: string | null;
  ultimaAtividade: string | null;
  /** Repositórios com mudança ainda não commitada no fim do dia */
  naoCommitado: number;
};

export type PorProjeto = { projeto: string; commits: number; linhasMais: number; linhasMenos: number };

export type Momento = { hora: string; projeto: string | null; texto: string; tipo: TipoMomento };

export type ProjetoDoDia = { nome: string; avancou: string; status: StatusProjeto; proximo: string };

export type ProjetoNovo = { nome: string; descricao: string };

export type Dev = {
  /** Uma frase sobre o momento como desenvolvedor */
  momento: string;
  praticou: string[];
  pontoForte: string;
  melhorar: string;
  estudo: { tema: string; porque: string; link: string | null };
};

export type Insight = { tipo: TipoInsight; titulo: string; texto: string };

export type Noticia = {
  titulo: string;
  fonte: string;
  url: string;
  /** AAAA-MM-DD */
  data: string;
  resumo: string;
  porqueImporta: string;
  tema: string;
  /** Os três campos abaixo existem a partir de 2026-10-17; relatórios anteriores não têm. */
  categoria?: CategoriaNoticia;
  /** O que fazer com a notícia, em uma frase que começa por verbo */
  acao?: string;
  /** alta: pede ação nesta semana; media: vale saber */
  relevancia?: Prioridade;
};

export type IdeiaConteudo = { formato: FormatoConteudo; gancho: string; roteiro: string[]; base: string };

export type Cliente = { nome: string; situacao: string; proximaAcao: string; prioridade: Prioridade };

export type Prospecto = {
  nome: string;
  segmento: string;
  local: string | null;
  porque: string;
  abordagem: string;
  /** Link público de onde veio (perfil, site, mapa), ou null */
  fonte: string | null;
  prioridade: Prioridade;
};

export type Prioridades = { titulo: string; porque: string; projeto: string | null };

export type Agente = { ok: boolean; duracaoMs: number; modelo: string | null; erro: string | null };

export type Relatorio = {
  versao: typeof VERSAO_RELATORIO;
  /** AAAA-MM-DD no fuso de Fortaleza */
  dia: string;
  /** ISO 8601 */
  geradoEm: string;
  manchete: string;
  resumo: string[];
  amanha: Prioridades[];
  metricas: Metricas;
  porProjeto: PorProjeto[];
  linhaDoTempo: Momento[];
  projetos: ProjetoDoDia[];
  projetosNovos: ProjetoNovo[];
  dev: Dev;
  insights: Insight[];
  noticias: Noticia[];
  conteudo: IdeiaConteudo[];
  clientes: Cliente[];
  prospeccao: Prospecto[];
  /** Resultado opcional da atualização automática, ausente nos relatórios antigos. */
  plano?: ResumoPlano;
  fontes: { commits: number; sessoesClaude: number; sessoesCodex: number; notas: number; noticias: number };
  agentes: { codex: Agente; claude: Agente };
};

/* ------------------------------------------------------------------ */
/* Validação (sem dependência): o app e o script usam a mesma.          */
/* ------------------------------------------------------------------ */

type Obj = Record<string, unknown>;
const ehObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const ehTexto = (v: unknown): v is string => typeof v === "string";
const ehTextoOuNulo = (v: unknown): v is string | null => v === null || typeof v === "string";
const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const ehLista = <T>(v: unknown, item: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(item);
const umDe = <T extends string>(lista: readonly T[]) => (v: unknown): v is T => typeof v === "string" && (lista as readonly string[]).includes(v);

export const ehDia = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ehHora = (v: unknown): v is string => typeof v === "string" && /^\d{2}:\d{2}$/.test(v);
const ehHoraOuNula = (v: unknown): v is string | null => v === null || ehHora(v);

const ehMetricas = (v: unknown): v is Metricas =>
  ehObj(v) &&
  ["commits", "repositorios", "arquivosAlterados", "linhasMais", "linhasMenos", "sessoesClaude", "sessoesCodex", "pedidos", "notasDoVault", "naoCommitado"].every((k) => ehNumero(v[k])) &&
  ehHoraOuNula(v.primeiraAtividade) &&
  ehHoraOuNula(v.ultimaAtividade);

const ehPorProjeto = (v: unknown): v is PorProjeto =>
  ehObj(v) && ehTexto(v.projeto) && ehNumero(v.commits) && ehNumero(v.linhasMais) && ehNumero(v.linhasMenos);

const ehMomento = (v: unknown): v is Momento =>
  ehObj(v) && ehHora(v.hora) && ehTextoOuNulo(v.projeto) && ehTexto(v.texto) && umDe(TIPOS_MOMENTO)(v.tipo);

const ehProjetoDoDia = (v: unknown): v is ProjetoDoDia =>
  ehObj(v) && ehTexto(v.nome) && ehTexto(v.avancou) && umDe(STATUS_PROJETO)(v.status) && ehTexto(v.proximo);

const ehProjetoNovo = (v: unknown): v is ProjetoNovo => ehObj(v) && ehTexto(v.nome) && ehTexto(v.descricao);

const ehDev = (v: unknown): v is Dev =>
  ehObj(v) &&
  ehTexto(v.momento) &&
  ehLista(v.praticou, ehTexto) &&
  ehTexto(v.pontoForte) &&
  ehTexto(v.melhorar) &&
  ehObj(v.estudo) &&
  ehTexto(v.estudo.tema) &&
  ehTexto(v.estudo.porque) &&
  ehTextoOuNulo(v.estudo.link);

const ehInsight = (v: unknown): v is Insight => ehObj(v) && umDe(TIPOS_INSIGHT)(v.tipo) && ehTexto(v.titulo) && ehTexto(v.texto);

const opcional = <T>(teste: (x: unknown) => x is T) => (v: unknown): v is T | undefined => v === undefined || teste(v);

const ehNoticia = (v: unknown): v is Noticia =>
  ehObj(v) &&
  ["titulo", "fonte", "url", "data", "resumo", "porqueImporta", "tema"].every((k) => ehTexto(v[k])) &&
  opcional(umDe(CATEGORIAS_NOTICIA))(v.categoria) &&
  opcional(ehTexto)(v.acao) &&
  opcional(umDe(PRIORIDADES))(v.relevancia);

const ehIdeia = (v: unknown): v is IdeiaConteudo =>
  ehObj(v) && umDe(FORMATOS_CONTEUDO)(v.formato) && ehTexto(v.gancho) && ehLista(v.roteiro, ehTexto) && ehTexto(v.base);

const ehCliente = (v: unknown): v is Cliente =>
  ehObj(v) && ehTexto(v.nome) && ehTexto(v.situacao) && ehTexto(v.proximaAcao) && umDe(PRIORIDADES)(v.prioridade);

const ehProspecto = (v: unknown): v is Prospecto =>
  ehObj(v) &&
  ehTexto(v.nome) &&
  ehTexto(v.segmento) &&
  ehTextoOuNulo(v.local) &&
  ehTexto(v.porque) &&
  ehTexto(v.abordagem) &&
  ehTextoOuNulo(v.fonte) &&
  umDe(PRIORIDADES)(v.prioridade);

const ehResumoPlano = (v: unknown): v is ResumoPlano =>
  ehObj(v) &&
  ehLista(v.criados, (x): x is ResumoPlano["criados"][number] => ehObj(x) && ehTexto(x.titulo) && umDe(["fazer", "agenda", "ideias"] as const)(x.coluna) && ehTexto(x.evidencia)) &&
  ehLista(v.concluidos, (x): x is ResumoPlano["concluidos"][number] => ehObj(x) && ehTexto(x.titulo) && ehTexto(x.evidencia)) &&
  (v.erro === undefined || ehTexto(v.erro));

const ehPrioridades = (v: unknown): v is Prioridades => ehObj(v) && ehTexto(v.titulo) && ehTexto(v.porque) && ehTextoOuNulo(v.projeto);

const ehAgente = (v: unknown): v is Agente =>
  ehObj(v) && typeof v.ok === "boolean" && ehNumero(v.duracaoMs) && ehTextoOuNulo(v.modelo) && ehTextoOuNulo(v.erro);

export function ehRelatorio(v: unknown): v is Relatorio {
  return (
    ehObj(v) &&
    v.versao === VERSAO_RELATORIO &&
    ehDia(v.dia) &&
    ehTexto(v.geradoEm) &&
    ehTexto(v.manchete) &&
    ehLista(v.resumo, ehTexto) &&
    ehLista(v.amanha, ehPrioridades) &&
    ehMetricas(v.metricas) &&
    ehLista(v.porProjeto, ehPorProjeto) &&
    ehLista(v.linhaDoTempo, ehMomento) &&
    ehLista(v.projetos, ehProjetoDoDia) &&
    ehLista(v.projetosNovos, ehProjetoNovo) &&
    ehDev(v.dev) &&
    ehLista(v.insights, ehInsight) &&
    ehLista(v.noticias, ehNoticia) &&
    ehLista(v.conteudo, ehIdeia) &&
    ehLista(v.clientes, ehCliente) &&
    ehLista(v.prospeccao, ehProspecto) &&
    opcional(ehResumoPlano)(v.plano) &&
    ehObj(v.fontes) &&
    ["commits", "sessoesClaude", "sessoesCodex", "notas", "noticias"].every((k) => ehNumero((v.fontes as Obj)[k])) &&
    ehObj(v.agentes) &&
    ehAgente(v.agentes.codex) &&
    ehAgente(v.agentes.claude)
  );
}

/** Nunca usar travessão (regra do Matheus): troca por vírgula, inclusive o que vier dos modelos. */
export function semTravessao<T>(valor: T): T {
  if (typeof valor === "string") return valor.replace(/\s*[—–]\s*/g, ", ") as T;
  if (Array.isArray(valor)) return valor.map(semTravessao) as T;
  if (ehObj(valor)) return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, semTravessao(v)])) as T;
  return valor;
}
