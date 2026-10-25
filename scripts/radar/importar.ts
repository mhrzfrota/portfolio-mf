import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import type { Lead, Descartado, Envio, Bloqueado, ConfigRadar } from "../../shared/radar/tipos.ts";
import type { Registro } from "../../shared/radar/funil.ts";
import { lerLeads, salvarLeads, lerDescartados, salvarDescartados, lerEnvios, salvarEnvios, lerFunil, salvarFunil, lerBloqueados, salvarBloqueados, lerConfig, salvarConfig } from "./armazem.ts";

type Pacote = { leads: Lead[]; descartados: Descartado[]; envios: Envio[]; registros: Record<string, Registro>; bloqueados: Bloqueado[]; config: ConfigRadar };
async function json<T>(pasta: string, nome: string): Promise<T> {
  const bruto = await readFile(join(pasta, `${nome}.json`), "utf8");
  return JSON.parse(bruto) as T;
}
function porChave<T>(itens: T[], chave: (item: T) => string): Map<string, T> { return new Map(itens.map((item) => [chave(item), item])); }
function conflitos<T>(entrada: T[], atual: T[], chave: (item: T) => string): number {
  const mapa = porChave(atual, chave);
  return entrada.filter((item) => mapa.has(chave(item))).length;
}
const tabelasAusentes = new Set<string>();
let configuracaoAusente = false;
async function lerOpcional<T>(tabela: string, leitura: Promise<T>, vazio: T): Promise<T> {
  try { return await leitura; }
  catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (/Tabela .* inexistente/.test(mensagem)) { tabelasAusentes.add(tabela); return vazio; }
    if (tabela === "radar_config" && /Configuração do Radar ausente/.test(mensagem)) { configuracaoAusente = true; return vazio; }
    throw erro;
  }
}

async function executar(): Promise<void> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { de: { type: "string" }, gravar: { type: "boolean", default: false }, help: { type: "boolean", short: "h" } } });
  if (positionals.length || values.help) {
    console.log("Uso: pnpm radar:importar [--de <pasta>] [--gravar]");
    if (positionals.length) process.exitCode = 1;
    return;
  }
  const pasta = resolve((values.de ?? join(homedir(), "Desktop/projects/radar-prospeccao/data")).replace(/^~(?=\/|$)/, homedir()));
  const [l, d, e, f, b, c] = await Promise.all([
    json<{ leads: Lead[] }>(pasta, "leads"), json<{ descartados: Descartado[] }>(pasta, "descartados"),
    json<{ envios: Envio[] }>(pasta, "envios"), json<{ registros: Record<string, Registro> }>(pasta, "funil"),
    json<{ bloqueados: Bloqueado[] }>(pasta, "bloqueados"), json<ConfigRadar>(pasta, "config"),
  ]);
  const pacote: Pacote = { leads: l.leads, descartados: d.descartados, envios: e.envios, registros: f.registros, bloqueados: b.bloqueados, config: c };
  const [la, da, ea, fa, ba, ca] = await Promise.all([
    lerOpcional("radar_leads", lerLeads(), []), lerOpcional("radar_descartados", lerDescartados(), []), lerOpcional("radar_envios", lerEnvios(), []),
    lerOpcional("radar_funil", lerFunil(), {}), lerOpcional("radar_bloqueados", lerBloqueados(), []), lerOpcional("radar_config", lerConfig(), undefined),
  ]);
  const conflitosTabela = {
    leads: conflitos(pacote.leads, la, (x) => x.id), descartados: conflitos(pacote.descartados, da, (x) => x.instagram.toLowerCase().replace(/^@/, "")),
    envios: conflitos(pacote.envios, ea, (x) => x.id), funil: conflitos(Object.entries(pacote.registros), Object.entries(fa), (x) => x[0]),
    bloqueados: conflitos(pacote.bloqueados, ba, (x) => x.instagram.toLowerCase().replace(/^@/, "")), config: ca ? 1 : 0,
  };
  console.log(values.gravar ? "Importação com gravação solicitada:" : "Prévia, nada foi gravado:");
  for (const [tabela, total] of Object.entries({ leads: pacote.leads.length, descartados: pacote.descartados.length, envios: pacote.envios.length, funil: Object.keys(pacote.registros).length, bloqueados: pacote.bloqueados.length, config: 1 })) {
    const tabelaDb = `radar_${tabela}`;
    const destinoAusente = tabelasAusentes.has(tabelaDb) || (tabela === "config" && configuracaoAusente);
    console.log(`${tabela}: ${total} origem, ${conflitosTabela[tabela as keyof typeof conflitosTabela]} já existentes${destinoAusente ? " (destino ainda não configurado)" : ""}`);
  }
  if (values.gravar) {
    await salvarLeads(pacote.leads); await salvarDescartados(pacote.descartados); await salvarEnvios(pacote.envios);
    await salvarFunil(pacote.registros); await salvarBloqueados(pacote.bloqueados); await salvarConfig(pacote.config);
    console.log("Gravação concluída.");
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // O pnpm repassa o "--" de `pnpm radar:importar -- --gravar`.
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  executar().catch((erro: unknown) => { console.error(erro instanceof Error ? erro.message : String(erro)); process.exitCode = 1; });
}
