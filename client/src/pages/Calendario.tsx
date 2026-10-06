import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, Check, ChevronLeft, ChevronRight, KanbanSquare, Pencil, Plus, Trash2 } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import { Janela, ModalCartao, ModalEvento, campo } from "@/components/calendario/modal-evento";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  CORES, PESSOAL, TIPOS, calendarioDoCartao, carregarAgenda, cartoesSemData, criarCalendario, criarEvento, editarCalendario,
  editarEvento, gradeDoMes, hojeISO, itensEntre, mesDe, mudarMes, removerCalendario, removerEvento, salvarAgenda, sementeAgenda,
  type Agenda, type Calendario, type Item,
} from "@/features/calendario/agenda";
import { adicionar, carregarQuadro, editar as editarCartao, encontrar, mover, projetos, salvarQuadro, type Quadro } from "@/features/plano/quadro";
import { semente } from "@/features/plano/semente";

export default function CalendarioPagina() {
  const { user } = useAuth();
  return user ? <Conteudo key={user.id} userId={user.id} /> : null;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CHAVE_VISIVEIS = (u: string) => `mf-calendario:visiveis:${u}`;

const nomeMes = (mes: string) => `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`;
const diaLongo = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  const semana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][d.getUTCDay()];
  return `${semana}, ${Number(iso.slice(8))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;
};
const horario = (i: Item) => (i.inicio ? (i.fim ? `${i.inicio}–${i.fim}` : i.inicio) : "Dia todo");

function lerAgenda(userId: string) {
  try {
    return carregarAgenda(localStorage, userId, sementeAgenda);
  } catch {
    return { agenda: sementeAgenda(), nova: true, erro: "" };
  }
}
function lerQuadro(userId: string) {
  try {
    return carregarQuadro(localStorage, userId, () => semente());
  } catch {
    return { quadro: null, origem: "v2" as const, erro: "Não foi possível ler o Plano." };
  }
}

type Aberto = { tipo: "novo"; data: string } | { tipo: "evento"; id: string } | { tipo: "cartao"; id: string } | { tipo: "calendario"; id?: string } | null;

/**
 * Calendário do mês: o seu e um por cliente, com os cartões do Plano que têm
 * data aparecendo sozinhos (ícone de quadro). Salva no navegador, como o Plano.
 */
function Conteudo({ userId }: { userId: string }) {
  const [inicialAgenda] = useState(() => lerAgenda(userId));
  const [inicialQuadro] = useState(() => lerQuadro(userId));
  const [agenda, setAgenda] = useState<Agenda>(inicialAgenda.agenda);
  const [quadro, setQuadro] = useState<Quadro | null>(inicialQuadro.quadro);
  const bloqueado = Boolean(inicialAgenda.erro);
  const planoBloqueado = Boolean(inicialQuadro.erro) || !quadro;
  const [erro, setErro] = useState(inicialAgenda.erro || inicialQuadro.erro);
  const [aviso, setAviso] = useState("");
  const hoje = hojeISO();
  const [mes, setMes] = useState(mesDe(hoje));
  const [dia, setDia] = useState(hoje);
  const [aberto, setAberto] = useState<Aberto>(null);
  const [visiveis, setVisiveis] = useState<Set<string>>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE_VISIVEIS(userId)) ?? "null");
      if (Array.isArray(v)) return new Set(v.filter((x): x is string => typeof x === "string"));
    } catch {
      /* sem preferência salva */
    }
    return new Set(inicialAgenda.agenda.calendarios.map((c) => c.id));
  });

  useEffect(() => {
    if (inicialAgenda.nova && !bloqueado) salvarAgenda(localStorage, userId, inicialAgenda.agenda);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_VISIVEIS(userId), JSON.stringify(Array.from(visiveis)));
    } catch {
      /* preferência só da visita */
    }
  }, [visiveis, userId]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  function aplicar(op: (a: Agenda) => Agenda): boolean {
    if (bloqueado) return false;
    try {
      const prox = op(agenda);
      if (!salvarAgenda(localStorage, userId, prox)) {
        setErro("Não foi possível salvar neste navegador.");
        return false;
      }
      setAgenda(prox);
      return true;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível fazer isso.");
      return false;
    }
  }
  function aplicarPlano(op: (q: Quadro) => Quadro): boolean {
    if (planoBloqueado || !quadro) return false;
    try {
      const prox = op(quadro);
      if (!salvarQuadro(localStorage, userId, prox)) {
        setErro("Não foi possível salvar o Plano neste navegador.");
        return false;
      }
      setQuadro(prox);
      return true;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível fazer isso.");
      return false;
    }
  }

  const grade = useMemo(() => gradeDoMes(mes), [mes]);
  const itens = useMemo(() => itensEntre(agenda, quadro, grade[0][0], grade.at(-1)!.at(-1)!, visiveis), [agenda, quadro, grade, visiveis]);
  const porDia = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) m.set(i.data, [...(m.get(i.data) ?? []), i]);
    return m;
  }, [itens]);
  const cor = (id: string) => agenda.calendarios.find((c) => c.id === id)?.cor ?? "#E2E8F0";
  const doDia = porDia.get(dia) ?? [];
  const semData = useMemo(() => cartoesSemData(quadro), [quadro]);
  const listaProjetos = useMemo(() => (quadro ? projetos(quadro) : []), [quadro]);
  const somenteUm = visiveis.size === 1 ? agenda.calendarios.find((c) => visiveis.has(c.id)) : undefined;
  const calendarioNovo = somenteUm?.id ?? PESSOAL;
  const pendentesMes = itens.filter((i) => i.data.startsWith(mes) && !i.feito).length;

  function irPara(novoMes: string) {
    setMes(novoMes);
    setDia(novoMes === mesDe(hoje) ? hoje : `${novoMes}-01`);
  }
  function abrir(i: Item) {
    setAberto(i.origem === "evento" ? { tipo: "evento", id: i.id } : { tipo: "cartao", id: i.id });
  }
  function alternarFeito(i: Item) {
    if (i.origem === "evento") aplicar((a) => editarEvento(a, i.id, { feito: !i.feito }));
    else aplicarPlano((q) => mover(q, i.id, i.feito ? "fazer" : "feito", Infinity));
  }

  const eventoAberto = aberto?.tipo === "evento" ? agenda.eventos.find((e) => e.id === aberto.id) : undefined;
  const cartaoAberto = aberto?.tipo === "cartao" && quadro ? encontrar(quadro, aberto.id) : null;
  const calendarioAberto = aberto?.tipo === "calendario" ? agenda.calendarios.find((c) => c.id === aberto.id) : undefined;

  return (
    <InternalShell title="Calendário">
      <p className="mt-3 text-sm text-white/70">Seu mês, com um calendário para cada cliente. Os cartões do Plano com data aparecem aqui sozinhos.</p>

      {/* Calendários */}
      <div className="-mx-5 [scrollbar-width:none] mt-6 flex items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Calendários">
        <button
          type="button"
          onClick={() => setVisiveis(new Set(agenda.calendarios.map((c) => c.id)))}
          aria-pressed={visiveis.size === agenda.calendarios.length}
          className="h-9 shrink-0 rounded-full border border-white/20 px-3.5 text-[13px] font-semibold text-white/80 hover:bg-white/10 aria-pressed:bg-white aria-pressed:text-[#0B0D12]"
        >
          Todos
        </button>
        {agenda.calendarios.map((c) => {
          const ligado = visiveis.has(c.id);
          return (
            <span key={c.id} className={cn("group flex h-9 shrink-0 items-center rounded-full border transition-colors", ligado ? "border-white/25 bg-black/25" : "border-white/10 opacity-60 hover:opacity-90")}>
              <button
                type="button"
                aria-pressed={ligado}
                title="Mostrar ou esconder"
                onClick={() => setVisiveis((v) => { const n = new Set(v); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                className="flex h-full items-center gap-2 pl-3 pr-1 text-[13px] font-medium"
              >
                <span className="grid h-4 w-4 place-items-center rounded" style={{ background: ligado ? c.cor : "transparent", border: `2px solid ${c.cor}` }}>
                  {ligado && <Check size={11} strokeWidth={3} className="text-[#0B0D12]" />}
                </span>
                {c.nome}
              </button>
              <button type="button" onClick={() => setVisiveis(new Set([c.id]))} className="h-full px-1.5 text-[12px] text-white/55 hover:text-white" title={`Ver só ${c.nome}`}>só</button>
              <button type="button" onClick={() => setAberto({ tipo: "calendario", id: c.id })} aria-label={`Editar ${c.nome}`} className="grid h-full w-8 place-items-center rounded-r-full text-white/55 hover:text-white">
                <Pencil size={13} />
              </button>
            </span>
          );
        })}
        <button type="button" disabled={bloqueado} onClick={() => setAberto({ tipo: "calendario" })} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/30 px-3.5 text-[13px] font-medium text-white/80 hover:bg-white/10">
          <Plus size={15} /> Calendário de cliente
        </button>
      </div>

      {(aviso || erro) && (
        <p role={erro ? "alert" : "status"} className={cn("mt-4 rounded-xl px-4 py-2.5 text-sm", erro ? "bg-red-500/20 text-red-100" : "bg-white/15 text-white")}>{erro || aviso}</p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Mês */}
        <section className="rounded-2xl border border-white/10 bg-[#0B0D12]/80 p-3 sm:p-4" aria-label={`Mês de ${nomeMes(mes)}`}>
          <div className="flex items-center gap-1 px-1 pb-3 sm:gap-2">
            <h2 className="mr-auto text-lg font-semibold capitalize sm:text-xl">{nomeMes(mes)}</h2>
            {somenteUm && <span className="hidden items-center sm:flex gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium"><span className="h-2 w-2 rounded-full" style={{ background: somenteUm.cor }} /> {somenteUm.nome}</span>}
            <span className="hidden text-[12px] text-white/50 sm:inline">{pendentesMes} pendente{pendentesMes === 1 ? "" : "s"}</span>
            <button type="button" onClick={() => irPara(mesDe(hoje))} className="h-9 rounded-lg border border-white/15 px-3 text-[13px] font-medium hover:bg-white/10">Hoje</button>
            <button type="button" onClick={() => irPara(mudarMes(mes, -1))} aria-label="Mês anterior" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => irPara(mudarMes(mes, 1))} aria-label="Próximo mês" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-white/[0.06]" role="grid">
            {SEMANA.map((s) => <div key={s} role="columnheader" className="bg-[#0B0D12] py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">{s}</div>)}
            {grade.flat().map((d) => {
              const lista = porDia.get(d) ?? [];
              const foraDoMes = !d.startsWith(mes);
              const selecionado = d === dia;
              return (
                <button
                  key={d}
                  type="button"
                  role="gridcell"
                  aria-selected={selecionado}
                  aria-label={`${diaLongo(d)}, ${lista.length} ${lista.length === 1 ? "item" : "itens"}`}
                  onClick={() => setDia(d)}
                  onDoubleClick={() => !bloqueado && setAberto({ tipo: "novo", data: d })}
                  className={cn("flex min-h-[64px] flex-col items-stretch gap-1 bg-[#10131A] p-1.5 text-left transition-colors hover:bg-[#151924] sm:min-h-[104px]", foraDoMes && "bg-[#0D1016] text-white/35", selecionado && "bg-[#1A2030] ring-2 ring-inset ring-white/60")}
                >
                  <span className={cn("grid h-6 w-6 place-items-center self-start rounded-full text-[12px] font-semibold", d === hoje && "bg-white text-[#0B0D12]")}>{Number(d.slice(8))}</span>
                  {/* Celular: pontinhos. Telas maiores: títulos. */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {lista.slice(0, 4).map((i) => <span key={i.id} className="h-1.5 w-1.5 rounded-full" style={{ background: cor(i.calendarioId), opacity: i.feito ? 0.4 : 1 }} />)}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {lista.slice(0, 3).map((i) => (
                      <span key={i.id} className={cn("flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-[11.5px] leading-tight", i.feito && "line-through opacity-50")} style={{ background: `${cor(i.calendarioId)}26`, boxShadow: `inset 2px 0 0 ${cor(i.calendarioId)}` }}>
                        {i.origem === "plano" && <KanbanSquare size={10} className="shrink-0 opacity-70" />}
                        {i.inicio && <span className="shrink-0 text-white/60">{i.inicio}</span>}
                        <span className="truncate">{i.titulo}</span>
                      </span>
                    ))}
                    {lista.length > 3 && <span className="px-1 text-[11px] text-white/50">+{lista.length - 3}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 px-1 text-[12px] text-white/45"><KanbanSquare size={12} /> veio do Plano · toque duas vezes num dia para criar</p>
        </section>

        {/* Dia selecionado */}
        <section className="rounded-2xl border border-white/10 bg-[#0B0D12]/80 p-4 lg:self-start" aria-label="Dia selecionado">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">{dia === hoje ? "Hoje" : "Dia"}</p>
              <h2 className="text-lg font-semibold first-letter:uppercase">{diaLongo(dia)}</h2>
            </div>
            <button type="button" disabled={bloqueado} onClick={() => setAberto({ tipo: "novo", data: dia })} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-[#0B0D12] hover:bg-white/90 disabled:opacity-50">
              <CalendarPlus size={15} /> Novo
            </button>
          </div>

          {doDia.length ? (
            <ul className="mt-4 space-y-2">
              {doDia.map((i) => (
                <li key={`${i.origem}-${i.id}`} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-[#10131A] p-3" style={{ boxShadow: `inset 3px 0 0 ${cor(i.calendarioId)}` }}>
                  <button
                    type="button"
                    onClick={() => alternarFeito(i)}
                    disabled={i.origem === "plano" ? planoBloqueado : bloqueado}
                    aria-label={i.feito ? `Reabrir ${i.titulo}` : `Concluir ${i.titulo}`}
                    className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", i.feito ? "border-emerald-400 bg-emerald-400 text-[#0B0D12]" : "border-white/35 hover:border-white")}
                  >
                    {i.feito && <Check size={13} strokeWidth={3} />}
                  </button>
                  <button type="button" onClick={() => abrir(i)} className="min-w-0 flex-1 text-left">
                    <span className={cn("block text-[14px] font-medium leading-snug", i.feito && "text-white/50 line-through")}>{i.titulo}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-white/50">
                      <span>{horario(i)}</span>
                      <span>{i.origem === "plano" ? "Plano" : TIPOS.find((t) => t.id === i.tipo)?.nome}</span>
                      <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: cor(i.calendarioId) }} />{agenda.calendarios.find((c) => c.id === i.calendarioId)?.nome}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-[13px] text-white/50">Nada marcado.</p>
          )}

          {semData.length > 0 && !planoBloqueado && (
            <PuxarDoPlano
              cartoes={semData}
              puxar={(id) => aplicarPlano((q) => editarCartao(q, id, { data: dia })) && setAviso("Cartão colocado no calendário.")}
            />
          )}
        </section>
      </div>

      {aberto?.tipo === "novo" && (
        <ModalEvento
          inicial={{ data: aberto.data, calendarioId: calendarioNovo }}
          calendarios={agenda.calendarios}
          bloqueado={bloqueado}
          salvar={(d) => aplicar((a) => criarEvento(a, d))}
          criarNoPlano={(d) => {
            const cal = agenda.calendarios.find((c) => c.id === d.calendarioId);
            if (planoBloqueado) {
              setAviso("O Plano não pôde ser lido; crie como evento.");
              return false;
            }
            return aplicarPlano((q) => adicionar(q, { coluna: "agenda", titulo: d.titulo, data: d.data, hora: d.hora, descricao: d.descricao, projeto: cal?.projeto || "" }));
          }}
          fechar={() => setAberto(null)}
        />
      )}
      {eventoAberto && (
        <ModalEvento
          evento={eventoAberto}
          inicial={{ data: eventoAberto.data, calendarioId: eventoAberto.calendarioId }}
          calendarios={agenda.calendarios}
          bloqueado={bloqueado}
          salvar={(d) => aplicar((a) => editarEvento(a, eventoAberto.id, d))}
          criarNoPlano={() => false}
          remover={() => aplicar((a) => removerEvento(a, eventoAberto.id))}
          fechar={() => setAberto(null)}
        />
      )}
      {cartaoAberto && (
        <ModalCartao
          cartao={cartaoAberto}
          calendario={agenda.calendarios.find((c) => c.id === calendarioDoCartao(agenda, cartaoAberto))}
          bloqueado={planoBloqueado}
          editar={(p) => aplicarPlano((q) => editarCartao(q, cartaoAberto.id, p))}
          mover={(col) => aplicarPlano((q) => mover(q, cartaoAberto.id, col, Infinity))}
          fechar={() => setAberto(null)}
        />
      )}
      {aberto?.tipo === "calendario" && (
        <ModalCalendario
          calendario={calendarioAberto}
          projetos={listaProjetos}
          usados={agenda.calendarios.filter((c) => c.id !== calendarioAberto?.id).map((c) => c.projeto).filter(Boolean)}
          salvar={(d) => {
            if (calendarioAberto) return aplicar((a) => editarCalendario(a, calendarioAberto.id, d));
            let novoId = "";
            const ok = aplicar((a) => {
              const prox = criarCalendario(a, d);
              novoId = prox.calendarios.at(-1)!.id;
              return prox;
            });
            if (ok) setVisiveis((v) => new Set(v).add(novoId));
            return ok;
          }}
          remover={calendarioAberto && calendarioAberto.id !== PESSOAL ? () => aplicar((a) => removerCalendario(a, calendarioAberto.id)) : undefined}
          eventos={calendarioAberto ? agenda.eventos.filter((e) => e.calendarioId === calendarioAberto.id).length : 0}
          fechar={() => setAberto(null)}
        />
      )}
    </InternalShell>
  );
}

function PuxarDoPlano({ cartoes, puxar }: { cartoes: { id: string; titulo: string; projeto: string }[]; puxar: (id: string) => void }) {
  const [id, setId] = useState("");
  return (
    <div className="mt-5 border-t border-white/[0.07] pt-4">
      <label htmlFor="puxar" className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
        <KanbanSquare size={13} /> Trazer cartão do Plano para este dia
      </label>
      <div className="flex gap-2">
        <select id="puxar" value={id} onChange={(e) => setId(e.target.value)} className={cn(campo, "min-w-0 flex-1")}>
          <option value="">{cartoes.length} sem data…</option>
          {cartoes.map((c) => <option key={c.id} value={c.id}>{c.projeto ? `${c.projeto}: ` : ""}{c.titulo}</option>)}
        </select>
        <button type="button" disabled={!id} onClick={() => { puxar(id); setId(""); }} className="h-10 shrink-0 rounded-lg border border-white/15 px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40">Trazer</button>
      </div>
    </div>
  );
}

function ModalCalendario({
  calendario, projetos, usados, salvar, remover, eventos, fechar,
}: {
  calendario?: Calendario;
  projetos: string[];
  usados: string[];
  salvar: (d: { nome: string; cor: string; projeto: string }) => boolean;
  remover?: () => boolean;
  eventos: number;
  fechar: () => void;
}) {
  const [nome, setNome] = useState(calendario?.nome ?? "");
  const [cor, setCor] = useState(calendario?.cor ?? CORES[1]);
  const [projeto, setProjeto] = useState(calendario?.projeto ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const ehPessoal = calendario?.id === PESSOAL;
  const opcoes = projetos.filter((p) => !usados.includes(p) || p === calendario?.projeto);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (salvar({ nome, cor, projeto })) fechar();
  }

  return (
    <Janela titulo={calendario ? "Editar calendário" : "Calendário de cliente"} fechar={fechar}>
      <form onSubmit={enviar} className="space-y-4 p-5">
        <div>
          <label htmlFor="cal-nome" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Nome</label>
          <input id="cal-nome" autoFocus required maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Ex.: Lopes Veículos" />
        </div>
        {!ehPessoal && (
          <div>
            <label htmlFor="cal-projeto" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Projeto do Plano ligado</label>
            <input id="cal-projeto" list="cal-projetos" maxLength={60} value={projeto} onChange={(e) => setProjeto(e.target.value)} className={campo} placeholder="Nenhum" />
            <datalist id="cal-projetos">{opcoes.map((p) => <option key={p} value={p} />)}</datalist>
            <p className="mt-1.5 text-[12.5px] text-white/50">Cartões do Plano com este projeto e com data aparecem neste calendário.</p>
          </div>
        )}
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Cor</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
            {CORES.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cor === c} aria-label={c} onClick={() => setCor(c)} className={cn("h-8 w-8 rounded-full transition-transform", cor === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#161A22]" : "hover:scale-105")} style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="submit" className="h-10 rounded-lg bg-white px-5 text-[14px] font-semibold text-[#0B0D12] hover:bg-white/90">{calendario ? "Salvar" : "Criar"}</button>
          <button type="button" onClick={fechar} className="h-10 rounded-lg px-4 text-[14px] text-white/70 hover:bg-white/10">Cancelar</button>
          {remover && (confirmar ? (
            <span className="ml-auto flex flex-wrap items-center gap-2 text-[13px]">
              {eventos ? `Apaga ${eventos} evento${eventos > 1 ? "s" : ""}. Continuar?` : "Excluir mesmo?"}
              <button type="button" onClick={() => remover() && fechar()} className="h-9 rounded-lg bg-red-500/90 px-3 font-semibold">Excluir</button>
              <button type="button" onClick={() => setConfirmar(false)} className="h-9 rounded-lg px-2 text-white/70 hover:bg-white/10">Não</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-[14px] text-red-300 hover:bg-red-500/15"><Trash2 size={16} /> Excluir</button>
          ))}
        </div>
      </form>
    </Janela>
  );
}
