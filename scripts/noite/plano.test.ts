import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adicionar, criarCartao, ehQuadro, quadroVazio, type Quadro } from "../../client/src/features/plano/quadro.ts";
import { atualizarPlano, aplicarPropostas, diaMaisRecenteComInsumos, ehPropostasPlano, type PropostasPlano } from "./plano.ts";
import type { ClientePlano } from "../../client/src/features/plano/nuvem.ts";

const dia = "2026-10-24";
const propostas: PropostasPlano = {
  criar: [
    { titulo: "Revisar fluxo de propostas", coluna: "fazer", projeto: "MF Services", etiquetas: ["sistema"], descricao: "Checar as evidências do dia.", evidencia: "commit abc123" },
    { titulo: "Plano já existente", coluna: "ideias", projeto: "", etiquetas: [], descricao: "", evidencia: "nota do foco" },
  ],
  concluir: [],
};

function clienteFake(inicial: { dados: Quadro; versao: number } | null, conflitos = 0) {
  let linha = inicial;
  let atualizacoes = 0;
  let insercoes = 0;
  const cliente = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: linha, error: null }) }) }),
      insert: (nova: { dados: Quadro }) => ({ select: () => ({ single: async () => {
        insercoes++;
        if (linha) return { data: null, error: { message: "duplicado", code: "23505" } };
        linha = { dados: nova.dados, versao: 1 };
        return { data: { versao: 1 }, error: null };
      } }) }),
      update: (nova: { dados: Quadro }) => ({ eq: () => ({ eq: (_campo: string, versao: number) => ({ select: () => ({ maybeSingle: async () => {
        atualizacoes++;
        if (atualizacoes <= conflitos) {
          if (linha) linha = { ...linha, versao: linha.versao + 1 };
          return { data: null, error: null };
        }
        if (!linha || linha.versao !== versao) return { data: null, error: null };
        linha = { dados: nova.dados, versao: linha.versao + 1 };
        return { data: { versao: linha.versao }, error: null };
      } }) }) }) }),
    }),
  } as unknown as ClientePlano;
  return { cliente, ler: () => linha, contagens: () => ({ atualizacoes, insercoes }) };
}

describe("atualização automática do Plano", () => {
  it("deduplica títulos sem acento em qualquer coluna e marca novas tarefas", () => {
    const quadro = adicionar(quadroVazio(), { titulo: "Plano já existente", coluna: "feito" }, "fim", dia);
    const r = aplicarPropostas(quadro, propostas, dia);
    expect(r.criados).toHaveLength(1);
    expect(r.quadro.colunas.fazer[0].descricao).toContain("Criado pela rotina da noite em 2026-10-24: commit abc123");
    expect(ehQuadro(r.quadro)).toBe(true);
  });

  it("deduplica por trecho do título ignorando caixa e acentos", () => {
    const quadro = adicionar(quadroVazio(), { titulo: "Café local no Instagram", coluna: "referencias" }, "fim", dia);
    const r = aplicarPropostas(quadro, { criar: [{ titulo: "cafe", coluna: "ideias", projeto: "", etiquetas: [], descricao: "", evidencia: "nota do dia" }], concluir: [] }, dia);
    expect(r.criados).toEqual([]);
    expect(r.quadro.colunas.ideias).toHaveLength(0);
  });

  it("conclui somente cartões em fazer ou agenda e preserva descrição manual", () => {
    let quadro = adicionar(quadroVazio(), { titulo: "Tarefa manual", coluna: "fazer", descricao: "Descrição escrita pelo Matheus." }, "fim", dia);
    const manualId = quadro.colunas.fazer[0].id;
    quadro = adicionar(quadro, { titulo: "Automática", coluna: "agenda", descricao: `Criado pela rotina da noite em ${dia}: marco do dia` }, "fim", dia);
    const autoId = quadro.colunas.agenda[0].id;
    const r = aplicarPropostas(quadro, { criar: [], concluir: [
      { id: manualId, evidencia: "commit abc123 entregou a tarefa" },
      { id: autoId, evidencia: "marco da Linha do Tempo" },
      { id: "inexistente", evidencia: "commit não corresponde a cartão" },
    ] }, dia);
    expect(r.concluidos.map((x) => x.titulo)).toEqual(["Tarefa manual", "Automática"]);
    expect(r.quadro.colunas.feito[0].descricao).toBe("Descrição escrita pelo Matheus.");
    expect(r.quadro.colunas.feito[1].descricao).toContain(`Concluído pela rotina da noite em ${dia}: marco da Linha do Tempo`);
    expect(ehQuadro(r.quadro)).toBe(true);
  });

  it("limita a oito criações e dez conclusões por rodada", () => {
    const criar = Array.from({ length: 10 }, (_, i) => ({ titulo: `Tarefa ${i}`, coluna: "ideias" as const, projeto: "", etiquetas: [], descricao: "", evidencia: "commit do dia" }));
    const r = aplicarPropostas(quadroVazio(), { criar, concluir: [] }, dia);
    expect(r.criados).toHaveLength(8);
    const q = { ...quadroVazio(), colunas: { ...quadroVazio().colunas, fazer: Array.from({ length: 12 }, (_, i) => criarCartao({ titulo: `Feita ${i}`, coluna: "fazer" }, dia)) } };
    const c = aplicarPropostas(q, { criar: [], concluir: q.colunas.fazer.map((x) => ({ id: x.id, evidencia: "commit prova entrega" })) }, dia);
    expect(c.concluidos).toHaveLength(10);
  });

  it("rejeita proposta inválida e plano resultante passa ehQuadro", () => {
    expect(ehPropostasPlano({ criar: [{ ...propostas.criar[0], data: "2026-02-30" }], concluir: [] })).toBe(false);
    expect(ehQuadro(aplicarPropostas(quadroVazio(), propostas, dia).quadro)).toBe(true);
  });

  it("no modo seco calcula sem gravar e no conflito relê e reaplica uma vez", async () => {
    const semSeco = clienteFake(null);
    const seca = await atualizarPlano(semSeco.cliente, "dono", propostas, dia, true);
    expect(seca.criados).toHaveLength(2);
    expect(semSeco.contagens()).toEqual({ atualizacoes: 0, insercoes: 0 });

    const base = adicionar(quadroVazio(), { titulo: "Plano já existente", coluna: "ideias" }, "fim", dia);
    const comConflito = clienteFake({ dados: base, versao: 4 }, 1);
    const gravado = await atualizarPlano(comConflito.cliente, "dono", propostas, dia);
    expect(gravado.gravou).toBe(true);
    expect(comConflito.contagens().atualizacoes).toBe(2);
    expect(ehQuadro(comConflito.ler()?.dados)).toBe(true);
  });

  it("abandona após o segundo conflito sem declarar gravação", async () => {
    const base = quadroVazio();
    const storage = clienteFake({ dados: base, versao: 1 }, 2);
    const resultado = await atualizarPlano(storage.cliente, "dono", propostas, dia);
    expect(resultado.gravou).toBe(false);
    expect(resultado.criados).toEqual([]);
    expect(resultado.erro).toContain("após uma nova tentativa");
  });

  it("usa a noite mais recente com insumos quando o comando manual não recebe data", () => {
    const base = mkdtempSync(join(tmpdir(), "plano-noite-"));
    try {
      for (const d of ["2026-10-22", "2026-10-24", "2026-10-25"]) mkdirSync(join(base, d));
      writeFileSync(join(base, "2026-10-22", "insumos.json"), "{}");
      writeFileSync(join(base, "2026-10-24", "insumos.json"), "{}");
      expect(diaMaisRecenteComInsumos(base, "2026-10-25")).toBe("2026-10-24");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
