import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

import { projects as allProjects, type Project } from "@/data/projects";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { getProjectAction } from "@/lib/projectAction";
import SectionHeader from "@/components/SectionHeader";

const byNewest = [...allProjects].reverse();

/** Landing pages e "o resto" viram duas seções distintas na home. */
export const landingProjects = byNewest.filter(
  project => project.category === "Landing Page"
);
export const otherProjects = byNewest.filter(
  project => project.category !== "Landing Page"
);

/**
 * Carrossel de projetos com setas circulares no cabeçalho, no espírito da
 * seção de depoimentos da referência.
 *
 * O card mudou de forma: os screenshots são ~2.15:1, e num card alto com
 * `object-fit: cover` só sobrava uma tira vertical da imagem. Agora a foto tem
 * moldura própria em 16/9 no topo (ancorada em `top center`, que é a parte
 * reconhecível de um site) e o texto vem embaixo no painel escuro.
 */
function ProjectCard({ project, lang }: { project: Project; lang: Lang }) {
  const t = getStrings(lang);
  const action = getProjectAction(project, lang);
  const category = t.projects.categories[project.category] ?? project.category;

  const body = (
    <>
      <div className="pslider-card-media">
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className="pslider-card-body">
        <span className="mono-label text-[11px] text-white/60">{category}</span>

        <h3 className="text-[22px] font-medium leading-tight tracking-[-0.04em] text-white">
          {project.title}
        </h3>

        <p className="project-clamp text-[14px] leading-relaxed text-white/70">
          {project.description[lang]}
        </p>

        <span className="mono-label mt-auto inline-flex items-center gap-1.5 pt-4 text-[11px] text-white">
          {action.label}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </>
  );

  const className = "pslider-card group";

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={project.title}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className} aria-label={project.title}>
      {body}
    </Link>
  );
}

export default function ProjectsShowcase({
  id,
  eyebrow,
  title,
  subtitle,
  projects,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  projects: Project[];
}) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  // Depois de um scroll lateral, o navegador "prende" o gesto no carrossel
  // (scroll latching) e a rodinha/trackpad vertical para de descer a página.
  // O eixo é decidido uma vez por gesto (e liberado numa pausa), então a inércia
  // horizontal do trackpad nunca engole a rolagem vertical seguinte.
  // Precisa de listener nativo: o onWheel do React é passivo e não permite
  // preventDefault.
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    let axis: "x" | "y" | null = null;
    let idle = 0;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // pinch-zoom

      // Pausa entre eventos = gesto terminou; o próximo escolhe o eixo de novo.
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        axis = null;
      }, 140);

      if (!axis) {
        const dx = Math.abs(event.deltaX);
        const dy = Math.abs(event.deltaY);
        if (dx < 1 && dy < 1) return;
        axis = dx > dy ? "x" : "y";
      }

      if (axis === "x") return; // carrossel rola nativo

      event.preventDefault();
      // deltaMode 1 = linhas (Firefox com mouse); converte pra pixels.
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      // "instant": a rodinha nativa é imediata; sem isso o scroll-behavior
      // smooth global deixa a rolagem elástica só em cima do carrossel.
      window.scrollBy({ top: dy, behavior: "instant" });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(idle);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const scrollByCard = (direction: -1 | 1) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 420) + 24;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (projects.length === 0) return null;

  return (
    <section id={id} className="section-box section-pad scroll-mt-24">
      <div className="container padding-global">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={
            <div className="flex gap-3">
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                aria-label={t.projects.prev}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                aria-label={t.projects.next}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          }
        />

        <div
          ref={sliderRef}
          onScroll={updateArrows}
          data-anim="card-reveal"
          data-anim-children
          className="pslider mt-12 sm:mt-16"
        >
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
