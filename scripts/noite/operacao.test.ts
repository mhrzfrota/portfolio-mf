import { afterEach, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  existsSync,
  utimesSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { limpar, travar } from "./arquivos.ts";
import { executar, ambienteAgente } from "./processo.ts";
import { flags } from "./noite.ts";
const temporarias: string[] = [];
const temporaria = () => {
  const p = mkdtempSync(join(tmpdir(), "noite-test-"));
  temporarias.push(p);
  return p;
};
afterEach(() => {
  vi.unstubAllEnvs();
  temporarias.forEach(p => rmSync(p, { recursive: true, force: true }));
  temporarias.length = 0;
});
it("trava exclusiva e recuperação depois de duas horas", () => {
  const base = temporaria();
  const liberar = travar(base);
  expect(readFileSync(join(base, "noite.lock"), "utf8")).toBe(
    String(process.pid)
  );
  expect(() => travar(base)).toThrow("já em execução");
  liberar();
  writeFileSync(join(base, "noite.lock"), "999999");
  const antigo = new Date(Date.now() - 3 * 3600_000);
  utimesSync(join(base, "noite.lock"), antigo, antigo);
  const soltar = travar(base);
  expect(existsSync(join(base, "noite.lock"))).toBe(true);
  soltar();
  expect(existsSync(join(base, "noite.lock"))).toBe(false);
});
it("limpeza só apaga dias antigos e preserva links, logs e o dia em execução", () => {
  const base = temporaria();
  for (const nome of [
    "2026-01-01",
    "2026-01-02",
    "2026-10-13",
    "2026-02-30",
    "logs",
    "arquivo",
  ])
    mkdirSync(join(base, nome));
  symlinkSync(join(base, "logs"), join(base, "2026-01-03"));
  limpar(base, Date.parse("2026-10-14T12:00:00Z"), "2026-01-02");
  expect(existsSync(join(base, "2026-01-01"))).toBe(false);
  for (const nome of [
    "2026-01-02",
    "2026-01-03",
    "2026-10-13",
    "2026-02-30",
    "logs",
    "arquivo",
  ])
    expect(existsSync(join(base, nome))).toBe(true);
});
it("executa stdin sem shell e interrompe processo travado, sem chamar agentes", async () => {
  const cwd = temporaria();
  expect(
    await executar(
      process.execPath,
      ["-e", "process.stdin.pipe(process.stdout)"],
      { cwd, stdin: 'texto "literal"', timeout: 5000 }
    )
  ).toBe('texto "literal"');
  await expect(
    executar(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd,
      timeout: 50,
    })
  ).rejects.toThrow("Tempo máximo");
  await expect(
    executar("/executavel-inexistente-noite", [], { cwd, timeout: 5000 })
  ).rejects.toThrow("Não foi possível iniciar");
});
it("credenciais do Supabase não são herdadas pelos agentes", () => {
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "somente-fixture");
  vi.stubEnv("NOITE_OWNER_EMAIL", "teste@example.com");
  expect(ambienteAgente()).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  expect(ambienteAgente()).not.toHaveProperty("NOITE_OWNER_EMAIL");
});
it("flags: falso implica seco, data explícita e opções inválidas", () => {
  const agora = Date.parse("2026-10-14T04:30:00Z");
  expect(flags(["--falso", "--sem-codex", "--sem-claude"], agora)).toEqual({
    falso: true,
    seco: true,
    dia: "2026-10-13",
    semCodex: true,
    semClaude: true,
  });
  expect(flags(["--dia", "2026-10-14"], agora).dia).toBe("2026-10-14");
  expect(() => flags(["--dia", "2026-10-15"], agora)).toThrow("futuro");
  expect(() => flags(["--desconhecido"], agora)).toThrow();
  expect(() => flags(["--dia"], agora)).toThrow();
});
