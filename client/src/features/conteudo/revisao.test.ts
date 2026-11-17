import { describe, expect, it } from "vitest";
import { adicionar, adicionarNota, atrasada, editarMetricas, ehEstudio, estudioVazio, mistura, mover, notasDoGrupo, semana } from "./estudio";
import { semente } from "./semente";

const hoje = "2026-11-17";

describe("semente", () => {
  it("é um estúdio válido, com temáticas, peças nas cinco etapas e notas em todas as pastas", () => {
    const s = semente();
    expect(ehEstudio(s)).toBe(true);
    expect(s.tematicas.length).toBeGreaterThanOrEqual(5);
    expect(s.pecas.ideias.length).toBeGreaterThan(5);
    expect(s.pecas.publicado.every((p) => p.publicadoEm)).toBe(true);
    for (const g of ["metodo", "posicionamento", "voz", "ganchos", "narrativas", "referencias", "aprendizados"] as const)
      expect(s.notas.some((n) => n.grupo === g)).toBe(true);
  });
  it("não usa travessão em nenhum texto", () => {
    expect(JSON.stringify(semente())).not.toContain("—");
  });
  it("cada chamada devolve uma cópia nova", () => {
    const a = semente();
    a.notas[0].titulo = "mudou";
    expect(semente().notas[0].titulo).not.toBe("mudou");
  });
});

describe("helpers da interface", () => {
  it("editarMetricas troca só o informado e recusa negativo", () => {
    const e = adicionar(estudioVazio(), { titulo: "A", etapa: "publicado" }, "fim", hoje);
    const id = e.pecas.publicado[0].id;
    const m = editarMetricas(e, id, { visualizacoes: 100 }, hoje);
    expect(m.pecas.publicado[0].metricas.visualizacoes).toBe(100);
    expect(m.pecas.publicado[0].metricas.salvamentos).toBeNull();
    expect(() => editarMetricas(m, id, { salvamentos: -1 }, hoje)).toThrow();
  });
  it("notasDoGrupo põe fixadas primeiro e depois as mais recentes", () => {
    let e = adicionarNota(estudioVazio(), { grupo: "voz", titulo: "velha" }, "2026-11-01");
    e = adicionarNota(e, { grupo: "voz", titulo: "nova" }, "2026-11-10");
    e = adicionarNota(e, { grupo: "voz", titulo: "fixa", fixada: true }, "2026-10-01");
    e = adicionarNota(e, { grupo: "metodo", titulo: "outra" }, hoje);
    expect(notasDoGrupo(e, "voz").map((n) => n.titulo)).toEqual(["fixa", "nova", "velha"]);
  });
  it("atrasada: data passada e fora de publicado", () => {
    let e = adicionar(estudioVazio(), { titulo: "A", etapa: "pronto", data: "2026-11-10" }, "fim", hoje);
    const p = e.pecas.pronto[0];
    expect(atrasada(p, hoje)).toBe(true);
    e = mover(e, p.id, "publicado", 0, hoje);
    expect(atrasada(e.pecas.publicado[0], hoje)).toBe(false);
  });
  it("mistura conta só peças com data no período", () => {
    let e = adicionar(estudioVazio(), { titulo: "A", etapa: "ideias", data: "2026-11-18", angulo: "faq", formato: "reel", profundidade: "raso" }, "fim", hoje);
    e = adicionar(e, { titulo: "B", etapa: "ideias", data: "2026-11-20", angulo: "faq", profundidade: "profundo" }, "fim", hoje);
    e = adicionar(e, { titulo: "C", etapa: "ideias", data: "2026-12-30", angulo: "historia" }, "fim", hoje);
    e = adicionar(e, { titulo: "D", etapa: "ideias" }, "fim", hoje);
    const m = mistura(e, { de: "2026-11-17", ate: "2026-11-30" });
    expect(m).toMatchObject({ raso: 1, profundo: 1, total: 2 });
    expect(m.angulos.faq).toBe(2);
    expect(m.angulos.historia).toBe(0);
    expect(m.formatos.reel).toBe(1);
  });
  it("semana começa na segunda de qualquer dia informado", () => {
    expect(semana(estudioVazio(), "2026-11-20").map((d) => d.data)).toEqual(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
  });
});
