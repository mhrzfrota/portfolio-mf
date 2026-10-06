import { useLayoutEffect, useRef, useState, type TouchEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/features/calendario/agenda";

export const VERMELHO_HOJE = "#FF453A";
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const ALTURA_LINHA = 20; // px por evento na célula
const TOPO_CELULA = 30; // número do dia

const ehTarefa = (i: Item) => i.origem === "plano" || i.tipo === "tarefa";

/** Um evento dentro da célula, como no Calendário do Mac/iPad. */
function Marca({ i }: { i: Item }) {
  const diaTodo = !i.inicio;
  if (ehTarefa(i)) {
    // Tarefa: círculo de lembrete na cor, preenchido quando feita
    return (
      <span className={cn("flex h-[18px] min-w-0 items-center gap-1.5 px-1 text-[11.5px] leading-none", i.feito && "opacity-45")}>
        <span className="grid h-[11px] w-[11px] shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: i.cor, background: i.feito ? i.cor : "transparent" }}>
          {i.feito && <Check size={8} strokeWidth={4} className="text-black" />}
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-white/90", i.feito && "line-through")}>{i.titulo}</span>
        {i.inicio && <span className="shrink-0 tabular-nums text-white/40">{i.inicio}</span>}
      </span>
    );
  }
  if (diaTodo) {
    // Dia inteiro: faixa tingida, texto na cor
    return (
      <span className={cn("flex h-[18px] min-w-0 items-center rounded-[5px] px-1.5 text-[11.5px] font-medium leading-none", i.feito && "line-through opacity-45")} style={{ background: `${i.cor}38`, color: `color-mix(in srgb, ${i.cor} 55%, white)` }}>
        <span className="truncate">{i.titulo}</span>
      </span>
    );
  }
  // Com horário: bolinha, título e hora à direita
  return (
    <span className={cn("flex h-[18px] min-w-0 items-center gap-1.5 px-1 text-[11.5px] leading-none", i.feito && "line-through opacity-45")}>
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: i.cor }} />
      <span className="min-w-0 flex-1 truncate text-white/90">{i.titulo}</span>
      <span className="shrink-0 tabular-nums text-white/40">{i.inicio}</span>
    </span>
  );
}

export default function Mes({
  mes, grade, porDia, hoje, dia, selecionar, criar, mudar, bloqueado,
}: {
  mes: string;
  grade: string[][];
  porDia: Map<string, Item[]>;
  hoje: string;
  dia: string;
  selecionar: (d: string) => void;
  criar: (d: string) => void;
  mudar: (delta: number) => void;
  bloqueado: boolean;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [cabem, setCabem] = useState(3);
  const toque = useRef<{ x: number; y: number } | null>(null);

  // Quantos eventos cabem por célula, a partir da altura real da grade
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => {
      const alturaCelula = (el.clientHeight - 32) / grade.length;
      setCabem(Math.max(1, Math.floor((alturaCelula - TOPO_CELULA) / ALTURA_LINHA)));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [grade.length]);

  // Arrastar o dedo para o lado troca o mês, como no iPhone
  const inicioToque = (e: TouchEvent) => (toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const fimToque = (e: TouchEvent) => {
    const t = toque.current;
    toque.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) mudar(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={caixa}
      onTouchStart={inicioToque}
      onTouchEnd={fimToque}
      className="grid select-none grid-cols-7 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121318] lg:h-full"
      style={{ gridTemplateRows: `32px repeat(${grade.length}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Dias do mês"
    >
      {SEMANA.map((s, i) => (
        <div key={s} role="columnheader" className={cn("flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45 sm:justify-end sm:pr-3", i >= 5 && "text-white/30")}>
          <span className="sm:hidden">{s[0]}</span>
          <span className="hidden sm:inline">{s}</span>
        </div>
      ))}
      {grade.flat().map((d, idx) => {
        const lista = porDia.get(d) ?? [];
        const fora = !d.startsWith(mes);
        const ehHoje = d === hoje;
        const sel = d === dia;
        const fimDeSemana = idx % 7 >= 5;
        const mostrar = lista.length > cabem ? cabem - 1 : cabem;
        const numero = Number(d.slice(8));
        return (
          <div
            key={d}
            role="gridcell"
            aria-selected={sel}
            tabIndex={sel ? 0 : -1}
            onClick={() => selecionar(d)}
            onDoubleClick={() => !bloqueado && criar(d)}
            onKeyDown={(e) => e.key === "Enter" && !bloqueado && criar(d)}
            aria-label={`${d.split("-").reverse().join("/")}${ehHoje ? ", hoje" : ""}, ${lista.length} ${lista.length === 1 ? "item" : "itens"}`}
            className={cn(
              "relative flex min-h-[52px] min-w-0 cursor-default flex-col border-t border-white/[0.06] outline-none transition-colors sm:min-h-[96px] lg:min-h-0",
              idx % 7 !== 0 && "border-l",
              fimDeSemana ? "bg-[#0F1014]" : "bg-transparent",
              fora && "bg-[#0D0E11]",
              sel && "sm:bg-white/[0.045]",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A84FF]",
            )}
          >
            {/* Número: celular centralizado (iOS), telas maiores no canto direito (Mac) */}
            <div className="flex justify-center pt-1.5 sm:justify-end sm:px-1.5 sm:pt-1">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[15px] tabular-nums sm:h-6 sm:w-6 sm:text-[13px]",
                  fora ? "text-white/25" : "text-white/85",
                  ehHoje && "font-semibold",
                  ehHoje && !sel && "text-[#FF453A] sm:bg-[#FF453A] sm:text-white",
                  ehHoje && sel && "bg-[#FF453A] text-white",
                  !ehHoje && sel && "bg-white font-semibold text-black sm:bg-transparent sm:text-white",
                )}
              >
                {numero}
              </span>
            </div>
            {/* Celular: até três pontinhos */}
            <div className="mt-0.5 flex h-1.5 justify-center gap-[3px] sm:hidden" aria-hidden>
              {lista.slice(0, 3).map((i) => (
                <span key={`${i.origem}${i.id}`} className="h-[5px] w-[5px] rounded-full" style={{ background: i.cor, opacity: i.feito ? 0.35 : 1 }} />
              ))}
            </div>
            {/* Telas maiores: os eventos */}
            <div className="hidden min-w-0 flex-col gap-[2px] px-1 pb-1 sm:flex" aria-hidden>
              {lista.slice(0, mostrar).map((i) => <Marca key={`${i.origem}${i.id}`} i={i} />)}
              {lista.length > mostrar && <span className="px-1 text-[11px] font-medium text-white/45">+{lista.length - mostrar} mais</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
