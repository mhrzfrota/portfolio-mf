import { test } from "vitest";
import assert from "node:assert/strict";
import { aplicarAcao, criarRascunho, editarMensagem, enviadosHoje, esperaSorteada, followupsVencidos, hojeFortaleza, mudarEtapa, podeEnviarAgora, proximoDaFila, resumoDoDia, STATUS_ENVIOS, transicionar, validarConfig } from "../../shared/radar/envio.ts";
import type { StatusEnvio } from "../../shared/radar/tipos.ts";
import { AGORA, configTeste, envioTeste, estadoTeste, leadTeste } from "./apoio-envio.ts";

test("envio: data e limite diário usam Fortaleza, inclusive às 23:30", () => {
  assert.equal(hojeFortaleza(new Date("2026-10-24T02:30:00Z")), "2026-10-23");
  assert.equal(hojeFortaleza(new Date("2026-10-24T03:00:00Z")), "2026-10-24");
  const enviados = [envioTeste({ status: "enviado", enviadoEm: "2026-10-24T02:30:00Z" }), envioTeste({ status: "enviado", enviadoEm: "2026-10-24T03:00:00Z" }), envioTeste({ status: "falhou", enviadoEm: "2026-10-24T02:00:00Z" })];
  assert.equal(enviadosHoje(enviados, new Date("2026-10-23T23:59:00-03:00")), 1);
  assert.equal(enviadosHoje(enviados, new Date("2026-10-24T00:00:00-03:00")), 1);
  const config = configTeste();
  config.envio.limiteDiario = 1;
  assert.deepEqual(podeEnviarAgora(config, [envioTeste({ status: "enviado", enviadoEm: "2026-10-23T12:00:00Z" })], AGORA), { ok: false, motivo: "limite-do-dia", proximoEm: "2026-10-26T12:00:00.000Z" });
});

test("envio: bordas da janela, fim de semana, pausa e intervalo exato", () => {
  const config = configTeste();
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-23T11:59:59.999Z")), { ok: false, motivo: "fora-da-janela", proximoEm: "2026-10-23T12:00:00.000Z" });
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-23T12:00:00Z")), { ok: true });
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-23T20:59:59.999Z")), { ok: true });
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-23T21:00:00Z")), { ok: false, motivo: "fora-da-janela", proximoEm: "2026-10-26T12:00:00.000Z" });
  for (const dia of [24, 25]) assert.deepEqual(podeEnviarAgora(config, [], new Date(`2026-10-${dia}T13:00:00Z`)), { ok: false, motivo: "fim-de-semana", proximoEm: "2026-10-26T12:00:00.000Z" });
  config.envio.pausado = true;
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-24T13:00:00Z")), { ok: false, motivo: "pausado" });
  config.envio.pausado = false;
  config.envio.soDiasUteis = false;
  assert.deepEqual(podeEnviarAgora(config, [], new Date("2026-10-24T13:00:00Z")), { ok: true });
  const envios = [envioTeste({ status: "enviado", enviadoEm: "2026-10-23T12:57:01Z" })];
  assert.deepEqual(podeEnviarAgora(config, envios, AGORA), { ok: false, motivo: "intervalo", proximoEm: "2026-10-23T13:00:01.000Z" });
  assert.deepEqual(podeEnviarAgora(config, envios, new Date("2026-10-23T13:00:01Z")), { ok: true });
  assert.equal(esperaSorteada(config, () => 0), 180);
  assert.equal(esperaSorteada(config, () => 0.999999), 480);
  config.envio.intervaloMinSeg = config.envio.intervaloMaxSeg = 3;
  assert.equal(esperaSorteada(config, () => 0.8), 3);
});

test("envio: próximo horário combina intervalo, janela, limite e dia útil", () => {
  const config = configTeste();
  const envios = [envioTeste({ status: "enviado", enviadoEm: "2026-10-23T20:59:00Z" })];
  assert.deepEqual(podeEnviarAgora(config, envios, new Date("2026-10-23T20:59:30Z")), { ok: false, motivo: "intervalo", proximoEm: "2026-10-26T12:00:00.000Z" });
  config.envio.limiteDiario = 1;
  assert.deepEqual(podeEnviarAgora(config, envios, new Date("2026-10-23T22:00:00Z")), { ok: false, motivo: "fora-da-janela", proximoEm: "2026-10-26T12:00:00.000Z" });
});

test("envio: fila ordena por nota e aprovação, respeita bloqueios e etapas", () => {
  const estado = estadoTeste();
  estado.leads = [leadTeste("a", 80), leadTeste("b", 95), leadTeste("c", 95), leadTeste("d", 100)];
  estado.envios = estado.leads.map((l, i) => envioTeste({ id: `${l.id}:primeira`, leadId: l.id, destino: `@${l.id.toUpperCase()}`, status: "aprovado", decididoEm: `2026-10-22T1${i}:00:00Z` }));
  estado.bloqueados = [{ instagram: "D", motivo: "Recusou", data: AGORA.toISOString() }];
  const antes = structuredClone(estado);
  assert.equal(proximoDaFila(estado, AGORA)?.leadId, "b");
  assert.deepEqual(estado, antes);
  estado.registros = mudarEtapa({}, "b", "respondeu", AGORA);
  assert.equal(proximoDaFila(estado, AGORA)?.leadId, "c");
  estado.envios[2].status = "rascunho";
  assert.equal(proximoDaFila(estado, AGORA)?.leadId, "a");
  estado.config.envio.pausado = true;
  assert.equal(proximoDaFila(estado, AGORA), undefined);
  estado.config.envio.pausado = false;
  estado.envios[0].status = "enviando";
  assert.equal(proximoDaFila(estado, AGORA), undefined);
});

test("envio: followup espera agendamento e resposta cancela rascunho ou aprovado", () => {
  let estado = estadoTeste();
  estado.envios = [envioTeste({ status: "enviado", enviadoEm: "2026-10-20T13:00:00Z" })];
  estado.registros = mudarEtapa({}, "lead_ficticio_001", "abordado", AGORA);
  assert.deepEqual(followupsVencidos(estado, new Date(AGORA.getTime() - 1)), []);
  assert.deepEqual(followupsVencidos(estado, AGORA), ["lead_ficticio_001"]);
  const rascunho = criarRascunho(estado, "lead_ficticio_001", "followup", undefined, AGORA);
  assert.equal(rascunho.agendadoPara, "2026-10-23T13:00:00.000Z");
  for (const status of ["rascunho", "aprovado"] as const) {
    estado = { ...estado, envios: [estado.envios[0], { ...rascunho, status }] };
    assert.equal(proximoDaFila(estado, new Date(AGORA.getTime() - 1)), undefined);
    if (status === "aprovado") assert.equal(proximoDaFila(estado, AGORA)?.tipo, "followup");
    const resultado = aplicarAcao(estado, { acao: "resposta", leadId: "lead_ficticio_001", anotacao: "Respondeu ao Direct" }, AGORA).estado;
    assert.equal(resultado.registros["lead_ficticio_001"].etapa, "respondeu");
    assert.equal(resultado.envios[1].status, "cancelado");
    assert.deepEqual(followupsVencidos(resultado, AGORA), []);
    assert.equal(proximoDaFila(resultado, AGORA), undefined);
  }
  assert.deepEqual(followupsVencidos(estado, AGORA), []);
  estado.envios[1].status = "reprovado";
  assert.deepEqual(followupsVencidos(estado, AGORA), ["lead_ficticio_001"]);
});

test("envio: matriz completa de transições e metadados, sem mutação", () => {
  const validas: Record<StatusEnvio, StatusEnvio[]> = { rascunho: ["aprovado", "reprovado", "cancelado"], aprovado: ["enviando", "cancelado"], reprovado: ["cancelado"], enviando: ["enviado", "falhou", "cancelado"], enviado: [], falhou: ["aprovado", "cancelado"], cancelado: [] };
  for (const de of STATUS_ENVIOS) for (const para of STATUS_ENVIOS) {
    const envio = envioTeste({ status: de });
    const antes = structuredClone(envio);
    if (validas[de].includes(para)) assert.equal(transicionar(envio, para, { motivo: "Sem interesse", erro: "Direct indisponível" }, AGORA).status, para);
    else assert.throws(() => transicionar(envio, para, {}, AGORA), /Transição inválida/);
    assert.deepEqual(envio, antes);
  }
  assert.equal(transicionar(envioTeste(), "aprovado", {}, AGORA).decididoEm, AGORA.toISOString());
  assert.equal(transicionar(envioTeste(), "reprovado", { motivo: "  Não serve  " }, AGORA).motivoReprova, "Não serve");
  assert.equal(transicionar(envioTeste({ status: "enviando" }), "enviado", {}, AGORA).enviadoEm, AGORA.toISOString());
  assert.throws(() => transicionar(envioTeste({ status: "enviando" }), "falhou", {}, AGORA), /erro:/);
  assert.equal(transicionar(envioTeste({ status: "falhou", erro: "Falhou antes" }), "aprovado", {}, AGORA).erro, undefined);
});

test("envio: rascunho valida mensagem, duplicação, substituição e bloqueio", () => {
  const estado = estadoTeste();
  const antes = structuredClone(estado);
  for (const mensagem of ["", "  ", "texto\u2014proibido", "x".repeat(1001)]) assert.throws(() => criarRascunho(estado, "lead_ficticio_001", "primeira", mensagem, AGORA), /mensagem:/);
  const envio = criarRascunho(estado, "lead_ficticio_001", "primeira", ` ${"x".repeat(1000)} `, AGORA);
  assert.equal(envio.mensagem.length, 1000);
  assert.equal(envio.id, "lead_ficticio_001:primeira");
  assert.equal(envio.destino, "lead_ficticio_001");
  assert.deepEqual(estado, antes);
  assert.throws(() => criarRascunho(estado, "ausente", "primeira", undefined, AGORA), /não encontrado/);
  assert.throws(() => criarRascunho(estado, "lead_ficticio_001", "followup", undefined, AGORA), /exige primeira/);
  for (const status of STATUS_ENVIOS) {
    estado.envios = [{ ...envio, status }];
    if (["reprovado", "cancelado"].includes(status)) assert.equal(criarRascunho(estado, "lead_ficticio_001", "primeira", undefined, AGORA).status, "rascunho");
    else assert.throws(() => criarRascunho(estado, "lead_ficticio_001", "primeira", undefined, AGORA), /Já existe/);
  }
  assert.equal(editarMensagem(envio, " Novo texto ").mensagem, "Novo texto");
  assert.throws(() => editarMensagem({ ...envio, status: "aprovado" }, "Outro"), /rascunho/);
  assert.throws(() => editarMensagem(envio, "\u2014"), /travessão/);
  estado.envios = [];
  estado.bloqueados = [{ instagram: "@LEAD_FICTICIO_001", motivo: "Recusou", data: AGORA.toISOString() }];
  assert.throws(() => criarRascunho(estado, "lead_ficticio_001", "primeira", undefined, AGORA), /bloqueado/);
});

test("envio: rascunhos quentes respeitam nota, etapa, limite e primeira já existente", () => {
  const estado = estadoTeste();
  estado.leads = [leadTeste("frio", 50), leadTeste("quente", 90), leadTeste("respondido", 100), leadTeste("bloqueado", 100), leadTeste("existente", 100), leadTeste("limite", 70)];
  estado.registros = mudarEtapa({}, "respondido", "respondeu", AGORA);
  estado.envios = [envioTeste({ id: "existente:primeira", leadId: "existente", destino: "existente", status: "cancelado" })];
  estado.bloqueados = [{ instagram: "bloqueado", motivo: "Recusou", data: AGORA.toISOString() }];
  const limitado = aplicarAcao(estado, { acao: "rascunhos-quentes", limite: 1 }, AGORA).estado;
  assert.deepEqual(limitado.envios.map((e) => e.leadId), ["existente", "quente"]);
  const todos = aplicarAcao(estado, { acao: "rascunhos-quentes" }, AGORA).estado;
  assert.deepEqual(todos.envios.map((e) => e.leadId), ["existente", "quente", "limite"]);
  assert.throws(() => aplicarAcao(estado, { acao: "rascunhos-quentes", min: NaN }, AGORA), /min:/);
  assert.throws(() => aplicarAcao(estado, { acao: "rascunhos-quentes", limite: -1 }, AGORA), /limite:/);
});

test("envio: reserva exige limites e exclusividade; envio não rebaixa funil", () => {
  let estado = estadoTeste();
  estado.envios = [envioTeste({ status: "aprovado" })];
  const id = estado.envios[0].id;
  estado.config.envio.pausado = true;
  assert.throws(() => aplicarAcao(estado, { acao: "marcar-enviando", id }, AGORA), /pausado/);
  estado.config.envio.pausado = false;
  estado = aplicarAcao(estado, { acao: "marcar-enviando", id }, AGORA).estado;
  assert.throws(() => aplicarAcao(estado, { acao: "marcar-enviando", id }, AGORA), /andamento/);
  const enviado = aplicarAcao(estado, { acao: "marcar-enviado", id }, AGORA).estado;
  assert.equal(enviado.registros["lead_ficticio_001"].etapa, "abordado");
  estado.registros = mudarEtapa({}, "lead_ficticio_001", "proposta", AGORA);
  const avancado = aplicarAcao(estado, { acao: "marcar-enviado", id }, AGORA).estado;
  assert.equal(avancado.registros["lead_ficticio_001"].etapa, "proposta");
});

test("envio: bloquear cancela abertos, preserva enviado e mantém bloqueio original", () => {
  const estado = estadoTeste();
  estado.envios = STATUS_ENVIOS.map((status) => envioTeste({ id: status, status }));
  const bloqueado = aplicarAcao(estado, { acao: "bloquear", instagram: "@LEAD_FICTICIO_001", motivo: "Não quer contato" }, AGORA).estado;
  for (const envio of bloqueado.envios) assert.equal(envio.status, envio.id === "enviado" ? "enviado" : "cancelado");
  const novamente = aplicarAcao(bloqueado, { acao: "bloquear", instagram: "lead_ficticio_001", motivo: "Outro motivo" }, AGORA).estado;
  assert.deepEqual(novamente.bloqueados, bloqueado.bloqueados);
  assert.throws(() => aplicarAcao(estado, { acao: "bloquear", instagram: "lead_ficticio_001", motivo: " " }, AGORA), /motivo:/);
});

test("envio: histórico só cresce na mudança; resumo e followups sem texto", () => {
  let registros = mudarEtapa({}, "lead_ficticio_001", "abordado", AGORA, "Primeira anotação");
  registros = mudarEtapa(registros, "lead_ficticio_001", "abordado", AGORA, "Outra anotação");
  assert.equal(registros["lead_ficticio_001"].historico?.length, 1);
  registros = mudarEtapa(registros, "lead_ficticio_001", "respondeu", AGORA);
  assert.equal(registros["lead_ficticio_001"].historico?.length, 2);
  assert.equal(registros["lead_ficticio_001"].anotacao, "Outra anotação");
  const estado = estadoTeste();
  estado.registros = mudarEtapa({}, "lead_ficticio_001", "abordado", AGORA);
  estado.envios = [envioTeste({ status: "enviado", enviadoEm: "2026-10-20T13:00:00Z" })];
  delete estado.leads[0].abordagem.followup;
  const resultado = aplicarAcao(estado, { acao: "followups" }, AGORA);
  assert.match(resultado.avisos[0], /sem abordagem.followup/);
  assert.equal(resultado.estado.envios.length, 1);
  assert.deepEqual(resumoDoDia(estadoTeste(), AGORA), { enviadosHoje: 0, limite: 10, aprovados: 0, rascunhos: 0, pausado: false, pode: { ok: true } });
});

test("envio: configuração rejeita limites, intervalos, janela, nota e tipos inválidos", () => {
  assert.deepEqual(validarConfig(configTeste()), []);
  for (const envio of [{ limiteDiario: 0 }, { limiteDiario: 1.5 }, { intervaloMinSeg: -1 }, { intervaloMinSeg: 500, intervaloMaxSeg: 400 }, { janela: { inicio: "24:00", fim: "18:00" } }, { janela: { inicio: "18:00", fim: "09:00" } }, { janela: { inicio: "09:00", fim: "09:00" } }, { janela: { inicio: "9:00", fim: "18:00" } }, { notaMinima: 101 }, { notaMinima: NaN }, { pausado: "false" }]) {
    assert.ok(validarConfig({ ...configTeste(), envio: { ...configTeste().envio, ...envio } }).length > 0);
  }
  assert.ok(validarConfig(null).length > 0);
  assert.ok(validarConfig({}).length > 0);
});

test("envio: reserva confere o texto e o destino confirmados no chat", () => {
  const estado = estadoTeste();
  estado.envios = [envioTeste({ status: "aprovado" })];
  const { id, mensagem, destino } = estado.envios[0];
  assert.throws(() => aplicarAcao(estado, { acao: "marcar-enviando", id, confirmada: `${mensagem} (outra)` }, AGORA), /mensagem mudou/);
  assert.throws(() => aplicarAcao(estado, { acao: "marcar-enviando", id, confirmada: mensagem, destino: "outro.perfil" }, AGORA), /destino mudou/);
  const reservado = aplicarAcao(estado, { acao: "marcar-enviando", id, confirmada: mensagem, destino: `@${destino.toUpperCase()}` }, AGORA).estado;
  assert.equal(reservado.envios[0].status, "enviando");
});

test("envio: repetir marcar-enviado completa o funil sem duplicar o envio", () => {
  const estado = estadoTeste();
  estado.envios = [envioTeste({ status: "enviado", enviadoEm: AGORA.toISOString() })];
  const novamente = aplicarAcao(estado, { acao: "marcar-enviado", id: estado.envios[0].id }, AGORA);
  assert.equal(novamente.estado.envios.length, 1);
  assert.equal(novamente.estado.envios[0].status, "enviado");
  assert.equal(novamente.estado.registros[estado.leads[0].id].etapa, "abordado");
});
