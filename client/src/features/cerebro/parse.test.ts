import { describe, expect, it } from "vitest";
import {
  estimarTokens,
  extrairFoco,
  extrairLinks,
  extrairTitulo,
  parseNota,
  parseYamlSimples,
  resumir,
  separarFrontmatter,
} from "@shared/cerebro/parse";

const NOTA = `---
tags: [projeto, cliente, site]
cliente: Car Store
repo: ~/Desktop/projects/carstore
inicio: 2026-09-08
status: ativo, site pronto
empresa: "[[Villa's Comunicação Visual]]"
---

# Car Store

Site institucional com vitrine para a **Car Store**, base no site da [[Sistema LV]].

## Conexões
- [[Lopes Premium Car|Lopes]] e [[Sistema LV#Site público]]
`;

describe("separarFrontmatter", () => {
  it("separa o bloco --- do corpo", () => {
    const { yaml, corpo } = separarFrontmatter(NOTA);
    expect(yaml).toContain("cliente: Car Store");
    expect(corpo.startsWith("\n# Car Store")).toBe(true);
  });

  it("sem bloco devolve tudo como corpo", () => {
    expect(separarFrontmatter("# Só título")).toEqual({ yaml: "", corpo: "# Só título" });
  });
});

describe("parseYamlSimples", () => {
  it("lê escalares, arrays inline e aspas", () => {
    const fm = parseYamlSimples(separarFrontmatter(NOTA).yaml);
    expect(fm.tags).toEqual(["projeto", "cliente", "site"]);
    expect(fm.cliente).toBe("Car Store");
    expect(fm.status).toBe("ativo, site pronto");
    expect(fm.empresa).toBe("[[Villa's Comunicação Visual]]");
  });

  it("lê lista em bloco", () => {
    expect(parseYamlSimples("tags:\n  - moc\n  - vault\natualizado: 2026-08-28")).toEqual({
      tags: ["moc", "vault"],
      atualizado: "2026-08-28",
    });
  });
});

describe("extrairTitulo", () => {
  it("usa o primeiro H1 e tira emoji da frente", () => {
    expect(extrairTitulo("# 🧠 Segundo Cérebro", "Home.md")).toBe("Segundo Cérebro");
  });

  it("cai no nome do arquivo sem extensão", () => {
    expect(extrairTitulo("texto sem título", "Davi (Villa's).md")).toBe("Davi (Villa's)");
  });
});

describe("extrairLinks", () => {
  it("tira alias e seção, sem repetir", () => {
    expect(extrairLinks(separarFrontmatter(NOTA).corpo)).toEqual(["Sistema LV", "Lopes Premium Car"]);
  });
});

describe("resumir", () => {
  it("pega o primeiro parágrafo corrido, limpo de markdown", () => {
    expect(resumir(separarFrontmatter(NOTA).corpo)).toBe(
      "Site institucional com vitrine para a Car Store, base no site da Sistema LV."
    );
  });

  it("corta no limite com reticência", () => {
    expect(resumir("a".repeat(300), 20)).toBe("a".repeat(19) + "…");
  });
});

describe("parseNota", () => {
  it("monta a nota completa", () => {
    const n = parseNota(NOTA, "Car Store.md");
    expect(n.titulo).toBe("Car Store");
    expect(n.status).toBe("ativo, site pronto");
    expect(n.tags).toEqual(["projeto", "cliente", "site"]);
    expect(n.palavras).toBeGreaterThan(10);
    expect(n.tokens).toBe(estimarTokens(NOTA));
  });
});

describe("extrairFoco", () => {
  const md = `## 5. Regras
- x

## 6. Foco da semana
> Atualizar toda segunda. Pesa todas as ações do sistema.

**Semana de:** 2026-09-14 *(revisado em 18/09)*

**Prioridade 1:** fechar o preço.
`;
  it("acha a seção e a data", () => {
    const f = extrairFoco(md);
    expect(f?.semana).toBe("2026-09-14");
    expect(f?.texto.startsWith("**Semana de:**")).toBe(true);
    expect(f?.texto).toContain("Prioridade 1");
  });

  it("devolve null sem a seção", () => {
    expect(extrairFoco("# nada")).toBeNull();
  });
});
