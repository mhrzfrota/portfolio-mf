import { Calendar, MessageCircle } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import ProjectsCategoryPage from "@/components/ProjectsCategoryPage";
import HeroShader from "@/components/HeroShader";
import RollButton from "@/components/RollButton";
import SectionBadge from "@/components/SectionBadge";
import { cn } from "@/lib/utils";

const heroMarquee = [
  { name: "React", logo: "/logos/stack/react.svg" },
  { name: "Node.js", logo: "/logos/stack/nodejs.svg" },
  { name: "TypeScript", logo: "/logos/stack/typescript.svg" },
  { name: "Python", logo: "/logos/stack/python.svg" },
  { name: "PostgreSQL", logo: "/logos/stack/postgresql.svg" },
  { name: "Tailwind CSS", logo: "/logos/stack/tailwindcss.svg" },
  { name: "Supabase", logo: "/logos/stack/supabase.svg" },
  { name: "Docker", logo: "/logos/stack/docker.svg" },
  { name: "AWS", logo: "/logos/stack/aws.svg" },
  { name: "Java", logo: "/logos/stack/java.svg" },
];

const skillCategories = [
  {
    title: "Backend",
    skills: [
      { name: "Node.js", level: 85 },
      { name: "Express", level: 80 },
      { name: "Java", level: 75 },
      { name: "APIs REST", level: 85 },
    ],
  },
  {
    title: "Frontend",
    skills: [
      { name: "React", level: 80 },
      { name: "Tailwind CSS", level: 80 },
      { name: "HTML / CSS", level: 85 },
      { name: "JavaScript", level: 80 },
    ],
  },
  {
    title: "Dados & Cloud",
    skills: [
      { name: "MySQL / PostgreSQL", level: 80 },
      { name: "Supabase", level: 80 },
      { name: "AWS", level: 65 },
      { name: "Docker", level: 70 },
    ],
  },
];

const methodItems = [
  {
    title: "Formação",
    desc: "ADS na UNIFOR (conclusão prevista: dez/2025).",
  },
  {
    title: "Metodologias Ágeis",
    desc: "Experiência com Scrum, Agile e DevOps em times colaborativos.",
  },
  {
    title: "Integração de APIs",
    desc: "Integro serviços externos com foco em segurança e desempenho.",
  },
  {
    title: "Dados & Automação",
    desc: "Tratamento de dados, dashboards e rotinas automatizadas.",
  },
];

const posts = [
  {
    id: 1,
    title:
      "Deploy moderno de aplicações Fullstack: do desenvolvimento à produção",
    excerpt:
      "Uma visão prática sobre hospedagem, CI/CD, banco de dados, ambientes e monitoramento para aplicações modernas.",
    date: "2026-05-07",
    tags: ["Deploy", "Fullstack", "CI/CD"],
  },
  {
    id: 2,
    title: "Como a IA está mudando a forma de criar softwares",
    excerpt:
      "Entenda como a inteligência artificial está ajudando desenvolvedores a criar sistemas mais rápido, automatizar tarefas e melhorar aplicações do dia a dia.",
    date: "2026-05-07",
    tags: ["IA", "Produtividade", "Software"],
  },
  {
    id: 3,
    title: "Dashboards com Meta Graph API: do dado ao KPI",
    excerpt:
      "Como estruturar coleta e tratamento de métricas do Facebook e Instagram para visualização em tempo quase real.",
    date: "2025-10-12",
    tags: ["Dados", "APIs", "Dashboard"],
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section
        id="inicio"
        className="relative flex min-h-svh flex-col overflow-hidden bg-[#EFEFEF] dark:bg-[#05080F]"
      >
        <HeroShader isDark={isDark} />

        <div className="flex-1" />

        <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
          <p className="mb-5 text-[13px] tracking-wide text-foreground sm:mb-8 sm:text-[14px]">
            MF Services — Matheus Frota
          </p>

          <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[clamp(2.5rem,5vw,4.2rem)]">
            Soluções digitais que vendem,
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            organizam e economizam tempo.
          </h1>

          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Backend, dados, interfaces e automações para transformar ideias em
            produtos digitais claros, rápidos e fáceis de usar.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:mt-12 sm:flex-row sm:items-center sm:gap-5">
            <RollButton
              variant="blue"
              size="md"
              label="Solicitar orçamento"
              href={WHATSAPP_BUDGET_URL}
              external
            />
            <RollButton
              variant="white"
              size="md"
              label="Ver projetos"
              href="#projetos"
            />
            <div className="inline-flex w-fit items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              <StarburstIcon className="h-5 w-5 fill-current text-[#0C2AFE] sm:h-6 sm:w-6" />
              <span className="text-[13px] font-medium text-gray-900 sm:text-[14px]">
                Matheus Frota
              </span>
              <span className="rounded bg-[var(--brand-ink)] px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">
                Fullstack
              </span>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
              Stack usada nos principais projetos do portfólio
            </p>
            <div className="hero-marquee-mask max-w-4xl overflow-hidden">
              <div className="hero-marquee-track">
                {[...heroMarquee, ...heroMarquee].map((tech, index) => (
                  <div
                    key={`${tech.name}-${index}`}
                    className="flex min-w-32 items-center justify-center px-6 md:min-w-40"
                    aria-label={tech.name}
                  >
                    <img
                      src={tech.logo}
                      alt={tech.name}
                      className="h-7 w-20 object-contain opacity-80 transition-opacity hover:opacity-100 md:h-8 md:w-24"
                      draggable={false}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJETOS */}
      <section id="projetos" className="scroll-mt-20">
        <ProjectsCategoryPage />
      </section>

      {/* HABILIDADES */}
      <section
        id="habilidades"
        className="scroll-mt-20 bg-background pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pb-24 lg:pt-32"
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <SectionBadge number="2" label="Habilidades" />

          <h2 className="text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-foreground">
            Stack & ferramentas
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Visão geral das minhas habilidades técnicas com foco em backend e
            dados.
          </p>

          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {skillCategories.map((category, idx) => (
              <div
                key={category.title}
                className="rounded-2xl border border-border bg-card p-6 sm:p-7"
              >
                <h3 className="mb-5 flex items-center gap-2.5 text-[15px] font-semibold text-foreground">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      idx % 2 === 0 ? "bg-[#0C2AFE]" : "bg-[#7C8CFF]"
                    )}
                  />
                  {category.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map(skill => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-[12px] font-medium text-foreground transition-colors duration-300 hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
                    >
                      {skill.name}
                      <span className="text-[10px] text-muted-foreground">
                        {skill.level}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-16">
            <h3 className="mb-6 text-[clamp(1.25rem,2.5vw,1.9rem)] font-medium tracking-[-0.02em] text-foreground">
              Formação & Método
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {methodItems.map((item, idx) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6",
                    idx % 2 === 0
                      ? "border border-border bg-card"
                      : "bg-[var(--brand-ink)] text-white"
                  )}
                >
                  <h4
                    className={cn(
                      "mb-2 text-[15px] font-semibold",
                      idx % 2 === 0 ? "text-foreground" : "text-white"
                    )}
                  >
                    {item.title}
                  </h4>
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed",
                      idx % 2 === 0 ? "text-muted-foreground" : "text-white/70"
                    )}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section
        id="blog"
        className="scroll-mt-20 bg-muted py-16 sm:py-20 lg:py-28"
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
            {posts.map(post => (
              <article
                key={post.id}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(13,30,80,0.1)] sm:p-7"
              >
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

                <span className="w-fit rounded-full bg-[var(--brand-ink)] px-3 py-1 text-[11px] font-medium text-white dark:bg-white dark:text-[var(--brand-ink)]">
                  Em breve
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section
        id="contato"
        className="scroll-mt-20 bg-background py-16 sm:py-20 lg:py-28"
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
