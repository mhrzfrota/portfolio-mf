import { hojeISO } from "../plano/store.ts";

export type EtapaId = "ideias" | "roteiro" | "producao" | "pronto" | "publicado";
export const ETAPAS: { id: EtapaId; titulo: string; descricao: string }[] = [
  { id: "ideias", titulo: "Ideias", descricao: "Semente: o assunto e o ângulo" },
  { id: "roteiro", titulo: "Roteiro", descricao: "Gancho, meio e fim escritos" },
  { id: "producao", titulo: "Produção", descricao: "Gravando, editando, montando slides" },
  { id: "pronto", titulo: "Pronto", descricao: "Aprovado, esperando a data" },
  { id: "publicado", titulo: "Publicado", descricao: "No ar, com os números" },
];
export type AnguloId = "sacada" | "rotina" | "analise" | "faq" | "opiniao" | "reflexao" | "historia";
export const ANGULOS: { id: AnguloId; nome: string; cor: string; serve: string; esqueleto: string[] }[] = [
  { id: "sacada", nome: "Sacada", cor: "#0A84FF", serve: "Insight rápido do dia", esqueleto: ["O que eu percebi", "Por que importa", "O que fazer"] },
  { id: "rotina", nome: "Rotina", cor: "#30D158", serve: "Bastidor e processo, humaniza sem ensinar", esqueleto: ["Onde eu estou", "O que estou fazendo", "Por que faço assim"] },
  { id: "analise", nome: "Análise", cor: "#BF5AF2", serve: "Leitura crítica de algo do mercado", esqueleto: ["O que eu vi", "Minha leitura", "O que se tira disso"] },
  { id: "faq", nome: "FAQ", cor: "#FF9F0A", serve: "Dúvida real de cliente, tira objeção", esqueleto: ["A pergunta", "A resposta direta", "O próximo passo"] },
  { id: "opiniao", nome: "Opinião", cor: "#FF453A", serve: "Posição clara: atrai quem pensa igual", esqueleto: ["Minha posição", "Por quê", "O que eu faço no lugar"] },
  { id: "reflexao", nome: "Reflexão", cor: "#64D2FF", serve: "A pessoa por trás do profissional", esqueleto: ["O pensamento", "De onde veio", "O que mudou em mim"] },
  { id: "historia", nome: "História", cor: "#FFD60A", serve: "Momento que me moldou, gera identificação", esqueleto: ["Contexto", "Conflito", "Virada"] },
];
export type Profundidade = "raso" | "profundo";
export type FormatoId = "carrossel" | "reel" | "stories" | "foto" | "live" | "texto";
export const FORMATOS: { id: FormatoId; nome: string }[] = [
  { id: "carrossel", nome: "Carrossel" }, { id: "reel", nome: "Reel" },
  { id: "stories", nome: "Stories" }, { id: "foto", nome: "Foto" },
  { id: "live", nome: "Live" }, { id: "texto", nome: "Texto" },
];
export type Metricas = {
  visualizacoes: number | null; alcance: number | null; curtidas: number | null;
  comentarios: number | null; salvamentos: number | null; compartilhamentos: number | null;
  visitasPerfil: number | null; seguidores: number | null;
};
export type ItemChecklist = { id: string; texto: string; feito: boolean };
export type Peca = {
  id: string; etapa: EtapaId; titulo: string; tematica: string;
  angulo: AnguloId | ""; profundidade: Profundidade | ""; formato: FormatoId | "";
  gancho: string; roteiro: string; legenda: string; data: string; link: string;
  metricas: Metricas; checklist: ItemChecklist[];
  criadoEm: string; atualizadoEm: string; publicadoEm: string;
};
export type GrupoNota = "metodo" | "posicionamento" | "voz" | "ganchos" | "narrativas" | "referencias" | "aprendizados";
export const GRUPOS: { id: GrupoNota; nome: string }[] = [
  { id: "metodo", nome: "Método" }, { id: "posicionamento", nome: "Posicionamento" },
  { id: "voz", nome: "Voz" }, { id: "ganchos", nome: "Ganchos" },
  { id: "narrativas", nome: "Narrativas" }, { id: "referencias", nome: "Referências" },
  { id: "aprendizados", nome: "Aprendizados" },
];
export type Nota = { id: string; grupo: GrupoNota; titulo: string; texto: string; fixada: boolean; atualizadoEm: string };
export type Tematica = { id: string; nome: string; cliente: string; eu: string; cor: string };
export type Estudio = { versao: 1; pecas: Record<EtapaId, Peca[]>; notas: Nota[]; tematicas: Tematica[] };
export type NovaPeca = Partial<Omit<Peca, "id" | "criadoEm" | "atualizadoEm" | "publicadoEm">> & { titulo: string; etapa: EtapaId };
export type NovaNota = Partial<Omit<Nota, "id" | "atualizadoEm">> & { titulo: string; grupo: GrupoNota };
export type NovaTematica = Partial<Omit<Tematica, "id">> & { nome: string };

const etapas: EtapaId[] = ["ideias", "roteiro", "producao", "pronto", "publicado"];
const camposMetricas: (keyof Metricas)[] = ["visualizacoes", "alcance", "curtidas", "comentarios", "salvamentos", "compartilhamentos", "visitasPerfil", "seguidores"];
const novoId = () => globalThis.crypto.randomUUID();
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const identificador = (v: unknown): v is string => typeof v === "string" && !!v.trim() && v === v.trim();
const limpar = (v: string) => v.trim().replace(/\s+/g, " ");
const semAcentos = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function exigir(v: unknown, mensagem: string): asserts v { if (!v) throw new Error(mensagem); }
function dataValida(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
function texto(v: unknown, nome: string, limite: number, obrigatorio = false, livre = false): string {
  exigir(typeof v === "string", `${nome} deve ser um texto.`);
  const resultado = livre ? v : limpar(v);
  exigir(!obrigatorio || !!resultado.trim(), `${nome} não pode ficar vazio.`);
  exigir(resultado.length <= limite, `${nome} deve ter até ${limite} caracteres.`);
  return resultado;
}
function linkValido(v: unknown): v is string {
  if (v === "") return true;
  if (typeof v !== "string" || !/^https?:\/\//i.test(v) || /\s/.test(v)) return false;
  try { const url = new URL(v); return ["http:", "https:"].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
}
export function metricasVazias(): Metricas {
  return { visualizacoes: null, alcance: null, curtidas: null, comentarios: null, salvamentos: null, compartilhamentos: null, visitasPerfil: null, seguidores: null };
}
function normalizarPeca(entrada: NovaPeca): Required<NovaPeca> {
  exigir(etapas.includes(entrada.etapa), "Etapa inválida.");
  const tematica = entrada.tematica === undefined ? "" : entrada.tematica;
  exigir(tematica === "" || identificador(tematica), "Temática inválida.");
  const angulo = entrada.angulo === undefined ? "" : entrada.angulo;
  exigir(angulo === "" || ANGULOS.some((a) => a.id === angulo), "Ângulo inválido.");
  const profundidade = entrada.profundidade === undefined ? "" : entrada.profundidade;
  exigir(["", "raso", "profundo"].includes(profundidade), "Profundidade inválida.");
  const formato = entrada.formato === undefined ? "" : entrada.formato;
  exigir(formato === "" || FORMATOS.some((f) => f.id === formato), "Formato inválido.");
  const data = entrada.data === undefined ? "" : entrada.data;
  exigir(data === "" || dataValida(data), "Data inválida. Use YYYY-MM-DD.");
  const link = entrada.link === undefined ? "" : entrada.link;
  exigir(linkValido(link), "Link deve ser uma URL HTTP ou HTTPS válida.");
  const m = entrada.metricas === undefined ? metricasVazias() : entrada.metricas;
  exigir(objeto(m) && Object.keys(m).length === camposMetricas.length, "Métricas inválidas.");
  const metricas = metricasVazias();
  for (const campo of camposMetricas) {
    const valor = m[campo];
    exigir(valor === null || (typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0), "Métrica deve ser um inteiro não negativo ou nulo.");
    metricas[campo] = valor;
  }
  const lista = entrada.checklist === undefined ? [] : entrada.checklist;
  exigir(Array.isArray(lista) && lista.length <= 30, "Checklist deve ter até 30 itens.");
  const ids = new Set<string>();
  const checklist = Array.from(lista, (item) => {
    exigir(objeto(item) && identificador(item.id) && !ids.has(item.id), "ID de item inválido ou repetido.");
    exigir(typeof item.feito === "boolean", "Estado do item inválido.");
    ids.add(item.id);
    return { id: item.id, texto: texto(item.texto, "Texto do item", 200, true), feito: item.feito };
  });
  return {
    etapa: entrada.etapa, titulo: texto(entrada.titulo, "Título", 140, true), tematica, angulo, profundidade, formato,
    gancho: texto(entrada.gancho === undefined ? "" : entrada.gancho, "Gancho", 300),
    roteiro: texto(entrada.roteiro === undefined ? "" : entrada.roteiro, "Roteiro", 8000, false, true),
    legenda: texto(entrada.legenda === undefined ? "" : entrada.legenda, "Legenda", 2200, false, true),
    data, link, metricas, checklist,
  };
}
function normalizarNota(entrada: NovaNota): Required<NovaNota> {
  exigir(GRUPOS.some((g) => g.id === entrada.grupo), "Grupo de nota inválido.");
  const fixada = entrada.fixada === undefined ? false : entrada.fixada;
  exigir(typeof fixada === "boolean", "Estado da nota inválido.");
  return { grupo: entrada.grupo, titulo: texto(entrada.titulo, "Título da nota", 120, true), texto: texto(entrada.texto === undefined ? "" : entrada.texto, "Texto da nota", 12000, false, true), fixada };
}
function normalizarTematica(entrada: NovaTematica): Required<NovaTematica> {
  const cor = entrada.cor === undefined ? "#0A84FF" : entrada.cor;
  exigir(typeof cor === "string" && /^#[\da-f]{6}$/i.test(cor), "Cor deve usar o formato #RRGGBB.");
  return { nome: texto(entrada.nome, "Nome da temática", 60, true), cliente: texto(entrada.cliente === undefined ? "" : entrada.cliente, "Lado do cliente", 1000, false, true), eu: texto(entrada.eu === undefined ? "" : entrada.eu, "Meu lado", 1000, false, true), cor };
}
function hojeValido(hoje: string) { exigir(dataValida(hoje), "Data de hoje inválida."); }
export function estudioVazio(): Estudio {
  return { versao: 1, pecas: { ideias: [], roteiro: [], producao: [], pronto: [], publicado: [] }, notas: [], tematicas: [] };
}
export function criarPeca(entrada: NovaPeca, hoje = hojeISO()): Peca {
  hojeValido(hoje);
  return { ...normalizarPeca(entrada), id: novoId(), criadoEm: hoje, atualizadoEm: hoje, publicadoEm: entrada.etapa === "publicado" ? hoje : "" };
}
export function criarNota(entrada: NovaNota, hoje = hojeISO()): Nota {
  hojeValido(hoje);
  return { ...normalizarNota(entrada), id: novoId(), atualizadoEm: hoje };
}
export function criarTematica(entrada: NovaTematica): Tematica { return { ...normalizarTematica(entrada), id: novoId() }; }

// Compara o formato inteiro sem depender da ordem das chaves do JSON.
function igual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!objeto(a) && !Array.isArray(a)) return false;
  if (!objeto(b) && !Array.isArray(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const x = a as Record<string, unknown>, y = b as Record<string, unknown>;
  return Object.keys(x).length === Object.keys(y).length && Object.keys(y).every((k) => Object.hasOwn(x, k) && igual(x[k], y[k]));
}
export function ehEstudio(v: unknown): v is Estudio {
  if (!objeto(v) || v.versao !== 1 || !objeto(v.pecas) || !Array.isArray(v.notas) || !Array.isArray(v.tematicas)) return false;
  if (Object.keys(v).length !== 4 || !["versao", "pecas", "notas", "tematicas"].every((k) => Object.hasOwn(v, k))) return false;
  if (Object.keys(v.pecas).length !== etapas.length || !etapas.every((k) => Object.hasOwn(v.pecas as object, k))) return false;
  const ids = new Set<string>(), tematicas = new Set<string>();
  const reservar = (id: unknown) => {
    exigir(identificador(id) && !ids.has(id), "ID inválido ou repetido no estúdio.");
    ids.add(id);
  };
  try {
    for (const t of v.tematicas) {
      exigir(objeto(t), "Temática inválida."); reservar(t.id);
      exigir(igual(t, { ...normalizarTematica(t as NovaTematica), id: t.id }), "Temática inválida.");
      tematicas.add(t.id as string);
    }
    for (const n of v.notas) {
      exigir(objeto(n) && dataValida(n.atualizadoEm), "Nota inválida."); reservar(n.id);
      exigir(igual(n, { ...normalizarNota(n as NovaNota), id: n.id, atualizadoEm: n.atualizadoEm }), "Nota inválida.");
    }
    for (const etapa of etapas) {
      const lista = v.pecas[etapa]; exigir(Array.isArray(lista), "Etapa inválida.");
      for (const p of lista) {
        exigir(objeto(p) && p.etapa === etapa && dataValida(p.criadoEm) && dataValida(p.atualizadoEm), "Peça inválida.");
        reservar(p.id);
        exigir(etapa === "publicado" ? dataValida(p.publicadoEm) : p.publicadoEm === "", "Data de publicação inválida.");
        exigir(igual(p, { ...normalizarPeca(p as NovaPeca), id: p.id, criadoEm: p.criadoEm, atualizadoEm: p.atualizadoEm, publicadoEm: p.publicadoEm }), "Peça inválida.");
        exigir(p.tematica === "" || tematicas.has(p.tematica as string), "Temática não encontrada.");
        for (const item of p.checklist as ItemChecklist[]) reservar(item.id);
      }
    }
    return true;
  } catch { return false; }
}
function copiar(e: Estudio): Estudio {
  return { versao: 1, pecas: { ideias: [...e.pecas.ideias], roteiro: [...e.pecas.roteiro], producao: [...e.pecas.producao], pronto: [...e.pecas.pronto], publicado: [...e.pecas.publicado] }, notas: [...e.notas], tematicas: [...e.tematicas] };
}
function validar(e: Estudio): Estudio { exigir(ehEstudio(e), "Estúdio inválido. Confira IDs, campos e referências de temática."); return e; }
export function encontrar(e: Estudio, id: string): Peca | null {
  for (const etapa of etapas) { const p = e.pecas[etapa].find((p) => p.id === id); if (p) return p; }
  return null;
}
function obter(e: Estudio, id: string): Peca { const p = encontrar(e, id); exigir(p, "Peça não encontrada."); return p; }
export function adicionar(e: Estudio, entrada: NovaPeca, posicao: "inicio" | "fim" = "fim", hoje = hojeISO()): Estudio {
  const p = criarPeca(entrada, hoje), copia = copiar(e);
  exigir(posicao === "inicio" || posicao === "fim", "Posição inválida.");
  if (posicao === "inicio") copia.pecas[p.etapa].unshift(p); else copia.pecas[p.etapa].push(p);
  return validar(copia);
}
export function mover(e: Estudio, id: string, destino: EtapaId, indice: number, hoje = hojeISO()): Estudio {
  exigir(etapas.includes(destino), "Etapa inválida."); hojeValido(hoje);
  exigir(typeof indice === "number" && !Number.isNaN(indice), "Índice inválido.");
  const p = obter(e, id), copia = copiar(e);
  copia.pecas[p.etapa] = copia.pecas[p.etapa].filter((p) => p.id !== id);
  const lista = copia.pecas[destino];
  lista.splice(Math.max(0, Math.min(Math.trunc(indice), lista.length)), 0, { ...p, etapa: destino, atualizadoEm: hoje, publicadoEm: destino === "publicado" ? p.publicadoEm || hoje : "" });
  return validar(copia);
}
export function editar(e: Estudio, id: string, patch: Partial<NovaPeca>, hoje = hojeISO()): Estudio {
  const p = obter(e, id); hojeValido(hoje);
  const campos = normalizarPeca({ ...p, ...patch }), copia = copiar(e);
  copia.pecas[p.etapa] = copia.pecas[p.etapa].map((atual) => atual.id === id ? { ...p, ...campos, etapa: p.etapa, atualizadoEm: hoje } : atual);
  if (patch.etapa !== undefined) return mover(copia, id, patch.etapa, Infinity, hoje);
  return validar(copia);
}
export function remover(e: Estudio, id: string): Estudio {
  const copia = copiar(e);
  for (const etapa of etapas) copia.pecas[etapa] = copia.pecas[etapa].filter((p) => p.id !== id);
  return validar(copia);
}
export function duplicar(e: Estudio, id: string, hoje = hojeISO()): Estudio {
  const p = obter(e, id), copia = copiar(e);
  const nova = criarPeca({ ...p, titulo: `${p.titulo.slice(0, 132).trimEnd()} (cópia)`, metricas: metricasVazias(), checklist: p.checklist.map((i) => ({ ...i, id: novoId(), feito: false })) }, hoje);
  copia.pecas[p.etapa].splice(copia.pecas[p.etapa].findIndex((p) => p.id === id) + 1, 0, nova);
  return validar(copia);
}
function alterarChecklist(e: Estudio, id: string, op: (lista: ItemChecklist[]) => ItemChecklist[], hoje: string): Estudio {
  return editar(e, id, { checklist: op(obter(e, id).checklist.map((i) => ({ ...i }))) }, hoje);
}
function obterItem(lista: ItemChecklist[], id: string): ItemChecklist { const i = lista.find((i) => i.id === id); exigir(i, "Item do checklist não encontrado."); return i; }
export function adicionarItem(e: Estudio, id: string, texto: string, hoje = hojeISO()): Estudio { return alterarChecklist(e, id, (l) => [...l, { id: novoId(), texto, feito: false }], hoje); }
export function editarItem(e: Estudio, id: string, itemId: string, texto: string, hoje = hojeISO()): Estudio { return alterarChecklist(e, id, (l) => { obterItem(l, itemId).texto = texto; return l; }, hoje); }
export function alternarItem(e: Estudio, id: string, itemId: string, hoje = hojeISO()): Estudio { return alterarChecklist(e, id, (l) => { const i = obterItem(l, itemId); i.feito = !i.feito; return l; }, hoje); }
export function removerItem(e: Estudio, id: string, itemId: string, hoje = hojeISO()): Estudio { return alterarChecklist(e, id, (l) => { obterItem(l, itemId); return l.filter((i) => i.id !== itemId); }, hoje); }
export function progresso(p: Peca): { feitos: number; total: number } { return { feitos: p.checklist.filter((i) => i.feito).length, total: p.checklist.length }; }

export function adicionarNota(e: Estudio, entrada: NovaNota, hoje = hojeISO()): Estudio { const copia = copiar(e); copia.notas.push(criarNota(entrada, hoje)); return validar(copia); }
export function editarNota(e: Estudio, id: string, patch: Partial<NovaNota>, hoje = hojeISO()): Estudio {
  const n = e.notas.find((n) => n.id === id); exigir(n, "Nota não encontrada."); hojeValido(hoje);
  const campos = normalizarNota({ ...n, ...patch }), copia = copiar(e);
  copia.notas = copia.notas.map((n) => n.id === id ? { ...n, ...campos, atualizadoEm: hoje } : n);
  return validar(copia);
}
export function alternarNotaFixada(e: Estudio, id: string, hoje = hojeISO()): Estudio {
  const nota = e.notas.find((n) => n.id === id); exigir(nota, "Nota não encontrada.");
  return editarNota(e, id, { fixada: !nota.fixada }, hoje);
}
export function removerNota(e: Estudio, id: string): Estudio {
  const copia = copiar(e); copia.notas = copia.notas.filter((n) => n.id !== id); return validar(copia);
}
export function adicionarTematica(e: Estudio, entrada: NovaTematica): Estudio { const copia = copiar(e); copia.tematicas.push(criarTematica(entrada)); return validar(copia); }
export function editarTematica(e: Estudio, id: string, patch: Partial<NovaTematica>): Estudio {
  const t = e.tematicas.find((t) => t.id === id); exigir(t, "Temática não encontrada.");
  const campos = normalizarTematica({ ...t, ...patch }), copia = copiar(e);
  copia.tematicas = copia.tematicas.map((t) => t.id === id ? { ...t, ...campos } : t);
  return validar(copia);
}
export function removerTematica(e: Estudio, id: string, hoje = hojeISO()): Estudio {
  hojeValido(hoje); const copia = copiar(e);
  copia.tematicas = copia.tematicas.filter((t) => t.id !== id);
  for (const etapa of etapas) copia.pecas[etapa] = copia.pecas[etapa].map((p) => p.tematica === id ? { ...p, tematica: "", atualizadoEm: hoje } : p);
  return validar(copia);
}
export type FiltroPecas = { busca?: string; etapa?: EtapaId; tematica?: string; angulo?: AnguloId | ""; profundidade?: Profundidade | ""; formato?: FormatoId | "" };
/** Lista na ordem das etapas e na ordem manual dentro de cada etapa. */
export function filtrarPecas(e: Estudio, filtro: FiltroPecas = {}): Peca[] {
  const busca = semAcentos(filtro.busca?.trim() || "");
  return etapas.flatMap((etapa) => e.pecas[etapa]).filter((p) => {
    const t = e.tematicas.find((t) => t.id === p.tematica);
    return [p.titulo, p.gancho, p.roteiro, p.legenda, t?.nome || "", ...p.checklist.map((i) => i.texto)].some((v) => semAcentos(v).includes(busca))
      && (["etapa", "tematica", "angulo", "profundidade", "formato"] as const).every((campo) => filtro[campo] === undefined || p[campo] === filtro[campo]);
  });
}
/** Contagens por profundidade; peças ainda não classificadas ficam explícitas. */
export function equilibrio(e: Estudio, filtro: FiltroPecas = {}): { raso: number; profundo: number; semProfundidade: number; total: number } {
  const pecas = filtrarPecas(e, filtro);
  return { raso: pecas.filter((p) => p.profundidade === "raso").length, profundo: pecas.filter((p) => p.profundidade === "profundo").length, semProfundidade: pecas.filter((p) => !p.profundidade).length, total: pecas.length };
}
/** Sete dias de segunda a domingo, pela data planejada/real, sem conversão de fuso. */
export function semana(e: Estudio, referencia = hojeISO()): { data: string; pecas: Peca[] }[] {
  exigir(dataValida(referencia), "Data de referência inválida.");
  const dia = new Date(`${referencia}T00:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() - (dia.getUTCDay() + 6) % 7);
  const pecas = filtrarPecas(e);
  return Array.from({ length: 7 }, () => {
    const data = dia.toISOString().slice(0, 10); dia.setUTCDate(dia.getUTCDate() + 1);
    return { data, pecas: pecas.filter((p) => p.data === data) };
  });
}
export const chaveEstudio = (userId: string): string => `mf-conteudo:v1:${userId}`;
export function carregarEstudio(storage: Pick<Storage, "getItem">, userId: string, semente: () => Estudio): { estudio: Estudio; origem: "v1" | "semente"; erro: string } {
  let salvo: string | null;
  try { salvo = storage.getItem(chaveEstudio(userId)); }
  catch { return { estudio: estudioVazio(), origem: "v1", erro: "Não foi possível ler o estúdio salvo." }; }
  if (salvo !== null) {
    try { const estudio: unknown = JSON.parse(salvo); if (ehEstudio(estudio)) return { estudio, origem: "v1", erro: "" }; }
    catch { /* preservar o conteúdo inválido para recuperação manual */ }
    return { estudio: estudioVazio(), origem: "v1", erro: "O estúdio salvo está inválido. Recupere os dados antes de editar." };
  }
  const estudio = semente();
  return ehEstudio(estudio) ? { estudio, origem: "semente", erro: "" } : { estudio: estudioVazio(), origem: "semente", erro: "A semente do estúdio está inválida." };
}
export function salvarEstudio(storage: Pick<Storage, "setItem">, userId: string, estudio: Estudio): boolean {
  if (!ehEstudio(estudio)) return false;
  try { storage.setItem(chaveEstudio(userId), JSON.stringify(estudio)); return true; }
  catch { return false; }
}

/* Acrescentado na revisão (Claude): o que a interface precisa além do brief entregue. */

/** Troca só os números informados; os outros ficam como estão. */
export function editarMetricas(e: Estudio, id: string, patch: Partial<Metricas>, hoje = hojeISO()): Estudio {
  const p = obter(e, id);
  return editar(e, id, { metricas: { ...p.metricas, ...patch } }, hoje);
}
/** Notas de uma pasta: fixadas primeiro, depois as editadas mais recentemente. */
export function notasDoGrupo(e: Estudio, grupo: GrupoNota): Nota[] {
  return e.notas
    .filter((n) => n.grupo === grupo)
    .sort((a, b) => Number(b.fixada) - Number(a.fixada) || (a.atualizadoEm < b.atualizadoEm ? 1 : a.atualizadoEm > b.atualizadoEm ? -1 : 0));
}
/** Tinha data para sair e ainda não saiu. */
export function atrasada(p: Peca, hoje = hojeISO()): boolean {
  return !!p.data && p.data < hoje && p.etapa !== "publicado";
}
/** Mistura de um período (datas inclusivas): profundidade, ângulos e formatos das peças com data. */
export function mistura(e: Estudio, periodo: { de: string; ate: string }): {
  raso: number; profundo: number; total: number; angulos: Record<AnguloId, number>; formatos: Record<FormatoId, number>;
} {
  exigir(dataValida(periodo.de) && dataValida(periodo.ate), "Período inválido.");
  const pecas = filtrarPecas(e).filter((p) => p.data && p.data >= periodo.de && p.data <= periodo.ate);
  const angulos = Object.fromEntries(ANGULOS.map((a) => [a.id, 0])) as Record<AnguloId, number>;
  const formatos = Object.fromEntries(FORMATOS.map((f) => [f.id, 0])) as Record<FormatoId, number>;
  for (const p of pecas) {
    if (p.angulo) angulos[p.angulo] += 1;
    if (p.formato) formatos[p.formato] += 1;
  }
  return { raso: pecas.filter((p) => p.profundidade === "raso").length, profundo: pecas.filter((p) => p.profundidade === "profundo").length, total: pecas.length, angulos, formatos };
}
