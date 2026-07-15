import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  Layers,
  MessageCircle,
  Rocket,
} from "lucide-react";
import { Link } from "wouter";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { posts } from "@/data/posts";
import ProjectsCategoryPage from "@/components/ProjectsCategoryPage";
import StackShowcase from "@/components/StackShowcase";
import Hero from "@/components/hero/Hero";
import RollButton from "@/components/RollButton";
import SectionBadge from "@/components/SectionBadge";
import { cn } from "@/lib/utils";

const WHATSAPP_BASE = "https://wa.me/5585996370080?text=";

const combos = [
  {
    icon: Rocket,
    name: "Presença Digital",
    price: "R$ 500",
    tagline: "Para colocar seu negócio no ar com uma página que converte.",
    features: [
      "Landing page responsiva e rápida",
      "Design e textos focados em conversão",
      "Formulário e botão de WhatsApp",
      "Domínio, deploy e SEO básico",
    ],
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Tenho%20interesse%20no%20combo%20Presen%C3%A7a%20Digital.`,
    featured: false,
  },
  {
    icon: BarChart3,
    name: "Operação & Dados",
    tagline: "Para quem já vende e quer organizar dados e ganhar tempo.",
    features: [
      "Dashboard de métricas em tempo quase real",
      "Integração de APIs (Meta, planilhas, etc.)",
      "Automação de rotinas repetitivas",
      "Tratamento e organização de dados",
    ],
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Tenho%20interesse%20no%20combo%20Opera%C3%A7%C3%A3o%20%26%20Dados.`,
    featured: true,
  },
  {
    icon: Layers,
    name: "Produto Completo",
    tagline: "Para tirar uma ideia do papel como um sistema sob medida.",
    features: [
      "Aplicação fullstack (back + front)",
      "Banco de dados e autenticação",
      "Painel administrativo sob medida",
      "Deploy, monitoramento e suporte",
    ],
    href: `${WHATSAPP_BASE}Ol%C3%A1!%20Tenho%20interesse%20no%20combo%20Produto%20Completo.`,
    featured: false,
  },
];

const contactHighlights = [
  {
    title: "Orçamentos",
    description: "Escopo, prazo e próximos passos definidos com clareza.",
  },
  {
    title: "Landing pages",
    description: "Páginas rápidas, responsivas e focadas em conversão.",
  },
  {
    title: "Dashboards e automações",
    description: "Dados organizados para operação, análise e decisão.",
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
  return (
    <div className="flex flex-col">
      <Hero />

      {/* PROJETOS */}
      <section id="projetos" className="scroll-mt-20">
        <ProjectsCategoryPage />
      </section>

      {/* STACK */}
      <StackShowcase />

      {/* COMBOS */}
      <section
        id="combos"
        className="scroll-mt-20 bg-muted py-16 sm:py-20 lg:py-28"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="2" label="Combos" />

          <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-foreground">
            Combos de serviços
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Pacotes pensados para diferentes momentos do seu negócio. Não achou
            o ideal? Monto um escopo sob medida.
          </p>

          <div className="mt-10 grid items-stretch gap-5 sm:mt-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {combos.map(combo => (
              <div
                key={combo.name}
                className={cn(
                  "group relative flex flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8",
                  combo.featured
                    ? "bg-[var(--brand-ink)] text-white hover:shadow-[0_24px_50px_rgba(2,6,19,0.35)]"
                    : "border border-border bg-card hover:shadow-[0_18px_40px_rgba(13,30,80,0.1)]"
                )}
              >
                {combo.featured && (
                  <span className="absolute right-6 top-7 rounded-full bg-[#0C2AFE] px-3 py-1 text-[11px] font-semibold text-white">
                    Mais escolhido
                  </span>
                )}

                <span
                  className={cn(
                    "mb-6 flex h-12 w-12 items-center justify-center rounded-xl",
                    combo.featured
                      ? "bg-white/10 text-[#7C8CFF]"
                      : "bg-[#0C2AFE]/10 text-[#0C2AFE] dark:text-[#7C8CFF]"
                  )}
                >
                  <combo.icon className="h-6 w-6" />
                </span>

                <h3
                  className={cn(
                    "text-[20px] font-semibold tracking-[-0.01em]",
                    combo.featured ? "text-white" : "text-foreground"
                  )}
                >
                  {combo.name}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-[13px] leading-relaxed sm:text-[14px]",
                    combo.featured ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {combo.tagline}
                </p>

                {combo.price && (
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "text-[12px] font-medium",
                        combo.featured
                          ? "text-white/60"
                          : "text-muted-foreground"
                      )}
                    >
                      a partir de
                    </span>
                    <span
                      className={cn(
                        "text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]",
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
                    combo.featured ? "bg-white/15" : "bg-border"
                  )}
                />

                <ul className="flex flex-1 flex-col gap-3">
                  {combo.features.map(feature => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-start gap-2.5 text-[13px] leading-snug sm:text-[14px]",
                        combo.featured ? "text-white/85" : "text-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          combo.featured ? "text-[#7C8CFF]" : "text-[#0C2AFE]"
                        )}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <RollButton
                  className="mt-8 w-full"
                  size="md"
                  variant={combo.featured ? "white" : "blue"}
                  label="Quero este combo"
                  href={combo.href}
                  external
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section
        id="blog"
        className="scroll-mt-20 bg-background py-16 sm:py-20 lg:py-28"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="3" label="Blog" />

          <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-foreground">
            Notas & ideias
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Notas sobre backend, dados e construção de produtos.
          </p>

          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-3 lg:gap-6">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(13,30,80,0.12)]"
              >
                <div
                  className={cn(
                    "relative flex h-40 items-end justify-between overflow-hidden p-5 sm:h-44",
                    post.cover
                  )}
                >
                  <StarburstIcon className="absolute -right-7 -top-7 h-32 w-32 rotate-12 fill-current text-white/10 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:rotate-45" />
                  <span className="relative text-[44px] font-medium leading-none tracking-[-0.02em] text-white/90">
                    0{index + 1}
                  </span>
                  <span className="relative rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {post.readTime}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Calendar size={13} /> {post.date}
                  </span>

                  <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors duration-300 group-hover:text-[#0C2AFE] sm:text-[19px]">
                    {post.title}
                  </h3>

                  <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-[#0C2AFE]">
                    Ler artigo
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="scroll-mt-20 bg-muted py-16 sm:py-20 lg:py-28"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="4" label="Contato" />

          <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-foreground">
            Vamos construir juntos.
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Tem um projeto em mente ou quer conversar? Estou aberto a novas
            oportunidades.
          </p>

          <div className="mt-10 grid items-start gap-6 sm:mt-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--brand-ink)] p-7 text-white sm:rounded-[2rem] sm:p-10 lg:p-12">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0C2AFE]/40 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#5B7CFF]/20 blur-3xl" />

              <div className="relative space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#7C8CFF]" />
                  Atendimento direto
                </span>

                <div className="space-y-4">
                  <h3 className="max-w-2xl text-[clamp(1.6rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                    Vamos conversar pelo{" "}
                    <span className="text-[#7C8CFF]">WhatsApp</span>.
                  </h3>
                  <p className="max-w-xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
                    Clique no botão abaixo para abrir uma conversa com a
                    mensagem de orçamento já preenchida.
                  </p>
                </div>

                <RollButton
                  variant="white"
                  size="md"
                  label="Enviar mensagem"
                  href={WHATSAPP_BUDGET_URL}
                  external
                />

                <div className="grid gap-4 pt-2 sm:grid-cols-3">
                  {contactHighlights.map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-5 transition-colors duration-300 hover:border-[#7C8CFF]/60 hover:bg-white/[0.07]"
                    >
                      <span className="text-[11px] font-semibold text-[#7C8CFF]">
                        0{index + 1}
                      </span>
                      <h4 className="mt-3 text-[15px] font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                <h3 className="text-[17px] font-semibold text-foreground">
                  Informações de contato
                </h3>
                <div className="mt-5 flex items-start gap-4">
                  <div className="rounded-full bg-[#0C2AFE]/10 p-3 text-[#0C2AFE] dark:text-[#7C8CFF]">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </p>
                    <a
                      href={WHATSAPP_BUDGET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[15px] font-semibold text-foreground transition-colors hover:text-[#0C2AFE]"
                    >
                      (85) 99637-0080
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0C2AFE] p-6 text-white sm:p-7">
                <h4 className="text-[17px] font-semibold">Baixar currículo</h4>
                <p className="mt-2 text-[13px] leading-relaxed text-white/75">
                  Um resumo da minha experiência, formação e habilidades
                  técnicas.
                </p>
                <RollButton
                  className="mt-5"
                  variant="white"
                  size="sm"
                  label="Baixar PDF"
                  href="/curriculo.pdf"
                  download="Curriculo-Matheus-Frota.pdf"
                />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
