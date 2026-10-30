import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, FileText, FolderOpen, Github, Instagram, Linkedin } from "lucide-react";
import { WHATSAPP_BUDGET_URL } from "@/const";
import { projects } from "@/data/projects";
import { STACK } from "@/components/StackShowcase";
import TypeCycler from "@/components/hero/TypeCycler";
import type { UIStrings } from "@/i18n/strings";
import { tocarClique } from "./som";

const relogio = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Fortaleza",
});

/** Só o relógio re-renderiza a cada 30 s, não o cartão inteiro. */
function HoraFortaleza({ sufixo }: { sufixo: string }) {
  const [agora, setAgora] = useState(() => relogio.format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setAgora(relogio.format(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] tracking-[0.02em]">
      {agora} {sufixo}
    </span>
  );
}

function IconeWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 6.9 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

type Linha = {
  href: string;
  rotulo: string;
  detalhe?: string;
  icone: ReactNode;
  /** Cor da marca que enche a linha no hover. */
  marca: string;
  tinta?: string;
  baixar?: string;
};

function LinhaDeLink({ linha }: { linha: Linha }) {
  const externo = !linha.baixar;
  return (
    <a
      href={linha.href}
      {...(externo ? { target: "_blank", rel: "noreferrer" } : { download: linha.baixar })}
      onClick={() => tocarClique("alto")}
      className="app-row group outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
      style={{ "--row-brand": linha.marca, "--row-brand-ink": linha.tinta ?? "#fff" } as CSSProperties}
    >
      <span className="app-row-icon">{linha.icone}</span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em]">{linha.rotulo}</span>
      {linha.detalhe ? (
        <span className="hidden text-[12px] opacity-60 sm:inline">{linha.detalhe}</span>
      ) : null}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-90" />
    </a>
  );
}

/**
 * Tela 1, o cartão de visitas: foto à esquerda, nome, o que eu faço e os
 * caminhos para falar comigo à direita. "Meus projetos" leva à tela de
 * Projetos (pedido do Matheus, 2026-10-29); a história foi para Trabalho.
 */

/**
 * Foto e cartão com a mesma altura (pedido do Matheus, 2026-10-29) sem cortar
 * a foto: o cartão da foto ganha a altura do cartão ao lado e a foto, quadrada,
 * fica do tamanho que cabe. Só a partir de 640 px; no celular eles empilham.
 */
const INFO_MIN = 340;
const VAO = 16;

function useMesmaAltura() {
  const grade = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<{ altura: number; lado: number } | null>(null);

  useLayoutEffect(() => {
    const medir = () => {
      if (!grade.current || !info.current || window.innerWidth < 640) {
        setMedida(null);
        return;
      }
      const altura = info.current.offsetHeight;
      const lado = Math.max(200, Math.min(altura, grade.current.clientWidth - VAO - INFO_MIN));
      setMedida(m => (m && Math.abs(m.altura - altura) < 1 && Math.abs(m.lado - lado) < 1 ? m : { altura, lado }));
    };
    medir();
    const observador = new ResizeObserver(medir);
    if (info.current) observador.observe(info.current);
    if (grade.current) observador.observe(grade.current);
    window.addEventListener("resize", medir);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  return { grade, info, medida };
}

export default function PerfilView({
  t,
  aoAbrirProjetos,
}: {
  t: UIStrings;
  aoAbrirProjetos: () => void;
}) {
  const { grade, info, medida } = useMesmaAltura();
  const linhas: Linha[] = [
    {
      href: WHATSAPP_BUDGET_URL,
      rotulo: t.app.profile.whatsapp,
      detalhe: "(85) 99637-0080",
      icone: <IconeWhatsapp className="h-[18px] w-[18px]" />,
      marca: "#1fa855",
    },
    {
      href: "https://www.instagram.com/emefeservices",
      rotulo: "@emefeservices",
      icone: <Instagram className="h-[18px] w-[18px]" />,
      marca: "linear-gradient(90deg,#f58529,#dd2a7b 45%,#8134af 75%,#515bd4)",
    },
    {
      href: "https://www.linkedin.com/in/matheusfrt",
      rotulo: "@matheusfrt",
      icone: <Linkedin className="h-[18px] w-[18px]" />,
      marca: "#0a66c2",
    },
    {
      href: "https://github.com/mhrzfrota",
      rotulo: "@mhrzfrota",
      icone: <Github className="h-[18px] w-[18px]" />,
      marca: "#24292f",
    },
  ];

  return (
    <div ref={grade} className="flex w-full max-w-[820px] flex-col gap-4 sm:flex-row sm:items-stretch">
      {/* Foto: quadrada, nunca cortada; o cartão tem a altura do cartão ao lado. */}
      <div
        className="app-card relative flex shrink-0 items-center justify-center overflow-hidden p-2.5"
        style={medida ? { width: medida.lado, height: medida.altura } : undefined}
      >
        <div
          className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-[var(--app-row)]"
          style={medida ? { width: medida.lado - 20, height: medida.lado - 20 } : undefined}
        >
          <img
            src="/images/matheus-bio.webp"
            alt={t.app.profile.photoAlt}
            width={320}
            height={320}
            className="h-full w-full object-cover"
            draggable={false}
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-white backdrop-blur-md">
            <HoraFortaleza sufixo={t.topbar.timeSuffix} />
          </span>
        </div>
      </div>

      <div ref={info} className="app-card flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <h1 className="app-display text-[34px] sm:text-[38px]" aria-label={t.hero.ariaHeadline}>
          Matheus Frota
        </h1>
        <p className="app-muted mt-1.5 text-[13.5px]">
          {t.hero.headline}{" "}
          <TypeCycler texts={[...t.hero.areas]} className="text-[var(--app-ink)]" />
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {linhas.map(linha => (
            <LinhaDeLink key={linha.href} linha={linha} />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <button
            type="button"
            onClick={() => {
              tocarClique("alto");
              aoAbrirProjetos();
            }}
            className="app-row app-row-dark group text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
          >
            <span className="app-row-icon">
              <FolderOpen className="h-[17px] w-[17px]" />
            </span>
            <span className="flex-1 text-[14px] font-medium tracking-[-0.01em]">{t.app.profile.projects}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </button>
          <LinhaDeLink
            linha={{
              href: "/curriculo.pdf",
              baixar: "Curriculo-Matheus-Frota.pdf",
              rotulo: t.app.profile.resume,
              icone: <FileText className="h-[17px] w-[17px]" />,
              marca: "var(--app-row-hover)",
              tinta: "var(--app-ink)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** O que era a seção Sobre e o convite de contato, agora dentro de "Minha história". */
export function HistoriaConteudo({ t }: { t: UIStrings }) {
  const numeros = [
    { valor: String(projects.length), rotulo: t.about.projectsLabel },
    { valor: String(STACK.length), rotulo: t.about.stackLabel },
    { valor: t.about.degreeValue, rotulo: t.about.degreeLabel },
    { valor: t.about.baseValue, rotulo: t.about.baseLabel },
  ];
  return (
    <div className="space-y-6 text-[14.5px] leading-relaxed">
      <div className="space-y-3">
        <h3 className="text-[17px] font-semibold tracking-[-0.03em]">{t.about.title}</h3>
        <p className="app-muted">{t.about.subtitle}</p>
        <p className="app-muted">{t.hero.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {numeros.map(n => (
          <div key={n.rotulo} className="rounded-[10px] p-4" style={{ background: "var(--app-row)" }}>
            <p className="app-display text-[26px]">{n.valor}</p>
            <p className="app-muted mt-1.5 text-[12.5px] leading-snug">{n.rotulo}</p>
          </div>
        ))}
      </div>

      <p className="border-l-2 pl-4 text-[15px] font-medium tracking-[-0.02em]" style={{ borderColor: "var(--app-accent)" }}>
        {t.about.quote}
      </p>

      <div className="rounded-[12px] p-5 text-white" style={{ background: "var(--app-accent)" }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em]">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {t.contact.directBadge}
        </span>
        <p className="mt-3 text-[19px] font-semibold leading-snug tracking-[-0.03em]">{t.contact.title}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">{t.contact.subtitle}</p>
        <a
          href={WHATSAPP_BUDGET_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => tocarClique("alto")}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0c2afe] transition-transform hover:-translate-y-0.5"
        >
          {t.contact.sendMessage}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
