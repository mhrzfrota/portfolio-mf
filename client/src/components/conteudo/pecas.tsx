import { useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckSquare, Eye, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hojeISO } from "@/features/plano/store";
import { ANGULOS, FORMATOS, atrasada, type EtapaId, type Peca, type Tematica } from "@/features/conteudo/estudio";

export const COR_ETAPA: Record<EtapaId, string> = {
  ideias: "#FFD60A",
  roteiro: "#BF5AF2",
  producao: "#0A84FF",
  pronto: "#FF9F0A",
  publicado: "#30D158",
};

export const angulo = (id: string) => ANGULOS.find((a) => a.id === id);
export const formato = (id: string) => FORMATOS.find((f) => f.id === id);

const amanha = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return hojeISO(d);
};

export const dataCurta = (iso: string) => {
  if (iso === hojeISO()) return "Hoje";
  if (iso === amanha()) return "Amanhã";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

const mil = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")} mil` : String(n));

/** Selo do ângulo: a cor identifica, o nome sempre aparece junto. */
export function SeloAngulo({ id, compacto = false }: { id: string; compacto?: boolean }) {
  const a = angulo(id);
  if (!a) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] font-medium text-white/80", compacto ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]")}>
      <span className="h-2 w-2 rounded-full" style={{ background: a.cor }} aria-hidden />
      {a.nome}
    </span>
  );
}

/** Face da peça: o que importa para decidir sem abrir. */
export function FacePeca({ p, tematica, arrastando = false }: { p: Peca; tematica?: Tematica; arrastando?: boolean }) {
  const f = formato(p.formato);
  const vencida = atrasada(p);
  const feitos = p.checklist.filter((i) => i.feito).length;
  const publicada = p.etapa === "publicado";
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-[#1C1D23] px-3 py-2.5 text-left text-white shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-colors",
        arrastando ? "rotate-[2deg] border-[#0A84FF]/50 shadow-2xl" : "group-hover:border-white/[0.16] group-hover:bg-[#22232A]",
      )}
    >
      {(p.angulo || f || p.profundidade) && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {p.angulo && <SeloAngulo id={p.angulo} compacto />}
          {f && <span className="rounded-full px-1.5 py-0.5 text-[11.5px] text-white/50">{f.nome}</span>}
          {p.profundidade && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]", p.profundidade === "profundo" ? "text-[#64D2FF]" : "text-white/40")}>
              {p.profundidade}
            </span>
          )}
        </div>
      )}
      <p className="text-[14px] leading-snug [overflow-wrap:anywhere]">{p.titulo}</p>
      {p.gancho && <p className="mt-1 line-clamp-2 text-[12.5px] italic leading-snug text-white/45">“{p.gancho}”</p>}
      {(tematica || p.data || p.checklist.length > 0 || (publicada && p.metricas.visualizacoes != null)) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-white/50">
          {tematica && (
            <span className="inline-flex max-w-full items-center gap-1 truncate">
              <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: tematica.cor }} aria-hidden />
              <span className="truncate">{tematica.nome}</span>
            </span>
          )}
          {p.data && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                publicada ? "bg-[#30D158]/15 text-[#30D158]" : vencida ? "bg-[#FF453A]/15 text-[#FF6961]" : p.data === hojeISO() ? "bg-[#FF9F0A]/15 text-[#FFB340]" : "bg-white/[0.06] text-white/65",
              )}
            >
              <CalendarDays size={12} aria-hidden />
              {vencida ? `Atrasada · ${dataCurta(p.data)}` : dataCurta(p.data)}
            </span>
          )}
          {publicada && p.metricas.visualizacoes != null && (
            <span className="inline-flex items-center gap-1" title="Visualizações">
              <Eye size={12} aria-hidden /> {mil(p.metricas.visualizacoes)}
            </span>
          )}
          {p.checklist.length > 0 && (
            <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5", feitos === p.checklist.length && "bg-[#30D158]/15 text-[#30D158]")}>
              <CheckSquare size={12} aria-hidden />
              {feitos}/{p.checklist.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PecaArrastavel({ p, tematica, abrir, desabilitado }: { p: Peca; tematica?: Tematica; abrir: () => void; desabilitado: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id, data: { etapa: p.etapa }, disabled: desabilitado });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group list-none", isDragging && "opacity-30")}>
      <button
        type="button"
        onClick={abrir}
        {...attributes}
        {...listeners}
        aria-roledescription="peça arrastável"
        className="block w-full touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
      >
        <FacePeca p={p} tematica={tematica} />
      </button>
    </li>
  );
}

export function ColunaEtapa({
  id, titulo, descricao, pecas, tematicas, abrir, criar, arrasteDesligado, bloqueado,
}: {
  id: EtapaId; titulo: string; descricao: string; pecas: Peca[]; tematicas: Map<string, Tematica>;
  abrir: (id: string) => void; criar: (etapa: EtapaId, titulo: string) => boolean; arrasteDesligado: boolean; bloqueado: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `etapa:${id}`, data: { etapa: id } });
  const [compondo, setCompondo] = useState(false);
  const [texto, setTexto] = useState("");

  function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (!texto.trim()) return;
    if (criar(id, texto)) setTexto("");
  }

  return (
    <section
      aria-label={titulo}
      className={cn(
        "flex max-h-[calc(100dvh-14rem)] w-[284px] shrink-0 snap-start scroll-ml-3 flex-col rounded-2xl border border-white/[0.07] bg-[#121318] transition-colors sm:w-[300px]",
        isOver && "border-[#0A84FF]/60 bg-[#141823]",
      )}
    >
      <header className="shrink-0 px-3.5 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ background: COR_ETAPA[id] }} aria-hidden />
            {titulo}
            <span className="text-[12.5px] font-normal text-white/40">{pecas.length}</span>
          </h2>
          {!bloqueado && (
            <button type="button" onClick={() => setCompondo(true)} aria-label={`Adicionar peça em ${titulo}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white">
              <Plus size={18} />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-white/35">{descricao}</p>
      </header>

      <SortableContext id={id} items={pecas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-[48px] flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
          {pecas.map((p) => (
            <PecaArrastavel key={p.id} p={p} tematica={tematicas.get(p.tematica)} abrir={() => abrir(p.id)} desabilitado={arrasteDesligado} />
          ))}
        </ul>
      </SortableContext>

      {!bloqueado &&
        (compondo ? (
          <form onSubmit={enviar} className="px-2 pb-2">
            <label htmlFor={`nova-${id}`} className="sr-only">Título da nova peça</label>
            <textarea
              id={`nova-${id}`}
              autoFocus
              rows={2}
              maxLength={140}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
                if (e.key === "Escape") setCompondo(false);
              }}
              placeholder="Sobre o que é a peça?"
              className="block w-full resize-none rounded-xl border border-[#0A84FF]/60 bg-[#1C1D23] p-3 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="submit" disabled={!texto.trim()} className="h-8 rounded-lg bg-[#0A84FF] px-3 text-[13px] font-semibold text-white disabled:opacity-40">Adicionar</button>
              <button type="button" onClick={() => setCompondo(false)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setCompondo(true)} className="m-2 mt-0 flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-white/45 hover:bg-white/[0.06] hover:text-white">
            <Plus size={16} /> Adicionar peça
          </button>
        ))}
    </section>
  );
}
