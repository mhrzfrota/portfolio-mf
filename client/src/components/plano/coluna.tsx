import { useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cartao, ColunaId } from "@/features/plano/quadro";
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
        "flex max-h-[calc(100dvh-15rem)] w-[280px] shrink-0 flex-col rounded-2xl bg-black/35 backdrop-blur-sm transition-colors sm:w-[300px]",
        isOver && "bg-black/50 ring-2 ring-white/30",
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-2 px-3 pb-2 pt-3">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            {titulo}
            <span className="rounded-full bg-white/10 px-2 text-[12px] font-medium text-white/70">{cartoes.length}</span>
          </h2>
          <p className="mt-0.5 text-[12px] text-white/50">{descricao}</p>
        </div>
        {!bloqueado && (
          <button type="button" onClick={() => setCompondo(true)} aria-label={`Adicionar cartão em ${titulo}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
            <Plus size={18} />
          </button>
        )}
      </header>

      <SortableContext id={id} items={cartoes.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-[48px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
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
              className="block w-full resize-none rounded-xl border border-white/10 bg-[#10131A] p-3 text-[14px] text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="submit" disabled={!texto.trim()} className="h-9 rounded-lg bg-white px-3 text-[13px] font-semibold text-black disabled:opacity-40">
                Adicionar
              </button>
              <button type="button" onClick={() => setCompondo(false)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setCompondo(true)} className="m-2 mt-0 flex h-10 items-center gap-2 rounded-xl px-3 text-[13px] text-white/60 hover:bg-white/10 hover:text-white">
            <Plus size={16} /> Adicionar cartão
          </button>
        ))}
    </section>
  );
}
