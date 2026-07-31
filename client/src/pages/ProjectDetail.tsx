import { useEffect } from "react";
import type { RouteComponentProps } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import RollButton from "@/components/RollButton";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { getProjectBySlug } from "@/data/projects";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

type ProjectDetailParams = {
  slug: string;
};

export default function ProjectDetail({
  params,
}: RouteComponentProps<ProjectDetailParams>) {
  const project = getProjectBySlug(params.slug);
  const caseStudy = project?.caseStudy;
  const { lang } = useLanguage();
  const t = getStrings(lang);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [params.slug]);

  if (!project || !caseStudy) {
    return (
      <section className="mx-auto min-h-[60vh] w-full max-w-[1200px] px-5 pb-16 pt-32 sm:px-8 lg:px-12">
        <div className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-7">
          <span className="inline-flex rounded-full border border-border px-3 py-1 text-[12px] font-medium text-primary">
            {t.projectDetail.notFoundBadge}
          </span>
          <h1 className="text-3xl font-medium tracking-[-0.02em]">
            {t.projectDetail.notFoundTitle}
          </h1>
          <p className="text-muted-foreground">
            {t.projectDetail.notFoundText}
          </p>
          <Button
            asChild
            className="rounded-full bg-primary text-white hover:bg-[var(--brand-blue-dark)]"
          >
            <Link href="/">{t.projectDetail.backToPortfolio}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const caseFacts: Array<[string, string]> = [
    [t.projectDetail.labelName, project.title],
    [t.projectDetail.labelProblem, caseStudy.clientProblem[lang]],
    [t.projectDetail.labelSolution, caseStudy.solution[lang]],
    [t.projectDetail.labelBenefit, caseStudy.benefit[lang]],
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-16 px-5 pb-16 pt-28 sm:px-8 md:pt-32 lg:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border text-[13px] font-medium hover:text-primary"
          >
            <a href="/#projetos">
              <ArrowLeft className="h-4 w-4" />
              {t.projectDetail.backToProjects}
            </a>
          </Button>

          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-[12px] font-medium text-primary">
              {t.projects.categories[project.category] ?? project.category}
            </span>
            <h1 className="text-3xl font-medium leading-[1.1] tracking-[-0.02em] md:text-5xl">
              {project.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {project.description[lang]}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <RollButton
              variant="arrow"
              label={caseStudy.ctaLabel[lang]}
              href={WHATSAPP_BUDGET_URL}
              external
            />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border text-[13px] font-medium hover:text-primary"
            >
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                {t.projectDetail.viewLive}
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
              {t.projectDetail.inMotionTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.projectDetail.inMotionSubtitle}
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
              aria-label={`${t.projectDetail.videoAria} ${project.title}`}
              className="aspect-[1920/828] w-full object-cover"
            />
          </div>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-primary">
              {t.projectDetail.techUsed}
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
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-primary">
              {t.projectDetail.links}
            </h2>
            <div className="mt-4 grid gap-3">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {t.projectDetail.liveLink} <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {t.projectDetail.repository} <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--brand-ink)] p-6 text-white">
            <h2 className="text-[17px] font-semibold">
              {t.projectDetail.similarTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {t.projectDetail.similarText}
            </p>
            <RollButton
              className="mt-5 w-full"
              variant="light"
              label={t.projectDetail.requestQuote}
              href={WHATSAPP_BUDGET_URL}
              external
            />
          </div>
        </aside>

        <div className="space-y-5">
          {caseFacts.map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-primary">
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
            {t.projectDetail.imagesTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.projectDetail.imagesSubtitle}
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
                alt={image.alt[lang]}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full object-cover"
              />
              <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {image.caption[lang]}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
