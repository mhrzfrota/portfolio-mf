import { useState } from "react";
import { Check, ChevronDown, KanbanSquare, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPOS, type Calendario, type Item } from "@/features/calendario/agenda";
import type { Cartao } from "@/features/plano/quadro";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

export const diaDaSemana = (iso: string) => SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()];
export const dataPorExtenso = (iso: string) => `${Number(iso.slice(8))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;

const ehTarefa = (i: Item) => i.origem === "plano" || i.tipo === "tarefa";

/** Uma linha da lista do dia, como a lista do Calendário do iPhone. */
export function Linha({ i, calendario, abrir, alternar, mostrarData }: { i: Item; calendario?: Calendario; abrir: () => void; alternar: () => void; mostrarData?: string }) {
  const local = i.origem === "evento" ? i.evento.local : "";
  const tipo = i.origem === "plano" ? "Plano" : TIPOS.find((t) => t.id === i.tipo)?.nome;
  return (
    <li className="group flex items-stretch gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
      <div className="w-12 shrink-0 pt-0.5 text-right text-[12.5px] leading-tight tabular-nums">
        {mostrarData ? (
          <span className="font-medium text-white/80">{mostrarData}</span>
        ) : i.inicio ? (
          <>
            <span className="block font-medium text-white/85">{i.inicio}</span>
            {i.fim && <span className="block text-white/40">{i.fim}</span>}
          </>
        ) : (
          <span className="text-white/45">dia todo</span>
        )}
      </div>
      {ehTarefa(i) ? (
        <button
          type="button"
          onClick={alternar}
          aria-label={i.feito ? `Reabrir ${i.titulo}` : `Concluir ${i.titulo}`}
          className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 transition-transform active:scale-90"
          style={{ borderColor: i.cor, background: i.feito ? i.cor : "transparent" }}
        >
          {i.feito && <Check size={11} strokeWidth={3.5} className="text-black" />}
        </button>
      ) : (
        <span className="w-[3px] shrink-0 rounded-full" style={{ background: i.cor }} aria-hidden />
      )}
      <button type="button" onClick={abrir} className="min-w-0 flex-1 text-left">
        <span className={cn("block text-[14.5px] font-medium leading-snug [overflow-wrap:anywhere]", i.feito && "text-white/40 line-through")}>{i.titulo}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-white/45">
          <span>{tipo}</span>
          {calendario && <span>{calendario.nome}</span>}
          {local && (
            <span className="flex min-w-0 items-center gap-0.5">
              <MapPin size={11} /> <span className="truncate">{local}</span>
            </span>
          )}
          {i.origem === "plano" && <KanbanSquare size={11} aria-label="Cartão do Plano" />}
        </span>
      </button>
    </li>
  );
}

export function PuxarDoPlano({ cartoes, puxar, bloqueado }: { cartoes: Cartao[]; puxar: (id: string) => void; bloqueado: boolean }) {
  const [aberto, setAberto] = useState(false);
  if (!cartoes.length) return null;
  return (
    <div className="border-t border-white/[0.07] pt-3">
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-white/65 hover:bg-white/[0.04] hover:text-white">
        <KanbanSquare size={15} />
        <span className="flex-1">Trazer do Plano ({cartoes.length} sem data)</span>
        <ChevronDown size={16} className={cn("transition-transform", aberto && "rotate-180")} />
      </button>
      {aberto && (
        <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {cartoes.map((c) => (
            <li key={c.id}>
              <button type="button" disabled={bloqueado} onClick={() => puxar(c.id)} className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-white/[0.06] disabled:opacity-50">
                <Plus size={14} className="shrink-0 text-[#0A84FF]" />
                <span className="min-w-0 flex-1 truncate">{c.titulo}</span>
                {c.projeto && <span className="max-w-[40%] shrink-0 truncate text-[11.5px] text-white/40">{c.projeto}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
