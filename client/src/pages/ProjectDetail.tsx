import { useEffect } from "react";
import type { RouteComponentProps } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import RollButton from "@/components/RollButton";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { getProjectBySlug } from "@/data/projects";

type ProjectDetailParams = {
  slug: string;
};

export default function ProjectDetail({
  params,
}: RouteComponentProps<ProjectDetailParams>) {
  const project = getProjectBySlug(params.slug);
  const caseStudy = project?.caseStudy;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [params.slug]);

  if (!project || !caseStudy) {
    return (
      <section className="mx-auto min-h-[60vh] w-full max-w-[1200px] px-5 pb-16 pt-32 sm:px-8 lg:px-12">
        <div className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-7">
          <span className="inline-flex rounded-full border border-border px-3 py-1 text-[12px] font-medium text-[#0C2AFE]">
            Case não encontrado
          </span>
          <h1 className="text-3xl font-medium tracking-[-0.02em]">
            Projeto indisponível
          </h1>
          <p className="text-muted-foreground">
            Ainda não existe uma página completa para esse projeto.
          </p>
          <Button
            asChild
            className="rounded-full bg-[#0C2AFE] text-white hover:bg-[#001FDD]"
          >
            <Link href="/">Voltar ao portfólio</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-16 px-5 pb-16 pt-28 sm:px-8 md:pt-32 lg:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border text-[13px] font-medium hover:text-[#0C2AFE]"
          >
            <a href="/#projetos">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos projetos
            </a>
          </Button>

          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-[12px] font-medium text-[#0C2AFE]">
              {project.category}
            </span>
            <h1 className="text-3xl font-medium leading-[1.1] tracking-[-0.02em] md:text-5xl">
              {project.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <RollButton
              variant="blue"
              size="md"
              label={caseStudy.ctaLabel}
              href={WHATSAPP_BUDGET_URL}
              external
            />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border text-[13px] font-medium hover:text-[#0C2AFE]"
            >
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                Ver projeto online
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={project.image}
            alt={project.title}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>

      {project.video && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.02em]">
              Projeto em movimento
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma visão completa da experiência e das principais seções do site.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-[0_18px_50px_rgba(13,30,80,0.12)]">
            <video
              src={project.video}
              poster={project.image}
              controls
              loop
              muted
              playsInline
              preload="metadata"
              aria-label={`Demonstração em vídeo do projeto ${project.title}`}
              className="aspect-[1920/828] w-full object-cover"
            />
          </div>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0C2AFE]">
              Tecnologias usadas
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0C2AFE]">
              Links
            </h2>
            <div className="mt-4 grid gap-3">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
              >
                Projeto online <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
              >
                Repositório <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--brand-ink)] p-6 text-white">
            <h2 className="text-[17px] font-semibold">Quer algo parecido?</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Me chame para transformar um problema parecido em uma solução web
              com painel, automação ou página de conversão.
            </p>
            <RollButton
              className="mt-5 w-full"
              variant="white"
              size="sm"
              label="Pedir orçamento"
              href={WHATSAPP_BUDGET_URL}
              external
            />
          </div>
        </aside>

        <div className="space-y-5">
          {[
            ["Nome do projeto", project.title],
            ["Problema do cliente", caseStudy.clientProblem],
            ["Solução criada", caseStudy.solution],
            ["Resultado ou benefício", caseStudy.benefit],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[#0C2AFE]/40"
            >
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0C2AFE]">
                {label}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.02em]">
            Imagens do projeto
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Espaço preparado para ampliar o case com mais telas quando houver
            novas capturas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {caseStudy.images.map(image => (
            <figure
              key={image.src}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="aspect-[16/10] w-full object-cover"
              />
              <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {image.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
