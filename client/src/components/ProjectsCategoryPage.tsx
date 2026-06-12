import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Github } from "lucide-react";
import { Link } from "wouter";

import {
  categories,
  projects as allProjects,
  type Project,
} from "@/data/projects";
import SectionBadge from "@/components/SectionBadge";
import { cn } from "@/lib/utils";

const projectsByNewest = [...allProjects].reverse();

export default function ProjectsCategoryPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const visibleProjects = useMemo(() => {
    if (activeCategory === "Todos") return projectsByNewest;
    return projectsByNewest.filter(
      project => project.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <div className="bg-muted pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <SectionBadge number="1" label="Projetos em destaque" />

        <div className="mb-10 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between lg:mb-16">
          <h2 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[clamp(2.5rem,5vw,4.2rem)]">
            Cases em destaque
          </h2>

          <div className="flex flex-wrap gap-2 md:pb-3">
            {categories.map(category => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                    active
                      ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-white dark:border-white dark:bg-white dark:text-[var(--brand-ink)]"
                      : "border-border bg-card text-muted-foreground hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:gap-x-6 md:grid-cols-2 lg:gap-x-7 lg:gap-y-12">
          {visibleProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              dark={index % 2 === 1}
            />
          ))}
        </div>
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
      label: "Ver projeto",
    };
  }

  return {
    external: true,
    href: project.repoUrl,
    label: "Ver código",
  };
}

function ProjectCard({ project, dark }: { project: Project; dark: boolean }) {
  const action = getProjectAction(project);

  return (
    <div>
      <ActionLink
        action={action}
        className="group relative block aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-card"
        ariaLabel={`${action.label}: ${project.title}`}
      >
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Botão circular que expande no hover */}
        <span
          className={cn(
            "absolute bottom-4 left-4 flex h-9 max-w-9 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full pl-[11px] pr-3.5 transition-all duration-300 ease-in-out group-hover:max-w-[200px]",
            dark ? "bg-[var(--brand-ink)] text-white" : "bg-white text-gray-900"
          )}
        >
          <ArrowRight
            size={14}
            className="shrink-0 -rotate-45 transition-transform duration-300 group-hover:rotate-0"
          />
          <span className="text-[13px] font-medium opacity-0 transition-opacity delay-100 duration-300 group-hover:opacity-100">
            {action.label}
          </span>
        </span>
      </ActionLink>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground sm:text-[15px]">
            {project.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
            {project.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <a
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
          aria-label={`Abrir repositório de ${project.title}`}
        >
          <Github size={15} />
        </a>
      </div>
    </div>
  );
}

function ActionLink({
  action,
  className,
  ariaLabel,
  children,
}: {
  action: ReturnType<typeof getProjectAction>;
  className: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (!action.external) {
    return (
      <Link href={action.href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={action.href}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
