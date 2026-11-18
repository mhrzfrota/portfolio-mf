import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarPlus, Check, MessageCircle, Plus, Sparkles, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETAPAS, type Estudio, type Peca } from "@/features/conteudo/estudio";
import { MODELOS, ideiasLivres, semanas, ultimasPublicadas, type ModeloOrganico, type Semana } from "@/features/conteudo/organicos";
import { formato } from "./pecas";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dia = (iso: string) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`;
const intervalo = (s: Semana) => `${dia(s.inicio)} a ${dia(s.fim)}`;

export const botaoPrimario =
  "cor-forte inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0C2AFE] px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(12,42,254,0.8)] transition-[transform,background-color] hover:bg-[#2440ff] active:scale-[0.98] disabled:opacity-50";
export const botaoSecundario =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-[var(--i-s1)] px-4 text-[14px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.04] active:scale-[0.98] disabled:opacity-50";

export type AcoesSemanas = {
  abrir: (id: string) => void;
  escolherIdeia: (pecaId: string, data: string) => void;
  novaIdeia: (data: string) => void;
  usarModelo: (m: ModeloOrganico, data: string) => void;
};

/** Em que ponto da esteira a peça está, em 5 passos com nome. */
function Esteira({ p }: { p: Peca }) {
  const i = ETAPAS.findIndex((x) => x.id === p.etapa);
  return (
    <div className="flex items-center gap-1.5" aria-label={`Etapa: ${ETAPAS[i]?.titulo}`}>
      {ETAPAS.map((x, j) => (
        <span key={x.id} className={cn("h-1.5 flex-1 rounded-full", j <= i ? "bg-[#0C2AFE]" : "bg-white/[0.1]")} title={x.titulo} />
      ))}
      <span className="ml-1.5 shrink-0 text-[12px] font-semibold text-white/70">{ETAPAS[i]?.titulo}</span>
    </div>
  );
}

function Caprichado({ s, estudio, acoes, bloqueado, destaque }: { s: Semana; estudio: Estudio; acoes: AcoesSemanas; bloqueado: boolean; destaque: boolean }) {
  const [escolhendo, setEscolhendo] = useState(false);
  const p = s.caprichado[0];
  return (
    <div className={cn("flex flex-col rounded-2xl border border-[var(--i-linha)] bg-[var(--i-s1)]", destaque ? "p-5" : "p-4")}>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#0C2AFE]">
        <Star size={13} /> Post caprichado
      </p>
      {p ? (
        <button type="button" onClick={() => acoes.abrir(p.id)} className="mt-2 flex flex-1 flex-col gap-3 rounded-xl text-left">
          <span className={cn("font-semibold leading-snug tracking-tight", destaque ? "text-[22px]" : "text-[16px]")}>{p.titulo}</span>
          {p.gancho && destaque && <span className="text-[14px] leading-relaxed text-white/60">“{p.gancho}”</span>}
          <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/55">
            {formato(p.formato) && <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-medium text-white/75">{formato(p.formato)!.nome}</span>}
            <span>{dia(p.data)}</span>
            {s.caprichado.length > 1 && <span>+{s.caprichado.length - 1} na semana</span>}
          </span>
          <span className="mt-auto"><Esteira p={p} /></span>
        </button>
      ) : (
        <div className="mt-2 flex flex-1 flex-col items-start gap-3">
          {destaque && <p className="text-[14px] leading-relaxed text-white/55">Nenhum post escolhido para esta semana.</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={bloqueado} onClick={() => setEscolhendo(true)} className={botaoPrimario}>
              <Sparkles size={16} /> Escolher ideia
            </button>
            <button type="button" disabled={bloqueado} onClick={() => acoes.novaIdeia(s.diaCaprichado)} className={botaoSecundario}>
              <Plus size={16} /> Nova
            </button>
          </div>
        </div>
      )}
      {escolhendo && (
        <Janela titulo="Ideia para o post da semana" subtitulo={intervalo(s)} fechar={() => setEscolhendo(false)}>
          <IdeiasLivres estudio={estudio} data={s.diaCaprichado} acoes={acoes} aoEscolher={() => setEscolhendo(false)} />
        </Janela>
      )}
    </div>
  );
}

function Organicos({ s, acoes, bloqueado, destaque }: { s: Semana; acoes: AcoesSemanas; bloqueado: boolean; destaque: boolean }) {
  const [escolhendo, setEscolhendo] = useState(false);
  return (
    <div className={cn("flex flex-col rounded-2xl border border-[var(--i-linha)] bg-[var(--i-s1)]", destaque ? "p-5" : "p-4")}>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#1B8A3C]">
        <MessageCircle size={13} /> Orgânicos · comenta e recebe
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {s.organicos.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => acoes.abrir(p.id)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]">
              {p.etapa === "publicado" ? <Check size={15} className="shrink-0 text-[#1B8A3C]" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-[#30D158]" aria-hidden />}
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{p.titulo}</span>
              <span className="shrink-0 text-[12px] text-white/45">{dia(p.data)}</span>
            </button>
          </li>
        ))}
      </ul>
      {!s.organicos.length && destaque && <p className="text-[14px] leading-relaxed text-white/55">Vídeo curto que pede um comentário; o Zernio responde no direct.</p>}
      <button type="button" disabled={bloqueado} onClick={() => setEscolhendo(true)} className={cn(botaoSecundario, s.organicos.length || destaque ? "mt-3 self-start" : "mt-2 self-start")}>
        <Plus size={16} /> Orgânico
      </button>
      {escolhendo && <EscolherModelo data={s.diaOrganico} acoes={acoes} fechar={() => setEscolhendo(false)} />}
    </div>
  );
}

/** A visão principal: esta semana em destaque e as próximas embaixo. */
export default function Semanas({ estudio, acoes, bloqueado }: { estudio: Estudio; acoes: AcoesSemanas; bloqueado: boolean }) {
  const lista = useMemo(() => semanas(estudio, 6), [estudio]);
  const [atual, ...proximas] = lista;
  const feitas = useMemo(() => ultimasPublicadas(estudio, 4), [estudio]);
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="esta-semana">
        <h2 id="esta-semana" className="mb-3 flex items-baseline gap-2 text-[18px] font-semibold tracking-tight">
          Esta semana <span className="text-[13px] font-normal text-white/45">{intervalo(atual)}</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
          <Caprichado s={atual} estudio={estudio} acoes={acoes} bloqueado={bloqueado} destaque />
          <Organicos s={atual} acoes={acoes} bloqueado={bloqueado} destaque />
        </div>
      </section>

      <section aria-labelledby="proximas">
        <h2 id="proximas" className="mb-3 text-[18px] font-semibold tracking-tight">Próximas semanas</h2>
        <ol className="flex flex-col gap-3">
          {proximas.map((s) => (
            <li key={s.inicio} className="grid gap-3 rounded-[20px] bg-white/[0.035] p-3 md:grid-cols-[120px_1.5fr_1fr] md:items-stretch">
              <p className="px-1 pt-1 text-[14px] font-semibold md:pt-4">
                {intervalo(s)}
              </p>
              <Caprichado s={s} estudio={estudio} acoes={acoes} bloqueado={bloqueado} destaque={false} />
              <Organicos s={s} acoes={acoes} bloqueado={bloqueado} destaque={false} />
            </li>
          ))}
        </ol>
      </section>

      {feitas.length > 0 && (
        <section aria-labelledby="feitas">
          <h2 id="feitas" className="mb-3 text-[18px] font-semibold tracking-tight">Já publicados</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {feitas.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => acoes.abrir(p.id)} className="flex w-full flex-col gap-1 rounded-2xl border border-[var(--i-linha)] bg-[var(--i-s1)] p-4 text-left transition-colors hover:border-white/25">
                  <span className="text-[14px] font-semibold leading-snug">{p.titulo}</span>
                  <span className="text-[12.5px] text-white/50">
                    {dia(p.data || p.publicadoEm)}
                    {p.metricas.alcance !== null && ` · ${p.metricas.alcance} contas`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Janela({ titulo, subtitulo, fechar, children }: { titulo: string; subtitulo?: string; fechar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [fechar]);
  return createPortal(
    <div className="interno fixed inset-0 z-50 flex items-end justify-center bg-[rgba(20,22,27,0.35)] p-3 backdrop-blur-sm sm:items-center" onClick={fechar}>
      <div role="dialog" aria-modal aria-label={titulo} onClick={(e) => e.stopPropagation()} className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-[22px] bg-[var(--i-s1)] text-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-[var(--i-linha)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold tracking-tight">{titulo}</p>
            {subtitulo && <p className="mt-0.5 text-[13px] text-white/50">{subtitulo}</p>}
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Lista simples: título e gancho, um toque coloca na semana. */
export function IdeiasLivres({ data, acoes, aoEscolher, estudio }: { data: string; acoes: AcoesSemanas; aoEscolher?: () => void; estudio: Estudio }) {
  const ideias = ideiasLivres(estudio);
  if (!ideias.length) return <p className="p-3 text-[14px] text-white/55">Sem ideia livre. Crie uma nova.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {ideias.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => {
              acoes.escolherIdeia(p.id, data);
              aoEscolher?.();
            }}
            className="group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
          >
            <span className="cor-forte mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0C2AFE] text-white opacity-90 transition-transform group-hover:scale-105">
              <CalendarPlus size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold leading-snug">{p.titulo}</span>
              {p.gancho && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-relaxed text-white/55">{p.gancho}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function EscolherModelo({ data, acoes, fechar }: { data: string; acoes: AcoesSemanas; fechar: () => void }) {
  return (
    <Janela titulo="Orgânico para a semana" subtitulo="Escolha um modelo; o roteiro e a palavra do Zernio já vêm prontos." fechar={fechar}>
      <ModelosOrganicos data={data} acoes={acoes} aoEscolher={fechar} />
    </Janela>
  );
}

export function ModelosOrganicos({ data, acoes, aoEscolher, grade = false }: { data: string; acoes: AcoesSemanas; aoEscolher?: () => void; grade?: boolean }) {
  const [publico, setPublico] = useState<"todos" | "dev" | "negocio">("todos");
  const lista = MODELOS.filter((m) => publico === "todos" || m.publico === publico);
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Para quem" className="flex gap-1.5">
        {([["todos", "Todos"], ["dev", "Para quem cria"], ["negocio", "Para negócio local"]] as const).map(([id, nome]) => (
          <button key={id} type="button" aria-pressed={publico === id} onClick={() => setPublico(id)} className={cn("h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors", publico === id ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]")}>
            {nome}
          </button>
        ))}
      </div>
      <ul className={cn("grid gap-2", grade && "sm:grid-cols-2 xl:grid-cols-3")}>
        {lista.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--i-linha)] bg-[var(--i-s1)] p-4">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-[14.5px] font-semibold leading-snug">{m.titulo}</p>
              <span className="shrink-0 rounded-lg bg-[#30D158]/15 px-2 py-1 font-mono text-[11.5px] font-bold text-[#1B8A3C]">{m.palavra}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-white/60">{m.mostra}</p>
            <p className="text-[12.5px] leading-relaxed text-white/45">No direct: {m.entrega}</p>
            <button
              type="button"
              onClick={() => {
                acoes.usarModelo(m, data);
                aoEscolher?.();
              }}
              className={cn(botaoSecundario, "mt-auto h-9 self-start px-3.5 text-[13px]")}
            >
              <Plus size={15} /> Usar {grade ? "nesta semana" : ""}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
