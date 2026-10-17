import type { ReactNode } from "react";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BookOpen, Bot, CalendarClock, CheckCircle2, Clapperboard, Clock3, Code2, Compass, FileText,
  FolderGit2, GitCommitHorizontal, Image as ImageIcon, LayoutDashboard, LayoutGrid, Lightbulb, Megaphone, MessageSquareText, Newspaper,
  NotebookPen, Repeat2, Rocket, Smartphone, Sparkles, Store, Sunrise, Target, TrendingUp, UserRound, Users, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { linkSeguro } from "@/features/noite/nuvem";
import type {
  CategoriaNoticia, Cliente, Dev, FormatoConteudo, IdeiaConteudo, Insight, Metricas, Momento, Noticia, PorProjeto, Prioridade, Prioridades,
  ProjetoDoDia, ProjetoNovo, Prospecto, Relatorio, StatusProjeto, TipoInsight, TipoMomento,
} from "@shared/noite/relatorio";

/* Azul da marca clareado para ícones e textos pequenos sobre o fundo escuro (o #0C2AFE puro fica sem contraste). */
const AZUL = "text-[#8C99FF]";
const CARTAO = "rounded-2xl bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const ROTULO = "text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55";

export function Secao({ id, icone: Icone, titulo, apoio, children, className }: { id: string; icone: typeof Sparkles; titulo: string; apoio?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("mt-10 first:mt-0", className)}>
      <div className="mb-4">
        <h2 id={id} className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <Icone aria-hidden size={18} className={AZUL} />
          {titulo}
        </h2>
        {apoio && <p className="mt-1 text-[13.5px] text-white/55">{apoio}</p>}
      </div>
      {children}
    </section>
  );
}

const Vazio = ({ children }: { children: ReactNode }) => <p className={cn(CARTAO, "px-5 py-4 text-[14px] text-white/55")}>{children}</p>;

/* ------------------------------ Abas ------------------------------ */

export type Aba = "geral" | "dia" | "noticias" | "conteudo" | "clientes" | "dev";

export const ABAS: { id: Aba; nome: string; icone: typeof Sparkles }[] = [
  { id: "geral", nome: "Visão geral", icone: LayoutDashboard },
  { id: "dia", nome: "O dia", icone: Clock3 },
  { id: "noticias", nome: "Notícias", icone: Newspaper },
  { id: "conteudo", nome: "Conteúdo", icone: Clapperboard },
  { id: "clientes", nome: "Clientes", icone: Users },
  { id: "dev", nome: "Você dev", icone: UserRound },
];

export function contagem(r: Relatorio, aba: Aba): number | null {
  if (aba === "noticias") return r.noticias.length;
  if (aba === "conteudo") return r.conteudo.length;
  if (aba === "clientes") return r.clientes.length + r.prospeccao.length;
  if (aba === "dia") return r.projetos.length || null;
  return null;
}

/** Barra de abas fixa logo abaixo do cabeçalho do sistema interno (h-14). */
export function BarraDeAbas({ r, aba, mudar }: { r: Relatorio; aba: Aba; mudar: (a: Aba) => void }) {
  return (
    <div className="sticky top-14 z-30 -mx-3 mt-6 border-b border-white/[0.07] bg-[#0B0C10]/90 px-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div role="tablist" aria-label="Partes do relatório" className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ABAS.map(({ id, nome, icone: Icone }) => {
          const ativa = id === aba;
          const n = contagem(r, id);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`aba-${id}`}
              aria-selected={ativa}
              aria-controls={`painel-${id}`}
              onClick={() => mudar(id)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[14px] font-medium transition-colors",
                ativa ? "bg-white text-[#0B0C10]" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Icone aria-hidden size={16} />
              {nome}
              {n !== null && n > 0 && (
                <span className={cn("rounded-full px-1.5 text-[11.5px] font-semibold tabular-nums", ativa ? "bg-[#0B0C10]/10" : "bg-white/[0.08] text-white/70")}>{n}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Topo ------------------------------ */

export function Manchete({ r }: { r: Relatorio }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_120%_at_0%_0%,rgba(12,42,254,0.42),rgba(12,42,254,0.07)_55%,transparent)] p-6 ring-1 ring-inset ring-white/10 sm:p-8">
        <p className={cn(ROTULO, "flex items-center gap-2 text-white/60")}>
          <Sparkles aria-hidden size={14} className={AZUL} /> O dia em uma frase
        </p>
        <p className="mt-3 text-[1.55rem] font-semibold leading-snug tracking-tight [text-wrap:balance] sm:text-[1.95rem]">{r.manchete}</p>
        {r.resumo.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {r.resumo.map((t) => (
              <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed text-white/80">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8C99FF]" />
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Amanha itens={r.amanha} />
    </div>
  );
}

function Amanha({ itens }: { itens: Prioridades[] }) {
  return (
    <div className={cn(CARTAO, "flex flex-col p-6 sm:p-7")}>
      <p className={cn(ROTULO, "flex items-center gap-2 text-white/60")}>
        <Sunrise aria-hidden size={14} className="text-amber-300" /> Amanhã, nesta ordem
      </p>
      {itens.length === 0 ? (
        <p className="mt-4 text-[14px] text-white/55">Sem prioridades sugeridas hoje.</p>
      ) : (
        <ol className="mt-5 space-y-5">
          {itens.map((p, i) => (
            <li key={p.titulo} className="flex gap-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-300 text-[13px] font-bold text-black">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold leading-snug">{p.titulo}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">{p.porque}</p>
                {p.projeto && <p className="mt-1.5 inline-block rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12px] text-white/70">{p.projeto}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------- O dia em 24 horas ------------------------ */

const formatar = (n: number) => n.toLocaleString("pt-BR");

const COR_MOMENTO: Record<TipoMomento, string> = {
  commit: "bg-[#5B6CFF]",
  sessao: "bg-violet-400",
  marco: "bg-amber-300",
  vault: "bg-emerald-400",
  deploy: "bg-rose-400",
};
const NOME_MOMENTO: Record<TipoMomento, string> = { commit: "Commit", sessao: "Conversa com IA", marco: "Marco", vault: "Vault", deploy: "Deploy" };

/** A janela do dia vai da meia-noite às 04:00 do dia seguinte: 28 horas na régua. */
const HORAS_NA_REGUA = 28;
const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

/** Posição de cada momento na régua; depois da meia-noite a hora volta a zero e soma 24 h. */
function posicoes(itens: Momento[]): number[] {
  let extra = 0;
  let anterior = -1;
  return itens.map((m) => {
    let t = minutos(m.hora) + extra;
    if (t < anterior) {
      extra += 24 * 60;
      t += 24 * 60;
    }
    anterior = t;
    return Math.min(100, (t / (HORAS_NA_REGUA * 60)) * 100);
  });
}

/** Régua das 24 horas com cada momento do dia e, embaixo, os números do coletor. */
export function PainelDoDia({ itens, m }: { itens: Momento[]; m: Metricas }) {
  const pos = posicoes(itens);
  // Momentos muito próximos (minutos de diferença) empilham para cima em vez de se esconderem
  const nivel = pos.map((p, i) => pos.slice(0, i).filter((q) => Math.abs(q - p) < 1.2).length % 3);
  const tipos = [...new Set(itens.map((i) => i.tipo))];
  const inicio = m.primeiraAtividade ? minutos(m.primeiraAtividade) : null;
  let fim = m.ultimaAtividade ? minutos(m.ultimaAtividade) : null;
  if (inicio !== null && fim !== null && fim < inicio) fim += 24 * 60;
  const pct = (t: number) => Math.min(100, (t / (HORAS_NA_REGUA * 60)) * 100);
  const stats: { rotulo: string; valor: string; dica: string; icone: typeof Sparkles; alerta?: boolean }[] = [
    { rotulo: "Commits", valor: formatar(m.commits), dica: `em ${m.repositorios} ${m.repositorios === 1 ? "projeto" : "projetos"}`, icone: GitCommitHorizontal },
    { rotulo: "Linhas", valor: `+${formatar(m.linhasMais)}`, dica: `−${formatar(m.linhasMenos)} em ${formatar(m.arquivosAlterados)} arquivos`, icone: Code2 },
    { rotulo: "Conversas com IA", valor: formatar(m.sessoesClaude + m.sessoesCodex), dica: `${m.sessoesClaude} Claude, ${m.sessoesCodex} Codex`, icone: Bot },
    { rotulo: "Pedidos", valor: formatar(m.pedidos), dica: "feitos aos agentes", icone: MessageSquareText },
    { rotulo: "Notas no vault", valor: formatar(m.notasDoVault), dica: "criadas ou editadas", icone: NotebookPen },
    {
      rotulo: "Sem commit",
      valor: formatar(m.naoCommitado),
      dica: m.naoCommitado ? "projetos com mudança pendente" : "tudo guardado no git",
      icone: m.naoCommitado ? AlertTriangle : CheckCircle2,
      alerta: m.naoCommitado > 0,
    },
  ];
  return (
    <div className={cn(CARTAO, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className={cn(ROTULO, "flex items-center gap-2")}>
          <CalendarClock aria-hidden size={14} className={AZUL} /> Seu dia em 24 horas
        </p>
        <p className="text-[13px] text-white/55">
          {m.primeiraAtividade && m.ultimaAtividade ? (
            <>
              Ativo das <span className="font-semibold text-white/85 tabular-nums">{m.primeiraAtividade}</span> às <span className="font-semibold text-white/85 tabular-nums">{m.ultimaAtividade}</span>
            </>
          ) : (
            "Sem atividade registrada"
          )}
        </p>
      </div>

      {/* Régua */}
      <div className="relative mt-6 h-12" role="img" aria-label={`${itens.length} momentos ao longo do dia`}>
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        {inicio !== null && fim !== null && (
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#0C2AFE]/70 to-[#8C99FF]/70"
            style={{ left: `${pct(inicio)}%`, width: `${Math.max(1, pct(fim) - pct(inicio))}%` }}
          />
        )}
        {itens.map((it, i) => (
          <span
            key={`${it.hora}-${i}`}
            title={`${it.hora} · ${NOME_MOMENTO[it.tipo]}: ${it.texto}`}
            className={cn("absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-[3px] ring-[#121318]", COR_MOMENTO[it.tipo])}
            style={{ left: `${pos[i]}%`, transform: `translate(-50%, calc(-50% - ${nivel[i] * 11}px))` }}
          />
        ))}
      </div>
      <div className="relative h-4 text-[11.5px] tabular-nums text-white/40">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${(h / HORAS_NA_REGUA) * 100}%` }}>
            {String(h % 24).padStart(2, "0")}h
          </span>
        ))}
        <span className="absolute right-0">04h</span>
      </div>
      {tipos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-white/55">
          {tipos.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("h-2 w-2 rounded-full", COR_MOMENTO[t])} />
              {NOME_MOMENTO[t]}
            </li>
          ))}
        </ul>
      )}

      {/* Números do coletor */}
      <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.07] sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ rotulo, valor, dica, icone: Icone, alerta }) => (
          <li key={rotulo} className="bg-[#111216] p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-white/55">
              <Icone aria-hidden size={14} className={alerta ? "text-amber-300" : AZUL} />
              {rotulo}
            </p>
            <p className={cn("mt-2 text-[1.6rem] font-semibold leading-none tracking-tight tabular-nums", alerta && "text-amber-200")}>{valor}</p>
            <p className="mt-1.5 text-[12px] leading-snug text-white/45">{dica}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LinhaDoTempo({ itens }: { itens: Momento[] }) {
  if (!itens.length) return <Vazio>Nenhum momento registrado hoje.</Vazio>;
  return (
    <div className={cn(CARTAO, "p-5 sm:p-6")}>
      <p className={ROTULO}>Momento a momento</p>
      <ol className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[3.6rem] before:top-2 before:w-px before:bg-white/10">
        {itens.map((m, i) => (
          <li key={`${m.hora}-${i}`} className="relative grid grid-cols-[3rem_1rem_1fr] items-start gap-x-2">
            <span className="pt-0.5 text-right font-mono text-[12.5px] tabular-nums text-white/55">{m.hora}</span>
            <span aria-hidden className={cn("relative z-10 mt-1.5 h-2.5 w-2.5 justify-self-center rounded-full ring-4 ring-[#0B0C10]", COR_MOMENTO[m.tipo])} />
            <div className="min-w-0">
              <p className="text-[14.5px] leading-snug">{m.texto}</p>
              <p className="mt-1 text-[12px] text-white/45">
                {NOME_MOMENTO[m.tipo]}
                {m.projeto ? ` · ${m.projeto}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PorProjetoBarras({ itens }: { itens: PorProjeto[] }) {
  const lista = itens.filter((p) => p.commits > 0);
  return (
    <div className={cn(CARTAO, "p-5 sm:p-6")}>
      <p className={ROTULO}>Commits por projeto</p>
      {!lista.length ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-[14px] text-white/50">
          <GitCommitHorizontal aria-hidden size={22} className="text-white/30" />
          Nenhum commit hoje.
        </div>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {lista.map((p) => {
            const max = Math.max(...lista.map((x) => x.commits));
            return (
              <li key={p.projeto}>
                <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="truncate font-medium">{p.projeto}</span>
                  <span className="shrink-0 tabular-nums text-white/55">
                    {p.commits} · <span className="text-emerald-300">+{formatar(p.linhasMais)}</span> <span className="text-rose-300">−{formatar(p.linhasMenos)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/[0.06]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#0C2AFE] to-[#8C99FF]" style={{ width: `${Math.max(6, (p.commits / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STATUS: Record<StatusProjeto, { nome: string; classe: string; barra: string }> = {
  avancou: { nome: "Avançou", classe: "bg-[#0C2AFE]/25 text-[#B7C0FF]", barra: "bg-[#5B6CFF]" },
  entregue: { nome: "Entregue", classe: "bg-emerald-400/15 text-emerald-300", barra: "bg-emerald-400" },
  travado: { nome: "Travado", classe: "bg-amber-300/15 text-amber-200", barra: "bg-amber-300" },
  novo: { nome: "Novo", classe: "bg-violet-400/15 text-violet-200", barra: "bg-violet-400" },
};

export function Projetos({ itens, novos }: { itens: ProjetoDoDia[]; novos: ProjetoNovo[] }) {
  return (
    <>
      {novos.length > 0 && (
        <div className={cn(CARTAO, "mb-3 flex flex-wrap items-center gap-2 p-4")}>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-200">
            <Rocket aria-hidden size={15} /> Projetos novos:
          </span>
          {novos.map((n) => (
            <span key={n.nome} className="rounded-full bg-violet-400/15 px-3 py-1 text-[13px] text-violet-100" title={n.descricao}>
              {n.nome}
            </span>
          ))}
        </div>
      )}
      {itens.length === 0 ? (
        <Vazio>Nenhum projeto tocado hoje.</Vazio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {itens.map((p) => (
            <li key={p.nome} className={cn(CARTAO, "relative flex flex-col overflow-hidden p-5 pl-6")}>
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", STATUS[p.status].barra)} />
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold">
                  <FolderGit2 aria-hidden size={16} className={AZUL} />
                  {p.nome}
                </p>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold", STATUS[p.status].classe)}>{STATUS[p.status].nome}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-white/80">{p.avancou}</p>
              <p className="mt-auto flex gap-2 pt-4 text-[13px] leading-relaxed text-white/60">
                <ArrowRight aria-hidden size={14} className="mt-0.5 shrink-0 text-white/40" />
                <span>
                  <span className="font-semibold text-white/80">Próximo passo:</span> {p.proximo}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* --------------------------- Você como dev ------------------------- */

export function VoceDev({ d }: { d: Dev }) {
  const estudo = linkSeguro(d.estudo.link);
  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
      <div className={cn(CARTAO, "p-6 sm:p-7")}>
        <p className={ROTULO}>Leitura do dia</p>
        <p className="mt-3 text-[1.2rem] font-medium leading-relaxed [text-wrap:pretty]">“{d.momento}”</p>
        {d.praticou.length > 0 && (
          <>
            <p className={cn(ROTULO, "mt-6")}>O que você praticou</p>
            <ul className="mt-3 space-y-2">
              {d.praticou.map((p) => (
                <li key={p} className="flex gap-2.5 text-[14px] leading-relaxed text-white/80">
                  <CheckCircle2 aria-hidden size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  {p}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className={cn(CARTAO, "p-5")}>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-300"><TrendingUp aria-hidden size={15} /> Ponto forte</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white/80">{d.pontoForte}</p>
        </div>
        <div className={cn(CARTAO, "p-5")}>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-200"><Target aria-hidden size={15} /> Para melhorar</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white/80">{d.melhorar}</p>
        </div>
        <div className={cn(CARTAO, "bg-[#0C2AFE]/[0.12] p-5 sm:col-span-2 lg:col-span-1")}>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#B7C0FF]"><BookOpen aria-hidden size={15} /> Estudo sugerido</p>
          <p className="mt-2 font-semibold">{d.estudo.tema}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{d.estudo.porque}</p>
          {estudo && (
            <a href={estudo} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#B7C0FF] hover:text-white">
              Abrir material <ArrowUpRight aria-hidden size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Insights --------------------------- */

const INSIGHT: Record<TipoInsight, { nome: string; icone: typeof Sparkles; cor: string; borda: string }> = {
  oportunidade: { nome: "Oportunidade", icone: Lightbulb, cor: "text-emerald-300 bg-emerald-400/10", borda: "bg-emerald-400" },
  risco: { nome: "Risco", icone: AlertTriangle, cor: "text-amber-200 bg-amber-300/10", borda: "bg-amber-300" },
  padrao: { nome: "Padrão", icone: Repeat2, cor: "text-[#B7C0FF] bg-[#0C2AFE]/20", borda: "bg-[#5B6CFF]" },
};

export function Insights({ itens }: { itens: Insight[] }) {
  if (!itens.length) return <Vazio>Sem insights hoje.</Vazio>;
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {itens.map((i) => {
        const { nome, icone: Icone, cor, borda } = INSIGHT[i.tipo];
        return (
          <li key={i.titulo} className={cn(CARTAO, "relative overflow-hidden p-5 pl-6")}>
            <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", borda)} />
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", cor)}>
              <Icone aria-hidden size={13} /> {nome}
            </span>
            <p className="mt-3 font-semibold leading-snug">{i.titulo}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">{i.texto}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------ Notícias --------------------------- */

const dataCurta = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d.slice(8)}/${d.slice(5, 7)}` : d);

type GrupoNoticia = CategoriaNoticia | "outras";

const CATEGORIA: Record<GrupoNoticia, { nome: string; apoio: string; icone: typeof Sparkles; cor: string; fundo: string; ponto: string }> = {
  mercado: { nome: "Mercado dos seus clientes", apoio: "O que muda para quem compra de você.", icone: Store, cor: "text-emerald-300", fundo: "bg-emerald-400/10", ponto: "bg-emerald-400" },
  crescimento: { nome: "Para a MF crescer", apoio: "Venda, preço, oportunidades e posicionamento.", icone: TrendingUp, cor: "text-[#B7C0FF]", fundo: "bg-[#0C2AFE]/20", ponto: "bg-[#8C99FF]" },
  ferramentas: { nome: "Ferramentas que você usa", apoio: "Só o que pede alguma ação sua.", icone: Wrench, cor: "text-sky-300", fundo: "bg-sky-400/10", ponto: "bg-sky-400" },
  outras: { nome: "Outras notícias", apoio: "Relatório anterior à separação por categoria.", icone: Newspaper, cor: "text-white/70", fundo: "bg-white/[0.07]", ponto: "bg-white/50" },
};
const ORDEM_GRUPOS: GrupoNoticia[] = ["mercado", "crescimento", "ferramentas", "outras"];
const ORDEM_RELEVANCIA: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };
const grupoDe = (n: Noticia): GrupoNoticia => n.categoria ?? "outras";
/** O bloco de ação já é uma sugestão: tira o "Sugestão:" que o modelo às vezes põe na frente. */
const semPrefixo = (t: string) => {
  const s = t.replace(/^\s*sugest[ãa]o:\s*/i, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function SeloRelevancia({ r }: { r?: Prioridade }) {
  if (r === "alta")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/15 px-2.5 py-0.5 text-[12px] font-semibold text-rose-200"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-400" />Agir esta semana</span>;
  if (r === "media") return <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12px] font-medium text-white/65">Vale saber</span>;
  return null;
}

function CartaoNoticia({ n }: { n: Noticia }) {
  const url = linkSeguro(n.url);
  const c = CATEGORIA[grupoDe(n)];
  return (
    <li className={cn(CARTAO, "flex flex-col overflow-hidden")}>
      <div className="p-5">
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-white/50">
          <SeloRelevancia r={n.relevancia} />
          <span>{n.fonte} · {dataCurta(n.data)}</span>
        </p>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="group mt-3 inline-flex items-start gap-1 text-[15.5px] font-semibold leading-snug hover:text-[#B7C0FF]">
            {n.titulo}
            <ArrowUpRight aria-hidden size={15} className="mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
          </a>
        ) : (
          <p className="mt-3 text-[15.5px] font-semibold leading-snug">{n.titulo}</p>
        )}
        <p className="mt-2 text-[14px] leading-relaxed text-white/65">{n.resumo}</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/80">
          <span className="font-semibold text-white">Por que importa: </span>
          {n.porqueImporta}
        </p>
      </div>
      {n.acao && (
        <p className={cn("mt-auto flex gap-2.5 border-t border-white/[0.06] px-5 py-3.5 text-[13.5px] font-medium leading-relaxed", c.fundo, c.cor)}>
          <ArrowRight aria-hidden size={16} className="mt-0.5 shrink-0" />
          <span className="text-white/90">{semPrefixo(n.acao)}</span>
        </p>
      )}
    </li>
  );
}

export function Noticias({ itens }: { itens: Noticia[] }) {
  if (!itens.length) return <Vazio>Nenhuma notícia hoje.</Vazio>;
  const grupos = ORDEM_GRUPOS.map((g) => ({
    g,
    lista: itens.filter((n) => grupoDe(n) === g).sort((a, b) => ORDEM_RELEVANCIA[a.relevancia ?? "baixa"] - ORDEM_RELEVANCIA[b.relevancia ?? "baixa"]),
  })).filter((x) => x.lista.length);
  const agir = itens.filter((n) => n.relevancia === "alta").length;
  return (
    <div>
      {/* Resumo da pauta */}
      <ul className="mb-6 flex flex-wrap gap-2">
        {agir > 0 && (
          <li className="inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-3.5 py-1.5 text-[13px] font-semibold text-rose-200">
            <span aria-hidden className="h-2 w-2 rounded-full bg-rose-400" />
            {agir} para agir esta semana
          </li>
        )}
        {grupos.map(({ g, lista }) => (
          <li key={g} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13px] text-white/75">
            <span aria-hidden className={cn("h-2 w-2 rounded-full", CATEGORIA[g].ponto)} />
            {CATEGORIA[g].nome} <span className="font-semibold tabular-nums text-white">{lista.length}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-8">
        {grupos.map(({ g, lista }) => {
          const { nome, apoio, icone: Icone, cor, fundo } = CATEGORIA[g];
          return (
            <section key={g} aria-labelledby={`noticias-${g}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", fundo, cor)}>
                  <Icone aria-hidden size={18} />
                </span>
                <div>
                  <h3 id={`noticias-${g}`} className="text-[16px] font-semibold leading-tight tracking-tight">{nome}</h3>
                  <p className="text-[12.5px] text-white/50">{apoio}</p>
                </div>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {lista.map((n) => (
                  <CartaoNoticia key={n.titulo} n={n} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Conteúdo --------------------------- */

const FORMATO: Record<FormatoConteudo, { nome: string; icone: typeof Sparkles; proporcao: string }> = {
  reel: { nome: "Reel", icone: Clapperboard, proporcao: "aspect-[9/16]" },
  story: { nome: "Story", icone: Smartphone, proporcao: "aspect-[9/16]" },
  carrossel: { nome: "Carrossel", icone: LayoutGrid, proporcao: "aspect-[4/5]" },
  post: { nome: "Post", icone: ImageIcon, proporcao: "aspect-[4/5]" },
};

/** Prévia da peça no formato do Instagram, com o gancho escrito nela. */
function PreviaPeca({ c }: { c: IdeiaConteudo }) {
  const { nome, icone: Icone, proporcao } = FORMATO[c.formato];
  return (
    <div className="relative w-[7.5rem] shrink-0 sm:w-[8.5rem]">
      {c.formato === "carrossel" && (
        <>
          <span aria-hidden className={cn("absolute inset-0 translate-x-3 rotate-[5deg] rounded-xl bg-[#0C2AFE]/30", proporcao)} />
          <span aria-hidden className={cn("absolute inset-0 translate-x-1.5 rotate-[2.5deg] rounded-xl bg-[#0C2AFE]/50", proporcao)} />
        </>
      )}
      <div className={cn("relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#0C2AFE] to-[#3B1C8C] p-2.5 shadow-[0_10px_30px_-12px_rgba(12,42,254,0.7)]", proporcao)}>
        <span className="inline-flex items-center gap-1 self-start rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
          <Icone aria-hidden size={10} /> {nome}
        </span>
        <p className="line-clamp-5 text-[11.5px] font-bold leading-tight text-white [text-wrap:balance]">{c.gancho}</p>
        {(c.formato === "reel" || c.formato === "story") && <span aria-hidden className="h-0.5 w-full rounded-full bg-white/30"><span className="block h-full w-1/3 rounded-full bg-white" /></span>}
        {c.formato === "carrossel" && (
          <span aria-hidden className="flex justify-center gap-1">
            {c.roteiro.slice(0, 5).map((_, i) => <span key={i} className={cn("h-1 w-1 rounded-full", i === 0 ? "bg-white" : "bg-white/40")} />)}
          </span>
        )}
        {c.formato === "post" && <span aria-hidden className="h-1" />}
      </div>
    </div>
  );
}

export function Conteudo({ itens }: { itens: IdeiaConteudo[] }) {
  if (!itens.length) return <Vazio>Sem ideias de conteúdo hoje.</Vazio>;
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {itens.map((c) => (
        <li key={c.gancho} className={cn(CARTAO, "flex gap-5 p-5")}>
          <PreviaPeca c={c} />
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-semibold leading-snug">{c.gancho}</p>
            <ol className="mt-3 space-y-2">
              {c.roteiro.map((passo, i) => (
                <li key={passo} className="flex gap-2.5 text-[13.5px] leading-relaxed text-white/75">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-semibold tabular-nums">{i + 1}</span>
                  {passo}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[12.5px] leading-relaxed text-white/50">
              <span className="font-semibold text-white/65">Base:</span> {c.base}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------- Clientes e prospecção --------------------- */

const PRIORIDADE: Record<Prioridade, { nome: string; ponto: string; topo: string }> = {
  alta: { nome: "Alta", ponto: "bg-rose-400", topo: "bg-rose-400" },
  media: { nome: "Média", ponto: "bg-amber-300", topo: "bg-amber-300" },
  baixa: { nome: "Baixa", ponto: "bg-white/40", topo: "bg-white/30" },
};

function MarcaPrioridade({ p }: { p: Prioridade }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-white/60">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", PRIORIDADE[p].ponto)} />
      {PRIORIDADE[p].nome}
    </span>
  );
}

export function Clientes({ clientes, prospeccao }: { clientes: Cliente[]; prospeccao: Prospecto[] }) {
  const colunas = (["alta", "media", "baixa"] as Prioridade[]).map((p) => ({ p, lista: clientes.filter((c) => c.prioridade === p) })).filter((x) => x.lista.length);
  return (
    <div className="space-y-10">
      <Secao id="noite-clientes-follow" icone={Users} titulo="Clientes: o que pede atenção" apoio="Separados pela urgência do próximo passo.">
        {colunas.length === 0 ? (
          <Vazio>Nenhum follow-up pendente.</Vazio>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {colunas.map(({ p, lista }) => (
              <div key={p} className="rounded-2xl bg-white/[0.02] p-2 ring-1 ring-inset ring-white/[0.05]">
                <p className="flex items-center gap-2 px-2 pb-2.5 pt-1.5 text-[13px] font-semibold text-white/75">
                  <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", PRIORIDADE[p].ponto)} />
                  Prioridade {PRIORIDADE[p].nome.toLowerCase()}
                  <span className="ml-auto rounded-full bg-white/[0.07] px-2 text-[12px] tabular-nums text-white/60">{lista.length}</span>
                </p>
                <ul className="space-y-2">
                  {lista.map((c) => (
                    <li key={c.nome} className={cn(CARTAO, "relative overflow-hidden p-4")}>
                      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-0.5", PRIORIDADE[p].topo)} />
                      <p className="font-semibold">{c.nome}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-white/60">{c.situacao}</p>
                      <p className="mt-3 flex gap-2 rounded-lg bg-emerald-400/[0.08] px-3 py-2 text-[13px] leading-relaxed text-white/85">
                        <MessageSquareText aria-hidden size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                        {c.proximaAcao}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao id="noite-prospeccao" icone={Compass} titulo="Prospecção sugerida" apoio="Sugestões dos agentes. Nada foi enviado a ninguém.">
        {prospeccao.length === 0 ? (
          <Vazio>Sem sugestões hoje.</Vazio>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {prospeccao.map((p) => {
              const fonte = linkSeguro(p.fonte);
              return (
                <li key={p.nome} className={cn(CARTAO, "flex flex-col p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{p.nome}</p>
                    <MarcaPrioridade p={p.prioridade} />
                  </div>
                  <p className="mt-1 text-[12.5px] text-white/50">
                    {p.segmento}
                    {p.local ? ` · ${p.local}` : ""}
                  </p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{p.porque}</p>
                  <p className="mt-3 flex gap-2 rounded-lg bg-amber-300/[0.08] px-3 py-2 text-[13px] leading-relaxed text-white/85">
                    <Megaphone aria-hidden size={15} className="mt-0.5 shrink-0 text-amber-200" />
                    {p.abordagem}
                  </p>
                  {fonte && (
                    <a href={fonte} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-[#B7C0FF] hover:text-white">
                      Ver fonte <ArrowUpRight aria-hidden size={13} />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>
    </div>
  );
}

/* ---------------------- Prévias da visão geral --------------------- */

function Previa({ titulo, icone: Icone, acao, ir, children }: { titulo: string; icone: typeof Sparkles; acao: string; ir: () => void; children: ReactNode }) {
  return (
    <div className={cn(CARTAO, "flex flex-col p-5")}>
      <p className={cn(ROTULO, "flex items-center gap-2")}>
        <Icone aria-hidden size={14} className={AZUL} /> {titulo}
      </p>
      <div className="mt-4 flex-1">{children}</div>
      <button type="button" onClick={ir} className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg text-[13px] font-semibold text-[#B7C0FF] hover:text-white">
        {acao} <ArrowRight aria-hidden size={14} />
      </button>
    </div>
  );
}

/** Uma amostra de notícias, conteúdo e clientes, com atalho para a aba de cada um. */
export function Previas({ r, ir }: { r: Relatorio; ir: (a: Aba) => void }) {
  const noticias = [...r.noticias].sort((a, b) => ORDEM_RELEVANCIA[a.relevancia ?? "baixa"] - ORDEM_RELEVANCIA[b.relevancia ?? "baixa"]).slice(0, 3);
  const ideia = r.conteudo[0];
  const urgentes = r.clientes.filter((c) => c.prioridade === "alta");
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Previa titulo="Notícias" icone={Newspaper} acao={r.noticias.length ? `Ver as ${r.noticias.length} notícias` : "Abrir notícias"} ir={() => ir("noticias")}>
        {noticias.length === 0 ? (
          <p className="text-[14px] text-white/50">Nenhuma notícia hoje.</p>
        ) : (
          <ul className="space-y-3">
            {noticias.map((n) => (
              <li key={n.titulo} className="flex gap-2.5">
                <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", CATEGORIA[grupoDe(n)].ponto)} />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium leading-snug">{n.titulo}</p>
                  <p className="mt-0.5 text-[12px] text-white/45">
                    {CATEGORIA[grupoDe(n)].nome}
                    {n.relevancia === "alta" && <span className="text-rose-300"> · agir esta semana</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Previa>
      <Previa titulo="Conteúdo" icone={Clapperboard} acao={r.conteudo.length ? `Ver as ${r.conteudo.length} ideias` : "Abrir conteúdo"} ir={() => ir("conteudo")}>
        {ideia ? (
          <div className="flex gap-4">
            <PreviaPeca c={ideia} />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold leading-snug">{ideia.gancho}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/50">{ideia.roteiro.length} passos de roteiro</p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-white/50">Sem ideias hoje.</p>
        )}
      </Previa>
      <Previa titulo="Clientes" icone={Users} acao="Ver clientes e prospecção" ir={() => ir("clientes")}>
        <ul className="flex gap-2">
          {(["alta", "media", "baixa"] as Prioridade[]).map((p) => (
            <li key={p} className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/55">
                <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", PRIORIDADE[p].ponto)} />
                {PRIORIDADE[p].nome}
              </p>
              <p className="mt-1 text-[1.35rem] font-semibold leading-none tabular-nums">{r.clientes.filter((c) => c.prioridade === p).length}</p>
            </li>
          ))}
        </ul>
        {urgentes[0] ? (
          <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
            <span className="font-semibold text-white">{urgentes[0].nome}:</span> {urgentes[0].proximaAcao}
          </p>
        ) : (
          <p className="mt-3 text-[13.5px] text-white/50">{r.prospeccao.length} sugestões de prospecção.</p>
        )}
      </Previa>
    </div>
  );
}

/* ------------------------------ Rodapé ------------------------------ */

const segundos = (ms: number) => (ms >= 60000 ? `${Math.round(ms / 60000)} min` : `${Math.round(ms / 1000)} s`);

export function Fontes({ r }: { r: Relatorio }) {
  const hora = new Date(r.geradoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });
  const agentes = [
    { nome: "Codex", a: r.agentes.codex, papel: "notícias e leitura técnica" },
    { nome: "Claude", a: r.agentes.claude, papel: "síntese do relatório" },
  ];
  return (
    <footer className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[12.5px] text-white/50 md:flex-row md:items-center md:justify-between">
      <p className="flex items-center gap-2">
        <FileText aria-hidden size={14} className="shrink-0" />
        Fontes: {r.fontes.commits} commits, {r.fontes.sessoesClaude + r.fontes.sessoesCodex} conversas com IA, {r.fontes.notas} notas, {r.fontes.noticias} notícias. Gerado às {hora}.
      </p>
      <ul className="flex flex-wrap gap-2">
        {agentes.map(({ nome, a, papel }) => (
          <li
            key={nome}
            title={a.erro ?? papel}
            className={cn("rounded-full px-3 py-1 font-medium", a.ok ? "bg-white/[0.06] text-white/70" : "bg-amber-300/15 text-amber-200")}
          >
            {nome} {a.ok ? `· ${segundos(a.duracaoMs)}` : "· não respondeu"}
          </li>
        ))}
      </ul>
    </footer>
  );
}
