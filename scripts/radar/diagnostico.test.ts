import { describe, expect, it } from "vitest";
import { analisarHtml } from "./diagnostico-site.ts";

describe("diagnóstico do site", () => {
  const contexto = { url: "https://site.example", analisadoEm: "2026-10-24", status: 200, tempoRespostaMs: 100 };
  it("avalia HTML moderno usando sinais objetivos", () => {
    const html = `<title>Negócio fictício</title><meta name="viewport" content="width=device-width"><meta name="description" content="Descrição de teste"><form></form><footer>© 2026</footer>`;
    const resultado = analisarHtml(html, contexto);
    expect(resultado.situacaoSugerida).toBe("bom");
    expect(resultado.viewport).toBe(true);
    expect(resultado.temFormulario).toBe(true);
  });
  it("classifica ausência de viewport e HTTPS como problemas graves", () => {
    const resultado = analisarHtml("<footer>© 2018</footer>", { ...contexto, url: "http://site.example", analisadoEm: "2026-10-24" });
    expect(resultado.situacaoSugerida).toBe("ruim");
    expect(resultado.problemas).toContain("Sem meta viewport: não se adapta ao celular");
  });
  it("reconhece páginas de bio como sem site próprio", () => {
    const resultado = analisarHtml("", { ...contexto, url: "https://linktr.ee/perfil-ficticio" });
    expect(resultado.situacaoSugerida).toBe("sem-site");
    expect(resultado.https).toBe(true);
  });
});
