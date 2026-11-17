import { describe, expect, it, vi } from "vitest";
import {
  ANGULOS, ETAPAS, FORMATOS, GRUPOS, adicionar, adicionarItem, adicionarNota, adicionarTematica,
  alternarItem, alternarNotaFixada, carregarEstudio, chaveEstudio, criarNota, criarPeca, criarTematica,
  duplicar, editar, editarItem, editarNota, editarTematica, ehEstudio, encontrar, equilibrio,
  estudioVazio, filtrarPecas, metricasVazias, mover, progresso, remover, removerItem,
  removerNota, removerTematica, salvarEstudio, semana, type Estudio, type NovaPeca,
} from "./estudio";
import { semente } from "./semente";

const hoje = "2026-11-17", amanha = "2026-11-18";
const entrada = (patch: Partial<NovaPeca> = {}): NovaPeca => ({ titulo: "Peça", etapa: "ideias", ...patch });
const criar = (patch: Partial<NovaPeca> = {}) => criarPeca(entrada(patch), hoje);
function base(): Estudio {
  return ["A", "B", "C"].reduce((e, titulo) => adicionar(e, entrada({ titulo }), "fim", hoje), estudioVazio());
}
function congelar<T>(v: T): T {
  if (v && typeof v === "object") { Object.values(v).forEach(congelar); Object.freeze(v); }
  return v;
}
const titulos = (e: Estudio, etapa: NovaPeca["etapa"] = "ideias") => e.pecas[etapa].map((p) => p.titulo);

describe("estúdio: contrato e validação", () => {
  it("expõe as etapas, sete ângulos, formatos e grupos; vazio e semente são independentes", () => {
    expect(ETAPAS.map((x) => x.id)).toEqual(["ideias", "roteiro", "producao", "pronto", "publicado"]);
    expect(ANGULOS.map((x) => x.id)).toEqual(["sacada", "rotina", "analise", "faq", "opiniao", "reflexao", "historia"]);
    expect(ANGULOS.map((x) => x.cor)).toEqual(["#0A84FF", "#30D158", "#BF5AF2", "#FF9F0A", "#FF453A", "#64D2FF", "#FFD60A"]);
    expect(ANGULOS.every((x) => x.esqueleto.length === 3)).toBe(true);
    expect(FORMATOS.map((x) => x.id)).toEqual(["carrossel", "reel", "stories", "foto", "live", "texto"]);
    expect(GRUPOS.map((x) => x.id)).toEqual(["metodo", "posicionamento", "voz", "ganchos", "narrativas", "referencias", "aprendizados"]);
    expect(ehEstudio(estudioVazio())).toBe(true);
    expect(ehEstudio(semente())).toBe(true);
    expect(semente()).toEqual(semente());
    expect(semente().pecas.ideias).not.toBe(semente().pecas.ideias);
    expect(metricasVazias()).not.toBe(metricasVazias());
  });

  it("normaliza textos curtos, preserva quebras de linha e copia métricas e checklist", () => {
    const dados = congelar(entrada({ titulo: "  Conteúdo  útil ", gancho: "  Minha   sacada ", roteiro: "  A\n\nB  ", legenda: "Linha 1\nLinha 2", metricas: { ...metricasVazias(), curtidas: 0 }, checklist: [{ id: "item", texto: "  Gravar  hoje ", feito: true }] }));
    const p = criarPeca(dados, hoje);
    expect(p).toMatchObject({ titulo: "Conteúdo útil", gancho: "Minha sacada", roteiro: "  A\n\nB  ", legenda: "Linha 1\nLinha 2", criadoEm: hoje, atualizadoEm: hoje, publicadoEm: "", angulo: "", profundidade: "", formato: "", tematica: "", data: "", link: "", checklist: [{ id: "item", texto: "Gravar hoje", feito: true }] });
    expect(p.metricas).not.toBe(dados.metricas);
    expect(p.checklist).not.toBe(dados.checklist);
    expect(criar({ etapa: "publicado" }).publicadoEm).toBe(hoje);
    expect(criar({ data: "2028-02-29", link: "http://example.com/?x=1" }).data).toBe("2028-02-29");
  });

  it.each([
    { titulo: " " }, { titulo: "x".repeat(141) }, { gancho: "x".repeat(301) },
    { roteiro: "x".repeat(8001) }, { legenda: "x".repeat(2201) },
    { etapa: "outra" }, { angulo: "outro" }, { profundidade: "media" }, { formato: "video" },
    { tematica: null }, { tematica: " id " }, { data: "2026-02-29" }, { data: "2026-11-31" },
    { data: "2026-1-02" }, { data: "2026-13-01" }, { data: null },
    { link: "javascript:alert(1)" }, { link: "ftp://example.com" }, { link: "https://" }, { link: "https://example.com/ x" },
    { metricas: { ...metricasVazias(), curtidas: -1 } }, { metricas: { ...metricasVazias(), alcance: NaN } },
    { metricas: { ...metricasVazias(), seguidores: Infinity } }, { metricas: { ...metricasVazias(), visualizacoes: 1.5 } },
    { metricas: {} }, { metricas: null }, { metricas: { ...metricasVazias(), curtidas: "1" } },
    { checklist: null }, { checklist: [{ id: "i", texto: " ", feito: false }] },
    { checklist: [{ id: "i", texto: "x".repeat(201), feito: false }] },
    { checklist: [{ id: "i", texto: "A", feito: "sim" }] },
    { checklist: [{ id: "i", texto: "A", feito: false }, { id: "i", texto: "B", feito: false }] },
  ])("recusa entrada inválida: %j", (patch) => {
    expect(() => criar(patch as Partial<NovaPeca>)).toThrow(Error);
  });

  it("aceita limites exatos e 30 itens; bloqueia excedentes sem alterar o estúdio", () => {
    const e = adicionar(estudioVazio(), entrada({ titulo: "x".repeat(140), gancho: "x".repeat(300), roteiro: "x".repeat(8000), legenda: "x".repeat(2200), checklist: Array.from({ length: 30 }, (_, i) => ({ id: `item-${i}`, texto: "x".repeat(200), feito: false })) }), "fim", hoje);
    expect(ehEstudio(e)).toBe(true);
    expect(() => adicionarItem(e, e.pecas.ideias[0].id, "Mais", hoje)).toThrow("até 30");
    expect(() => criarPeca(entrada(), "2026-02-30")).toThrow("hoje");
  });

  it("recusa todo campo obrigatório ausente e campo extra", () => {
    const e = base();
    for (const campo of Object.keys(e.pecas.ideias[0])) {
      const invalido = structuredClone(e);
      delete (invalido.pecas.ideias[0] as unknown as Record<string, unknown>)[campo];
      expect(ehEstudio(invalido), campo).toBe(false);
    }
    for (const campo of Object.keys(e)) {
      const invalido = { ...e } as Record<string, unknown>;
      delete invalido[campo]; expect(ehEstudio(invalido)).toBe(false);
    }
    const p = e.pecas.ideias[0];
    for (const patch of [{ titulo: " X " }, { publicadoEm: hoje }, { criadoEm: "ontem" }, { atualizadoEm: "2026-02-30" }, { etapa: "roteiro" }, { tematica: "ausente" }, { id: "" }, { extra: true }]) {
      expect(ehEstudio({ ...e, pecas: { ...e.pecas, ideias: [{ ...p, ...patch }] } })).toBe(false);
    }
    expect(ehEstudio({ ...e, extra: true })).toBe(false);
    expect(ehEstudio({ ...e, pecas: { ...e.pecas, outra: [] } })).toBe(false);
    expect(ehEstudio({ ...e, versao: 2 })).toBe(false);
    expect(ehEstudio(null)).toBe(false);
    expect(ehEstudio({ ...e, pecas: { ideias: [] } })).toBe(false);
  });

  it("valida notas e temáticas inteiras, IDs globais e referências", () => {
    let e = adicionarTematica(base(), { nome: "Sites", cliente: "Vender", eu: "Programar", cor: "#aabbCC" });
    e = adicionarNota(e, { titulo: "Método", grupo: "metodo" }, hoje);
    e = editar(e, e.pecas.ideias[0].id, { tematica: e.tematicas[0].id }, hoje);
    expect(ehEstudio(e)).toBe(true);
    const ruins: Estudio[] = [
      { ...e, pecas: { ...e.pecas, ideias: [e.pecas.ideias[0], e.pecas.ideias[0]] } },
      { ...e, notas: [{ ...e.notas[0], id: e.pecas.ideias[0].id }] },
      { ...e, tematicas: [e.tematicas[0], e.tematicas[0]] },
      { ...e, notas: [{ ...e.notas[0], grupo: "outro" } as never] },
      { ...e, notas: [{ ...e.notas[0], titulo: " ", texto: "x".repeat(12001) }] },
      { ...e, notas: [{ ...e.notas[0], fixada: 1 } as never] },
      { ...e, tematicas: [{ ...e.tematicas[0], cor: "red" }] },
    ];
    for (const ruim of ruins) expect(ehEstudio(ruim)).toBe(false);
    for (const [lista, valor] of [["notas", e.notas[0]], ["tematicas", e.tematicas[0]]] as const) {
      for (const campo of Object.keys(valor)) {
        const ruim = structuredClone(e);
        delete (ruim[lista][0] as unknown as Record<string, unknown>)[campo];
        expect(ehEstudio(ruim), `${lista}.${campo}`).toBe(false);
      }
    }
    e.pecas.ideias[1].checklist = [{ id: e.pecas.ideias[0].id, texto: "Repetido", feito: false }];
    expect(ehEstudio(e)).toBe(false);
  });
});

describe("estúdio: operações nas peças", () => {
  it("adiciona nas duas pontas e move na mesma etapa ou entre etapas", () => {
    let e = adicionar(base(), entrada({ titulo: "Primeira" }), "inicio", hoje);
    expect(titulos(e)).toEqual(["Primeira", "A", "B", "C"]);
    const id = e.pecas.ideias[0].id;
    e = mover(e, id, "ideias", 2, amanha);
    expect(titulos(e)).toEqual(["A", "B", "Primeira", "C"]);
    e = mover(e, id, "roteiro", 99, amanha);
    expect(titulos(e, "roteiro")).toEqual(["Primeira"]);
    expect(encontrar(e, id)?.atualizadoEm).toBe(amanha);
    e = mover(e, e.pecas.ideias[2].id, "roteiro", -4, amanha);
    expect(titulos(e, "roteiro")).toEqual(["C", "Primeira"]);
  });

  it("carimba publicadoEm ao entrar, preserva ao editar/reordenar e limpa ao sair", () => {
    let e = base(); const id = e.pecas.ideias[0].id;
    e = mover(e, id, "publicado", 0, amanha);
    expect(encontrar(e, id)?.publicadoEm).toBe(amanha);
    e = editar(e, id, { roteiro: "Revisto\nInteiro" }, "2026-11-19");
    e = mover(e, id, "publicado", 0, "2026-11-20");
    expect(encontrar(e, id)?.publicadoEm).toBe(amanha);
    e = editar(e, id, { etapa: "pronto" }, "2026-11-21");
    expect(encontrar(e, id)?.publicadoEm).toBe("");
    e = editar(e, id, { etapa: "publicado" }, "2026-11-22");
    expect(encontrar(e, id)?.publicadoEm).toBe("2026-11-22");
    expect(ehEstudio(e)).toBe(true);
  });

  it("edita, recusa referência inexistente, remove e informa erros em português", () => {
    const e = base(), id = e.pecas.ideias[0].id;
    expect(encontrar(editar(e, id, { titulo: "Novo", roteiro: "A\nB" }, amanha), id)).toMatchObject({ titulo: "Novo", atualizadoEm: amanha });
    expect(() => adicionar(e, entrada({ tematica: "ausente" }), "fim", hoje)).toThrow("referências");
    expect(() => editar(e, id, { tematica: "ausente" }, hoje)).toThrow(Error);
    expect(() => editar(e, id, { titulo: "" }, hoje)).toThrow("Título");
    expect(() => mover(e, id, "outra" as never, 0, hoje)).toThrow("Etapa inválida");
    expect(() => mover(e, id, "pronto", NaN, hoje)).toThrow("Índice inválido");
    expect(() => editar(e, "ausente", {}, hoje)).toThrow("Peça não encontrada");
    expect(encontrar(remover(e, id), id)).toBeNull();
    expect(titulos(remover(e, "ausente"))).toEqual(["A", "B", "C"]);
  });

  it("duplica abaixo, com novos IDs, checklist desmarcado e sem métricas herdadas", () => {
    const e = adicionar(base(), entrada({ titulo: "x".repeat(140), etapa: "publicado", metricas: { ...metricasVazias(), curtidas: 42 }, checklist: [{ id: "item", texto: "Gravar", feito: true }] }), "fim", hoje);
    const original = e.pecas.publicado[0];
    const copia = duplicar(e, original.id, amanha).pecas.publicado[1];
    expect(copia.id).not.toBe(original.id);
    expect(copia.titulo).toHaveLength(140);
    expect(copia.titulo.endsWith(" (cópia)")).toBe(true);
    expect(copia).toMatchObject({ criadoEm: amanha, atualizadoEm: amanha, publicadoEm: amanha });
    expect(copia.metricas.curtidas).toBeNull();
    expect(copia.checklist[0]).toMatchObject({ feito: false });
    expect(copia.checklist[0].id).not.toBe("item");
  });

  it("opera o checklist e calcula o progresso", () => {
    let e = base(); const id = e.pecas.ideias[0].id;
    expect(progresso(encontrar(e, id)!)).toEqual({ feitos: 0, total: 0 });
    e = adicionarItem(e, id, "  Gravar ", hoje);
    const itemId = encontrar(e, id)!.checklist[0].id;
    e = alternarItem(editarItem(e, id, itemId, "Editar", amanha), id, itemId, amanha);
    expect(progresso(encontrar(e, id)!)).toEqual({ feitos: 1, total: 1 });
    expect(encontrar(e, id)?.checklist[0].texto).toBe("Editar");
    expect(progresso(encontrar(alternarItem(e, id, itemId, hoje), id)!).feitos).toBe(0);
    expect(encontrar(removerItem(e, id, itemId, hoje), id)?.checklist).toEqual([]);
    expect(() => editarItem(e, id, "ausente", "X", hoje)).toThrow("Item do checklist");
    expect(() => removerItem(e, id, "ausente", hoje)).toThrow("Item do checklist");
    expect(() => adicionarItem(e, id, " ", hoje)).toThrow(Error);
  });
});

describe("estúdio: notas e temáticas", () => {
  it("remover temática limpa as referências em todas as etapas, sem apagar as peças", () => {
    let e = adicionarTematica(estudioVazio(), { nome: "Sites" });
    e = adicionarTematica(e, { nome: "Sistemas" });
    const [removida, mantida] = e.tematicas;
    for (const { id: etapa } of ETAPAS) e = adicionar(e, entrada({ etapa, tematica: removida.id }), "fim", hoje);
    e = adicionar(e, entrada({ tematica: mantida.id, titulo: "Outra" }), "fim", hoje);
    const antes = JSON.stringify(e);
    const resultado = removerTematica(congelar(e), removida.id, amanha);
    expect(resultado.tematicas).toEqual([mantida]);
    expect(filtrarPecas(resultado, { tematica: "" })).toHaveLength(5);
    expect(filtrarPecas(resultado, { tematica: "" }).every((p) => p.atualizadoEm === amanha)).toBe(true);
    expect(filtrarPecas(resultado, { tematica: mantida.id })).toHaveLength(1);
    expect(resultado.pecas.publicado[0].publicadoEm).toBe(hoje);
    expect(ehEstudio(resultado)).toBe(true);
    expect(JSON.stringify(e)).toBe(antes);
  });

  it("cria, edita, fixa e remove notas, preservando texto livre", () => {
    let e = adicionarNota(estudioVazio(), { titulo: "  Meu método ", grupo: "metodo", texto: "A\n\nB" }, hoje);
    const id = e.notas[0].id;
    e = editarNota(e, id, { titulo: "Voz", grupo: "voz", texto: " Texto\ninteiro " }, amanha);
    e = alternarNotaFixada(e, id, amanha);
    expect(e.notas[0]).toMatchObject({ titulo: "Voz", grupo: "voz", texto: " Texto\ninteiro ", fixada: true, atualizadoEm: amanha });
    expect(alternarNotaFixada(e, id, hoje).notas[0].fixada).toBe(false);
    expect(removerNota(e, id).notas).toEqual([]);
    expect(() => editarNota(e, "ausente", {}, hoje)).toThrow("Nota não encontrada");
    expect(criarNota({ titulo: "x".repeat(120), grupo: "ganchos", texto: "x".repeat(12000) }, hoje)).toBeTruthy();
    for (const patch of [{ titulo: " " }, { titulo: "x".repeat(121) }, { texto: "x".repeat(12001) }, { fixada: 1 }]) {
      expect(() => editarNota(e, id, patch as never, hoje)).toThrow(Error);
    }
  });

  it("cria e edita temática e limpa só suas referências ao removê-la", () => {
    let e = adicionarTematica(base(), { nome: "  Sites ", cliente: " Cliente\nquer venda ", eu: "Gosto de criar" });
    const id = e.tematicas[0].id;
    e = editarTematica(e, id, { nome: "Conversão", cor: "#FF9F0A" });
    e = editar(e, e.pecas.ideias[0].id, { tematica: id }, hoje);
    e = editar(e, e.pecas.ideias[1].id, { tematica: id, etapa: "publicado" }, hoje);
    const nova = removerTematica(congelar(e), id, amanha);
    expect(nova.tematicas).toEqual([]);
    expect(nova.pecas.ideias[0]).toMatchObject({ tematica: "", atualizadoEm: amanha });
    expect(nova.pecas.publicado[0]).toMatchObject({ tematica: "", publicadoEm: hoje, atualizadoEm: amanha });
    expect(nova.pecas.ideias[1].atualizadoEm).toBe(hoje);
    expect(e.tematicas[0].cliente).toBe(" Cliente\nquer venda ");
    expect(ehEstudio(nova)).toBe(true);
    expect(criarTematica({ nome: "x".repeat(60), cliente: "x".repeat(1000), eu: "x".repeat(1000) })).toBeTruthy();
    for (const patch of [{ nome: "" }, { nome: "x".repeat(61) }, { cliente: "x".repeat(1001) }, { eu: "x".repeat(1001) }, { cor: "#fff" }]) {
      expect(() => editarTematica(e, id, patch)).toThrow(Error);
    }
    expect(() => editarTematica(e, "ausente", {})).toThrow("Temática não encontrada");
  });
});

describe("estúdio: consultas", () => {
  it("filtra sem acento em título, roteiro, gancho, legenda, checklist e nome da temática", () => {
    let e = adicionarTematica(estudioVazio(), { nome: "Conversão" });
    for (const patch of [
      { titulo: "AÇÃO", angulo: "sacada", profundidade: "raso", formato: "reel" },
      { titulo: "B", roteiro: "ação" }, { titulo: "C", gancho: "ação" },
      { titulo: "D", legenda: "ação" }, { titulo: "E", checklist: [{ id: "i", texto: "ação", feito: false }] },
      { titulo: "F", tematica: e.tematicas[0].id },
    ] as Partial<NovaPeca>[]) e = adicionar(e, entrada(patch), "fim", hoje);
    expect(filtrarPecas(e, { busca: " ACAO " }).map((p) => p.titulo)).toEqual(["AÇÃO", "B", "C", "D", "E"]);
    expect(filtrarPecas(e, { busca: "conversao" }).map((p) => p.titulo)).toEqual(["F"]);
    expect(filtrarPecas(e, { angulo: "sacada", profundidade: "raso", formato: "reel", etapa: "ideias", tematica: "" })).toHaveLength(1);
    expect(filtrarPecas(e, { busca: "ausente" })).toEqual([]);
    expect(filtrarPecas(e, { profundidade: "" })).toHaveLength(5);
  });

  it("equilíbrio conta cada profundidade, inclusive peças sem classificação, e aceita filtro", () => {
    let e = base();
    e = editar(e, e.pecas.ideias[0].id, { profundidade: "raso", formato: "reel" }, hoje);
    e = editar(e, e.pecas.ideias[1].id, { profundidade: "profundo" }, hoje);
    expect(equilibrio(e)).toEqual({ raso: 1, profundo: 1, semProfundidade: 1, total: 3 });
    expect(equilibrio(e, { formato: "reel" })).toEqual({ raso: 1, profundo: 0, semProfundidade: 0, total: 1 });
    expect(equilibrio(estudioVazio()).total).toBe(0);
  });

  it("semana vai de segunda a domingo, cruza ano e exclui peças sem data ou de outra semana", () => {
    let e = estudioVazio();
    for (const data of ["2026-12-27", "2026-12-28", "2027-01-01", "2027-01-03", "2027-01-04", ""]) e = adicionar(e, entrada({ data }), "fim", hoje);
    const dias = semana(e, "2027-01-03");
    expect(dias.map((d) => d.data)).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
    expect(dias.map((d) => d.pecas.length)).toEqual([1, 0, 0, 0, 1, 0, 1]);
    expect(semana(e, "2026-12-28")).toEqual(dias);
    expect(semana(estudioVazio(), "2028-02-29")[1].data).toBe("2028-02-29");
    expect(() => semana(e, "2026-02-30")).toThrow("referência");
  });
});

describe("estúdio: armazenamento e imutabilidade", () => {
  it("usa chave por usuário e só chama a semente se não há cópia", () => {
    const e = base(), inicial = vi.fn(semente), getItem = vi.fn(() => JSON.stringify(e));
    expect(carregarEstudio({ getItem }, "u", inicial)).toEqual({ estudio: e, origem: "v1", erro: "" });
    expect(getItem).toHaveBeenCalledWith(chaveEstudio("u"));
    expect(inicial).not.toHaveBeenCalled();
    expect(carregarEstudio({ getItem: () => null }, "v", inicial)).toEqual({ estudio: semente(), origem: "semente", erro: "" });
    expect(inicial).toHaveBeenCalledTimes(1);
    expect(chaveEstudio("u")).toBe("mf-conteudo:v1:u");
    expect(chaveEstudio("u")).not.toBe(chaveEstudio("v"));
  });

  it.each(["{", "null", "", '{"versao":1,"pecas":{}}'])("bloqueia cópia inválida sem substituir pela semente: %s", (valor) => {
    const inicial = vi.fn(semente);
    const r = carregarEstudio({ getItem: () => valor }, "u", inicial);
    expect(r.erro).toContain("inválido"); expect(r.origem).toBe("v1");
    expect(inicial).not.toHaveBeenCalled();
  });

  it("captura leitura bloqueada, semente inválida, cota e nunca grava estado inválido", () => {
    expect(carregarEstudio({ getItem: () => { throw new Error(); } }, "u", semente).erro).toContain("ler");
    expect(carregarEstudio({ getItem: () => null }, "u", () => ({} as Estudio)).erro).toContain("semente");
    const setItem = vi.fn();
    expect(salvarEstudio({ setItem }, "u", base())).toBe(true);
    expect(setItem.mock.calls[0][0]).toBe(chaveEstudio("u"));
    expect(salvarEstudio({ setItem }, "u", {} as Estudio)).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(salvarEstudio({ setItem: () => { throw new Error("Cota"); } }, "u", base())).toBe(false);
  });

  it("todas as operações preservam o original congelado e devolvem um estúdio válido", () => {
    let e = adicionarTematica(base(), { nome: "Sites" });
    e = adicionarNota(e, { titulo: "Voz", grupo: "voz" }, hoje);
    const id = e.pecas.ideias[0].id;
    e = adicionarItem(e, id, "Gravar", hoje);
    congelar(e); const antes = JSON.stringify(e), item = e.pecas.ideias[0].checklist[0].id;
    const operacoes = [
      () => adicionar(e, entrada(), "fim", hoje), () => editar(e, id, { titulo: "Novo" }, amanha),
      () => mover(e, id, "publicado", 0, amanha), () => remover(e, id), () => duplicar(e, id, amanha),
      () => adicionarItem(e, id, "Editar", hoje), () => editarItem(e, id, item, "Novo", hoje),
      () => alternarItem(e, id, item, hoje), () => removerItem(e, id, item, hoje),
      () => adicionarNota(e, { titulo: "Nova", grupo: "metodo" }, hoje),
      () => editarNota(e, e.notas[0].id, { texto: "Novo" }, hoje), () => alternarNotaFixada(e, e.notas[0].id, hoje),
      () => removerNota(e, e.notas[0].id), () => adicionarTematica(e, { nome: "Outra" }),
      () => editarTematica(e, e.tematicas[0].id, { nome: "Nova" }), () => removerTematica(e, e.tematicas[0].id, hoje),
    ];
    for (const operacao of operacoes) {
      const resultado = operacao();
      expect(resultado).not.toBe(e); expect(ehEstudio(resultado)).toBe(true); expect(JSON.stringify(e)).toBe(antes);
    }
    filtrarPecas(e); equilibrio(e); semana(e, hoje);
    expect(JSON.stringify(e)).toBe(antes);
  });
});
