import { mkdirSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pastaBase } from "./arquivos.ts";
import { executar, erroSeguro } from "./processo.ts";
const LABEL = "com.mfservices.noite";
export function validarHora(hora: string): { hora: number; minuto: number } {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))
    throw new Error("Horário inválido, use HH:MM");
  return { hora: Number(hora.slice(0, 2)), minuto: Number(hora.slice(3)) };
}
const xml = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const shellDuplo = (v: string) => '"' + v.replace(/[\\"$`]/g, "\\$&") + '"';
/** O launchd não carrega o .zshrc: os CLIs do Claude e do Codex ficam em ~/.local/bin. */
export const caminhoExecucao = (home: string) =>
  [join(home, ".local/bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(":");
export function gerarPlist(op: {
  repo: string;
  base: string;
  horario: string;
  home?: string;
}): string {
  op = { ...op, home: op.home ?? homedir() };
  const { hora, minuto } = validarHora(op.horario);
  const comando = `cd ${shellDuplo(op.repo)} && pnpm noite`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${LABEL}</string>
<key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string><string>${xml(comando)}</string></array>
<key>EnvironmentVariables</key><dict><key>NOITE_DIR</key><string>${xml(op.base)}</string><key>PATH</key><string>${xml(caminhoExecucao(op.home!))}</string></dict>
<key>StartCalendarInterval</key><dict><key>Hour</key><integer>${hora}</integer><key>Minute</key><integer>${minuto}</integer></dict>
<key>StandardOutPath</key><string>${xml(join(op.base, "logs/launchd.log"))}</string>
<key>StandardErrorPath</key><string>${xml(join(op.base, "logs/launchd.log"))}</string>
</dict></plist>\n`;
}
export async function agendar(args = process.argv.slice(2)): Promise<void> {
  if (process.platform !== "darwin")
    throw new Error("launchd só está disponível no macOS");
  if (
    args.length > 1 ||
    (args[0]?.startsWith("--") && !["--ver", "--remover"].includes(args[0]))
  )
    throw new Error("Use [HH:MM], --ver ou --remover");
  const dominio = `gui/${process.getuid!()}`;
  const alvo = `${dominio}/${LABEL}`;
  const pasta = join(homedir(), "Library/LaunchAgents");
  const plist = join(pasta, `${LABEL}.plist`);
  const launchctl = (a: string[]) =>
    executar("launchctl", a, { cwd: process.cwd(), timeout: 15_000 });
  if (args[0] === "--ver") {
    console.log(await launchctl(["print", alvo]));
    return;
  }
  if (args[0] === "--remover") {
    try {
      await launchctl(["bootout", alvo]);
    } catch {
      /* Pode não estar carregado. */
    }
    if (existsSync(plist)) {
      const arquivo = join(pasta, "arquivo");
      mkdirSync(arquivo, { recursive: true });
      renameSync(
        plist,
        join(
          arquivo,
          `${LABEL}.${new Date().toISOString().replace(/:/g, "-")}.plist`
        )
      );
    }
    console.log("Agendamento removido; plist arquivado, se existia.");
    return;
  }
  const horario = args[0] ?? process.env.NOITE_HORA ?? "23:30";
  const base = pastaBase();
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const conteudo = gerarPlist({ repo, base, horario });
  mkdirSync(pasta, { recursive: true });
  mkdirSync(join(base, "logs"), { recursive: true, mode: 0o700 });
  writeFileSync(plist, conteudo, { mode: 0o600 });
  try {
    await launchctl(["bootout", alvo]);
  } catch {
    /* Primeira instalação. */
  }
  await launchctl(["bootstrap", dominio, plist]);
  console.log(`Agendado para ${horario}: ${plist}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  agendar().catch(e => {
    console.error(erroSeguro(e));
    process.exitCode = 1;
  });
