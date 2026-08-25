import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

function requestedPath(): "/board" | "/habitos" {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  return requested === "/habitos" ? "/habitos" : "/board";
}

function AccessShell({ children }: { children: ReactNode }) {
  return (
    <div className="board-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 font-sans text-white sm:px-6">
      <div
        aria-hidden="true"
        className="board-blob left-[-15%] top-[-15%] h-[55vh] w-[55vh] bg-[var(--sky)]/45"
      />
      <div
        aria-hidden="true"
        className="board-blob bottom-[-25%] right-[-10%] h-[65vh] w-[65vh] bg-white/25 [animation-delay:-13s] [animation-duration:32s]"
      />

      <main className="board-glass board-col-in relative z-10 w-full max-w-[420px] rounded-[28px] p-5 sm:p-7">
        {children}
      </main>
    </div>
  );
}

function ConfigurationNotice() {
  return (
    <AccessShell>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-blue-dark)]">
          <KeyRound className="h-5 w-5" />
        </div>
        <Link
          href="/"
          aria-label="Voltar ao início"
          className="rounded-full p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <p className="mono-label mt-6 text-[10px] text-white/60">
        MF · acesso interno
      </p>
      <h1 className="mt-2 text-[27px] font-medium tracking-[-0.04em]">
        Conecte o Supabase
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-white/70">
        Crie um arquivo <code className="text-white">.env.local</code> na raiz e
        informe as duas variáveis abaixo. Reinicie o servidor depois de salvar.
      </p>
      <pre className="mt-5 overflow-x-auto rounded-2xl bg-[#00104f]/30 p-4 text-[11px] leading-relaxed text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
        <code>{`VITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=`}</code>
      </pre>
    </AccessShell>
  );
}

export default function Login() {
  const { status, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Acesso interno · MF";
    return () => {
      document.title = previous;
    };
  }, []);

  if (status === "authenticated") {
    return <Redirect to={requestedPath()} replace />;
  }

  if (status === "unconfigured") return <ConfigurationNotice />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const authError = await signIn(email.trim(), password);
    if (authError) {
      setError(
        authError.toLowerCase().includes("invalid login")
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar agora. Confira os dados e tente novamente."
      );
      setSubmitting(false);
    }
  };

  return (
    <AccessShell>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-blue-dark)] shadow-[0_8px_24px_rgba(0,16,80,0.2)]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <Link
          href="/"
          aria-label="Voltar ao início"
          className="rounded-full p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <p className="mono-label mt-6 text-[10px] text-white/60">
        MF · acesso interno
      </p>
      <h1 className="mt-2 text-[30px] font-medium tracking-[-0.05em]">
        Bem-vindo de volta
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-white/65">
        Entre com o usuário cadastrado no Supabase para acessar o Board e seus
        Hábitos.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label
            htmlFor="internal-email"
            className="mono-label mb-2 block text-[9px] text-white/70"
          >
            E-mail
          </label>
          <input
            id="internal-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="username"
            required
            autoFocus
            placeholder="voce@exemplo.com"
            className="w-full rounded-2xl bg-white/14 px-4 py-3.5 text-[14px] text-white outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/80"
          />
        </div>

        <div>
          <label
            htmlFor="internal-password"
            className="mono-label mb-2 block text-[9px] text-white/70"
          >
            Senha
          </label>
          <span className="relative block">
            <input
              id="internal-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Sua senha"
              className="w-full rounded-2xl bg-white/14 py-3.5 pl-4 pr-12 text-[14px] text-white outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/80"
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-white/12 px-3.5 py-3 text-[13px] leading-snug text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-[13px] font-semibold text-[var(--brand-blue-dark)] transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting || status === "loading" ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Verificando
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <p className="mono-label mt-5 text-center text-[8px] leading-relaxed text-white/45">
        Área restrita · sessão protegida pelo Supabase
      </p>
    </AccessShell>
  );
}
