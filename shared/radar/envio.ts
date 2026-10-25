import type { Bloqueado, ConfigRadar, Envio, Lead, StatusEnvio, TipoEnvio } from "./tipos.ts";
import { ETAPAS } from "./funil.ts";
import type { Etapa, Registro } from "./funil.ts";
import { normalizarInstagram } from "./normalizar.ts";

export type EstadoEnvio = {
  leads: Lead[];
  envios: Envio[];
  registros: Record<string, Registro>;
  bloqueados: Bloqueado[];
  config: ConfigRadar;
};
export type PermissaoEnvio = { ok: true } | {
  ok: false;
  motivo: "pausado" | "fim-de-semana" | "fora-da-janela" | "limite-do-dia" | "intervalo";
  proximoEm?: string;
};
export const STATUS_ENVIOS: StatusEnvio[] = ["rascunho", "aprovado", "reprovado", "enviando", "enviado", "falhou", "cancelado"];
const DIA = 86_400_000;
const FUSO = 3 * 3_600_000;
const horarioValido = (valor: unknown): valor is string => typeof valor === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(valor);
const objeto = (valor: unknown): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor);

function instante(data: Date): number {
  const valor = data.getTime();
  if (!Number.isFinite(valor)) throw new Error("Data inválida");
  return valor;
}
function dataLocal(agora: Date): Date { return new Date(instante(agora) - FUSO); }
export function hojeFortaleza(agora: Date): string { return dataLocal(agora).toISOString().slice(0, 10); }
function diaUtil(agora: Date): boolean { return ![0, 6].includes(dataLocal(agora).getUTCDay()); }
function horarioDoDia(agora: Date, horario: string): Date { return new Date(`${hojeFortaleza(agora)}T${horario}:00-03:00`); }

/** Fortaleza permanece em UTC-3; a janela inclui o início e exclui o fim. */
function proximaJanela(config: ConfigRadar, desde: Date): Date {
  let dia = new Date(instante(desde));
  for (;;) {
    const inicio = horarioDoDia(dia, config.envio.janela.inicio);
    const fim = horarioDoDia(dia, config.envio.janela.fim);
    if ((!config.envio.soDiasUteis || diaUtil(dia)) && dia < fim) return dia < inicio ? inicio : dia;
    dia = new Date(horarioDoDia(dia, "00:00").getTime() + DIA);
  }
}

export function enviadosHoje(envios: Envio[], agora: Date): number {
  const hoje = hojeFortaleza(agora);
  return envios.filter((envio) => envio.status === "enviado" && envio.enviadoEm && hojeFortaleza(new Date(envio.enviadoEm)) === hoje).length;
}

export function podeEnviarAgora(config: ConfigRadar, envios: Envio[], agora: Date): PermissaoEnvio {
  exigirConfig(config);
  const atual = instante(agora);
  if (config.envio.pausado) return { ok: false, motivo: "pausado" };
  const limite = enviadosHoje(envios, agora) >= config.envio.limiteDiario;
  const ultimo = Math.max(-Infinity, ...envios.filter((e) => e.status === "enviado" && e.enviadoEm).map((e) => instante(new Date(e.enviadoEm!))));
  const fimIntervalo = ultimo + config.envio.intervaloMinSeg * 1000;
  let proximo = Math.max(atual, fimIntervalo);
  if (limite) proximo = Math.max(proximo, horarioDoDia(agora, "00:00").getTime() + DIA);
  const proximoEm = proximaJanela(config, new Date(proximo)).toISOString();
  if (config.envio.soDiasUteis && !diaUtil(agora)) return { ok: false, motivo: "fim-de-semana", proximoEm };
  if (agora < horarioDoDia(agora, config.envio.janela.inicio) || agora >= horarioDoDia(agora, config.envio.janela.fim)) return { ok: false, motivo: "fora-da-janela", proximoEm };
  if (limite) return { ok: false, motivo: "limite-do-dia", proximoEm };
  if (atual < fimIntervalo) return { ok: false, motivo: "intervalo", proximoEm };
  return { ok: true };
}

export function esperaSorteada(config: ConfigRadar, aleatorio: () => number = Math.random): number {
  exigirConfig(config);
  const sorteio = aleatorio();
  if (!Number.isFinite(sorteio) || sorteio < 0 || sorteio >= 1) throw new Error("Sorteio deve estar entre zero (inclusive) e um (exclusive)");
  return config.envio.intervaloMinSeg + Math.floor(sorteio * (config.envio.intervaloMaxSeg - config.envio.intervaloMinSeg + 1));
}

function etapaDo(estado: EstadoEnvio, id: string): Etapa {
  return Object.hasOwn(estado.registros, id) ? estado.registros[id].etapa : "novo";
}
export function estaBloqueado(estado: EstadoEnvio, instagram: string): boolean {
  const usuario = normalizarInstagram(instagram);
  return estado.bloqueados.some((b) => normalizarInstagram(b.instagram) === usuario);
}
function apto(estado: EstadoEnvio, envio: Envio, agora: Date): boolean {
  const lead = estado.leads.find((l) => l.id === envio.leadId);
  if (!lead || estaBloqueado(estado, envio.destino) || estaBloqueado(estado, lead.instagram.usuario)) return false;
  if (envio.tipo === "primeira") return etapaDo(estado, lead.id) === "novo";
  return etapaDo(estado, lead.id) === "abordado" && Boolean(envio.agendadoPara) && Date.parse(envio.agendadoPara!) <= instante(agora);
}

export function proximoDaFila(estado: EstadoEnvio, agora: Date): Envio | undefined {
  if (!podeEnviarAgora(estado.config, estado.envios, agora).ok || estado.envios.some((e) => e.status === "enviando")) return undefined;
  const notas = new Map(estado.leads.map((l) => [l.id, l.pontuacao]));
  return estado.envios.filter((e) => e.status === "aprovado" && apto(estado, e, agora)).sort((a, b) =>
    (notas.get(b.leadId) ?? 0) - (notas.get(a.leadId) ?? 0) ||
    Date.parse(a.decididoEm ?? a.criadoEm) - Date.parse(b.decididoEm ?? b.criadoEm) || a.id.localeCompare(b.id),
  )[0];
}

function mensagemValida(mensagem: unknown): string {
  if (typeof mensagem !== "string" || !mensagem.trim()) throw new Error("mensagem: informe um texto não vazio");
  const texto = mensagem.trim();
  if (texto.length > 1000) throw new Error("mensagem: máximo de 1000 caracteres");
  if (texto.includes("\u2014")) throw new Error("mensagem: travessão proibido");
  return texto;
}
function textoOpcional(valor: unknown, campo: string): string | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor !== "string") throw new Error(`${campo}: informe um texto`);
  return valor.trim();
}
function textoObrigatorio(valor: unknown, campo: string): string {
  const texto = textoOpcional(valor, campo);
  if (!texto) throw new Error(`${campo}: informe um texto não vazio`);
  return texto;
}

export function transicionar(envio: Envio, para: StatusEnvio, dados: { motivo?: string; erro?: string }, agora: Date): Envio {
  const permitidas: Record<StatusEnvio, StatusEnvio[]> = {
    rascunho: ["aprovado", "reprovado", "cancelado"], aprovado: ["enviando", "cancelado"],
    enviando: ["enviado", "falhou", "cancelado"], falhou: ["aprovado", "cancelado"],
    reprovado: ["cancelado"], enviado: [], cancelado: [],
  };
  if (!permitidas[envio.status]?.includes(para)) throw new Error(`Transição inválida: ${envio.status} para ${para}`);
  const proximo = { ...envio, status: para };
  const em = new Date(instante(agora)).toISOString();
  if (para === "aprovado" || para === "enviando") proximo.mensagem = mensagemValida(envio.mensagem);
  if (para === "aprovado" || para === "reprovado") {
    proximo.decididoEm = em;
    delete proximo.motivoReprova;
    if (para === "reprovado") proximo.motivoReprova = textoOpcional(dados.motivo, "motivo");
  }
  if (para === "aprovado" || para === "enviado") delete proximo.erro;
  if (para === "enviado") proximo.enviadoEm = em;
  if (para === "falhou") proximo.erro = textoObrigatorio(dados.erro, "erro");
  return proximo;
}

function exigirLead(estado: EstadoEnvio, leadId: string): Lead {
  const lead = estado.leads.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Lead não encontrado: ${leadId}`);
  return lead;
}
function substituivel(envio: Envio): boolean { return envio.status === "reprovado" || envio.status === "cancelado"; }

export function criarRascunho(estado: EstadoEnvio, leadId: string, tipo: TipoEnvio, mensagem: string | undefined, agora: Date): Envio {
  exigirConfig(estado.config);
  if (tipo !== "primeira" && tipo !== "followup") throw new Error("tipo: use primeira ou followup");
  const lead = exigirLead(estado, leadId);
  const destino = normalizarInstagram(lead.instagram.usuario);
  if (!/^[a-z0-9._]{1,30}$/.test(destino)) throw new Error("Instagram do lead inválido");
  if (estaBloqueado(estado, destino)) throw new Error(`Instagram bloqueado: ${destino}`);
  if (estado.envios.some((e) => e.leadId === leadId && e.tipo === tipo && !substituivel(e))) throw new Error(`Já existe ${tipo} para ${leadId}`);
  let agendadoPara: string | undefined;
  if (tipo === "followup") {
    const primeira = estado.envios.find((e) => e.leadId === leadId && e.tipo === "primeira" && e.status === "enviado");
    if (!primeira?.enviadoEm) throw new Error("Followup exige primeira mensagem enviada");
    agendadoPara = new Date(instante(new Date(primeira.enviadoEm)) + estado.config.oferta.followupDias * DIA).toISOString();
  }
  return {
    id: `${leadId}:${tipo}`, leadId, destino, canal: "instagram", tipo,
    mensagem: mensagemValida(mensagem ?? (tipo === "primeira" ? lead.abordagem.mensagem : lead.abordagem.followup)),
    status: "rascunho", criadoEm: new Date(instante(agora)).toISOString(), ...(agendadoPara ? { agendadoPara } : {}),
  };
}

export function editarMensagem(envio: Envio, mensagem: string): Envio {
  if (envio.status !== "rascunho") throw new Error("Só é possível editar mensagem em rascunho");
  return { ...envio, mensagem: mensagemValida(mensagem) };
}

export function followupsVencidos(estado: EstadoEnvio, agora: Date): string[] {
  exigirConfig(estado.config);
  return estado.leads.filter((lead) => {
    if (etapaDo(estado, lead.id) !== "abordado" || estaBloqueado(estado, lead.instagram.usuario)) return false;
    const primeira = estado.envios.find((e) => e.leadId === lead.id && e.tipo === "primeira" && e.status === "enviado");
    return primeira?.enviadoEm && !estaBloqueado(estado, primeira.destino) &&
      instante(new Date(primeira.enviadoEm)) + estado.config.oferta.followupDias * DIA <= instante(agora) &&
      !estado.envios.some((e) => e.leadId === lead.id && e.tipo === "followup" && !substituivel(e));
  }).map((lead) => lead.id);
}

export function mudarEtapa(registros: Record<string, Registro>, leadId: string, etapa: Etapa, agora: Date, anotacao?: string): Record<string, Registro> {
  if (!Object.hasOwn(ETAPAS, etapa)) throw new Error(`Etapa inválida: ${etapa}`);
  textoObrigatorio(leadId, "leadId");
  const anterior = Object.hasOwn(registros, leadId) ? registros[leadId] : undefined;
  const em = new Date(instante(agora)).toISOString();
  const historico = [...(anterior?.historico ?? [])];
  if ((anterior?.etapa ?? "novo") !== etapa) historico.push({ etapa, em });
  return { ...registros, [leadId]: { etapa, anotacao: textoOpcional(anotacao, "anotacao") ?? anterior?.anotacao ?? "", atualizadoEm: em, historico } };
}

export function resumoDoDia(estado: EstadoEnvio, agora: Date) {
  return {
    enviadosHoje: enviadosHoje(estado.envios, agora), limite: estado.config.envio.limiteDiario,
    aprovados: estado.envios.filter((e) => e.status === "aprovado").length,
    rascunhos: estado.envios.filter((e) => e.status === "rascunho").length,
    pausado: estado.config.envio.pausado, pode: podeEnviarAgora(estado.config, estado.envios, agora),
  };
}

export function validarConfig(config: unknown): string[] {
  if (!objeto(config)) return ["config: informe um objeto"];
  const erros: string[] = [];
  const envio = objeto(config.envio) ? config.envio : {};
  const oferta = objeto(config.oferta) ? config.oferta : {};
  const cliente = objeto(config.clienteIdeal) ? config.clienteIdeal : {};
  const inteiro = (valor: unknown, campo: string, minimo: number) => {
    if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor < minimo) erros.push(`${campo}: informe um inteiro maior ou igual a ${minimo}`);
  };
  inteiro(envio.limiteDiario, "envio.limiteDiario", 1);
  inteiro(envio.intervaloMinSeg, "envio.intervaloMinSeg", 0);
  inteiro(envio.intervaloMaxSeg, "envio.intervaloMaxSeg", 0);
  if (typeof envio.intervaloMinSeg === "number" && typeof envio.intervaloMaxSeg === "number" && envio.intervaloMinSeg > envio.intervaloMaxSeg) erros.push("envio: intervalo mínimo não pode superar o máximo");
  const janela = objeto(envio.janela) ? envio.janela : {};
  if (!horarioValido(janela.inicio) || !horarioValido(janela.fim) || janela.inicio >= janela.fim) erros.push("envio.janela: use HH:MM válido, com início antes do fim");
  if (typeof envio.notaMinima !== "number" || !Number.isFinite(envio.notaMinima) || envio.notaMinima < 0 || envio.notaMinima > 100) erros.push("envio.notaMinima: informe uma nota de 0 a 100");
  for (const campo of ["pausado", "soDiasUteis"]) if (typeof envio[campo] !== "boolean") erros.push(`envio.${campo}: informe um booleano`);
  if (envio.canal !== "instagram") erros.push("envio.canal: use instagram");
  if (typeof envio.conta !== "string" || !/^[a-z0-9._]{1,30}$/i.test(envio.conta)) erros.push("envio.conta: informe o usuário sem @");
  inteiro(oferta.followupDias, "oferta.followupDias", 0);
  for (const [campo, valor] of [["oferta.primeira", oferta.primeira], ["clienteIdeal.descricao", cliente.descricao]] as const) {
    if (typeof valor !== "string" || !valor.trim()) erros.push(`${campo}: informe um texto não vazio`);
  }
  for (const campo of ["nichos", "regioes", "sinais", "fora"]) {
    const valor = cliente[campo];
    if (!Array.isArray(valor) || valor.some((v) => typeof v !== "string" || !v.trim())) erros.push(`clienteIdeal.${campo}: informe uma lista de textos`);
  }
  return erros;
}
function exigirConfig(config: ConfigRadar): void {
  const erros = validarConfig(config);
  if (erros.length) throw new Error(erros.join("\n"));
}

export type AcaoEnvio =
  | { acao: "rascunho"; leadId: string; tipo?: TipoEnvio; mensagem?: string }
  | { acao: "rascunhos-quentes"; min?: number; limite?: number }
  | { acao: "editar"; id: string; mensagem: string }
  /** Aprovação do painel: `base` é o texto que estava na tela quando o Matheus abriu; `mensagem` é o que ele aprova (editado ou não). Tudo numa gravação só. */
  | { acao: "aprovar-revisado"; id: string; base: string; mensagem: string }
  | { acao: "aprovar" | "reprovar" | "cancelar" | "marcar-enviando" | "marcar-enviado" | "marcar-falhou"; id: string; motivo?: string; erro?: string;
      /** Só no marcar-enviando: o texto e o @ que o Matheus confirmou no chat. Qualquer diferença recusa a reserva. */
      confirmada?: string; destino?: string }
  | { acao: "resposta"; leadId: string; etapa?: Etapa; anotacao?: string }
  | { acao: "etapa"; leadId: string; etapa?: Etapa; anotacao?: string }
  | { acao: "followups" }
  | { acao: "bloquear"; instagram: string; motivo: string }
  | { acao: "pausa"; pausado: boolean }
  | { acao: "importar"; registros: unknown };

function importarRegistros(registros: Record<string, Registro>, entrada: unknown, agora: Date): Record<string, Registro> {
  if (!objeto(entrada)) throw new Error("registros: informe um objeto");
  const novos = { ...registros };
  const dataISO = (valor: unknown): string => {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(valor) || !Number.isFinite(Date.parse(valor))) throw new Error("Registro com data inválida");
    return new Date(valor).toISOString();
  };
  for (const [id, valor] of Object.entries(entrada)) {
    if (Object.hasOwn(registros, id)) continue;
    if (!id.trim() || !objeto(valor) || typeof valor.etapa !== "string" || !Object.hasOwn(ETAPAS, valor.etapa) || typeof valor.anotacao !== "string") throw new Error(`Registro inválido: ${id}`);
    const historico: NonNullable<Registro["historico"]> = [];
    if (valor.historico !== undefined) {
      if (!Array.isArray(valor.historico)) throw new Error(`Histórico inválido: ${id}`);
      for (const item of valor.historico) {
        if (!objeto(item) || typeof item.etapa !== "string" || !Object.hasOwn(ETAPAS, item.etapa)) throw new Error(`Histórico inválido: ${id}`);
        historico.push({ etapa: item.etapa as Etapa, em: dataISO(item.em) });
      }
    }
    Object.defineProperty(novos, id, { enumerable: true, configurable: true, writable: true, value: {
      etapa: valor.etapa as Etapa, anotacao: valor.anotacao,
      atualizadoEm: valor.atualizadoEm === "" ? agora.toISOString() : dataISO(valor.atualizadoEm), historico,
    } });
  }
  return novos;
}

/** Um único caminho de efeitos evita diferenças entre CLI e painel. Não altera a entrada. */
export function aplicarAcao(estado: EstadoEnvio, acao: AcaoEnvio, agora: Date): { estado: EstadoEnvio; avisos: string[] } {
  exigirConfig(estado.config);
  instante(agora);
  let proximo = { ...estado };
  const avisos: string[] = [];
  const guardar = (envio: Envio) => { proximo.envios = [...proximo.envios.filter((e) => e.id !== envio.id), envio]; };
  if (acao.acao === "rascunho") guardar(criarRascunho(proximo, acao.leadId, acao.tipo ?? "primeira", acao.mensagem, agora));
  else if (acao.acao === "rascunhos-quentes") {
    const min = acao.min ?? estado.config.envio.notaMinima;
    const limite = acao.limite ?? estado.leads.length;
    if (!Number.isFinite(min) || min < 0 || min > 100) throw new Error("min: informe uma nota de 0 a 100");
    if (!Number.isSafeInteger(limite) || limite < 0) throw new Error("limite: informe um inteiro maior ou igual a zero");
    const leads = estado.leads.filter((l) => l.pontuacao >= min && etapaDo(estado, l.id) === "novo" && !estaBloqueado(estado, l.instagram.usuario) && !estado.envios.some((e) => e.leadId === l.id && e.tipo === "primeira"))
      .sort((a, b) => b.pontuacao - a.pontuacao || a.id.localeCompare(b.id)).slice(0, limite);
    for (const lead of leads) guardar(criarRascunho(proximo, lead.id, "primeira", undefined, agora));
  } else if (acao.acao === "followups") {
    for (const id of followupsVencidos(estado, agora)) {
      if (!exigirLead(estado, id).abordagem.followup?.trim()) avisos.push(`${id}: sem abordagem.followup`);
      else guardar(criarRascunho(proximo, id, "followup", undefined, agora));
    }
  } else if (acao.acao === "resposta" || acao.acao === "etapa") {
    exigirLead(estado, acao.leadId);
    const etapa = acao.acao === "resposta" ? "respondeu" : acao.etapa ?? etapaDo(estado, acao.leadId);
    proximo.registros = mudarEtapa(estado.registros, acao.leadId, etapa, agora, acao.anotacao);
    if (etapa === "respondeu") proximo.envios = estado.envios.map((e) => e.leadId === acao.leadId && e.tipo === "followup" && ["rascunho", "aprovado"].includes(e.status) ? transicionar(e, "cancelado", {}, agora) : e);
  } else if (acao.acao === "bloquear") {
    const instagram = normalizarInstagram(textoObrigatorio(acao.instagram, "instagram"));
    if (!/^[a-z0-9._]{1,30}$/.test(instagram)) throw new Error("instagram: usuário inválido");
    const motivo = textoObrigatorio(acao.motivo, "motivo");
    if (!estaBloqueado(estado, instagram)) proximo.bloqueados = [...estado.bloqueados, { instagram, motivo, data: agora.toISOString() }];
    const ids = new Set(estado.leads.filter((l) => normalizarInstagram(l.instagram.usuario) === instagram).map((l) => l.id));
    proximo.envios = estado.envios.map((e) => (ids.has(e.leadId) || normalizarInstagram(e.destino) === instagram) && !["enviado", "cancelado"].includes(e.status) ? transicionar(e, "cancelado", {}, agora) : e);
  } else if (acao.acao === "pausa") {
    if (typeof acao.pausado !== "boolean") throw new Error("pausado: informe um booleano");
    proximo.config = { ...estado.config, envio: { ...estado.config.envio, pausado: acao.pausado } };
  } else if (acao.acao === "importar") proximo.registros = importarRegistros(estado.registros, acao.registros, agora);
  else {
    const envio = estado.envios.find((e) => e.id === acao.id);
    if (!envio) throw new Error(`Envio não encontrado: ${acao.id}`);
    if (acao.acao === "editar") guardar(editarMensagem(envio, acao.mensagem));
    else if (acao.acao === "aprovar-revisado") {
      // Se alguém mexeu no texto depois que o Matheus abriu, ele não revisou o que está gravado: recusa
      if (envio.mensagem !== acao.base) throw new Error("A mensagem mudou desde que você abriu. Confira o texto de novo antes de aprovar.");
      const lead = exigirLead(estado, envio.leadId);
      if (estaBloqueado(estado, envio.destino) || estaBloqueado(estado, lead.instagram.usuario)) throw new Error("Destino bloqueado");
      const revisado = acao.mensagem === envio.mensagem ? envio : editarMensagem(envio, acao.mensagem);
      guardar(transicionar(revisado, "aprovado", {}, agora));
    }
    else if (acao.acao === "marcar-enviado" && envio.status === "enviado") {
      // Um CAS do envio pode vencer antes do CAS do funil. Na repetição da
      // ação, completa só o efeito do funil sem registrar outro envio.
      if (envio.tipo === "primeira" && etapaDo(estado, envio.leadId) === "novo") {
        proximo.registros = mudarEtapa(estado.registros, envio.leadId, "abordado", agora);
      }
    } else {
      const destinos = { aprovar: "aprovado", reprovar: "reprovado", cancelar: "cancelado", "marcar-enviando": "enviando", "marcar-enviado": "enviado", "marcar-falhou": "falhou" } as const;
      if (acao.acao === "aprovar" || acao.acao === "marcar-enviando") {
        const lead = exigirLead(estado, envio.leadId);
        if (estaBloqueado(estado, envio.destino) || estaBloqueado(estado, lead.instagram.usuario)) throw new Error("Destino bloqueado");
      }
      if (acao.acao === "marcar-enviando") {
        const pode = podeEnviarAgora(estado.config, estado.envios, agora);
        if (!pode.ok) throw new Error(`Envio não permitido: ${pode.motivo}`);
        if (estado.envios.some((e) => e.status === "enviando")) throw new Error("Já existe um envio em andamento");
        if (!apto(estado, envio, agora)) throw new Error("Envio indisponível para a etapa ou data atual");
        // O id se repete (leadId:tipo) quando uma mensagem é cancelada e refeita: o texto é o que prova que é a confirmada.
        if (acao.confirmada !== undefined && acao.confirmada !== envio.mensagem) throw new Error("A mensagem mudou desde a confirmação no chat. Pare o lote e confirme de novo.");
        if (acao.destino !== undefined && acao.destino.replace(/^@/, "").toLowerCase() !== envio.destino.toLowerCase()) throw new Error("O destino mudou desde a confirmação no chat. Pare o lote e confirme de novo.");
      }
      guardar(transicionar(envio, destinos[acao.acao], { motivo: acao.motivo, erro: acao.erro }, agora));
      if (acao.acao === "marcar-enviado" && envio.tipo === "primeira" && etapaDo(estado, envio.leadId) === "novo") proximo.registros = mudarEtapa(estado.registros, envio.leadId, "abordado", agora);
    }
  }
  return { estado: proximo, avisos };
}
