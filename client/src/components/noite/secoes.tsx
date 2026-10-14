import type { ReactNode } from "react";
import {
  AlertTriangle, ArrowUpRight, BookOpen, Bot, CalendarClock, CheckCircle2, Clapperboard, Code2, Compass, FileText, FolderGit2,
  GitCommitHorizontal, Image as ImageIcon, LayoutGrid, Lightbulb, Megaphone, MessageSquareText, NotebookPen, Repeat2,
  Rocket, Smartphone, Sparkles, Sunrise, Target, TrendingUp, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { linkSeguro } from "@/features/noite/nuvem";
import type {
  Cliente, Dev, FormatoConteudo, IdeiaConteudo, Insight, Metricas, Momento, Noticia, PorProjeto, Prioridade, Prioridades,
  ProjetoDoDia, ProjetoNovo, Prospecto, Relatorio, StatusProjeto, TipoInsight, TipoMomento,
} from "@shared/noite/relatorio";

/* Azul da marca clareado para ícones e textos pequenos sobre o fundo escuro (o #0C2AFE puro fica sem contraste). */
const AZUL = "text-[#8C99FF]";
const CARTAO = "rounded-2xl bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";

export function Secao({ id, icone: Icone, titulo, apoio, children, className }: { id: string; icone: typeof Sparkles; titulo: string; apoio?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("mt-12", className)}>
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

/* ------------------------------ Topo ------------------------------ */

export function Manchete({ r }: { r: Relatorio }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_120%_at_0%_0%,rgba(12,42,254,0.38),rgba(12,42,254,0.06)_55%,transparent)] p-6 ring-1 ring-inset ring-white/10 sm:p-8">
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <Sparkles aria-hidden size={14} className={AZUL} /> O dia em uma frase
        </p>
        <p className="mt-3 text-[1.6rem] font-semibold leading-snug tracking-tight sm:text-[2rem]">{r.manchete}</p>
        {r.resumo.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {r.resumo.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-white/85">
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
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
        <Sunrise aria-hidden size={14} className="text-amber-300" /> Amanhã, nesta ordem
      </p>
      {itens.length === 0 ? (
        <p className="mt-4 text-[14px] text-white/55">Sem prioridades sugeridas hoje.</p>
      ) : (
        <ol className="mt-4 space-y-4">
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

/* ---------------------------- Números ----------------------------- */

const formatar = (n: number) => n.toLocaleString("pt-BR");

export function Numeros({ m }: { m: Metricas }) {
  const horario = m.primeiraAtividade && m.ultimaAtividade ? `${m.primeiraAtividade} às ${m.ultimaAtividade}` : "sem atividade";
  const tiles: { rotulo: string; valor: string; dica: string; icone: typeof Sparkles; alerta?: boolean }[] = [
    { rotulo: "Commits", valor: formatar(m.commits), dica: `em ${m.repositorios} ${m.repositorios === 1 ? "projeto" : "projetos"}`, icone: GitCommitHorizontal },
    { rotulo: "Linhas", valor: `+${formatar(m.linhasMais)}`, dica: `−${formatar(m.linhasMenos)} em ${formatar(m.arquivosAlterados)} arquivos`, icone: Code2 },
    { rotulo: "Conversas com IA", valor: formatar(m.sessoesClaude + m.sessoesCodex), dica: `${m.sessoesClaude} Claude, ${m.sessoesCodex} Codex, ${m.pedidos} pedidos`, icone: Bot },
    { rotulo: "Notas no vault", valor: formatar(m.notasDoVault), dica: "criadas ou editadas hoje", icone: NotebookPen },
    { rotulo: "Horário ativo", valor: m.primeiraAtividade ?? "–", dica: horario, icone: CalendarClock },
    {
      rotulo: "Sem commit",
      valor: formatar(m.naoCommitado),
      dica: m.naoCommitado ? "projetos com mudança pendente" : "tudo guardado no git",
      icone: m.naoCommitado ? AlertTriangle : CheckCircle2,
      alerta: m.naoCommitado > 0,
    },
  ];
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map(({ rotulo, valor, dica, icone: Icone, alerta }) => (
        <li key={rotulo} className={cn(CARTAO, "p-4", alerta && "ring-amber-300/40")}>
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-white/55">
            <Icone aria-hidden size={14} className={alerta ? "text-amber-300" : AZUL} />
            {rotulo}
          </p>
          <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums">{valor}</p>
          <p className="mt-2 text-[12px] leading-snug text-white/50">{dica}</p>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------- Como foi o dia --------------------------- */

const COR_MOMENTO: Record<TipoMomento, string> = {
  commit: "bg-[#5B6CFF]",
  sessao: "bg-violet-400",
  marco: "bg-amber-300",
  vault: "bg-emerald-400",
  deploy: "bg-rose-400",
};
const NOME_MOMENTO: Record<TipoMomento, string> = { commit: "Commit", sessao: "Conversa com IA", marco: "Marco", vault: "Vault", deploy: "Deploy" };

export function LinhaDoTempo({ itens }: { itens: Momento[] }) {
  if (!itens.length) return <Vazio>Nenhum momento registrado hoje.</Vazio>;
  return (
    <div className={cn(CARTAO, "p-5 sm:p-6")}>
      <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[3.6rem] before:top-2 before:w-px before:bg-white/10">
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
  if (!lista.length) return <Vazio>Nenhum commit hoje.</Vazio>;
  const max = Math.max(...lista.map((p) => p.commits));
  return (
    <div className={cn(CARTAO, "p-5 sm:p-6")}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Commits por projeto</p>
      <ul className="mt-4 space-y-3.5">
        {lista.map((p) => (
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
        ))}
      </ul>
    </div>
  );
}

const STATUS: Record<StatusProjeto, { nome: string; classe: string }> = {
  avancou: { nome: "Avançou", classe: "bg-[#0C2AFE]/25 text-[#B7C0FF]" },
  entregue: { nome: "Entregue", classe: "bg-emerald-400/15 text-emerald-300" },
  travado: { nome: "Travado", classe: "bg-amber-300/15 text-amber-200" },
  novo: { nome: "Novo", classe: "bg-violet-400/15 text-violet-200" },
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
            <li key={p.nome} className={cn(CARTAO, "flex flex-col p-5")}>
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold">
                  <FolderGit2 aria-hidden size={16} className={AZUL} />
                  {p.nome}
                </p>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold", STATUS[p.status].classe)}>{STATUS[p.status].nome}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-white/80">{p.avancou}</p>
              <p className="mt-auto pt-4 text-[13px] text-white/55">
                <span className="font-semibold text-white/75">Próximo passo:</span> {p.proximo}
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
      <div className={cn(CARTAO, "p-6")}>
        <p className="text-[1.15rem] font-medium leading-relaxed">“{d.momento}”</p>
        {d.praticou.length > 0 && (
          <>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">O que você praticou hoje</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {d.praticou.map((p) => (
                <li key={p} className="rounded-full bg-white/[0.07] px-3 py-1 text-[13px] text-white/85">{p}</li>
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
        <div className={cn(CARTAO, "p-5 sm:col-span-2 lg:col-span-1")}>
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

const INSIGHT: Record<TipoInsight, { nome: string; icone: typeof Sparkles; cor: string }> = {
  oportunidade: { nome: "Oportunidade", icone: Lightbulb, cor: "text-emerald-300 bg-emerald-400/10" },
  risco: { nome: "Risco", icone: AlertTriangle, cor: "text-amber-200 bg-amber-300/10" },
  padrao: { nome: "Padrão", icone: Repeat2, cor: "text-[#B7C0FF] bg-[#0C2AFE]/20" },
};

export function Insights({ itens }: { itens: Insight[] }) {
  if (!itens.length) return <Vazio>Sem insights hoje.</Vazio>;
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {itens.map((i) => {
        const { nome, icone: Icone, cor } = INSIGHT[i.tipo];
        return (
          <li key={i.titulo} className={cn(CARTAO, "p-5")}>
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

export function Noticias({ itens }: { itens: Noticia[] }) {
  if (!itens.length) return <Vazio>Nenhuma notícia hoje.</Vazio>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {itens.map((n) => {
        const url = linkSeguro(n.url);
        return (
          <li key={n.titulo} className={cn(CARTAO, "flex flex-col p-5")}>
            <p className="flex flex-wrap items-center gap-2 text-[12px] text-white/50">
              <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 font-semibold text-white/75">{n.tema}</span>
              {n.fonte} · {dataCurta(n.data)}
            </p>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="group mt-3 inline-flex items-start gap-1 font-semibold leading-snug hover:text-[#B7C0FF]">
                {n.titulo}
                <ArrowUpRight aria-hidden size={15} className="mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
              </a>
            ) : (
              <p className="mt-3 font-semibold leading-snug">{n.titulo}</p>
            )}
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">{n.resumo}</p>
            <p className="mt-auto pt-4">
              <span className="block rounded-xl bg-[#0C2AFE]/15 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#D4D9FF]">
                <span className="font-semibold">Por que importa: </span>
                {n.porqueImporta}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------ Conteúdo --------------------------- */

const FORMATO: Record<FormatoConteudo, { nome: string; icone: typeof Sparkles }> = {
  reel: { nome: "Reel", icone: Clapperboard },
  carrossel: { nome: "Carrossel", icone: LayoutGrid },
  post: { nome: "Post", icone: ImageIcon },
  story: { nome: "Story", icone: Smartphone },
};

export function Conteudo({ itens }: { itens: IdeiaConteudo[] }) {
  if (!itens.length) return <Vazio>Sem ideias de conteúdo hoje.</Vazio>;
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {itens.map((c) => {
        const { nome, icone: Icone } = FORMATO[c.formato];
        return (
          <li key={c.gancho} className={cn(CARTAO, "flex flex-col p-5")}>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-rose-400/15 px-2.5 py-1 text-[12px] font-semibold text-rose-200">
              <Icone aria-hidden size={13} /> {nome}
            </span>
            <p className="mt-3 text-[15.5px] font-semibold leading-snug">{c.gancho}</p>
            <ol className="mt-3 space-y-2">
              {c.roteiro.map((passo, i) => (
                <li key={passo} className="flex gap-2.5 text-[13.5px] leading-relaxed text-white/75">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[11px] font-semibold tabular-nums">{i + 1}</span>
                  {passo}
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-4 text-[12.5px] text-white/50">
              <span className="font-semibold text-white/65">Base:</span> {c.base}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------- Clientes e prospecção --------------------- */

const COR_PRIORIDADE: Record<Prioridade, string> = { alta: "bg-rose-400", media: "bg-amber-300", baixa: "bg-white/40" };
const NOME_PRIORIDADE: Record<Prioridade, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

function MarcaPrioridade({ p }: { p: Prioridade }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-white/60">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", COR_PRIORIDADE[p])} />
      {NOME_PRIORIDADE[p]}
    </span>
  );
}

export function Clientes({ clientes, prospeccao }: { clientes: Cliente[]; prospeccao: Prospecto[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className={cn(CARTAO, "p-5 sm:p-6")}>
        <p className="flex items-center gap-2 font-semibold"><Users aria-hidden size={16} className={AZUL} /> Clientes: o que pede atenção</p>
        {clientes.length === 0 ? (
          <p className="mt-3 text-[14px] text-white/55">Nenhum follow-up pendente.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.07]">
            {clientes.map((c) => (
              <li key={c.nome} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{c.nome}</p>
                  <MarcaPrioridade p={c.prioridade} />
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{c.situacao}</p>
                <p className="mt-2 flex gap-2 text-[13.5px] leading-relaxed text-white/85">
                  <MessageSquareText aria-hidden size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                  {c.proximaAcao}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={cn(CARTAO, "p-5 sm:p-6")}>
        <p className="flex items-center gap-2 font-semibold"><Compass aria-hidden size={16} className={AZUL} /> Prospecção sugerida</p>
        <p className="mt-1 text-[12.5px] text-white/45">Sugestões dos agentes. Nada foi enviado a ninguém.</p>
        {prospeccao.length === 0 ? (
          <p className="mt-3 text-[14px] text-white/55">Sem sugestões hoje.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.07]">
            {prospeccao.map((p) => {
              const fonte = linkSeguro(p.fonte);
              return (
                <li key={p.nome} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{p.nome}</p>
                    <MarcaPrioridade p={p.prioridade} />
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-white/50">
                    {p.segmento}
                    {p.local ? ` · ${p.local}` : ""}
                  </p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{p.porque}</p>
                  <p className="mt-2 flex gap-2 text-[13.5px] leading-relaxed text-white/85">
                    <Megaphone aria-hidden size={15} className="mt-0.5 shrink-0 text-amber-200" />
                    {p.abordagem}
                  </p>
                  {fonte && (
                    <a href={fonte} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#B7C0FF] hover:text-white">
                      Ver fonte <ArrowUpRight aria-hidden size={13} />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
        <FileText aria-hidden size={14} />
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
