import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { Link } from "wouter";

import {
  categories,
  projects as allProjects,
  type Project,
} from "@/data/projects";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

const projectsByNewest = [...allProjects].reverse();

export default function ProjectsCategoryPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const { lang } = useLanguage();
  const t = getStrings(lang);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "Todos") return projectsByNewest;
    return projectsByNewest.filter(
      project => project.category === activeCategory
    );
  }, [activeCategory]);

  // Divide os projetos em duas fileiras, cada uma seu próprio carrossel.
  const midpoint = Math.ceil(filteredProjects.length / 2);
  const topRow = filteredProjects.slice(0, midpoint);
  const bottomRow = filteredProjects.slice(midpoint);

  return (
    <div className="bg-background pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-6 sm:mb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[clamp(2.5rem,5vw,4.2rem)]">
            {t.projects.title}
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
                  {t.projects.categories[category] ?? category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <ProjectRow
            projects={topRow}
            resetKey={activeCategory}
            ariaLabel={t.projects.rowTop}
          />
          {bottomRow.length > 0 && (
            <ProjectRow
              projects={bottomRow}
              resetKey={activeCategory}
              ariaLabel={t.projects.rowBottom}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  projects,
  resetKey,
  ariaLabel,
}: {
  projects: Project[];
  resetKey: string;
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Volta ao início quando troca o filtro.
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
  }, [resetKey]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 6) {
      drag.current.moved = true;
      // Evita que o navegador tente arrastar o link ou a mídia do card.
      event.preventDefault();
    }
    event.currentTarget.scrollLeft = drag.current.scrollLeft - distance;
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    // O click gerado logo após o pointerup ainda enxerga `moved`; depois dele,
    // libera o próximo clique normal mesmo se o ponteiro terminou fora do card.
    if (drag.current.moved) {
      window.setTimeout(() => {
        drag.current.moved = false;
      }, 0);
    }
  };

  // Se o clique veio de um arraste, cancela pra não abrir o projeto sem querer.
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "project-row flex gap-5 overflow-x-auto scroll-smooth pb-2",
        isDragging ? "cursor-grabbing select-none" : "cursor-grab"
      )}
      role="region"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      onDragStart={event => event.preventDefault()}
    >
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          dark={index % 2 === 1}
        />
      ))}
    </div>
  );
}

/**
 * Se o projeto está no ar, o botão leva ao site ("Acessar projeto").
 * Senão, "Ver projeto" leva à página do case ou, na falta dela, ao repositório.
 */
function getProjectAction(project: Project, lang: Lang) {
  const t = getStrings(lang);

  if (project.liveUrl !== "#") {
    return {
      external: true,
      href: project.liveUrl,
      label: t.projects.visitProject,
    };
  }

  if (project.slug) {
    return {
      external: false,
      href: `/projetos/${project.slug}`,
      label: t.projects.viewProject,
    };
  }

  return {
    external: true,
    href: project.repoUrl,
    label: t.projects.viewProject,
  };
}

function ProjectCard({ project, dark }: { project: Project; dark: boolean }) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const action = getProjectAction(project, lang);

  return (
    <div className="w-[85vw] shrink-0 snap-start sm:w-[440px] lg:w-[600px]">
      <ActionLink
        action={action}
        // aspect fixo em todos os cards: mídia sempre do mesmo tamanho, seja
        // vídeo ou imagem — o object-cover recorta o que sobra.
        className="group relative block aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl bg-card"
        ariaLabel={`${action.label}: ${project.title}`}
      >
        {project.video ? (
          <video
            src={project.video}
            poster={project.image}
            autoPlay
            loop
            muted
            playsInline
            draggable={false}
            aria-label={project.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}

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

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground sm:text-[16px]">
            {project.title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-0.5 flex shrink-0 gap-2">
          {project.liveUrl !== "#" && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
              aria-label={`${t.projects.visitProject}: ${project.title}`}
            >
              <ExternalLink size={15} />
            </a>
          )}
          {project.repoUrl !== "#" && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
              aria-label={`${t.projects.openRepo} ${project.title}`}
            >
              <Github size={15} />
            </a>
          )}
        </div>
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
      <Link
        href={action.href}
        className={className}
        aria-label={ariaLabel}
        draggable={false}
      >
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
      draggable={false}
    >
      {children}
    </a>
  );
}
