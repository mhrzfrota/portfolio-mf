import { ArrowRight, MessageCircle } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import HeroMonogram from "./HeroMonogram";
import RotatingFacts from "./RotatingFacts";
import TypeCycler from "./TypeCycler";

/* -------------------------------------------------------------------------
 * Conteúdo do hero — trocar por aqui.
 * ---------------------------------------------------------------------- */

/** Palavra fixa da manchete. */
const HEADLINE = "Desenvolvedor";

/** Áreas que se alternam. Cada uma completa a manchete acima. */
const AREAS = [
  "Full Stack.",
  "Back-end.",
  "Web.",
  "de Automações.",
  "de Soluções Digitais.",
];

const DESCRIPTION =
  "Desenvolvo sites, sistemas e automações sob medida para transformar ideias em soluções que vendem, organizam processos e economizam tempo.";

/** Linha de resultados que gira embaixo dos botões. `**assim**` vira destaque. */
const FACTS = [
  "Formado em Análise e Desenvolvimento de Sistemas pela UNIFOR.",
  "Do planejamento ao deploy: projetos com escopo claro, comunicação direta e foco nos resultados do negócio.",
  "Experiência com React, Node.js, TypeScript, PostgreSQL e integração de APIs.",
];

export default function Hero() {
  const { theme } = useTheme();
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
            className="hero-headline"
            aria-label={`${HEADLINE} fullstack — MF Services`}
          >
            <span className="block">{HEADLINE}</span>
            <TypeCycler texts={AREAS} className="hero-headline-area" />
          </h1>

          <p className="max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            {DESCRIPTION}
          </p>

          <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="hero-btn hero-btn-primary"
            >
              <span>Iniciar um projeto</span>
              <MessageCircle className="hero-btn-icon" />
            </a>
            <a href="#projetos" className="hero-btn hero-btn-secondary">
              <span>Ver projetos</span>
              <span className="hero-btn-circle">
                <ArrowRight className="hero-btn-arrow" />
              </span>
            </a>
          </div>

          <RotatingFacts facts={FACTS} />
        </div>
      </div>
    </section>
  );
}
