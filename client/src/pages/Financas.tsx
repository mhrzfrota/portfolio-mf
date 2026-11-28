import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import FinancasProvider, { useWallet } from "@/components/financas/FinancasProvider";
import Dashboard from "@/components/financas/Dashboard";
import WalletBoard from "@/components/financas/WalletBoard";
import Reports from "@/components/financas/Reports";
import ImportOfx from "@/components/financas/ImportOfx";
import CoupleGoal from "@/components/financas/CoupleGoal";
import Settings from "@/components/financas/Settings";
import { cn } from "@/lib/utils";
import { VAULTS } from "@shared/financas/wallet";

const TELAS = [
  { slug: "", nome: "Visão geral", Tela: Dashboard },
  { slug: "lancamentos", nome: "Lançamentos", Tela: WalletBoard },
  { slug: "relatorios", nome: "Relatórios", Tela: Reports },
  { slug: "importar", nome: "Importar extrato", Tela: ImportOfx },
  { slug: "meta", nome: "Meta a Dois", Tela: CoupleGoal },
  { slug: "ajustes", nome: "Ajustes", Tela: Settings },
] as const;

/**
 * Com a aba aberta, o iPhone instala o app de Finanças (manifesto e ícone
 * próprios, abrindo direto em /financas). Fora dela, o portfólio segue igual.
 */
export function useAppDoIphone() {
  useEffect(() => {
    const criados: HTMLElement[] = [];
    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      el.setAttribute("data-financas", "");
      document.head.appendChild(el);
      criados.push(el);
    };
    const anteriores = [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="manifest"], link[rel="apple-touch-icon"]')];
    anteriores.forEach((el) => el.setAttribute("disabled", ""));
    anteriores.forEach((el) => el.remove());
    add("link", { rel: "manifest", href: "/financas.webmanifest" });
    add("link", { rel: "apple-touch-icon", href: "/financas-apple-180.png" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "apple-mobile-web-app-title", content: "Finanças" });
    add("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" });
    return () => {
      criados.forEach((el) => el.remove());
      anteriores.forEach((el) => {
        el.removeAttribute("disabled");
        document.head.appendChild(el);
      });
    };
  }, []);
}

function Barra({ ativa, base }: { ativa: string; base: string }) {
  const { vault, setVault, hideValues, toggleHideValues, syncing } = useWallet();
  // No celular as subabas rolam de lado: a ativa vem para a vista.
  useEffect(() => {
    document.querySelector('nav[aria-label="Finanças"] [aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [ativa]);
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-2 flex flex-wrap items-center gap-2 border-b border-[var(--i-linha)] bg-[var(--i-bg)]/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:bg-[var(--i-s1)] lg:px-3">
      <nav aria-label="Finanças" className="-mx-1 flex min-w-0 basis-full gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:basis-0 lg:flex-1">
        {TELAS.map(({ slug, nome }) => {
          const atual = slug === ativa;
          return (
            <Link
              key={slug || "visao"}
              href={slug ? `${base}/${slug}` : base}
              aria-current={atual ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-1.5 text-[13.5px] font-semibold transition-colors",
                atual ? "bg-[#0C2AFE] text-white" : "text-white/55 hover:bg-[var(--i-s3)] hover:text-white"
              )}
            >
              {nome}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {syncing && <LoaderCircle aria-label="Sincronizando" className="h-4 w-4 animate-spin text-white/45" />}
        <div className="flex rounded-xl bg-[var(--i-s3)] p-0.5" role="group" aria-label="Cofre ativo">
          {VAULTS.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setVault(opcao.id)}
              title={opcao.hint}
              aria-pressed={vault === opcao.id}
              className={cn(
                "rounded-[10px] px-2.5 py-1 text-xs font-semibold transition-colors",
                vault === opcao.id ? "bg-[var(--i-s1)] text-white shadow-sm" : "text-white/55 hover:text-white"
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleHideValues}
          aria-pressed={hideValues}
          aria-label={hideValues ? "Mostrar valores" : "Esconder valores"}
          title={hideValues ? "Mostrar valores" : "Esconder valores"}
          className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--i-linha)] bg-[var(--i-s1)] text-white/60 transition-colors hover:text-white"
        >
          {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function FinancasConteudo() {
  const [local] = useLocation();
  // A prévia de desenvolvimento mora em /dev/financas; o resto é igual.
  const base = local.startsWith("/dev/financas") ? "/dev/financas" : "/financas";
  const slug = local.slice(base.length).replace(/^\//, "").split(/[/?#]/)[0];
  const tela = TELAS.find((t) => t.slug === slug) ?? TELAS[0];
  const { ready } = useWallet();
  const Tela = tela.Tela;

  return (
    <div className="frtcash mx-auto max-w-[1280px]">
      <Barra ativa={tela.slug} base={base} />
      {ready ? (
        <Tela key={tela.slug} />
      ) : (
        <p role="status" className="flex items-center gap-2 py-16 text-sm text-white/55">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando suas finanças
        </p>
      )}
    </div>
  );
}

export default function Financas() {
  useAppDoIphone();
  return (
    <InternalShell title="Finanças">
      <FinancasProvider>
        <FinancasConteudo />
      </FinancasProvider>
    </InternalShell>
  );
}
