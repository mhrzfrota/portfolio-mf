import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Link } from "wouter";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { STACK } from "@/components/StackShowcase";
import { getPosts } from "@/data/posts";
import type { Lang } from "@/contexts/LanguageContext";
import type { UIStrings } from "@/i18n/strings";
import { tocarClique } from "./som";

export type Painel = "stack" | "solucoes" | "processo" | "notas";
/** O que um cartão de Trabalho abre: um painel ou a história (que saiu do Perfil em 2026-10-29). */
export type Abertura = Painel | "historia";

const WHATSAPP_BASE = "https://wa.me/5585996370080?text=";
/** Mesmas mensagens prontas dos combos da home antiga, na mesma ordem. */
export const LINKS_DOS_COMBOS = [
  `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20pela%20Presen%C3%A7a%20Digital.`,
  `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20por%20Opera%C3%A7%C3%A3o%20%26%20Dados.`,
  `${WHATSAPP_BASE}Ol%C3%A1!%20Quero%20come%C3%A7ar%20pelo%20Produto%20Completo.`,
];

function Cartao({
  titulo,
  aoAbrir,
  children,
  rotuloAbrir,
  className = "aspect-square",
}: {
  titulo: string;
  aoAbrir: () => void;
  children: ReactNode;
  rotuloAbrir: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        tocarClique("alto");
        aoAbrir();
      }}
      aria-label={`${rotuloAbrir}: ${titulo}`}
      className={`app-card group relative flex min-h-[180px] flex-col overflow-hidden p-4 text-left outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] sm:aspect-auto sm:h-[208px] ${className}`}
    >
      <span className="flex items-start justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.03em]">{titulo}</span>
        <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-90" />
      </span>
      <span className="relative flex flex-1 items-center justify-center">{children}</span>
    </button>
  );
}

/** Logos empilhados e tortos, como peças sobre a mesa; abrem um pouco no hover. */
function PilhaDeLogos() {
  const pecas = STACK.slice(0, 9);
  return (
    <span className="relative block h-[118px] w-[140px] origin-center scale-[0.78] min-[400px]:scale-90 sm:scale-100">
      {pecas.map((tech, i) => {
        const col = i % 3;
        const lin = Math.floor(i / 3);
        const giro = [-9, 6, -4, 8, -7, 5, -6, 9, -3][i];
        return (
          <span
            key={tech.name}
            className="absolute flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)] ring-1 ring-black/5 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform:rotate(var(--giro))] group-hover:[transform:translate(var(--dx),var(--dy))_rotate(0deg)]"
            style={
              {
                left: `${col * 44 + (lin % 2) * 10}px`,
                top: `${lin * 36}px`,
                "--giro": `${giro}deg`,
                zIndex: 10 - i,
                "--dx": `${(col - 1) * 6}px`,
                "--dy": `${(lin - 1) * 4}px`,
              } as React.CSSProperties
            }
          >
            <img src={tech.logo} alt="" className="h-6 w-6 object-contain" draggable={false} loading="lazy" />
          </span>
        );
      })}
    </span>
  );
}

/** Prévia das Soluções: uma linha do tempo curta com os três começos. */
function LinhaDasSolucoes({ nomes }: { nomes: readonly string[] }) {
  return (
    <span className="flex w-full max-w-[170px] flex-col gap-3">
      {nomes.map((nome, i) => (
        <span key={nome} className="relative flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full border-2"
            style={{
              borderColor: i === 1 ? "var(--app-accent)" : "var(--app-muted)",
              background: i === 1 ? "var(--app-accent)" : "transparent",
            }}
          />
          <span className="app-muted truncate text-[11px] font-medium min-[400px]:text-[12px]">{nome}</span>
        </span>
      ))}
    </span>
  );
}

function PassosNumerados({ total }: { total: number }) {
  return (
    <span className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-row)] text-[12px] font-semibold transition-colors duration-300 group-hover:bg-[var(--app-accent)] group-hover:text-white"
          style={{ transitionDelay: `${i * 70}ms` }}
        >
          <span className="relative">{i + 1}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Tela 2: o que era Stack, Soluções, o processo e o Blog vira quatro cartões;
 * cada um abre o conteúdo completo numa janela.
 */
export default function TrabalhoView({
  t,
  lang,
  aoAbrir,
}: {
  t: UIStrings;
  lang: Lang;
  aoAbrir: (painel: Abertura) => void;
}) {
  const posts = getPosts(lang);
  return (
    <div className="flex w-full max-w-[1000px] flex-col items-center">
      <h1 className="app-display text-[44px] sm:text-[56px]">{t.app.work.title}</h1>
      <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:mt-8 lg:grid-cols-5">
        {/* A história ocupa a linha inteira no celular e vira um cartão comum no computador. */}
        <Cartao titulo={t.app.profile.story} rotuloAbrir={t.app.work.open} aoAbrir={() => aoAbrir("historia")} className="col-span-2 lg:col-span-1">
          <span className="flex w-full items-end gap-3 self-end">
            <img src="/images/matheus-bio.webp" alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" draggable={false} />
            <span className="line-clamp-3 text-[13px] font-semibold leading-snug tracking-[-0.02em]">{t.about.title}</span>
          </span>
        </Cartao>
        <Cartao titulo={t.app.work.stack} rotuloAbrir={t.app.work.open} aoAbrir={() => aoAbrir("stack")}>
          <PilhaDeLogos />
        </Cartao>
        <Cartao titulo={t.app.work.solutions} rotuloAbrir={t.app.work.open} aoAbrir={() => aoAbrir("solucoes")}>
          <LinhaDasSolucoes nomes={t.combos.items.map(c => c.name)} />
        </Cartao>
        <Cartao titulo={t.app.work.process} rotuloAbrir={t.app.work.open} aoAbrir={() => aoAbrir("processo")}>
          <PassosNumerados total={t.contact.highlights.length} />
        </Cartao>
        <Cartao titulo={t.app.work.notes} rotuloAbrir={t.app.work.open} aoAbrir={() => aoAbrir("notas")}>
          <span className="flex w-full flex-col gap-1.5 self-end">
            <span className="app-muted text-[11px] font-medium uppercase tracking-[0.06em]">
              {posts.length} · {t.nav.blog}
            </span>
            <span className="line-clamp-3 text-[13.5px] font-semibold leading-snug tracking-[-0.02em]">
              {posts[0]?.title}
            </span>
          </span>
        </Cartao>
      </div>
    </div>
  );
}

const dataCurta = (valor: string, lang: Lang) => {
  const d = new Date(`${valor}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? valor
    : new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short", year: "numeric" }).format(d);
};

/** O conteúdo completo de cada cartão, para a janela. */
export function ConteudoDoPainel({ painel, t, lang }: { painel: Painel; t: UIStrings; lang: Lang }) {
  if (painel === "stack") {
    return (
      <div className="space-y-5">
        <p className="app-muted text-[14.5px] leading-relaxed">{t.stack.title}</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STACK.map(tech => (
            <li key={tech.name} className="flex items-center gap-3 rounded-[10px] p-2.5" style={{ background: "var(--app-row)" }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white ring-1 ring-black/5">
                <img src={tech.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
              </span>
              <span className="text-[13.5px] font-medium">{tech.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (painel === "solucoes") {
    return (
      <div className="space-y-5">
        <p className="app-muted text-[14.5px] leading-relaxed">{t.combos.subtitle}</p>
        <div className="flex flex-col gap-3">
          {t.combos.items.map((combo, i) => {
            const destaque = i === 1;
            return (
              <div
                key={combo.name}
                className="rounded-[12px] p-5"
                style={destaque ? { background: "var(--app-accent)", color: "#fff" } : { background: "var(--app-row)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[16px] font-semibold tracking-[-0.03em]">{combo.name}</h3>
                  {destaque ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#0c2afe]">
                      {t.combos.mostChosen}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-1.5 text-[14px] leading-snug ${destaque ? "text-white/90" : ""}`}>{combo.tagline}</p>
                <ul className="mt-3.5 space-y-2">
                  {combo.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-[13.5px] leading-snug ${destaque ? "text-white/90" : "app-muted"}`}>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className={`mt-4 text-[12.5px] ${destaque ? "text-white/75" : "app-muted"}`}>{t.combos.quote}</p>
                <a
                  href={LINKS_DOS_COMBOS[i]}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => tocarClique("alto")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                  style={destaque ? { background: "#fff", color: "#0c2afe" } : { background: "var(--app-ink)", color: "var(--app-bg)" }}
                >
                  {t.combos.cta}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (painel === "processo") {
    return (
      <div className="space-y-5">
        <ol className="relative space-y-5 pl-9">
          <span className="absolute bottom-3 left-[13px] top-3 w-px" style={{ background: "var(--app-line)" }} aria-hidden="true" />
          {t.contact.highlights.map((passo, i) => (
            <li key={passo.title} className="relative">
              <span
                className="absolute -left-9 top-0 flex h-[27px] w-[27px] items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: "var(--app-accent)" }}
              >
                {i + 1}
              </span>
              <h3 className="text-[16px] font-semibold tracking-[-0.03em]">{passo.title}</h3>
              <p className="app-muted mt-1 text-[14px] leading-relaxed">{passo.description}</p>
            </li>
          ))}
        </ol>
        <p className="app-muted text-[14px] leading-relaxed">{t.contact.whatsappParagraph}</p>
        <a
          href={WHATSAPP_BUDGET_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => tocarClique("alto")}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--app-accent)" }}
        >
          {t.contact.sendMessage}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const posts = getPosts(lang);
  return (
    <div className="space-y-4">
      <p className="app-muted text-[14.5px] leading-relaxed">{t.blog.subtitle}</p>
      <ul className="flex flex-col gap-2">
        {posts.map(post => (
          <li key={post.id}>
            <Link
              href={`/blog/${post.slug}`}
              onClick={() => tocarClique("alto")}
              className="group block rounded-[12px] p-4 transition-colors"
              style={{ background: "var(--app-row)" }}
            >
              <span className="app-muted text-[11.5px] font-medium uppercase tracking-[0.05em]">
                {dataCurta(post.date, lang)} · {post.readTime}
              </span>
              <span className="mt-1.5 flex items-start justify-between gap-3">
                <span className="text-[15.5px] font-semibold leading-snug tracking-[-0.03em]">{post.title}</span>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="app-muted mt-1.5 block text-[13.5px] leading-relaxed">{post.excerpt}</span>
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                {post.tags.map(tag => (
                  <span key={tag} className="rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em]" style={{ background: "var(--app-card)" }}>
                    {tag}
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
