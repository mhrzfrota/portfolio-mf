import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  Layers,
  Rocket,
} from "lucide-react";
import { Link } from "wouter";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { getPosts } from "@/data/posts";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import AboutBento from "@/components/AboutBento";
import GlassMonogram from "@/components/GlassMonogram";
import ProjectsShowcase, {
  landingProjects,
  otherProjects,
} from "@/components/ProjectsShowcase";
import StackShowcase from "@/components/StackShowcase";
import Hero from "@/components/hero/Hero";
import RollButton from "@/components/RollButton";
import SectionHeader from "@/components/SectionHeader";
import { cn } from "@/lib/utils";

const WHATSAPP_BASE = "https://wa.me/5585996370080?text=";

function formatDate(value: string, lang: Lang) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/** Parte fixa dos combos (ícone, preço, link); textos vêm do dicionário i18n. */
const comboMeta = [
  {
    icon: Rocket,
    price: "R$ 500",
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20pela%20Presen%C3%A7a%20Digital.`,
    featured: false,
  },
  {
    icon: BarChart3,
    price: null,
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20por%20Opera%C3%A7%C3%A3o%20%26%20Dados.`,
    featured: true,
  },
  {
    icon: Layers,
    price: null,
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20pelo%20Produto%20Completo.`,
    featured: false,
  },
];

function StarburstIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

export default function Home() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const posts = getPosts(lang);
  const combos = comboMeta.map((meta, index) => ({
    ...meta,
    ...t.combos.items[index],
  }));

  return (
    <div className="flex flex-col">
      <Hero />

      {/* Ordem da referência: hero → faixa de logos → sobre → serviços →
          destaque → preços → blog → CTA final. */}
      <StackShowcase />

      <AboutBento />

      {/* Sistemas, plataformas e sites em cima; landing pages logo abaixo, no
          lugar onde ficava o Diagnóstico. São públicos diferentes: quem
          procura sistema não procura página de captura. */}
      <ProjectsShowcase
        id="projetos"
        eyebrow={t.nav.projetos}
        title={t.projects.title}
        subtitle={t.projects.subtitle}
        projects={otherProjects}
      />

      <ProjectsShowcase
        id="landing-pages"
        eyebrow={t.projects.landingEyebrow}
        title={t.projects.landingTitle}
        subtitle={t.projects.landingSubtitle}
        projects={landingProjects}
      />

      {/* COMBOS — o "Pricing" da referência */}
      <section id="combos" className="section-box section-pad scroll-mt-24">
        <div className="container padding-global">
          <SectionHeader
            eyebrow={t.nav.combos}
            title={t.combos.title}
            subtitle={t.combos.subtitle}
          />

          <div
            data-anim="card-reveal"
            data-anim-children
            className="mt-12 grid items-stretch gap-5 sm:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {combos.map(combo => (
              <div
                key={combo.name}
                className={cn(
                  "group relative flex flex-col rounded-[20px] p-7 transition-shadow duration-300 sm:p-8",
                  combo.featured
                    ? // O plano em destaque era preto; vira azul sólido, que é
                      // onde o lime da referência morava.
                      "bg-primary text-white hover:shadow-[0_24px_50px_rgba(12,42,254,0.35)]"
                    : "a-card hover:shadow-[0_18px_40px_rgba(13,30,80,0.1)]"
                )}
              >
                {combo.featured && (
                  <span className="mono-label absolute right-6 top-7 rounded-full bg-white px-3 py-1 text-[10px] text-primary">
                    {t.combos.mostChosen}
                  </span>
                )}

                <span
                  className={cn(
                    "mb-6 flex h-12 w-12 items-center justify-center rounded-xl",
                    combo.featured
                      ? "bg-white text-primary"
                      : "bg-primary text-white"
                  )}
                >
                  <combo.icon className="h-6 w-6" />
                </span>

                <h3
                  className={cn(
                    "mono-label text-[12px]",
                    combo.featured ? "text-white/90" : "text-muted-foreground"
                  )}
                >
                  {combo.name}
                </h3>
                <p
                  className={cn(
                    "mt-3 text-[17px] font-medium leading-snug tracking-[-0.04em]",
                    combo.featured ? "text-white" : "text-foreground"
                  )}
                >
                  {combo.tagline}
                </p>

                {combo.price && (
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "mono-label text-[11px]",
                        combo.featured
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {t.combos.from}
                    </span>
                    <span
                      className={cn(
                        "text-[30px] font-medium tracking-[-0.06em]",
                        combo.featured ? "text-white" : "text-foreground"
                      )}
                    >
                      {combo.price}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "my-6 h-px w-full",
                    combo.featured ? "bg-white/20" : "bg-border"
                  )}
                />

                <ul className="flex flex-1 flex-col gap-3">
                  {combo.features.map(feature => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-start gap-2.5 text-[14px] leading-snug",
                        combo.featured ? "text-white/90" : "text-foreground"
                      )}
                    >
                      {/* Check em círculo preenchido, como na referência. */}
                      <span
                        className={cn(
                          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                          combo.featured
                            ? "bg-white text-primary"
                            : "bg-primary text-white"
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <RollButton
                  className="mt-8 w-full"
                  variant={combo.featured ? "light" : "dark"}
                  label={t.combos.cta}
                  href={combo.href}
                  external
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG — a referência põe um botão "VIEW ALL" no cabeçalho; aqui não há
          rota de índice do blog (só /blog/:slug), então ele ficaria sem destino. */}
      <section id="blog" className="section-box section-pad scroll-mt-24">
        <div className="container padding-global">
          <SectionHeader
            eyebrow={t.nav.blog}
            title={t.blog.title}
            subtitle={t.blog.subtitle}
          />

          <div
            data-anim="card-reveal"
            data-anim-children
            className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-3 lg:gap-6"
          >
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="a-card group flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(13,30,80,0.12)]"
              >
                {/* A capa é um degradê, não foto: o zoom de 1.06 do hover roda
                    no bloco inteiro, junto com o giro do starburst. */}
                <div className="relative h-40 overflow-hidden sm:h-44">
                  <div
                    className={cn(
                      "absolute inset-0 flex items-end justify-end p-5 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]",
                      post.cover
                    )}
                  >
                    <StarburstIcon className="absolute -right-7 -top-7 h-32 w-32 rotate-12 fill-current text-white/10 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:rotate-45" />
                    <span className="mono-label relative rounded-full bg-white/20 px-3 py-1 text-[10px] text-white backdrop-blur">
                      {post.readTime}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
                  <span className="mono-label flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar size={13} /> {formatDate(post.date, lang)}
                  </span>

                  <h3 className="text-[19px] font-medium leading-snug tracking-[-0.04em] text-foreground transition-transform duration-300 group-hover:-translate-y-1">
                    {post.title}
                  </h3>

                  <p className="flex-1 text-[14px] leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map(tag => (
                      <span
                        key={tag}
                        className="mono-label rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="mono-label mt-1 flex items-center gap-1.5 text-[11px] text-primary">
                    {t.blog.readArticle}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO — o CTA final da referência: a seção INTEIRA é o bloco de
          céu, conteúdo alinhado à esquerda e um único botão; a metade direita
          fica livre para a foto (hoje o degradê, depois o vídeo em loop).
          Telefone e currículo moram agora no rodapé; os três passos do
          processo saíram — a referência fecha limpa, só com o convite. */}
      <section
        id="contato"
        className="hero-sky section-box relative overflow-hidden scroll-mt-24"
      >
        <div className="hero-grain" aria-hidden="true" />

        {/* A metade direita era o vão que sobrava: agora fecha a página com a
            marca em vidro fosco, que dá pra girar com o mouse. Só a partir de
            xl: abaixo disso o texto chega perto demais e a peça passaria por
            cima dele.

            z-10 + pointer-events: o bloco de texto vem depois no DOM e cobria
            a peça, comendo o arraste. Só o canvas volta a receber ponteiro. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[46%] items-center justify-center xl:flex"
        >
          <GlassMonogram className="h-[min(74%,420px)] w-[min(88%,560px)]" />
        </div>

        <div className="container padding-global relative py-20 sm:py-28 lg:py-32">
          <div
            data-anim="fade-up"
            data-anim-children
            className="max-w-2xl space-y-6"
          >
            <span className="mono-label inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-white" />
              {t.contact.directBadge}
            </span>

            <h2 className="text-white">{t.contact.title}</h2>

            <p className="max-w-md text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_10px_rgba(10,30,90,0.35)] sm:text-[16px]">
              {t.contact.subtitle}
            </p>

            <div className="pt-2">
              <RollButton
                variant="arrow"
                label={t.contact.sendMessage}
                href={WHATSAPP_BUDGET_URL}
                external
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
