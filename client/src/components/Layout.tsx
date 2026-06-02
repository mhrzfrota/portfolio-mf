import { useEffect, useState } from "react";
import {
  Github,
  Linkedin,
  MessageCircle,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-blue)]/15 selection:text-[var(--brand-blue)]">
      {/* Nike-style top navbar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur border-b border-border shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            : "bg-background border-b border-border/60"
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-10">
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex items-center transition-opacity hover:opacity-80"
            aria-label="MF Services — voltar ao início"
          >
            <img
              src="/logotopbar.png"
              alt="MF Services"
              className="h-7 w-auto md:h-8 dark:brightness-0 dark:invert"
            />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-bold uppercase tracking-tight transition-colors",
                    isActive
                      ? "text-[var(--brand-blue)]"
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 h-[2px] -translate-x-1/2 transition-all duration-300",
                      isActive
                        ? "w-6 bg-[var(--brand-green)]"
                        : "w-0 bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="ml-2 hidden items-center gap-2 border-l border-border pl-4 md:flex">
            <a
              href="https://github.com/mhrzfrota"
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:text-[var(--brand-blue)]"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/matheusfrt"
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:text-[var(--brand-blue)]"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:text-[var(--brand-green)]"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => toggleTheme?.()}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:text-[var(--brand-blue)]"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => toggleTheme?.()}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              className="rounded-full p-2 text-foreground transition-colors hover:bg-secondary"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="rounded-full p-2 text-foreground transition-colors hover:bg-secondary"
              aria-label="Abrir menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-left text-sm font-bold uppercase tracking-tight transition-all",
                      isActive
                        ? "border-l-2 border-[var(--brand-green)] bg-secondary text-[var(--brand-blue)]"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="mt-2 flex justify-center gap-4 border-t border-border pt-4">
                <a
                  href="https://github.com/mhrzfrota"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-[var(--brand-blue)]"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/matheusfrt"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-[var(--brand-blue)]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={WHATSAPP_BUDGET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary hover:text-[var(--brand-green)]"
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
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-secondary/40 mt-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MF Services"
              className="h-11 w-auto dark:brightness-0 dark:invert"
            />
            <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
              © {new Date().getFullYear()} MF Services — Matheus Frota
              <br className="hidden sm:block" />
              Desenvolvedor de Software
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/mhrzfrota"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-[var(--brand-blue)] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/matheusfrt"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-[var(--brand-blue)] transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={WHATSAPP_BUDGET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-[var(--brand-green)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
