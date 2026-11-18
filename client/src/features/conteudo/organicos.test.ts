import { describe, expect, it } from "vitest";
import { adicionar, adicionarTematica, ehEstudio, estudioVazio } from "./estudio.ts";
import { MODELOS, ORGANICO, idOrganico, ideiasLivres, pecaDoModelo, segundaDe, semanas } from "./organicos.ts";

const HOJE = "2026-11-18";

describe("organicos", () => {
  it("semana começa na segunda e dia passado vira hoje", () => {
    expect(segundaDe(HOJE)).toBe("2026-11-16");
    const [atual, proxima] = semanas(estudioVazio(), 2, HOJE);
    expect(atual.inicio).toBe("2026-11-16");
    expect(atual.diaOrganico).toBe(HOJE);
    expect(atual.diaCaprichado).toBe("2026-11-19");
    expect(proxima.diaOrganico).toBe("2026-11-24");
  });

  it("separa caprichado de orgânico e o modelo gera peça válida, duas vezes", () => {
    let e = adicionarTematica(estudioVazio(), { nome: ORGANICO.nome, cor: ORGANICO.cor });
    const org = idOrganico(e)!;
    e = adicionar(e, pecaDoModelo(MODELOS[0], org, "2026-11-19"), "fim", HOJE);
    e = adicionar(e, pecaDoModelo(MODELOS[0], org, "2026-11-20"), "fim", HOJE);
    e = adicionar(e, { etapa: "ideias", titulo: "Post grande", data: "2026-11-19" }, "fim", HOJE);
    e = adicionar(e, { etapa: "ideias", titulo: "Sem data" }, "fim", HOJE);
    expect(ehEstudio(e)).toBe(true);
    const [atual] = semanas(e, 1, HOJE);
    expect(atual.organicos).toHaveLength(2);
    expect(atual.caprichado.map((p) => p.titulo)).toEqual(["Post grande"]);
    expect(ideiasLivres(e).map((p) => p.titulo)).toEqual(["Sem data"]);
  });

  it("modelos têm palavra única e texto sem travessão", () => {
    const palavras = MODELOS.map((m) => m.palavra);
    expect(new Set(palavras).size).toBe(palavras.length);
    expect(JSON.stringify(MODELOS)).not.toContain("—");
  });
});
