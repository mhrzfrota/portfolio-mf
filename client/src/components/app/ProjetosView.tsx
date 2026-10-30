import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { allProjectsByNewest } from "@/components/ProjectsShowcase";
import type { Project } from "@/data/projects";
import type { Lang } from "@/contexts/LanguageContext";
import type { UIStrings } from "@/i18n/strings";
import { getProjectAction } from "@/lib/projectAction";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { tocarClique } from "./som";

/**
 * Tamanho do card a partir da proporção real da imagem: a altura alvo vale
 * até o card bater na largura máxima; aí a altura cai junto. A foto nunca é
 * cortada nem esticada (regra da casa).
 */
function tamanho(proporcao: number, alturaAlvo: number, larguraMax: number) {
  const largura = Math.min(alturaAlvo * proporcao, larguraMax);
  return { largura, altura: largura / proporcao };
}

function Midia({ projeto, ativo }: { projeto: Project; ativo: boolean }) {
  const reduzido = usePrefersReducedMotion();
  if (ativo && projeto.video && !reduzido) {
    return (
      <video
        key={projeto.video}
        src={projeto.video}
        poster={projeto.image}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      />
    );
  }
  return (
    <img
      src={projeto.image}
      alt=""
      className="h-full w-full object-cover"
      draggable={false}
      loading={ativo ? "eager" : "lazy"}
    />
  );
}

/**
 * Tela 3, as criações: um carrossel com o projeto da vez no centro e os
 * vizinhos espiando dos lados. Setas, teclado (← →) e arraste no celular.
 */
export default function ProjetosView({ t, lang, ativa }: { t: UIStrings; lang: Lang; ativa: boolean }) {
  const lista = allProjectsByNewest;
  const [indice, setIndice] = useState(0);
  const [medidas, setMedidas] = useState({ altura: 340, larguraMax: 640, palco: 1000 });
  const palcoRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const [deslocamento, setDeslocamento] = useState(0);
  const toque = useRef<number | null>(null);

  const ir = useCallback(
    (novo: number) => {
      const alvo = Math.max(0, Math.min(lista.length - 1, novo));
      if (alvo !== indice) tocarClique("alto");
      setIndice(alvo);
    },
    [indice, lista.length],
  );

  // Altura dos cards acompanha a tela: menor no celular e em telas baixas.
  useLayoutEffect(() => {
    const medir = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const altura = w < 640 ? Math.min(240, h * 0.3) : Math.min(360, h * 0.36);
      setMedidas({ altura, larguraMax: Math.min(w * (w < 640 ? 0.82 : 0.62), 760), palco: palcoRef.current?.clientWidth ?? w });
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  // Centraliza o card ativo medindo onde ele está de verdade na trilha.
  useLayoutEffect(() => {
    const card = cardsRef.current[indice];
    if (!card) return;
    setDeslocamento(medidas.palco / 2 - (card.offsetLeft + card.offsetWidth / 2));
  }, [indice, medidas]);

  useEffect(() => {
    if (!ativa) return;
    const tecla = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "ArrowRight") ir(indice + 1);
      if (e.key === "ArrowLeft") ir(indice - 1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ativa, indice, ir]);

  const atual = lista[indice];
  const acao = getProjectAction(atual, lang);
  const temCase = Boolean(atual.slug) && acao.external;
  const categoria = t.projects.categories[atual.category] ?? atual.category;

  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="app-display text-[44px] sm:text-[56px]">{t.app.projectsView.title}</h1>
      <p className="app-muted mt-2 max-w-[460px] px-4 text-center text-[13.5px] leading-relaxed">{t.projects.subtitle}</p>

      <div
        ref={palcoRef}
        className="relative mt-6 w-screen overflow-hidden sm:mt-8"
        style={{ height: medidas.altura + 8 }}
        onTouchStart={e => (toque.current = e.touches[0].clientX)}
        onTouchEnd={e => {
          if (toque.current === null) return;
          const dx = e.changedTouches[0].clientX - toque.current;
          if (Math.abs(dx) > 45) ir(indice + (dx < 0 ? 1 : -1));
          toque.current = null;
        }}
      >
        <div
          className="absolute left-0 top-1/2 flex items-center gap-5 transition-transform duration-[650ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:gap-7"
          style={{ transform: `translate3d(${deslocamento}px,-50%,0)` }}
        >
          {lista.map((projeto, i) => {
            const ativo = i === indice;
            const { largura, altura } = tamanho(projeto.imageAspect, medidas.altura, medidas.larguraMax);
            return (
              <button
                key={projeto.id}
                type="button"
                ref={el => {
                  cardsRef.current[i] = el;
                }}
                onClick={() => {
                  if (!ativo) return ir(i);
                  tocarClique("alto");
                  const a = getProjectAction(projeto, lang);
                  if (a.external) window.open(a.href, "_blank", "noopener,noreferrer");
                  else window.location.assign(a.href);
                }}
                aria-label={ativo ? `${projeto.title}: ${getProjectAction(projeto, lang).label}` : projeto.title}
                aria-current={ativo ? "true" : undefined}
                tabIndex={Math.abs(i - indice) <= 1 ? 0 : -1}
                className="relative shrink-0 overflow-hidden rounded-[12px] outline-none transition-[opacity,transform,filter] duration-[650ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
                style={{
                  width: largura,
                  height: altura,
                  opacity: ativo ? 1 : 0.4,
                  transform: ativo ? "scale(1)" : "scale(0.86)",
                  filter: ativo ? "none" : "saturate(0.6)",
                  boxShadow: ativo ? "var(--app-shadow)" : "none",
                  background: "var(--app-row)",
                }}
              >
                {Math.abs(i - indice) <= 2 ? <Midia projeto={projeto} ativo={ativo} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div key={atual.id} className="app-pop mt-5 flex min-h-[108px] max-w-[520px] flex-col items-center px-5 text-center">
        <p className="text-[17px] font-semibold tracking-[-0.03em]">{atual.title}</p>
        <p className="app-muted mt-0.5 text-[12px] font-medium uppercase tracking-[0.06em]">{categoria}</p>
        <p className="app-muted mt-2 line-clamp-2 text-[13px] leading-relaxed">{atual.description[lang]}</p>
        <div className="mt-3 flex items-center gap-2">
          {acao.external ? (
            <a
              href={acao.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => tocarClique("alto")}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={{ background: "var(--app-ink)", color: "var(--app-bg)" }}
            >
              {acao.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link
              href={acao.href}
              onClick={() => tocarClique("alto")}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={{ background: "var(--app-ink)", color: "var(--app-bg)" }}
            >
              {acao.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {temCase ? (
            <Link
              href={`/projetos/${atual.slug}`}
              onClick={() => tocarClique("alto")}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={{ background: "var(--app-row)" }}
            >
              {t.projects.viewProject}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => ir(indice - 1)}
          disabled={indice === 0}
          aria-label={t.projects.prev}
          className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
          style={{ background: "var(--app-row)" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="app-muted min-w-[64px] text-center font-mono text-[12px] tabular-nums" aria-live="polite">
          {String(indice + 1).padStart(2, "0")} {t.app.projectsView.of} {String(lista.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => ir(indice + 1)}
          disabled={indice === lista.length - 1}
          aria-label={t.projects.next}
          className="flex h-9 w-9 items-center justify-center rounded-full outline-none transition-opacity disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
          style={{ background: "var(--app-row)" }}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
