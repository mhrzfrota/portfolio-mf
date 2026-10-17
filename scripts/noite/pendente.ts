import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { diaFortaleza, horaFortaleza } from "./tempo.ts";
import { gravarJson } from "./arquivos.ts";
/**
 * Às 23:30 o Mac costuma estar de tampa fechada, na bateria. O launchd dispara
 * a rotina num "DarkWake" de poucos segundos, o Mac volta a dormir no meio das
 * buscas e os agentes estouram o tempo sem notícia nenhuma (14, 15 e 16/10).
 * Com --se-pendente o agendador tenta de novo a cada 30 min e só roda quando o
 * Mac está acordado de verdade e o relatório da última noite ainda falta.
 */
export const MAX_TENTATIVAS = 3;
/** Última noite que já passou do horário agendado: hoje depois de HH:MM, senão ontem. */
export function diaPendente(agora: number, horario = "23:30"): string {
  return horaFortaleza(agora) >= horario
    ? diaFortaleza(agora)
    : diaFortaleza(agora - 86400_000);
}
/** No DarkWake o sistema não tem a capacidade "Graphics" (pmset -g systemstate). */
export function acordadoPelo(systemstate: string): boolean {
  const linha = systemstate.match(/Capabilities are:(.*)/);
  return !linha || /\bGraphics\b/.test(linha[1]);
}
export function macAcordado(): boolean {
  if (process.platform !== "darwin") return true;
  try {
    return acordadoPelo(
      execFileSync("pmset", ["-g", "systemstate"], {
        encoding: "utf8",
        timeout: 5_000,
      })
    );
  } catch {
    return true; // sem pmset, não bloqueia
  }
}
/** Completo: o Claude fez a síntese e há notícias (do Codex ou do plano B). */
export function relatorioCompleto(pastaDoDia: string): boolean {
  try {
    const r = JSON.parse(
      readFileSync(join(pastaDoDia, "relatorio.json"), "utf8")
    );
    return (
      r?.agentes?.claude?.ok === true &&
      (r.agentes.codex?.ok === true ||
        (Array.isArray(r.noticias) && r.noticias.length > 0))
    );
  } catch {
    return false;
  }
}
const arquivoEstado = (pastaDoDia: string) => join(pastaDoDia, "estado.json");
export function tentativas(pastaDoDia: string): number {
  if (!existsSync(arquivoEstado(pastaDoDia))) return 0;
  try {
    const n = JSON.parse(readFileSync(arquivoEstado(pastaDoDia), "utf8"))
      ?.tentativas;
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
export function registrarTentativa(pastaDoDia: string): void {
  gravarJson(arquivoEstado(pastaDoDia), {
    tentativas: tentativas(pastaDoDia) + 1,
  });
}
