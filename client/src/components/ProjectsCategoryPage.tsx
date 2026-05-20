import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  categories,
  projects as allProjects,
  type Project,
} from "@/data/projects";

const sortOptions = [
  { value: "featured", label: "Em destaque" },
  { value: "newest", label: "Mais recentes" },
  { value: "name", label: "Nome A–Z" },
];

export default function ProjectsCategoryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [activeTech, setActiveTech] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    categoria: true,
    stack: true,
  });
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableTechs = useMemo(
    () => Array.from(new Set(allProjects.flatMap(p => p.tags))).sort(),
    []
  );

  const filtered = useMemo(() => {
    let list = allProjects;

    if (activeCategory !== "Todos") {
      list = list.filter(p => p.category === activeCategory);
    }
    if (activeTech.length > 0) {
      list = list.filter(p => activeTech.some(t => p.tags.includes(t)));
    }

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => b.id - a.id);
    } else {
      // featured: caseStudy first, then by id
      list = [...list].sort((a, b) => {
        const af = a.caseStudy ? 0 : 1;
        const bf = b.caseStudy ? 0 : 1;
        if (af !== bf) return af - bf;
        return a.id - b.id;
      });
    }

    return list;
  }, [activeCategory, activeTech, sortBy]);

  const toggleTech = (tech: string) => {
    setActiveTech(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const clearAll = () => {
    setActiveCategory("Todos");
    setActiveTech([]);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalFilters =
    (activeCategory !== "Todos" ? 1 : 0) + activeTech.length;
  const currentSortLabel =
    sortOptions.find(o => o.value === sortBy)?.label ?? "Em destaque";

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-20 bg-background">
      {/* Top header bar — breadcrumb + title + count */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 pt-6 pb-4 md:px-10">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <button
              onClick={() =>
                document
                  .getElementById("inicio")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-foreground transition-colors"
            >
              Início
            </button>
            <span>/</span>
            <span className="font-semibold text-foreground">Projetos</span>
          </nav>

          <h2 className="mt-3 font-display text-3xl tracking-tight md:text-4xl">
            Projetos{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </h2>
        </div>
      </div>

      {/* Sticky filter / sort toolbar */}
      <div className="sticky top-[64px] z-20 border-b border-border bg-background/95 backdrop-blur md:top-[72px]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 md:px-10">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileFiltersOpen(true);
              } else {
                setFiltersOpen(v => !v);
              }
            }}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight text-foreground transition-colors hover:text-[var(--brand-blue)]"
          >
            <span className="hidden md:inline">
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </span>
            <span className="md:hidden">Filtrar</span>
            <SlidersHorizontal className="h-4 w-4" />
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-blue)] px-1.5 text-[10px] font-bold text-white">
                {totalFilters}
              </span>
            )}
          </button>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight text-foreground transition-colors hover:text-[var(--brand-blue)]"
            >
              Ordenar:{" "}
              <span className="text-foreground/70">{currentSortLabel}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  sortOpen && "rotate-180"
                )}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-[0_18px_50px_rgba(13,30,80,0.18)]">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "block w-full px-4 py-3 text-left text-sm font-semibold transition-colors",
                      sortBy === opt.value
                        ? "bg-secondary/60 text-[var(--brand-blue)]"
                        : "text-foreground hover:bg-secondary/40"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body: sidebar + grid */}
      <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
        <div className="flex gap-6 pt-6 lg:gap-10">
          {/* Desktop sidebar */}
          {filtersOpen && (
            <aside className="sticky top-[140px] hidden h-[calc(100vh-10rem)] w-[260px] shrink-0 self-start overflow-y-auto pr-3 lg:block">
              <FilterSidebar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                availableTechs={availableTechs}
                activeTech={activeTech}
                onToggleTech={toggleTech}
                onClearAll={clearAll}
                totalFilters={totalFilters}
                openGroups={openGroups}
                onToggleGroup={toggleGroup}
              />
            </aside>
          )}

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {totalFilters > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {activeCategory !== "Todos" && (
                  <button
                    onClick={() => setActiveCategory("Todos")}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
                  >
                    {activeCategory}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {activeTech.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTech(t)}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
                  >
                    {t}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={clearAll}
                  className="ml-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)] underline-offset-4 hover:underline"
                >
                  Limpar tudo
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-secondary/40 p-12 text-center">
                <p className="font-display text-2xl tracking-tight">
                  Nenhum projeto encontrado
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tente remover alguns filtros para ver mais resultados.
                </p>
                <button
                  onClick={clearAll}
                  className="nike-pill mt-6 inline-flex h-11 items-center gap-2 bg-[var(--brand-ink)] px-6 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[var(--brand-blue)]"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(project => (
                  <ProductCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            role="button"
            tabIndex={0}
            aria-label="Fechar filtros"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                setMobileFiltersOpen(false);
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-2xl tracking-tight">Filtros</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fechar"
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <FilterSidebar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                availableTechs={availableTechs}
                activeTech={activeTech}
                onToggleTech={toggleTech}
                onClearAll={clearAll}
                totalFilters={totalFilters}
                openGroups={openGroups}
                onToggleGroup={toggleGroup}
              />
            </div>
            <div className="border-t border-border p-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="nike-pill flex h-12 w-full items-center justify-center bg-[var(--brand-ink)] text-sm font-bold uppercase tracking-wide text-white hover:bg-[var(--brand-blue)]"
              >
                Ver {filtered.length} projetos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FilterSidebarProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  availableTechs: string[];
  activeTech: string[];
  onToggleTech: (tech: string) => void;
  onClearAll: () => void;
  totalFilters: number;
  openGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
};

function FilterSidebar({
  categories,
  activeCategory,
  onCategoryChange,
  availableTechs,
  activeTech,
  onToggleTech,
  onClearAll,
  totalFilters,
  openGroups,
  onToggleGroup,
}: FilterSidebarProps) {
  return (
    <div className="space-y-0 pb-6">
      <FilterGroup
        title="Categoria"
        groupKey="categoria"
        open={openGroups.categoria}
        onToggle={onToggleGroup}
      >
        <ul className="space-y-3">
          {categories.map(cat => {
            const active = activeCategory === cat;
            return (
              <li key={cat}>
                <button
                  onClick={() => onCategoryChange(cat)}
                  className={cn(
                    "w-full text-left text-sm transition-colors",
                    active
                      ? "font-bold text-[var(--brand-blue)]"
                      : "text-foreground/80 hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup
        title="Stack"
        groupKey="stack"
        open={openGroups.stack}
        onToggle={onToggleGroup}
      >
        <ul className="space-y-3">
          {availableTechs.map(tech => {
            const checked = activeTech.includes(tech);
            return (
              <li key={tech}>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggleTech(tech)}
                  />
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors",
                      checked
                        ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]"
                        : "border-foreground/30 group-hover:border-foreground"
                    )}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M3 8l3 3 7-7" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      checked
                        ? "font-semibold text-foreground"
                        : "text-foreground/80 group-hover:text-foreground"
                    )}
                  >
                    {tech}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      {totalFilters > 0 && (
        <button
          onClick={onClearAll}
          className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)] underline-offset-4 hover:underline"
        >
          Limpar todos os filtros <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  groupKey,
  open,
  onToggle,
  children,
}: {
  title: string;
  groupKey: string;
  open: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-5">
      <button
        onClick={() => onToggle(groupKey)}
        className="mb-4 flex w-full items-center justify-between text-base font-bold text-foreground"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && children}
    </div>
  );
}

function ProductCard({ project }: { project: Project }) {
  const hasPage = Boolean(project.slug);
  const isExternalActive = !hasPage && project.liveUrl !== "#";
  const href = hasPage
    ? `/projetos/${project.slug}`
    : isExternalActive
      ? project.liveUrl
      : project.repoUrl;
  const isFeatured = Boolean(project.caseStudy);

  const inner = (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {isFeatured && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-sm bg-[var(--brand-green)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Em destaque
          </span>
        )}

        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-all hover:bg-background hover:text-[var(--brand-blue)] group-hover:opacity-100"
          aria-label="Favoritar"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart className="h-4 w-4" />
        </button>

        <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground opacity-0 backdrop-blur transition-all group-hover:opacity-100">
          {project.category}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.18em]",
            isFeatured
              ? "text-[var(--brand-green-dark)]"
              : "text-[var(--brand-blue)]"
          )}
        >
          {isFeatured ? "Em destaque" : "Novo"}
        </p>
        <h3 className="text-base font-bold leading-snug text-foreground line-clamp-2">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground">{project.category}</p>
        <p className="text-sm text-foreground/70">
          {project.tags.length} tecnologias
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-foreground transition-colors group-hover:text-[var(--brand-blue)]">
          {hasPage
            ? "Ver case"
            : isExternalActive
              ? "Abrir projeto"
              : "Ver repositório"}{" "}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </article>
  );

  if (hasPage) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {inner}
    </a>
  );
}
