import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, CalendarDays, ChevronsLeft, Clapperboard, KanbanSquare, Moon, Radar as RadarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import InternalAccount from "./InternalAccount";

export const ABAS = [
  { href: "/calendario", nome: "Calendário", icone: CalendarDays, dica: "Agenda e lembretes" },
  { href: "/plano", nome: "Plano", icone: KanbanSquare, dica: "Ideias, a fazer e feito" },
  { href: "/conteudo", nome: "Conteúdo", icone: Clapperboard, dica: "O post da semana e os orgânicos" },
  { href: "/noite", nome: "Noite", icone: Moon, dica: "Relatório da noite" },
  { href: "/radar", nome: "Radar", icone: RadarIcon, dica: "Prospecção" },
] as const;

const CHAVE = "mf-interno:sidebar-recolhida";
const lerRecolhida = () => {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
};

/**
 * Casca do sistema interno, tema claro. No computador, uma sidebar flutuante
 * que recolhe para só os ícones (lembra a escolha neste navegador), com uma
 * pílula azul que desliza até a aba ativa. No celular, um dock embaixo, ao
 * alcance do polegar, com a mesma pílula.
 */
export default function InternalShell({ title, children }: { title: string; children: ReactNode }) {
  const [local] = useLocation();
  const { papel } = useAuth();
  const abas = papel === "parceiro" ? ABAS.filter((aba) => aba.href === "/radar") : ABAS;
  const ativa = Math.max(0, abas.findIndex((aba) => local.startsWith(aba.href) || local.startsWith(`/dev${aba.href}`)));
  const [recolhida, setRecolhida] = useState(lerRecolhida);

  useEffect(() => {
    const anterior = document.title;
    document.title = `${title} · MF`;
    return () => {
      document.title = anterior;
    };
  }, [title]);

  const alternar = () => {
    setRecolhida((r) => {
      try {
        localStorage.setItem(CHAVE, r ? "0" : "1");
      } catch {
        /* sem armazenamento: só não lembra */
      }
      return !r;
    });
  };

  return (
    <div className="interno min-h-dvh bg-[var(--i-bg)] font-sans text-white antialiased [color-scheme:light]">
      {/* Sidebar (computador) */}
      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-40 hidden flex-col rounded-[22px] border border-[var(--i-linha)] bg-[var(--i-s1)] p-3 shadow-[0_1px_2px_rgba(20,22,27,0.04),0_12px_32px_-12px_rgba(20,22,27,0.14)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
          recolhida ? "w-[76px]" : "w-[236px]",
        )}
      >
        <div className="flex h-11 items-center gap-2.5 px-1.5">
          <Link href={papel === "parceiro" ? "/radar" : "/"} title="Voltar ao portfólio" className="cor-forte grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0C2AFE] text-[13px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(12,42,254,0.7)] transition-transform hover:scale-105">
            MF
          </Link>
          <div className={cn("min-w-0 transition-opacity duration-200", recolhida && "pointer-events-none opacity-0")}>
            <p className="truncate text-[15px] font-semibold leading-tight tracking-tight">Interno</p>
            <p className="truncate text-[11.5px] leading-tight text-white/45">MF Services</p>
          </div>
        </div>

        <nav aria-label="Ferramentas" className="relative mt-5 flex flex-col gap-1">
          <span
            aria-hidden
            className="cor-forte absolute left-0 right-0 top-0 h-11 rounded-[14px] bg-[#0C2AFE] shadow-[0_8px_20px_-8px_rgba(12,42,254,0.75)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            style={{ transform: `translateY(${ativa * 48}px)` }}
          />
          {abas.map(({ href, nome, icone: Icone, dica }, i) => {
            const eAtiva = i === ativa;
            return (
              <Link
                key={href}
                href={href}
                title={recolhida ? nome : dica}
                aria-current={eAtiva ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-[14px] px-3 text-[14px] font-medium transition-colors duration-200",
                  eAtiva ? "cor-forte text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                <Icone size={19} strokeWidth={2} className={cn("shrink-0 transition-transform duration-300", !eAtiva && "group-hover:-translate-y-px group-hover:scale-110")} />
                <span className={cn("truncate transition-opacity duration-200", recolhida && "pointer-events-none opacity-0")}>{nome}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-[var(--i-linha)] pt-3">
          {!recolhida && (
            <Link href="/" className="flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white">
              <ArrowUpRight size={15} /> Ver o portfólio
            </Link>
          )}
          <div className={cn("flex items-center gap-1 px-1.5", recolhida && "flex-col")}>
            <InternalAccount compacto={recolhida} />
            <button
              type="button"
              onClick={alternar}
              aria-label={recolhida ? "Abrir a barra lateral" : "Recolher a barra lateral"}
              title={recolhida ? "Abrir" : "Recolher"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronsLeft size={17} className={cn("transition-transform duration-300", recolhida && "rotate-180")} />
            </button>
          </div>
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b border-[var(--i-linha)] bg-[var(--i-bg)]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href={papel === "parceiro" ? "/radar" : "/"} className="cor-forte grid h-8 w-8 place-items-center rounded-[10px] bg-[#0C2AFE] text-[12px] font-bold text-white">
          MF
        </Link>
        <span className="text-[15px] font-semibold tracking-tight">{abas[ativa]?.nome ?? "Interno"}</span>
        <div className="ml-auto">
          <InternalAccount compacto />
        </div>
      </header>

      <main
        className={cn(
          "px-4 pb-28 pt-4 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 lg:pb-10 lg:pr-6 lg:pt-6",
          recolhida ? "lg:pl-[112px]" : "lg:pl-[272px]",
        )}
      >
        <div className="mx-auto max-w-[1680px]">{children}</div>
      </main>

      {/* Dock (celular) */}
      {abas.length > 1 && (
        <nav aria-label="Ferramentas" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 rounded-[22px] border border-[var(--i-linha)] bg-[var(--i-s1)]/95 p-1.5 shadow-[0_12px_32px_-10px_rgba(20,22,27,0.25)] backdrop-blur-xl lg:hidden">
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${abas.length}, minmax(0, 1fr))` }}>
            <span
              aria-hidden
              className="cor-forte absolute inset-y-0 left-0 rounded-[16px] bg-[#0C2AFE] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
              style={{ width: `${100 / abas.length}%`, transform: `translateX(${ativa * 100}%)` }}
            />
            {abas.map(({ href, nome, icone: Icone }, i) => (
              <Link
                key={href}
                href={href}
                aria-current={i === ativa ? "page" : undefined}
                className={cn("relative flex h-14 flex-col items-center justify-center gap-1 rounded-[16px] text-[11px] font-medium transition-colors", i === ativa ? "cor-forte text-white" : "text-white/55")}
              >
                <Icone size={20} strokeWidth={2} />
                {nome}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
