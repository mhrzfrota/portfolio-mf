import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PESSOAL, type Calendario } from "@/features/calendario/agenda";
import { Cores, Folha, Grupo, Linha, entrada, valor } from "./modal-evento";

/** Botão "Calendários" com a lista para mostrar, esconder, isolar e editar, como no iPhone. */
export function MenuCalendarios({
  calendarios, visiveis, alternar, so, todos, editar, novo, bloqueado,
}: {
  calendarios: Calendario[];
  visiveis: Set<string>;
  alternar: (id: string) => void;
  so: (id: string) => void;
  todos: () => void;
  editar: (id: string) => void;
  novo: () => void;
  bloqueado: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const ocultos = calendarios.length - visiveis.size;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-haspopup="dialog" className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[13.5px] font-medium hover:bg-white/[0.08]">
        <span className="flex -space-x-1" aria-hidden>
          {calendarios.filter((c) => visiveis.has(c.id)).slice(0, 4).map((c) => (
            <span key={c.id} className="h-3 w-3 rounded-full ring-2 ring-[#16171C]" style={{ background: c.cor }} />
          ))}
        </span>
        <span className="hidden sm:inline">Calendários</span>
        {ocultos > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[11px] text-white/70">{ocultos} oculto{ocultos > 1 ? "s" : ""}</span>}
        <ChevronDown size={15} className={cn("text-white/50 transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && (
        <div role="dialog" aria-label="Calendários" className="absolute right-0 top-11 z-30 w-[300px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1C1C1E] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-white/45">Calendários</p>
            <button type="button" onClick={todos} className="text-[13px] font-medium text-[#0A84FF]">Mostrar todos</button>
          </div>
          <ul className="max-h-[50vh] overflow-y-auto px-1.5 pb-1.5">
            {calendarios.map((c) => {
              const ligado = visiveis.has(c.id);
              return (
                <li key={c.id} className="group flex items-center gap-1 rounded-xl hover:bg-white/[0.05]">
                  <button type="button" role="checkbox" aria-checked={ligado} onClick={() => alternar(c.id)} className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2 text-left">
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors" style={{ borderColor: c.cor, background: ligado ? c.cor : "transparent" }}>
                      {ligado && <Check size={13} strokeWidth={3.5} className="text-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px]">{c.nome}</span>
                      {c.projeto && <span className="block truncate text-[12px] text-white/40">Plano: {c.projeto}</span>}
                    </span>
                  </button>
                  <button type="button" onClick={() => { so(c.id); setAberto(false); }} className="rounded-md px-2 py-1 text-[12px] text-white/45 opacity-0 hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100" title={`Ver só ${c.nome}`}>
                    só
                  </button>
                  <button type="button" onClick={() => { editar(c.id); setAberto(false); }} aria-label={`Editar ${c.nome}`} className="mr-1 grid h-8 w-8 place-items-center rounded-full text-[#0A84FF] hover:bg-white/10">
                    <Info size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" disabled={bloqueado} onClick={() => { novo(); setAberto(false); }} className="flex w-full items-center gap-2 border-t border-white/[0.08] px-4 py-3 text-[14.5px] text-[#0A84FF] hover:bg-white/[0.04] disabled:opacity-40">
            <Plus size={17} /> Adicionar calendário de cliente
          </button>
        </div>
      )}
    </div>
  );
}

export function ModalCalendario({
  calendario, projetos, usados, salvar, remover, eventos, fechar, bloqueado,
}: {
  calendario?: Calendario;
  projetos: string[];
  usados: string[];
  salvar: (d: { nome: string; cor: string; projeto: string }) => boolean;
  remover?: () => boolean;
  eventos: number;
  fechar: () => void;
  bloqueado: boolean;
}) {
  const [nome, setNome] = useState(calendario?.nome ?? "");
  const [cor, setCor] = useState(calendario?.cor ?? "#0A84FF");
  const [projeto, setProjeto] = useState(calendario?.projeto ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const ehPessoal = calendario?.id === PESSOAL;
  const opcoes = projetos.filter((p) => !usados.includes(p) || p === calendario?.projeto);

  return (
    <Folha titulo={calendario ? "Editar calendário" : "Novo calendário"} acao={calendario ? "OK" : "Adicionar"} acaoDesligada={bloqueado || !nome.trim()} fechar={fechar} enviar={() => salvar({ nome, cor, projeto }) && fechar()}>
      <Grupo>
        <input aria-label="Nome do calendário" autoFocus maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} className={entrada} placeholder="Nome do cliente" />
      </Grupo>
      {!ehPessoal && (
        <Grupo rotulo="Ligado ao Plano">
          <Linha rotulo="Projeto" htmlFor="cal-projeto">
            <input id="cal-projeto" list="cal-projetos" maxLength={60} value={projeto} onChange={(e) => setProjeto(e.target.value)} className={cn(valor, "w-44 text-right")} placeholder="Nenhum" />
            <datalist id="cal-projetos">{opcoes.map((p) => <option key={p} value={p} />)}</datalist>
          </Linha>
        </Grupo>
      )}
      {!ehPessoal && <p className="-mt-3 px-3 text-[12.5px] leading-relaxed text-white/45">Cartões do Plano com este projeto e com data aparecem neste calendário.</p>}
      <Grupo rotulo="Cor">
        <Cores cor={cor} mudar={setCor} />
      </Grupo>
      {remover && (
        <Grupo>
          {confirmar ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 text-[14px]">
              <span className="flex-1 text-white/70">{eventos ? `Apaga ${eventos} evento${eventos > 1 ? "s" : ""}. Continuar?` : "Excluir este calendário?"}</span>
              <button type="button" onClick={() => setConfirmar(false)} className="h-8 rounded-lg px-3 text-white/80 hover:bg-white/10">Não</button>
              <button type="button" onClick={() => remover() && fechar()} className="h-8 rounded-lg bg-[#FF453A] px-3 font-semibold">Excluir</button>
            </div>
          ) : (
            <button type="button" disabled={bloqueado} onClick={() => setConfirmar(true)} className="h-[46px] w-full text-center text-[15px] text-[#FF453A] disabled:opacity-40">
              Excluir calendário
            </button>
          )}
        </Grupo>
      )}
    </Folha>
  );
}
