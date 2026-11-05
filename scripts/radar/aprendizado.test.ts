import { test } from "vitest";
import assert from "node:assert/strict";
import { contarMotivos, reprovacoes } from "../../shared/radar/aprendizado.ts";
import { leadTeste } from "./apoio-envio.ts";

test("aprendizado: só reprovados com motivo entram, contados por frequência", () => {
  const leads = [leadTeste("a", 80), leadTeste("b", 70), leadTeste("c", 60)];
  const registros = {
    a: { etapa: "descartado" as const, anotacao: "Reprovado: Site já é bom", atualizadoEm: "2026-11-05T12:00:00.000Z" },
    b: { etapa: "descartado" as const, anotacao: "Reprovado: Site já é bom", atualizadoEm: "2026-11-04T12:00:00.000Z" },
    c: { etapa: "descartado" as const, anotacao: "Inativo", atualizadoEm: "2026-11-05T12:00:00.000Z" },
  };
  const itens = reprovacoes(leads, registros);
  assert.deepEqual(itens.map(i => i.id), ["a", "b"]);
  assert.equal(itens[0].motivo, "Site já é bom");
  assert.deepEqual(contarMotivos(itens), [["Site já é bom", 2]]);
});
