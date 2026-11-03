import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

function LoadingScreen() {
  return (
    <div className="board-bg flex min-h-dvh items-center justify-center px-6 text-white">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        <p className="mono-label mt-4 text-[10px] text-white/70">
          Verificando acesso
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  returnTo,
}: {
  children: ReactNode;
  returnTo: "/plano" | "/calendario" | "/noite" | "/radar";
}) {
  const { status, papel } = useAuth();

  if (status === "loading") return <LoadingScreen />;
  if (status === "authenticated") {
    if (!papel) return <LoadingScreen />;
    // Parceiro só tem o Radar.
    if (papel === "parceiro" && returnTo !== "/radar") return <Redirect to="/radar" replace />;
    return children;
  }

  return (
    <Redirect to={`/acesso?returnTo=${encodeURIComponent(returnTo)}`} replace />
  );
}
