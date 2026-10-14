/**
 * Sobe para o Supabase os relatórios que já estão salvos no Mac, sem rodar os
 * agentes de novo. Útil depois de configurar o `.env.local` pela primeira vez.
 *
 *   pnpm noite:subir                 # todos os dias salvos
 *   pnpm noite:subir 2026-10-13      # só um dia
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ehDia, ehRelatorio } from "../../shared/noite/relatorio.ts";
import { pastaBase } from "./arquivos.ts";
import { erroSeguro } from "./processo.ts";
import { subir } from "./subir.ts";

export function diasSalvos(base: string, pedido?: string): string[] {
  if (pedido) return ehDia(pedido) && existsSync(join(base, pedido, "relatorio.json")) ? [pedido] : [];
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => ehDia(d) && existsSync(join(base, d, "relatorio.json")))
    .sort();
}

export async function subirSalvos(args = process.argv.slice(2)): Promise<number> {
  const base = pastaBase();
  const dias = diasSalvos(base, args[0]);
  if (!dias.length) {
    console.log(args[0] ? `Nenhum relatório salvo para ${args[0]}.` : `Nenhum relatório salvo em ${base}.`);
    return 1;
  }
  let falhas = 0;
  for (const dia of dias) {
    try {
      const v: unknown = JSON.parse(readFileSync(join(base, dia, "relatorio.json"), "utf8"));
      if (!ehRelatorio(v)) throw new Error("relatório fora do formato");
      const r = await subir(v, false, (t) => console.log(`${dia}: ${t}`));
      if (r !== "enviado") falhas++;
    } catch (e) {
      falhas++;
      console.log(`${dia}: ${erroSeguro(e)}`);
    }
  }
  console.log(`${dias.length - falhas} de ${dias.length} enviados.`);
  return falhas ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]))
  subirSalvos().then((c) => process.exit(c));
