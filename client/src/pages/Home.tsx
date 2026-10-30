import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getStrings } from "@/i18n/strings";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import Dock, { type Tela } from "@/components/app/Dock";
import Janela from "@/components/app/Janela";
import PerfilView, { HistoriaConteudo } from "@/components/app/PerfilView";
import ProjetosView from "@/components/app/ProjetosView";
import TrabalhoView, { ConteudoDoPainel, type Painel } from "@/components/app/TrabalhoView";

/**
 * Home em formato de app (2026-10-29), no visual da referência que o Matheus
 * escolheu (willradoux.com): uma tela por vez no centro e o dock embaixo.
 * O conteúdo é o mesmo da home antiga (git, antes deste commit), redistribuído:
 * Perfil = início e contato; Trabalho = história (sobre), stack, soluções,
 * processo e blog; Projetos = todos os cases.
 *
 * O endereço guarda a tela no hash (#trabalho, #projetos) e entende as
 * âncoras antigas (#sobre, #combos, #blog, #contato), que ainda chegam de
 * links salvos e das páginas de case.
 */
type Janela = "historia" | Painel | null;

const ORDEM: Tela[] = ["perfil", "trabalho", "projetos"];

function lerHash(): { tela: Tela; janela: Janela } {
  const h = window.location.hash.replace("#", "");
  if (h === "projetos") return { tela: "projetos", janela: null };
  if (h === "trabalho" || h === "stack") return { tela: "trabalho", janela: null };
  if (h === "combos" || h === "solucoes") return { tela: "trabalho", janela: "solucoes" };
  if (h === "blog") return { tela: "trabalho", janela: "notas" };
  if (h === "sobre") return { tela: "trabalho", janela: "historia" };
  return { tela: "perfil", janela: null };
}

function useAbertura() {
  const reduzido = usePrefersReducedMotion();
  const [mostrar, setMostrar] = useState(() => {
    try {
      return !sessionStorage.getItem("mf-abertura");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!mostrar) return;
    try {
      sessionStorage.setItem("mf-abertura", "1");
    } catch {
      // Sem armazenamento: a abertura só roda nesta carga.
    }
    const id = window.setTimeout(() => setMostrar(false), reduzido ? 0 : 1500);
    return () => window.clearTimeout(id);
  }, [mostrar, reduzido]);
  return mostrar && !reduzido;
}

export default function Home() {
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = getStrings(lang);
  const [{ tela, janela }, setEstado] = useState(() => lerHash());
  const [direcao, setDirecao] = useState(0);
  const abertura = useAbertura();

  // Âncora nova (voltar do navegador, link de outra página) troca a tela.
  useEffect(() => {
    const aoMudar = () => setEstado(lerHash());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);

  useEffect(() => {
    document.title = tela === "perfil" ? "Matheus Frota · MF Services" : `${tela === "trabalho" ? t.app.work.title : t.app.projectsView.title} · Matheus Frota`;
  }, [tela, t]);

  const trocar = useCallback(
    (nova: Tela) => {
      if (nova === tela) return;
      setDirecao(ORDEM.indexOf(nova) > ORDEM.indexOf(tela) ? 1 : -1);
      setEstado({ tela: nova, janela: null });
      const url = nova === "perfil" ? window.location.pathname : `#${nova}`;
      window.history.replaceState(null, "", url);
      window.scrollTo({ top: 0 });
    },
    [tela],
  );

  const abrir = useCallback((j: Exclude<Janela, null>) => setEstado(e => ({ ...e, janela: j })), []);
  const fechar = useCallback(() => setEstado(e => ({ ...e, janela: null })), []);

  const titulos: Record<Exclude<Janela, null>, string> = {
    historia: t.app.profile.story,
    stack: t.app.work.stack,
    solucoes: t.combos.title,
    processo: t.app.work.process,
    notas: t.blog.title,
  };

  return (
    <div className="mf-app relative min-h-dvh overflow-x-clip">
      <main className="flex min-h-dvh items-center justify-center px-4 pb-[120px] pt-10 sm:px-6 sm:pt-14">
        <div
          key={tela}
          className="app-view flex w-full justify-center"
          style={{ "--enter-x": `${direcao * 18}px` } as CSSProperties}
        >
          {tela === "perfil" ? <PerfilView t={t} aoAbrirProjetos={() => trocar("projetos")} /> : null}
          {tela === "trabalho" ? <TrabalhoView t={t} lang={lang} aoAbrir={abrir} /> : null}
          {tela === "projetos" ? <ProjetosView t={t} lang={lang} ativa /> : null}
        </div>
      </main>

      <Dock
        t={t}
        tela={tela}
        aoTrocar={trocar}
        tema={theme === "dark" ? "dark" : "light"}
        aoTrocarTema={() => toggleTheme?.()}
        aoTrocarIdioma={toggleLang}
      />

      <Janela titulo={janela ? titulos[janela] : ""} aberta={janela !== null} aoFechar={fechar} fecharRotulo={t.app.close}>
        {janela === "historia" ? <HistoriaConteudo t={t} /> : null}
        {janela && janela !== "historia" ? <ConteudoDoPainel painel={janela} t={t} lang={lang} /> : null}
      </Janela>

      {abertura ? (
        <div className="app-intro fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "var(--app-bg)" }} aria-hidden="true">
          <img src="/logo-topbar.png" alt="" className="h-9 w-auto dark:brightness-0 dark:invert sm:h-11" />
        </div>
      ) : null}
    </div>
  );
}
