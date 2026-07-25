import { MessageCircle } from "lucide-react";
import { SOCIALS, WHATSAPP_BUDGET_URL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { projects } from "@/data/projects";
import HeroMonogram from "@/components/hero/HeroMonogram";
import RollButton from "@/components/RollButton";

const RING_RADIUS = 165; // px — raio do anel de thumbnails

export default function ContactSheet() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const thumbs = projects.slice(0, 12);

  return (
    <section id="contato" className="scroll-mt-20 bg-background pt-16 sm:pt-20">
      <footer className="relative overflow-hidden rounded-t-[40px] bg-[#0B0B0B] text-white">
        <span className="sheet-beam left-[16%]" aria-hidden="true" />
        <span className="sheet-beam left-[52%]" aria-hidden="true" />
        <span className="sheet-beam left-[80%]" aria-hidden="true" />

        <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-20">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
            {t.contact.directBadge}
          </span>

          <h2 className="mt-5 max-w-2xl text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.0] tracking-[-0.04em] text-white">
            {t.contact.sheetTitlePrefix}{" "}
            <em className="font-semibold italic">{t.contact.sheetTitleAccent}</em>
          </h2>

          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
            {t.contact.whatsappParagraph}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <RollButton
              variant="white"
              size="md"
              label={t.contact.sheetCta}
              href={WHATSAPP_BUDGET_URL}
              external
            />
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[14px] font-medium text-white/70 transition-colors hover:text-white"
            >
              <MessageCircle className="h-4 w-4" /> (85) 99637-0080
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/curriculo.pdf"
              download="Curriculo-Matheus-Frota.pdf"
              className="rounded-full border border-white/20 px-4 py-2 text-[13px] font-medium text-white/80 transition-colors hover:border-white hover:text-white"
            >
              {t.contact.resumeTitle} · {t.contact.downloadPdf}
            </a>
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2">
            {t.contact.highlights.map(item => (
              <li key={item.title} className="text-[12.5px] text-white/50">
                <span className="font-medium text-white/80">{item.title}</span> —{" "}
                {item.description}
              </li>
            ))}
          </ul>

          {/* Anel orbital: projetos girando ao redor do monograma 3D. */}
          <div
            className="relative mt-14 hidden h-[420px] w-[420px] items-center justify-center sm:flex"
            aria-hidden="true"
          >
            <div className="orbital-spin absolute inset-0">
              {thumbs.map((project, index) => {
                const angle = (360 / thumbs.length) * index;
                return (
                  <img
                    key={project.id}
                    src={project.image}
                    alt=""
                    loading="lazy"
                    className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-white/15 object-cover"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${RING_RADIUS}px)`,
                    }}
                  />
                );
              })}
            </div>
            {/* A folha é escura nos dois temas: environment sempre dark. */}
            <HeroMonogram isDark className="h-[220px] max-w-[320px]" />
          </div>

          <div className="mt-12 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row">
            <span>
              © {new Date().getFullYear()} MF Services — Matheus Frota ·{" "}
              {t.footer.role}
            </span>
            <nav className="flex gap-5">
              {(["projetos", "combos", "blog"] as const).map(id => (
                <a
                  key={id}
                  href={`/#${id}`}
                  className="transition-colors hover:text-white"
                >
                  {t.nav[id]}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </section>
  );
}
