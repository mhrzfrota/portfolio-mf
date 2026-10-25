import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Insumos } from "./coletor.ts";
const mock = vi.hoisted(() => ({ executar: vi.fn() }));
vi.mock("./processo.ts", async original => ({
  ...(await original<typeof import("./processo.ts")>()),
  executar: mock.executar,
}));
import { etapaCodex } from "./etapa-codex.ts";
import { etapaClaude } from "./etapa-claude.ts";
const fixture = (agente: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${agente}.json`, import.meta.url), "utf8")
  );
const insumos = { dia: "2026-10-13", metricas: { commits: 4 } } as Insumos;
let pasta: string;
beforeEach(() => {
  mock.executar.mockReset();
  pasta = mkdtempSync(join(tmpdir(), "noite-etapa-"));
});
afterEach(() => {
  rmSync(pasta, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
it("Codex recebe comando, esquema e stdin, lê saída e marca sucesso", async () => {
  mock.executar.mockImplementation(async (_cmd, args) => {
    writeFileSync(
      args[args.indexOf("-o") + 1],
      JSON.stringify(fixture("codex"))
    );
    return "";
  });
  const r = await etapaCodex({
    pastaDoDia: pasta,
    repo: resolve("."),
    insumos,
    log: vi.fn(),
  });
  expect(r.agente.ok).toBe(true);
  expect(r.saida).toEqual(fixture("codex"));
  const [comando, args, op] = mock.executar.mock.calls[0];
  expect(comando).toBe("codex");
  expect(args).toEqual([
    "--search",
    "exec",
    "-s",
    "read-only",
    "--skip-git-repo-check",
    "-C",
    pasta,
    "-c",
    "model_reasoning_effort=medium",
    "--output-schema",
    resolve("scripts/noite/esquemas/codex.json"),
    "-o",
    join(pasta, "codex.json"),
    "-",
  ]);
  expect(op.stdin).toContain('"commits":4');
  expect(op.timeout).toBe(12 * 60_000);
});
it("Codex em erro não reaproveita saída antiga", async () => {
  writeFileSync(join(pasta, "codex.json"), JSON.stringify(fixture("codex")));
  mock.executar.mockRejectedValue(new Error("Tempo máximo excedido"));
  const r = await etapaCodex({
    pastaDoDia: pasta,
    repo: resolve("."),
    insumos,
    log: vi.fn(),
  });
  expect(r.saida).toBeNull();
  expect(r.agente.ok).toBe(false);
  expect(
    JSON.parse(readFileSync(join(pasta, "codex.json"), "utf8"))
  ).toBeNull();
});
it("Claude recebe Codex, vault, modelo e custo", async () => {
  const log = vi.fn();
  vi.stubEnv("NOITE_CLAUDE_MODELO", "sonnet");
  mock.executar.mockResolvedValue(
    JSON.stringify({
      structured_output: fixture("claude"),
      total_cost_usd: 0.04,
    })
  );
  const r = await etapaClaude({
    pastaDoDia: pasta,
    vault: "/vault",
    insumos,
    codex: fixture("codex"),
    log,
  });
  expect(r.agente.ok).toBe(true);
  expect(log).toHaveBeenCalledWith("Claude total_cost_usd=0.04");
  const [comando, args, op] = mock.executar.mock.calls[0];
  expect(comando).toBe("claude");
  expect(args).toContain("--json-schema");
  expect(args).toContain("Read Grep Glob WebSearch WebFetch");
  expect(args.slice(-2)).toEqual(["--add-dir", "/vault"]);
  expect(op.cwd).toBe(pasta);
  expect(op.stdin).toContain('"leituraTecnica"');
});
it("Claude inválido registra custo, erro e saída nula", async () => {
  const log = vi.fn();
  mock.executar.mockResolvedValue(
    JSON.stringify({
      structured_output: { manchete: "incompleto" },
      total_cost_usd: 0.02,
    })
  );
  const r = await etapaClaude({
    pastaDoDia: pasta,
    vault: "/vault",
    insumos,
    codex: null,
    log,
  });
  expect(r.saida).toBeNull();
  expect(r.agente.erro).toContain("resumo");
  expect(log).toHaveBeenCalledWith("Claude total_cost_usd=0.02");
});

it("Codex com saída ausente não aceita JSON de execução anterior", async () => {
  writeFileSync(join(pasta, "codex.json"), JSON.stringify(fixture("codex")));
  mock.executar.mockResolvedValue("");
  const r = await etapaCodex({
    pastaDoDia: pasta,
    repo: resolve("."),
    insumos,
    log: vi.fn(),
  });
  expect(r.saida).toBeNull();
  expect(r.agente.ok).toBe(false);
});
