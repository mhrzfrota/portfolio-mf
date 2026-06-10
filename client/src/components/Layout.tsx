import { useEffect, useState } from "react";
import {
  ArrowRight,
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
  { label: "Início", id: "inicio" },
  { label: "Projetos", id: "projetos" },
  { label: "Habilidades", id: "habilidades" },
  { label: "Blog", id: "blog" },
  { label: "Contato", id: "contato" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const topbarIsLight = isDark;

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
      {/* Reference-style top navbar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          topbarIsLight
            ? "border-slate-200 bg-white text-slate-950 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            : "border-white/10 bg-[#020613] text-white shadow-[0_1px_0_rgba(255,255,255,0.04)]",
          scrolled && "backdrop-blur"
        )}
      >
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 md:px-10">
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex items-center transition-opacity hover:opacity-80"
            aria-label="MF Services — voltar ao início"
          >
            <img
              src="/logotopbar2-removebg-preview.png"
              alt="MF Services"
              className={cn(
                "h-auto w-64 transition-all sm:w-72 md:w-80 lg:w-96 xl:h-20 xl:w-auto",
                topbarIsLight ? "" : "brightness-0 invert"
              )}
            />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "relative py-2 text-[0.98rem] font-semibold tracking-normal transition-colors",
                    topbarIsLight
                      ? isActive
                        ? "text-[#0C2AFE]"
                        : "text-slate-700 hover:text-[#0C2AFE]"
                      : isActive
                        ? "text-white"
                        : "text-white/72 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-4 hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => toggleTheme?.()}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5",
                topbarIsLight
                  ? "border-slate-200 text-slate-700 hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
                  : "border-white/15 text-white/75 hover:border-white/35 hover:text-white"
              )}
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
              className={cn(
                "rounded-full p-2 transition-colors",
                topbarIsLight
                  ? "text-slate-800 hover:bg-slate-100"
                  : "text-white hover:bg-white/10"
              )}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className={cn(
                "rounded-full p-2 transition-colors",
                topbarIsLight
                  ? "text-slate-800 hover:bg-slate-100"
                  : "text-white hover:bg-white/10"
              )}
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
          <div
            className={cn(
              "border-t md:hidden",
              topbarIsLight
                ? "border-slate-200 bg-white text-slate-950"
                : "border-white/10 bg-[#020613] text-white"
            )}
          >
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-left text-sm font-bold uppercase tracking-tight transition-all",
                      topbarIsLight
                        ? isActive
                          ? "border-l-2 border-[#0C2AFE] bg-slate-100 text-[#0C2AFE]"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        : isActive
                          ? "border-l-2 border-[#0C2AFE] bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div
                className={cn(
                  "mt-2 flex justify-center gap-4 border-t pt-4",
                  topbarIsLight ? "border-slate-200" : "border-white/10"
                )}
              >
                <a
                  href="https://github.com/mhrzfrota"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    topbarIsLight
                      ? "text-slate-700 hover:bg-slate-100 hover:text-[#0C2AFE]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/matheusfrt"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    topbarIsLight
                      ? "text-slate-700 hover:bg-slate-100 hover:text-[#0C2AFE]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href={WHATSAPP_BUDGET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    topbarIsLight
                      ? "text-slate-700 hover:bg-slate-100 hover:text-[#0C2AFE]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
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
      <main className="relative pt-20">
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-secondary/40 mt-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo2-removebg-preview.png"
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
