import { WHATSAPP_BUDGET_URL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import RollButton from "@/components/RollButton";
import TypeCycler from "./TypeCycler";

/**
 * Hero no desenho da referência: céu azul vivo, título branco em duas linhas,
 * dois botões e o anel 3D de projetos atravessando a base — os fatos rotativos
 * fecham a seção onde a referência põe o "Rated 4.9/5".
 *
 * O monograma 3D saiu daqui (e com ele o chunk de ~950 kB do three.js na
 * home). O componente continua em components/hero/HeroMonogram.tsx, pronto
 * para a seção onde o usuário decidir usá-lo.
 *
 * Vídeo de céu em loop: enquanto não existir, o degradê `.hero-sky` sustenta a
 * seção. Para ligar, exporte o loop e o poster e preencha as constantes.
 */
const SKY_VIDEO: string | null = null;
const SKY_POSTER: string | null = null;

export default function Hero() {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  // O split sai daqui e não de uma mutação no DOM: o <h1> hospeda o TypeCycler,
  // que re-renderiza a cada caractere e apagaria spans criados por fora.
  const words = t.hero.headline.split(" ");

  return (
    <section
      id="inicio"
      className="section-box relative flex min-h-[calc(100svh-16px)] flex-col overflow-hidden md:min-h-[calc(100svh-24px)]"
    >
      <div className="hero-sky absolute inset-0" aria-hidden="true" />

      {SKY_VIDEO && (
        <video
          className="hero-sky-media"
          src={SKY_VIDEO}
          poster={SKY_POSTER ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      )}

      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-[880px] flex-1 flex-col items-center justify-center px-5 pb-10 pt-28 text-center sm:px-8 sm:pt-32">
        <h1 aria-label={t.hero.ariaHeadline} className="text-white">
          <span data-anim="hero-words" className="block" aria-hidden="true">
            {words.map((word, index) => (
              <span key={`${word}-${index}`} className="split-word">
                {index > 0 ? ` ${word}` : word}
              </span>
            ))}
          </span>

          {/* Segunda linha em 73% de opacidade, como na referência: a
              profundidade vem do contraste entre as duas linhas, não de uma
              cor nova. key={lang} reinicia o typewriter ao trocar de idioma. */}
          <TypeCycler
            key={lang}
            texts={[...t.hero.areas]}
            className="block opacity-[0.73]"
          />
        </h1>

        <p
          data-anim="fade-up"
          data-anim-delay="0.5"
          className="mt-6 max-w-xl text-balance text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(10,30,90,0.35)] sm:text-[17px]"
        >
          {t.hero.description}
        </p>

        <div
          data-anim="fade-up"
          data-anim-delay="0.65"
          data-anim-children
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <RollButton
            variant="glass"
            label={t.hero.viewProjects}
            href="#projetos"
          />
          <RollButton
            variant="arrow"
            label={t.hero.startProject}
            href={WHATSAPP_BUDGET_URL}
            external
          />
        </div>
      </div>
    </section>
  );
}
