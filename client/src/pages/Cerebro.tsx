import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  CircleCheckBig,
  LayoutGrid,
  Link2,
  RefreshCw,
  Search,
  Snowflake,
  Weight,
} from "lucide-react";
import { Link } from "wouter";
import InternalAccount from "@/components/InternalAccount";
import { cn } from "@/lib/utils";
import { carregarCerebro } from "@/features/cerebro/api";
import {
  DIAS_FRIA,
  TOKENS_PESADA,
  ehFria,
  ehPesada,
  filtrar,
  fmtTokens,
  maisLigadas,
  notasFrias,
  notasPesadas,
  ordenar,
  porPasta,
  relativo,
  type OrdemNotas,
} from "@/features/cerebro/stats";
import type { DadosCerebro, NotaCerebro } from "@/features/cerebro/types";

type Modo = "todas" | "frias" | "pesadas";

const PASSO_LISTA = 40;

/* ---------- Texto do foco da semana ----------
   O CLAUDE.md usa **negrito**, `código` e [[links]]. Só isso é renderizado;
   o resto fica como texto, sem virar HTML. */
function inline(texto: string, chave: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;
  let i = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(texto))) {
    if (m.index > i) partes.push(texto.slice(i, m.index));
    if (m[1] !== undefined) partes.push(<strong key={`${chave}-${n++}`} className="font-medium text-white">{m[1]}</strong>);
    else if (m[2] !== undefined) partes.push(<code key={`${chave}-${n++}`} className="rounded bg-white/15 px-1 py-0.5 font-mono text-[12px]">{m[2]}</code>);
    else partes.push(<span key={`${chave}-${n++}`} className="underline decoration-white/40 underline-offset-2">{m[4] ?? m[3]}</span>);
    i = m.index + m[0].length;
  }
  if (i < texto.length) partes.push(texto.slice(i));
  return partes;
}

function Foco({ texto, semana, sync }: { texto: string; semana: string | null; sync: string }) {
  const [aberto, setAberto] = useState(false);
  const blocos = useMemo(
    () => texto.split(/\n\s*\n/).map(b => b.trim()).filter(b => b && !b.startsWith("**Semana de:**")),
    [texto]
  );
  const visiveis = aberto ? blocos : blocos.slice(0, 2);
  const data = semana ? new Date(`${semana}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : null;

  return (
    <section className="board-glass board-col-in rounded-[24px] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="mono-label text-[10px] text-white/60">Foco da semana{data ? ` · ${data}` : ""}</p>
        <p className="mono-label text-[10px] text-white/45">sync {sync}</p>
      </div>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-white/85">
        {visiveis.map((b, i) =>
          b.startsWith("- ") ? (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.replace(/^-\s+/, ""), `${i}-${j}`)}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{inline(b.replace(/^>\s?/gm, ""), String(i))}</p>
          )
        )}
      </div>
      {blocos.length > 2 && (
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          className="mono-label mt-4 flex items-center gap-1.5 text-[10px] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aberto && "rotate-180")} />
          {aberto ? "Recolher" : `Ver tudo (${blocos.length - 2} a mais)`}
        </button>
      )}
    </section>
  );
}

/* ---------- Números do topo ---------- */
function Tile({
  rotulo,
  valor,
  detalhe,
  icone,
  ativo,
  onClick,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  icone?: ReactNode;
  ativo?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? ativo : undefined}
      className={cn(
        "board-card rounded-2xl px-4 py-4 text-left transition-colors",
        onClick && "hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        ativo && "bg-white/25"
      )}
    >
      <p className="mono-label flex items-center gap-1.5 text-[10px] text-white/60">
        {icone}
        {rotulo}
      </p>
      <p className="mt-1.5 text-[28px] font-medium leading-none tracking-[-0.03em]">{valor}</p>
      <p className="mt-1.5 text-[12px] text-white/60">{detalhe}</p>
    </Tag>
  );
}

/* ---------- Barra de magnitude: um tom só, do claro ao cheio ---------- */
function Barra({ fracao, className }: { fracao: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/12", className)} aria-hidden="true">
      <div className="h-full rounded-full bg-white/75" style={{ width: `${Math.max(2, Math.round(fracao * 100))}%` }} />
    </div>
  );
}

function Selo({ tipo }: { tipo: "fria" | "pesada" }) {
  const fria = tipo === "fria";
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px]",
        fria ? "bg-white/15 text-white/80" : "bg-[var(--sky)]/60 text-white"
      )}
    >
      {fria ? <Snowflake className="h-3 w-3" /> : <Weight className="h-3 w-3" />}
      {fria ? "fria" : "pesada"}
    </span>
  );
}

function LinhaNota({ nota, maxTokens, hoje }: { nota: NotaCerebro; maxTokens: number; hoje: Date }) {
  return (
    <li className="board-card rounded-2xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium leading-snug">{nota.titulo}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-white/50">{nota.path}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[15px] font-medium tabular-nums leading-snug">~{fmtTokens(nota.tokens)}</p>
          <p className="mt-0.5 text-[11px] text-white/55">{relativo(nota.modificado, hoje)}</p>
        </div>
      </div>
      <Barra fracao={nota.tokens / maxTokens} className="mt-2.5" />
      {(nota.status || ehFria(nota, hoje) || ehPesada(nota)) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {nota.status && <span className="mono-label max-w-full truncate rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/70">{nota.status}</span>}
          {ehPesada(nota) && <Selo tipo="pesada" />}
          {ehFria(nota, hoje) && <Selo tipo="fria" />}
        </div>
      )}
    </li>
  );
}

function Estado({ children }: { children: ReactNode }) {
  return (
    <div className="board-glass board-col-in mx-auto mt-10 max-w-[520px] rounded-[24px] p-6 text-center">{children}</div>
  );
}

export default function Cerebro() {
  const [dados, setDados] = useState<DadosCerebro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pasta, setPasta] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("todas");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<OrdemNotas>("tokens");
  const [limite, setLimite] = useState(PASSO_LISTA);
  const hoje = useMemo(() => new Date(), []);

  useEffect(() => {
    let ativo = true;
    carregarCerebro()
      .then(d => ativo && setDados(d))
      .catch((e: Error) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => setLimite(PASSO_LISTA), [pasta, modo, busca, ordem]);

  const notas = dados?.notas ?? [];
  const pastas = useMemo(() => porPasta(notas), [notas]);
  const frias = useMemo(() => notasFrias(notas, hoje), [notas, hoje]);
  const pesadas = useMemo(() => notasPesadas(notas), [notas]);
  const ligadas = useMemo(() => maisLigadas(notas), [notas]);
  const totalTokens = useMemo(() => notas.reduce((s, n) => s + n.tokens, 0), [notas]);
  const maxTokens = useMemo(() => Math.max(1, ...notas.map(n => n.tokens)), [notas]);
  const maxPasta = Math.max(1, ...pastas.map(p => p.tokens));

  const lista = useMemo(() => {
    const base = modo === "frias" ? frias : modo === "pesadas" ? pesadas : notas;
    return ordenar(filtrar(base, pasta, busca), ordem);
  }, [modo, frias, pesadas, notas, pasta, busca, ordem]);

  const syncRel = dados?.sync ? relativo(dados.sync.executado_em, hoje) : null;

  return (
    <div className="board-bg relative flex h-dvh flex-col overflow-hidden font-sans text-white">
      <div aria-hidden="true" className="board-blob left-[-10%] top-[-20%] h-[55vh] w-[55vh] bg-[var(--sky)]/45" />
      <div
        aria-hidden="true"
        className="board-blob bottom-[-25%] right-[-5%] h-[65vh] w-[65vh] bg-white/25 [animation-delay:-13s] [animation-duration:32s]"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pb-2 pt-4 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="board-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="mono-label whitespace-nowrap text-[11px] text-white/60">MF · interno</p>
            <h1 className="text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[28px]">Cérebro</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/board"
            className="board-glass mono-label flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Board</span>
          </Link>
          <Link
            href="/habitos"
            className="board-glass mono-label flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <CircleCheckBig className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hábitos</span>
          </Link>
          <InternalAccount />
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-12 pt-3 sm:px-8">
        {erro && (
          <Estado>
            <p className="text-[15px]">Não deu para carregar o cérebro.</p>
            <p className="mt-2 text-[13px] text-white/65">{erro}</p>
          </Estado>
        )}

        {!erro && !dados && (
          <Estado>
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            <p className="mono-label mt-4 text-[10px] text-white/70">Lendo o vault</p>
          </Estado>
        )}

        {dados && notas.length === 0 && (
          <Estado>
            <RefreshCw className="mx-auto h-6 w-6 text-white/70" />
            <p className="mt-3 text-[15px]">Nenhuma nota sincronizada ainda.</p>
            <p className="mt-2 text-[13px] text-white/65">
              No repositório do portfólio, rode <code className="font-mono">pnpm cerebro:sync</code> com o <code className="font-mono">.env.local</code> preenchido.
            </p>
          </Estado>
        )}

        {dados && notas.length > 0 && (
          <div className="mx-auto max-w-[1100px] space-y-4">
            {dados.sync?.foco && <Foco texto={dados.sync.foco.texto} semana={dados.sync.foco.semana} sync={syncRel ?? ""} />}

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile rotulo="Notas" valor={notas.length.toLocaleString("pt-BR")} detalhe={`${pastas.length} pastas`} ativo={modo === "todas"} onClick={() => setModo("todas")} />
              <Tile rotulo="Tokens" valor={`~${fmtTokens(totalTokens)}`} detalhe="estimativa, vault inteiro" />
              <Tile
                rotulo="Frias"
                valor={String(frias.length)}
                detalhe={`sem edição há ${DIAS_FRIA}+ dias`}
                icone={<Snowflake className="h-3 w-3" />}
                ativo={modo === "frias"}
                onClick={() => setModo(m => (m === "frias" ? "todas" : "frias"))}
              />
              <Tile
                rotulo="Pesadas"
                valor={String(pesadas.length)}
                detalhe={`acima de ${fmtTokens(TOKENS_PESADA)} tokens`}
                icone={<Weight className="h-3 w-3" />}
                ativo={modo === "pesadas"}
                onClick={() => setModo(m => (m === "pesadas" ? "todas" : "pesadas"))}
              />
            </section>

            {/* minmax(0,1fr): sem isso o texto com truncate dita a largura mínima da coluna e a página estoura no celular. */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="min-w-0 space-y-4">
                <section className="board-glass board-col-in rounded-[24px] p-4 sm:p-5">
                  <p className="mono-label text-[10px] text-white/60">Pastas · tokens</p>
                  <ul className="mt-3 space-y-1">
                    {pastas.map(p => {
                      const ativo = pasta === p.pasta;
                      return (
                        <li key={p.pasta}>
                          <button
                            type="button"
                            onClick={() => setPasta(ativo ? null : p.pasta)}
                            aria-pressed={ativo}
                            className={cn(
                              "w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                              ativo && "bg-white/18"
                            )}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-[13px]">{p.pasta}</span>
                              <span className="shrink-0 font-mono text-[11px] text-white/65">
                                {p.notas} · ~{fmtTokens(p.tokens)}
                              </span>
                            </div>
                            <Barra fracao={p.tokens / maxPasta} className="mt-1.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {ligadas.length > 0 && (
                  <section className="board-glass board-col-in rounded-[24px] p-4 sm:p-5">
                    <p className="mono-label flex items-center gap-1.5 text-[10px] text-white/60">
                      <Link2 className="h-3 w-3" />
                      Mais citadas
                    </p>
                    <ol className="mt-3 space-y-1.5">
                      {ligadas.map(l => (
                        <li key={l.nota.path} className="flex items-baseline justify-between gap-2 text-[13px]">
                          <span className="truncate">{l.nota.titulo}</span>
                          <span className="shrink-0 font-mono text-[11px] text-white/65">{l.entradas} links</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </aside>

              <section className="board-glass board-col-in min-w-0 rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      type="search"
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      placeholder="Buscar nota, caminho ou tag"
                      className="w-full rounded-full bg-white/12 py-2.5 pl-10 pr-4 text-[14px] text-white placeholder:text-white/45 focus:bg-white/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    />
                  </label>
                  <div className="board-card inline-flex rounded-full p-1" role="group" aria-label="Ordenar">
                    {(
                      [
                        ["tokens", "Pesadas"],
                        ["recentes", "Recentes"],
                        ["antigas", "Antigas"],
                      ] as const
                    ).map(([v, r]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setOrdem(v)}
                        aria-pressed={ordem === v}
                        className={cn(
                          "mono-label rounded-full px-3 py-1.5 text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                          ordem === v ? "bg-white/25 text-white" : "text-white/65 hover:text-white"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mono-label mt-3 text-[10px] text-white/55">
                  {lista.length} {lista.length === 1 ? "nota" : "notas"}
                  {pasta ? ` em ${pasta}` : ""}
                  {modo !== "todas" ? ` · ${modo}` : ""}
                </p>

                {lista.length === 0 ? (
                  <p className="board-card mt-3 rounded-2xl px-4 py-6 text-center text-[14px] text-white/70">Nada aqui com esse filtro.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {lista.slice(0, limite).map(n => (
                      <LinhaNota key={n.path} nota={n} maxTokens={maxTokens} hoje={hoje} />
                    ))}
                  </ul>
                )}

                {lista.length > limite && (
                  <button
                    type="button"
                    onClick={() => setLimite(l => l + PASSO_LISTA)}
                    className="board-glass mono-label mt-4 w-full rounded-full px-5 py-2.5 text-[10px] text-white/85 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Mostrar mais ({lista.length - limite})
                  </button>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
