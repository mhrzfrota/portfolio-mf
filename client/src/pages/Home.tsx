import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

const featuredProjects = [
  {
    title: "Dashboard Meta Analytics",
    description:
      "Sistema de monitoramento de métricas do Facebook e Instagram, integrado à Meta Graph API e PostgreSQL, com interface em Flask/React para KPIs em tempo quase real.",
    tags: ["Python", "Flask", "PostgreSQL", "React"],
    image: "/images/image1.png",
    href: "/projects",
    actionLabel: "Ver detalhes",
    external: false,
  },
  {
    title: "MG Aldeota - Landing Page",
    description:
      "Landing page institucional para comunicação e captação de clientes, com seção de serviços, apresentação da marca e CTA para contato.",
    tags: ["HTML", "CSS", "Landing Page", "UI Responsiva"],
    image: "/images/image4.png",
    href: "https://mgaldeota.vercel.app/",
    actionLabel: "Visitar site",
    external: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 py-8 md:py-12">
      {/* Hero Section */}
      <section className="flex flex-col-reverse lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-[1.6875rem] md:text-[2.8125rem] lg:text-[3.375rem] font-bold tracking-tight leading-tight">
            Criando soluções <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">digitais e dados</span>
            <br /> que fazem diferença.
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Sou Matheus Frota, desenvolvedor de software. 
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/projects">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono rounded-none border border-transparent">
                Ver projetos <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="font-mono rounded-none border-primary/30 hover:bg-primary/10 hover:text-primary">
                Envie uma mensagem
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md lg:max-w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative aspect-square md:aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
            <img
              src="/images/hero-bg.jpg"
              alt="Arte digital abstrata"
              className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

            {/* Code Overlay Effect */}
            <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur border border-white/10 rounded font-mono text-xs text-green-400 overflow-hidden">
              <div className="flex gap-2 mb-2 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p><span className="text-purple-400">const</span> <span className="text-blue-400">desenvolvedor</span> = <span className="text-yellow-300">{"{"}</span></p>
              <p className="pl-4">nome: <span className="text-orange-300">"Matheus Frota"</span>,</p>
              <p className="pl-4">cargo: <span className="text-orange-300">"Dev Full Stack"</span>,</p>
              <p className="pl-4">status: <span className="text-orange-300">"Disponível"</span></p>
              <p><span className="text-yellow-300">{"}"}</span>;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Tecnologias que uso</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: "Node.js", icon: "/images/tech/nodejs.svg" },
            { name: "Express", icon: "/images/tech/express.svg" },
            { name: "Java", icon: "/images/tech/java.svg" },
            { name: "PostgreSQL", icon: "/images/tech/postgresql.svg" },
            { name: "Supabase", icon: "/images/tech/supabase.svg" },
            { name: "Docker", icon: "/images/tech/docker.svg" },
          ].map((tech) => (
            <div key={tech.name} className="flex flex-col items-center justify-center gap-2 p-4 border border-border bg-card/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default group">
              <img src={tech.icon} alt={tech.name} className="w-9 h-9 object-contain" loading="lazy" />
              <span className="font-mono text-sm group-hover:text-primary">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Project Preview */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <h2 className="text-2xl md:text-3xl font-bold font-mono">
            <span className="text-primary">01.</span> Projetos em Destaque
          </h2>
          <Link href="/projects">
            <span className="text-sm font-mono text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {featuredProjects.map(project => (
            <article
              key={project.title}
              className="group border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col overflow-hidden"
            >
              <div className="relative aspect-video overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-primary/15 opacity-60 group-hover:opacity-80 transition-opacity z-10 pointer-events-none mix-blend-overlay"></div>
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6 flex flex-col flex-1 space-y-4">
                <h3 className="text-2xl font-bold">{project.title}</h3>
                <p className="text-muted-foreground flex-1">{project.description}</p>
                <ul className="flex flex-wrap gap-2 text-xs font-mono text-primary/80">
                  {project.tags.map(tag => (
                    <li key={tag} className="px-2 py-1 bg-primary/10 rounded">
                      {tag}
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  {project.external ? (
                    <Button asChild variant="outline" className="font-mono text-xs border-primary/30 hover:border-primary hover:text-primary">
                      <a href={project.href} target="_blank" rel="noreferrer">
                        {project.actionLabel}
                      </a>
                    </Button>
                  ) : (
                    <Link href={project.href}>
                      <Button variant="outline" className="font-mono text-xs border-primary/30 hover:border-primary hover:text-primary">
                        {project.actionLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
