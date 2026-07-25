import { ArrowRight } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { getTestimonials } from "@/data/testimonials";
import TypeCycler from "./TypeCycler";

export default function Hero() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  // Balões só existem com depoimentos reais cadastrados (máx. 2 no hero).
  const bubbles = getTestimonials(lang).slice(0, 2);

  return (
    <section
      id="inicio"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-5 pb-16 pt-28 sm:px-8"
    >
      <div className="relative mx-auto flex w-full max-w-[880px] flex-col items-center text-center">
        {bubbles[0] && (
          <figure
            className="hero-bubble hero-rise absolute -top-6 left-0 hidden -rotate-[5deg] lg:block"
            aria-hidden="true"
          >
            <blockquote className="text-[12.5px] italic leading-snug">
              “{bubbles[0].quote}”
            </blockquote>
            <figcaption className="mt-1 text-[10.5px] not-italic opacity-55">
              — {bubbles[0].author}, {bubbles[0].role}
            </figcaption>
          </figure>
        )}
        {bubbles[1] && (
          <figure
            className="hero-bubble hero-rise absolute -top-10 right-0 hidden rotate-3 lg:block"
            aria-hidden="true"
          >
            <blockquote className="text-[12.5px] italic leading-snug">
              “{bubbles[1].quote}”
            </blockquote>
            <figcaption className="mt-1 text-[10.5px] not-italic opacity-55">
              — {bubbles[1].author}, {bubbles[1].role}
            </figcaption>
          </figure>
        )}

        <span className="scribble hero-rise rotate-2" aria-hidden="true">
          {t.hero.scribble}
        </span>

        <h1
          className="hero-rise mt-5 font-display text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-foreground"
          aria-label={t.hero.ariaHeadline}
        >
          {t.hero.headline}{" "}
          {/* key={lang}: reinicia o typewriter ao trocar de idioma */}
          <TypeCycler key={lang} texts={[...t.hero.areas]} className="hero-area" />
        </h1>

        <p className="hero-rise hero-rise-2 mt-6 max-w-xl text-balance text-[15px] leading-relaxed text-[var(--body-text)] sm:text-[16px]">
          {t.hero.description}
        </p>

        <div className="hero-rise hero-rise-3 mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <a
            href={WHATSAPP_BUDGET_URL}
            target="_blank"
            rel="noreferrer"
            className="pill-cta"
          >
            <span className="flex items-center -space-x-2" aria-hidden="true">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--brand-ink)] bg-[#3a3a3a] text-[9px] font-semibold text-white dark:border-[#EDEDED]">
                {t.hero.you}
              </span>
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--brand-ink)] bg-white dark:border-[#EDEDED]">
                <img src="/logo.png" alt="" className="h-4 w-auto" />
              </span>
            </span>
            {t.hero.ctaWhats}
          </a>

          <a
            href="#projetos"
            className="group flex items-center gap-1.5 text-[14px] font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            {t.hero.viewProjects}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        <p className="hero-rise hero-rise-4 mt-10 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="status-dot" aria-hidden="true" />
          {t.hero.status}
        </p>
      </div>
    </section>
  );
}
