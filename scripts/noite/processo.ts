import { spawn } from "node:child_process";
import { ocultarSegredos } from "./segredos.ts";
export type Log = (texto: string) => void;
/** Limite por agente: NOITE_TIMEOUT_MIN vale para os dois; sem ela, o padrão de cada etapa. */
export function timeoutMs(padraoMin = 15): number {
  const minutos = Number(process.env.NOITE_TIMEOUT_MIN ?? padraoMin);
  if (!Number.isFinite(minutos) || minutos <= 0)
    throw new Error("NOITE_TIMEOUT_MIN deve ser positivo");
  return minutos * 60_000;
}
export function executar(
  comando: string,
  args: string[],
  op: { cwd: string; stdin?: string; timeout: number; env?: NodeJS.ProcessEnv }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filho = spawn(comando, args, {
      cwd: op.cwd,
      env: op.env ?? process.env,
      detached: process.platform !== "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let tamanho = 0;
    let falha: string | null = null;
    let morte: ReturnType<typeof setTimeout> | undefined;
    const matar = (sinal: NodeJS.Signals) => {
      try {
        if (process.platform !== "win32" && filho.pid)
          process.kill(-filho.pid, sinal);
        else filho.kill(sinal);
      } catch {
        /* Processo já terminou. */
      }
    };
    let encerrado = false;
    const parar = (motivo: string) => {
      if (falha) return;
      falha = motivo;
      matar("SIGTERM");
      // Um processo neto (ex.: ferramenta do Codex) pode segurar o stdout aberto e o 'close'
      // não chegar: depois do SIGKILL, solta os canos e encerra por conta própria.
      morte = setTimeout(() => {
        matar("SIGKILL");
        filho.stdout.destroy();
        filho.stderr.destroy();
        if (!encerrado) {
          encerrado = true;
          clearTimeout(timer);
          reject(new Error(motivo));
        }
      }, 1000);
    };
    const timer = setTimeout(
      () => parar(`Tempo máximo excedido (${op.timeout} ms)`),
      op.timeout
    );
    filho.stdout.setEncoding("utf8");
    filho.stdout.on("data", (b: string) => {
      tamanho += Buffer.byteLength(b);
      if (tamanho > 16 * 1024 * 1024) parar("Saída excedeu 16 MB");
      else stdout += b.toString();
    });
    filho.stderr.resume(); // Não guardar stderr: pode conter prompts e credenciais.
    filho.stdin.on("error", () => {});
    filho.on("error", () => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(timer);
      if (morte) clearTimeout(morte);
      reject(new Error(`Não foi possível iniciar ${comando}`));
    });
    filho.on("close", codigo => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(timer);
      if (morte) {
        matar("SIGKILL");
        clearTimeout(morte);
      }
      if (falha || codigo !== 0)
        reject(new Error(falha ?? `${comando} terminou com código ${codigo}`));
      else resolve(stdout);
    });
    filho.stdin.end(op.stdin ?? "");
  });
}
export function ambienteAgente(): NodeJS.ProcessEnv {
  // Credenciais do upload não pertencem aos agentes. Autenticação própria dos CLIs é preservada.
  const env = { ...process.env };
  for (const k of Object.keys(env))
    if (/SUPABASE|OWNER_EMAIL/.test(k)) delete env[k];
  return env;
}
export const erroSeguro = (e: unknown) =>
  ocultarSegredos(e instanceof Error ? e.message : "Erro desconhecido");
