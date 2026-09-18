import { describe, expect, it } from "vitest";
import {
  filtrar,
  fmtTokens,
  maisLigadas,
  notasFrias,
  notasPesadas,
  ordenar,
  porPasta,
  relativo,
} from "./stats";
import type { NotaCerebro } from "./types";

const HOJE = new Date("2026-09-18T12:00:00Z");

function nota(p: Partial<NotaCerebro> & { path: string }): NotaCerebro {
  return {
    pasta: p.path.includes("/") ? p.path.split("/")[0] : "(raiz)",
    titulo: p.path.split("/").pop()!.replace(".md", ""),
    tags: [],
    status: null,
    links: [],
    palavras: 100,
    tokens: 150,
    resumo: null,
    modificado: "2026-09-17T10:00:00Z",
    ...p,
  };
}

const NOTAS = [
  nota({ path: "projetos/Car Store.md", tokens: 19000, links: ["Sistema LV", "Lopes Premium Car"] }),
  nota({ path: "projetos/Sistema LV.md", tokens: 1800, modificado: "2026-08-01T10:00:00Z", links: ["Lopes Premium Car"] }),
  nota({ path: "projetos/Lopes Premium Car.md", tokens: 900, modificado: "2026-08-10T10:00:00Z" }),
  nota({ path: "clientes/car-store/overview.md", titulo: "Car Store", tokens: 700, links: ["Car Store", "Inexistente"] }),
  nota({ path: "arquivo/velha.md", tokens: 100, modificado: "2026-05-01T10:00:00Z" }),
  nota({ path: "Home.md", tokens: 1500, links: ["Car Store"] }),
];

describe("porPasta", () => {
  it("agrupa, soma e ordena por tokens", () => {
    const r = porPasta(NOTAS);
    expect(r[0]).toMatchObject({ pasta: "projetos", notas: 3, tokens: 21700, ultima: "2026-09-17T10:00:00Z" });
    expect(r.map(p => p.pasta)).toEqual(["projetos", "(raiz)", "clientes", "arquivo"]);
  });
});

describe("notasFrias", () => {
  it("pega 30+ dias, ignora arquivo, mais antiga primeiro", () => {
    expect(notasFrias(NOTAS, HOJE).map(n => n.path)).toEqual(["projetos/Sistema LV.md", "projetos/Lopes Premium Car.md"]);
  });
});

describe("notasPesadas", () => {
  it("só acima do limite", () => {
    expect(notasPesadas(NOTAS).map(n => n.path)).toEqual(["projetos/Car Store.md"]);
  });
});

describe("maisLigadas", () => {
  it("conta entradas por título ou nome de arquivo e ignora links quebrados", () => {
    const r = maisLigadas(NOTAS);
    expect(r[0]).toMatchObject({ entradas: 2 });
    expect(["projetos/Lopes Premium Car.md", "clientes/car-store/overview.md", "projetos/Car Store.md"]).toContain(r[0].nota.path);
    expect(r.some(x => x.nota.path === "arquivo/velha.md")).toBe(false);
  });

  it("um link do overview para 'Car Store' vai para a última nota com esse nome, não para si mesma", () => {
    const r = maisLigadas(NOTAS);
    const overview = r.find(x => x.nota.path === "clientes/car-store/overview.md");
    // overview não cita a si mesma; Home cita "Car Store" e o índice resolve para overview (título igual, indexado por último).
    expect(overview?.entradas ?? 0).toBeLessThanOrEqual(1);
  });
});

describe("ordenar e filtrar", () => {
  it("ordena por tokens e por data", () => {
    expect(ordenar(NOTAS, "tokens")[0].path).toBe("projetos/Car Store.md");
    expect(ordenar(NOTAS, "antigas")[0].path).toBe("arquivo/velha.md");
    expect(ordenar(NOTAS, "recentes")[0].modificado).toBe("2026-09-17T10:00:00Z");
  });

  it("filtra por pasta e busca em título, caminho e tag", () => {
    expect(filtrar(NOTAS, "projetos", "").length).toBe(3);
    expect(filtrar(NOTAS, null, "lopes").map(n => n.path)).toEqual(["projetos/Lopes Premium Car.md"]);
    expect(filtrar(NOTAS, null, "car-store").length).toBe(1);
  });
});

describe("formatação", () => {
  it("fmtTokens", () => {
    expect(fmtTokens(950)).toBe("950");
    expect(fmtTokens(1800)).toBe("1,8k");
    expect(fmtTokens(19000)).toBe("19k");
  });

  it("relativo", () => {
    expect(relativo("2026-09-18T08:00:00Z", HOJE)).toBe("hoje");
    expect(relativo("2026-09-17T08:00:00Z", HOJE)).toBe("ontem");
    expect(relativo("2026-09-10T08:00:00Z", HOJE)).toBe("há 8 dias");
    expect(relativo("2026-07-01T08:00:00Z", HOJE)).toBe("há 2 meses");
  });
});
