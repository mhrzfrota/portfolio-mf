import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { CRITERIOS, DIAS_ATIVO, FAIXAS, PONTOS_SITE, SERVICOS, faixaDa } from "../../shared/radar/criterios.ts";
import { detalharPontuacao } from "../../shared/radar/pontuacao.ts";
import { acharDuplicado, buscarTermo } from "../../shared/radar/dedup.ts";
import type { Duplicado } from "../../shared/radar/dedup.ts";
import { normalizarInstagram } from "../../shared/radar/normalizar.ts";
import { dataValida, validarDescartado, validarLead } from "../../shared/radar/validar.ts";
import type { Descartado, Lead } from "../../shared/radar/tipos.ts";
import { comTrava, lerDescartados, lerLeads, salvarDescartados, salvarLeads, removerLead } from "./armazem.ts";

function hojeFortaleza(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function ajuda(): void {
  console.log(`Uso: node scripts/lead.ts <comando> [opções]
  criterios
  existe <termo> [termo...]
  adicionar <arquivo.json> [--hoje AAAA-MM-DD]
  atualizar <arquivo.json> [--hoje AAAA-MM-DD]
  descartar --instagram x --motivo "..." [--nome x --cidade x --uf CE --site URL --telefone x]
  remover <id> --motivo "..."
  listar [--uf CE] [--min 70]
  validar`);
}

function imprimirCriterios(): void {
  console.log("# Régua de prospecção\n");
  console.log(`Só entra lead com post nos últimos ${DIAS_ATIVO} dias na data da análise. Fora disso, use pnpm radar:lead -- descartar.\n`);
  console.log("Cada critério exige ok booleano e evidência, inclusive quando não pontua. Para pontuar, exige também fonte http(s).\n");
  for (const criterio of CRITERIOS) console.log(`## ${criterio.id}: ${criterio.nome} (até ${criterio.pontos} pontos)\n${criterio.regra}\n`);
  console.log("## Presença na web\n");
  for (const [nivel, pontos] of Object.entries(PONTOS_SITE)) console.log(`- ${nivel}: ${pontos} pontos`);
  console.log("\n## Faixas\n");
  for (const { nome, minimo } of Object.values(FAIXAS)) console.log(`- ${nome}: a partir de ${minimo}/100`);
  console.log("\n## Serviços\n");
  for (const [id, nome] of Object.entries(SERVICOS)) console.log(`- ${id}: ${nome}`);
}

function mensagemDuplicado(caso: Duplicado & { motivo?: string }, descartados: Descartado[] = []): string {
  const motivo = caso.motivo ?? descartados.find((d) => d.instagram === caso.id)?.motivo;
  return caso.onde === "lead" ? `já existe: lead ${caso.id} (${caso.chave})` : `já descartado: ${caso.id} (${motivo})`;
}

function imprimirLead(lead: Lead): void {
  console.log(`✓ ${lead.id}: ${lead.pontuacao}/100 (${FAIXAS[faixaDa(lead.pontuacao)].nome})`);
  for (const { criterio, avaliacao, obtidos } of detalharPontuacao(lead.criterios)) {
    console.log(`  ${obtidos ? `+${obtidos}` : "0"} ${criterio.id}${criterio.id === "presenca_web" ? ` (${avaliacao?.nivel})` : ""}`);
  }
}

function candidatoDescartado(d: Descartado) {
  return { nome: d.nome, cidade: d.cidade, instagram: { usuario: d.instagram, ultimoPost: "" }, site: { url: d.site }, contato: { telefone: d.telefone } };
}

async function executar(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      hoje: { type: "string" }, instagram: { type: "string" }, motivo: { type: "string" },
      nome: { type: "string" }, cidade: { type: "string" }, uf: { type: "string" },
      site: { type: "string" }, telefone: { type: "string" }, min: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const [comando, ...argumentos] = positionals;
  if (values.help || !comando || !["criterios", "existe", "adicionar", "atualizar", "descartar", "remover", "listar", "validar"].includes(comando)) {
    ajuda();
    if (comando && !values.help) process.exitCode = 1;
    return;
  }
  const hoje = values.hoje ?? hojeFortaleza();
  if (!dataValida(hoje)) throw new Error("hoje: informe uma data real no formato AAAA-MM-DD");
  if (comando === "criterios") { imprimirCriterios(); return; }
  return comTrava(async () => {
  const [leads, descartados] = await Promise.all([lerLeads(), lerDescartados()]);
  if (comando === "existe") {
    if (!argumentos.length) throw new Error("existe: informe pelo menos um termo");
    for (const termo of argumentos) {
      const encontrados = buscarTermo(termo, leads, descartados);
      if (!encontrados.length) console.log(`${termo}: livre`);
      else encontrados.forEach((caso) => console.log(`${termo}: ${mensagemDuplicado(caso)}`));
    }
    return;
  }
  if (comando === "adicionar" || comando === "atualizar") {
    if (argumentos.length !== 1) throw new Error(`${comando}: informe um arquivo JSON`);
    const entrada: unknown = JSON.parse(await readFile(argumentos[0], "utf8"));
    const lote = Array.isArray(entrada) ? entrada : [entrada];
    if (!lote.length) throw new Error(`${comando}: lote vazio`);
    const aceitos: Lead[] = [];
    for (const [indice, item] of lote.entries()) {
      const resultado = validarLead(item, hoje);
      if (!resultado.ok) {
        console.error(`Item ${indice + 1} inválido:\n${resultado.erros.join("\n")}`);
        process.exitCode = 1;
        continue;
      }
      const lead = resultado.lead;
      const posicao = leads.findIndex((atual) => atual.id === lead.id);
      if (comando === "atualizar" && posicao < 0) {
        console.error(`${lead.id}: lead não encontrado para atualizar`);
        process.exitCode = 1;
        continue;
      }
      const duplicado = acharDuplicado(lead, leads, descartados, comando === "atualizar" ? lead.id : undefined);
      if (duplicado) {
        console.error(`${lead.id}: ${mensagemDuplicado(duplicado, descartados)}`);
        process.exitCode = 1;
        continue;
      }
      if (comando === "atualizar") leads[posicao] = lead;
      else leads.push(lead);
      aceitos.push(lead);
    }
    if (aceitos.length) {
      await salvarLeads(aceitos);
      aceitos.forEach(imprimirLead);
    }
    return;
  }
  if (comando === "descartar") {
    const resultado = validarDescartado({ instagram: values.instagram, motivo: values.motivo, nome: values.nome, cidade: values.cidade, uf: values.uf, site: values.site, telefone: values.telefone }, hoje);
    if (!resultado.ok) throw new Error(resultado.erros.join("\n"));
    const d = resultado.descartado;
    const duplicado = acharDuplicado(candidatoDescartado(d), leads, descartados);
    if (duplicado) throw new Error(`${mensagemDuplicado(duplicado, descartados)}${duplicado.onde === "lead" ? ". Use remover <id> --motivo para descartar o lead existente" : ""}`);
    await salvarDescartados([...descartados, d]);
    console.log(`✓ ${d.instagram}: descartado (${d.motivo})`);
    return;
  }
  if (comando === "remover") {
    if (argumentos.length !== 1) throw new Error("remover: informe um id e --motivo");
    const id = normalizarInstagram(argumentos[0]);
    const lead = leads.find((item) => item.id === id);
    if (!lead) throw new Error(`${id}: lead não encontrado`);
    const resultado = validarDescartado({ instagram: id, nome: lead.nome, cidade: lead.cidade, uf: lead.uf, site: lead.site.url ?? lead.instagram.linkBio, telefone: lead.contato.whatsapp ?? lead.contato.telefone, motivo: values.motivo }, hoje);
    if (!resultado.ok) throw new Error(resultado.erros.join("\n"));
    const duplicado = acharDuplicado(candidatoDescartado(resultado.descartado), [], descartados);
    if (duplicado) throw new Error(mensagemDuplicado(duplicado, descartados));
    // Registra o descarte primeiro para não perder o histórico se a segunda escrita falhar.
    await salvarDescartados([...descartados, resultado.descartado]);
    await removerLead(id);
    console.log(`✓ ${id}: removido e descartado (${values.motivo})`);
    return;
  }
  if (comando === "listar") {
    const minimo = values.min === undefined ? 0 : Number(values.min);
    if (!Number.isFinite(minimo) || minimo < 0 || minimo > 100) throw new Error("min: informe uma nota entre 0 e 100");
    const linhas = [
      ["Nota", "Faixa", "Id", "Nome", "Segmento", "Cidade/UF", "Analisado em"],
      ...leads.filter((lead) => lead.pontuacao >= minimo && (!values.uf || lead.uf === values.uf.toUpperCase()))
        .sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome, "pt-BR"))
        .map((lead) => [String(lead.pontuacao), FAIXAS[faixaDa(lead.pontuacao)].nome, lead.id, lead.nome, lead.segmento, `${lead.cidade}/${lead.uf}`, lead.analisadoEm]),
    ];
    const larguras = linhas[0].map((_, i) => Math.max(...linhas.map((linha) => linha[i].length)));
    for (const linha of linhas) console.log(linha.map((valor, i) => valor.padEnd(larguras[i])).join("  ").trimEnd());
    return;
  }
  let mudou = false;
  let validos = 0;
  const corrigidos: Lead[] = [];
  leads.forEach((lead) => {
    const resultado = validarLead(lead, lead.analisadoEm);
    if (!resultado.ok) {
      console.error(`${lead.id}:\n${resultado.erros.join("\n")}`);
      process.exitCode = 1;
      return;
    }
    validos++;
    if (JSON.stringify(resultado.lead) !== JSON.stringify(lead)) { mudou = true; corrigidos.push(resultado.lead); }
  });
  if (mudou) await salvarLeads(corrigidos);
  console.log(`${validos}/${leads.length} leads válidos${mudou ? "; dados recalculados e gravados" : ""}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // O pnpm repassa o "--" de `pnpm radar:lead -- listar`.
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  executar().catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exitCode = 1;
  });
}
