import { describe, expect, it } from "vitest";
import { criarCartao, quadroVazio } from "../plano/quadro";
import {
  PESSOAL, agendaVazia, calendarioDoCartao, carregarAgenda, cartoesSemData, criarCalendario, criarEvento,
  editarCalendario, editarEvento, ehAgenda, gradeDoMes, itensEntre, mudarMes, removerCalendario, salvarAgenda, sementeAgenda,
} from "./agenda";

const comCliente = () => criarCalendario(agendaVazia(), { nome: "TS Kite Center", projeto: "TS Kite Center" });
const memoria = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("calendários", () => {
  it("cria um por cliente e recusa nome repetido", () => {
    const a = comCliente();
    expect(a.calendarios).toHaveLength(2);
    expect(() => criarCalendario(a, { nome: "ts kite center" })).toThrow(/Já existe/);
  });
  it("não deixa o mesmo projeto em dois calendários", () => {
    expect(() => criarCalendario(comCliente(), { nome: "Outro", projeto: "TS KITE CENTER" })).toThrow(/já está ligado/);
  });
  it("remove o calendário junto com os eventos, mas nunca o seu", () => {
    let a = comCliente();
    const id = a.calendarios[1].id;
    a = criarEvento(a, { titulo: "Reunião", data: "2026-10-10", calendarioId: id });
    a = removerCalendario(a, id);
    expect(a.eventos).toHaveLength(0);
    expect(() => removerCalendario(a, PESSOAL)).toThrow();
  });
  it("edita mantendo o id", () => {
    const a = comCliente();
    const id = a.calendarios[1].id;
    expect(editarCalendario(a, id, { cor: "#000000" }).calendarios[1]).toMatchObject({ id, cor: "#000000" });
  });
});

describe("eventos", () => {
  it("valida data e horário", () => {
    const a = agendaVazia();
    expect(() => criarEvento(a, { titulo: "x", data: "2026-02-30" })).toThrow(/Data/);
    expect(() => criarEvento(a, { titulo: "x", data: "2026-10-10", inicio: "10:00", fim: "09:00" })).toThrow(/depois/);
    expect(() => criarEvento(a, { titulo: "x", data: "2026-10-10", fim: "09:00" })).toThrow(/início/);
    expect(() => criarEvento(a, { titulo: "  ", data: "2026-10-10" })).toThrow(/título/);
  });
  it("cria no seu calendário por padrão e edita", () => {
    let a = criarEvento(agendaVazia(), { titulo: " Pagar  boleto ", data: "2026-10-10", tipo: "tarefa" });
    expect(a.eventos[0]).toMatchObject({ calendarioId: PESSOAL, titulo: "Pagar boleto", feito: false });
    a = editarEvento(a, a.eventos[0].id, { feito: true });
    expect(a.eventos[0].feito).toBe(true);
  });
  it("recusa calendário que não existe", () => {
    expect(() => criarEvento(agendaVazia(), { titulo: "x", data: "2026-10-10", calendarioId: "nada" })).toThrow();
  });
});

describe("ligação com o Plano", () => {
  it("cartão com projeto do cliente cai no calendário dele; sem projeto, no seu", () => {
    const a = comCliente();
    expect(calendarioDoCartao(a, { projeto: "TS Kite Center" })).toBe(a.calendarios[1].id);
    expect(calendarioDoCartao(a, { projeto: "Outro" })).toBe(PESSOAL);
    expect(calendarioDoCartao(a, { projeto: "" })).toBe(PESSOAL);
  });
  it("junta eventos e cartões com data no período, filtrando calendários", () => {
    let a = comCliente();
    const ts = a.calendarios[1].id;
    a = criarEvento(a, { titulo: "Aula de kite", data: "2026-10-08", inicio: "09:00", calendarioId: ts });
    a = criarEvento(a, { titulo: "Fora", data: "2026-11-01" });
    const q = quadroVazio();
    q.colunas.fazer.push(criarCartao({ coluna: "fazer", titulo: "Versão em inglês", projeto: "TS Kite Center", data: "2026-10-08" }, "2026-10-01"));
    q.colunas.feito.push(criarCartao({ coluna: "feito", titulo: "Deploy", data: "2026-10-02" }, "2026-10-01"));
    q.colunas.fazer.push(criarCartao({ coluna: "fazer", titulo: "Sem data" }, "2026-10-01"));
    const itens = itensEntre(a, q, "2026-10-01", "2026-10-31");
    expect(itens.map((i) => i.titulo)).toEqual(["Deploy", "Versão em inglês", "Aula de kite"]);
    expect(itens[0]).toMatchObject({ origem: "plano", feito: true, calendarioId: PESSOAL });
    expect(itens[1]).toMatchObject({ origem: "plano", calendarioId: ts });
    expect(itensEntre(a, q, "2026-10-01", "2026-10-31", new Set([PESSOAL])).map((i) => i.titulo)).toEqual(["Deploy"]);
    expect(cartoesSemData(q).map((c) => c.titulo)).toEqual(["Sem data"]);
  });
});

describe("mês", () => {
  it("monta semanas de segunda a domingo cobrindo o mês", () => {
    const g = gradeDoMes("2026-10");
    expect(g[0][0]).toBe("2026-09-28");
    expect(g.at(-1)!.at(-1)).toBe("2026-11-01");
    expect(g.flat()).toContain("2026-10-31");
    expect(gradeDoMes("2026-02").every((s) => s.length === 7)).toBe(true);
  });
  it("navega entre meses e anos", () => {
    expect(mudarMes("2026-12", 1)).toBe("2027-01");
    expect(mudarMes("2026-01", -1)).toBe("2025-12");
  });
});

describe("armazenamento", () => {
  it("primeira abertura usa a semente; depois lê o salvo", () => {
    const s = memoria();
    const r = carregarAgenda(s, "u1", sementeAgenda);
    expect(r.nova).toBe(true);
    expect(r.agenda.calendarios.length).toBeGreaterThan(1);
    expect(salvarAgenda(s, "u1", r.agenda)).toBe(true);
    expect(carregarAgenda(s, "u1", agendaVazia)).toMatchObject({ nova: false, erro: "" });
  });
  it("dado corrompido bloqueia em vez de sobrescrever", () => {
    const s = memoria();
    s.setItem("mf-calendario:v1:u1", "{quebrado");
    expect(carregarAgenda(s, "u1", sementeAgenda).erro).toMatch(/inválido/);
  });
  it("valida o formato", () => {
    expect(ehAgenda(sementeAgenda())).toBe(true);
    expect(ehAgenda({ versao: 1, calendarios: [], eventos: [] })).toBe(false);
  });
});
