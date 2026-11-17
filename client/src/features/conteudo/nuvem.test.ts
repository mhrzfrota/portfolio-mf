import { describe, expect, it, vi } from "vitest";
import { adicionar, estudioVazio } from "./estudio";
import { criarNuvem, lerNuvem, salvarNuvem, type ClienteConteudo } from "./nuvem";

/** Supabase de mentira: uma tabela em memória com a mesma regra do trigger (versão sobe a cada update). */
function falso() {
  const linhas = new Map<string, { dados: unknown; versao: number }>();
  let falhar = "";
  const res = <T,>(data: T | null, error: { message: string; code?: string } | null = null) => Promise.resolve({ data, error });
  const cliente: ClienteConteudo = {
    from: (tabela) => {
      expect(tabela).toBe("conteudo");
      return ({
      select: () => ({ eq: (_c, owner) => ({ maybeSingle: () => (falhar ? res(null, { message: falhar }) : res(linhas.get(owner) ?? null)) }) }),
      insert: ({ owner, dados }) => ({
        select: () => ({
          single: () => {
            if (falhar) return res(null, { message: falhar });
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
      });
    },
  };
  return { cliente, linhas, falhar: (m: string) => (falhar = m) };
}

describe("nuvem do conteúdo", () => {
  it("vazio, cria, lê de volta", async () => {
    const f = falso();
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "vazio" });
    expect(await criarNuvem(f.cliente, "u", adicionar(estudioVazio(), { etapa: "roteiro", titulo: "Teste" }))).toEqual({ tipo: "ok", versao: 1 });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.estudio.pecas.roteiro.map((p) => p.titulo)).toEqual(["Teste"]);
  });

  it("segundo aparelho criando ao mesmo tempo vira conflito, não sobrescreve", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", adicionar(estudioVazio(), { etapa: "roteiro", titulo: "Teste" }));
    expect(await criarNuvem(f.cliente, "u", estudioVazio())).toEqual({ tipo: "conflito" });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.estudio.pecas.roteiro.map((p) => p.titulo)).toEqual(["Teste"]);
  });

  it("salva com a versão certa e recusa versão velha", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", estudioVazio());
    const q = adicionar(estudioVazio(), { etapa: "roteiro", titulo: "Ligar para a TS" });
    expect(await salvarNuvem(f.cliente, "u", q, 1)).toEqual({ tipo: "ok", versao: 2 });
    // outro aparelho ainda na versão 1
    expect(await salvarNuvem(f.cliente, "u", estudioVazio(), 1)).toEqual({ tipo: "conflito" });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.estudio.pecas.roteiro.map((c) => c.titulo)).toEqual(["Ligar para a TS"]);
  });

  it("dado inválido na nuvem não é aceito, e nada inválido sobe", async () => {
    const f = falso();
    f.linhas.set("u", { dados: { versao: 1, pecas: {} }, versao: 1 });
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "invalido" });
    const quebrado = { ...estudioVazio(), versao: 2 } as unknown as ReturnType<typeof estudioVazio>;
    expect((await salvarNuvem(f.cliente, "u", quebrado, 1)).tipo).toBe("erro");
    expect((await criarNuvem(f.cliente, "v", quebrado)).tipo).toBe("erro");
    expect(f.linhas.has("v")).toBe(false);
  });

  it("erro de rede chega como erro; tabela ausente vira sem-tabela", async () => {
    const f = falso();
    f.falhar("Failed to fetch");
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "erro", mensagem: "Failed to fetch" });
    const semTabela = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: "Could not find the table", code: "PGRST205" } }) }) }) }),
    } as unknown as ClienteConteudo;
    expect(await lerNuvem(semTabela, "u")).toEqual({ tipo: "sem-tabela" });
  });

  it.each(["PGRST205", "42P01"])("reconhece ausência de tabela: %s", async (code) => {
    const cliente = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: "Tabela ausente", code } }) }) }) }),
    } as unknown as ClienteConteudo;
    expect(await lerNuvem(cliente, "u")).toEqual({ tipo: "sem-tabela" });
  });

  it("isola os usuários, e versão ausente ou velha não cria linha por update", async () => {
    const f = falso(), e = adicionar(estudioVazio(), { etapa: "pronto", titulo: "Teste" });
    await criarNuvem(f.cliente, "u", e);
    expect(await lerNuvem(f.cliente, "v")).toEqual({ tipo: "vazio" });
    expect(await salvarNuvem(f.cliente, "v", e, 1)).toEqual({ tipo: "conflito" });
    expect(f.linhas.has("v")).toBe(false);
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.versao).toBe(1);
  });

  it("propaga erros de criação/atualização e não altera o registro confirmado", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", estudioVazio());
    f.falhar("Sem conexão");
    expect(await criarNuvem(f.cliente, "v", estudioVazio())).toEqual({ tipo: "erro", mensagem: "Sem conexão" });
    expect(await salvarNuvem(f.cliente, "u", estudioVazio(), 1)).toEqual({ tipo: "erro", mensagem: "Sem conexão" });
    expect(f.linhas.get("u")?.versao).toBe(1);
  });

  it("não chama a rede para dados inválidos e trata insert sem resposta", async () => {
    const from = vi.fn();
    const cliente = { from } as unknown as ClienteConteudo;
    expect((await criarNuvem(cliente, "u", {} as never)).tipo).toBe("erro");
    expect((await salvarNuvem(cliente, "u", {} as never, 1)).tipo).toBe("erro");
    expect(from).not.toHaveBeenCalled();
    const semResposta = { from: () => ({ insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) } as unknown as ClienteConteudo;
    expect(await criarNuvem(semResposta, "u", estudioVazio())).toEqual({ tipo: "erro", mensagem: "Sem resposta do servidor." });
  });
});
