import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

/**
 * Mantemos o cliente opcional para o portfólio público continuar abrindo mesmo
 * antes de as variáveis do Supabase serem configuradas no ambiente.
 */
export const supabase = (() => {
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  } catch {
    // Uma URL incompleta não pode derrubar as páginas públicas do portfólio.
    return null;
  }
})();

export const isSupabaseConfigured = Boolean(supabase);
