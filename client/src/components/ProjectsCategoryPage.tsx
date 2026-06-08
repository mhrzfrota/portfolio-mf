import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Layers,
} from "lucide-react";
import { Link } from "wouter";

import {
  categories,
  projects as allProjects,
  type Project,
} from "@/data/projects";
import { cn } from "@/lib/utils";

export default function ProjectsCategoryPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleProjects = useMemo(() => {
    if (activeCategory === "Todos") return allProjects;
    return allProjects.filter(project => project.category === activeCategory);
  }, [activeCategory]);

  const safeIndex = visibleProjects.length
    ? Math.min(activeIndex, visibleProjects.length - 1)
    : 0;
  const activeProject = visibleProjects[safeIndex] ?? allProjects[0];
  const primaryAction = getProjectAction(activeProject);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  const goToProject = (index: number) => {
    setActiveIndex(index);
  };

  const shiftProject = (direction: "previous" | "next") => {
    setActiveIndex(current => {
      const total = visibleProjects.length;
      if (!total) return 0;
      const normalized = Math.min(current, total - 1);
      return direction === "next"
        ? (normalized + 1) % total
        : (normalized - 1 + total) % total;
    });
  };

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-border bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-blue)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-green)]" />
              01 · Projetos
            </span>
            <h2 className="font-display text-4xl tracking-tight md:text-6xl">
              Cases em destaque
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Cards diretos, com foco no resultado de cada entrega.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all",
                    active
                      ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-white"
                      : "border-border bg-card text-foreground/70 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <article
          className="project-showcase-card relative min-h-[46rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--brand-ink)] p-5 text-white shadow-[0_24px_80px_rgba(13,30,80,0.16)] sm:min-h-[43rem] md:h-[36rem] md:min-h-0 md:p-8 lg:h-[34rem]"
          aria-live="polite"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--brand-blue)]/40 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[var(--brand-green)]/30 blur-3xl" />

          <div
            key={`content-${activeProject.id}`}
            className="project-showcase-fade relative z-10 grid h-full gap-8 md:grid-cols-[0.92fr_1.08fr] md:items-center md:pb-16"
          >
            <div className="flex h-full min-w-0 flex-col justify-between gap-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-ink)] text-lg font-black text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
                  {getCategoryMark(activeProject.category)}
                </span>
                <span className="max-w-full break-words rounded-full bg-white/75 px-4 py-2 text-xs font-semibold text-[var(--brand-ink)] backdrop-blur">
                  @{activeProject.tags[0]} · {activeProject.category}
                </span>
              </div>

              <div className="min-w-0 max-w-md space-y-4">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                  <Layers className="h-4 w-4" />
                  {String(safeIndex + 1).padStart(2, "0")} de{" "}
                  {String(visibleProjects.length).padStart(2, "0")}
                </p>
                <h3 className="project-showcase-title break-words font-display text-2xl font-black leading-tight sm:text-3xl md:text-5xl">
                  {activeProject.title}
                </h3>
                <p className="project-showcase-description break-words text-sm leading-relaxed text-white/82 md:text-base">
                  {activeProject.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeProject.tags.slice(0, 4).map(tag => (
                    <span
                      key={tag}
                      className="max-w-full break-words rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white/90 backdrop-blur"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ProjectLink
                  project={activeProject}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-ink)] px-7 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[var(--brand-ink)]"
                >
                  {primaryAction.label}
                  {primaryAction.external ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </ProjectLink>

                <a
                  href={activeProject.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[var(--brand-ink)]"
                  aria-label={`Abrir repositório de ${activeProject.title}`}
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="relative flex items-center justify-center md:justify-end">
              <ProjectLink
                project={activeProject}
                className="project-showcase-image group relative w-full max-w-[34rem] overflow-hidden rounded-[1.6rem] border-[10px] border-white bg-white shadow-[0_26px_70px_rgba(0,0,0,0.22)]"
              >
                <span className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--brand-ink)] shadow-lg backdrop-blur transition-transform group-hover:scale-105">
                  {primaryAction.external ? (
                    <ExternalLink className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </span>
                <img
                  src={activeProject.image}
                  alt={activeProject.title}
                  className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </ProjectLink>
            </div>
          </div>

          <div className="relative z-20 mt-6 flex flex-wrap items-center justify-between gap-4 md:absolute md:bottom-8 md:left-8 md:right-8 md:mt-0">
            <div className="flex items-center gap-2">
              {visibleProjects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => goToProject(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    index === safeIndex
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/45 hover:bg-white/70"
                  )}
                  aria-label={`Mostrar projeto ${project.title}`}
                  aria-current={index === safeIndex}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftProject("previous")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition-all hover:bg-white hover:text-[var(--brand-ink)]"
                aria-label="Projeto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => shiftProject("next")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition-all hover:bg-white hover:text-[var(--brand-ink)]"
                aria-label="Próximo projeto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function getProjectAction(project: Project) {
  if (project.slug) {
    return {
      external: false,
      href: `/projetos/${project.slug}`,
      label: "Ver case",
    };
  }

  if (project.liveUrl !== "#") {
    return {
      external: true,
      href: project.liveUrl,
      label: "Exibir",
    };
  }

  return {
    external: true,
    href: project.repoUrl,
    label: "Código",
  };
}

function getCategoryMark(category: Project["category"]) {
  return category === "Landing Page" ? "LP" : "W";
}

function ProjectLink({
  children,
  className,
  project,
}: {
  children: ReactNode;
  className: string;
  project: Project;
}) {
  const action = getProjectAction(project);

  if (!action.external) {
    return (
      <Link href={action.href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={action.href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}
