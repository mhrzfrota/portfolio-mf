#!/usr/bin/env node
/**
 * scripts/radar/eval.ts
 *
 * Avaliação completa do Radar de Prospecção:
 * 1. Calibração da régua de pontuação contra decisões do Matheus no painel.
 * 2. Verificação do contrato da primeira mensagem por status (aprovado, enviado, reprovado, rascunho).
 * 3. Juiz LLM (claude-opus-5-5) com concordância estatística (Kappa de Cohen) contra as decisões do Matheus.
 *
 * Uso:
 *   pnpm radar:eval
 *   pnpm radar:eval -- --mensagens
 *   pnpm radar:eval -- --juiz [--limite 20] [--confirmar-custo]
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  lerLeads,
  lerEnvios,
  lerFunil,
  lerConfig,
  usarDono,
} from "./armazem.ts";
import { reprovacoes } from "../../shared/radar/aprendizado.ts";
import {
  calibracaoDaRegua,
  checarMensagem,
  concordancia,
} from "../../shared/radar/eval.ts";
import type { Lead, Envio } from "../../shared/radar/tipos.ts";

function hojeFortaleza(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function pct(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`;
}

const JuizOutputSchema = z.object({
  boa: z.boolean().describe("true se a mensagem for de boa qualidade e persuasiva no tom humano; false caso contrarie as boas práticas"),
  motivo: z.string().describe("justificativa resumida em uma ou duas frases"),
});

function montarPromptJuiz(lead: Lead, mensagem: string): string {
  const evidencias = [
    lead.oportunidade ? `Oportunidade: ${lead.oportunidade}` : "",
    lead.problemas?.length ? `Problemas: ${lead.problemas.join("; ")}` : "",
    ...Object.entries(lead.criterios || {})
      .filter(([, c]) => c.ok && c.evidencia)
      .map(([id, c]) => `${id}: ${c.evidencia}`),
  ]
    .filter(Boolean)
    .join("\n");

  return `Você é um juiz avaliador de mensagens de prospecção fria da MF Services (design e engenharia web para negócios locais e clínicas em Fortaleza).

Avalie a mensagem abaixo enviada para um lead, considerando os 4 critérios:
1. Específica e verdadeira: cita um fato concreto e verificável sobre o negócio ou presença digital do lead.
2. Dá antes de pedir: oferece valor tangível (como uma prévia ou análise) antes de pedir qualquer compromisso.
3. Tom humano: soa como uma mensagem genuína de uma pessoa real, sem jargão corporativo ou bajulação excessiva.
4. Sem promessa vaga: sem fórmulas milagrosas, promessas de faturamento ou frases genéricas de marketing.

Dados do Lead:
- Nome: ${lead.nome}
- Segmento: ${lead.segmento}
- Local: ${lead.cidade}/${lead.uf}
- Evidências observadas:
${evidencias || "Nenhuma evidência estruturada."}

Mensagem enviada:
"${mensagem}"

Retorne se a mensagem é boa (true) ou ruim (false), e o motivo objetivo.`;
}

async function main() {
  const args = process.argv.slice(2).filter(a => a !== "--");
  const { values } = parseArgs({
    args,
    options: {
      mensagens: { type: "boolean", default: false },
      juiz: { type: "boolean", default: false },
      limite: { type: "string", default: "20" },
      "confirmar-custo": { type: "boolean", default: false },
      dono: { type: "string" },
      ajuda: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.ajuda) {
    console.log(`Uso: pnpm radar:eval -- [opções]
  --mensagens         Detalha o resultado do contrato para cada mensagem
  --juiz              Executa o juiz LLM (claude-opus-5-5) nas mensagens rotuladas pelo Matheus
  --limite <N>        Limite de mensagens para o juiz (padrão: 20)
  --confirmar-custo   Confirma autorização para chamadas pagas da API Anthropic
  --dono <id>         Owner do Supabase (UUID ou e-mail)`);
    return;
  }

  if (values.dono) usarDono(values.dono);

  const hoje = hojeFortaleza();
  const linhasRelatorio: string[] = [];
  const log = (msg = "") => {
    console.log(msg);
    linhasRelatorio.push(msg);
  };

  log(`========================================================================`);
  log(`         AVALIAÇÃO DO RADAR DE PROSPECÇÃO — ${hoje}`);
  log(`========================================================================\n`);

  // 1. Carregamento de dados (somente leitura)
  const [leads, envios, funil] = await Promise.all([
    lerLeads(),
    lerEnvios(),
    lerFunil(),
  ]);

  const listaReprovados = reprovacoes(leads, funil);
  const leadsMap = new Map(leads.map(l => [l.id, l]));

  log(`Base carregada: ${leads.length} leads, ${envios.length} envios, ${listaReprovados.length} reprovações no painel.\n`);

  // 2. Calibração da Régua
  const calib = calibracaoDaRegua(leads, envios, funil, listaReprovados);

  log(`## 1. Calibração da Régua por Faixa`);
  log(`------------------------------------------------------------------------`);
  log(`Faixa   | Leads | Reprovados (%)  | Msg Aprovada (%) | Enviados | Responderam (%)`);
  log(`--------|-------|-----------------|------------------|----------|----------------`);

  for (const f of ["quente", "morno", "frio"] as const) {
    const row = calib.faixas[f];
    const aviso = row.amostraPequena ? " (n<10)" : "";
    const reprovadosStr = `${row.reprovados} (${pct(row.taxaReprovados)})`;
    const aprovadosStr = `${row.comMensagemAprovada} (${pct(row.taxaMensagemAprovada)})`;
    const respostaStr = row.enviados > 0 ? `${row.responderam} (${pct(row.taxaResposta)})` : "0 (0.0%)";
    log(`${(row.faixa + aviso).padEnd(8)}| ${String(row.total).padStart(5)} | ${reprovadosStr.padEnd(15)} | ${aprovadosStr.padEnd(16)} | ${String(row.enviados).padStart(8)} | ${respostaStr}`);
  }
  log();

  log(`## Critérios da Régua: Presença em Aprovados vs Reprovados (Lift)`);
  log(`------------------------------------------------------------------------`);
  log(`Critério             | Aprovados (%)    | Reprovados (%)   | Lift   | Amostra`);
  log(`---------------------|------------------|------------------|--------|--------`);

  for (const c of calib.criterios) {
    const txAprov = `${c.presenteAprovados}/${c.totalAprovados} (${pct(c.taxaAprovados)})`;
    const txRepr = `${c.presenteReprovados}/${c.totalReprovados} (${pct(c.taxaReprovados)})`;
    const liftStr = c.lift !== null ? `${c.lift.toFixed(2)}x` : "-";
    const avisoAmostra = c.amostraPequena ? "Pequena" : "OK";
    log(`${c.id.padEnd(20)} | ${txAprov.padEnd(16)} | ${txRepr.padEnd(16)} | ${liftStr.padEnd(6)} | ${avisoAmostra}`);
  }
  log();

  // 3. Contrato da Mensagem
  log(`## 2. Contrato da Primeira Mensagem`);
  log(`------------------------------------------------------------------------`);

  type StatStatus = { total: number; ok: number; falhas: Record<string, number> };
  const statsStatus: Record<string, StatStatus> = {};
  const falhasGerais: Record<string, number> = {};

  const resultadosMensagens: {
    envio: Envio;
    lead?: Lead;
    ok: boolean;
    falhas: string[];
  }[] = [];

  for (const envio of envios) {
    const lead = leadsMap.get(envio.leadId) ?? {
      id: envio.leadId,
      nome: envio.destino,
      segmento: "",
      cidade: "",
      uf: "",
      problemas: [],
      oportunidade: "",
      servicos: [],
      criterios: {} as any,
      pontuacao: 0,
      analisadoEm: "",
      fontes: [],
      contato: {},
      site: {},
      abordagem: { canal: envio.canal, mensagem: envio.mensagem },
    };

    const chk = checarMensagem(envio.mensagem, lead);
    resultadosMensagens.push({ envio, lead, ok: chk.ok, falhas: chk.falhas });

    if (!statsStatus[envio.status]) {
      statsStatus[envio.status] = { total: 0, ok: 0, falhas: {} };
    }
    statsStatus[envio.status].total++;
    if (chk.ok) {
      statsStatus[envio.status].ok++;
    } else {
      for (const f of chk.falhas) {
        statsStatus[envio.status].falhas[f] = (statsStatus[envio.status].falhas[f] ?? 0) + 1;
        falhasGerais[f] = (falhasGerais[f] ?? 0) + 1;
      }
    }
  }

  log(`Status       | Total | Cumprem Contrato | Taxa Conformidade`);
  log(`-------------|-------|------------------|------------------`);
  for (const [status, st] of Object.entries(statsStatus)) {
    const taxa = st.total > 0 ? st.ok / st.total : 0;
    log(`${status.padEnd(12)} | ${String(st.total).padStart(5)} | ${String(st.ok).padStart(16)} | ${pct(taxa)}`);
  }
  log();

  log(`Principais falhas encontradas nas mensagens:`);
  const topFalhas = Object.entries(falhasGerais).sort((a, b) => b[1] - a[1]);
  if (topFalhas.length === 0) {
    log(`  Nenhuma falha de contrato detectada! Todas as mensagens cumprem o contrato.`);
  } else {
    for (const [falha, count] of topFalhas) {
      log(`  - [${count}x] ${falha}`);
    }
  }
  log();

  if (values.mensagens) {
    log(`### Detalhamento por Mensagem:`);
    for (const r of resultadosMensagens) {
      log(`- [${r.envio.status.toUpperCase()}] ${r.envio.id} (${r.lead?.nome || r.envio.destino})`);
      log(`  "${r.envio.mensagem.replace(/\n/g, " ")}"`);
      if (r.ok) {
        log(`  ✓ Conforme o contrato`);
      } else {
        log(`  ✗ Falhas: ${r.falhas.join("; ")}`);
      }
    }
    log();
  }

  // 4. Juiz LLM (claude-opus-5-5)
  if (values.juiz) {
    log(`## 3. Juiz LLM (Claude Opus 5.5)`);
    log(`------------------------------------------------------------------------`);

    // Filtra mensagens com rótulo do Matheus:
    // aprovada/enviada = boa (true); reprovada = ruim (false)
    const mensagensRotuladas = resultadosMensagens.filter(
      r => r.envio.status === "aprovado" || r.envio.status === "enviado" || r.envio.status === "reprovado"
    );

    const limite = Math.max(1, parseInt(values.limite, 10) || 20);
    const paraJulgar = mensagensRotuladas.slice(0, limite);

    log(`Total de mensagens rotuladas pelo Matheus: ${mensagensRotuladas.length}`);
    log(`Mensagens selecionadas para avaliação: ${paraJulgar.length} (limite: ${limite})\n`);

    // Estimativa de tokens e custo
    let totalCharsEntrada = 0;
    for (const item of paraJulgar) {
      const prompt = montarPromptJuiz(item.lead!, item.envio.mensagem);
      totalCharsEntrada += prompt.length;
    }
    const tokensEntradaEstimados = Math.ceil(totalCharsEntrada / 4);
    const tokensSaidaEstimados = paraJulgar.length * 100;

    // US$ 4 / 1M entrada, US$ 20 / 1M saída
    const custoEntradaUSD = (tokensEntradaEstimados / 1_000_000) * 4.0;
    const custoSaidaUSD = (tokensSaidaEstimados / 1_000_000) * 20.0;
    const custoTotalUSD = custoEntradaUSD + custoSaidaUSD;

    log(`Estimativa de Custo da Avaliação com Juiz LLM:`);
    log(`  - Modelo: claude-opus-5-5 (low effort)`);
    log(`  - Mensagens: ${paraJulgar.length}`);
    log(`  - Tokens de entrada estimados: ~${tokensEntradaEstimados.toLocaleString()} ($4.00 / M)`);
    log(`  - Tokens de saída estimados: ~${tokensSaidaEstimados.toLocaleString()} ($20.00 / M)`);
    log(`  - Custo total estimado: $${custoTotalUSD.toFixed(4)} USD\n`);

    if (!values["confirmar-custo"]) {
      log(`[AVISO DE SEGURANÇA] Flag --confirmar-custo não foi fornecida.`);
      log(`As chamadas pagas da API Anthropic não foram executadas.`);
      log(`Para rodar o juiz LLM e calcular o Kappa de Cohen contra o Matheus, execute:`);
      log(`  pnpm radar:eval -- --juiz --limite ${limite} --confirmar-custo\n`);
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
      if (!apiKey) {
        log(`[ERRO] ANTHROPIC_API_KEY não encontrada em .env.local ou variáveis de ambiente.`);
        log(`Configure a chave e tente novamente.\n`);
      } else {
        log(`Iniciando julgamento com claude-opus-5-5...`);
        const client = new Anthropic({ apiKey });

        const rotulosHumanos: boolean[] = [];
        const rotulosJuiz: boolean[] = [];
        const divergencias: {
          id: string;
          lead: string;
          humano: boolean;
          juiz: boolean;
          motivoJuiz: string;
          mensagem: string;
        }[] = [];

        for (let idx = 0; idx < paraJulgar.length; idx++) {
          const item = paraJulgar[idx];
          const rotuloHumano = item.envio.status === "aprovado" || item.envio.status === "enviado";
          rotulosHumanos.push(rotuloHumano);

          try {
            const prompt = montarPromptJuiz(item.lead!, item.envio.mensagem);
            const resposta = await client.messages.parse({
              model: "claude-opus-5-5",
              max_tokens: 300,
              output_config: {
                format: zodOutputFormat(JuizOutputSchema),
                effort: "low",
              },
              messages: [{ role: "user", content: prompt }],
            });

            const parsed = resposta.parsed_output;
            if (!parsed) throw new Error("Resposta não pôde ser parseada pelo schema.");

            rotulosJuiz.push(parsed.boa);

            if (parsed.boa !== rotuloHumano) {
              divergencias.push({
                id: item.envio.id,
                lead: item.lead?.nome || item.envio.destino,
                humano: rotuloHumano,
                juiz: parsed.boa,
                motivoJuiz: parsed.motivo,
                mensagem: item.envio.mensagem,
              });
            }

            process.stdout.write(`  [${idx + 1}/${paraJulgar.length}] ${item.envio.id}: Matheus=${rotuloHumano ? "BOA" : "RUIM"}, Juiz=${parsed.boa ? "BOA" : "RUIM"}\n`);
          } catch (err: any) {
            log(`  [FALHA] ${item.envio.id}: ${err?.message || String(err)}`);
            // Em caso de erro na chamada, assume false para manter integridade
            rotulosJuiz.push(false);
          }
        }

        const concord = concordancia(rotulosHumanos, rotulosJuiz);
        log(`\n### Concordância Estatística (Juiz × Matheus)`);
        log(`------------------------------------------------------------------------`);
        log(`- Total avaliado: ${concord.n}`);
        log(`- Acurácia: ${pct(concord.acuracia)}`);
        log(`- Concordância Observada (Po): ${concord.po.toFixed(4)}`);
        log(`- Concordância Esperada por Acaso (Pe): ${concord.pe.toFixed(4)}`);
        log(`- Kappa de Cohen (κ): ${concord.kappa.toFixed(4)}`);
        log(`- Matriz de Contingência 2×2:`);
        log(`                  Juiz: BOA (Positivo) | Juiz: RUIM (Negativo)`);
        log(`  Matheus: BOA  | VP = ${String(concord.matriz.vp).padEnd(16)} | FN = ${concord.matriz.fn}`);
        log(`  Matheus: RUIM | FP = ${String(concord.matriz.fp).padEnd(16)} | VN = ${concord.matriz.vn}`);
        log();

        if (divergencias.length > 0) {
          log(`### Divergências (${divergencias.length}):`);
          for (const d of divergencias) {
            log(`- Lead: ${d.lead} (${d.id})`);
            log(`  Matheus: ${d.humano ? "Aprovou (BOA)" : "Reprovou (RUIM)"} | Juiz: ${d.juiz ? "BOA" : "RUIM"}`);
            log(`  Motivo do Juiz: ${d.motivoJuiz}`);
            log(`  Mensagem: "${d.mensagem.replace(/\n/g, " ")}"`);
          }
          log();
        }
      }
    }
  }

  // 5. Salvar relatório em tmp/eval-radar-AAAA-MM-DD.md
  await mkdir("tmp", { recursive: true });
  const caminhoRelatorio = resolve("tmp", `eval-radar-${hoje}.md`);
  await writeFile(caminhoRelatorio, linhasRelatorio.join("\n"), "utf8");
  console.log(`Relatório salvo em: ${caminhoRelatorio}`);
}

main().catch(err => {
  console.error("Erro na execução da avaliação do Radar:", err);
  process.exit(1);
});
