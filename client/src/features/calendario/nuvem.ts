import { completarAgenda, ehAgenda, type Agenda } from "./agenda";

/**
 * Calendário no Supabase (tabela `calendario`, uma linha por usuário).
 * O cliente entra por parâmetro para os testes não precisarem de rede.
 */

type Resposta<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;

/** Só o pedaço do supabase-js que usamos. */
export type ClienteCalendario = {
  from(tabela: "calendario"): {
    select(colunas: string): { eq(c: "owner", v: string): { maybeSingle(): Resposta<{ dados: unknown; versao: number }> } };
    insert(linha: { owner: string; dados: Agenda }): { select(colunas: "versao"): { single(): Resposta<{ versao: number }> } };
    update(linha: { dados: Agenda }): {
      eq(c: "owner", v: string): { eq(c: "versao", v: number): { select(colunas: "versao"): { maybeSingle(): Resposta<{ versao: number }> } } };
    };
  };
};

export type Lido =
  | { tipo: "ok"; agenda: Agenda; versao: number }
  | { tipo: "vazio" }
  | { tipo: "invalido" }
  | { tipo: "sem-tabela" }
  | { tipo: "erro"; mensagem: string };

/** Tabela ainda não criada no Supabase (migration 0002 não rodou). */
const semTabela = (e: { code?: string }) => e.code === "PGRST205" || e.code === "42P01";

export async function lerNuvem(cliente: ClienteCalendario, userId: string): Promise<Lido> {
  const { data, error } = await cliente.from("calendario").select("dados,versao").eq("owner", userId).maybeSingle();
  if (error) return semTabela(error) ? { tipo: "sem-tabela" } : { tipo: "erro", mensagem: error.message };
  if (!data) return { tipo: "vazio" };
  return ehAgenda(data.dados) ? { tipo: "ok", agenda: completarAgenda(data.dados), versao: data.versao } : { tipo: "invalido" };
}

export type Gravado = { tipo: "ok"; versao: number } | { tipo: "conflito" } | { tipo: "erro"; mensagem: string };

/** Primeira gravação. Se a linha já existir (outro aparelho criou antes), é conflito. */
export async function criarNuvem(cliente: ClienteCalendario, userId: string, agenda: Agenda): Promise<Gravado> {
  if (!ehAgenda(agenda)) return { tipo: "erro", mensagem: "Calendário inválido." };
  const { data, error } = await cliente.from("calendario").insert({ owner: userId, dados: agenda }).select("versao").single();
  if (error) return error.code === "23505" ? { tipo: "conflito" } : { tipo: "erro", mensagem: error.message };
  return data ? { tipo: "ok", versao: data.versao } : { tipo: "erro", mensagem: "Sem resposta do servidor." };
}

/** Grava só se a versão lida ainda for a atual; senão, outro aparelho salvou no meio. */
export async function salvarNuvem(cliente: ClienteCalendario, userId: string, agenda: Agenda, versao: number): Promise<Gravado> {
  if (!ehAgenda(agenda)) return { tipo: "erro", mensagem: "Calendário inválido." };
  const { data, error } = await cliente.from("calendario").update({ dados: agenda }).eq("owner", userId).eq("versao", versao).select("versao").maybeSingle();
  if (error) return { tipo: "erro", mensagem: error.message };
  return data ? { tipo: "ok", versao: data.versao } : { tipo: "conflito" };
}
