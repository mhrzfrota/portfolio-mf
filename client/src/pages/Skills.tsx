import { Progress } from "@/components/ui/progress";

const skillCategories = [
  {
    title: "Backend",
    skills: [
      { name: "Node.js", level: 85 },
      { name: "Express", level: 80 },
      { name: "Java", level: 75 },
      { name: "APIs REST", level: 85 },
    ]
  },
  {
    title: "Frontend",
    skills: [
      { name: "React", level: 80 },
      { name: "Tailwind CSS", level: 80 },
      { name: "HTML / CSS", level: 85 },
      { name: "JavaScript", level: 80 },
    ]
  },
  {
    title: "Dados & Cloud",
    skills: [
      { name: "MySQL / PostgreSQL", level: 80 },
      { name: "Supabase", level: 80 },
      { name: "AWS", level: 65 },
      { name: "Docker", level: 70 },
    ]
  }
];

export default function Skills() {
  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-tight">
          <span className="text-primary">/</span>habilidades
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Visão geral das minhas habilidades técnicas com foco em backend e dados.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {skillCategories.map((category) => (
          <div key={category.title} className="space-y-6">
            <h2 className="text-xl font-mono font-bold border-b border-border pb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary inline-block"></span>
              {category.title}
            </h2>

            <div className="space-y-6">
              {category.skills.map((skill) => (
                <div key={skill.name} className="space-y-2 group">
                  <div className="flex justify-between text-sm font-mono">
                    <span className="group-hover:text-primary transition-colors">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
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

        {/* Soft Skills / Philosophy Section */}
        <div className="space-y-6 md:col-span-2 lg:col-span-1">
          <h2 className="text-xl font-mono font-bold border-b border-border pb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary inline-block"></span>
            Formação & Método
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Formação", desc: "ADS na UNIFOR (conclusão prevista: dez/2025)." },
              { title: "Metodologias Ágeis", desc: "Experiência com Scrum, Agile e DevOps em times colaborativos." },
              { title: "Integração de APIs", desc: "Integro serviços externos com foco em segurança e desempenho." },
              { title: "Dados & Automação", desc: "Tratamento de dados, dashboards e rotinas automatizadas." }
            ].map((item) => (
              <div key={item.title} className="p-4 border border-border bg-card/50 hover:border-primary/30 transition-colors">
                <h3 className="font-mono font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
