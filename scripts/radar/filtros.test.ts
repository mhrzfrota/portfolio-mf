import { describe, expect, it } from "vitest";
import { filtrar, FILTROS_INICIAIS, temFiltroAtivo } from "../../shared/radar/filtros.ts";
import { validarLead } from "../../shared/radar/validar.ts";
import type { Lead } from "../../shared/radar/tipos.ts";
import { readFileSync } from "node:fs";

function leadFake(): Lead {
  const bruto = JSON.parse(readFileSync(new URL("./fixtures/lead-exemplo.json", import.meta.url), "utf8")) as unknown;
  const resultado = validarLead(bruto, "2026-10-24");
  if (!resultado.ok) throw new Error(resultado.erros.join("; "));
  return resultado.lead;
}

describe("filtros", () => {
  it("busca sem acento, esconde descartados sem filtro de etapa e ordena pela nota", () => {
    const a = leadFake();
    const b = { ...a, id: "outro-ficticio", nome: "Outro Negócio", pontuacao: 90, cidade: "Natal" };
    const funil = { [a.id]: { etapa: "descartado" as const, anotacao: "", atualizadoEm: "" } };
    expect(filtrar([a, b], { ...FILTROS_INICIAIS, busca: "negocio" }, funil).map((x) => x.id)).toEqual(["outro-ficticio"]);
    expect(filtrar([a, b], { ...FILTROS_INICIAIS, etapa: "descartado" }, funil).map((x) => x.id)).toEqual([a.id]);
  });
  it("detecta filtros ativos sem contar a ordenação", () => {
    expect(temFiltroAtivo(FILTROS_INICIAIS)).toBe(false);
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, ordem: "nome" })).toBe(false);
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, uf: "CE" })).toBe(true);
  });
});
