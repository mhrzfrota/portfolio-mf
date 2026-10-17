import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  acordadoPelo,
  diaPendente,
  relatorioCompleto,
  registrarTentativa,
  tentativas,
} from "./pendente.ts";
it("dia pendente: hoje depois do horário, ontem antes dele", () => {
  // Fortaleza é UTC-3
  expect(diaPendente(Date.parse("2026-10-17T02:31:00Z"))).toBe("2026-10-16"); // 23:31
  expect(diaPendente(Date.parse("2026-10-17T02:29:00Z"))).toBe("2026-10-15"); // 23:29
  expect(diaPendente(Date.parse("2026-10-17T11:00:00Z"))).toBe("2026-10-16"); // 08:00
  expect(diaPendente(Date.parse("2026-10-17T04:00:00Z"))).toBe("2026-10-16"); // 01:00
  expect(diaPendente(Date.parse("2026-10-17T00:30:00Z"), "21:00")).toBe("2026-10-16"); // 21:30
});
it("DarkWake não tem Graphics; sem a linha, não bloqueia", () => {
  expect(acordadoPelo("Current System Capabilities are: CPU Graphics Audio Network \nCurrent Power State: 4")).toBe(true);
  expect(acordadoPelo("Current System Capabilities are: CPU Network \nCurrent Power State: 4")).toBe(false);
  expect(acordadoPelo("")).toBe(true);
});
it("completo só com síntese do Claude e notícias (do Codex ou do plano B)", () => {
  const pasta = mkdtempSync(join(tmpdir(), "noite-pendente-"));
  const gravar = (r: unknown) =>
    writeFileSync(join(pasta, "relatorio.json"), JSON.stringify(r));
  expect(relatorioCompleto(pasta)).toBe(false);
  gravar({ agentes: { codex: { ok: false }, claude: { ok: true } }, noticias: [] });
  expect(relatorioCompleto(pasta)).toBe(false);
  gravar({ agentes: { codex: { ok: false }, claude: { ok: true } }, noticias: [{}] });
  expect(relatorioCompleto(pasta)).toBe(true);
  gravar({ agentes: { codex: { ok: true }, claude: { ok: false } }, noticias: [{}] });
  expect(relatorioCompleto(pasta)).toBe(false);
  gravar({ agentes: { codex: { ok: true }, claude: { ok: true } }, noticias: [] });
  expect(relatorioCompleto(pasta)).toBe(true);
  writeFileSync(join(pasta, "relatorio.json"), "{quebrado");
  expect(relatorioCompleto(pasta)).toBe(false);
});
it("conta as tentativas por noite", () => {
  const pasta = mkdtempSync(join(tmpdir(), "noite-tentativas-"));
  expect(tentativas(pasta)).toBe(0);
  registrarTentativa(pasta);
  registrarTentativa(pasta);
  expect(tentativas(pasta)).toBe(2);
});
it("refazer uma noite passada usa o fim daquela janela como agora", async () => {
  const { agoraDaNoite } = await import("./etapa-codex.ts");
  const fim = Date.parse("2026-10-16T07:00:00Z");
  expect(agoraDaNoite({ janela: { inicio: 0, fim } } as never)).toBe("2026-10-16T07:00:00.000Z");
});
it("os agentes são obrigados a dar categoria, ação e relevância a cada notícia", async () => {
  const { erroEsquema, esquemaCodex, esquemaClaude } = await import("./validacao.ts");
  const item = { titulo: "T", fonte: "F", url: "https://a.b", data: "2026-10-16", resumo: "R", porqueImporta: "P", tema: "X" };
  for (const esquema of [esquemaCodex, esquemaClaude]) {
    const noticias = esquema.properties!.noticias;
    expect(erroEsquema([item], noticias)).toBe("saida[0].categoria");
    expect(erroEsquema([{ ...item, categoria: "mercado", acao: "Avisar", relevancia: "alta" }], noticias)).toBeNull();
    expect(erroEsquema([{ ...item, categoria: "outra", acao: "A", relevancia: "alta" }], noticias)).toBe("saida[0].categoria");
  }
});
