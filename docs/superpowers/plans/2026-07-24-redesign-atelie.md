# Redesign "Ateliê" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin completo do portfólio na direção "Ateliê" (greige monocromático + pílulas pretas + rabiscos manuscritos, estilo budarina.studio), preservando rotas, i18n, temas e conversão.

**Architecture:** Troca de tokens/fontes primeiro (fundação), depois re-skin seção por seção da home (hero → navbar → stack → projetos → diagnóstico → combos → blog → contato/rodapé), terminando com limpeza de órfãos. Cada task deixa o site compilando e navegável.

**Tech Stack:** React 19 + Vite 7 + Tailwind 4 (tokens em `client/src/index.css` via `@theme`/CSS vars), wouter, Three.js (só no rodapé ao final). **Nenhuma dependência nova.**

**Spec:** `docs/superpowers/specs/2026-07-24-redesign-atelie-design.md`

## Global Constraints

- Cores exatas (claro): bg `#EDEDED`, card `#FFFFFF`, surface2 `#F3F3F3`, heading `#161616`, corpo `rgba(0,0,0,0.65)`, muted `#6A6A6A`, ink `#1F1F1F`, borda `#D9D9D9`, dot `#ED3131` (glow `0 0 20px rgba(237,49,49,.5)`), micro-acento `#0C2AFE`.
- Cores exatas (escuro): bg `#0F0F0F`, card `#1A1A1A`, surface2 `#171717`, heading `#F2F2F2`, corpo `rgba(255,255,255,0.65)`, muted `#9A9A9A`, borda `#2A2A2A`, micro-acento `#7C8CFF`; pílulas de CTA invertem (fundo `#EDEDED`, texto `#161616`).
- Fontes: Plus Jakarta Sans (500/600/700 + italic 600, display), Inter (400/500, corpo), Gloria Hallelujah (rabiscos, fallback Caveat/cursive), Noto Sans Mono (500, status). Titillium Web e Instrument Serif SAEM.
- Displays: tracking −0.05em (H1) / −0.04em (H2+), line-height 0.95–1.05, sentence case. Caps SÓ em badges/status mono.
- PROIBIDO texto hardcoded em componente: tudo via `getStrings(lang)` (PT e EN sempre juntos).
- PROIBIDO quebrar: deep links de WhatsApp (`WHATSAPP_BUDGET_URL` + URLs por combo em `comboMeta`), `key={lang}` do TypeCycler, ids de âncora `inicio/projetos/stack/combos/blog/contato`, rota `/diagnostico` acessada só pelo spotlight, download `/curriculo.pdf`.
- Toda animação nova precisa do caminho `prefers-reduced-motion` (bloco existente no index.css + hook `usePrefersReducedMotion`).
- Após CADA task: `pnpm check` limpo. Commit por task com mensagem indicada.

---

### Task 1: Fundações — fontes e tokens

**Files:**
- Modify: `client/index.html:11-33`
- Modify: `client/src/index.css:48-59` (@theme fontes/pesos), `:62-173` (tokens), `:175-199` (base), `:964-1000` (utilities de peso — deletar)
- Add (no index.css, seção nova após os tokens): classes `.atelier-badge`, `.scribble`, `.status-dot`, `.pill-cta`, `.hero-area`, `.hero-bubble`

**Interfaces:**
- Produces: CSS vars `--body-text`, `--accent-blue`, `--dot` (usadas nas tasks 4–12); classes `.atelier-badge`, `.scribble`, `.status-dot`, `.pill-cta`, `.hero-area`, `.hero-bubble`; `font-mono` = Noto Sans Mono; `font-display` = Plus Jakarta Sans.

- [ ] **Step 1: Trocar fontes no index.html**

Substituir as 3 ocorrências da URL do Google Fonts (preload, stylesheet media=print, noscript) por:

```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;1,600&family=Inter:wght@400;500&family=Gloria+Hallelujah&family=Noto+Sans+Mono:wght@500&display=swap
```

E `<meta name="theme-color" content="#efefef" />` → `content="#EDEDED"`.

- [ ] **Step 2: @theme — fontes e pesos**

Em `client/src/index.css`, substituir as linhas 48–59 por (remove o remapeamento de pesos do Titillium):

```css
  --font-sans: "Inter", system-ui, -apple-system, arial, sans-serif;
  --font-display: "Plus Jakarta Sans", system-ui, -apple-system, arial, sans-serif;
  --font-mono: "Noto Sans Mono", ui-monospace, "Cascadia Mono", monospace;
```

Deletar TODO o bloco `@layer utilities { .font-thin ... .font-black }` (linhas 964–1000).

- [ ] **Step 3: Tokens claro/escuro**

Substituir o bloco `:root { ... }` (linhas 62–118) por:

```css
:root {
  /* Ateliê — greige quase monocromático; cor entra pelos projetos */
  --brand-blue: #0c2afe;
  --brand-blue-dark: #001fdd;
  --brand-green: #6a6a6a; /* legado, neutralizado */
  --brand-green-dark: #4a4a4a;
  --brand-ink: #1f1f1f;

  --accent-blue: #0c2afe; /* micro-acento: links e detalhes */
  --dot: #ed3131; /* exclusivo do status de disponibilidade */
  --body-text: rgba(0, 0, 0, 0.65);

  --primary: #161616;
  --primary-foreground: #ffffff;

  --radius: 0.5rem;

  --background: #ededed;
  --foreground: #161616;
  --card: #ffffff;
  --card-foreground: #161616;
  --popover: #ffffff;
  --popover-foreground: #161616;
  --secondary: #f3f3f3;
  --secondary-foreground: #161616;
  --muted: #f3f3f3;
  --muted-foreground: #6a6a6a;
  --accent: #f3f3f3;
  --accent-foreground: #161616;
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: #d9d9d9;
  --input: #d9d9d9;
  --ring: #161616;

  --chart-1: #161616;
  --chart-2: #6a6a6a;
  --chart-3: #0c2afe;
  --chart-4: #9a9a9a;
  --chart-5: #d9d9d9;

  --sidebar: #ffffff;
  --sidebar-foreground: #161616;
  --sidebar-primary: #161616;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f3f3f3;
  --sidebar-accent-foreground: #161616;
  --sidebar-border: #d9d9d9;
  --sidebar-ring: #161616;
}
```

E o bloco `.dark { ... }` (linhas 120–173) por:

```css
.dark {
  --brand-blue: #7c8cff;
  --brand-blue-dark: #5b6cf0;
  --brand-green: #9a9a9a;
  --brand-green-dark: #6a6a6a;
  --brand-ink: #1f1f1f; /* folhas escuras continuam escuras nos dois temas */

  --accent-blue: #7c8cff;
  --dot: #ed3131;
  --body-text: rgba(255, 255, 255, 0.65);

  --primary: #ededed;
  --primary-foreground: #161616;

  --background: #0f0f0f;
  --foreground: #f2f2f2;
  --card: #1a1a1a;
  --card-foreground: #f2f2f2;
  --popover: #1a1a1a;
  --popover-foreground: #f2f2f2;
  --secondary: #171717;
  --secondary-foreground: #f2f2f2;
  --muted: #171717;
  --muted-foreground: #9a9a9a;
  --accent: #171717;
  --accent-foreground: #f2f2f2;
  --destructive: oklch(0.6 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: #2a2a2a;
  --input: #2a2a2a;
  --ring: #f2f2f2;

  --chart-1: #f2f2f2;
  --chart-2: #9a9a9a;
  --chart-3: #7c8cff;
  --chart-4: #6a6a6a;
  --chart-5: #2a2a2a;

  --sidebar: #141414;
  --sidebar-foreground: #f2f2f2;
  --sidebar-primary: #ededed;
  --sidebar-primary-foreground: #161616;
  --sidebar-accent: #171717;
  --sidebar-accent-foreground: #f2f2f2;
  --sidebar-border: #2a2a2a;
  --sidebar-ring: #f2f2f2;
}
```

- [ ] **Step 4: Base de headings e corpo**

No primeiro `@layer base` (linhas 175–199): remover `font-weight: var(--font-weight-normal);` do `body`, e trocar o bloco `h1..h6` por:

```css
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1.05;
    text-wrap: balance;
  }
```

- [ ] **Step 5: Classes novas do Ateliê**

Logo após o fechamento do `.dark { }`, adicionar:

```css
/* ---------- Ateliê: peças compartilhadas ---------- */
@layer components {
  /* Badge-pílula preta que rima as seções (SERVICES/PLANS da referência). */
  .atelier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 9999px;
    background: var(--brand-ink);
    color: #fff;
    padding: 0.4rem 0.95rem;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .dark .atelier-badge {
    background: #ededed;
    color: #161616;
  }

  /* Anotações manuscritas — sempre decorativas (aria-hidden). */
  .scribble {
    font-family: "Gloria Hallelujah", "Caveat", cursive;
    font-size: 15px;
    line-height: 1.3;
    color: var(--body-text);
  }

  /* Dot de disponibilidade com glow, exclusivo do vermelho --dot. */
  .status-dot {
    display: inline-block;
    height: 0.5rem;
    width: 0.5rem;
    flex-shrink: 0;
    border-radius: 9999px;
    background: var(--dot);
    box-shadow: 0 0 20px rgba(237, 49, 49, 0.5);
    animation: dot-pulse 1.6s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /* CTA pill preta canônica (substitui .hero-btn-primary a partir da task 9). */
  .pill-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    border-radius: 9999px;
    background: var(--brand-ink);
    color: #fff;
    padding: 0.8rem 1.5rem;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    transition:
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      background-color 0.3s ease,
      box-shadow 0.3s ease;
  }

  .pill-cta:hover {
    transform: translateY(-2px);
    background: #000;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  }

  .dark .pill-cta {
    background: #ededed;
    color: #161616;
  }

  .dark .pill-cta:hover {
    background: #fff;
  }

  /* Palavra ciclante da headline: itálico do próprio Plus Jakarta. */
  .hero-area {
    font-style: italic;
    font-weight: 600;
    letter-spacing: -0.04em;
  }

  /* Balões de depoimento do hero (rabinho via ::after rotacionado). */
  .hero-bubble {
    position: relative;
    max-width: 230px;
    border-radius: 16px;
    background: var(--brand-ink);
    color: #fff;
    padding: 0.7rem 0.95rem;
    text-align: left;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  }

  .hero-bubble::after {
    content: "";
    position: absolute;
    bottom: -5px;
    left: 26px;
    height: 12px;
    width: 12px;
    background: inherit;
    transform: rotate(45deg);
    border-radius: 2px;
  }

  .dark .hero-bubble {
    background: #ededed;
    color: #161616;
  }

  @media (prefers-reduced-motion: reduce) {
    .status-dot {
      animation: none;
    }

    .pill-cta {
      transition: none;
    }
  }
}
```

- [ ] **Step 6: Reveals com mais corpo**

Trocar o bloco `[data-reveal]` (linhas 538–549) por:

```css
  [data-reveal] {
    opacity: 0;
    transform: translateY(60px);
    transition:
      opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  [data-reveal].is-revealed {
    opacity: 1;
    transform: translateY(0);
  }
```

- [ ] **Step 7: Verificar**

Run: `pnpm check` → sem erros. `pnpm dev` → site abre greige com hero antigo por cima (esperado nesta fase: o céu azul do hero morre na task 4).

- [ ] **Step 8: Commit**

```bash
git add client/index.html client/src/index.css
git commit -m "feat(redesign): fundações Ateliê — fontes e tokens greige"
```

---

### Task 2: RollButton — variantes Ateliê

**Files:**
- Modify: `client/src/components/RollButton.tsx`
- Modify (call sites, mapear `blue→black`, `dark→black`, `white→white`): `client/src/pages/Home.tsx`, `client/src/components/Layout.tsx:281`, `client/src/components/ProjectDeck.tsx`, `client/src/pages/ProjectDetail.tsx`, `client/src/pages/BlogPost.tsx`, `client/src/features/diagnostico/components/Report.tsx` (encontrar todos com grep antes)

**Interfaces:**
- Produces: `RollButton({ label, href?, external?, download?, onClick?, variant?: "black" | "white" | "outline", size?: "sm" | "md", leading?: ReactNode, className? })` — `leading` renderiza antes do label (cluster de avatares do hero, task 4).

- [ ] **Step 1: Reescrever variantes e adicionar `leading`**

Em `RollButton.tsx`, substituir `variantStyles` e o tipo:

```tsx
const variantStyles = {
  black: {
    pill: "bg-[var(--brand-ink)] text-white hover:bg-black dark:bg-[#EDEDED] dark:text-[#161616] dark:hover:bg-white",
    circle: "bg-white text-[var(--brand-ink)] dark:bg-[#161616] dark:text-white",
  },
  white: {
    pill: "bg-white text-[#161616] shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.16)]",
    circle: "bg-[var(--brand-ink)] text-white",
  },
  outline: {
    pill: "border border-border bg-transparent text-foreground hover:border-foreground",
    circle: "border border-border text-foreground",
  },
};
```

No tipo `RollButtonProps`, `variant?: keyof typeof variantStyles;` continua; adicionar `leading?: React.ReactNode;`. Default: `variant = "black"`. No `content`, renderizar `{leading}` antes do `<span className="block h-5 overflow-hidden">`.

- [ ] **Step 2: Atualizar todos os call sites**

Run: `rg -n "RollButton" client/src --glob "*.tsx" -l` e em cada uso trocar `variant="blue"` → `variant="black"`, `variant="dark"` → `variant="black"` (manter `variant="white"`).

- [ ] **Step 3: Verificar e commitar**

Run: `pnpm check` → sem erros (um call site esquecido = erro de tipo).

```bash
git add client/src
git commit -m "feat(redesign): RollButton com variantes black/white/outline + leading"
```

---

### Task 3: i18n novo + dados de depoimentos

**Files:**
- Create: `client/src/data/testimonials.ts`
- Modify: `client/src/i18n/strings.ts` (blocos `hero`, `projects`, `combos`, `contact` em pt E en; adicionar bloco `bento`)

**Interfaces:**
- Produces: `getTestimonials(lang): Testimonial[]` com `Testimonial = { quote: string; author: string; role: string }`; chaves i18n `hero.scribble`, `hero.status`, `hero.ctaWhats`, `hero.you`, `bento.viewCase`, `combos.fixedTag`, `combos.onRequest`, `contact.sheetTitlePrefix`, `contact.sheetTitleAccent`, `contact.sheetCta`.

- [ ] **Step 1: Criar `client/src/data/testimonials.ts`**

```ts
import type { Lang } from "@/contexts/LanguageContext";

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

/**
 * Depoimentos reais de clientes — os balões do hero só aparecem quando
 * houver pelo menos um item no idioma ativo. Preencher com frases REAIS
 * (nada inventado); exemplo do formato:
 * { quote: "Entregou em 2 semanas, ficou incrível!", author: "Fulano", role: "Cliente X" }
 */
const testimonials: Record<Lang, Testimonial[]> = {
  pt: [],
  en: [],
};

export function getTestimonials(lang: Lang): Testimonial[] {
  return testimonials[lang];
}
```

- [ ] **Step 2: Atualizar strings.ts (PT)**

No bloco `pt.hero`, substituir `headline` e `areas` e adicionar chaves (manter `description`, `facts`, `ariaHeadline`, `viewProjects`):

```ts
    hero: {
      headline: "Sites e produtos digitais que fazem seu negócio",
      areas: ["crescer.", "vender.", "escalar."],
      ariaHeadline:
        "Sites e produtos digitais que fazem seu negócio crescer — MF Services",
      description:
        "Desenvolvo sites, sistemas e automações sob medida para transformar ideias em soluções que vendem, organizam processos e economizam tempo.",
      facts: [
        "Formado em Análise e Desenvolvimento de Sistemas pela UNIFOR.",
        "Do planejamento ao deploy: projetos com escopo claro, comunicação direta e foco nos resultados do negócio.",
        "Experiência com React, Node.js, TypeScript, PostgreSQL e integração de APIs.",
      ],
      startProject: "Iniciar um projeto",
      viewProjects: "Ver projetos",
      scribble: "é sério, olha os projetos ↓",
      status: "Disponível para novos projetos",
      ctaWhats: "Chamar no WhatsApp",
      you: "Você",
    },
```

Adicionar após `projects`: `bento: { viewCase: "ver case →" },`
Em `combos`, adicionar: `fixedTag: "[fixo]",` e `onRequest: "sob consulta",`
Em `contact`, adicionar: `sheetTitlePrefix: "Pronto para construir algo",`, `sheetTitleAccent: "grande?",`, `sheetCta: "Chamar no WhatsApp",`

- [ ] **Step 3: Atualizar strings.ts (EN) — espelho exato**

```ts
    hero: {
      headline: "Websites and digital products that make your business",
      areas: ["grow.", "sell.", "scale."],
      ariaHeadline:
        "Websites and digital products that make your business grow — MF Services",
      description:
        "I build custom websites, systems and automations that turn ideas into solutions that sell, organize processes and save time.",
      facts: [
        "Degree in Systems Analysis and Development from UNIFOR.",
        "From planning to deploy: projects with clear scope, direct communication and focus on business results.",
        "Experience with React, Node.js, TypeScript, PostgreSQL and API integrations.",
      ],
      startProject: "Start a project",
      viewProjects: "View projects",
      scribble: "seriously, check the projects ↓",
      status: "Available for new projects",
      ctaWhats: "Chat on WhatsApp",
      you: "You",
    },
```

`bento: { viewCase: "view case →" },` · `fixedTag: "[fixed]",` · `onRequest: "on request",` · `sheetTitlePrefix: "Ready to build something",` · `sheetTitleAccent: "big?",` · `sheetCta: "Chat on WhatsApp",`

- [ ] **Step 4: Verificar e commitar**

Run: `pnpm check` → sem erros (pt/en devem ter as MESMAS chaves — divergência = erro de tipo se o tipo for inferido do pt; conferir manualmente).

```bash
git add client/src/data/testimonials.ts client/src/i18n/strings.ts
git commit -m "feat(redesign): strings Ateliê e dados de depoimentos"
```

---

### Task 4: Hero tipográfico

**Files:**
- Rewrite: `client/src/components/hero/Hero.tsx`
- Delete: `client/src/components/hero/RotatingFacts.tsx`
- Modify: `client/src/index.css` — deletar blocos `.hero-sky`, `.dark .hero-sky`, `.hero-clouds`, `.dark .hero-clouds`, `@keyframes hero-drift`, `.hero-grain`, `.hero-monogram-in`, `@keyframes hero-monogram-in`, `.hero-headline`, `.hero-headline-area`, `.dark .hero-headline-area`, `.hero-fact`, `@keyframes hero-fact-in`; nas listas do `@media (prefers-reduced-motion...)`, remover as referências `.hero-clouds`, `.hero-fact`, `.hero-monogram-in`. **MANTER** `.hero-btn*` (ainda usados pelo diagnóstico até as tasks 9/13), `.hero-rise*`, `.type-caret`.

**Interfaces:**
- Consumes: `.pill-cta`, `.scribble`, `.status-dot`, `.hero-bubble`, `.hero-area` (task 1); `t.hero.*` novos (task 3); `getTestimonials` (task 3); `TypeCycler` (inalterado).
- Produces: hero sem WebGL; `HeroMonogram` fica órfão temporariamente (reutilizado na task 12).

- [ ] **Step 1: Reescrever Hero.tsx (arquivo inteiro)**

```tsx
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
```

- [ ] **Step 2: Deletar RotatingFacts e o CSS morto**

`git rm client/src/components/hero/RotatingFacts.tsx` e aplicar as remoções de CSS listadas em **Files** (só as listadas — `.hero-btn*`, `.hero-rise*` e `.type-caret` FICAM).

- [ ] **Step 3: Verificar e commitar**

Run: `pnpm check` → sem erros. `pnpm dev` → hero greige tipográfico, typewriter em itálico funcionando nos 2 idiomas, dot pulsando, sem balões (testimonials vazio — correto).

```bash
git add -A client/src client/index.html
git commit -m "feat(redesign): hero tipográfico Ateliê (sai monograma e facts)"
```

---

### Task 5: Navbar e menu mobile

**Files:**
- Modify: `client/src/components/Layout.tsx:145-207` (nav desktop + ações) e `:246-261` (nav mobile)

**Interfaces:**
- Consumes: `t.topbar.requestQuote` (existente).

- [ ] **Step 1: Item ativo preto (não azul)**

Nav desktop (linha ~150): trocar as classes condicionais por:

```tsx
className={cn(
  "text-[14px] transition-colors duration-300",
  activeSection === item.id
    ? "font-semibold text-foreground"
    : "text-muted-foreground hover:text-foreground"
)}
```

Nav mobile (linha ~251): trocar `"text-[#0C2AFE] dark:text-[#7C8CFF]"` por `"font-semibold text-foreground"` e o else por `"text-muted-foreground"`.

- [ ] **Step 2: CTA preto no desktop**

Dentro do `<div className="hidden items-center gap-2 pr-2 md:flex">`, após o botão de tema, adicionar:

```tsx
<a
  href={WHATSAPP_BUDGET_URL}
  target="_blank"
  rel="noreferrer"
  className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-[var(--brand-ink)] dark:hover:bg-white/90"
>
  {t.topbar.requestQuote}
</a>
```

- [ ] **Step 3: Hovers azuis → neutros**

Nos socials do menu mobile (linha ~270): `hover:border-[#0C2AFE] hover:text-[#0C2AFE]` → `hover:border-foreground hover:text-foreground`. (O footer será substituído na task 12 — não mexer nele aqui.)

- [ ] **Step 4: Verificar e commitar**

Run: `pnpm check` → sem erros. Testar scroll-spy (item ativo fica preto/bold) e o CTA novo.

```bash
git add client/src/components/Layout.tsx
git commit -m "feat(redesign): navbar Ateliê com CTA preto e ativo neutro"
```

---

### Task 6: Stack em grayscale

**Files:**
- Modify: `client/src/components/StackShowcase.tsx:27-51`

- [ ] **Step 1: Kicker mono + logos dessaturados**

Trocar as classes do `<p>` do título por:

```tsx
className="mb-8 text-center font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:mb-10"
```

E as classes do `<img>` por:

```tsx
className="h-9 w-24 object-contain opacity-55 grayscale transition-all duration-300 hover:scale-110 hover:opacity-100 hover:grayscale-0 md:h-11 md:w-28 dark:invert dark:hover:invert-0"
```

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm check`. Visual: logos cinza que ganham cor no hover, legíveis nos 2 temas.

```bash
git add client/src/components/StackShowcase.tsx
git commit -m "feat(redesign): stack marquee em grayscale"
```

---

### Task 7: BentoCollage no lugar do ProjectDeck

**Files:**
- Create: `client/src/components/LazyVideo.tsx` (extraído de ProjectsCategoryPage)
- Create: `client/src/components/BentoCollage.tsx`
- Modify: `client/src/components/ProjectsCategoryPage.tsx` (importar LazyVideo compartilhado, apagar a função local)
- Modify: `client/src/pages/Home.tsx:84-87` (trocar ProjectDeck por BentoCollage)
- Delete: `client/src/components/ProjectDeck.tsx`
- Modify: `client/src/index.css` — deletar blocos `.deck-stage`, `.deck-card`, `.deck-dim`, `.deck-count`, `@keyframes deck-count-in` e a referência `.deck-count` no bloco reduced-motion

**Interfaces:**
- Consumes: `projects` + `getProjectAction(project, lang)` (export existente de ProjectsCategoryPage), `t.projects.title`, `t.bento.viewCase`, `usePrefersReducedMotion`.
- Produces: `LazyVideo({ src, poster, title, className })` compartilhado (mesma assinatura da função local atual).

- [ ] **Step 1: Extrair LazyVideo**

Criar `client/src/components/LazyVideo.tsx` movendo a função `LazyVideo` de `ProjectsCategoryPage.tsx:249-297` sem alterações (`export default function LazyVideo(...)`, imports `useEffect`/`useRef`). Em ProjectsCategoryPage: apagar a função local e importar `LazyVideo from "@/components/LazyVideo"`.

- [ ] **Step 2: Criar BentoCollage.tsx**

```tsx
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { projects } from "@/data/projects";
import { getProjectAction } from "@/components/ProjectsCategoryPage";
import LazyVideo from "@/components/LazyVideo";
import { Link } from "wouter";

/* Colagem estilo Budarina: os projetos são a única cor da página.
   Spans assimétricos num grid de 6 colunas, 2 fileiras no desktop. */
const SPANS = [
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-4",
];

export default function BentoCollage() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const reduced = usePrefersReducedMotion();
  const featured = projects.filter(p => p.featured).slice(0, SPANS.length);

  return (
    <div className="bg-background pb-4 pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <h2
          data-reveal
          className="mb-8 text-[clamp(1.75rem,5vw,3.5rem)] font-semibold tracking-[-0.04em] text-foreground sm:mb-10"
        >
          {t.projects.title}
        </h2>

        <div
          data-reveal
          className="reveal-delay-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:gap-5"
        >
          {featured.map((project, index) => {
            const action = getProjectAction(project, lang);
            const media = reduced || !project.video ? (
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <LazyVideo
                src={project.video}
                poster={project.image}
                title={project.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            );

            const tileInner = (
              <>
                {media}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {project.title}
                  </span>
                  <span className="scribble shrink-0 text-[13px] text-white">
                    {t.bento.viewCase}
                  </span>
                </span>
              </>
            );

            const tileClass = `group relative block aspect-[16/11] overflow-hidden rounded-2xl bg-card shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)] md:aspect-auto md:h-[240px] lg:h-[300px] ${SPANS[index]}`;

            return action.external ? (
              <a
                key={project.id}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${action.label}: ${project.title}`}
                className={tileClass}
              >
                {tileInner}
              </a>
            ) : (
              <Link
                key={project.id}
                href={action.href}
                aria-label={`${action.label}: ${project.title}`}
                className={tileClass}
              >
                {tileInner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Trocar na Home e deletar o deck**

Em `Home.tsx`: trocar `import ProjectDeck from "@/components/ProjectDeck";` por `import BentoCollage from "@/components/BentoCollage";` e, na seção `#projetos`, `<ProjectDeck />` por `<BentoCollage />`. Depois `git rm client/src/components/ProjectDeck.tsx` e remover o CSS do deck listado em **Files**.

- [ ] **Step 4: Verificar e commitar**

Run: `pnpm check` → sem erros. Visual: colagem com vídeos tocando ao entrar na viewport; com reduced-motion, só posters; âncora `#projetos` continua funcionando.

```bash
git add -A client/src
git commit -m "feat(redesign): bento collage de projetos substitui o deck"
```

---

### Task 8: Grade de projetos re-skin

**Files:**
- Modify: `client/src/components/ProjectsCategoryPage.tsx:59-64` (filtros), `:371,383` (ícones)

- [ ] **Step 1: Neutralizar hovers azuis**

Filtro inativo: `"border-border bg-card text-muted-foreground hover:border-[#0C2AFE] hover:text-[#0C2AFE]"` → `"border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"`.
Nos DOIS círculos de ícone (ExternalLink e Github): `hover:border-[#0C2AFE] hover:text-[#0C2AFE]` → `hover:border-foreground hover:text-foreground`.
No `<h2>` (linha 47): `font-medium` → `font-semibold` e `tracking-[-0.03em]` → `tracking-[-0.04em]`.

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm check`.

```bash
git add client/src/components/ProjectsCategoryPage.tsx
git commit -m "feat(redesign): grade de projetos com hovers neutros"
```

---

### Task 9: Diagnóstico como folha branca

**Files:**
- Rewrite (só classes/estrutura visual, mesma lógica): `client/src/components/DiagnosticoSpotlight.tsx`

**Interfaces:**
- Consumes: `.atelier-badge`, `.pill-cta` (task 1); chaves `t.diagnostico.*` existentes.
- Produces: nenhum uso restante de `.hero-btn*` neste arquivo.

- [ ] **Step 1: Re-skin do componente**

Manter imports/constantes (RING_*, PREVIEW_*) e a estrutura de dados. Substituir o JSX de apresentação:

- `<section className="bg-background py-16 sm:py-20 lg:py-28">` mantém; painel vira:
  `className="relative overflow-hidden rounded-[clamp(2rem,5vw,3.5rem)] bg-card p-7 text-foreground shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)] sm:p-10 lg:p-14"` (remover os DOIS divs de glow azul).
- Badge: `<span className="atelier-badge"><Sparkles className="h-3.5 w-3.5" />MF Diagnóstico IA — {s.badge}</span>`
- `<h2 className="max-w-xl text-[clamp(1.6rem,3.6vw,2.7rem)] font-semibold leading-[1.05] tracking-[-0.04em]">{s.title}</h2>`
- Parágrafo: `text-white/70` → `text-[var(--body-text)]`.
- Bullets: `text-white/85` → `text-foreground`; ícone `text-[#8FA2FF]` → `text-foreground`.
- CTA: `<Link href="/diagnostico" className="pill-cta"><Sparkles className="h-4 w-4" />{s.cta}</Link>`; nota `text-white/50` → `text-muted-foreground`.
- Prévia: container `bg-white/[0.06] ring-white/10 backdrop-blur-sm` → `bg-secondary ring-1 ring-border` (sem blur); círculo de trilha `stroke="rgba(255,255,255,0.12)"` → `stroke="var(--border)"`; círculo de progresso `stroke="#8FA2FF"` → `stroke="currentColor"` com `className="text-foreground"`; labels `text-white/75` → `text-muted-foreground`; barras `bg-white/10` → `bg-border` e `bg-[#8FA2FF]` → `bg-foreground`; número mantém `text-foreground` implícito.

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm check`. Visual nos 2 temas (no escuro a folha é `--card` #1A1A1A — correto).

```bash
git add client/src/components/DiagnosticoSpotlight.tsx
git commit -m "feat(redesign): diagnóstico como folha clara de cantos gigantes"
```

---

### Task 10: Combos no padrão de pricing Budarina

**Files:**
- Modify: `client/src/pages/Home.tsx` — bloco `comboMeta` (37–56) e seção `#combos` (96–224)

**Interfaces:**
- Consumes: `t.combos.fixedTag`, `t.combos.onRequest` (task 3); `RollButton` variant black (task 2).

- [ ] **Step 1: Layout destacado + 2**

Na seção `#combos`, substituir o grid único por: card largo do combo `featured` primeiro, depois grid `md:grid-cols-2` com os outros dois:

```tsx
{(() => {
  const featured = combos.find(combo => combo.featured)!;
  const others = combos.filter(combo => !combo.featured);

  const priceLine = (combo: (typeof combos)[number]) => (
    <div className="mt-6 flex items-baseline gap-2">
      <span className="text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[28px]">
        {combo.price ?? t.combos.onRequest}
      </span>
      {combo.price && (
        <span className="text-[13px] font-medium text-muted-foreground">
          {t.combos.fixedTag}
        </span>
      )}
    </div>
  );

  return (
    <div data-reveal className="reveal-delay-2 mt-10 space-y-5 sm:mt-14 lg:space-y-6">
      {/* Destaque largo */}
      <div className="relative grid gap-8 rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] sm:p-9 lg:grid-cols-[1fr_1fr] lg:p-11">
        <span className="atelier-badge absolute right-6 top-6">{t.combos.mostChosen}</span>
        <div className="flex flex-col">
          <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
            <featured.icon className="h-6 w-6" />
          </span>
          <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">{featured.name}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--body-text)]">{featured.tagline}</p>
          {priceLine(featured)}
          <RollButton className="mt-8 w-fit" size="md" variant="black" label={t.combos.cta} href={featured.href} external />
        </div>
        <ul className="flex flex-col justify-center gap-3 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {featured.features.map(feature => (
            <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-snug text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Dois menores */}
      <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
        {others.map(combo => (
          <div key={combo.name} className="flex flex-col rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] sm:p-8">
            <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
              <combo.icon className="h-6 w-6" />
            </span>
            <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">{combo.name}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--body-text)] sm:text-[14px]">{combo.tagline}</p>
            {priceLine(combo)}
            <div className="my-6 h-px w-full bg-border" />
            <ul className="flex flex-1 flex-col gap-3">
              {combo.features.map(feature => (
                <li key={feature} className="flex items-start gap-2.5 text-[13px] leading-snug text-foreground sm:text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
            <RollButton className="mt-8 w-full" size="md" variant="black" label={t.combos.cta} href={combo.href} external />
          </div>
        ))}
      </div>
    </div>
  );
})()}
```

Título da seção (`<h2>`): `font-medium` → `font-semibold`, `tracking-[-0.02em]` → `tracking-[-0.04em]`; subtítulo: `text-muted-foreground` → `text-[var(--body-text)]`. Os `href` dos combos NÃO mudam.

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm check`. Visual: destaque largo com features à direita; 3 CTAs abrindo WhatsApp com as mensagens corretas.

```bash
git add client/src/pages/Home.tsx
git commit -m "feat(redesign): combos no padrão pricing Ateliê"
```

---

### Task 11: Blog com capas neutras

**Files:**
- Modify: `client/src/data/posts.ts` — campo `cover` dos 3 posts em `postsPt` E `postsEn`
- Modify: `client/src/pages/Home.tsx` — seção `#blog` (227–303)

- [ ] **Step 1: Covers neutras (mesmos valores em pt e en, por id)**

id 1: `"bg-[#E4E2DE] dark:bg-[#1D1D1B]"` · id 2: `"bg-[#DDDEE2] dark:bg-[#1A1C20]"` · id 3: `"bg-[#E6E4DF] dark:bg-[#1E1D1A]"`

- [ ] **Step 2: Elementos da capa para tinta escura**

Na seção blog da Home: número `text-white/90` → `text-foreground/80`; Starburst `text-white/10` → `text-foreground/10`; pill readTime `bg-white/15 ... text-white backdrop-blur` → `border border-foreground/15 text-foreground/70`; título hover `group-hover:text-[#0C2AFE]` → `group-hover:text-[var(--accent-blue)] group-hover:underline underline-offset-4`; link "Ler artigo" `text-[#0C2AFE]` → `text-[var(--accent-blue)]`; `<h2>` `font-medium` → `font-semibold` + `tracking-[-0.04em]`; sombra hover do card → `hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]`.

- [ ] **Step 3: Verificar e commitar**

Run: `pnpm check`. Visual nos 2 temas.

```bash
git add client/src/data/posts.ts client/src/pages/Home.tsx
git commit -m "feat(redesign): blog com capas neutras e acentos mínimos"
```

---

### Task 12: ContactSheet — folha preta com anel orbital e monograma

**Files:**
- Create: `client/src/components/ContactSheet.tsx`
- Modify: `client/src/const.ts` (exportar `SOCIALS`), `client/src/components/Layout.tsx` (usar SOCIALS; substituir `<footer>...</footer>` por `<ContactSheet />`), `client/src/pages/Home.tsx` (remover a seção `#contato` inteira e imports órfãos), `client/src/components/hero/HeroMonogram.tsx` (aceitar `className`), `client/src/index.css` (classes orbitais)

**Interfaces:**
- Consumes: `HeroMonogram({ isDark, className? })`; `t.contact.*` (+ `sheetTitlePrefix/sheetTitleAccent/sheetCta` da task 3), `t.nav`, `t.footer.role`; `RollButton` white/outline; `projects` (thumbnails).
- Produces: `SOCIALS: { href, label, Icon }[]` em `const.ts`; `<ContactSheet />` renderizado pelo Layout em TODAS as rotas com `id="contato"` (scroll-spy continua achando a âncora).

- [ ] **Step 1: SOCIALS compartilhado**

Mover o array `socials` de `Layout.tsx:24-37` para `client/src/const.ts` como `export const SOCIALS = [...]` (mesmo conteúdo, incluindo o import dos ícones lucide). Layout importa `SOCIALS` e apaga o array local.

- [ ] **Step 2: HeroMonogram com tamanho configurável**

Em `HeroMonogram.tsx`, trocar a assinatura por `({ isDark, className }: { isDark: boolean; className?: string })` e o container por:

```tsx
<div className={cn("relative h-[clamp(170px,26vh,280px)] w-full max-w-[600px]", className)}>
```

E o halo: trocar as classes condicionais `isDark ? "bg-[#2f5bff]/30" : "bg-white/30"` por `"bg-white/10"` (a peça agora vive só sobre a folha preta).

- [ ] **Step 3: CSS orbital**

Adicionar ao index.css (dentro do `@layer components` do Ateliê da task 1):

```css
  /* Anel orbital do rodapé: gira o container; thumbs circulares dispensam
     contra-rotação. */
  .orbital-spin {
    animation: orbital-spin 60s linear infinite;
  }

  @keyframes orbital-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Feixes de luz da folha preta (skew fixo, sem animação). */
  .sheet-beam {
    position: absolute;
    top: -20%;
    height: 140%;
    width: 3.5rem;
    background: rgba(255, 255, 255, 0.05);
    transform: skewX(45deg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .orbital-spin {
      animation: none;
    }
  }
```

- [ ] **Step 4: Criar ContactSheet.tsx**

```tsx
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
                <span className="font-medium text-white/80">{item.title}</span> — {item.description}
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
              © {new Date().getFullYear()} MF Services — Matheus Frota · {t.footer.role}
            </span>
            <nav className="flex gap-5">
              {(["projetos", "combos", "blog"] as const).map(id => (
                <a key={id} href={`/#${id}`} className="transition-colors hover:text-white">
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
```

- [ ] **Step 5: Ligar no Layout e limpar a Home**

Layout: importar ContactSheet; substituir todo o bloco `<footer className="border-t ...">...</footer>` por `<ContactSheet />` (fora do `<main>`, mesma posição). Home: apagar a seção `#contato` inteira (linhas 306–421) e remover imports que ficarem órfãos (`MessageCircle`, `WHATSAPP_BUDGET_URL` se não sobrar uso).

- [ ] **Step 6: Verificar e commitar**

Run: `pnpm check` → sem erros. Visual: folha preta em TODAS as rotas; âncora Contato navega até ela; anel gira (e para com reduced-motion); monograma 3D carrega ao aproximar (lazy) e aceita drag; downloads/links ok.

```bash
git add -A client/src
git commit -m "feat(redesign): folha preta de contato com anel orbital e monograma"
```

---

### Task 13: Limpeza de órfãos e páginas internas

**Files:**
- Delete: `client/src/components/ProjectCarousel.tsx`, `client/src/components/SectionBadge.tsx`, `client/src/components/ui/button.tsx`
- Modify: `client/src/index.css` — remover `.nike-pill`, `.liquid-glass`, `.liquid-glass::before`, `.liquid-glass-strong`, `.project-carousel-scroll` (+ blocos webkit/media), `.project-carousel-card-title/-description`, `.hero-btn*` (todos) e suas referências no bloco reduced-motion, `.brand-border`, `.brand-card` (SE o grep confirmar zero usos)
- Modify: `client/src/pages/ProjectDetail.tsx`, `client/src/pages/BlogPost.tsx`, `client/src/pages/NotFound.tsx`, `client/src/features/diagnostico/**` (somente onde o grep apontar)

- [ ] **Step 1: Confirmar órfãos e deletar**

Run: `rg -n "ProjectCarousel|SectionBadge|ui/button" client/src` → só as próprias definições. Então `git rm` os 3 arquivos.

- [ ] **Step 2: Migrar usos remanescentes de estilos antigos**

Run: `rg -n "hero-btn|liquid-glass|nike-pill|brand-border|brand-card" client/src --glob "*.tsx"`
Para cada hit: `hero-btn hero-btn-primary` → `pill-cta`; `hero-btn hero-btn-secondary` (se houver) → `rounded-full bg-card px-5 py-3 text-[14px] font-medium text-foreground shadow-[0_3px_4px_-2px_rgba(0,0,0,0.1)]`; `brand-border`/`brand-card`/`liquid-glass*`/`nike-pill` → remover a classe (ou `border border-border bg-card` quando precisar de card). Depois deletar os blocos CSS listados em **Files**.

- [ ] **Step 3: Varredura de azul hardcoded**

Run: `rg -n "#0C2AFE|#001FDD|#7C8CFF|#8FA2FF" client/src --glob "*.tsx"`
Regra: em páginas internas (ProjectDetail/BlogPost/NotFound/diagnostico), trocar cor de TEXTO/hover por `var(--accent-blue)` e fundos azuis decorativos por neutros (`bg-secondary`/`text-foreground`). O azul só sobrevive como micro-acento de link/hover.

- [ ] **Step 4: Verificar e commitar**

Run: `pnpm check` e `pnpm test` → limpos. `pnpm build` → ok.

```bash
git add -A client/src
git commit -m "chore(redesign): remove órfãos e estilos legados"
```

---

### Task 14: Verificação final

- [ ] **Step 1: Suíte completa**

Run: `pnpm check && pnpm test && pnpm build` → tudo limpo.

- [ ] **Step 2: Matriz manual (pnpm dev)**

1. Claro/escuro × PT/EN: hero (typewriter reinicia ao trocar idioma), navbar (CTA, item ativo), bento, diagnóstico, combos, blog, folha preta.
2. Mobile (≤768px): menu bottom-sheet, bento em 1–2 colunas, folha preta sem anel (hidden sm), textos legíveis.
3. `prefers-reduced-motion`: sem marquee/pulso/orbital/typewriter (mostra primeiro texto), reveals visíveis.
4. Conversão: TODOS os links WhatsApp (hero, navbar desktop+mobile, 3 combos, folha preta, telefone) abrem com as mensagens corretas; `/curriculo.pdf` baixa; `/diagnostico` acessível só pelo spotlight; âncoras e scroll-spy ok.
5. Rotas internas: `/projetos/clipradio`, `/blog/:slug`, 404 — consistentes com o novo visual.

- [ ] **Step 3: Corrigir o que a matriz apontar e commitar**

```bash
git add -A
git commit -m "fix(redesign): ajustes finais da verificação"
```

---

## Progresso da execução

- **Task 1: COMPLETA** (commits `22b5419` + `f68ecec`, review aprovado). Retomar na **Task 2**.
- Modo: superpowers:subagent-driven-development, branch `feat/redesign-atelie`.

## Self-review do plano (executado na escrita)

- **Cobertura do spec:** tokens (T1), tipografia (T1), navbar (T5), hero (T4), stack (T6), bento+deck (T7), grade (T8), diagnóstico (T9), combos (T10), blog (T11), contato/rodapé/orbital/monograma (T12), remoções e páginas internas (T13), verificação (T14). Testimonials: dados na T3, render na T4. ✓
- **Divergência consciente do spec:** `MonogramScene` NÃO precisa de prop `variant` — o environment escuro vem de `isDark={true}` fixo no ContactSheet (menos código, mesmo efeito). O spec citava a prop como meio, não fim.
- **Tipos consistentes:** RollButton `black/white/outline` definido na T2 e usado nas T10/T12; `LazyVideo` extraído na T7 antes do uso; `SOCIALS` criado na T12 no mesmo commit que o consome; chaves i18n criadas na T3 antes das T4/T10/T12.
