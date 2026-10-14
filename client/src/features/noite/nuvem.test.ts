import { describe, expect, it } from "vitest";
import { VERSAO_RELATORIO, type Relatorio } from "@shared/noite/relatorio";
import { diaPorExtenso, lerArquivo, lerRelatorio, linkSeguro, listarDias, type ClienteNoite } from "./nuvem";

const relatorio: Relatorio = {
  versao: VERSAO_RELATORIO,
  dia: "2026-10-13",
  geradoEm: "2026-10-14T02:30:00.000Z",
  manchete: "Dia de entregas",
  resumo: ["Um tópico"],
  amanha: [{ titulo: "Mandar o link", porque: "Fecha a semana", projeto: null }],
  metricas: {
    commits: 3, repositorios: 2, arquivosAlterados: 9, linhasMais: 120, linhasMenos: 40, sessoesClaude: 2, sessoesCodex: 1,
    pedidos: 14, notasDoVault: 4, primeiraAtividade: "09:10", ultimaAtividade: "22:40", naoCommitado: 1,
  },
  porProjeto: [{ projeto: "site-exemplo", commits: 2, linhasMais: 100, linhasMenos: 30 }],
  linhaDoTempo: [{ hora: "09:10", projeto: "site-exemplo", texto: "Preços novos", tipo: "commit" }],
  projetos: [{ nome: "Site Exemplo", avancou: "Preços", status: "avancou", proximo: "Fotos" }],
  projetosNovos: [],
  dev: { momento: "Bom ritmo", praticou: ["React"], pontoForte: "Revisão", melhorar: "Testes", estudo: { tema: "Vitest", porque: "Cobrir", link: null } },
  insights: [],
  noticias: [],
  conteudo: [],
  clientes: [],
  prospeccao: [],
  fontes: { commits: 3, sessoesClaude: 2, sessoesCodex: 1, notas: 4, noticias: 0 },
  agentes: {
    codex: { ok: true, duracaoMs: 40000, modelo: null, erro: null },
    claude: { ok: true, duracaoMs: 90000, modelo: "sonnet", erro: null },
  },
};

/** Cliente falso: devolve o que cada consulta pediria ao Supabase. */
function clienteFalso(resposta: { dias?: unknown; linha?: unknown; erro?: { message: string; code?: string } }): ClienteNoite {
  const r = <T,>(data: T) => Promise.resolve({ data: resposta.erro ? null : data, error: resposta.erro ?? null });
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => r(resposta.dias as { dia: string }[]) }),
          eq: () => ({ maybeSingle: () => r(resposta.linha as { relatorio: unknown }) }),
        }),
      }),
    }),
  };
}

describe("nuvem da noite", () => {
  it("lista só dias válidos", async () => {
    const lido = await listarDias(clienteFalso({ dias: [{ dia: "2026-10-13" }, { dia: "lixo" }] }), "u");
    expect(lido).toEqual({ tipo: "ok", dias: ["2026-10-13"] });
  });

  it("reconhece a tabela que ainda não existe", async () => {
    expect(await listarDias(clienteFalso({ erro: { message: "x", code: "PGRST205" } }), "u")).toEqual({ tipo: "sem-tabela" });
    expect(await lerRelatorio(clienteFalso({ erro: { message: "x", code: "42P01" } }), "u", "2026-10-13")).toEqual({ tipo: "sem-tabela" });
  });

  it("lê um relatório válido e recusa o inválido", async () => {
    expect(await lerRelatorio(clienteFalso({ linha: { relatorio } }), "u", "2026-10-13")).toEqual({ tipo: "ok", relatorio });
    expect(await lerRelatorio(clienteFalso({ linha: { relatorio: { versao: 1 } } }), "u", "2026-10-13")).toEqual({ tipo: "invalido" });
    expect(await lerRelatorio(clienteFalso({ linha: null }), "u", "2026-10-13")).toEqual({ tipo: "vazio" });
  });

  it("abre o arquivo salvo no Mac", () => {
    expect(lerArquivo(JSON.stringify(relatorio))).toEqual(relatorio);
    expect(lerArquivo("{")).toBeNull();
    expect(lerArquivo("{}")).toBeNull();
  });

  it("só deixa passar link http(s)", () => {
    expect(linkSeguro("https://vite.dev/blog")).toBe("https://vite.dev/blog");
    expect(linkSeguro("javascript:alert(1)")).toBeNull();
    expect(linkSeguro("data:text/html,oi")).toBeNull();
    expect(linkSeguro(null)).toBeNull();
    expect(linkSeguro("não é url")).toBeNull();
  });

  it("escreve o dia por extenso sem depender do fuso", () => {
    expect(diaPorExtenso("2026-10-13")).toBe("terça, 13 de outubro");
    expect(diaPorExtenso("2026-10-12")).toBe("segunda, 12 de outubro");
  });
});
