import { useEffect } from "react";
import type { RouteComponentProps } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import RollButton from "@/components/RollButton";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { getPostBySlug, getPosts } from "@/data/posts";
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
      <div className="mt-4">
        {post.sections.map(section => (
          <section key={section.heading} className="mt-12">
            <h2 className="text-[clamp(1.25rem,3vw,1.6rem)] font-bold tracking-[-0.01em] text-foreground">
              {section.heading}
            </h2>

            <div className="mt-5 space-y-5">
              {section.blocks.map((block, index) => {
                if (block.type === "list") {
                  return (
                    <ul key={index} className="space-y-3">
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
                }

                return (
                  <p
                    key={index}
                    className="text-[16px] font-medium leading-[1.8] text-foreground/80"
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
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
