import { useEffect, useState } from "react";
import {
  ArrowUpRight,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { getStrings } from "@/i18n/strings";
import { useAnimations } from "@/lib/useAnimations";
import RollButton from "@/components/RollButton";

const navIds = [
  "inicio",
  "sobre",
  "projetos",
  "combos",
  "blog",
  "contato",
] as const;

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

/**
 * Componente próprio de propósito: com o interval dentro do Layout, o header,
 * o menu mobile e o footer inteiros re-renderizavam a cada segundo. Aqui o
 * tick de 1s atualiza só este texto.
 */
function FortalezaTime({ suffix }: { suffix: string }) {
  const [time, setTime] = useState(() => timeFormatter.format(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(timeFormatter.format(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      {time} {suffix}
    </>
  );
}

/**
 * O "newsletter" da referência, adaptado ao que existe de verdade: a mensagem
 * digitada abre o WhatsApp já preenchida. Vazio, cai na mensagem padrão de
 * orçamento.
 */
function FooterWhatsForm({
  placeholder,
  submit,
}: {
  placeholder: string;
  submit: string;
}) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    const url = text
      ? `https://wa.me/5585996370080?text=${encodeURIComponent(text)}`
      : WHATSAPP_BUDGET_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 pl-5 transition-colors focus-within:border-white/35"
    >
      <input
        type="text"
        value={message}
        onChange={event => setMessage(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/50"
      />
      <button
        type="submit"
        className="mono-label flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[11px] text-white transition-colors hover:bg-[var(--brand-blue-dark)]"
      >
        {submit}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const t = getStrings(lang);
  const isDark = theme === "dark";

  // Monta o sistema data-anim da página atual; reexecuta ao trocar de rota.
  useAnimations([location]);

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
      className="mono-label flex h-9 items-center gap-1 rounded-full px-2.5 text-[11px] text-muted-foreground transition-colors duration-300 hover:bg-muted hover:text-foreground"
    >
      <span className={lang === "pt" ? "text-foreground" : ""}>PT</span>
      {/* Era text-border: 1.29:1, invisível. Decorativo, então some do leitor. */}
      <span aria-hidden="true">/</span>
      <span className={lang === "en" ? "text-foreground" : ""}>EN</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/15 selection:text-primary">
      {/* Navbar pill flutuante */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto max-w-[1080px] p-2 sm:p-3">
          {/* O ring a 4% dava 1.04:1 e não existia na tela; a sombra é quem
              descola o pill do fundo. */}
          <div className="flex items-center justify-between rounded-full bg-card px-[5px] py-2 shadow-[0_4px_24px_rgba(2,6,19,0.10)] ring-1 ring-black/[0.08] dark:ring-white/12">
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
                      // Hover reforça em vez de enfraquecer: antes o link
                      // clareava para muted-foreground ao passar o mouse.
                      "mono-label text-[11px] transition-colors duration-300",
                      activeSection === item.id
                        ? "text-primary"
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
                <FortalezaTime suffix={t.topbar.timeSuffix} />
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
                className="mono-label flex items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-[11px] text-white dark:bg-white dark:text-[var(--brand-ink)]"
                aria-label={t.topbar.openMenu}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {t.topbar.menu} <Menu size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile — bottom sheet */}
      <div
        id="mobile-menu"
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
            <span className="mono-label flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
              <Clock size={13} />
              <FortalezaTime suffix={t.topbar.timeSuffix} />
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="mono-label flex items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-[11px] text-white dark:bg-white dark:text-[var(--brand-ink)]"
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
                  "py-2 text-left text-[28px] font-medium leading-[32px] tracking-[-0.04em] transition-colors",
                  activeSection === item.id ? "text-primary" : "text-foreground"
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <RollButton
            className="mt-6 w-full"
            variant="arrow"
            label={t.topbar.requestQuote}
            href={WHATSAPP_BUDGET_URL}
            external
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="relative">{children}</main>

      {/* Footer — bloco escuro arredondado no desenho da referência: coluna de
          marca com formulário em pílula, colunas de links e barra inferior.
          A referência assina newsletter; sem backend pra isso, o formulário
          manda a mensagem digitada direto pro WhatsApp — funciona de verdade. */}
      <footer className="section-box section-box-ink overflow-hidden">
        <div className="container padding-global py-14 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-8">
            <div className="max-w-md">
              <img
                src="/logo2-removebg-preview.png"
                alt="MF Services"
                className="h-10 w-auto brightness-0 invert"
              />
              <p className="mt-5 text-[14px] leading-relaxed text-white/70">
                {t.footer.tagline}
              </p>

              <p className="mono-label mt-7 text-[11px] text-white/60">
                {t.footer.formLabel}
              </p>
              <FooterWhatsForm
                placeholder={t.footer.formPlaceholder}
                submit={t.footer.formSubmit}
              />
            </div>

            <nav aria-label={t.footer.navLabel}>
              <h2 className="mono-label text-[11px] text-white/60">
                {t.footer.navLabel}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {navItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className="text-[14px] text-white/80 transition-colors hover:text-white"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                {/* O bloco do Diagnóstico saiu da home; sem este link a rota
                    /diagnostico ficaria sem nenhum caminho até ela. */}
                <li>
                  <a
                    href="/diagnostico"
                    className="text-[14px] text-white/80 transition-colors hover:text-white"
                  >
                    {t.footer.diagnosticoLink}
                  </a>
                </li>
              </ul>
            </nav>

            <div>
              <h2 className="mono-label text-[11px] text-white/60">
                {t.footer.socialLabel}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2.5 text-[14px] text-white/80 transition-colors hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Telefone e currículo, realocados do antigo painel de contato. */}
            <div>
              <h2 className="mono-label text-[11px] text-white/60">
                {t.footer.contactLabel}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                <li>
                  <a
                    href={WHATSAPP_BUDGET_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] text-white/80 transition-colors hover:text-white"
                  >
                    (85) 99637-0080
                  </a>
                </li>
                <li>
                  <a
                    href="/curriculo.pdf"
                    download="Curriculo-Matheus-Frota.pdf"
                    className="text-[14px] text-white/80 transition-colors hover:text-white"
                  >
                    {t.footer.resumeLink}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] leading-relaxed text-white/70">
              © {new Date().getFullYear()} MF Services — Matheus Frota ·{" "}
              {t.footer.role}
            </p>
            <div className="flex items-center gap-5">
              {/* Ferramenta pessoal: o link existe pra rota ter um caminho,
                  mas fica discreto de propósito. */}
              <a
                href="/board"
                className="text-[12px] text-white/45 transition-colors hover:text-white/80"
              >
                {t.footer.boardLink}
              </a>
              <span className="mono-label flex items-center gap-1.5 text-[11px] text-white/60">
                <Clock size={13} />
                <FortalezaTime suffix={t.topbar.timeSuffix} />
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
