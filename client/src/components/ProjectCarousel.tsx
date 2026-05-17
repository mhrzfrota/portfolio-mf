import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectCarouselItem = {
  id: number;
  slug?: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  liveUrl: string;
  repoUrl: string;
  category: string;
};

type ProjectCarouselProps = {
  activeCategory: string;
  projects: ProjectCarouselItem[];
};

export default function ProjectCarousel({
  activeCategory,
  projects,
}: ProjectCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    hasDragged: false,
    scrollLeft: 0,
    startX: 0,
  });

  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateScrollState = () => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollPrevious(track.scrollLeft > 8);
    setCanScrollNext(track.scrollLeft < maxScrollLeft - 8);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({ left: 0 });
    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);

    return () => observer.disconnect();
  }, [activeCategory, projects.length]);

  const scrollByPage = (direction: "previous" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left:
        direction === "next"
          ? track.clientWidth * 0.82
          : -track.clientWidth * 0.82,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    dragState.current = {
      active: true,
      hasDragged: false,
      scrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    const dragDistance = event.clientX - dragState.current.startX;

    if (Math.abs(dragDistance) > 6) {
      dragState.current.hasDragged = true;
      event.preventDefault();
    }

    event.currentTarget.scrollLeft =
      dragState.current.scrollLeft - dragDistance;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    dragState.current.active = false;
    setIsDragging(false);
    updateScrollState();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.hasDragged) return;

    event.preventDefault();
    event.stopPropagation();
    dragState.current.hasDragged = false;
  };

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-background/40 px-6 py-10 text-center text-sm text-muted-foreground">
        Nenhum projeto encontrado nessa categoria.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 md:px-12">
        <p className="text-sm text-muted-foreground">
          {projects.length} projetos nesta seleção
        </p>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-primary/30 bg-background/60 hover:border-primary hover:text-primary disabled:opacity-30"
            aria-label="Projetos anteriores"
            disabled={!canScrollPrevious}
            onClick={() => scrollByPage("previous")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-primary/30 bg-background/60 hover:border-primary hover:text-primary disabled:opacity-30"
            aria-label="Próximos projetos"
            disabled={!canScrollNext}
            onClick={() => scrollByPage("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-20 bg-gradient-to-r from-background via-background/80 to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-20 bg-gradient-to-l from-background via-background/80 to-transparent md:block" />

        <div
          ref={trackRef}
          className={cn(
            "project-carousel-scroll flex gap-5 overflow-x-auto pb-6 pt-1 outline-none scroll-smooth",
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          )}
          aria-label="Lista de projetos"
          role="region"
          tabIndex={0}
          onClickCapture={handleClickCapture}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerEnd}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onScroll={updateScrollState}
        >
          {projects.map(project => {
            const hasProjectPage = Boolean(project.slug);
            const actionLabel = hasProjectPage
              ? "Ver case"
              : project.liveUrl !== "#"
                ? "Abrir projeto"
                : "Ver repositório";
            const actionHref = hasProjectPage
              ? `/projetos/${project.slug}`
              : project.liveUrl !== "#"
                ? project.liveUrl
                : project.repoUrl;
            const actionIcon = hasProjectPage ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            );

            return (
              <article
                key={project.id}
                className="group flex min-h-[24.5rem] w-[min(82vw,20rem)] shrink-0 snap-start flex-col overflow-hidden border border-primary/15 bg-card shadow-[0_18px_48px_rgba(0,0,0,0.34)] ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/70 sm:w-[21rem] xl:w-[22rem]"
              >
                <div className="relative h-48 overflow-hidden border-b border-border bg-secondary">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4">
                    <span className="border border-primary/30 bg-background/85 px-2 py-1 text-[0.65rem] font-medium uppercase tracking-normal text-primary backdrop-blur">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-5">
                  <div className="space-y-3">
                    <h3 className="project-carousel-card-title text-xl font-semibold leading-snug transition-colors group-hover:text-primary">
                      {project.title}
                    </h3>
                    <p className="project-carousel-card-description text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  </div>

                  {hasProjectPage ? (
                    <Button
                      asChild
                      className="mt-auto w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Link href={actionHref}>
                        {actionLabel} {actionIcon}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="mt-auto w-full rounded-none border-primary/30 hover:border-primary hover:text-primary"
                    >
                      <a href={actionHref} target="_blank" rel="noreferrer">
                        {actionLabel} {actionIcon}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
