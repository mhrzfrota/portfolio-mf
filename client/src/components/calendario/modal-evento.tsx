import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { ExternalLink, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPOS, type Calendario, type Evento, type NovoEvento, type TipoEvento } from "@/features/calendario/agenda";
import { COLUNAS, type Cartao, type ColunaId } from "@/features/plano/quadro";

export const campo =
  "block h-10 w-full rounded-lg border border-white/10 bg-[#0B0D12] px-3 text-[14px] text-white placeholder:text-white/35 focus:border-white/35 focus:outline-none disabled:opacity-50";
const rotulo = "mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55";

export function Janela({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixa.current?.focus();
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      anterior?.focus?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 pt-[6vh] sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div ref={caixa} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#161A22] text-white shadow-2xl outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <h2 className="text-[17px] font-semibold">{titulo}</h2>
          <button type="button" onClick={fechar} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export type DestinoNovo = "calendario" | "plano";

/**
 * Criar ou editar um evento. Na criação dá para escolher mandar como cartão
 * para o Plano: aí ele vira cartão (fonte única) e aparece aqui pelo reflexo.
 */
export function ModalEvento({
  evento, inicial, calendarios, bloqueado, salvar, criarNoPlano, remover, fechar,
}: {
  evento?: Evento;
  inicial: { data: string; calendarioId: string };
  calendarios: Calendario[];
  bloqueado: boolean;
  salvar: (dados: NovoEvento) => boolean;
  criarNoPlano: (dados: { titulo: string; data: string; hora: string; calendarioId: string; descricao: string }) => boolean;
  remover?: () => void;
  fechar: () => void;
}) {
  const [titulo, setTitulo] = useState(evento?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoEvento>(evento?.tipo ?? "compromisso");
  const [calendarioId, setCalendarioId] = useState(evento?.calendarioId ?? inicial.calendarioId);
  const [data, setData] = useState(evento?.data ?? inicial.data);
  const [inicio, setInicio] = useState(evento?.inicio ?? "");
  const [fim, setFim] = useState(evento?.fim ?? "");
  const [local, setLocal] = useState(evento?.local ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [feito, setFeito] = useState(evento?.feito ?? false);
  const [destino, setDestino] = useState<DestinoNovo>("calendario");
  const [confirmar, setConfirmar] = useState(false);
  const noPlano = !evento && destino === "plano";

  function enviar(e: FormEvent) {
    e.preventDefault();
    const ok = noPlano
      ? criarNoPlano({ titulo, data, hora: inicio, calendarioId, descricao })
      : salvar({ titulo, tipo, calendarioId, data, inicio, fim, local, descricao, feito });
    if (ok) fechar();
  }

  return (
    <Janela titulo={evento ? "Editar" : "Novo no calendário"} fechar={fechar}>
      <form onSubmit={enviar} className="space-y-4 p-5">
        {!evento && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#0B0D12] p-1" role="radiogroup" aria-label="Onde criar">
            {([["calendario", "Evento do calendário"], ["plano", "Cartão no Plano"]] as const).map(([id, nome]) => (
              <button key={id} type="button" role="radio" aria-checked={destino === id} onClick={() => setDestino(id)} className={cn("h-9 rounded-lg text-[13px] font-semibold transition-colors", destino === id ? "bg-white text-[#0B0D12]" : "text-white/65 hover:text-white")}>
                {nome}
              </button>
            ))}
          </div>
        )}
        {noPlano && <p className="-mt-1 text-[13px] text-white/55">Vai para a coluna Agenda do Plano, no projeto do calendário escolhido, e aparece aqui na data.</p>}

        <div>
          <label htmlFor="ev-titulo" className={rotulo}>Título</label>
          <input id="ev-titulo" autoFocus required maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={bloqueado} className={campo} placeholder={noPlano ? "Ex.: Enviar proposta" : "Ex.: Reunião com o cliente"} />
        </div>

        {!noPlano && (
          <div>
            <span className={rotulo}>Tipo</span>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo">
              {TIPOS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={tipo === t.id} disabled={bloqueado} onClick={() => setTipo(t.id)} className={cn("h-8 rounded-full border px-3 text-[13px] font-medium transition-colors", tipo === t.id ? "border-white bg-white text-[#0B0D12]" : "border-white/15 text-white/75 hover:border-white/40")}>
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="ev-cal" className={rotulo}>Calendário</label>
            <select id="ev-cal" value={calendarioId} onChange={(e) => setCalendarioId(e.target.value)} disabled={bloqueado} className={campo}>
              {calendarios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="ev-data" className={rotulo}>Data</label>
            <input id="ev-data" type="date" required value={data} onChange={(e) => setData(e.target.value)} disabled={bloqueado} className={campo} />
          </div>
          <div>
            <label htmlFor="ev-inicio" className={rotulo}>{noPlano ? "Hora" : "Início"} <span className="normal-case tracking-normal text-white/35">(opcional)</span></label>
            <input id="ev-inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} disabled={bloqueado} className={campo} />
          </div>
          {!noPlano && (
            <div>
              <label htmlFor="ev-fim" className={rotulo}>Fim <span className="normal-case tracking-normal text-white/35">(opcional)</span></label>
              <input id="ev-fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} disabled={bloqueado || !inicio} className={campo} />
            </div>
          )}
        </div>

        {!noPlano && (
          <div>
            <label htmlFor="ev-local" className={rotulo}>Local ou link</label>
            <input id="ev-local" maxLength={140} value={local} onChange={(e) => setLocal(e.target.value)} disabled={bloqueado} className={campo} placeholder="Ex.: Google Meet, escritório do cliente" />
          </div>
        )}

        <div>
          <label htmlFor="ev-desc" className={rotulo}>Anotações</label>
          <textarea id="ev-desc" rows={3} maxLength={4000} value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={bloqueado} className={cn(campo, "h-auto py-2.5")} />
        </div>

        {evento && (
          <label className="flex items-center gap-2.5 text-[14px]">
            <input type="checkbox" checked={feito} onChange={(e) => setFeito(e.target.checked)} disabled={bloqueado} className="h-4 w-4 accent-emerald-400" />
            Concluído
          </label>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="submit" disabled={bloqueado} className="h-10 rounded-lg bg-white px-5 text-[14px] font-semibold text-[#0B0D12] hover:bg-white/90 disabled:opacity-50">
            {evento ? "Salvar" : noPlano ? "Criar cartão" : "Criar"}
          </button>
          <button type="button" onClick={fechar} className="h-10 rounded-lg px-4 text-[14px] text-white/70 hover:bg-white/10">Cancelar</button>
          {remover && (
            confirmar ? (
              <span className="ml-auto flex items-center gap-2 text-[13px]">
                Excluir mesmo?
                <button type="button" onClick={() => { remover(); fechar(); }} className="h-9 rounded-lg bg-red-500/90 px-3 font-semibold">Excluir</button>
                <button type="button" onClick={() => setConfirmar(false)} className="h-9 rounded-lg px-2 text-white/70 hover:bg-white/10">Não</button>
              </span>
            ) : (
              <button type="button" disabled={bloqueado} onClick={() => setConfirmar(true)} className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-[14px] text-red-300 hover:bg-red-500/15">
                <Trash2 size={16} /> Excluir
              </button>
            )
          )}
        </div>
      </form>
    </Janela>
  );
}

/** Cartão do Plano visto do calendário: dá para mudar data e hora ou concluir; o resto é no Plano. */
export function ModalCartao({
  cartao, calendario, bloqueado, editar, mover, fechar,
}: {
  cartao: Cartao;
  calendario?: Calendario;
  bloqueado: boolean;
  editar: (patch: { data?: string; hora?: string }) => boolean;
  mover: (coluna: ColunaId) => boolean;
  fechar: () => void;
}) {
  const [data, setData] = useState(cartao.data);
  const [hora, setHora] = useState(cartao.hora);
  const coluna = COLUNAS.find((c) => c.id === cartao.coluna)?.titulo;
  const feito = cartao.coluna === "feito";

  function salvar(e: FormEvent) {
    e.preventDefault();
    if (editar({ data, hora: data ? hora : "" })) fechar();
  }

  return (
    <Janela titulo="Cartão do Plano" fechar={fechar}>
      <form onSubmit={salvar} className="space-y-4 p-5">
        <div>
          <p className={cn("text-[18px] font-semibold leading-snug", feito && "text-white/55 line-through")}>{cartao.titulo}</p>
          <p className="mt-1.5 text-[13px] text-white/55">
            Coluna {coluna}
            {cartao.projeto && <> · {cartao.projeto}</>}
            {calendario && <> · calendário {calendario.nome}</>}
          </p>
          {cartao.descricao && <p className="mt-3 whitespace-pre-line text-[14px] text-white/75">{cartao.descricao}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ct-data" className={rotulo}>Data</label>
            <input id="ct-data" type="date" value={data} onChange={(e) => setData(e.target.value)} disabled={bloqueado} className={campo} />
          </div>
          <div>
            <label htmlFor="ct-hora" className={rotulo}>Hora</label>
            <input id="ct-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={bloqueado || !data} className={campo} />
          </div>
        </div>
        {!data && <p className="text-[13px] text-amber-200/90">Sem data, o cartão sai do calendário e continua no Plano.</p>}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="submit" disabled={bloqueado} className="h-10 rounded-lg bg-white px-5 text-[14px] font-semibold text-[#0B0D12] hover:bg-white/90 disabled:opacity-50">Salvar</button>
          <button type="button" disabled={bloqueado} onClick={() => mover(feito ? "fazer" : "feito") && fechar()} className="h-10 rounded-lg border border-white/15 px-4 text-[14px] font-medium hover:bg-white/10 disabled:opacity-50">
            {feito ? "Reabrir" : "Marcar como feito"}
          </button>
          <Link href={`/plano?cartao=${cartao.id}`} className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-[14px] text-white/75 hover:bg-white/10">
            Abrir no Plano <ExternalLink size={15} />
          </Link>
        </div>
      </form>
    </Janela>
  );
}
