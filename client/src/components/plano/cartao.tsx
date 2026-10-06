import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, CalendarDays, CheckSquare, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { atrasado, progresso, type Cartao } from "@/features/plano/quadro";
import { hojeISO } from "@/features/plano/store";
import { Etiqueta } from "./etiqueta";

const amanha = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return hojeISO(d);
};

/** "Hoje", "Amanhã" ou dd/mm: o que importa é bater o olho. */
const dataLegivel = (iso: string) => {
  if (iso === hojeISO()) return "Hoje";
  if (iso === amanha()) return "Amanhã";
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
        "rounded-xl border border-white/[0.06] bg-[#1C1D23] px-3 py-2.5 text-left text-white shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-colors",
        arrastando ? "rotate-[2deg] border-[#0A84FF]/50 shadow-2xl" : "group-hover:border-white/[0.16] group-hover:bg-[#22232A]",
      )}
    >
      {c.etiquetas.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {c.etiquetas.map((e) => (
            <Etiqueta key={e} id={e} compacta />
          ))}
        </div>
      )}
      <p className={cn("text-[14px] leading-snug [overflow-wrap:anywhere]", feito && "text-white/45 line-through decoration-white/25")}>{c.titulo}</p>
      {c.projeto && <p className="mt-1 truncate text-[12px] text-white/40">{c.projeto}</p>}
      {(c.data || c.descricao || p.total > 0 || c.link) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-white/50">
          {c.data && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                feito ? "bg-[#30D158]/15 text-[#30D158]" : vencido ? "bg-[#FF453A]/15 text-[#FF6961]" : c.data === hojeISO() ? "bg-[#FF9F0A]/15 text-[#FFB340]" : "bg-white/[0.06] text-white/65",
              )}
            >
              <CalendarDays size={12} aria-hidden />
              {vencido ? `Atrasado · ${dataLegivel(c.data)}` : dataLegivel(c.data)}
              {c.hora && ` ${c.hora}`}
            </span>
          )}
          {c.descricao && <AlignLeft size={13} aria-label="Tem descrição" />}
          {c.link && <Link2 size={13} aria-label="Tem link" />}
          {p.total > 0 && (
            <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5", p.feitos === p.total ? "bg-[#30D158]/15 text-[#30D158]" : "")}>
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
        className="block w-full touch-manipulation rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
      >
        <FaceCartao c={c} />
      </button>
    </li>
  );
}
