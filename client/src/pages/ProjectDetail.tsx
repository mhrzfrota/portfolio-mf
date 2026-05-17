import { useEffect } from "react";
import type { RouteComponentProps } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Github,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <section className="min-h-[60vh] py-20">
        <div className="max-w-2xl space-y-5 border border-border bg-card/60 p-6">
          <span className="font-mono text-sm text-primary">
            case não encontrado
          </span>
          <h1 className="text-3xl font-bold">Projeto indisponível</h1>
          <p className="text-muted-foreground">
            Ainda não existe uma página completa para esse projeto.
          </p>
          <Button
            asChild
            className="rounded-none bg-primary font-mono text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/">Voltar ao portfólio</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-16 py-10 md:py-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Button
            asChild
            variant="outline"
            className="rounded-none border-primary/30 font-mono text-xs hover:text-primary"
          >
            <a href="/#projetos">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos projetos
            </a>
          </Button>

          <div className="space-y-4">
            <span className="inline-flex border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-normal text-primary">
              {project.category}
            </span>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              {project.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-none bg-primary font-mono text-primary-foreground hover:bg-primary/90"
            >
              <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                {caseStudy.ctaLabel}
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none border-primary/30 font-mono hover:text-primary"
            >
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                Ver projeto online
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden border border-border bg-card">
          <img
            src={project.image}
            alt={project.title}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-6">
          <div className="border border-border bg-card/50 p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-normal text-primary">
              Tecnologias usadas
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <span
                  key={tag}
                  className="border border-border bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card/50 p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-normal text-primary">
              Links
            </h2>
            <div className="mt-4 grid gap-3">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between border border-border px-3 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                Projeto online <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between border border-border px-3 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                Repositório <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="border border-primary/30 bg-primary/10 p-5">
            <h2 className="font-mono text-lg font-bold text-primary">
              Quer algo parecido?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Me chame para transformar um problema parecido em uma solução web
              com painel, automação ou página de conversão.
            </p>
            <Button
              asChild
              className="mt-5 w-full rounded-none bg-primary font-mono text-primary-foreground hover:bg-primary/90"
            >
              <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                Pedir orçamento
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </aside>

        <div className="space-y-6">
          {[
            ["Nome do projeto", project.title],
            ["Problema do cliente", caseStudy.clientProblem],
            ["Solução criada", caseStudy.solution],
            ["Resultado ou benefício", caseStudy.benefit],
          ].map(([label, value]) => (
            <article
              key={label}
              className="border border-border bg-card/50 p-5 transition-colors hover:border-primary/30"
            >
              <h2 className="font-mono text-sm font-bold uppercase tracking-normal text-primary">
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
          <h2 className="text-2xl font-bold">Imagens do projeto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Espaço preparado para ampliar o case com mais telas quando houver
            novas capturas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {caseStudy.images.map(image => (
            <figure
              key={image.src}
              className="overflow-hidden border border-border bg-card/50"
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
