import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import InternalAccount from "./InternalAccount";

export const ABAS = [
  { href: "/calendario", nome: "Calendário", icone: CalendarDays },
  { href: "/plano", nome: "Plano", icone: KanbanSquare },
] as const;

/**
 * Casca do sistema interno: barra fixa com as duas ferramentas (Calendário e
 * Plano) e a conta. Fundo escuro neutro e largura total, para o calendário e
 * o quadro usarem a tela inteira.
 */
export default function InternalShell({ title, children }: { title: string; children: ReactNode }) {
  const [local] = useLocation();
  useEffect(() => {
    const anterior = document.title;
    document.title = `${title} · MF`;
    return () => {
      document.title = anterior;
    };
  }, [title]);

  return (
    <div className="interno min-h-dvh bg-[#0B0C10] font-sans text-white antialiased [color-scheme:dark]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0B0C10]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg pr-1 text-[15px] font-semibold tracking-tight" title="Voltar ao portfólio">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0C2AFE] text-[12px] font-bold">MF</span>
            <span className="hidden sm:inline">Interno</span>
          </Link>
          <nav aria-label="Ferramentas" className="mx-auto flex rounded-xl bg-white/[0.06] p-1 sm:mx-0 sm:ml-4">
            {ABAS.map(({ href, nome, icone: Icone }) => {
              const ativa = local.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={ativa ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors sm:px-3.5",
                    ativa ? "bg-white/[0.14] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]" : "text-white/60 hover:text-white",
                  )}
                >
                  <Icone size={15} strokeWidth={2} />
                  {nome}
                </Link>
              );
            })}
          </nav>
          <div className="sm:ml-auto">
            <InternalAccount />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1680px] px-3 pb-10 pt-4 sm:px-6 sm:pt-5">{children}</main>
    </div>
  );
}
