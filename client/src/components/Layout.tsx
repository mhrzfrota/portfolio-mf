import { useEffect, useState } from "react";
import { Clock, Menu, Moon, Sun, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SOCIALS, WHATSAPP_BUDGET_URL } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { useRevealOnScroll } from "@/lib/useRevealOnScroll";
import RollButton from "@/components/RollButton";
import ContactSheet from "@/components/ContactSheet";

const navIds = ["inicio", "projetos", "combos", "blog", "contato"] as const;

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
  const { lang, toggleLang } = useLanguage();
  const t = getStrings(lang);
  const isDark = theme === "dark";
  const time = useFortalezaTime();

  // Anima os blocos data-reveal da página atual; reexecuta ao trocar de rota.
  useRevealOnScroll([location]);

  const navItems = navIds.map(id => ({ id, label: t.nav[id] }));

  useEffect(() => {
    const sections = navIds
      .map(id => document.getElementById(id))
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

  const langToggle = (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t.topbar.switchLang}
      title={t.topbar.switchLang}
      className="flex h-9 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold tracking-wide text-muted-foreground transition-colors duration-300 hover:bg-muted hover:text-foreground"
    >
      <span className={lang === "pt" ? "text-foreground" : ""}>PT</span>
      <span className="text-border">/</span>
      <span className={lang === "en" ? "text-foreground" : ""}>EN</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-[#0C2AFE]/15 selection:text-[#0C2AFE]">
      {/* Navbar pill flutuante */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto max-w-[1080px] p-2 sm:p-3">
          <div className="flex items-center justify-between rounded-full bg-card px-[5px] py-2 shadow-[0_2px_12px_rgba(2,6,19,0.08)] ring-1 ring-black/[0.04] dark:ring-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavClick("inicio")}
                className="flex items-center pl-3 transition-opacity hover:opacity-80"
                aria-label={t.topbar.backHome}
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
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-2 pr-2 md:flex">
              <span className="hidden items-center gap-1.5 pr-2 text-[13px] text-muted-foreground lg:flex">
                <Clock size={14} />
                {time} {t.topbar.timeSuffix}
              </span>
              {langToggle}
              <button
                type="button"
                onClick={() => toggleTheme?.()}
                aria-label={isDark ? t.topbar.lightMode : t.topbar.darkMode}
                title={isDark ? t.topbar.light : t.topbar.dark}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-muted hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <a
                href={WHATSAPP_BUDGET_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-[var(--brand-ink)] dark:hover:bg-white/90"
              >
                {t.topbar.requestQuote}
              </a>
            </div>

            {/* Ações mobile */}
            <div className="flex items-center gap-1.5 md:hidden">
              {langToggle}
              <button
                type="button"
                onClick={() => toggleTheme?.()}
                aria-label={isDark ? t.topbar.lightMode : t.topbar.darkMode}
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
                aria-label={t.topbar.openMenu}
              >
                {t.topbar.menu} <Menu size={14} />
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
              {time} {t.topbar.timeSuffix}
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-[13px] font-medium text-white dark:bg-white dark:text-[var(--brand-ink)]"
              aria-label={t.topbar.closeMenu}
            >
              {t.topbar.close} <X size={14} />
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
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 flex items-center gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <RollButton
            className="mt-6 w-full"
            size="md"
            variant="black"
            label={t.topbar.requestQuote}
            href={WHATSAPP_BUDGET_URL}
            external
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="relative">{children}</main>

      {/* Folha preta de contato + rodapé (todas as rotas) */}
      <ContactSheet />
    </div>
  );
}
