import { describe, expect, it } from "vitest";
import { adicionar, quadroVazio } from "./quadro";
import { semente } from "./semente";
import { criarNuvem, lerNuvem, salvarNuvem, type ClientePlano } from "./nuvem";

/** Supabase de mentira: uma tabela em memória com a mesma regra do trigger (versão sobe a cada update). */
function falso() {
  const linhas = new Map<string, { dados: unknown; versao: number }>();
  let falhar = "";
  const res = <T,>(data: T | null, error: { message: string; code?: string } | null = null) => Promise.resolve({ data, error });
  const cliente: ClientePlano = {
    from: () => ({
      select: () => ({ eq: (_c, owner) => ({ maybeSingle: () => (falhar ? res(null, { message: falhar }) : res(linhas.get(owner) ?? null)) }) }),
      insert: ({ owner, dados }) => ({
        select: () => ({
          single: () => {
            if (linhas.has(owner)) return res(null, { message: "duplicate key", code: "23505" });
            linhas.set(owner, { dados: structuredClone(dados), versao: 1 });
            return res({ versao: 1 });
          },
        }),
      }),
      update: ({ dados }) => ({
        eq: (_c, owner) => ({
          eq: (_v, versao) => ({
            select: () => ({
              maybeSingle: () => {
                if (falhar) return res(null, { message: falhar });
                const l = linhas.get(owner);
                if (!l || l.versao !== versao) return res(null);
                l.dados = structuredClone(dados);
                l.versao += 1;
                return res({ versao: l.versao });
              },
            }),
          }),
        }),
      }),
    }),
  };
  return { cliente, linhas, falhar: (m: string) => (falhar = m) };
}

describe("nuvem do plano", () => {
  it("vazio, cria, lê de volta", async () => {
    const f = falso();
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "vazio" });
    expect(await criarNuvem(f.cliente, "u", semente())).toEqual({ tipo: "ok", versao: 1 });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.quadro.colunas.fazer.length).toBeGreaterThan(0);
  });

  it("segundo aparelho criando ao mesmo tempo vira conflito, não sobrescreve", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", semente());
    expect(await criarNuvem(f.cliente, "u", quadroVazio())).toEqual({ tipo: "conflito" });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.quadro.colunas.fazer.length).toBeGreaterThan(0);
  });

  it("salva com a versão certa e recusa versão velha", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", quadroVazio());
    const q = adicionar(quadroVazio(), { coluna: "fazer", titulo: "Ligar para a TS" });
    expect(await salvarNuvem(f.cliente, "u", q, 1)).toEqual({ tipo: "ok", versao: 2 });
    // outro aparelho ainda na versão 1
    expect(await salvarNuvem(f.cliente, "u", quadroVazio(), 1)).toEqual({ tipo: "conflito" });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.quadro.colunas.fazer.map((c) => c.titulo)).toEqual(["Ligar para a TS"]);
  });

  it("dado inválido na nuvem não é aceito, e nada inválido sobe", async () => {
    const f = falso();
    f.linhas.set("u", { dados: { versao: 2, colunas: {} }, versao: 1 });
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "invalido" });
    const quebrado = { ...quadroVazio(), versao: 1 } as unknown as ReturnType<typeof quadroVazio>;
    expect((await salvarNuvem(f.cliente, "u", quebrado, 1)).tipo).toBe("erro");
  });

  it("erro de rede chega como erro; tabela ausente vira sem-tabela", async () => {
    const f = falso();
    f.falhar("Failed to fetch");
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "erro", mensagem: "Failed to fetch" });
    const semTabela = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: "Could not find the table", code: "PGRST205" } }) }) }) }),
    } as unknown as ClientePlano;
    expect(await lerNuvem(semTabela, "u")).toEqual({ tipo: "sem-tabela" });
  });
});
