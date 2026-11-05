import { PREFIXO_REPROVADO } from "./envio.ts";
import type { Registro } from "./funil.ts";
import type { Lead } from "./tipos.ts";

export type Reprovacao = { id: string; nome: string; segmento: string; cidade: string; uf: string; motivo: string; em: string };

/** Leads reprovados no painel, com o motivo, para a próxima busca evitar o mesmo erro. */
export function reprovacoes(leads: Lead[], registros: Record<string, Registro>): Reprovacao[] {
  const porId = new Map(leads.map(l => [l.id, l]));
  return Object.entries(registros)
    .filter(([, r]) => r.etapa === "descartado" && r.anotacao.startsWith(PREFIXO_REPROVADO))
    .map(([id, r]) => {
      const lead = porId.get(id);
      return {
        id,
        nome: lead?.nome ?? id,
        segmento: lead?.segmento ?? "",
        cidade: lead?.cidade ?? "",
        uf: lead?.uf ?? "",
        motivo: r.anotacao.slice(PREFIXO_REPROVADO.length).trim(),
        em: r.atualizadoEm.slice(0, 10),
      };
    })
    .sort((a, b) => b.em.localeCompare(a.em) || a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Contagem por motivo, da mais frequente para a menos. */
export function contarMotivos(itens: Reprovacao[]): [string, number][] {
  const contagem = new Map<string, number>();
  for (const item of itens) contagem.set(item.motivo, (contagem.get(item.motivo) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
}
