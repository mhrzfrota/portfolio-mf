import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { projects } from "@/data/projects";
import { getProjectAction } from "@/components/ProjectsCategoryPage";
import LazyVideo from "@/components/LazyVideo";
import { Link } from "wouter";

/* Colagem estilo Budarina: os projetos são a única cor da página.
   Spans assimétricos num grid de 6 colunas, 2 fileiras no desktop. */
const SPANS = [
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-4",
];

export default function BentoCollage() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const reduced = usePrefersReducedMotion();
  const featured = projects.filter(p => p.featured).slice(0, SPANS.length);

  return (
    <div className="bg-background pb-4 pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <h2
          data-reveal
          className="mb-8 text-[clamp(1.75rem,5vw,3.5rem)] font-semibold tracking-[-0.04em] text-foreground sm:mb-10"
        >
          {t.projects.title}
        </h2>

        <div
          data-reveal
          className="reveal-delay-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:gap-5"
        >
          {featured.map((project, index) => {
            const action = getProjectAction(project, lang);
            const media = reduced || !project.video ? (
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <LazyVideo
                src={project.video}
                poster={project.image}
                title={project.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            );

            const tileInner = (
              <>
                {media}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {project.title}
                  </span>
                  <span className="scribble shrink-0 text-[13px] text-white">
                    {t.bento.viewCase}
                  </span>
                </span>
              </>
            );

            const tileClass = `group relative block aspect-[16/11] overflow-hidden rounded-2xl bg-card shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)] md:aspect-auto md:h-[240px] lg:h-[300px] ${SPANS[index]}`;

            return action.external ? (
              <a
                key={project.id}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${action.label}: ${project.title}`}
                className={tileClass}
              >
                {tileInner}
              </a>
            ) : (
              <Link
                key={project.id}
                href={action.href}
                aria-label={`${action.label}: ${project.title}`}
                className={tileClass}
              >
                {tileInner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
