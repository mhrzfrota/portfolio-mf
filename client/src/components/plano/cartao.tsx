import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, CalendarDays, CheckSquare, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { atrasado, progresso, type Cartao } from "@/features/plano/quadro";
import { Etiqueta } from "./etiqueta";

const dataCurta = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/** Conteúdo visual do card, usado na coluna e na sombra que acompanha o arraste. */
export function FaceCartao({ c, arrastando = false }: { c: Cartao; arrastando?: boolean }) {
  const p = progresso(c);
  const vencido = atrasado(c);
  const feito = c.coluna === "feito";
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-[#10131A] p-3 text-left text-white shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors",
        arrastando ? "rotate-2 border-white/25 shadow-2xl" : "group-hover:border-white/20 group-hover:bg-[#151924]",
      )}
    >
      {c.etiquetas.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {c.etiquetas.map((e) => (
            <Etiqueta key={e} id={e} compacta />
          ))}
        </div>
      )}
      <p className={cn("text-[14px] leading-snug [overflow-wrap:anywhere]", feito && "text-white/55 line-through decoration-white/30")}>{c.titulo}</p>
      {c.projeto && <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">{c.projeto}</p>}
      {(c.data || c.descricao || p.total > 0 || c.link) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-white/60">
          {c.data && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
                feito ? "bg-emerald-500/20 text-emerald-300" : vencido ? "bg-red-500/25 text-red-200" : "bg-white/[0.06]",
              )}
            >
              <CalendarDays size={12} aria-hidden />
              {dataCurta(c.data)}
              {c.hora && ` ${c.hora}`}
            </span>
          )}
          {c.descricao && <AlignLeft size={13} aria-label="Tem descrição" />}
          {c.link && <Link2 size={13} aria-label="Tem link" />}
          {p.total > 0 && (
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5", p.feitos === p.total ? "bg-emerald-500/20 text-emerald-300" : "")}>
              <CheckSquare size={12} aria-hidden />
              {p.feitos}/{p.total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function CartaoArrastavel({ c, abrir, desabilitado }: { c: Cartao; abrir: () => void; desabilitado: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id, data: { coluna: c.coluna }, disabled: desabilitado });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group list-none", isDragging && "opacity-30")}
    >
      <button
        type="button"
        onClick={abrir}
        {...attributes}
        {...listeners}
        aria-roledescription="cartão arrastável"
        className="block w-full touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <FaceCartao c={c} />
      </button>
    </li>
  );
}
