import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Download,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import ProjectCarousel from "@/components/ProjectCarousel";
import {
  categories,
  featuredProject,
  projects,
  projectStats,
} from "@/data/projects";
import { Link } from "wouter";

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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const filteredProjects =
    activeCategory === "Todos"
      ? projects
      : projects.filter(p => p.category === activeCategory);
  const featuredCase = featuredProject?.caseStudy;

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section
        id="inicio"
        className="flex flex-col-reverse lg:flex-row items-center gap-12 py-16 md:py-24 min-h-[calc(100vh-4rem)]"
      >
        <div className="flex-1 space-y-6">
          <h1 className="text-[1.6875rem] md:text-[2.8125rem] lg:text-[3.375rem] font-bold tracking-tight leading-tight">
            Criando soluções <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
              digitais e dados
            </span>
            <br /> que fazem diferença.
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Sou Matheus Frota, desenvolvedor de software focado em backend,
            dados e web.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => scrollToId("projetos")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono rounded-none border border-transparent"
            >
              Ver projetos <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-mono rounded-none border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                Envie uma mensagem
              </a>
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md lg:max-w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative aspect-square md:aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
            <img
              src="/images/hero-bg.webp"
              alt="Arte digital abstrata"
              className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

            <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur border border-white/10 rounded font-mono text-xs text-green-400 overflow-hidden">
              <div className="flex gap-2 mb-2 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p>
                <span className="text-purple-400">const</span>{" "}
                <span className="text-blue-400">desenvolvedor</span> ={" "}
                <span className="text-yellow-300">{"{"}</span>
              </p>
              <p className="pl-4">
                nome: <span className="text-orange-300">"Matheus Frota"</span>,
              </p>
              <p className="pl-4">
                cargo: <span className="text-orange-300">"Dev Full Stack"</span>
                ,
              </p>
              <p className="pl-4">
                status: <span className="text-orange-300">"Disponível"</span>
              </p>
              <p>
                <span className="text-yellow-300">{"}"}</span>;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJETOS */}
      <section id="projetos" className="space-y-8 py-16 md:py-24 scroll-mt-20">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            <span className="text-primary">01.</span> Projetos
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Uma seleção de projetos recentes em backend, dados e web.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projectStats.map(stat => (
            <div
              key={stat.label}
              className="border border-border bg-card/50 p-4 transition-colors hover:border-primary/40"
            >
              <span className="font-mono text-3xl font-bold text-primary">
                {stat.value}
              </span>
              <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-normal">
                {stat.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>

        {featuredProject && featuredCase && (
          <div className="grid gap-6 border border-primary/20 bg-primary/5 p-4 md:grid-cols-[0.9fr_1.1fr] md:p-6">
            <div className="relative min-h-64 overflow-hidden border border-border bg-card">
              <img
                src={featuredProject.image}
                alt={featuredProject.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
                <span className="font-mono text-xs text-primary">
                  exemplo de case completo
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <span className="border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-normal text-primary">
                  {featuredProject.category}
                </span>
                <h3 className="text-2xl font-bold leading-tight md:text-3xl">
                  {featuredProject.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {featuredProject.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-normal text-primary">
                    problema
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {featuredCase.clientProblem}
                  </p>
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-normal text-primary">
                    solução
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {featuredCase.solution}
                  </p>
                </div>
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-normal text-primary">
                    benefício
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {featuredCase.benefit}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {featuredProject.tags.map(tag => (
                  <span
                    key={tag}
                    className="border border-border bg-secondary px-2 py-1 font-mono text-[0.68rem] text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="rounded-none bg-primary font-mono text-primary-foreground hover:bg-primary/90"
                >
                  <Link href={`/projetos/${featuredProject.slug}`}>
                    Ver página do projeto <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-primary/30 font-mono hover:text-primary"
                >
                  <a
                    href={featuredProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir link <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-primary/30 font-mono hover:text-primary"
                >
                  <a
                    href={WHATSAPP_BUDGET_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {featuredCase.ctaLabel}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-sm font-mono transition-all ${
                activeCategory === cat
                  ? "text-primary border-b-2 border-primary -mb-[17px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <ProjectCarousel
          activeCategory={activeCategory}
          projects={filteredProjects}
        />
      </section>

      {/* HABILIDADES */}
      <section
        id="habilidades"
        className="space-y-8 py-16 md:py-24 scroll-mt-20"
      >
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            <span className="text-primary">02.</span> Habilidades
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Visão geral das minhas habilidades técnicas com foco em backend e
            dados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {skillCategories.map(category => (
            <div key={category.title} className="space-y-6">
              <h3 className="text-xl font-mono font-bold border-b border-border pb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary inline-block"></span>
                {category.title}
              </h3>

              <div className="space-y-6">
                {category.skills.map(skill => (
                  <div key={skill.name} className="space-y-2 group">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="group-hover:text-primary transition-colors">
                        {skill.name}
                      </span>
                      <span className="text-muted-foreground">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary overflow-hidden rounded-none">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-out group-hover:bg-primary/80"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 pt-8">
          <h3 className="text-xl font-mono font-bold border-b border-border pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary inline-block"></span>
            Formação & Método
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {methodItems.map(item => (
              <div
                key={item.title}
                className="p-4 border border-border bg-card/50 hover:border-primary/30 transition-colors"
              >
                <h4 className="font-mono font-bold text-primary mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="space-y-8 py-16 md:py-24 scroll-mt-20">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            <span className="text-primary">03.</span> Blog
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Notas sobre backend, dados e construção de produtos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map(post => (
            <article
              key={post.id}
              className="group border border-border bg-card hover:border-primary/50 transition-all duration-300 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {post.date}
                </span>
              </div>

              <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h3>

              <p className="text-muted-foreground text-sm flex-1 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-mono px-2 py-1 bg-secondary text-secondary-foreground rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <span className="text-xs font-mono text-muted-foreground pt-2 border-t border-border">
                Em breve
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-16 md:py-24 scroll-mt-20">
        <div className="space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
            <span className="text-primary">04.</span> Contato
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Tem um projeto em mente ou quer conversar? Estou aberto a novas
            oportunidades.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="relative overflow-hidden py-2 md:py-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary via-primary/40 to-transparent" />

            <div className="relative space-y-8 pt-8">
              <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                <span className="h-2 w-2 bg-primary" />
                atendimento direto
              </div>

              <div className="space-y-4">
                <h3 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
                  Vamos conversar pelo WhatsApp.
                </h3>
                <p className="max-w-xl text-muted-foreground leading-relaxed">
                  Clique no botão abaixo para abrir uma conversa com a mensagem
                  de orçamento já preenchida.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono rounded-none sm:w-auto"
              >
                <a href={WHATSAPP_BUDGET_URL} target="_blank" rel="noreferrer">
                  Enviar mensagem <MessageCircle className="w-4 h-4" />
                </a>
              </Button>

              <div className="grid gap-4 pt-2 sm:grid-cols-3">
                {contactHighlights.map((item, index) => (
                  <div
                    key={item.title}
                    className="group relative min-h-36 border border-border px-4 py-5 transition-colors hover:border-primary/70"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-primary/0 transition-colors group-hover:bg-primary/80" />
                    <span className="font-mono text-xs text-primary/70">
                      0{index + 1}
                    </span>
                    <h4 className="mt-3 font-mono text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-8 lg:pl-12 lg:border-l border-border/50">
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-mono">
                Informações de contato
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-muted-foreground">
                      WhatsApp
                    </p>
                    <a
                      href={WHATSAPP_BUDGET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      (85) 99637-0080
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border border-primary/20 bg-primary/5 rounded-none">
              <h4 className="font-mono font-bold text-primary mb-2">
                Baixar currículo
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Um resumo da minha experiência, formação e habilidades técnicas.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground font-mono rounded-none"
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
