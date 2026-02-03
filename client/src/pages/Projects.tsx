import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Code } from "lucide-react";
import { useState } from "react";

const projects = [
  {
    id: 1,
    title: "Dashboard Meta Analytics",
    description: "Sistema de monitoramento de métricas do Facebook e Instagram, integrado à Meta Graph API e Supabase, com visualização de KPIs em tempo quase real.",
    tags: ["Python", "Flask", "React", "Supabase", "Meta Graph API"],
    image: "/images/project-analytics.jpg",
    liveUrl: "https://dashmsl-frontend.vercel.app",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Web"
  },
  {
    id: 2,
    title: "App Bancário Mobile",
    description: "Aplicação mobile para banco digital com Flutter e Flet, incluindo saque complementar, autenticação JWT e integração com APIs bancárias.",
    tags: ["Flutter", "Flet", "JWT", "APIs Bancárias", "Supabase"],
    image: "/images/project-mobile.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Mobile"
  },
  {
    id: 3,
    title: "Landing Page E-book Virtual",
    description: "Landing page em HTML, CSS e JavaScript para o livro “A criança e as novas tecnologias”, com foco em conversão e visual limpo.",
    tags: ["HTML", "CSS", "JavaScript"],
    image: "/images/project-code.jpg",
    liveUrl: "https://albertocid.com.br",
    repoUrl: "https://github.com/mhrzfrota",
    category: "Landing Page"
  },
  {
    id: 4,
    title: "Site Dropshipping",
    description: "Projeto publicado no GitHub: site-dropshipping.",
    tags: ["GitHub", "Web"],
    image: "/images/project-code.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/mhrzfrota/site-dropshipping",
    category: "Web"
  },
  {
    id: 5,
    title: "MG Aldeota",
    description: "Projeto publicado no GitHub: mgaldeota.",
    tags: ["GitHub", "Web"],
    image: "/images/project-code.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/mhrzfrota/mgaldeota",
    category: "Web"
  },
  {
    id: 6,
    title: "BuscaApp",
    description: "Projeto publicado no GitHub: BuscaApp.",
    tags: ["GitHub", "App"],
    image: "/images/project-mobile.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/mhrzfrota/BuscaApp",
    category: "Mobile"
  },
  {
    id: 7,
    title: "ClipRadio",
    description: "Projeto publicado no GitHub: clipradio.",
    tags: ["GitHub", "Web"],
    image: "/images/project-analytics.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/Ambiente-MSL/clipradio",
    category: "Web"
  },
  {
    id: 8,
    title: "Monitor",
    description: "Projeto publicado no GitHub: monitor.",
    tags: ["GitHub", "Web"],
    image: "/images/project-analytics.jpg",
    liveUrl: "#",
    repoUrl: "https://github.com/Ambiente-MSL/monitor",
    category: "Web"
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
