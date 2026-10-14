import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { ehRelatorio } from "../../shared/noite/relatorio.ts";
import { montarRelatorio } from "./montar.ts";
import { coletar, type Dependencias } from "./coletor.ts";
import { ehSaidaCodex } from "./etapa-codex.ts";
import { ehSaidaClaude, extrairSaidaClaude } from "./etapa-claude.ts";
import { janela } from "./tempo.ts";
const deps: Dependencias = {
  fs: {
    listar: () => [],
    ler: () => "",
    stat: () => {
      throw new Error("ENOENT");
    },
  },
  git: () => "",
};
const insumos = coletar(
  {
    dia: "2026-10-13",
    janela: janela("2026-10-13", Date.parse("2026-10-13T20:00:00Z")),
    raizProjetos: "/p",
    vault: "/v",
    claudeDir: "/c",
    codexDir: "/x",
    ignorarCwd: "/n",
  },
  deps
);
const agente = { ok: false, duracaoMs: 0, modelo: null, erro: "Indisponível" };
const base = {
  dia: insumos.dia,
  geradoEm: "2026-10-14T02:00:00Z",
  insumos,
  agentes: { codex: agente, claude: agente },
};
const claude = JSON.parse(
  readFileSync(new URL("./fixtures/claude.json", import.meta.url), "utf8")
);
const codex = JSON.parse(
  readFileSync(new URL("./fixtures/codex.json", import.meta.url), "utf8")
);
it("fixtures seguem os esquemas completos, incluindo campos obrigatórios e enums", () => {
  expect(ehSaidaClaude(claude)).toBe(true);
  expect(ehSaidaCodex(codex)).toBe(true);
  expect(ehSaidaCodex({ ...codex, tendencias: [{ tema: "X" }] })).toBe(false);
  expect(
    ehSaidaClaude({
      ...claude,
      projetos: [
        { nome: "a", avancou: "b", status: "inventado", proximo: "c" },
      ],
    })
  ).toBe(false);
});
it("monta com Claude e remove travessão em profundidade sem mudar métricas", () => {
  const r = montarRelatorio({
    ...base,
    claude: {
      ...claude,
      manchete: "Teste\u2014texto",
      dev: { ...claude.dev, praticou: ["Um\u2013dois"] },
    },
    codex,
  });
  expect(ehRelatorio(r)).toBe(true);
  expect(r.manchete).toBe("Teste, texto");
  expect(r.dev.praticou).toEqual(["Um, dois"]);
  expect(r.metricas).toEqual(insumos.metricas);
});
it("fallback sem ambos, sem Claude e com notícias do Codex", () => {
  const noticia = {
    titulo: "Exemplo",
    fonte: "Fixture",
    url: "https://example.com",
    data: "2026-10-13",
    resumo: "Teste",
    porqueImporta: "Teste",
    tema: "Teste",
  };
  for (const pesquisa of [null, { ...codex, noticias: [noticia] }]) {
    const r = montarRelatorio({ ...base, claude: null, codex: pesquisa });
    expect(ehRelatorio(r)).toBe(true);
    expect(r.manchete).toBe("Dia sem commits");
    expect(r.resumo.length).toBeGreaterThanOrEqual(2);
    expect(r.noticias).toHaveLength(pesquisa ? 1 : 0);
  }
});
it("erro informa o campo do relatório inválido", () => {
  expect(() =>
    montarRelatorio({
      ...base,
      insumos: { ...insumos, metricas: { ...insumos.metricas, commits: NaN } },
      claude,
      codex,
    })
  ).toThrow("metricas");
  expect(() =>
    montarRelatorio({ ...base, claude: { ...claude, dev: {} }, codex })
  ).toThrow("dev");
});
it("Claude extrai structured_output e fallback result, com custo", () => {
  expect(
    extrairSaidaClaude(
      JSON.stringify({ structured_output: claude, total_cost_usd: 0.12 })
    )
  ).toEqual({ saida: claude, custo: 0.12 });
  expect(
    extrairSaidaClaude(JSON.stringify({ result: JSON.stringify(claude) })).saida
  ).toEqual(claude);
  expect(() =>
    extrairSaidaClaude(
      JSON.stringify({ is_error: true, structured_output: claude })
    )
  ).toThrow();
});
