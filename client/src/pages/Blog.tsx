import { Calendar, Clock, ArrowRight } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "Dashboards com Meta Graph API: do dado ao KPI",
    excerpt: "Como estruturar coleta e tratamento de métricas do Facebook e Instagram para visualização em tempo quase real.",
    date: "2025-10-12",
    readTime: "7 min de leitura",
    tags: ["Dados", "APIs", "Dashboard"],
    slug: "dashboards-meta-graph-api"
  },
  {
    id: 2,
    title: "Boas práticas de APIs REST com Node.js e Express",
    excerpt: "Padrões simples para segurança, versionamento e performance em projetos backend.",
    date: "2025-08-03",
    readTime: "6 min de leitura",
    tags: ["Node.js", "Backend", "REST"],
    slug: "boas-praticas-apis-rest"
  },
  {
    id: 3,
    title: "Supabase na prática: auth, dados e deploy",
    excerpt: "Uma visão direta sobre como usar Supabase para autenticação, banco e automações.",
    date: "2025-06-18",
    readTime: "5 min de leitura",
    tags: ["Supabase", "Banco de Dados"],
    slug: "supabase-na-pratica"
  }
];

export default function Blog() {
  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-tight">
          <span className="text-primary">/</span>blog
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Notas sobre backend, dados e construção de produtos.
        </p>
      </div>

      <div className="grid gap-8 max-w-3xl">
        {posts.map((post) => (
          <article key={post.id} className="group border-b border-border pb-8 last:border-0">
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readTime}
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer">
              {post.title}
            </h2>

            <p className="text-muted-foreground mb-4 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono px-2 py-1 bg-secondary text-secondary-foreground rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              <span className="text-sm font-mono text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 cursor-pointer">
                Ler artigo <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
