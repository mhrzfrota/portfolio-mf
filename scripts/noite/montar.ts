import {
  ehRelatorio,
  semTravessao,
  VERSAO_RELATORIO,
  type Relatorio,
  type Momento,
} from "../../shared/noite/relatorio.ts";
import type { Insumos } from "./coletor.ts";
import type { SaidaCodex } from "./etapa-codex.ts";
import type { SaidaClaude } from "./etapa-claude.ts";
import { erroEsquema, esquemaClaude } from "./validacao.ts";
export function montarRelatorio(op: {
  dia: string;
  geradoEm: string;
  insumos: Insumos;
  codex: SaidaCodex | null;
  claude: SaidaClaude | null;
  agentes: Relatorio["agentes"];
}): Relatorio {
  const { insumos: i } = op;
  const m = i.metricas;
  const minimo: SaidaClaude = {
    manchete: m.commits
      ? `Dia com ${m.commits} commits em ${m.repositorios} projetos`
      : "Dia sem commits",
    resumo: [
      `${m.commits} commits e ${m.arquivosAlterados} arquivos alterados.`,
      `${m.pedidos} pedidos em ${m.sessoesClaude + m.sessoesCodex} sessões; ${m.notasDoVault} notas do vault.`,
      "Síntese do Claude indisponível; resumo baseado nos fatos coletados.",
    ],
    amanha: [],
    linhaDoTempo: i.eventos
      .filter((e): e is typeof e & { hora: string } => e.hora !== null)
      .slice(0, 12)
      .map(({ ms: _, ...e }) => e as Momento),
    projetos: i.porProjeto.map(p => ({
      nome: p.projeto,
      avancou: `${p.commits} commits`,
      status: "avancou",
      proximo: "Ver no vault",
    })),
    projetosNovos: [],
    dev: {
      momento: "Atividade registrada pelo coletor.",
      praticou: [],
      pontoForte: "Sem avaliação automática nesta execução.",
      melhorar: "Revisar as pendências registradas.",
      estudo: {
        tema: "Revisão do trabalho do dia",
        porque: "A síntese técnica não está disponível.",
        link: null,
      },
    },
    insights: [],
    noticias: op.codex?.noticias ?? [],
    conteudo: [],
    clientes: [],
    prospeccao: [],
  };
  const r = semTravessao({
    ...(op.claude ?? minimo),
    versao: VERSAO_RELATORIO,
    dia: op.dia,
    geradoEm: op.geradoEm,
    metricas: m,
    porProjeto: i.porProjeto,
    fontes: {
      ...i.fontes,
      noticias: (op.claude?.noticias ?? op.codex?.noticias ?? []).length,
    },
    agentes: op.agentes,
  });
  if (!ehRelatorio(r)) {
    const texto = Object.fromEntries(
      Object.keys(esquemaClaude.properties!).map(k => [
        k,
        r[k as keyof typeof r],
      ])
    );
    const erroTexto = erroEsquema(texto, esquemaClaude, "relatorio");
    if (erroTexto) throw new Error(`Relatório inválido: ${erroTexto}`);
    // O contrato expõe somente um booleano. Isolar cada campo contra um exemplar válido.
    const base = {
      ...minimo,
      versao: 1,
      dia: "2026-01-01",
      geradoEm: new Date(0).toISOString(),
      metricas: {
        commits: 0,
        repositorios: 0,
        arquivosAlterados: 0,
        linhasMais: 0,
        linhasMenos: 0,
        sessoesClaude: 0,
        sessoesCodex: 0,
        pedidos: 0,
        notasDoVault: 0,
        primeiraAtividade: null,
        ultimaAtividade: null,
        naoCommitado: 0,
      },
      porProjeto: [],
      linhaDoTempo: [],
      projetos: [],
      noticias: [],
      fontes: {
        commits: 0,
        sessoesClaude: 0,
        sessoesCodex: 0,
        notas: 0,
        noticias: 0,
      },
      agentes: {
        codex: { ok: false, duracaoMs: 0, modelo: null, erro: null },
        claude: { ok: false, duracaoMs: 0, modelo: null, erro: null },
      },
    };
    for (const [k, v] of Object.entries(r))
      if (!ehRelatorio({ ...base, [k]: v }))
        throw new Error(`Relatório inválido: ${k}`);
    throw new Error("Relatório inválido: estrutura");
  }
  return r;
}
