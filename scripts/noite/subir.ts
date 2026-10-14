import { createClient } from "@supabase/supabase-js";
import type { Relatorio } from "../../shared/noite/relatorio.ts";
import type { Log } from "./processo.ts";
export async function subir(
  relatorio: Relatorio,
  seco: boolean,
  log: Log,
  env: NodeJS.ProcessEnv = process.env
): Promise<"seco" | "local" | "enviado"> {
  if (seco) {
    log("Supabase: modo seco, upload pulado");
    return "seco";
  }
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    log("Supabase: sem credenciais, relatório salvo só no Mac");
    return "local";
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = env.NOITE_OWNER_EMAIL ?? env.CEREBRO_OWNER_EMAIL;
  let owner: string | undefined;
  const usuarios: { id: string; email?: string }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw new Error("Supabase: falha ao listar usuários");
    usuarios.push(...data.users);
    if (email)
      owner = data.users.find(
        u => u.email?.toLowerCase() === email.toLowerCase()
      )?.id;
    if (owner || data.users.length < 100 || (!email && usuarios.length > 1))
      break;
  }
  owner ??= !email && usuarios.length === 1 ? usuarios[0].id : undefined;
  if (!owner)
    throw new Error(
      email
        ? "Supabase: dono não encontrado pelo e-mail configurado"
        : "Supabase: defina NOITE_OWNER_EMAIL (ou CEREBRO_OWNER_EMAIL), pois não há um único usuário"
    );
  const { error } = await db
    .from("noite_relatorios")
    .upsert(
      {
        owner,
        dia: relatorio.dia,
        versao: relatorio.versao,
        relatorio,
        gerado_em: relatorio.geradoEm,
      },
      { onConflict: "owner,dia" }
    );
  if (error) {
    if (["PGRST205", "42P01"].includes(error.code))
      throw new Error(
        "Tabela noite_relatorios inexistente. Rode supabase/migrations/0004_noite.sql no Supabase."
      );
    throw new Error("Supabase: falha no upsert de noite_relatorios");
  }
  log("Supabase: relatório enviado");
  return "enviado";
}
