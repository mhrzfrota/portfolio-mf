import { faixaDa, type Faixa } from "./criterios.ts";
import type { Etapa, Registro } from "./funil.ts";
import type { Lead, Servico, SituacaoSite } from "./tipos.ts";

export type Ordem = "nota" | "recentes" | "nome";

export const ORDENS: Record<Ordem, string> = {
  nota: "Maior nota",
  recentes: "Mais recentes",
  nome: "Nome",
};

/** Campo vazio = sem filtro. */
export type Filtros = {
  busca: string;
  faixa: Faixa | "";
  segmento: string;
  uf: string;
  site: SituacaoSite | "";
  servico: Servico | "";
  etapa: Etapa | "";
  ordem: Ordem;
};

export const FILTROS_INICIAIS: Filtros = {
  busca: "",
  faixa: "",
  segmento: "",
  uf: "",
  site: "",
  servico: "",
  etapa: "",
  ordem: "nota",
};

export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function etapaDe(funil: Record<string, Registro>, id: string): Etapa {
  return funil[id]?.etapa ?? "novo";
}

export function temFiltroAtivo(filtros: Filtros): boolean {
  return (Object.keys(FILTROS_INICIAIS) as (keyof Filtros)[]).some(
    (chave) => chave !== "ordem" && filtros[chave] !== FILTROS_INICIAIS[chave],
  );
}

/**
 * Sem etapa escolhida, os descartados saem da lista: quem já disse não, ou
 * que o Matheus tirou, não deve voltar para a frente da fila.
 */
export function filtrar(leads: Lead[], filtros: Filtros, funil: Record<string, Registro>): Lead[] {
  const termo = semAcento(filtros.busca.trim());
  const lista = leads.filter((lead) => {
    const etapa = etapaDe(funil, lead.id);
    if (filtros.etapa ? etapa !== filtros.etapa : etapa === "descartado") return false;
    if (filtros.faixa && faixaDa(lead.pontuacao) !== filtros.faixa) return false;
    if (filtros.segmento && lead.segmento !== filtros.segmento) return false;
    if (filtros.uf && lead.uf !== filtros.uf) return false;
    if (filtros.site && lead.criterios.presenca_web?.nivel !== filtros.site) return false;
    if (filtros.servico && !lead.servicos.includes(filtros.servico)) return false;
    if (termo) {
      const alvo = semAcento(
        [lead.nome, lead.segmento, lead.cidade, lead.uf, lead.instagram.usuario, lead.oportunidade, ...lead.problemas].join(" "),
      );
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

  const porNome = (a: Lead, b: Lead) => a.nome.localeCompare(b.nome, "pt-BR");
  return lista.sort((a, b) => {
    if (filtros.ordem === "nome") return porNome(a, b);
    if (filtros.ordem === "recentes") return b.analisadoEm.localeCompare(a.analisadoEm) || b.pontuacao - a.pontuacao;
    return b.pontuacao - a.pontuacao || porNome(a, b);
  });
}

/** Valores distintos de um campo, em ordem alfabética, para os selects. */
export function opcoes(leads: Lead[], campo: (lead: Lead) => string): string[] {
  return [...new Set(leads.map(campo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
