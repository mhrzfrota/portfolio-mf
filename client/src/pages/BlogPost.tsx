import { useEffect, useId, useState } from "react";
import type { RouteComponentProps } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import RollButton from "@/components/RollButton";
import { WHATSAPP_BUDGET_URL } from "@/const";
import {
  getPostBySlug,
  getPosts,
  type PostContentBlock,
  type PostSection,
} from "@/data/posts";
import {
  OrchestrationVisual,
  VaultVisual,
  WorkspaceVisual,
} from "@/components/blog/WorkflowVisuals";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

type BlogPostParams = {
  slug: string;
};

function formatDate(value: string, lang: Lang) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

/**
 * Foto do artigo. Enquanto o arquivo não existe (ou falha ao carregar), o lugar
 * dela continua marcado com a legenda — a página não abre um buraco no meio do
 * texto nem quebra o ritmo das seções.
 */
function PostImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  const { lang } = useLanguage();
  const [failed, setFailed] = useState(false);

  return (
    <figure>
      {failed ? (
        <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
          <span className="mono-label text-[10px] text-muted-foreground">
            {getStrings(lang).blogPost.imageComing}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full rounded-2xl border border-border"
        />
      )}
      <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

/** Um bloco de conteúdo do artigo. Cada tipo tem a sua forma na página. */
function PostBlock({ block }: { block: PostContentBlock }) {
  switch (block.type) {
    case "list":
      return (
        <ul className="space-y-3">
          {block.items.map(item => (
            <li
              key={item}
              className="relative pl-6 text-[16px] font-medium leading-[1.7] text-foreground/80"
            >
              <span className="absolute left-0 top-[0.7em] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote className="border-l-2 border-primary pl-5 text-[clamp(1.05rem,2.2vw,1.2rem)] font-medium leading-[1.6] text-foreground">
          {block.text}
        </blockquote>
      );

    case "code":
      return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {block.label && (
            <div className="border-b border-border px-5 py-2.5">
              <span className="mono-label text-[10px] text-muted-foreground">
                {block.label}
              </span>
            </div>
          )}
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-foreground/85">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    // O diagrama é texto: acompanha o tema, dá zoom junto com a página e o
    // leitor de tela lê o mesmo que está na tela.
    case "diagram":
      return (
        <figure>
          <pre
            aria-label="Diagrama"
            className="overflow-x-auto rounded-2xl border border-border bg-card p-5 font-mono text-[11.5px] leading-[1.7] text-foreground/75 sm:text-[13px]"
          >
            {block.ascii}
          </pre>
          {block.caption && (
            <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "image":
      return (
        <PostImage src={block.src} alt={block.alt} caption={block.caption} />
      );

    case "visual": {
      const Visual = {
        orchestration: OrchestrationVisual,
        workspace: WorkspaceVisual,
        vault: VaultVisual,
      }[block.name];
      return (
        <figure>
          <Visual />
          <figcaption className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {block.caption}
          </figcaption>
        </figure>
      );
    }

    case "cards":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.items.map(item => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="mono-label text-[11px] text-primary">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <p className="text-[16px] font-medium leading-[1.8] text-foreground/80">
          {block.text}
        </p>
      );
  }
}

function CollapsiblePostSection({ section }: { section: PostSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const triggerId = useId();

  return (
    <section
      className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
        isOpen ? "border-primary/30 bg-card" : "border-border bg-card/40"
      }`}
    >
      <h2>
        <button
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen(current => !current)}
          className="flex w-full items-center gap-4 px-5 py-5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset motion-reduce:transition-none sm:px-6"
        >
          <span className="flex-1 text-[clamp(1.05rem,2.6vw,1.3rem)] font-bold leading-snug tracking-[-0.01em] text-foreground">
            {section.heading}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      </h2>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`space-y-5 border-t border-border px-5 pb-6 pt-5 transition-opacity duration-200 motion-reduce:transition-none sm:px-6 sm:pb-7 ${
              isOpen ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            {section.blocks.map((block, index) => (
              <PostBlock key={index} block={block} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BlogPost({
  params,
}: RouteComponentProps<BlogPostParams>) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const post = getPostBySlug(params.slug, lang);
  const posts = getPosts(lang);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [params.slug]);

  if (!post) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-[1200px] flex-col items-center px-5 pb-16 pt-32 text-center sm:px-8 lg:px-12">
        <div className="max-w-xl space-y-5">
          <span className="inline-flex rounded-full border border-border px-3 py-1 text-[12px] font-medium text-primary">
            {t.blogPost.notFoundBadge}
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">
            {t.blogPost.notFoundTitle}
          </h1>
          <p className="font-medium text-muted-foreground">
            {t.blogPost.notFoundText}
          </p>
          <Button
            asChild
            className="rounded-full bg-primary text-white hover:bg-[var(--brand-blue-dark)]"
          >
            <Link href="/#blog">{t.blogPost.backToBlog}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const relatedPosts = posts
    .filter(item => item.slug !== post.slug)
    .slice(0, 2);
  const usesTopicAccordion = post.slug === "orquestracao-agentes-ia";

  return (
    <article className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-28 sm:px-8 md:pt-32">
      {/* Voltar */}
      <Button
        asChild
        variant="outline"
        className="rounded-full border-border text-[13px] font-medium hover:text-primary"
      >
        <a href="/#blog">
          <ArrowLeft className="h-4 w-4" />
          {t.blogPost.backToBlog}
        </a>
      </Button>

      {/* Cabeçalho centralizado */}
      <header className="mt-10 flex flex-col items-center text-center">
        <div className="flex flex-wrap justify-center gap-2">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full border border-border px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-6 text-balance text-[clamp(1.9rem,5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} /> {formatDate(post.date, lang)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {post.readTime}
          </span>
        </div>
      </header>

      <div className="mx-auto mt-12 h-px w-16 bg-border" />

      {/* Lead */}
      <p className="mt-12 text-[clamp(1.05rem,2.2vw,1.2rem)] font-medium leading-[1.7] text-foreground/90">
        {post.lead}
      </p>

      {/* Seções */}
      <div className={usesTopicAccordion ? "mt-10 space-y-3" : "mt-4"}>
        {post.sections.map(section =>
          usesTopicAccordion ? (
            <CollapsiblePostSection key={section.heading} section={section} />
          ) : (
            <section key={section.heading} className="mt-12">
              <h2 className="text-[clamp(1.25rem,3vw,1.6rem)] font-bold tracking-[-0.01em] text-foreground">
                {section.heading}
              </h2>

              <div className="mt-5 space-y-5">
                {section.blocks.map((block, index) => (
                  <PostBlock key={index} block={block} />
                ))}
              </div>
            </section>
          )
        )}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border border-border bg-card p-7 text-center sm:p-9">
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-foreground">
          {t.blogPost.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] font-medium leading-relaxed text-muted-foreground">
          {t.blogPost.ctaText}
        </p>
        <div className="mt-6 flex justify-center">
          <RollButton
            variant="arrow"
            label={t.blogPost.ctaButton}
            href={WHATSAPP_BUDGET_URL}
            external
          />
        </div>
      </div>

      {/* Relacionados */}
      {relatedPosts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.blogPost.keepReading}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedPosts.map(item => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <span className="text-[12px] font-medium text-muted-foreground">
                  {formatDate(item.date, lang)}
                </span>
                <h3 className="mt-2 text-[16px] font-bold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h3>
                <span className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                  {t.blogPost.readArticle}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
