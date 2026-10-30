import { useEffect, useRef, useState } from "react";
import { Languages, LayoutGrid, Lightbulb, Moon, Plus, Sun, Terminal, User, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";
import type { UIStrings } from "@/i18n/strings";
import { tocarClique, useSom } from "./som";

export type Tela = "perfil" | "trabalho" | "projetos";

const ABAS: { tela: Tela; Icone: typeof User }[] = [
  { tela: "perfil", Icone: User },
  { tela: "trabalho", Icone: Terminal },
  { tela: "projetos", Icone: Lightbulb },
];

/**
 * O dock da referência: as três telas num grupo e o "+" ao lado, que abre os
 * ajustes (tema, idioma, som e a área interna). A aba ativa fica no azul MF.
 */
export default function Dock({
  t,
  tela,
  aoTrocar,
  tema,
  aoTrocarTema,
  aoTrocarIdioma,
}: {
  t: UIStrings;
  tela: Tela;
  aoTrocar: (tela: Tela) => void;
  tema: "light" | "dark";
  aoTrocarTema: () => void;
  aoTrocarIdioma: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const { ligado, alternar } = useSom();
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("pointerdown", fora);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const rotulos: Record<Tela, string> = {
    perfil: t.app.dock.perfil,
    trabalho: t.app.dock.trabalho,
    projetos: t.app.dock.projetos,
  };

  const linhaAjuste = "flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[13px] text-white/90 transition-colors hover:bg-white/10 focus-visible:bg-white/10 outline-none";

  return (
    <div
      ref={raiz}
      className="fixed inset-x-0 z-40 flex justify-center"
      style={{ bottom: "max(18px, env(safe-area-inset-bottom))" }}
    >
      <div className="relative flex items-end gap-2.5">
        {aberto ? (
          <div
            role="menu"
            aria-label={t.app.dock.settings}
            className="app-pop absolute bottom-[calc(100%+10px)] left-0 right-0 min-w-[236px] rounded-[14px] p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            style={{ background: "var(--app-dock)" }}
          >
            <button type="button" role="menuitem" className={linhaAjuste} onClick={() => { tocarClique("baixo"); aoTrocarTema(); }}>
              {tema === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="flex-1">{t.app.settings.theme}</span>
              <span className="text-white/50">{tema === "dark" ? t.app.settings.dark : t.app.settings.light}</span>
            </button>
            <button type="button" role="menuitem" className={linhaAjuste} onClick={() => { tocarClique("baixo"); aoTrocarIdioma(); }}>
              <Languages className="h-4 w-4" />
              <span className="flex-1">{t.app.settings.lang}</span>
              <span className="text-white/50">{t.app.settings.langValue}</span>
            </button>
            <button type="button" role="menuitem" className={linhaAjuste} onClick={alternar}>
              {ligado ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="flex-1">{t.app.settings.sound}</span>
              <span className="text-white/50">{ligado ? t.app.settings.on : t.app.settings.off}</span>
            </button>
            <div className="mx-3 my-1 h-px bg-white/10" />
            <Link href="/calendario" role="menuitem" className={linhaAjuste} onClick={() => tocarClique("baixo")}>
              <LayoutGrid className="h-4 w-4" />
              <span className="flex-1">{t.app.settings.internal}</span>
            </Link>
          </div>
        ) : null}

        <nav
          aria-label={t.app.dock.label}
          className="flex items-center gap-1 rounded-[14px] p-1.5 shadow-[0_14px_36px_-14px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          style={{ background: "var(--app-dock)" }}
        >
          {ABAS.map(({ tela: aba, Icone }) => {
            const ativa = aba === tela;
            return (
              <button
                key={aba}
                type="button"
                onClick={() => {
                  if (!ativa) tocarClique("alto");
                  setAberto(false);
                  aoTrocar(aba);
                }}
                aria-label={rotulos[aba]}
                aria-current={ativa ? "page" : undefined}
                title={rotulos[aba]}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] text-white outline-none transition-[background,transform] duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
                style={ativa ? { background: "var(--app-accent)" } : undefined}
              >
                <Icone className="h-[17px] w-[17px]" strokeWidth={2.1} />
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            tocarClique("baixo");
            setAberto(a => !a);
          }}
          aria-label={t.app.dock.settings}
          aria-expanded={aberto}
          aria-haspopup="menu"
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow-[0_14px_36px_-14px_rgba(0,0,0,0.55)] outline-none backdrop-blur-xl transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
          style={{ background: "var(--app-dock)" }}
        >
          <Plus className={`h-5 w-5 transition-transform duration-300 ${aberto ? "rotate-45" : ""}`} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
