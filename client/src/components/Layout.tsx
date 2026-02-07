import { Link, useLocation } from "wouter";
import { Terminal, Code2, Cpu, BookOpen, Mail, Github, Linkedin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Terminal, label: "_início", path: "/" },
    { icon: Code2, label: "_projetos", path: "/projects" },
    { icon: Cpu, label: "_habilidades", path: "/skills" },
    { icon: BookOpen, label: "_blog", path: "/blog" },
    { icon: Mail, label: "_contato", path: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar/50 backdrop-blur-sm fixed h-full z-50">
        <div className="p-6 border-b border-border">
          <h1 className="font-mono text-xl font-bold tracking-tighter text-primary">
            <span className="text-foreground">matheus</span>.frota<span className="animate-pulse">_</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Desenvolvedor Backend</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 font-mono text-sm cursor-pointer group",
                  location === item.path
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-border">
          <div className="flex gap-4 justify-center">
            <a href="https://github.com/mhrzfrota" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/matheusfrt" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://wa.me/5585996370080" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <h1 className="font-mono text-lg font-bold text-primary">matheus.frota_</h1>
        {/* Simple mobile menu trigger could go here, for now we rely on bottom nav or simple links */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen relative overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 p-6 md:p-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50 flex justify-around p-3">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer",
              location === item.path ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-mono">{item.label.replace('_', '')}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
