import { hojeISO } from "../plano/store";
import type { Cartao, ColunaId, Quadro } from "../plano/quadro";

/**
 * Calendário: um calendário seu e um por cliente. Os eventos moram aqui; os
 * cartões do Plano com data não são copiados, aparecem como "reflexo" no
 * calendário do cliente cujo projeto bate com o do cartão. Assim a fonte de
 * verdade do cartão continua sendo o quadro.
 */

export type TipoEvento = "tarefa" | "compromisso" | "reuniao" | "entrega" | "lembrete";
export const TIPOS: { id: TipoEvento; nome: string }[] = [
  { id: "tarefa", nome: "Tarefa" },
  { id: "compromisso", nome: "Compromisso" },
  { id: "reuniao", nome: "Reunião" },
  { id: "entrega", nome: "Entrega" },
  { id: "lembrete", nome: "Lembrete" },
];

/** Paleta do Calendário do iOS (modo escuro), na ordem em que o iPhone mostra. */
export const CORES_IOS: { cor: string; nome: string }[] = [
  { cor: "#FF453A", nome: "Vermelho" },
  { cor: "#FF9F0A", nome: "Laranja" },
  { cor: "#FFD60A", nome: "Amarelo" },
  { cor: "#30D158", nome: "Verde" },
  { cor: "#40C8E0", nome: "Azul-claro" },
  { cor: "#0A84FF", nome: "Azul" },
  { cor: "#5E5CE6", nome: "Índigo" },
  { cor: "#BF5AF2", nome: "Roxo" },
  { cor: "#FF375F", nome: "Rosa" },
  { cor: "#AC8E68", nome: "Marrom" },
  { cor: "#98989D", nome: "Cinza" },
];
export const CORES = CORES_IOS.map((c) => c.cor);
const corValida = (v: unknown): v is string => typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v);

export type Calendario = {
  id: string;
  nome: string;
  cor: string;
  /** Nome do projeto no Plano. Cartões com esse projeto caem neste calendário. */
  projeto: string;
};

export type Evento = {
  id: string;
  calendarioId: string;
  titulo: string;
  tipo: TipoEvento;
  data: string; // YYYY-MM-DD
  inicio: string; // HH:MM ou "" (dia inteiro)
  fim: string; // HH:MM ou ""
  local: string;
  descricao: string;
  feito: boolean;
  /** Cor própria do evento; vazio usa a do calendário. */
  cor: string;
};

export type Agenda = { versao: 1; calendarios: Calendario[]; eventos: Evento[] };

export const PESSOAL = "pessoal";

/** O que aparece numa célula do mês: evento próprio ou cartão do Plano. */
export type Item =
  | { origem: "evento"; id: string; calendarioId: string; cor: string; titulo: string; data: string; inicio: string; fim: string; tipo: TipoEvento; feito: boolean; evento: Evento }
  | { origem: "plano"; id: string; calendarioId: string; cor: string; titulo: string; data: string; inicio: string; fim: ""; tipo: "tarefa"; feito: boolean; cartao: Cartao };

const novoId = (): string => globalThis.crypto.randomUUID();
const limpar = (t: string) => t.trim().replace(/\s+/g, " ");
const semAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem);
}

export function dataValida(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
const horaValida = (v: unknown): v is string => typeof v === "string" && (v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v));

export function agendaVazia(): Agenda {
  return { versao: 1, calendarios: [{ id: PESSOAL, nome: "Meu calendário", cor: "#0A84FF", projeto: "" }], eventos: [] };
}

// ---------- calendários ----------

export type NovoCalendario = { nome: string; cor?: string; projeto?: string };

function normalizarCalendario(a: Agenda, entrada: NovoCalendario, ignorar?: string): Omit<Calendario, "id"> {
  const nome = limpar(entrada.nome ?? "");
  exigir(nome.length > 0, "Dê um nome ao calendário.");
  exigir(nome.length <= 60, "Nome do calendário deve ter até 60 caracteres.");
  exigir(!a.calendarios.some((c) => c.id !== ignorar && semAcentos(c.nome) === semAcentos(nome)), "Já existe um calendário com esse nome.");
  const projeto = limpar(entrada.projeto ?? "");
  exigir(projeto.length <= 60, "Projeto deve ter até 60 caracteres.");
  exigir(
    !projeto || !a.calendarios.some((c) => c.id !== ignorar && semAcentos(c.projeto) === semAcentos(projeto)),
    "Esse projeto do Plano já está ligado a outro calendário.",
  );
  const cor = entrada.cor ?? CORES[a.calendarios.length % CORES.length];
  exigir(corValida(cor), "Cor inválida.");
  return { nome, cor, projeto };
}

export function criarCalendario(a: Agenda, entrada: NovoCalendario): Agenda {
  const cal: Calendario = { id: novoId(), ...normalizarCalendario(a, entrada) };
  return { ...a, calendarios: [...a.calendarios, cal] };
}

export function editarCalendario(a: Agenda, id: string, patch: Partial<NovoCalendario>): Agenda {
  const atual = a.calendarios.find((c) => c.id === id);
  exigir(atual, "Calendário não encontrado.");
  const campos = normalizarCalendario(a, { ...atual, ...patch }, id);
  return { ...a, calendarios: a.calendarios.map((c) => (c.id === id ? { ...c, ...campos } : c)) };
}

/** Remove o calendário e os eventos dele. O seu calendário não sai. */
export function removerCalendario(a: Agenda, id: string): Agenda {
  exigir(id !== PESSOAL, "O seu calendário não pode ser removido.");
  exigir(a.calendarios.some((c) => c.id === id), "Calendário não encontrado.");
  return { ...a, calendarios: a.calendarios.filter((c) => c.id !== id), eventos: a.eventos.filter((e) => e.calendarioId !== id) };
}

// ---------- eventos ----------

export type NovoEvento = Partial<Omit<Evento, "id">> & { titulo: string; data: string };

function normalizarEvento(a: Agenda, e: NovoEvento): Omit<Evento, "id"> {
  const titulo = limpar(e.titulo ?? "");
  exigir(titulo.length > 0, "Dê um título.");
  exigir(titulo.length <= 140, "Título deve ter até 140 caracteres.");
  exigir(dataValida(e.data), "Data inválida.");
  const calendarioId = e.calendarioId ?? PESSOAL;
  exigir(a.calendarios.some((c) => c.id === calendarioId), "Calendário não encontrado.");
  const tipo = e.tipo ?? "compromisso";
  exigir(TIPOS.some((t) => t.id === tipo), "Tipo inválido.");
  const inicio = e.inicio ?? "";
  const fim = e.fim ?? "";
  exigir(horaValida(inicio) && horaValida(fim), "Hora inválida. Use HH:MM.");
  exigir(!fim || inicio, "Informe o início antes do fim.");
  exigir(!fim || fim > inicio, "O fim precisa ser depois do início.");
  const local = limpar(e.local ?? "");
  exigir(local.length <= 140, "Local deve ter até 140 caracteres.");
  const descricao = e.descricao ?? "";
  exigir(typeof descricao === "string" && descricao.length <= 4000, "Descrição deve ter até 4000 caracteres.");
  const cor = e.cor ?? "";
  exigir(cor === "" || corValida(cor), "Cor inválida.");
  return { calendarioId, titulo, tipo, data: e.data, inicio, fim, local, descricao, feito: e.feito === true, cor };
}

export function criarEvento(a: Agenda, entrada: NovoEvento): Agenda {
  return { ...a, eventos: [...a.eventos, { id: novoId(), ...normalizarEvento(a, entrada) }] };
}

export function editarEvento(a: Agenda, id: string, patch: Partial<NovoEvento>): Agenda {
  const atual = a.eventos.find((e) => e.id === id);
  exigir(atual, "Evento não encontrado.");
  const campos = normalizarEvento(a, { ...atual, ...patch });
  return { ...a, eventos: a.eventos.map((e) => (e.id === id ? { ...e, ...campos } : e)) };
}

export function removerEvento(a: Agenda, id: string): Agenda {
  return { ...a, eventos: a.eventos.filter((e) => e.id !== id) };
}

// ---------- ligação com o Plano ----------

/** Calendário de um cartão: o do cliente cujo projeto bate, senão o seu. */
export function calendarioDoCartao(a: Agenda, c: Pick<Cartao, "projeto">): string {
  if (!c.projeto) return PESSOAL;
  const alvo = semAcentos(c.projeto);
  return a.calendarios.find((cal) => cal.projeto && semAcentos(cal.projeto) === alvo)?.id ?? PESSOAL;
}

const COLUNAS: ColunaId[] = ["ideias", "referencias", "fazer", "agenda", "feito"];

/** Todos os itens (eventos + cartões do Plano com data) entre duas datas, inclusive, em ordem. */
export function itensEntre(a: Agenda, quadro: Quadro | null, de: string, ate: string, visiveis?: Set<string>): Item[] {
  const ok = (cal: string, data: string) => data >= de && data <= ate && (!visiveis || visiveis.has(cal));
  const itens: Item[] = [];
  const corDe = (cal: string) => a.calendarios.find((c) => c.id === cal)?.cor ?? CORES_IOS[5].cor;
  for (const e of a.eventos) {
    if (ok(e.calendarioId, e.data)) itens.push({ origem: "evento", id: e.id, calendarioId: e.calendarioId, cor: e.cor || corDe(e.calendarioId), titulo: e.titulo, data: e.data, inicio: e.inicio, fim: e.fim, tipo: e.tipo, feito: e.feito, evento: e });
  }
  if (quadro) {
    for (const col of COLUNAS) {
      for (const c of quadro.colunas[col]) {
        if (!c.data) continue;
        const cal = calendarioDoCartao(a, c);
        if (ok(cal, c.data)) itens.push({ origem: "plano", id: c.id, calendarioId: cal, cor: corDe(cal), titulo: c.titulo, data: c.data, inicio: c.hora, fim: "", tipo: "tarefa", feito: c.coluna === "feito", cartao: c });
      }
    }
  }
  // Dia inteiro antes dos horários; depois por hora; empate pelo título
  return itens.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0) || (x.inicio || "").localeCompare(y.inicio || "") || x.titulo.localeCompare(y.titulo, "pt-BR"));
}

/** Cartões do Plano que ainda não têm data (para puxar para o calendário), fora os feitos. */
export function cartoesSemData(quadro: Quadro | null): Cartao[] {
  if (!quadro) return [];
  return (["fazer", "agenda", "ideias", "referencias"] as ColunaId[]).flatMap((col) => quadro.colunas[col].filter((c) => !c.data));
}

// ---------- mês ----------

const somarDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** As semanas (segunda a domingo) que cobrem o mês. `mes` = "YYYY-MM". */
export function gradeDoMes(mes: string): string[][] {
  exigir(/^\d{4}-(0[1-9]|1[0-2])$/.test(mes), "Mês inválido.");
  const primeiro = `${mes}-01`;
  const diaSemana = (new Date(`${primeiro}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = segunda
  let dia = somarDias(primeiro, -diaSemana);
  const semanas: string[][] = [];
  do {
    const semana: string[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push(dia);
      dia = somarDias(dia, 1);
    }
    semanas.push(semana);
  } while (dia.slice(0, 7) === mes);
  return semanas;
}

export function mudarMes(mes: string, delta: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const total = ano * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export const mesDe = (iso: string) => iso.slice(0, 7);
export { hojeISO, somarDias };

// ---------- armazenamento ----------

export function ehAgenda(v: unknown): v is Agenda {
  if (!objeto(v) || v.versao !== 1 || !Array.isArray(v.calendarios) || !Array.isArray(v.eventos)) return false;
  const cals = new Set<string>();
  for (const c of v.calendarios) {
    if (!objeto(c) || typeof c.id !== "string" || !c.id || cals.has(c.id)) return false;
    if (typeof c.nome !== "string" || !c.nome.trim() || typeof c.cor !== "string" || typeof c.projeto !== "string") return false;
    cals.add(c.id);
  }
  if (!cals.has(PESSOAL)) return false;
  const ids = new Set<string>();
  for (const e of v.eventos) {
    if (!objeto(e) || typeof e.id !== "string" || !e.id || ids.has(e.id)) return false;
    if (!cals.has(e.calendarioId as string) || !dataValida(e.data) || !horaValida(e.inicio) || !horaValida(e.fim)) return false;
    if (typeof e.titulo !== "string" || !TIPOS.some((t) => t.id === e.tipo) || typeof e.feito !== "boolean") return false;
    if (typeof e.local !== "string" || typeof e.descricao !== "string") return false;
    if (e.cor !== undefined && e.cor !== "" && !corValida(e.cor)) return false;
    ids.add(e.id);
  }
  return true;
}

/** Dados salvos antes da cor por evento chegam sem `cor`: completa com "" (cor do calendário). */
export function completarAgenda(a: Agenda): Agenda {
  return a.eventos.every((e) => typeof e.cor === "string") ? a : { ...a, eventos: a.eventos.map((e) => ({ ...e, cor: e.cor ?? "" })) };
}

export const chaveAgenda = (userId: string) => `mf-calendario:v1:${userId}`;

export function carregarAgenda(storage: Pick<Storage, "getItem">, userId: string, semente: () => Agenda): { agenda: Agenda; nova: boolean; erro: string } {
  let salvo: string | null;
  try {
    salvo = storage.getItem(chaveAgenda(userId));
  } catch {
    return { agenda: agendaVazia(), nova: false, erro: "Não foi possível ler o calendário salvo." };
  }
  if (salvo === null) return { agenda: semente(), nova: true, erro: "" };
  try {
    const v: unknown = JSON.parse(salvo);
    if (ehAgenda(v)) return { agenda: completarAgenda(v), nova: false, erro: "" };
  } catch {
    // corrompido: bloqueia a edição para não sobrescrever
  }
  return { agenda: agendaVazia(), nova: false, erro: "O calendário salvo está inválido. Recupere os dados antes de editar." };
}

export function salvarAgenda(storage: Pick<Storage, "setItem">, userId: string, a: Agenda): boolean {
  if (!ehAgenda(a)) return false;
  try {
    storage.setItem(chaveAgenda(userId), JSON.stringify(a));
    return true;
  } catch {
    return false;
  }
}

/** Primeira abertura: o seu calendário e os clientes ativos, já ligados aos projetos do Plano. */
export function sementeAgenda(): Agenda {
  let a = agendaVazia();
  for (const [nome, projeto] of [
    ["TS Kite Center", "TS Kite Center"],
    ["Villa's", "Villa's Flow"],
    ["Top Saúde", "Top Saúde"],
    ["Volt Acessórios", "Volt Acessórios"],
  ]) a = criarCalendario(a, { nome, projeto });
  return a;
}

