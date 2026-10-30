import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { tocarClique } from "./som";

/**
 * Janela por cima da tela (2026-10-29), no lugar das seções longas: "Minha
 * história", Stack, Soluções, Como eu trabalho e Notas abrem aqui. Fecha no
 * X, no Esc e no clique fora; trava o scroll da página e devolve o foco a
 * quem abriu.
 */
export default function Janela({
  titulo,
  aberta,
  aoFechar,
  fecharRotulo,
  children,
}: {
  titulo: string;
  aberta: boolean;
  aoFechar: () => void;
  fecharRotulo: string;
  children: ReactNode;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberta) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div
      className="app-fade fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-[6px] sm:items-center sm:p-6"
      onMouseDown={e => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="app-pop relative flex max-h-[86dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-[14px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ background: "var(--app-sheet)", outline: "1px solid var(--app-line)" }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6 sm:px-7 sm:pt-7">
          <h2 className="app-display text-[26px] sm:text-[30px]">{titulo}</h2>
          <button
            ref={fecharRef}
            type="button"
            onClick={() => {
              tocarClique("baixo");
              aoFechar();
            }}
            aria-label={fecharRotulo}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "var(--app-ink)", color: "var(--app-bg)", outlineColor: "var(--app-accent)" }}
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-7 sm:px-7">{children}</div>
      </div>
    </div>
  );
}
