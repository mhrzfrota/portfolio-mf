import { useEffect, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Github, LayoutGrid, Linkedin } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import RollButton from "@/components/RollButton";

/**
 * Link da bio do Instagram: uma tela curta, pensada para o celular. Céu azul
 * claro atrás (também no modo escuro), quem eu sou, o WhatsApp e três links.
 * Cada link leva data-umami-event, então o Umami mostra o que mais é clicado.
 */

/** Atraso da entrada em cascata, lido pelo .bio-rise no index.css. */
function delay(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

type BioLink = {
  key: string;
  href: string;
  external: boolean;
  icon: ReactNode;
  label: string;
};

export default function Bio() {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  // Título da aba e cor da barra do navegador no tom do céu; volta ao sair.
  useEffect(() => {
    const previousTitle = document.title;
    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    const previousColor = themeMeta?.content;

    document.title = t.bio.documentTitle;
    themeMeta?.setAttribute("content", "#2f6ae8");

    return () => {
      document.title = previousTitle;
      if (themeMeta && previousColor) themeMeta.content = previousColor;
    };
  }, [t.bio.documentTitle]);

  const links: BioLink[] = [
    {
      key: "projetos",
      href: "/#projetos",
      external: false,
      icon: <LayoutGrid className="h-5 w-5" />,
      label: t.bio.projects,
    },
    {
      key: "linkedin",
      href: "https://www.linkedin.com/in/matheusfrt",
      external: true,
      icon: <Linkedin className="h-5 w-5" />,
      label: "LinkedIn",
    },
    {
      key: "github",
      href: "https://github.com/mhrzfrota",
      external: true,
      icon: <Github className="h-5 w-5" />,
      label: "GitHub",
    },
  ];

  return (
    // Fundo no tom do céu: se o fixo atrasar na rolagem do iOS, não aparece branco.
    <div className="relative min-h-dvh overflow-x-clip bg-[#3f7df0] font-sans">
      <div className="hero-sky hero-sky--light fixed inset-0" aria-hidden="true" />
      <div className="hero-grain fixed inset-0" aria-hidden="true" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-5 pb-6 pt-[max(4rem,13dvh)]">
        <header className="flex flex-col items-center text-center text-white">
          {/* Foto quadrada no círculo: o rosto está no centro, só os cantos saem. */}
          <img
            src="/images/matheus-bio.webp"
            alt="Matheus Frota"
            width={104}
            height={104}
            className="bio-rise h-[104px] w-[104px] rounded-full bg-[#131313] object-cover shadow-[0_14px_40px_rgba(10,30,120,0.35)] ring-4 ring-white"
          />
          <h1
            className="bio-rise mt-5 text-[2.4rem] leading-none text-white"
            style={delay(80)}
          >
            Matheus Frota
          </h1>
          <p
            className="bio-rise mt-3.5 max-w-[34ch] text-[15.5px] leading-relaxed text-white/90 [text-wrap:balance]"
            style={delay(140)}
          >
            {t.bio.role}
          </p>
        </header>

        <div className="bio-rise mt-8" style={delay(220)}>
          <RollButton
            label={t.bio.whatsapp}
            href={WHATSAPP_BUDGET_URL}
            external
            variant="arrow"
            event="bio-whatsapp"
            className="bio-cta w-full justify-between"
          />
          <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-white">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
            </span>
            {t.bio.whatsappNote}
          </p>
        </div>

        <ul
          className="bio-rise mt-7 overflow-hidden rounded-[26px] bg-white/80 text-[#131313] shadow-[0_12px_36px_rgba(10,30,120,0.14)] ring-1 ring-white/70 backdrop-blur-md"
          style={delay(280)}
        >
          {links.map(link => (
            <li
              key={link.key}
              className="border-t border-[#131313]/[0.07] first:border-t-0"
            >
              <a
                href={link.href}
                {...(link.external && { target: "_blank", rel: "noreferrer" })}
                data-umami-event="bio-link"
                data-umami-event-destino={link.key}
                className="group flex h-14 items-center gap-3.5 px-5 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2453ff]"
              >
                <span className="text-[#2453ff]">{link.icon}</span>
                <span className="flex-1 text-[15.5px] font-medium tracking-[-0.02em]">
                  {link.label}
                </span>
                <ArrowUpRight
                  className="h-[18px] w-[18px] text-[#131313]/40 transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2453ff]"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>

        <p
          className="bio-rise mono-label mt-auto pt-12 text-center text-[10px] text-[#0b2a6b]/70"
          style={delay(340)}
        >
          {t.bio.footer}
        </p>
      </main>
    </div>
  );
}
