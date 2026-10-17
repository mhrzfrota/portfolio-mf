import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Agente } from "../../shared/noite/relatorio.ts";
import { diaDaNoite, janela, validarDia } from "./tempo.ts";
import { coletar } from "./coletor.ts";
import { etapaCodex, ehSaidaCodex, type SaidaCodex } from "./etapa-codex.ts";
import {
  etapaClaude,
  ehSaidaClaude,
  type SaidaClaude,
} from "./etapa-claude.ts";
import { montarRelatorio } from "./montar.ts";
import { subir } from "./subir.ts";
import { avisar } from "./aviso.ts";
import { pastaBase, travar, limpar, gravarJson } from "./arquivos.ts";
import { erroSeguro } from "./processo.ts";
import { ocultarSegredos } from "./segredos.ts";
import {
  diaPendente,
  macAcordado,
  relatorioCompleto,
  tentativas,
  registrarTentativa,
  MAX_TENTATIVAS,
} from "./pendente.ts";
export function flags(args: string[], agora = Date.now()) {
  const op = {
    seco: false,
    falso: false,
    dia: diaDaNoite(agora),
    semCodex: false,
    semClaude: false,
    sePendente: false,
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--seco":
        op.seco = true;
        break;
      case "--falso":
        op.falso = true;
        op.seco = true;
        break;
      case "--sem-codex":
        op.semCodex = true;
        break;
      case "--sem-claude":
        op.semClaude = true;
        break;
      case "--se-pendente":
        op.sePendente = true;
        break;
      case "--dia":
        op.dia = args[++i] ?? "";
        validarDia(op.dia);
        break;
      default:
        throw new Error(`Flag desconhecida: ${args[i]}`);
    }
  }
  if (janela(op.dia, agora).fim < janela(op.dia, agora).inicio)
    throw new Error("dia não pode ser futuro");
  return op;
}
const pulado = (): Agente => ({
  ok: false,
  duracaoMs: 0,
  modelo: null,
  erro: "Etapa desativada por flag",
});
export async function main(args = process.argv.slice(2)): Promise<void> {
  // Os CLIs do Claude e do Codex ficam em ~/.local/bin, que o launchd e outros shells não põem no PATH
  const binLocal = join(homedir(), ".local/bin");
  if (!(process.env.PATH ?? "").split(":").includes(binLocal))
    process.env.PATH = `${binLocal}:${process.env.PATH ?? ""}`;
  process.umask(0o077);
  const inicio = Date.now();
  const op = flags(args, inicio);
  const base = pastaBase();
  if (op.sePendente) {
    // Agendador: só roda se a última noite ainda falta e o Mac está acordado de verdade
    op.dia = diaPendente(inicio, process.env.NOITE_HORA ?? "23:30");
    const pasta = join(base, op.dia);
    if (relatorioCompleto(pasta) || tentativas(pasta) >= MAX_TENTATIVAS)
      return;
    if (!macAcordado()) {
      console.log(
        `${new Date(inicio).toISOString()} Noite ${op.dia} pendente: Mac em repouso, tenta de novo no próximo despertar`
      );
      return;
    }
  }
  let liberar: () => void;
  try {
    liberar = travar(base);
  } catch (e) {
    if (op.sePendente && /já em execução/.test(erroSeguro(e))) return;
    throw e;
  }
  const pastaDoDia = join(base, op.dia);
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  try {
    mkdirSync(pastaDoDia, { recursive: true, mode: 0o700 });
    mkdirSync(join(base, "logs"), { recursive: true, mode: 0o700 });
    const log = (t: string) => {
      const linha = `${new Date().toISOString()} ${ocultarSegredos(t)}`;
      appendFileSync(join(pastaDoDia, "log.txt"), linha + "\n", {
        mode: 0o600,
      });
      console.log(linha);
    };
    async function etapa<T>(
      nome: string,
      fn: () => T | Promise<T>
    ): Promise<T> {
      const t = Date.now();
      log(`${nome}: início`);
      try {
        const r = await fn();
        log(`${nome}: ${Date.now() - t} ms`);
        return r;
      } catch (e) {
        log(`${nome}: falhou em ${Date.now() - t} ms (${erroSeguro(e)})`);
        throw e;
      }
    }
    let resultado = "erro";
    if (op.sePendente) {
      registrarTentativa(pastaDoDia);
      log(`Tentativa ${tentativas(pastaDoDia)} de ${MAX_TENTATIVAS} (agendador)`);
    }
    if (!op.falso && process.platform === "darwin") {
      log(`Energia: ${macAcordado() ? "Mac acordado" : "Mac em repouso (DarkWake), os agentes podem travar"}`);
      try {
        // Segura o Mac acordado enquanto a rotina roda (com a tampa aberta)
        spawn("caffeinate", ["-i", "-w", String(process.pid)], {
          stdio: "ignore",
          detached: true,
        }).unref();
      } catch {
        /* Sem caffeinate, segue. */
      }
    }
    try {
      await etapa("Limpeza", () => limpar(base, inicio, op.dia));
      const vault = resolve(
        process.env.NOITE_VAULT ?? join(homedir(), "Documents/FRT CEREBRO")
      );
      const insumos = await etapa("Coleta", () =>
        coletar({
          dia: op.dia,
          janela: janela(op.dia, inicio),
          raizProjetos: join(homedir(), "Desktop/projects"),
          vault,
          claudeDir: join(homedir(), ".claude/projects"),
          codexDir: join(homedir(), ".codex/sessions"),
          ignorarCwd: base,
        })
      );
      gravarJson(join(pastaDoDia, "insumos.json"), insumos);
      log(`Coletor: ${JSON.stringify(insumos.metricas)}`);
      for (const aviso of insumos.avisos) log(aviso);
      const fixture = (nome: string): unknown =>
        JSON.parse(
          readFileSync(
            join(repo, "scripts/noite/fixtures", `${nome}.json`),
            "utf8"
          )
        );
      const codex = await etapa(
        "Codex",
        async (): Promise<{ saida: SaidaCodex | null; agente: Agente }> => {
          if (op.semCodex) return { saida: null, agente: pulado() };
          if (!op.falso) return etapaCodex({ pastaDoDia, repo, insumos, log });
          const saida = fixture("codex");
          if (!ehSaidaCodex(saida)) throw new Error("Fixture Codex inválida");
          return {
            saida,
            agente: { ok: true, duracaoMs: 0, modelo: "fixture", erro: null },
          };
        }
      );
      gravarJson(join(pastaDoDia, "codex.json"), codex.saida);
      const claude = await etapa(
        "Claude",
        async (): Promise<{ saida: SaidaClaude | null; agente: Agente }> => {
          if (op.semClaude) return { saida: null, agente: pulado() };
          if (!op.falso)
            return etapaClaude({
              pastaDoDia,
              vault,
              insumos,
              codex: codex.saida,
              log,
            });
          const saida = fixture("claude");
          if (!ehSaidaClaude(saida)) throw new Error("Fixture Claude inválida");
          return {
            saida,
            agente: { ok: true, duracaoMs: 0, modelo: "fixture", erro: null },
          };
        }
      );
      gravarJson(join(pastaDoDia, "claude.json"), claude.saida);
      const relatorio = await etapa("Montagem", () =>
        montarRelatorio({
          dia: op.dia,
          geradoEm: new Date().toISOString(),
          insumos,
          codex: codex.saida,
          claude: claude.saida,
          agentes: { codex: codex.agente, claude: claude.agente },
        })
      );
      gravarJson(join(pastaDoDia, "relatorio.json"), relatorio);
      let erroUpload: unknown;
      try {
        resultado = await etapa("Upload", () => subir(relatorio, op.seco, log));
      } catch (e) {
        erroUpload = e;
        resultado = "local, upload falhou";
      }
      try {
        await etapa("Notificação", () => avisar(op.dia, relatorio.manchete));
      } catch {
        log("Relatório salvo, notificação indisponível");
      }
      if (erroUpload) throw erroUpload;
    } catch (e) {
      log(`Falha: ${erroSeguro(e)}`);
      process.exitCode = 1;
    } finally {
      log(
        `Resumo: dia=${op.dia}; modo=${op.falso ? "falso" : op.seco ? "seco" : "normal"}; resultado=${resultado}; duração=${Date.now() - inicio} ms; pasta=${pastaDoDia}`
      );
    }
  } finally {
    liberar();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch(e => {
    console.error(erroSeguro(e));
    process.exitCode = 1;
  });
