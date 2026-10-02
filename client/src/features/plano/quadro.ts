import { hojeISO, isPlanoState, storageKey, type PlanoState } from "./store";

export type ColunaId = "ideias" | "referencias" | "fazer" | "agenda" | "feito";
export const COLUNAS: { id: ColunaId; titulo: string; descricao: string }[] = [
  { id: "ideias", titulo: "Ideias", descricao: "O que já pensei e ainda não decidi" },
  { id: "referencias", titulo: "Referências", descricao: "Sites, posts e materiais que inspiram" },
  { id: "fazer", titulo: "A fazer", descricao: "Decidido, na fila" },
  { id: "agenda", titulo: "Agenda", descricao: "Tem data marcada" },
  { id: "feito", titulo: "Feito", descricao: "Entregue" },
];

export type EtiquetaId =
  | "cliente" | "sistema" | "automacao" | "conteudo" | "produto" | "estudo" | "pessoal" | "urgente";
export const ETIQUETAS: { id: EtiquetaId; nome: string; cor: string }[] = [
  { id: "cliente", nome: "Cliente", cor: "#2563EB" },
  { id: "sistema", nome: "Sistema", cor: "#7C3AED" },
  { id: "automacao", nome: "Automação", cor: "#0F766E" },
  { id: "conteudo", nome: "Conteúdo", cor: "#DB2777" },
  { id: "produto", nome: "Produto", cor: "#C2410C" },
  { id: "estudo", nome: "Estudo", cor: "#4D7C0F" },
  { id: "pessoal", nome: "Pessoal", cor: "#475569" },
  { id: "urgente", nome: "Urgente", cor: "#DC2626" },
];

export type ItemChecklist = { id: string; texto: string; feito: boolean };
export type Cartao = {
  id: string;
  coluna: ColunaId;
  titulo: string;
  descricao: string;
  etiquetas: EtiquetaId[];
  projeto: string;
  link: string;
  data: string;
  hora: string;
  checklist: ItemChecklist[];
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm: string;
};
export type Quadro = { versao: 2; colunas: Record<ColunaId, Cartao[]> };
export type NovoCartao = Partial<Omit<Cartao, "id" | "criadoEm" | "atualizadoEm" | "concluidoEm">> & {
  titulo: string;
  coluna: ColunaId;
};

const novoId = (): string => globalThis.crypto.randomUUID();
const colunas = ["ideias", "referencias", "fazer", "agenda", "feito"] as const;
const etiquetas = ETIQUETAS.map(({ id }) => id);
const limpar = (texto: string): string => texto.trim().replace(/\s+/g, " ");
const comparar = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const semAcentos = (texto: string): string => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const identificador = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const colunaValida = (v: unknown): v is ColunaId => colunas.includes(v as ColunaId);

function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem);
}

function dataValida(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const data = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === v;
}

function linkValido(v: unknown): v is string {
  if (v === "") return true;
  if (typeof v !== "string" || !/^https?:\/\//i.test(v) || /\s/.test(v)) return false;
  try {
    const url = new URL(v);
    return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
  } catch {
    return false;
  }
}

function textoNormalizado(v: unknown, nome: string, limite: number, obrigatorio = false): string {
  exigir(typeof v === "string", `${nome} deve ser um texto.`);
  const texto = limpar(v);
  exigir(!obrigatorio || texto.length > 0, `${nome} não pode ficar vazio.`);
  exigir(texto.length <= limite, `${nome} deve ter até ${limite} caracteres.`);
  return texto;
}

function normalizar(entrada: NovoCartao): Required<NovoCartao> {
  exigir(colunaValida(entrada.coluna), "Coluna inválida.");
  const titulo = textoNormalizado(entrada.titulo, "Título", 140, true);
  const descricao = entrada.descricao === undefined ? "" : entrada.descricao;
  exigir(typeof descricao === "string" && descricao.length <= 4000, "Descrição deve ter até 4000 caracteres.");
  const projeto = textoNormalizado(entrada.projeto === undefined ? "" : entrada.projeto, "Projeto", 60);
  const link = entrada.link === undefined ? "" : entrada.link;
  exigir(linkValido(link), "Link deve ser uma URL HTTP ou HTTPS válida.");
  const data = entrada.data === undefined ? "" : entrada.data;
  const hora = entrada.hora === undefined ? "" : entrada.hora;
  exigir(data === "" || dataValida(data), "Data inválida. Use YYYY-MM-DD.");
  exigir(typeof hora === "string" && (hora === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)),
    "Hora inválida. Use HH:MM.");
  exigir(!hora || data, "Informe uma data para definir a hora.");
  const escolhidas = entrada.etiquetas === undefined ? [] : entrada.etiquetas;
  exigir(Array.isArray(escolhidas) && escolhidas.every((id) => etiquetas.includes(id)), "Etiqueta inválida.");
  const lista = entrada.checklist === undefined ? [] : entrada.checklist;
  exigir(Array.isArray(lista) && lista.length <= 50, "Checklist deve ter até 50 itens.");
  const ids = new Set<string>();
  const checklist = Array.from(lista, (item) => {
    exigir(objeto(item) && identificador(item.id) && !ids.has(item.id), "ID de item inválido ou repetido.");
    exigir(typeof item.feito === "boolean", "Estado do item inválido.");
    ids.add(item.id);
    return { id: item.id, texto: textoNormalizado(item.texto, "Texto do item", 200, true), feito: item.feito };
  });
  return {
    coluna: entrada.coluna, titulo, descricao, projeto, link, data, hora, checklist,
    etiquetas: etiquetas.filter((id) => escolhidas.includes(id)),
  };
}

export function quadroVazio(): Quadro {
  return { versao: 2, colunas: { ideias: [], referencias: [], fazer: [], agenda: [], feito: [] } };
}

export function criarCartao(entrada: NovoCartao, hoje = hojeISO()): Cartao {
  exigir(dataValida(hoje), "Data de hoje inválida.");
  return {
    ...normalizar(entrada), id: novoId(), criadoEm: hoje, atualizadoEm: hoje,
    concluidoEm: entrada.coluna === "feito" ? hoje : "",
  };
}

function copiar(q: Quadro): Quadro {
  const copia = quadroVazio();
  for (const coluna of colunas) copia.colunas[coluna] = [...q.colunas[coluna]];
  return copia;
}

function compararAgenda(a: Cartao, b: Cartao): number {
  return comparar(a.data || "9999-99-99", b.data || "9999-99-99") || comparar(a.hora, b.hora);
}

function ordenarAgenda(q: Quadro): Quadro {
  q.colunas.agenda.sort(compararAgenda);
  return q;
}

export function adicionar(q: Quadro, entrada: NovoCartao, posicao: "inicio" | "fim" = "fim", hoje = hojeISO()): Quadro {
  const cartao = criarCartao(entrada, hoje);
  const copia = copiar(q);
  // Na agenda, empates mantêm a chegada, mesmo quando a inclusão pede o início.
  if (posicao === "inicio" && cartao.coluna !== "agenda") copia.colunas[cartao.coluna].unshift(cartao);
  else copia.colunas[cartao.coluna].push(cartao);
  return ordenarAgenda(copia);
}

export function encontrar(q: Quadro, id: string): Cartao | null {
  for (const coluna of colunas) {
    const cartao = q.colunas[coluna].find((c) => c.id === id);
    if (cartao) return cartao;
  }
  return null;
}

function obter(q: Quadro, id: string): Cartao {
  const cartao = encontrar(q, id);
  exigir(cartao, "Cartão não encontrado.");
  return cartao;
}

export function mover(q: Quadro, id: string, destino: ColunaId, indice: number, hoje = hojeISO()): Quadro {
  exigir(colunaValida(destino), "Coluna inválida.");
  exigir(dataValida(hoje), "Data de hoje inválida.");
  exigir(!Number.isNaN(indice), "Índice inválido.");
  const original = obter(q, id);
  const copia = copiar(q);
  // Reordenar a própria agenda não altera a ordem de chegada nos empates.
  if (original.coluna === "agenda" && destino === "agenda") {
    copia.colunas.agenda = copia.colunas.agenda.map((c) => c.id === id ? { ...c, atualizadoEm: hoje } : c);
    return ordenarAgenda(copia);
  }
  copia.colunas[original.coluna] = copia.colunas[original.coluna].filter((c) => c.id !== id);
  const cartao = {
    ...original, coluna: destino, atualizadoEm: hoje,
    concluidoEm: destino === "feito" ? original.concluidoEm || hoje : "",
  };
  const lista = copia.colunas[destino];
  const posicao = destino === "agenda" ? lista.length : Math.max(0, Math.min(Math.trunc(indice), lista.length));
  lista.splice(posicao, 0, cartao);
  return ordenarAgenda(copia);
}

export function editar(q: Quadro, id: string, patch: Partial<NovoCartao>, hoje = hojeISO()): Quadro {
  const original = obter(q, id);
  exigir(dataValida(hoje), "Data de hoje inválida.");
  const campos = normalizar({ ...original, ...patch });
  const copia = copiar(q);
  copia.colunas[original.coluna] = copia.colunas[original.coluna].map((c) => c.id === id
    ? { ...original, ...campos, coluna: original.coluna, atualizadoEm: hoje }
    : c);
  if (patch.coluna !== undefined) return mover(copia, id, patch.coluna, Infinity, hoje);
  return ordenarAgenda(copia);
}

export function remover(q: Quadro, id: string): Quadro {
  const copia = copiar(q);
  for (const coluna of colunas) copia.colunas[coluna] = copia.colunas[coluna].filter((c) => c.id !== id);
  return copia;
}

export function duplicar(q: Quadro, id: string, hoje = hojeISO()): Quadro {
  const original = obter(q, id);
  const cartao = criarCartao({
    ...original,
    titulo: `${original.titulo.slice(0, 132).trimEnd()} (cópia)`,
    checklist: original.checklist.map((item) => ({ ...item, id: novoId(), feito: false })),
  }, hoje);
  const copia = copiar(q);
  const lista = copia.colunas[original.coluna];
  lista.splice(lista.findIndex((c) => c.id === id) + 1, 0, cartao);
  return ordenarAgenda(copia);
}

function alterarChecklist(q: Quadro, id: string, alterar: (lista: ItemChecklist[]) => ItemChecklist[], hoje: string): Quadro {
  return editar(q, id, { checklist: alterar(obter(q, id).checklist.map((item) => ({ ...item }))) }, hoje);
}

function obterItem(lista: ItemChecklist[], id: string): ItemChecklist {
  const item = lista.find((item) => item.id === id);
  exigir(item, "Item do checklist não encontrado.");
  return item;
}

export function adicionarItem(q: Quadro, cartaoId: string, texto: string, hoje = hojeISO()): Quadro {
  return alterarChecklist(q, cartaoId, (lista) => [...lista, { id: novoId(), texto, feito: false }], hoje);
}

export function editarItem(q: Quadro, cartaoId: string, itemId: string, texto: string, hoje = hojeISO()): Quadro {
  return alterarChecklist(q, cartaoId, (lista) => {
    obterItem(lista, itemId).texto = texto;
    return lista;
  }, hoje);
}

export function alternarItem(q: Quadro, cartaoId: string, itemId: string, hoje = hojeISO()): Quadro {
  return alterarChecklist(q, cartaoId, (lista) => {
    const item = obterItem(lista, itemId);
    item.feito = !item.feito;
    return lista;
  }, hoje);
}

export function removerItem(q: Quadro, cartaoId: string, itemId: string, hoje = hojeISO()): Quadro {
  return alterarChecklist(q, cartaoId, (lista) => {
    obterItem(lista, itemId);
    return lista.filter((item) => item.id !== itemId);
  }, hoje);
}

export function progresso(c: Cartao): { feitos: number; total: number } {
  return { feitos: c.checklist.filter((item) => item.feito).length, total: c.checklist.length };
}

export function filtrar(q: Quadro, filtro: { busca?: string; etiquetas?: EtiquetaId[]; projeto?: string }): Quadro {
  const resultado = quadroVazio();
  const busca = semAcentos(filtro.busca?.trim() || "");
  for (const coluna of colunas) {
    resultado.colunas[coluna] = q.colunas[coluna].filter((c) => {
      const textos = [c.titulo, c.descricao, c.projeto, ...c.checklist.map((item) => item.texto)];
      return textos.some((texto) => semAcentos(texto).includes(busca))
        && (filtro.etiquetas || []).every((etiqueta) => c.etiquetas.includes(etiqueta))
        && (filtro.projeto === undefined || c.projeto === filtro.projeto);
    });
  }
  return resultado;
}

export function projetos(q: Quadro): string[] {
  const nomes = colunas.flatMap((coluna) => q.colunas[coluna].map((c) => c.projeto)).filter(Boolean);
  return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function atrasado(c: Cartao, hoje = hojeISO()): boolean {
  return !!c.data && c.data < hoje && c.coluna !== "feito";
}

export function ehQuadro(v: unknown): v is Quadro {
  if (!objeto(v) || v.versao !== 2 || !objeto(v.colunas)) return false;
  const ids = new Set<string>();
  for (const coluna of colunas) {
    const lista = v.colunas[coluna];
    if (!Array.isArray(lista)) return false;
    for (const c of lista) {
      if (!objeto(c) || c.coluna !== coluna || !identificador(c.id) || ids.has(c.id)) return false;
      if (!dataValida(c.criadoEm) || !dataValida(c.atualizadoEm)) return false;
      if (coluna === "feito" ? !dataValida(c.concluidoEm) : c.concluidoEm !== "") return false;
      try {
        const campos = normalizar(c as NovoCartao);
        for (const campo of Object.keys(campos) as (keyof NovoCartao)[]) {
          if (campo === "checklist") {
            const itens = c.checklist as ItemChecklist[];
            if (!Array.isArray(itens) || itens.length !== campos.checklist.length) return false;
            if (campos.checklist.some((item, i) => item.id !== itens[i].id
              || item.texto !== itens[i].texto || item.feito !== itens[i].feito)) return false;
          } else if (JSON.stringify(c[campo]) !== JSON.stringify(campos[campo])) return false;
        }
      } catch {
        return false;
      }
      ids.add(c.id);
    }
    if (coluna === "agenda" && lista.some((c, i) => i > 0 && compararAgenda(lista[i - 1], c) > 0)) return false;
  }
  return true;
}

export const chaveQuadro = (userId: string): string => `mf-plano:v2:${userId}`;

export function migrarDoV1(v1: PlanoState, hoje = hojeISO()): Quadro {
  const quadro = quadroVazio();
  const ids = new Set<string>();
  for (const item of v1.itens) {
    const texto = limpar(item.texto);
    const coluna = item.etapa === "ideia" ? "ideias" : item.etapa;
    const cartao = criarCartao({
      coluna, titulo: texto.slice(0, 140).trimEnd() || "Sem título",
      descricao: item.texto.length > 140 ? item.texto.slice(0, 4000) : "",
    }, hoje);
    cartao.id = identificador(item.id) && !ids.has(item.id) ? item.id : cartao.id;
    cartao.criadoEm = dataValida(item.criadoEm) ? item.criadoEm : hoje;
    cartao.concluidoEm = coluna === "feito" && dataValida(item.feitoEm) ? item.feitoEm : cartao.concluidoEm;
    ids.add(cartao.id);
    quadro.colunas[coluna].push(cartao);
  }
  return quadro;
}

type QuadroCarregado = { quadro: Quadro; origem: "v2" | "migrado" | "semente"; erro: string };

export function carregarQuadro(
  storage: Pick<Storage, "getItem">, userId: string, semente: () => Quadro,
): QuadroCarregado {
  let salvo: string | null;
  try {
    salvo = storage.getItem(chaveQuadro(userId));
  } catch {
    return { quadro: quadroVazio(), origem: "v2", erro: "Não foi possível ler o quadro salvo." };
  }
  if (salvo !== null) {
    try {
      const quadro: unknown = JSON.parse(salvo);
      if (ehQuadro(quadro)) return { quadro, origem: "v2", erro: "" };
    } catch {
      // O v2 corrompido bloqueia a recuperação automática para preservar os dados.
    }
    return { quadro: quadroVazio(), origem: "v2", erro: "O quadro salvo está inválido. Recupere os dados antes de editar." };
  }
  let v1: unknown;
  try {
    v1 = JSON.parse(storage.getItem(storageKey(userId)) || "null");
  } catch {
    v1 = null;
  }
  if (!isPlanoState(v1)) return { quadro: semente(), origem: "semente", erro: "" };
  const quadro = migrarDoV1(v1);
  const inicial = semente();
  const ids = new Set(colunas.flatMap((coluna) => quadro.colunas[coluna].map((c) => c.id)));
  for (const coluna of colunas) {
    const titulos = new Set(quadro.colunas[coluna].map((c) => semAcentos(c.titulo)));
    for (const cartao of inicial.colunas[coluna]) {
      const titulo = semAcentos(cartao.titulo);
      if (titulos.has(titulo)) continue;
      const id = ids.has(cartao.id) ? novoId() : cartao.id;
      quadro.colunas[coluna].push({ ...cartao, id });
      titulos.add(titulo);
      ids.add(id);
    }
  }
  return { quadro: ordenarAgenda(quadro), origem: "migrado", erro: "" };
}

export function salvarQuadro(storage: Pick<Storage, "setItem">, userId: string, q: Quadro): boolean {
  if (!ehQuadro(q)) return false;
  try {
    storage.setItem(chaveQuadro(userId), JSON.stringify(q));
    return true;
  } catch {
    return false;
  }
}
