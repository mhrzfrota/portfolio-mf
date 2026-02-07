import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Code } from "lucide-react";
import { useState } from "react";

const projects = [
  {
    id: 1,
    title: "Dashboard Meta Analytics",
    description: "Sistema de monitoramento de métricas do Facebook e Instagram, integrado à Meta Graph API e Supabase, com visualização de KPIs em tempo quase real.",
    tags: ["Python", "Flask", "React", "PostgreSQL", "Meta Graph API"],
    image: "/images/image1.png",
    liveUrl: "https://dashmsl-frontend.vercel.app",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web"
  },
  {
    id: 2,
    title: "Cícero Experience - Inteligência de Visitação do Horto",
    description: "Sistema para a gestão ambiental do Horto do Padre Cícero, com check-in via QR Code e dashboard integrado para contabilizar visitantes e apoiar melhorias na infraestrutura e no fluxo de entrada.",
    tags: ["Python", "Django", "Django REST Framework", "PostgreSQL", "Dashboard", "QR Code"],
    image: "/images/imager5.png",
    liveUrl: "https://ciceroexperience.vercel.app",
    repoUrl: "https://github.com/helionlf/ciceroExperience_api",
    category: "Web"
  },
  {
    id: 3,
    title: "Landing Page E-book Virtual",
    description: "Landing page em HTML, CSS e JavaScript para o livro \"A criança e as novas tecnologias\", com foco em conversão e visual limpo.",
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/image6.png",
    liveUrl: "https://albertocid.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page"
  },
  {
    id: 4,
    title: "Clipradio",
    description: "Plataforma para gestão de rádios com agendamentos e gravações automatizadas, usando React/Vite no frontend e Flask no backend, com streaming HLS e transcrição de áudio por IA.",
    tags: ["React", "Vite", "Flask", "PostgreSQL", "Supabase", "Socket.IO", "HLS.js", "Docker"],
    image: "/images/image2.png",
    liveUrl: "#",
    repoUrl: "https://github.com/Ambiente-MSL/clipradio",
    category: "Web"
  },
  {
    id: 5,
    title: "Mar&Mov - Moda Praia",
    description: "E-commerce front-end para loja de roupas com vitrine de produtos, destaques de coleções e navegação SPA, desenvolvido com React e TypeScript.",
    tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Router DOM"],
    image: "/images/image3.png",
    liveUrl: "https://maremovsuamoda.vercel.app",
    repoUrl: "https://github.com/mhrzfrota/site-dropshipping",
    category: "Web"
  },
  {
    id: 6,
    title: "MG Aldeota - Landing Page",
    description: "Landing page institucional para comunicação e captação de clientes, com seção de serviços, apresentação da marca e CTA para contato.",
    tags: ["HTML", "CSS", "Landing Page", "UI Responsiva"],
    image: "/images/image4.png",
    liveUrl: "https://mgaldeota.vercel.app",
    repoUrl: "https://github.com/mhrzfrota/mgaldeota",
    category: "Landing Page"
  }
];

const categories = ["Todos", "Web", "Mobile", "Landing Page"];

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filteredProjects = activeCategory === "Todos"
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-tight">
          <span className="text-primary">/</span>projetos
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Uma seleção de projetos recentes em backend, dados e web.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {categories.map((cat) => (
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

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {filteredProjects.map((project) => (
          <div key={project.id} className="group border border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
            <div className="relative aspect-video overflow-hidden border-b border-border">
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none mix-blend-overlay"></div>
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
              />
            </div>

            <div className="p-6 flex flex-col flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold font-mono group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <div className="flex gap-2">
                  <a href={project.repoUrl} className="text-muted-foreground hover:text-primary transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={project.liveUrl} className="text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <p className="text-muted-foreground text-sm flex-1">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono px-2 py-1 bg-secondary text-secondary-foreground rounded border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
