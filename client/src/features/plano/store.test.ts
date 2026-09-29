import { describe, expect, it } from "vitest";
import { adicionar, alternarFeito, hojeISO, isPlanoState, mover, remover, semear } from "./store";

const vazio = { itens: [] };

describe("plano", () => {
  it("adiciona no topo, limpa espaços e ignora texto vazio", () => {
    const s = adicionar(adicionar(vazio, "  primeira   ideia ", "ideia", "2026-09-28"), "segunda", "fazer", "2026-09-28");
    expect(s.itens.map((i) => i.texto)).toEqual(["segunda", "primeira ideia"]);
    expect(adicionar(vazio, "   ", "ideia").itens).toHaveLength(0);
  });

  it("checkbox marca feito com data e desmarcar volta para vou fazer", () => {
    const s = adicionar(vazio, "tarefa", "ideia", "2026-09-28");
    const id = s.itens[0].id;
    const feito = alternarFeito(s, id, "2026-09-29");
    expect(feito.itens[0]).toMatchObject({ etapa: "feito", feitoEm: "2026-09-29" });
    const volta = alternarFeito(feito, id);
    expect(volta.itens[0].etapa).toBe("fazer");
    expect(volta.itens[0].feitoEm).toBeUndefined();
  });

  it("move entre ideia e vou fazer, e remove", () => {
    const s = adicionar(vazio, "x", "ideia");
    const id = s.itens[0].id;
    expect(mover(s, id, "fazer").itens[0].etapa).toBe("fazer");
    expect(remover(s, id).itens).toHaveLength(0);
  });

  it("valida o que vem do armazenamento", () => {
    expect(isPlanoState(semear("2026-09-28"))).toBe(true);
    expect(isPlanoState({ itens: [{ id: "1", texto: "a", etapa: "outra", criadoEm: "x" }] })).toBe(false);
    expect(isPlanoState(null)).toBe(false);
  });

  it("data de hoje é local, não UTC", () => {
    expect(hojeISO(new Date(2026, 8, 28, 23, 30))).toBe("2026-09-28");
  });
});
