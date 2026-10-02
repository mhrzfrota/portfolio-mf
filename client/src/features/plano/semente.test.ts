import { describe, expect, it } from "vitest";
import { COLUNAS, ehQuadro } from "./quadro";
import { semente } from "./semente";

describe("semente do quadro", () => {
  it("é um quadro válido, com todas as colunas preenchidas", () => {
    const q = semente("2026-10-02");
    expect(ehQuadro(q)).toBe(true);
    for (const c of COLUNAS) expect(q.colunas[c.id].length).toBeGreaterThan(0);
    expect(Object.values(q.colunas).flat()).toHaveLength(38);
  });

  it("feito traz a data real de conclusão e a agenda vem em ordem de data", () => {
    const q = semente("2026-10-02");
    expect(q.colunas.feito.every((c) => c.concluidoEm && c.concluidoEm <= "2026-10-02")).toBe(true);
    const datas = q.colunas.agenda.map((c) => c.data);
    expect(datas).toEqual([...datas].sort());
  });
});
