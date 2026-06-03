import { Button } from "@/components/ui/button";
import { Calendar, Download, MessageCircle } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import ProjectsCategoryPage from "@/components/ProjectsCategoryPage";
import { cn } from "@/lib/utils";

const heroMarquee = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "PostgreSQL",
  "Tailwind CSS",
  "Supabase",
  "Docker",
  "AWS",
  "Java",
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

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section
        id="inicio"
        className="flex min-h-[68vh] items-center justify-center py-24 text-center md:min-h-[74vh] md:py-32"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="hero-headline break-words text-[2.15rem] sm:text-5xl lg:text-[4.6rem]">
            <span className="block">Software simples.</span>
            <span className="block">Rápido.</span>
            <span className="block text-[var(--brand-blue)]">
              Resultado.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl break-words text-base leading-relaxed text-muted-foreground md:text-lg">
            Backend, dados e web.
          </p>
        </div>
      </section>

      {/* Marquee de tecnologias (estilo faixa de logos) */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 border-y border-border bg-secondary/30 py-5">
        <div className="hero-marquee-mask overflow-hidden">
          <div className="hero-marquee-track">
            {[...heroMarquee, ...heroMarquee].map((tech, index) => (
              <span
                key={`${tech}-${index}`}
                className="flex items-center whitespace-nowrap px-8 font-display text-2xl uppercase tracking-tight text-muted-foreground/70 md:text-3xl"
              >
                {tech}
                <span className="ml-8 h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)]/40" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PROJETOS — modern showcase cards */}
      <section id="projetos" className="scroll-mt-20">
        <ProjectsCategoryPage />
      </section>

      {/* HABILIDADES */}
      <section
        id="habilidades"
        className="space-y-10 py-20 md:py-28 scroll-mt-20"
      >
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-blue)]" />
            02 · Habilidades
          </span>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight">
            Stack & ferramentas
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Visão geral das minhas habilidades técnicas com foco em backend e
            dados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, idx) => (
            <div
              key={category.title}
              className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(13,30,80,0.06)]"
            >
              <h3 className="flex items-center gap-2 border-b border-border pb-3 font-display text-2xl tracking-tight">
                <span
                  className={cn(
                    "h-3 w-3 inline-block",
                    idx % 2 === 0
                      ? "bg-[var(--brand-blue)]"
                      : "bg-[var(--brand-green)]"
                  )}
                />
                {category.title}
              </h3>

              <div className="flex flex-wrap gap-2">
                {category.skills.map(skill => (
                  <span
                    key={skill.name}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-secondary/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-all hover:border-[var(--brand-blue)] hover:bg-card hover:text-[var(--brand-blue)]"
                  >
                    {skill.name}
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {skill.level}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 pt-8">
          <h3 className="flex items-center gap-2 border-b border-border pb-3 font-display text-2xl tracking-tight">
            <span className="h-3 w-3 inline-block bg-[var(--brand-green)]" />
            Formação & Método
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {methodItems.map((item, idx) => (
              <div
                key={item.title}
                className={cn(
                  "rounded-2xl border border-border p-5 transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(13,30,80,0.08)]",
                  idx % 2 === 0
                    ? "bg-card"
                    : "bg-[var(--brand-ink)] text-white"
                )}
              >
                <h4
                  className={cn(
                    "mb-2 font-display text-xl tracking-tight",
                    idx % 2 === 0
                      ? "text-[var(--brand-blue)]"
                      : "text-[var(--brand-green)]"
                  )}
                >
                  {item.title}
                </h4>
                <p
                  className={cn(
                    "text-sm",
                    idx % 2 === 0
                      ? "text-muted-foreground"
                      : "text-white/75"
                  )}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="space-y-10 py-20 md:py-28 scroll-mt-20">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-blue)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-green)]" />
            03 · Blog
          </span>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight">
            Notas & ideias
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Notas sobre backend, dados e construção de produtos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map(post => (
            <article
              key={post.id}
              className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-blue)]/60 hover:shadow-[0_18px_40px_rgba(13,30,80,0.1)]"
            >
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {post.date}
                </span>
              </div>

              <h3 className="font-display text-2xl tracking-tight leading-tight transition-colors group-hover:text-[var(--brand-blue)]">
                {post.title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                      idx % 2 === 0
                        ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                        : "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-ink)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Em breve
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 md:py-28 scroll-mt-20">
        <div className="space-y-4 mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-blue)]" />
            04 · Contato
          </span>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight">
            Vamos construir juntos.
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Tem um projeto em mente ou quer conversar? Estou aberto a novas
            oportunidades.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--brand-ink)] p-8 md:p-12 text-white">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--brand-blue)]/40 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[var(--brand-green)]/30 blur-3xl" />

            <div className="relative space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--brand-green)]">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-green)]" />
                atendimento direto
              </div>

              <div className="space-y-4">
                <h3 className="max-w-2xl font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
                  Vamos conversar pelo{" "}
                  <span className="text-[var(--brand-green)]">WhatsApp</span>.
                </h3>
                <p className="max-w-xl leading-relaxed text-white/70">
                  Clique no botão abaixo para abrir uma conversa com a mensagem
                  de orçamento já preenchida.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="nike-pill h-12 w-full bg-[var(--brand-green)] px-7 text-sm font-bold uppercase tracking-wide text-[var(--brand-ink)] hover:bg-white sm:w-auto"
              >
                <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                  Enviar mensagem <MessageCircle className="w-4 h-4" />
                </a>
              </Button>

              <div className="grid gap-4 pt-2 sm:grid-cols-3">
                {contactHighlights.map((item, index) => (
                  <div
                    key={item.title}
                    className="group relative min-h-36 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-5 transition-colors hover:border-[var(--brand-green)]/70 hover:bg-white/[0.07]"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--brand-blue)]">
                      0{index + 1}
                    </span>
                    <h4 className="mt-3 font-display text-xl tracking-tight text-white transition-colors group-hover:text-[var(--brand-green)]">
                      {item.title}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:pl-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(13,30,80,0.06)]">
              <h3 className="font-display text-2xl tracking-tight">
                Informações de contato
              </h3>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[var(--brand-green)]/15 p-3 text-[var(--brand-green-dark)]">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </p>
                    <a
                      href={WHATSAPP_BUDGET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-foreground transition-colors hover:text-[var(--brand-blue)]"
                    >
                      (85) 99637-0080
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[var(--brand-blue)] bg-[var(--brand-blue)] p-6 text-white">
              <h4 className="font-display text-2xl tracking-tight">
                Baixar currículo
              </h4>
              <p className="mt-2 text-sm text-white/80">
                Um resumo da minha experiência, formação e habilidades técnicas.
              </p>
              <Button
                asChild
                variant="outline"
                className="nike-pill mt-5 h-11 w-full border-2 border-white bg-transparent px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-white hover:text-[var(--brand-blue)]"
              >
                <a href="/curriculo.pdf" download="Curriculo-Matheus-Frota.pdf">
                  Baixar PDF <Download className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
