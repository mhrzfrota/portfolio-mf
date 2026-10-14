import { describe, expect, it } from "vitest";
import { diaDaNoite, horaFortaleza, janela, validarDia } from "./tempo.ts";
describe("tempo em Fortaleza", () => {
  it.each([
    ["2026-10-14T01:30:00-03:00", "2026-10-13"],
    ["2026-10-14T03:59:59-03:00", "2026-10-13"],
    ["2026-10-14T04:00:00-03:00", "2026-10-14"],
    ["2027-01-01T00:00:00-03:00", "2026-12-31"],
  ])("diaDaNoite %s", (agora, dia) =>
    expect(diaDaNoite(new Date(agora))).toBe(dia)
  );
  it("janela após meia-noite e limite das 04h", () => {
    const agora = Date.parse("2026-10-14T01:30:00-03:00");
    expect(janela("2026-10-13", agora)).toEqual({
      inicio: Date.parse("2026-10-13T03:00:00Z"),
      fim: agora,
    });
    expect(janela("2026-10-13", Date.parse("2026-10-16T00:00:00Z")).fim).toBe(
      Date.parse("2026-10-14T07:00:00Z")
    );
    expect(horaFortaleza(Date.parse("2026-10-14T03:00:00Z"))).toBe("00:00");
  });
  it("rejeita datas normalizadas e traversal", () => {
    expect(() => validarDia("2026-02-30")).toThrow();
    expect(() => validarDia("../logs")).toThrow();
  });
});
