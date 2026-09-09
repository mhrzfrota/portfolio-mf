import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

import { projects as allProjects, type Project } from "@/data/projects";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { getProjectAction } from "@/lib/projectAction";
import SectionHeader from "@/components/SectionHeader";
import {
  CoverflowCarousel,
  type CoverflowApi,
} from "@/components/ui/coverflow-carousel";

const byNewest = [...allProjects].reverse();

/** Landing pages e "o resto" viram duas seções distintas na home. */
export const landingProjects = byNewest.filter(
  project => project.category === "Landing Page"
);
export const otherProjects = byNewest.filter(
  project => project.category !== "Landing Page"
);

/**
 * Painel de informação do card: fica escondido e aparece com o mouse em cima
 * (ou com o foco no link), e no toque abre no clique — daí o `data-open`.
 *
 * Só monta no card da frente: nos cards rakeados o texto ficaria ilegível e o
 * link roubaria cliques que são pra girar o carrossel.
 */
function ProjectInfo({
  project,
  lang,
  open,
}: {
  project: Project;
  lang: Lang;
  open: boolean;
}) {
  const t = getStrings(lang);
  const action = getProjectAction(project, lang);
  const category = t.projects.categories[project.category] ?? project.category;

  const cta = (
    <span className="mono-label mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] text-[var(--brand-ink)] transition-colors hover:bg-white/85 sm:mt-4">
      {action.label}
      <ArrowUpRight className="h-4 w-4" />
    </span>
  );

  return (
    <div
      data-open={open}
      // pointer-events acompanha a opacidade: invisível não clica, senão o
      // link engoliria o toque no card fechado.
      className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[var(--brand-ink)] via-[var(--brand-ink)]/92 to-[var(--brand-ink)]/40 p-5 backdrop-blur-[2px] opacity-0 transition-opacity duration-500 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 data-[open=true]:pointer-events-auto data-[open=true]:opacity-100 sm:p-7"
    >
      <span className="mono-label text-[11px] text-white/60">{category}</span>

      <h3 className="mt-1 text-[19px] font-medium leading-tight tracking-[-0.04em] text-white sm:text-[26px]">
        {project.title}
      </h3>

      {/* O card nasce na proporção do screenshot (~2:1): no celular ele tem
          150px de altura e a descrição não cabe sem cortar. Fica no card,
          inteira, a partir do sm. */}
      <p className="mt-2 hidden line-clamp-3 max-w-[52ch] text-[13px] leading-relaxed text-white/70 sm:block sm:text-[14px]">
        {project.description[lang]}
      </p>

      <div>
        {action.external ? (
          <a
            href={action.href}
            target="_blank"
            rel="noreferrer"
            aria-label={project.title}
            onClick={event => event.stopPropagation()}
          >
            {cta}
          </a>
        ) : (
          <Link
            href={action.href}
            aria-label={project.title}
            onClick={event => event.stopPropagation()}
          >
            {cta}
          </Link>
        )}
      </div>
    </div>
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
  const api = useRef<CoverflowApi>(null);
  /** Card aberto no clique (toque). O hover não passa por aqui: é CSS. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (projects.length === 0) return null;

  const slides = projects.map(project => ({
    src: project.image,
    alt: project.title,
  }));

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
                onClick={() => api.current?.prev()}
                aria-label={t.projects.prev}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={() => api.current?.next()}
                aria-label={t.projects.next}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          }
        />

        <div data-anim="fade-up" className="mt-12 sm:mt-16">
          <CoverflowCarousel
            apiRef={api}
            slides={slides}
            label={title}
            // Os screenshots são ~2:1: o card nasce na proporção da foto, sem
            // cortar nem esticar. `top center` guarda a margem dos 2.16:1.
            aspect={2}
            cardWidth="clamp(260px, 72vw, 640px)"
            rotate={38}
            depth={0.34}
            perspective={2.2}
            fade={0.14}
            gap={0.08}
            cardClassName="group cursor-pointer bg-[var(--brand-ink)]"
            imageClassName="object-top"
            onSelect={() => setOpenIndex(null)}
            onCardClick={(index, isActive) => {
              if (isActive) setOpenIndex(openIndex === index ? null : index);
            }}
            renderOverlay={({ index, isActive }) =>
              isActive ? (
                <ProjectInfo
                  project={projects[index]}
                  lang={lang}
                  open={openIndex === index}
                />
              ) : null
            }
          />
        </div>
      </div>
    </section>
  );
}
