import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unconfigured";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured"
  );

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    // getUser valida o token salvo com o servidor antes de liberar as rotas.
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      const currentUser = error ? null : data.user;
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      // INITIAL_SESSION vem do storage local. Aguardamos getUser validá-la com
      // o Supabase antes de renderizar qualquer ferramenta privada.
      if (event === "INITIAL_SESSION") return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        if (!supabase) return "O Supabase ainda não foi configurado.";
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return error.message;

        setUser(data.user);
        setStatus("authenticated");
        return null;
      },
      signOut: async () => {
        if (!supabase) return "O Supabase ainda não foi configurado.";
        const { error } = await supabase.auth.signOut();
        if (error) return error.message;

        setUser(null);
        setStatus("unauthenticated");
        return null;
      },
    }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider");
  }
  return context;
}
