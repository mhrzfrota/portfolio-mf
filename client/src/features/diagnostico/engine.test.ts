import { describe, expect, it } from "vitest";
import {
  classificarSegmento,
  gerarRelatorio,
  localRulesProvider,
} from "./engine";
import { DEMO_LOJA_VEICULOS } from "./demo";
import type { DiagnosticoInput } from "./types";

const baseInput: DiagnosticoInput = {
  empresa: "Estúdio Alfa",
  segmento: "Consultoria de marketing",
  site: "estudioalfa.com.br",
  instagram: "@estudioalfa",
  objetivo: "leads",
};

describe("classificarSegmento", () => {
  it("reconhece loja de veículos", () => {
    expect(classificarSegmento("Loja de veículos seminovos")).toBe("veiculos");
    expect(classificarSegmento("Concessionária de motos")).toBe("veiculos");
  });

  it("cai no genérico quando não reconhece", () => {
    expect(classificarSegmento("Pet shop")).toBe("geral");
  });
});

describe("gerarRelatorio", () => {
  it("é determinístico para o mesmo input", () => {
    const a = gerarRelatorio(baseInput);
    const b = gerarRelatorio(baseInput);
    expect(a).toEqual(b);
  });

  it("mantém todas as notas entre 0 e 100", () => {
    const inputs: DiagnosticoInput[] = [
      baseInput,
      { ...baseInput, site: "", instagram: "" },
      { ...baseInput, empresa: "X", segmento: "Y", objetivo: "organizacao" },
      DEMO_LOJA_VEICULOS,
    ];
    for (const input of inputs) {
      const report = gerarRelatorio(input);
      expect(report.notaGeral).toBeGreaterThanOrEqual(0);
      expect(report.notaGeral).toBeLessThanOrEqual(100);
      for (const pilar of report.pilares) {
        expect(pilar.score).toBeGreaterThanOrEqual(0);
        expect(pilar.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("gera todas as seções do relatório", () => {
    const report = gerarRelatorio(DEMO_LOJA_VEICULOS);
    expect(report.pilares).toHaveLength(5);
    expect(report.problemas.length).toBeGreaterThan(0);
    expect(report.problemas.length).toBeLessThanOrEqual(4);
    expect(report.oportunidades.length).toBeGreaterThanOrEqual(3);
    expect(report.recomendacoes).toHaveLength(4);
    expect(report.ideiasDeConteudo.length).toBeGreaterThanOrEqual(5);
    expect(report.automacoes.length).toBeGreaterThanOrEqual(4);
    expect(report.plano7Dias).toHaveLength(7);
    expect(report.plano7Dias.map(d => d.dia)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(report.propostaDeValor).toContain(DEMO_LOJA_VEICULOS.empresa);
    expect(report.headline.length).toBeGreaterThan(20);
  });

  it("penaliza ausência de site e Instagram na presença digital", () => {
    const completo = gerarRelatorio(baseInput);
    const vazio = gerarRelatorio({ ...baseInput, site: "", instagram: "" });
    const presenca = (r: typeof completo) =>
      r.pilares.find(p => p.id === "presenca")!.score;
    expect(presenca(vazio)).toBeLessThan(presenca(completo));
  });

  it("usa conteúdo específico do segmento de veículos na demo", () => {
    const report = gerarRelatorio(DEMO_LOJA_VEICULOS);
    const texto = JSON.stringify(report);
    expect(texto).toMatch(/estoque|veículo|carro/i);
  });
});

describe("localRulesProvider", () => {
  it("resolve com o mesmo relatório das regras locais", async () => {
    const report = await localRulesProvider.analyze(baseInput);
    expect(report).toEqual(gerarRelatorio(baseInput));
  });
});
