import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CORES_IOS, TIPOS, type Calendario, type Evento, type NovoEvento, type TipoEvento } from "@/features/calendario/agenda";
import { COLUNAS, type Cartao, type ColunaId } from "@/features/plano/quadro";

const AZUL = "#0A84FF";

/**
 * Folha (sheet) no estilo iOS: barra com Cancelar / título / ação, e o
 * conteúdo em grupos arredondados. Esc e clique fora fecham.
 */
export function Folha({ titulo, acao, acaoDesligada, fechar, enviar, children }: {
  titulo: string;
  acao?: string;
  acaoDesligada?: boolean;
  fechar: () => void;
  enviar?: (e: FormEvent) => void;
  children: ReactNode;
}) {
  const caixa = useRef<HTMLFormElement>(null);
  const id = useId();
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <form
        ref={caixa}
        onSubmit={(e) => {
          e.preventDefault();
          enviar?.(e);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[22px] bg-[#1C1C1E] [color-scheme:dark] text-white shadow-2xl sm:rounded-[22px]"
      >
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.08] px-2 py-2.5">
          <button type="button" onClick={fechar} className="justify-self-start rounded-lg px-2.5 py-1.5 text-[15px]" style={{ color: AZUL }}>
            Cancelar
          </button>
          <h2 id={id} className="text-[15.5px] font-semibold">{titulo}</h2>
          {acao ? (
            <button type="submit" disabled={acaoDesligada} className="justify-self-end rounded-lg px-2.5 py-1.5 text-[15px] font-semibold disabled:opacity-35" style={{ color: AZUL }}>
              {acao}
            </button>
          ) : <span />}
        </div>
        <div className="space-y-5 overflow-y-auto px-4 pb-6 pt-4">{children}</div>
      </form>
    </div>
  );
}

export function Grupo({ children, rotulo }: { children: ReactNode; rotulo?: string }) {
  return (
    <div>
      {rotulo && <p className="mb-1.5 px-3 text-[12px] uppercase tracking-[0.04em] text-white/40">{rotulo}</p>}
      <div className="divide-y divide-white/[0.08] overflow-hidden rounded-xl bg-[#2C2C2E]">{children}</div>
    </div>
  );
}

export function Linha({ rotulo, children, htmlFor }: { rotulo: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-h-[46px] items-center gap-3 px-3.5">
      <label htmlFor={htmlFor} className="shrink-0 text-[15px]">{rotulo}</label>
      <div className="ml-auto flex min-w-0 items-center justify-end">{children}</div>
    </div>
  );
}

export const entrada = "block h-[46px] w-full bg-transparent px-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50";
export const valor = "rounded-md bg-white/[0.08] px-2 py-1 text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:opacity-40 [color-scheme:dark]";

export function Interruptor({ ligado, mudar, rotulo, desligado }: { ligado: boolean; mudar: (v: boolean) => void; rotulo: string; desligado?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desligado}
      onClick={() => mudar(!ligado)}
      className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors disabled:opacity-40", ligado ? "bg-[#30D158]" : "bg-white/[0.16]")}
    >
      <span className={cn("absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-[left]", ligado ? "left-[22px]" : "left-[2px]")} />
    </button>
  );
}

/** Bolinhas de cor do iOS. `padrao` é a opção "cor do calendário". */
export function Cores({ cor, mudar, padrao, desligado }: { cor: string; mudar: (c: string) => void; padrao?: string; desligado?: boolean }) {
  const opcoes = padrao !== undefined ? [{ cor: "", nome: "Cor do calendário" }, ...CORES_IOS] : CORES_IOS;
  return (
    <div className="flex flex-wrap gap-2.5 px-3.5 py-3" role="radiogroup" aria-label="Cor">
      {opcoes.map((o) => {
        const c = o.cor || padrao || "#98989D";
        const marcada = cor === o.cor;
        return (
          <button
            key={o.nome}
            type="button"
            role="radio"
            aria-checked={marcada}
            aria-label={o.nome}
            title={o.nome}
            disabled={desligado}
            onClick={() => mudar(o.cor)}
            className={cn("relative grid h-8 w-8 place-items-center rounded-full transition-transform active:scale-90", marcada && "ring-2 ring-white ring-offset-2 ring-offset-[#2C2C2E]")}
            style={{ background: c }}
          >
            {!o.cor && <span className="absolute inset-[9px] rounded-full border-2 border-white/80" aria-hidden />}
            {marcada && o.cor && <Check size={15} strokeWidth={3} className="text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}

export type DestinoNovo = "calendario" | "plano";

/**
 * Criar ou editar um evento. Na criação dá para mandar como cartão para o
 * Plano: ele vira cartão (fonte única) e aparece aqui pelo reflexo.
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
  const [diaTodo, setDiaTodo] = useState(evento ? !evento.inicio : false);
  const [inicio, setInicio] = useState(evento?.inicio || "09:00");
  const [fim, setFim] = useState(evento?.fim || (evento?.inicio ? "" : "10:00"));
  const [local, setLocal] = useState(evento?.local ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [feito, setFeito] = useState(evento?.feito ?? false);
  const [cor, setCor] = useState(evento?.cor ?? "");
  const [destino, setDestino] = useState<DestinoNovo>("calendario");
  const [confirmar, setConfirmar] = useState(false);
  const noPlano = !evento && destino === "plano";
  const calendario = calendarios.find((c) => c.id === calendarioId);

  // Mudou o início: o fim anda junto, mantendo a duração (como no iPhone)
  function mudarInicio(v: string) {
    if (inicio && fim && v) {
      const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
      const novoFim = Math.min(min(v) + (min(fim) - min(inicio)), 23 * 60 + 59);
      if (novoFim > min(v)) setFim(`${String(Math.floor(novoFim / 60)).padStart(2, "0")}:${String(novoFim % 60).padStart(2, "0")}`);
    }
    setInicio(v);
  }

  function enviar() {
    const hIni = diaTodo ? "" : inicio;
    const hFim = diaTodo || !inicio ? "" : fim;
    const ok = noPlano
      ? criarNoPlano({ titulo, data, hora: hIni, calendarioId, descricao })
      : salvar({ titulo, tipo, calendarioId, data, inicio: hIni, fim: hFim, local, descricao, feito, cor });
    if (ok) fechar();
  }

  return (
    <Folha titulo={evento ? "Editar" : noPlano ? "Novo cartão" : "Novo evento"} acao={evento ? "OK" : "Adicionar"} acaoDesligada={bloqueado || !titulo.trim()} fechar={fechar} enviar={enviar}>
      {!evento && (
        <div className="grid grid-cols-2 gap-0.5 rounded-[9px] bg-white/[0.08] p-0.5" role="radiogroup" aria-label="Onde criar">
          {([["calendario", "Evento"], ["plano", "Cartão no Plano"]] as const).map(([id, nome]) => (
            <button key={id} type="button" role="radio" aria-checked={destino === id} onClick={() => setDestino(id)} className={cn("h-8 rounded-[7px] text-[13px] font-semibold transition-colors", destino === id ? "bg-[#636366] text-white shadow" : "text-white/70")}>
              {nome}
            </button>
          ))}
        </div>
      )}

      <Grupo>
        <input aria-label="Título" autoFocus maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={bloqueado} className={entrada} placeholder={noPlano ? "Título do cartão" : "Título"} />
        {!noPlano && <input aria-label="Local ou link" maxLength={140} value={local} onChange={(e) => setLocal(e.target.value)} disabled={bloqueado} className={entrada} placeholder="Local ou link da chamada" />}
      </Grupo>

      <Grupo>
        <Linha rotulo="Dia inteiro">
          <Interruptor ligado={diaTodo} mudar={setDiaTodo} rotulo="Dia inteiro" desligado={bloqueado} />
        </Linha>
        <Linha rotulo="Data" htmlFor="ev-data">
          <input id="ev-data" type="date" required value={data} onChange={(e) => setData(e.target.value)} disabled={bloqueado} className={valor} />
        </Linha>
        {!diaTodo && (
          <Linha rotulo={noPlano ? "Hora" : "Início"} htmlFor="ev-inicio">
            <input id="ev-inicio" type="time" value={inicio} onChange={(e) => mudarInicio(e.target.value)} disabled={bloqueado} className={valor} />
          </Linha>
        )}
        {!diaTodo && !noPlano && (
          <Linha rotulo="Término" htmlFor="ev-fim">
            <input id="ev-fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} disabled={bloqueado || !inicio} className={valor} />
          </Linha>
        )}
      </Grupo>

      <Grupo>
        <Linha rotulo="Calendário" htmlFor="ev-cal">
          <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: calendario?.cor }} aria-hidden />
          <select id="ev-cal" value={calendarioId} onChange={(e) => setCalendarioId(e.target.value)} disabled={bloqueado} className={cn(valor, "max-w-[180px] truncate")}>
            {calendarios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Linha>
        {!noPlano && (
          <div className="px-3.5 py-3">
            <p className="mb-2 text-[15px]">Tipo</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo">
              {TIPOS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={tipo === t.id} disabled={bloqueado} onClick={() => setTipo(t.id)} className={cn("h-8 rounded-full px-3 text-[13px] font-medium transition-colors", tipo === t.id ? "bg-white text-black" : "bg-white/[0.08] text-white/80 hover:bg-white/[0.14]")}>
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
        )}
      </Grupo>

      {!noPlano && (
        <Grupo rotulo="Cor">
          <Cores cor={cor} mudar={setCor} padrao={calendario?.cor} desligado={bloqueado} />
        </Grupo>
      )}

      <Grupo>
        <textarea aria-label="Anotações" rows={3} maxLength={4000} value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={bloqueado} placeholder="Anotações" className={cn(entrada, "h-auto resize-none py-3")} />
      </Grupo>

      {noPlano && <p className="px-3 text-[12.5px] leading-relaxed text-white/45">O cartão entra na coluna Agenda do Plano, no projeto do calendário escolhido, e aparece aqui na data.</p>}

      {evento && (
        <Grupo>
          <Linha rotulo="Concluído">
            <Interruptor ligado={feito} mudar={setFeito} rotulo="Concluído" desligado={bloqueado} />
          </Linha>
        </Grupo>
      )}

      {remover && (
        <Grupo>
          {confirmar ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 text-[14px]">
              <span className="flex-1 text-white/70">Excluir este evento?</span>
              <button type="button" onClick={() => setConfirmar(false)} className="h-8 rounded-lg px-3 text-white/80 hover:bg-white/10">Não</button>
              <button type="button" onClick={() => { remover(); fechar(); }} className="h-8 rounded-lg bg-[#FF453A] px-3 font-semibold">Excluir</button>
            </div>
          ) : (
            <button type="button" disabled={bloqueado} onClick={() => setConfirmar(true)} className="h-[46px] w-full text-center text-[15px] text-[#FF453A] disabled:opacity-40">
              Excluir evento
            </button>
          )}
        </Grupo>
      )}
    </Folha>
  );
}

/** Cartão do Plano visto do calendário: data, hora e concluir; o resto é no Plano. */
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

  return (
    <Folha titulo="Cartão do Plano" acao="OK" acaoDesligada={bloqueado} fechar={fechar} enviar={() => editar({ data, hora: data ? hora : "" }) && fechar()}>
      <div className="px-1">
        <p className={cn("text-[19px] font-semibold leading-snug", feito && "text-white/50 line-through")}>{cartao.titulo}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-white/50">
          <span>{coluna}</span>
          {cartao.projeto && <span>· {cartao.projeto}</span>}
          {calendario && (
            <span className="flex items-center gap-1">· <span className="h-2 w-2 rounded-full" style={{ background: calendario.cor }} /> {calendario.nome}</span>
          )}
        </p>
        {cartao.descricao && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-white/70">{cartao.descricao}</p>}
      </div>
      <Grupo>
        <Linha rotulo="Data" htmlFor="ct-data">
          <input id="ct-data" type="date" value={data} onChange={(e) => setData(e.target.value)} disabled={bloqueado} className={valor} />
        </Linha>
        <Linha rotulo="Hora" htmlFor="ct-hora">
          <input id="ct-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={bloqueado || !data} className={valor} />
        </Linha>
      </Grupo>
      {!data && <p className="px-3 text-[12.5px] text-[#FFD60A]/90">Sem data, o cartão sai do calendário e continua no Plano.</p>}
      <Grupo>
        <button type="button" disabled={bloqueado} onClick={() => mover(feito ? "fazer" : "feito") && fechar()} className="h-[46px] w-full text-center text-[15px] disabled:opacity-40" style={{ color: AZUL }}>
          {feito ? "Reabrir (volta para A fazer)" : "Marcar como feito"}
        </button>
        <Link href={`/plano?cartao=${cartao.id}`} className="flex h-[46px] items-center justify-center gap-1.5 text-[15px]" style={{ color: AZUL }}>
          Abrir no Plano <ExternalLink size={14} />
        </Link>
      </Grupo>
    </Folha>
  );
}
