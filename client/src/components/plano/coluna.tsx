import { useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cartao, ColunaId } from "@/features/plano/quadro";

/** Cor de cada coluna, para bater o olho e saber onde está. */
const COR_COLUNA: Record<ColunaId, string> = {
  ideias: "#FFD60A",
  referencias: "#BF5AF2",
  fazer: "#0A84FF",
  agenda: "#FF9F0A",
  feito: "#30D158",
};
import { CartaoArrastavel } from "./cartao";

export default function Coluna({
  id,
  titulo,
  descricao,
  cartoes,
  abrir,
  criar,
  arrasteDesligado,
  bloqueado,
}: {
  id: ColunaId;
  titulo: string;
  descricao: string;
  cartoes: Cartao[];
  abrir: (id: string) => void;
  criar: (coluna: ColunaId, titulo: string) => boolean;
  arrasteDesligado: boolean;
  bloqueado: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `coluna:${id}`, data: { coluna: id } });
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
        "flex max-h-[calc(100dvh-12rem)] w-[284px] shrink-0 snap-start scroll-ml-3 flex-col rounded-2xl border border-white/[0.07] bg-[#121318] transition-colors sm:w-[300px]",
        isOver && "border-[#0A84FF]/60 bg-[#141823]",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3.5 pb-2 pt-3" title={descricao}>
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ background: COR_COLUNA[id] }} aria-hidden />
          {titulo}
          <span className="text-[12.5px] font-normal text-white/40">{cartoes.length}</span>
        </h2>
        {!bloqueado && (
          <button type="button" onClick={() => setCompondo(true)} aria-label={`Adicionar cartão em ${titulo}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white">
            <Plus size={18} />
          </button>
        )}
      </header>

      <SortableContext id={id} items={cartoes.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-[48px] flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
          {cartoes.map((c) => (
            <CartaoArrastavel key={c.id} c={c} abrir={() => abrir(c.id)} desabilitado={arrasteDesligado} />
          ))}
        </ul>
      </SortableContext>

      {!bloqueado &&
        (compondo ? (
          <form onSubmit={enviar} className="px-2 pb-2">
            <label htmlFor={`novo-${id}`} className="sr-only">
              Título do novo cartão
            </label>
            <textarea
              id={`novo-${id}`}
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
              placeholder="Título do cartão"
              className="block w-full resize-none rounded-xl border border-[#0A84FF]/60 bg-[#1C1D23] p-3 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="submit" disabled={!texto.trim()} className="h-8 rounded-lg bg-[#0A84FF] px-3 text-[13px] font-semibold text-white disabled:opacity-40">
                Adicionar
              </button>
              <button type="button" onClick={() => setCompondo(false)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setCompondo(true)} className="m-2 mt-0 flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-white/45 hover:bg-white/[0.06] hover:text-white">
            <Plus size={16} /> Adicionar cartão
          </button>
        ))}
    </section>
  );
}
