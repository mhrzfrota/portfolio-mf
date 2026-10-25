import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { aplicarAcao, esperaSorteada, podeEnviarAgora, proximoDaFila, resumoDoDia, STATUS_ENVIOS } from "../../shared/radar/envio.ts";
import type { AcaoEnvio } from "../../shared/radar/envio.ts";
import { ETAPAS } from "../../shared/radar/funil.ts";
import type { Etapa } from "../../shared/radar/funil.ts";
import type { TipoEnvio } from "../../shared/radar/tipos.ts";
import { alterarEstado, comTrava, lerEstado } from "./armazem.ts";

function ajuda(): void {
  console.log(`Uso: pnpm radar:envio -- <comando> [opções]
  status [--json] | fila [--status <status>] | proximo [--json]
  rascunho <leadId> [--tipo primeira|followup] [--mensagem "..."]
  rascunhos-quentes [--min N] [--limite N]
  editar <envioId> --mensagem "..."
  aprovar <envioId> | reprovar <envioId> [--motivo "..."] | cancelar <envioId>
  marcar-enviando <envioId> [--confirmada "<texto confirmado>" --destino <usuario>] | marcar-enviado <envioId>
  marcar-falhou <envioId> --erro "..."
  resposta <leadId> [--anotacao "..."]
  etapa <leadId> <etapa> [--anotacao "..."]
  followups | bloquear <instagram> --motivo "..." | pausar | retomar`);
}

export async function executarEnvio(entrada: string[], relogio: () => Date = () => new Date()): Promise<void> {
  // O pnpm repassa o "--" de `pnpm radar:envio -- fila ...`; sem isto, tudo depois dele vira argumento solto.
  const args = entrada[0] === "--" ? entrada.slice(1) : entrada;
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    json: { type: "boolean" }, status: { type: "string" }, tipo: { type: "string" }, mensagem: { type: "string" }, confirmada: { type: "string" }, destino: { type: "string" },
    min: { type: "string" }, limite: { type: "string" }, motivo: { type: "string" }, erro: { type: "string" },
    anotacao: { type: "string" }, help: { type: "boolean", short: "h" },
  } });
  const [comando, ...argumentos] = positionals;
  if (!comando || values.help) { ajuda(); return; }
  const quantidade = (total: number) => { if (argumentos.length !== total) throw new Error(`${comando}: esperado(s) ${total} argumento(s)`); };
  const obrigatorio = (valor: string | undefined, campo: string): string => {
    if (valor === undefined) throw new Error(`${campo}: opção obrigatória`);
    return valor;
  };
  const numero = (valor: string | undefined, campo: string): number | undefined => {
    if (valor === undefined) return undefined;
    if (!valor.trim() || !Number.isFinite(Number(valor))) throw new Error(`${campo}: informe um número válido`);
    return Number(valor);
  };
  if (["status", "fila", "proximo"].includes(comando)) {
    quantidade(0);
    await comTrava(async () => {
      const estado = await lerEstado();
      const agora = relogio();
      if (comando === "status") {
        const resumo = resumoDoDia(estado, agora);
        if (values.json) console.log(JSON.stringify(resumo, null, 2));
        else console.log(`Enviados hoje: ${resumo.enviadosHoje}/${resumo.limite}\nAprovados: ${resumo.aprovados}\nRascunhos: ${resumo.rascunhos}\nPausado: ${resumo.pausado ? "sim" : "não"}\nPode enviar: ${resumo.pode.ok ? "sim" : `${resumo.pode.motivo}${resumo.pode.proximoEm ? `; próximo em ${resumo.pode.proximoEm}` : ""}`}`);
      } else if (comando === "fila") {
        if (values.status && !STATUS_ENVIOS.includes(values.status as typeof STATUS_ENVIOS[number])) throw new Error("status: valor inválido");
        const leads = new Map(estado.leads.map((lead) => [lead.id, lead]));
        const lista = estado.envios.filter((e) => !values.status || e.status === values.status).sort((a, b) => (leads.get(b.leadId)?.pontuacao ?? 0) - (leads.get(a.leadId)?.pontuacao ?? 0));
        // --json traz a mensagem inteira: é o que o /enviar mostra ao Matheus para confirmar o lote.
        if (values.json) {
          console.log(JSON.stringify(lista.map((envio) => {
            const lead = leads.get(envio.leadId);
            return { id: envio.id, destino: envio.destino, tipo: envio.tipo, status: envio.status, mensagem: envio.mensagem, lead: { id: envio.leadId, nome: lead?.nome, pontuacao: lead?.pontuacao } };
          }), null, 2));
          return;
        }
        console.log("Nota | Nome | Instagram | Tipo | Status | Mensagem (começo; use --json para o texto inteiro)");
        for (const envio of lista) {
          const lead = leads.get(envio.leadId);
          console.log(`${lead?.pontuacao ?? "?"} | ${lead?.nome ?? envio.leadId} | @${envio.destino} | ${envio.tipo} | ${envio.status} | ${envio.mensagem.replace(/\s+/g, " ").slice(0, 80)}`);
        }
      } else {
        const pode = podeEnviarAgora(estado.config, estado.envios, agora);
        const envio = proximoDaFila(estado, agora);
        const lead = envio ? estado.leads.find((l) => l.id === envio.leadId) : undefined;
        const resultado = { pode, ...(envio ? { envio } : {}), ...(lead ? { lead: { id: lead.id, nome: lead.nome, instagram: lead.instagram, pontuacao: lead.pontuacao } } : {}), esperaSeg: esperaSorteada(estado.config) };
        if (values.json) console.log(JSON.stringify(resultado, null, 2));
        else console.log(`${!pode.ok ? `Envio não permitido: ${pode.motivo}${pode.proximoEm ? `; próximo em ${pode.proximoEm}` : ""}` : envio ? `${envio.id}: @${envio.destino}\n${envio.mensagem}` : "Nenhum envio disponível"}\nEspera sorteada: ${resultado.esperaSeg} s`);
      }
    });
    return;
  }
  let acao: AcaoEnvio;
  if (comando === "rascunho") {
    quantidade(1);
    if (values.tipo !== undefined && !["primeira", "followup"].includes(values.tipo)) throw new Error("tipo: use primeira ou followup");
    acao = { acao: comando, leadId: argumentos[0], tipo: values.tipo as TipoEnvio | undefined, mensagem: values.mensagem };
  } else if (comando === "rascunhos-quentes") {
    quantidade(0);
    acao = { acao: comando, min: numero(values.min, "min"), limite: numero(values.limite, "limite") };
  } else if (comando === "editar") {
    quantidade(1);
    acao = { acao: comando, id: argumentos[0], mensagem: obrigatorio(values.mensagem, "mensagem") };
  } else if (comando === "aprovar" || comando === "reprovar" || comando === "cancelar" || comando === "marcar-enviando" || comando === "marcar-enviado" || comando === "marcar-falhou") {
    quantidade(1);
    if (comando === "marcar-falhou") obrigatorio(values.erro, "erro");
    acao = { acao: comando, id: argumentos[0], motivo: values.motivo, erro: values.erro, confirmada: values.confirmada, destino: values.destino };
  } else if (comando === "resposta" || comando === "etapa") {
    quantidade(comando === "resposta" ? 1 : 2);
    if (comando === "etapa" && !Object.hasOwn(ETAPAS, argumentos[1])) throw new Error(`Etapa inválida: ${argumentos[1]}`);
    acao = { acao: comando, leadId: argumentos[0], etapa: argumentos[1] as Etapa | undefined, anotacao: values.anotacao };
  } else if (comando === "followups") { quantidade(0); acao = { acao: comando }; }
  else if (comando === "bloquear") { quantidade(1); acao = { acao: comando, instagram: argumentos[0], motivo: obrigatorio(values.motivo, "motivo") }; }
  else if (comando === "pausar" || comando === "retomar") { quantidade(0); acao = { acao: "pausa", pausado: comando === "pausar" }; }
  else { ajuda(); throw new Error(`Comando desconhecido: ${comando}`); }
  let avisos: string[] = [];
  await alterarEstado((estado) => {
    const resultado = aplicarAcao(estado, acao, relogio());
    avisos = resultado.avisos;
    return resultado.estado;
  });
  avisos.forEach((aviso) => console.error(`Aviso: ${aviso}`));
  console.log(`✓ ${comando}${argumentos.length ? `: ${argumentos.join(" ")}` : ""}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  executarEnvio(process.argv.slice(2)).catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exitCode = 1;
  });
}
