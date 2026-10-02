import { describe, expect, it, vi } from "vitest";
import {
  adicionar, adicionarItem, alternarItem, atrasado, carregarQuadro, chaveQuadro, COLUNAS,
  criarCartao, duplicar, editar, editarItem, ehQuadro, encontrar, ETIQUETAS, filtrar,
  migrarDoV1, mover, progresso, projetos, quadroVazio, remover, removerItem, salvarQuadro,
  type Cartao, type NovoCartao, type Quadro,
} from "./quadro";
import { storageKey, type PlanoState } from "./store";

const hoje = "2026-10-02";
const amanha = "2026-10-03";
const entrada = (campos: Partial<NovoCartao> = {}): NovoCartao => ({ titulo: "Tarefa", coluna: "ideias", ...campos });
const criar = (campos: Partial<NovoCartao> = {}): Cartao => criarCartao(entrada(campos), hoje);
const titulos = (q: Quadro, coluna: Cartao["coluna"] = "ideias") => q.colunas[coluna].map((c) => c.titulo);
function base(): Quadro {
  return ["A", "B", "C"].reduce((q, titulo) => adicionar(q, entrada({ titulo }), "fim", hoje), quadroVazio());
}
function congelar<T>(valor: T): T {
  if (valor && typeof valor === "object") {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}
const legado: PlanoState = { itens: [
  { id: "a", texto: "Automação", etapa: "ideia", criadoEm: "2026-09-01" },
  { id: "b", texto: "B", etapa: "ideia", criadoEm: hoje },
  { id: "c", texto: "C", etapa: "fazer", criadoEm: hoje },
  { id: "d", texto: "D", etapa: "feito", criadoEm: hoje, feitoEm: "2026-09-30" },
] };

describe("quadro: criação e validação", () => {
  it("expõe as colunas e etiquetas do contrato e cria estruturas independentes", () => {
    expect(COLUNAS.map((c) => c.id)).toEqual(["ideias", "referencias", "fazer", "agenda", "feito"]);
    expect(ETIQUETAS.map((e) => e.cor)).toEqual([
      "#2563EB", "#7C3AED", "#0F766E", "#DB2777", "#C2410C", "#4D7C0F", "#475569", "#DC2626",
    ]);
    expect(quadroVazio().colunas.ideias).not.toBe(quadroVazio().colunas.ideias);
    expect(ehQuadro(quadroVazio())).toBe(true);
  });

  it("normaliza espaços, ordena etiquetas e copia os dados de entrada", () => {
    const dados = entrada({
      titulo: "  Minha \n tarefa  ", projeto: "  TS   Kite  ", etiquetas: ["urgente", "cliente", "urgente"],
      checklist: [{ id: "i", texto: " Fazer   algo ", feito: true }],
    });
    const c = criarCartao(congelar(dados), hoje);
    expect(c).toMatchObject({
      titulo: "Minha tarefa", projeto: "TS Kite", etiquetas: ["cliente", "urgente"],
      descricao: "", link: "", data: "", hora: "", criadoEm: hoje, atualizadoEm: hoje, concluidoEm: "",
      checklist: [{ id: "i", texto: "Fazer algo", feito: true }],
    });
    expect(c.checklist).not.toBe(dados.checklist);
    expect(criar({ coluna: "feito" }).concluidoEm).toBe(hoje);
    expect(criar({ data: "2028-02-29", hora: "23:59", link: "https://example.com/a?q=1" }).data).toBe("2028-02-29");
  });

  it.each([
    { titulo: "  " }, { titulo: "x".repeat(141) }, { descricao: "x".repeat(4001) },
    { projeto: "x".repeat(61) }, { link: "javascript:alert(1)" }, { link: "https://" },
    { link: "https://example.com/ espaço" }, { data: "2026-02-29" }, { data: "2026-13-01" },
    { data: "2026-2-01" }, { hora: "12:00" }, { data: hoje, hora: "24:00" },
    { data: hoje, hora: "12:60" }, { coluna: "outra" }, { etiquetas: ["outra"] },
    { checklist: [{ id: "i", texto: "", feito: false }] },
    { checklist: [{ id: "i", texto: "x".repeat(201), feito: false }] },
    { checklist: [{ id: "i", texto: "X", feito: "sim" }] },
    { checklist: [{ id: "i", texto: "X", feito: false }, { id: "i", texto: "Y", feito: false }] },
  ])("recusa entrada inválida: %j", (campos) => {
    expect(() => criar(campos as Partial<NovoCartao>)).toThrow(Error);
  });

  it("adiciona nas duas pontas e aceita os limites exatos", () => {
    const q = adicionar(base(), entrada({ titulo: "Primeiro" }), "inicio", hoje);
    expect(titulos(q)).toEqual(["Primeiro", "A", "B", "C"]);
    expect(criar({ titulo: "x".repeat(140), descricao: "x".repeat(4000), projeto: "x".repeat(60) })).toBeTruthy();
  });
});

describe("quadro: movimentos e edição", () => {
  it.each([[0, 2, ["B", "C", "A"]], [2, 0, ["C", "A", "B"]], [1, 1, ["A", "B", "C"]],
    [0, 99, ["B", "C", "A"]], [2, -10, ["C", "A", "B"]]])(
    "move de %i para %i na mesma coluna", (origem, indice, esperado) => {
      const q = base();
      expect(titulos(mover(q, q.colunas.ideias[origem as number].id, "ideias", indice as number, hoje)))
        .toEqual(esperado);
    },
  );

  it("insere entre cartões de outra coluna e atualiza as datas", () => {
    let q = adicionar(base(), entrada({ titulo: "X", coluna: "fazer" }), "fim", hoje);
    q = adicionar(q, entrada({ titulo: "Y", coluna: "fazer" }), "fim", hoje);
    const id = q.colunas.ideias[0].id;
    q = mover(q, id, "fazer", 1, amanha);
    expect(titulos(q, "fazer")).toEqual(["X", "A", "Y"]);
    expect(encontrar(q, id)?.atualizadoEm).toBe(amanha);
    q = mover(q, id, "feito", 0, amanha);
    expect(encontrar(q, id)?.concluidoEm).toBe(amanha);
    q = editar(q, id, { descricao: "Entregue" }, "2026-10-04");
    q = mover(q, id, "feito", 0, "2026-10-05");
    expect(encontrar(q, id)?.concluidoEm).toBe(amanha);
    q = editar(q, id, { coluna: "fazer" }, "2026-10-06");
    expect(titulos(q, "fazer")).toEqual(["X", "Y", "A"]);
    expect(encontrar(q, id)?.concluidoEm).toBe("");
    q = editar(q, id, { coluna: "feito" }, "2026-10-07");
    expect(encontrar(q, id)?.concluidoEm).toBe("2026-10-07");
  });

  it("patch de coluna move ao fim, inclusive na mesma coluna, e revalida", () => {
    const q = base();
    const id = q.colunas.ideias[0].id;
    expect(titulos(editar(q, id, { coluna: "ideias", titulo: " AA " }, amanha))).toEqual(["B", "C", "AA"]);
    expect(() => editar(q, id, { titulo: "" }, hoje)).toThrow();
    expect(() => mover(q, "ausente", "feito", 0, hoje)).toThrow("Cartão não encontrado");
    expect(() => mover(q, id, "fazer", NaN, hoje)).toThrow("Índice inválido");
    expect(encontrar(remover(q, id), id)).toBeNull();
    expect(remover(q, "ausente")).not.toBe(q);
  });

  it("agenda ordena data e hora, com empates estáveis e cartões sem data no fim", () => {
    let q = quadroVazio();
    for (const campos of [
      { titulo: "Sem data 1" }, { titulo: "Tarde", data: amanha, hora: "15:00" },
      { titulo: "Sem hora", data: amanha }, { titulo: "Antes", data: hoje, hora: "23:00" },
      { titulo: "Manhã", data: amanha, hora: "08:00" }, { titulo: "Sem data 2" },
    ]) q = adicionar(q, entrada({ ...campos, coluna: "agenda" }), "inicio", hoje);
    expect(titulos(q, "agenda")).toEqual(["Antes", "Sem hora", "Manhã", "Tarde", "Sem data 1", "Sem data 2"]);
    const semData = q.colunas.agenda[5].id;
    q = mover(q, semData, "agenda", 0, hoje);
    expect(titulos(q, "agenda").slice(-2)).toEqual(["Sem data 1", "Sem data 2"]);
    q = editar(q, semData, { data: "2026-10-01" }, hoje);
    expect(titulos(q, "agenda")[0]).toBe("Sem data 2");
    const tarde = q.colunas.agenda.find((c) => c.titulo === "Tarde")!.id;
    q = editar(q, tarde, { hora: "07:00" }, hoje);
    expect(titulos(q, "agenda")).toEqual(["Sem data 2", "Antes", "Sem hora", "Tarde", "Manhã", "Sem data 1"]);
    q = adicionar(q, entrada({ titulo: "Chegou", data: amanha, hora: "07:00" }), "fim", hoje);
    q = mover(q, q.colunas.ideias[0].id, "agenda", 0, hoje);
    expect(titulos(q, "agenda")).toEqual([
      "Sem data 2", "Antes", "Sem hora", "Tarde", "Chegou", "Manhã", "Sem data 1",
    ]);
    expect(ehQuadro(q)).toBe(true);
  });

  it("duplica abaixo do original com novos IDs, datas e checklist desmarcado", () => {
    const q = adicionar(base(), entrada({
      titulo: "x".repeat(140), coluna: "feito", checklist: [{ id: "i", texto: "Item", feito: true }],
    }), "fim", hoje);
    const original = q.colunas.feito[0];
    const copia = duplicar(q, original.id, amanha).colunas.feito[1];
    expect(copia.id).not.toBe(original.id);
    expect(copia.titulo).toHaveLength(140);
    expect(copia.titulo.endsWith(" (cópia)")).toBe(true);
    expect(copia).toMatchObject({ criadoEm: amanha, atualizadoEm: amanha, concluidoEm: amanha });
    expect(copia.checklist[0].id).not.toBe("i");
    expect(copia.checklist[0].feito).toBe(false);
    expect(titulos(duplicar(q, q.colunas.ideias[1].id, hoje))).toEqual(["A", "B", "B (cópia)", "C"]);
  });
});

describe("quadro: checklist e consultas", () => {
  it("adiciona, edita, alterna, remove e calcula progresso", () => {
    let q = base();
    const id = q.colunas.ideias[0].id;
    expect(progresso(obterCartao(q, id))).toEqual({ feitos: 0, total: 0 });
    q = adicionarItem(q, id, "  Etapa   um ", amanha);
    const itemId = obterCartao(q, id).checklist[0].id;
    q = editarItem(q, id, itemId, "Novo texto", amanha);
    q = alternarItem(q, id, itemId, amanha);
    expect(progresso(obterCartao(q, id))).toEqual({ feitos: 1, total: 1 });
    expect(obterCartao(q, id).atualizadoEm).toBe(amanha);
    expect(obterCartao(q, id).checklist[0].texto).toBe("Novo texto");
    q = alternarItem(q, id, itemId, amanha);
    expect(progresso(obterCartao(q, id)).feitos).toBe(0);
    expect(progresso(obterCartao(removerItem(q, id, itemId, hoje), id))).toEqual({ feitos: 0, total: 0 });
    expect(() => editarItem(q, id, "ausente", "Texto", hoje)).toThrow();
    expect(() => adicionarItem(q, id, " ", hoje)).toThrow();
  });

  it("aceita 50 itens de até 200 caracteres e recusa excedentes", () => {
    const q = adicionar(quadroVazio(), entrada({
      checklist: Array.from({ length: 50 }, (_, i) => ({ id: String(i), texto: "x".repeat(200), feito: false })),
    }), "fim", hoje);
    const id = q.colunas.ideias[0].id;
    expect(() => adicionarItem(q, id, "Excedente", hoje)).toThrow("até 50");
    expect(() => editarItem(q, id, "0", "x".repeat(201), hoje)).toThrow("até 200");
  });

  it("busca nos quatro campos sem acentos, exige todas as etiquetas e combina filtros", () => {
    let q = quadroVazio();
    for (const campos of [
      { titulo: "AÇÃO", etiquetas: ["cliente", "urgente"], projeto: "Zeta" },
      { titulo: "B", descricao: "ação", etiquetas: ["cliente"], projeto: "Árvore" },
      { titulo: "C", projeto: "Ação" },
      { titulo: "D", checklist: [{ id: "i", texto: "ação", feito: false }] },
    ] as Partial<NovoCartao>[]) q = adicionar(q, entrada(campos), "fim", hoje);
    expect(titulos(filtrar(q, { busca: "ACAO" }))).toEqual(["AÇÃO", "B", "C", "D"]);
    expect(titulos(filtrar(q, { busca: "acao", etiquetas: ["urgente", "cliente"], projeto: "Zeta" })))
      .toEqual(["AÇÃO"]);
    expect(titulos(filtrar(q, { busca: "inexistente" }))).toEqual([]);
    q = adicionar(q, entrada({ projeto: "Zeta" }), "fim", hoje);
    expect(projetos(q)).toEqual(["Ação", "Árvore", "Zeta"]);
  });

  it("atrasado só vale para data passada e cartão não concluído", () => {
    expect(atrasado(criar({ data: "2026-10-01" }), hoje)).toBe(true);
    expect(atrasado(criar({ data: hoje }), hoje)).toBe(false);
    expect(atrasado(criar({ data: amanha }), hoje)).toBe(false);
    expect(atrasado(criar(), hoje)).toBe(false);
    expect(atrasado(criar({ data: "2026-10-01", coluna: "feito" }), hoje)).toBe(false);
  });
});

function obterCartao(q: Quadro, id: string): Cartao {
  return encontrar(q, id)!;
}

describe("quadro: armazenamento", () => {
  it("recusa campos ausentes, tipos, formatos, duplicações e coluna divergente", () => {
    const q = base();
    const c = q.colunas.ideias[0];
    for (const campo of Object.keys(c)) {
      const ruim = structuredClone(q);
      delete (ruim.colunas.ideias[0] as unknown as Record<string, unknown>)[campo];
      expect(ehQuadro(ruim), campo).toBe(false);
    }
    for (const patch of [
      { titulo: " X " }, { titulo: "x".repeat(141) }, { descricao: 1 }, { coluna: "fazer" }, { id: "" },
      { etiquetas: ["cliente", "cliente"] }, { etiquetas: ["urgente", "cliente"] },
      { criadoEm: "ontem" }, { atualizadoEm: "2026-02-30" }, { concluidoEm: hoje },
      { hora: "10:00" }, { link: "data:text/html,oi" }, { checklist: null },
    ]) {
      expect(ehQuadro({ ...q, colunas: { ...q.colunas, ideias: [{ ...c, ...patch }] } }), JSON.stringify(patch))
        .toBe(false);
    }
    expect(ehQuadro(null)).toBe(false);
    expect(ehQuadro({ versao: 1, colunas: q.colunas })).toBe(false);
    expect(ehQuadro({ versao: 2, colunas: { ideias: [] } })).toBe(false);
    expect(ehQuadro({ ...q, colunas: { ...q.colunas, ideias: [c, c] } })).toBe(false);
    const feito = adicionar(q, entrada({ coluna: "feito" }), "fim", hoje);
    feito.colunas.feito[0].concluidoEm = "";
    expect(ehQuadro(feito)).toBe(false);
    expect(ehQuadro(q)).toBe(true);
  });

  it("migra etapas, ordem, IDs, datas e texto longo", () => {
    const v1 = structuredClone(legado);
    v1.itens.push({ id: "longo", texto: "x".repeat(200), etapa: "fazer", criadoEm: hoje });
    const q = migrarDoV1(congelar(v1), hoje);
    expect(titulos(q)).toEqual(["Automação", "B"]);
    expect(q.colunas.ideias[0]).toMatchObject({ id: "a", criadoEm: "2026-09-01" });
    expect(q.colunas.feito[0].concluidoEm).toBe("2026-09-30");
    expect(q.colunas.fazer[1].titulo).toHaveLength(140);
    expect(q.colunas.fazer[1].descricao).toBe("x".repeat(200));
    expect(ehQuadro(q)).toBe(true);
  });

  it("normaliza dados antigos aceitos pelo validador permissivo do v1", () => {
    const q = migrarDoV1({ itens: [
      { id: "", texto: " ", etapa: "feito", criadoEm: "inválida" },
      { id: "a", texto: "A", etapa: "feito", criadoEm: hoje },
      { id: "a", texto: "B", etapa: "ideia", criadoEm: hoje },
    ] }, hoje);
    expect(ehQuadro(q)).toBe(true);
    expect(q.colunas.feito[0].concluidoEm).toBe(hoje);
  });

  it("carrega v2 válido sem consultar v1 ou semente", () => {
    const q = base();
    const getItem = vi.fn(() => JSON.stringify(q));
    const semente = vi.fn(quadroVazio);
    expect(carregarQuadro({ getItem }, "usuario", semente)).toEqual({ quadro: q, origem: "v2", erro: "" });
    expect(getItem.mock.calls).toEqual([[chaveQuadro("usuario")]]);
    expect(semente).not.toHaveBeenCalled();
  });

  it.each(["{", "null", "", JSON.stringify({ versao: 2, colunas: {} })])(
    "bloqueia v2 inválido sem ler v1: %s", (salvo) => {
      const getItem = vi.fn(() => salvo);
      const semente = vi.fn(quadroVazio);
      const resultado = carregarQuadro({ getItem }, "u", semente);
      expect(resultado.quadro).toEqual(quadroVazio());
      expect(resultado.origem).toBe("v2");
      expect(resultado.erro).toMatch(/inválido/);
      expect(getItem).toHaveBeenCalledTimes(1);
      expect(semente).not.toHaveBeenCalled();
    },
  );

  it("mescla migração antes da semente e elimina títulos equivalentes só na mesma coluna", () => {
    let inicial = adicionar(quadroVazio(), entrada({ titulo: "AUTOMACAO" }), "fim", hoje);
    inicial = adicionar(inicial, entrada({ titulo: "Nova" }), "fim", hoje);
    inicial = adicionar(inicial, entrada({ titulo: "Automacao", coluna: "fazer" }), "fim", hoje);
    inicial.colunas.fazer[0].id = "a";
    const getItem = vi.fn((chave: string) => chave === storageKey("u") ? JSON.stringify(legado) : null);
    const resultado = carregarQuadro({ getItem }, "u", () => congelar(inicial));
    expect(resultado.origem).toBe("migrado");
    expect(resultado.erro).toBe("");
    expect(titulos(resultado.quadro)).toEqual(["Automação", "B", "Nova"]);
    expect(titulos(resultado.quadro, "fazer")).toEqual(["C", "Automacao"]);
    expect(ehQuadro(resultado.quadro)).toBe(true);
  });

  it.each([null, "{", "null", '{"itens":[{}]}'])("usa semente sem v1 válido: %s", (v1) => {
    const q = base();
    const getItem = (chave: string) => chave === storageKey("u") ? v1 : null;
    expect(carregarQuadro({ getItem }, "u", () => q)).toEqual({ quadro: q, origem: "semente", erro: "" });
  });

  it("captura falha de leitura, grava apenas v2 e captura cota", () => {
    const getItem = () => { throw new Error("Sem acesso"); };
    expect(carregarQuadro({ getItem }, "u", quadroVazio).erro).toContain("ler");
    const setItem = vi.fn();
    const q = base();
    expect(salvarQuadro({ setItem }, "u", q)).toBe(true);
    expect(setItem.mock.calls).toEqual([["mf-plano:v2:u", JSON.stringify(q)]]);
    expect(salvarQuadro({ setItem }, "u", {} as Quadro)).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(salvarQuadro({ setItem: () => { throw new Error("Cota"); } }, "u", q)).toBe(false);
  });
});

describe("quadro: imutabilidade", () => {
  it("operações devolvem novo quadro e não alteram o original congelado", () => {
    const inicial = base();
    const id = inicial.colunas.ideias[0].id;
    const q = congelar(adicionarItem(inicial, id, "Item", hoje));
    const antes = JSON.stringify(q);
    const itemId = q.colunas.ideias[0].checklist[0].id;
    const operacoes = [
      () => adicionar(q, entrada(), "fim", hoje),
      () => editar(q, id, { titulo: "Outro" }, amanha),
      () => mover(q, id, "agenda", 0, amanha),
      () => remover(q, id),
      () => duplicar(q, id, amanha),
      () => adicionarItem(q, id, "Segundo", amanha),
      () => editarItem(q, id, itemId, "Alterado", amanha),
      () => alternarItem(q, id, itemId, amanha),
      () => removerItem(q, id, itemId, amanha),
      () => filtrar(q, { busca: "A" }),
    ];
    for (const operacao of operacoes) {
      const resultado = operacao();
      expect(resultado).not.toBe(q);
      expect(ehQuadro(resultado)).toBe(true);
      expect(JSON.stringify(q)).toBe(antes);
    }
  });
});
