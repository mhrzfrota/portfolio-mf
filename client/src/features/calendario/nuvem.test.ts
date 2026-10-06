import { describe, expect, it } from "vitest";
import { agendaVazia, criarEvento, sementeAgenda } from "./agenda";
import { criarNuvem, lerNuvem, salvarNuvem, type ClienteCalendario } from "./nuvem";

/** Supabase de mentira: uma tabela em memória com a mesma regra do trigger (versão sobe a cada update). */
function falso() {
  const linhas = new Map<string, { dados: unknown; versao: number }>();
  let falhar = "";
  const res = <T,>(data: T | null, error: { message: string; code?: string } | null = null) => Promise.resolve({ data, error });
  const cliente: ClienteCalendario = {
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

describe("nuvem do calendário", () => {
  it("vazio, cria, lê de volta", async () => {
    const f = falso();
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "vazio" });
    expect(await criarNuvem(f.cliente, "u", sementeAgenda())).toEqual({ tipo: "ok", versao: 1 });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.agenda.calendarios.length).toBeGreaterThan(1);
  });

  it("segundo aparelho criando ao mesmo tempo vira conflito, não sobrescreve", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", sementeAgenda());
    expect(await criarNuvem(f.cliente, "u", agendaVazia())).toEqual({ tipo: "conflito" });
    expect((f.linhas.get("u")!.dados as { calendarios: unknown[] }).calendarios.length).toBeGreaterThan(1);
  });

  it("salva com a versão certa e recusa versão velha", async () => {
    const f = falso();
    await criarNuvem(f.cliente, "u", agendaVazia());
    const a = criarEvento(agendaVazia(), { titulo: "Reunião", data: "2026-10-10" });
    expect(await salvarNuvem(f.cliente, "u", a, 1)).toEqual({ tipo: "ok", versao: 2 });
    // outro aparelho ainda na versão 1
    expect(await salvarNuvem(f.cliente, "u", agendaVazia(), 1)).toEqual({ tipo: "conflito" });
    const r = await lerNuvem(f.cliente, "u");
    expect(r.tipo === "ok" && r.agenda.eventos.map((e) => e.titulo)).toEqual(["Reunião"]);
  });

  it("dado inválido na nuvem não é aceito, e nada inválido sobe", async () => {
    const f = falso();
    f.linhas.set("u", { dados: { versao: 1, calendarios: [], eventos: [] }, versao: 1 });
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "invalido" });
    const quebrada = { ...agendaVazia(), calendarios: [] };
    expect((await salvarNuvem(f.cliente, "u", quebrada, 1)).tipo).toBe("erro");
  });

  it("erro de rede chega como erro", async () => {
    const f = falso();
    f.falhar("Failed to fetch");
    expect(await lerNuvem(f.cliente, "u")).toEqual({ tipo: "erro", mensagem: "Failed to fetch" });
  });
});

describe("tabela ainda não criada", () => {
  it("vira sem-tabela, não erro", async () => {
    const cliente = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: "Could not find the table", code: "PGRST205" } }) }) }) }),
    } as unknown as ClienteCalendario;
    expect(await lerNuvem(cliente, "u")).toEqual({ tipo: "sem-tabela" });
  });
});
