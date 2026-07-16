import { ArrowRight, MessageCircle } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import HeroMonogram from "./HeroMonogram";
import RotatingFacts from "./RotatingFacts";
import TypeCycler from "./TypeCycler";

export default function Hero() {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const isDark = theme === "dark";

  return (
    <section
      id="inicio"
      className="hero-sky relative flex min-h-svh flex-col items-center overflow-hidden"
    >
      <div className="hero-clouds" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-[880px] flex-1 flex-col items-center justify-center px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
        <HeroMonogram isDark={isDark} />

        <div className="flex w-full flex-col items-center gap-5 text-center">
          <h1
            className="hero-headline hero-rise"
            aria-label={t.hero.ariaHeadline}
          >
            <span className="block">{t.hero.headline}</span>
            {/* key={lang}: reinicia o typewriter ao trocar de idioma */}
            <TypeCycler
              key={lang}
              texts={[...t.hero.areas]}
              className="hero-headline-area"
            />
          </h1>

          <p className="hero-rise hero-rise-2 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            {t.hero.description}
          </p>

          <div className="hero-rise hero-rise-3 mt-1 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="hero-btn hero-btn-primary btn-drain btn-drain-blue"
            >
              <span>{t.hero.startProject}</span>
              <MessageCircle className="hero-btn-icon" />
            </a>
            <a
              href="#projetos"
              className="hero-btn hero-btn-secondary btn-drain btn-drain-white"
            >
              <span>{t.hero.viewProjects}</span>
              <span className="hero-btn-circle">
                <ArrowRight className="hero-btn-arrow" />
              </span>
            </a>
          </div>

          <div className="hero-rise hero-rise-4 w-full">
            <RotatingFacts key={lang} facts={[...t.hero.facts]} />
          </div>
        </div>
      </div>
    </section>
  );
}
