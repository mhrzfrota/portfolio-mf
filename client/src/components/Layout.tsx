import { useEffect, useState } from "react";
import {
  Clock,
  Github,
  Instagram,
  Linkedin,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import RollButton from "@/components/RollButton";

const navItems = [
  { label: "Início", id: "inicio" },
  { label: "Projetos", id: "projetos" },
  { label: "Habilidades", id: "habilidades" },
  { label: "Combos", id: "combos" },
  { label: "Blog", id: "blog" },
  { label: "Contato", id: "contato" },
];

const socials = [
  { href: "https://github.com/mhrzfrota", label: "GitHub", Icon: Github },
  {
    href: "https://www.linkedin.com/in/matheusfrt",
    label: "LinkedIn",
    Icon: Linkedin,
  },
  {
    href: "https://www.instagram.com/emefeservices",
    label: "Instagram",
    Icon: Instagram,
  },
  { href: WHATSAPP_BUDGET_URL, label: "WhatsApp", Icon: MessageCircle },
];

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Fortaleza",
});

function useFortalezaTime() {
  const [time, setTime] = useState(() => timeFormatter.format(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(timeFormatter.format(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const time = useFortalezaTime();

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
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-[#0C2AFE]/15 selection:text-[#0C2AFE]">
      {/* Navbar pill flutuante */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto max-w-[1440px] p-2 sm:p-3">
          <div className="flex items-center justify-between rounded-full bg-card p-[5px] shadow-[0_2px_12px_rgba(2,6,19,0.08)] ring-1 ring-black/[0.04] dark:ring-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavClick("inicio")}
                className="flex items-center pl-3 transition-opacity hover:opacity-80"
                aria-label="MF Services — voltar ao início"
              >
                <img
                  src="/logo-topbar.png"
                  alt="MF Services"
                  className="h-6 w-auto sm:h-7 dark:brightness-0 dark:invert"
                />
              </button>

              {/* Nav desktop */}
              <nav className="hidden items-center gap-6 md:flex">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "text-[14px] transition-colors duration-300",
                      activeSection === item.id
                        ? "text-[#0C2AFE] dark:text-[#7C8CFF]"
                        : "text-foreground hover:text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <span className="hidden text-[13px] text-muted-foreground xl:block">
                Aberto a novos projetos
              </span>
              <span className="hidden items-center gap-1.5 text-[13px] text-muted-foreground lg:flex">
                <Clock size={14} />
                {time} em Fortaleza
              </span>
              <button
                type="button"
                onClick={() => toggleTheme?.()}
                aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                title={isDark ? "Modo claro" : "Modo escuro"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-muted hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <RollButton
                size="sm"
                variant="dark"
                label="Solicitar orçamento"
                href={WHATSAPP_BUDGET_URL}
                external
              />
            </div>

            {/* Ações mobile */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={() => toggleTheme?.()}
                aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-muted hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-[13px] font-medium text-white dark:bg-white dark:text-[var(--brand-ink)]"
                aria-label="Abrir menu"
              >
                Menu <Menu size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile — bottom sheet */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-500",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-card p-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            mobileOpen ? "translate-y-0" : "translate-y-[110%]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground">
              <Clock size={13} />
              {time} em Fortaleza
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-[13px] font-medium text-white dark:bg-white dark:text-[var(--brand-ink)]"
              aria-label="Fechar menu"
            >
              Fechar <X size={14} />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "py-2 text-left text-[28px] font-medium leading-[32px] tracking-tight transition-colors",
                  activeSection === item.id
                    ? "text-[#0C2AFE] dark:text-[#7C8CFF]"
                    : "text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 flex items-center gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <RollButton
            className="mt-6 w-full"
            size="md"
            variant="blue"
            label="Solicitar orçamento"
            href={WHATSAPP_BUDGET_URL}
            external
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="relative">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row lg:px-12">
          <div className="flex items-center gap-4">
            <img
              src="/logo2-removebg-preview.png"
              alt="MF Services"
              className="h-10 w-auto dark:brightness-0 dark:invert"
            />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              © {new Date().getFullYear()} MF Services — Matheus Frota
              <br className="hidden sm:block" /> Desenvolvedor de Software
            </p>
          </div>
          <div className="flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#0C2AFE] hover:text-[#0C2AFE]"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
