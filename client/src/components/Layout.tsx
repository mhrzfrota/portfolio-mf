import { useEffect, useState } from "react";
import { Github, Linkedin, MessageCircle, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { WHATSAPP_BUDGET_URL } from "@/const";

const navItems = [
  { label: "início", id: "inicio" },
  { label: "projetos", id: "projetos" },
  { label: "habilidades", id: "habilidades" },
  { label: "blog", id: "blog" },
  { label: "contato", id: "contato" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();

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
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setLocation("/");
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Floating Topbar */}
      <header
        className={cn(
          "fixed left-1/2 z-50 w-[95%] -translate-x-1/2 transition-all duration-300",
          scrolled ? "top-0 w-full max-w-none" : "top-5 max-w-[1200px]"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border border-white/[0.03] bg-zinc-900/60 px-5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl transition-all duration-300 md:px-6",
            scrolled ? "rounded-none border-x-0 border-t-0" : "rounded-full"
          )}
        >
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex items-center font-mono text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary md:text-xl"
          >
            matheus<span className="text-primary">.frota_</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-white/[0.08] hover:text-foreground"
                )}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-2 hidden items-center gap-3 border-l border-white/10 pl-4 md:flex">
            <a
              href="https://github.com/mhrzfrota"
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/matheusfrt"
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-foreground"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="rounded-full p-2 text-foreground transition-colors hover:bg-white/[0.08] md:hidden"
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
          <div
            className={cn(
              "mt-2 overflow-hidden border border-white/[0.05] bg-zinc-900/90 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden",
              scrolled ? "rounded-b-3xl border-t-0" : "rounded-3xl"
            )}
          >
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-3 text-left text-sm font-medium transition-all",
                    activeSection === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="mt-2 flex justify-center gap-4 border-t border-white/10 pt-4">
                <a
                  href="https://github.com/mhrzfrota"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/matheusfrt"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={WHATSAPP_BUDGET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative pt-24 md:pt-28">
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
