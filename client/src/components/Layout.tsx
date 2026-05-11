import { useEffect, useState } from "react";
import {
  Terminal,
  Code2,
  Cpu,
  BookOpen,
  Mail,
  Github,
  Linkedin,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_BUDGET_URL } from "@/const";

const navItems = [
  { icon: Terminal, label: "_início", id: "inicio" },
  { icon: Code2, label: "_projetos", id: "projetos" },
  { icon: Cpu, label: "_habilidades", id: "habilidades" },
  { icon: BookOpen, label: "_blog", id: "blog" },
  { icon: Mail, label: "_contato", id: "contato" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sections = navItems
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => handleNavClick("inicio")}
            className="font-mono text-lg md:text-xl font-bold tracking-tighter text-primary cursor-pointer"
          >
            <span className="text-foreground">matheus</span>.frota
            <span className="animate-pulse">_</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 font-mono text-sm cursor-pointer",
                  activeSection === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border ml-2">
            <a
              href="https://github.com/mhrzfrota"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/matheusfrt"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-foreground"
            aria-label="Abrir menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all font-mono text-sm text-left",
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="flex gap-6 justify-center pt-4 mt-2 border-t border-border">
                <a
                  href="https://github.com/mhrzfrota"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/matheusfrt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={WHATSAPP_BUDGET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-muted-foreground">
            © {new Date().getFullYear()} matheus.frota_ — Desenvolvedor de
            Software
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/mhrzfrota"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/matheusfrt"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
