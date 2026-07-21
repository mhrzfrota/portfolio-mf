import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";

import { projects as allProjects, type Project } from "@/data/projects";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { getProjectAction } from "@/components/ProjectsCategoryPage";
import RollButton from "@/components/RollButton";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Projetos em destaque (curados manualmente), do mais recente pro mais antigo. */
const deckProjects = [...allProjects].reverse().filter(project => project.featured);

/** Scroll "gasto" por card; menor que 100svh pra vitrine inteira não ficar longa demais. */
const STEP_SVH = 80;

const pad = (value: number) => String(value).padStart(2, "0");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Vitrine empilhada: a seção ocupa N alturas de viewport e o palco fica
 * grudado (sticky) enquanto o scroll "gasta" essas alturas. O progresso do
 * scroll vira a posição de cada card: o ativo sobe, encolhe e escurece; o
 * próximo entra por baixo com uma leve inclinação 3D, como no site do Stride.
 */
export default function ProjectDeck() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const reducedMotion = usePrefersReducedMotion();

  const count = deckProjects.length;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [stageVisible, setStageVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      if (!section) return;

      const vh = window.innerHeight;
      const step = (section.offsetHeight - vh) / Math.max(count - 1, 1);
      const progress = clamp(
        -section.getBoundingClientRect().top / step,
        0,
        count - 1
      );

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const delta = index - progress;

        let y: number;
        let scale: number;
        let opacity: number;
        let dim: number;
        let tilt: number;

        if (delta >= 0) {
          // Esperando abaixo do centro; entra subindo e "desentortando".
          y = delta * 112;
          scale = 1;
          opacity = 1;
          dim = 0;
          tilt = Math.min(delta, 1) * 7;
        } else {
          // Saindo: sobe pouco, encolhe e escurece até sumir.
          y = delta * 46;
          scale = 1 + delta * 0.12;
          opacity = clamp(1 + delta * 1.1, 0, 1);
          dim = Math.min(-delta * 0.7, 0.7);
          tilt = 0;
        }

        card.style.transform = `translate3d(0, ${y}%, 0) scale(${scale}) rotateX(${tilt}deg)`;
        card.style.opacity = String(opacity);
        // Fora do alcance visual não precisa nem pintar.
        card.style.visibility =
          delta <= -1 || delta >= 1.4 ? "hidden" : "visible";
        card.style.setProperty("--deck-dim", String(dim));
      });

      const index = clamp(Math.round(progress), 0, count - 1);
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, reducedMotion]);

  // Vídeos: só o card ativo toca, e apenas com a vitrine na tela.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStageVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (stageVisible && index === active) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [active, stageVisible]);

  const activeProject = deckProjects[active];
  const activeAction = useMemo(
    () => getProjectAction(activeProject, lang),
    [activeProject, lang]
  );

  if (reducedMotion) {
    return (
      <div className="bg-background pb-10 pt-16 sm:pt-20 lg:pt-28">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 sm:px-8 lg:px-12">
          <h2 className="text-center text-[clamp(1.75rem,6vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
            {t.projects.title}
          </h2>
          {deckProjects.map(project => (
            <DeckCard key={project.id} project={project} lang={lang} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      role="region"
      aria-label={t.projects.deckAria}
      style={{ height: `${(count - 1) * STEP_SVH + 100}svh` }}
    >
      <div
        ref={stageRef}
        className="deck-stage sticky top-0 h-svh overflow-hidden bg-background"
      >
        <h2 className="pointer-events-none absolute inset-x-0 top-[6svh] text-center text-[clamp(1.75rem,6vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
          {t.projects.title}
        </h2>

        {deckProjects.map((project, index) => (
          <div
            key={project.id}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ zIndex: index + 1 }}
          >
            <div
              ref={element => {
                cardRefs.current[index] = element;
              }}
              className="deck-card pointer-events-auto h-[min(58svh,620px)] w-[min(90vw,1060px)]"
              style={{
                transform:
                  index === 0 ? undefined : `translate3d(0, ${index * 112}%, 0)`,
                visibility: index > 1 ? "hidden" : undefined,
              }}
            >
              <DeckCard
                project={project}
                lang={lang}
                videoRef={element => {
                  videoRefs.current[index] = element;
                }}
              />
            </div>
          </div>
        ))}

        {/* Contador à esquerda, no eixo do card, como na referência. */}
        <div
          className="absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 items-baseline gap-1.5 text-[15px] font-medium tracking-[0.08em] text-muted-foreground md:flex lg:left-12"
          aria-live="polite"
        >
          <span className="inline-block overflow-hidden">
            <span key={active} className="deck-count inline-block text-foreground">
              {pad(active + 1)}
            </span>
          </span>
          <span>/ {pad(count)}</span>
        </div>

        {/* Ação do projeto ativo, à direita. */}
        <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 md:block lg:right-12">
          <RollButton
            variant="dark"
            size="md"
            label={activeAction.label}
            href={activeAction.href}
            external={activeAction.external}
          />
        </div>

        {/* No mobile os controles viram uma barra flutuante embaixo. */}
        <div className="absolute inset-x-5 bottom-6 z-20 flex items-center justify-between md:hidden">
          <span
            className="rounded-full bg-background/75 px-3.5 py-2 text-[14px] font-medium tracking-[0.08em] text-muted-foreground backdrop-blur"
            aria-live="polite"
          >
            <span key={active} className="deck-count inline-block text-foreground">
              {pad(active + 1)}
            </span>{" "}
            / {pad(count)}
          </span>
          <RollButton
            variant="dark"
            size="sm"
            label={activeAction.label}
            href={activeAction.href}
            external={activeAction.external}
          />
        </div>
      </div>
    </section>
  );
}

function DeckCard({
  project,
  lang,
  videoRef,
}: {
  project: Project;
  lang: Lang;
  videoRef?: (element: HTMLVideoElement | null) => void;
}) {
  const action = getProjectAction(project, lang);

  return (
    <DeckCardLink
      external={action.external}
      href={action.href}
      ariaLabel={`${action.label}: ${project.title}`}
      className="group relative block h-full w-full overflow-hidden rounded-[24px] bg-card shadow-[0_30px_80px_rgba(2,6,19,0.35)] sm:rounded-[32px]"
    >
      {project.video ? (
        <video
          ref={videoRef}
          src={project.video}
          poster={project.image}
          preload="none"
          loop
          muted
          playsInline
          draggable={false}
          aria-label={project.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />
      )}

      <div className="deck-dim" />
    </DeckCardLink>
  );
}

function DeckCardLink({
  external,
  href,
  ariaLabel,
  className,
  children,
}: {
  external: boolean;
  href: string;
  ariaLabel: string;
  className: string;
  children: ReactNode;
}) {
  if (!external) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
