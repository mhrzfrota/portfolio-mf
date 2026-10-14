import { executar } from "./processo.ts";
export const aspasAppleScript = (v: string) =>
  '"' +
  v
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]/g, " ") +
  '"';
export async function avisar(dia: string, manchete: string): Promise<void> {
  if (process.platform !== "darwin" || process.env.NOITE_SEM_AVISO === "1")
    return;
  const script = `display notification ${aspasAppleScript(manchete)} with title "Relatório da noite" subtitle ${aspasAppleScript(dia)}`;
  await executar("osascript", ["-e", script], {
    cwd: process.cwd(),
    timeout: 10_000,
  });
}
