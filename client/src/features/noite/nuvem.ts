import { ehDia, ehRelatorio, type Relatorio } from "@shared/noite/relatorio";

/**
 * Relatório da noite no Supabase (tabela `noite_relatorios`, um por dia).
 * Só leitura: quem grava é a rotina `pnpm noite`, no Mac, com a service role.
 * O cliente entra por parâmetro para os testes não precisarem de rede.
 */

type Resposta<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;

/** Só o pedaço do supabase-js que usamos. */
export type ClienteNoite = {
  from(tabela: "noite_relatorios"): {
    select(colunas: string): {
      eq(c: "owner", v: string): {
        order(c: "dia", o: { ascending: boolean }): { limit(n: number): Resposta<{ dia: string }[]> };
        eq(c: "dia", v: string): { maybeSingle(): Resposta<{ relatorio: unknown }> };
      };
    };
  };
};

/** Tabela ainda não criada (a migration 0004 não rodou). */
const semTabela = (e: { code?: string }) => e.code === "PGRST205" || e.code === "42P01";

export type Dias = { tipo: "ok"; dias: string[] } | { tipo: "sem-tabela" } | { tipo: "erro"; mensagem: string };

/** Os dias com relatório, do mais novo para o mais antigo. */
export async function listarDias(cliente: ClienteNoite, userId: string, limite = 90): Promise<Dias> {
  const { data, error } = await cliente.from("noite_relatorios").select("dia").eq("owner", userId).order("dia", { ascending: false }).limit(limite);
  if (error) return semTabela(error) ? { tipo: "sem-tabela" } : { tipo: "erro", mensagem: error.message };
  return { tipo: "ok", dias: (data ?? []).map((l) => l.dia).filter(ehDia) };
}

export type Lido = { tipo: "ok"; relatorio: Relatorio } | { tipo: "vazio" } | { tipo: "invalido" } | { tipo: "sem-tabela" } | { tipo: "erro"; mensagem: string };

export async function lerRelatorio(cliente: ClienteNoite, userId: string, dia: string): Promise<Lido> {
  if (!ehDia(dia)) return { tipo: "vazio" };
  const { data, error } = await cliente.from("noite_relatorios").select("relatorio").eq("owner", userId).eq("dia", dia).maybeSingle();
  if (error) return semTabela(error) ? { tipo: "sem-tabela" } : { tipo: "erro", mensagem: error.message };
  if (!data) return { tipo: "vazio" };
  return ehRelatorio(data.relatorio) ? { tipo: "ok", relatorio: data.relatorio } : { tipo: "invalido" };
}

/** Arquivo salvo no Mac (`~/.local/share/noite-mf/<dia>/relatorio.json`), aberto à mão. */
export function lerArquivo(texto: string): Relatorio | null {
  try {
    const v: unknown = JSON.parse(texto);
    return ehRelatorio(v) ? v : null;
  } catch {
    return null;
  }
}

/** Só http(s): o relatório traz links da web (notícias, prospecção) e não pode virar `javascript:`. */
export function linkSeguro(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "segunda, 13 de outubro" (o dia é uma data civil, sem fuso). */
export function diaPorExtenso(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  const semana = SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${semana}, ${d} de ${MESES[m - 1]}`;
}
