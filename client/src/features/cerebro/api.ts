import { supabase } from "@/lib/supabase";
import type { DadosCerebro, NotaCerebro, SyncCerebro } from "./types";

const COLUNAS = "path,pasta,titulo,tags,status,links,palavras,tokens,resumo,modificado";

export async function carregarCerebro(): Promise<DadosCerebro> {
  if (!supabase) throw new Error("O Supabase ainda não foi configurado.");

  const [notasRes, syncRes] = await Promise.all([
    supabase.from("cerebro_notas").select(COLUNAS).order("modificado", { ascending: false }),
    supabase.from("cerebro_sync").select("executado_em,notas,tokens,duracao_ms,foco").order("executado_em", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (notasRes.error) throw new Error(notasRes.error.message);
  if (syncRes.error) throw new Error(syncRes.error.message);

  return {
    notas: (notasRes.data ?? []) as NotaCerebro[],
    sync: (syncRes.data as SyncCerebro | null) ?? null,
  };
}
