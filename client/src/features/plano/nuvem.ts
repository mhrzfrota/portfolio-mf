import { ehQuadro, type Quadro } from "./quadro";

/**
 * Plano no Supabase (tabela `plano`, uma linha por usuário), no mesmo modelo
 * do calendário (features/calendario/nuvem.ts). O cliente entra por
 * parâmetro para os testes não precisarem de rede.
 */

type Resposta<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;

/** Só o pedaço do supabase-js que usamos. */
export type ClientePlano = {
  from(tabela: "plano"): {
    select(colunas: string): { eq(c: "owner", v: string): { maybeSingle(): Resposta<{ dados: unknown; versao: number }> } };
    insert(linha: { owner: string; dados: Quadro }): { select(colunas: "versao"): { single(): Resposta<{ versao: number }> } };
    update(linha: { dados: Quadro }): {
      eq(c: "owner", v: string): { eq(c: "versao", v: number): { select(colunas: "versao"): { maybeSingle(): Resposta<{ versao: number }> } } };
    };
  };
};

export type Lido =
  | { tipo: "ok"; quadro: Quadro; versao: number }
  | { tipo: "vazio" }
  | { tipo: "invalido" }
  | { tipo: "sem-tabela" }
  | { tipo: "erro"; mensagem: string };

/** Tabela ainda não criada no Supabase (migration 0003 não rodou). */
const semTabela = (e: { code?: string }) => e.code === "PGRST205" || e.code === "42P01";

export async function lerNuvem(cliente: ClientePlano, userId: string): Promise<Lido> {
  const { data, error } = await cliente.from("plano").select("dados,versao").eq("owner", userId).maybeSingle();
  if (error) return semTabela(error) ? { tipo: "sem-tabela" } : { tipo: "erro", mensagem: error.message };
  if (!data) return { tipo: "vazio" };
  return ehQuadro(data.dados) ? { tipo: "ok", quadro: data.dados, versao: data.versao } : { tipo: "invalido" };
}

export type Gravado = { tipo: "ok"; versao: number } | { tipo: "conflito" } | { tipo: "erro"; mensagem: string };

/** Primeira gravação. Se a linha já existir (outro aparelho criou antes), é conflito. */
export async function criarNuvem(cliente: ClientePlano, userId: string, quadro: Quadro): Promise<Gravado> {
  if (!ehQuadro(quadro)) return { tipo: "erro", mensagem: "Quadro inválido." };
  const { data, error } = await cliente.from("plano").insert({ owner: userId, dados: quadro }).select("versao").single();
  if (error) return error.code === "23505" ? { tipo: "conflito" } : { tipo: "erro", mensagem: error.message };
  return data ? { tipo: "ok", versao: data.versao } : { tipo: "erro", mensagem: "Sem resposta do servidor." };
}

/** Grava só se a versão lida ainda for a atual; senão, outro aparelho salvou no meio. */
export async function salvarNuvem(cliente: ClientePlano, userId: string, quadro: Quadro, versao: number): Promise<Gravado> {
  if (!ehQuadro(quadro)) return { tipo: "erro", mensagem: "Quadro inválido." };
  const { data, error } = await cliente.from("plano").update({ dados: quadro }).eq("owner", userId).eq("versao", versao).select("versao").maybeSingle();
  if (error) return { tipo: "erro", mensagem: error.message };
  return data ? { tipo: "ok", versao: data.versao } : { tipo: "conflito" };
}
