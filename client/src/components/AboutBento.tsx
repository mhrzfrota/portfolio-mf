import { GraduationCap, MapPin } from "lucide-react";
import { projects } from "@/data/projects";
import { STACK } from "@/components/StackShowcase";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import SectionHeader from "@/components/SectionHeader";

/**
 * Bento de números, no lugar do bloco "About" da referência.
 *
 * Os dois contadores saem dos dados reais do repositório (quantidade de
 * projetos e de tecnologias na stack), então nunca ficam desatualizados nem
 * viram número inventado. Os outros dois cards são fatos verificáveis do
 * currículo, não métricas.
 */
const PROJECT_COUNT = projects.length;
const STACK_COUNT = STACK.length;

export default function AboutBento() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const s = t.about;

  return (
    <section id="sobre" className="section-box section-pad scroll-mt-24">
      <div className="container padding-global">
        <SectionHeader
          eyebrow={t.nav.sobre}
          title={s.title}
          subtitle={s.subtitle}
        />

        <div
          data-anim="card-reveal"
          data-anim-children
          className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Projetos — card azul, o destaque do bento */}
          <div className="flex flex-col justify-between gap-8 rounded-[20px] bg-primary p-7 text-white">
            <span
              data-anim="count"
              data-anim-to={PROJECT_COUNT}
              data-anim-suffix=""
              className="text-[56px] font-medium leading-none tracking-[-0.06em]"
            >
              {PROJECT_COUNT}
            </span>
            <p className="text-[14px] leading-relaxed text-white/85">
              {s.projectsLabel}
            </p>
          </div>

          {/* Stack — card cinza com os logos reais empilhados */}
          <div className="a-card-muted flex flex-col justify-between gap-8 p-7">
            <span
              data-anim="count"
              data-anim-to={STACK_COUNT}
              data-anim-suffix=""
              className="text-[56px] font-medium leading-none tracking-[-0.06em] text-foreground"
            >
              {STACK_COUNT}
            </span>
            <div>
              <div className="mb-4 flex -space-x-2">
                {STACK.slice(0, 5).map(tech => (
                  <span
                    key={tech.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-2 ring-[var(--grey-50)]"
                    title={tech.name}
                  >
                    <img
                      src={tech.logo}
                      alt=""
                      className="h-4 w-4 object-contain"
                      loading="lazy"
                    />
                  </span>
                ))}
              </div>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                {s.stackLabel}
              </p>
            </div>
          </div>

          {/* Formação — card branco com borda */}
          <div className="a-card flex flex-col justify-between gap-8 p-7">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-[32px] font-medium leading-none tracking-[-0.06em] text-foreground">
                {s.degreeValue}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {s.degreeLabel}
              </p>
            </div>
          </div>

          {/* Base — card preto, fechando o bento */}
          <div className="flex flex-col justify-between gap-8 rounded-[20px] bg-[var(--brand-ink)] p-7 text-white">
            <MapPin className="h-8 w-8 text-white/70" />
            <div>
              <p className="text-[32px] font-medium leading-none tracking-[-0.06em]">
                {s.baseValue}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-white/75">
                {s.baseLabel}
              </p>
            </div>
          </div>
        </div>

        <p
          data-anim="fade-up"
          className="mt-10 max-w-3xl text-[clamp(1.25rem,2.6vw,1.75rem)] font-medium leading-snug tracking-[-0.04em] text-foreground"
        >
          {s.quote}
        </p>
      </div>
    </section>
  );
}
