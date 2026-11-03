import { createClient } from "@supabase/supabase-js";
export function admin() {
  const url = process.env.VITE_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function acharUsuario(
  db: ReturnType<typeof admin>,
  identificador: string
) {
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(identificador))
    return { id: identificador, email: undefined };
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;
    const u = data.users.find(
      x => x.email?.toLowerCase() === identificador.toLowerCase()
    );
    if (u) return u;
    if (data.users.length < 100) break;
  }
  throw new Error(`Usuário não encontrado: ${identificador}`);
}
