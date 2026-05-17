import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
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

const normalizeIndex = (index: number, total: number) =>
  ((index % total) + total) % total;

export default function ProjectCarousel({
  activeCategory,
  projects,
}: ProjectCarouselProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    axis: null as "x" | "y" | null,
    hasDragged: false,
    lastX: 0,
    lastMoveTime: 0,
    startAngle: 0,
    startX: 0,
    startY: 0,
    velocity: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const currentAngleRef = useRef(0);
  const currentIndexRef = useRef(0);
  const pendingDragAngleRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragAngle, setDragAngle] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [radius, setRadius] = useState(420);

  const totalItems = projects.length;
  const theta = totalItems > 0 ? 360 / totalItems : 0;
  const settledAngle = currentIndex * -theta;
  const displayAngle = dragAngle ?? settledAngle;
  const activeIndex =
    totalItems > 0 ? normalizeIndex(currentIndex, totalItems) : 0;
  const activeProject = projects[activeIndex];

  const getSlideWidth = () =>
    Math.min(180, Math.max(96, (sceneRef.current?.offsetWidth ?? 320) * 0.42));

  const cancelPendingDragFrame = () => {
    if (animationFrameRef.current === null) return;

    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    pendingDragAngleRef.current = null;
  };

  const scheduleDragAngle = (angle: number) => {
    pendingDragAngleRef.current = angle;

    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      if (pendingDragAngleRef.current === null) return;

      setDragAngle(pendingDragAngleRef.current);
      pendingDragAngleRef.current = null;
    });
  };

  useEffect(() => {
    cancelPendingDragFrame();
    setCurrentIndex(0);
    setDragAngle(null);
    setIsDragging(false);
    currentIndexRef.current = 0;
    currentAngleRef.current = 0;
  }, [activeCategory, totalItems]);

  useEffect(() => () => cancelPendingDragFrame(), []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;

    if (!isDragging) {
      currentAngleRef.current = settledAngle;
    }
  }, [currentIndex, isDragging, settledAngle]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || totalItems < 2) return;

    const updateRadius = () => {
      const itemWidth = scene.offsetWidth;
      const nextRadius =
        Math.round(itemWidth / 2 / Math.tan(Math.PI / totalItems)) + 72;
      setRadius(Math.max(nextRadius, 260));
    };

    updateRadius();

    const observer = new ResizeObserver(updateRadius);
    observer.observe(scene);

    return () => observer.disconnect();
  }, [totalItems]);

  const goToPrevious = () => {
    if (totalItems < 2) return;
    setCurrentIndex(index => index - 1);
    setDragAngle(null);
  };

  const goToNext = () => {
    if (totalItems < 2) return;
    setCurrentIndex(index => index + 1);
    setDragAngle(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      totalItems < 2 ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    cancelPendingDragFrame();

    dragState.current = {
      active: true,
      axis: null,
      hasDragged: false,
      lastX: event.clientX,
      lastMoveTime: performance.now(),
      startAngle: currentAngleRef.current,
      startX: event.clientX,
      startY: event.clientY,
      velocity: 0,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    const dragDistanceX = event.clientX - dragState.current.startX;
    const dragDistanceY = event.clientY - dragState.current.startY;
    const absX = Math.abs(dragDistanceX);
    const absY = Math.abs(dragDistanceY);

    if (!dragState.current.axis && Math.max(absX, absY) > 8) {
      dragState.current.axis = absX > absY ? "x" : "y";
    }

    if (dragState.current.axis === "y") return;

    const anglePerPixel = theta / getSlideWidth();
    const walk = dragDistanceX * anglePerPixel;
    const nextAngle = dragState.current.startAngle + walk;

    if (absX > 6) {
      dragState.current.hasDragged = true;
      event.preventDefault();
    }

    const now = performance.now();
    const elapsed = Math.max(16, now - dragState.current.lastMoveTime);
    const instantVelocity = (event.clientX - dragState.current.lastX) / elapsed;

    dragState.current.velocity =
      dragState.current.velocity * 0.65 + instantVelocity * 0.35;
    dragState.current.lastX = event.clientX;
    dragState.current.lastMoveTime = now;
    currentAngleRef.current = nextAngle;
    scheduleDragAngle(nextAngle);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;

    cancelPendingDragFrame();

    const dragDistance = dragState.current.lastX - dragState.current.startX;
    const projectedDistance = dragDistance + dragState.current.velocity * 180;
    const rawSlides = -projectedDistance / getSlideWidth();
    const shouldChangeSlide =
      dragState.current.hasDragged &&
      (Math.abs(dragDistance) > 24 || Math.abs(projectedDistance) > 42);
    let slidesToMove = 0;

    if (shouldChangeSlide) {
      const direction = Math.sign(rawSlides) || -Math.sign(dragDistance);

      slidesToMove =
        direction * Math.min(3, Math.max(1, Math.round(Math.abs(rawSlides))));
    }

    dragState.current.active = false;
    setIsDragging(false);
    setDragAngle(null);
    setCurrentIndex(currentIndexRef.current + slidesToMove);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  if (totalItems === 0) {
    return (
      <div className="border border-border bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
        Nenhum projeto encontrado nessa categoria.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        ref={sceneRef}
        className="relative mx-auto h-[34rem] w-[min(84vw,20rem)] touch-pan-y outline-none [perspective:1400px] focus-visible:ring-2 focus-visible:ring-primary/60 sm:h-[36rem] sm:w-[22rem] md:w-[23rem]"
        aria-label="Carrossel de projetos"
        role="region"
        tabIndex={0}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
      >
        <div
          className={cn(
            "project-carousel-track absolute inset-0 cursor-grab select-none [transform-style:preserve-3d] will-change-transform",
            isDragging && "is-dragging cursor-grabbing"
          )}
          style={{
            transform: `translateZ(${-radius}px) rotateY(${displayAngle}deg)`,
          }}
        >
          {projects.map((project, index) => {
            const isActive = index === activeIndex;
            const visibleTags = project.tags.slice(0, 4);
            const hiddenTagCount = project.tags.length - visibleTags.length;

            return (
              <article
                key={project.id}
                aria-hidden={!isActive}
                className={cn(
                  "project-carousel-card group absolute left-0 top-0 flex h-[31rem] w-full flex-col overflow-hidden border border-border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-md transition-opacity duration-300",
                  isActive
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-70"
                )}
                style={{
                  transform: `rotateY(${theta * index}deg) translateZ(${radius}px)`,
                }}
              >
                <div className="relative h-44 overflow-hidden border-b border-border sm:h-48">
                  <div className="absolute inset-0 z-10 bg-primary/20 opacity-70 mix-blend-overlay transition-opacity duration-300" />
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-normal text-primary">
                        {project.category}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground transition-colors hover:text-primary"
                          aria-label={`Abrir repositório de ${project.title}`}
                          tabIndex={isActive ? 0 : -1}
                        >
                          <Github className="h-4 w-4" />
                        </a>
                        {project.liveUrl !== "#" && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground transition-colors hover:text-primary"
                            aria-label={`Abrir site de ${project.title}`}
                            tabIndex={isActive ? 0 : -1}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="project-carousel-card-title font-mono text-lg font-bold leading-snug transition-colors sm:text-xl">
                      {project.title}
                    </h3>
                    <p className="project-carousel-card-description text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {visibleTags.map(tag => (
                        <span
                          key={tag}
                          className="border border-border bg-secondary px-2 py-1 font-mono text-[0.68rem] text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {hiddenTagCount > 0 && (
                        <span className="border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[0.68rem] text-primary">
                          +{hiddenTagCount}
                        </span>
                      )}
                    </div>

                    {project.slug && (
                      <Button
                        asChild
                        className="w-full rounded-none bg-primary font-mono text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        <Link
                          href={`/projetos/${project.slug}`}
                          tabIndex={isActive ? 0 : -1}
                        >
                          Ver detalhes <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}

                    {project.liveUrl !== "#" && (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-none border-primary/30 font-mono text-xs hover:border-primary hover:text-primary"
                      >
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          tabIndex={isActive ? 0 : -1}
                        >
                          Visitar site <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-5 border-t border-border pt-6 sm:flex-row">
        <div className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          /{String(totalItems).padStart(2, "0")}
          {activeProject && (
            <span className="ml-3 text-foreground">{activeProject.title}</span>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-primary/30 hover:border-primary hover:text-primary"
            aria-label="Projeto anterior"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-primary/30 hover:border-primary hover:text-primary"
            aria-label="Próximo projeto"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
