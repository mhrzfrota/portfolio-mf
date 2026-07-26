import { Link } from "wouter";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";

const RING_SIZE = 132;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const PREVIEW_SCORE = 68;
const PREVIEW_BARS = [64, 47, 33];

/**
 * Seção da home que apresenta o MF Diagnóstico IA e leva à rota /diagnostico.
 * A ferramenta não fica na topbar de propósito: o acesso é só por aqui,
 * como um produto em destaque.
 */
export default function DiagnosticoSpotlight() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const s = t.diagnostico;

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl bg-[var(--brand-ink)] p-7 text-white sm:rounded-[2rem] sm:p-10 lg:p-14"
        >
          {/* Brilho azul no canto — mesmo tom de ação do site. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#0C2AFE]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#7C8CFF]/10 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
            {/* Copy + CTA */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-semibold text-[#8FA2FF]">
                <Sparkles className="h-3.5 w-3.5" />
                MF Diagnóstico IA — {s.badge}
              </span>

              <h2 className="max-w-xl text-[clamp(1.6rem,3.6vw,2.7rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
                {s.title}
              </h2>

              <p className="max-w-xl text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
                {s.subtitle}
              </p>

              <ul className="space-y-2.5">
                {s.bullets.map(item => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] text-white/85"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8FA2FF]" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col items-start gap-3 pt-1 sm:flex-row sm:items-center sm:gap-5">
                <Link href="/diagnostico" className="hero-btn hero-btn-primary">
                  <Sparkles className="hero-btn-icon" />
                  {s.cta}
                </Link>
                <span className="text-[12.5px] text-white/50">{s.note}</span>
              </div>
            </div>

            {/* Prévia do relatório (decorativa) */}
            <div
              aria-hidden="true"
              className="mx-auto w-full max-w-sm rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm sm:p-7"
            >
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  >
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={RING_STROKE}
                    />
                    <circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RING_RADIUS}
                      fill="none"
                      stroke="#8FA2FF"
                      strokeWidth={RING_STROKE}
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={RING_CIRC * (1 - PREVIEW_SCORE / 100)}
                      transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[34px] font-semibold leading-none">
                      {PREVIEW_SCORE}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                      {s.previewScore}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3.5">
                  {s.previewPillars.map((label, index) => (
                    <div key={label}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-white/75">
                          {label}
                        </span>
                        <span className="text-[12px] font-semibold tabular-nums">
                          {PREVIEW_BARS[index]}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-r-full bg-[#8FA2FF]"
                          style={{ width: `${PREVIEW_BARS[index]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
