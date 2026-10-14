import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { diasSalvos } from "./subir-salvos.ts";

it("acha só as pastas de dia com relatorio.json, em ordem", () => {
  const base = mkdtempSync(join(tmpdir(), "noite-"));
  for (const d of ["2026-10-14", "2026-10-13", "logs", "2026-10-12"]) mkdirSync(join(base, d));
  writeFileSync(join(base, "2026-10-14", "relatorio.json"), "{}");
  writeFileSync(join(base, "2026-10-13", "relatorio.json"), "{}");
  expect(diasSalvos(base)).toEqual(["2026-10-13", "2026-10-14"]);
  expect(diasSalvos(base, "2026-10-13")).toEqual(["2026-10-13"]);
  expect(diasSalvos(base, "2026-10-12")).toEqual([]);
  expect(diasSalvos(base, "lixo")).toEqual([]);
});
