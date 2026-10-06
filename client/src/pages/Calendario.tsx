import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Cloud, CloudOff, LoaderCircle, Plus } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import { MenuCalendarios, ModalCalendario } from "@/components/calendario/calendarios";
import { Linha, PuxarDoPlano, dataPorExtenso, diaDaSemana } from "@/components/calendario/dia";
import Mes from "@/components/calendario/mes";
import { ModalCartao, ModalEvento } from "@/components/calendario/modal-evento";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  PESSOAL, calendarioDoCartao, cartoesSemData, criarCalendario, criarEvento, editarCalendario, editarEvento,
  gradeDoMes, hojeISO, itensEntre, mesDe, mudarMes, removerCalendario, removerEvento, somarDias, type Item,
} from "@/features/calendario/agenda";
import { useAgendaNuvem } from "@/features/calendario/use-agenda";
import { adicionar, carregarQuadro, editar as editarCartao, encontrar, mover, projetos, salvarQuadro, type Quadro } from "@/features/plano/quadro";
import { semente } from "@/features/plano/semente";

export default function CalendarioPagina() {
  const { user } = useAuth();
  return user ? <Conteudo key={user.id} userId={user.id} /> : null;
}

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const CHAVE_OCULTOS = (u: string) => `mf-calendario:ocultos:${u}`;
const diaCurto = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function lerQuadro(userId: string) {
  try {
    return carregarQuadro(localStorage, userId, () => semente());
  } catch {
    return { quadro: null, origem: "v2" as const, erro: "Não foi possível ler o Plano." };
  }
}

type Aberto = { tipo: "novo"; data: string } | { tipo: "evento"; id: string } | { tipo: "cartao"; id: string } | { tipo: "calendario"; id?: string } | null;

/**
 * Calendário do mês no estilo do iOS: o seu e um por cliente, com os cartões
 * do Plano que têm data aparecendo sozinhos. A agenda fica no Supabase; os
 * cartões vêm do Plano deste navegador.
 */
function Conteudo({ userId }: { userId: string }) {
  const [aviso, setAviso] = useState("");
  const { agenda, aplicar, estado, salvando } = useAgendaNuvem(userId, setAviso);
  const [inicialQuadro] = useState(() => lerQuadro(userId));
  const [quadro, setQuadro] = useState<Quadro | null>(inicialQuadro.quadro);
  const bloqueado = estado !== "pronto" && estado !== "local";
  const planoBloqueado = Boolean(inicialQuadro.erro) || !quadro;
  const [erroPlano, setErroPlano] = useState(inicialQuadro.erro);
  const erro =
    estado === "invalido" ? "O calendário salvo na nuvem está inválido. Recupere os dados antes de editar."
    : estado === "sem-conexao" ? "Sem conexão com a nuvem. Mostrando a última cópia deste navegador; a edição volta quando conectar."
    : erroPlano;

  const hoje = hojeISO();
  const [mes, setMes] = useState(mesDe(hoje));
  const [dia, setDia] = useState(hoje);
  const [aberto, setAberto] = useState<Aberto>(null);

  // Guarda os escondidos (não os visíveis): calendário novo, inclusive de outro aparelho, já aparece
  const [ocultos, setOcultos] = useState<Set<string>>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE_OCULTOS(userId)) ?? "null");
      if (Array.isArray(v)) return new Set(v.filter((x): x is string => typeof x === "string"));
    } catch {
      /* sem preferência salva */
    }
    return new Set();
  });
  const visiveis = useMemo(() => new Set(agenda.calendarios.map((c) => c.id).filter((id) => !ocultos.has(id))), [agenda, ocultos]);
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_OCULTOS(userId), JSON.stringify(Array.from(ocultos)));
    } catch {
      /* preferência só da visita */
    }
  }, [ocultos, userId]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  function aplicarPlano(op: (q: Quadro) => Quadro): boolean {
    if (planoBloqueado || !quadro) return false;
    try {
      const prox = op(quadro);
      if (!salvarQuadro(localStorage, userId, prox)) {
        setErroPlano("Não foi possível salvar o Plano neste navegador.");
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
  const fimProximos = somarDias(dia, 14);
  const itens = useMemo(() => {
    const inicioGrade = grade[0][0];
    const fimGrade = grade.at(-1)!.at(-1)!;
    return itensEntre(agenda, quadro, inicioGrade < dia ? inicioGrade : dia, fimGrade > fimProximos ? fimGrade : fimProximos, visiveis);
  }, [agenda, quadro, grade, visiveis, dia, fimProximos]);
  const porDia = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) m.set(i.data, [...(m.get(i.data) ?? []), i]);
    return m;
  }, [itens]);
  const doDia = porDia.get(dia) ?? [];
  const proximos = useMemo(() => itens.filter((i) => i.data > dia && i.data <= fimProximos && !i.feito).slice(0, 8), [itens, dia, fimProximos]);
  const semData = useMemo(() => cartoesSemData(quadro), [quadro]);
  const listaProjetos = useMemo(() => (quadro ? projetos(quadro) : []), [quadro]);
  const somenteUm = visiveis.size === 1 ? agenda.calendarios.find((c) => visiveis.has(c.id)) : undefined;
  const calendarioNovo = somenteUm?.id ?? PESSOAL;
  const calendarioDe = (id: string) => agenda.calendarios.find((c) => c.id === id);

  const irPara = useCallback((novoMes: string) => {
    setMes(novoMes);
    setDia(novoMes === mesDe(hoje) ? hoje : `${novoMes}-01`);
  }, [hoje]);
  const selecionar = (d: string) => {
    setDia(d);
    if (!d.startsWith(mes)) setMes(mesDe(d));
  };
  function abrir(i: Item) {
    setAberto(i.origem === "evento" ? { tipo: "evento", id: i.id } : { tipo: "cartao", id: i.id });
  }
  function alternarFeito(i: Item) {
    if (i.origem === "evento") aplicar((a) => editarEvento(a, i.id, { feito: !i.feito }));
    else aplicarPlano((q) => mover(q, i.id, i.feito ? "fazer" : "feito", Infinity));
  }

  // Atalhos: ← → mês, T hoje, N novo
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (aberto || e.metaKey || e.ctrlKey || e.altKey) return;
      // Digitando num campo ou com o menu aberto, a tecla é do campo
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "ArrowLeft") irPara(mudarMes(mes, -1));
      else if (e.key === "ArrowRight") irPara(mudarMes(mes, 1));
      else if (e.key.toLowerCase() === "t") irPara(mesDe(hoje));
      else if (e.key.toLowerCase() === "n" && !bloqueado) setAberto({ tipo: "novo", data: dia });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, mes, dia, hoje, bloqueado, irPara]);

  const eventoAberto = aberto?.tipo === "evento" ? agenda.eventos.find((e) => e.id === aberto.id) : undefined;
  const cartaoAberto = aberto?.tipo === "cartao" && quadro ? encontrar(quadro, aberto.id) : null;
  const calendarioAberto = aberto?.tipo === "calendario" ? calendarioDe(aberto.id ?? "") : undefined;
  const ano = mes.slice(0, 4);
  const numMes = Number(mes.slice(5));

  return (
    <InternalShell title="Calendário">
      {/* Barra do mês */}
      <div className="flex flex-wrap items-center gap-2 pb-3 sm:gap-3">
        <h1 className="mr-auto text-[26px] font-bold leading-none tracking-tight sm:text-[30px]">
          {MESES[numMes - 1]} <span className="font-normal text-white/40">{ano}</span>
        </h1>
        <span className="hidden items-center gap-1.5 text-[12px] text-white/45 md:flex" role="status" title="Onde a agenda está salva">
          {estado === "carregando" ? <><LoaderCircle size={13} className="animate-spin" /> carregando</>
            : estado === "pronto" ? (salvando ? <><LoaderCircle size={13} className="animate-spin" /> salvando</> : <><Cloud size={13} /> salvo</>)
            : estado === "local" ? <><CloudOff size={13} className="text-[#FF9F0A]" /> só neste navegador</>
            : <><CloudOff size={13} className="text-[#FF9F0A]" /> sem nuvem</>}
        </span>
        <MenuCalendarios
          calendarios={agenda.calendarios}
          visiveis={visiveis}
          alternar={(id) => setOcultos((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
          so={(id) => setOcultos(new Set(agenda.calendarios.map((c) => c.id).filter((x) => x !== id)))}
          todos={() => setOcultos(new Set())}
          editar={(id) => setAberto({ tipo: "calendario", id })}
          novo={() => setAberto({ tipo: "calendario" })}
          bloqueado={bloqueado}
        />
        <div className="flex items-center rounded-lg border border-white/[0.1] bg-white/[0.04]">
          <button type="button" onClick={() => irPara(mudarMes(mes, -1))} aria-label="Mês anterior" title="Mês anterior (←)" className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-white/[0.08]"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => irPara(mesDe(hoje))} title="Hoje (T)" className="h-9 border-x border-white/[0.1] px-3 text-[13.5px] font-medium hover:bg-white/[0.08]">Hoje</button>
          <button type="button" onClick={() => irPara(mudarMes(mes, 1))} aria-label="Próximo mês" title="Próximo mês (→)" className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-white/[0.08]"><ChevronRight size={18} /></button>
        </div>
        <button type="button" disabled={bloqueado} onClick={() => setAberto({ tipo: "novo", data: dia })} title="Novo evento (N)" aria-label="Novo evento" className="flex h-9 items-center gap-1.5 rounded-lg bg-[#0A84FF] px-2.5 text-[13.5px] font-semibold text-white hover:bg-[#2B95FF] disabled:opacity-40 sm:px-3.5">
          <Plus size={17} strokeWidth={2.5} /> <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      {(aviso || erro) && (
        <p role={erro ? "alert" : "status"} className={cn("mb-3 rounded-xl px-4 py-2.5 text-[13.5px]", erro ? "bg-[#FF453A]/15 text-[#FFB3AD]" : "bg-white/[0.08] text-white/90")}>
          {erro || aviso}
        </p>
      )}
      {somenteUm && (
        <p className="mb-3 flex items-center gap-2 text-[13px] text-white/60">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: somenteUm.cor }} /> Mostrando só {somenteUm.nome}
          <button type="button" onClick={() => setOcultos(new Set())} className="font-medium text-[#0A84FF]">Mostrar todos</button>
        </p>
      )}

      <div className="grid gap-4 lg:h-[calc(100dvh-10.5rem)] lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <Mes
          mes={mes}
          grade={grade}
          porDia={porDia}
          hoje={hoje}
          dia={dia}
          selecionar={selecionar}
          criar={(d) => { setDia(d); setAberto({ tipo: "novo", data: d }); }}
          mudar={(delta) => irPara(mudarMes(mes, delta))}
          bloqueado={bloqueado}
        />

        {/* Dia selecionado */}
        <aside className="flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-[#121318]" aria-label="Dia selecionado">
          <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-4">
            <div className="min-w-0">
              <p className={cn("text-[12px] font-semibold uppercase tracking-[0.06em]", dia === hoje ? "text-[#FF453A]" : "text-white/45")}>{dia === hoje ? "Hoje" : diaDaSemana(dia)}</p>
              <h2 className="mt-0.5 text-[21px] font-bold tracking-tight first-letter:uppercase">{dia === hoje ? `${diaDaSemana(dia)}, ${dataPorExtenso(dia)}` : dataPorExtenso(dia)}</h2>
            </div>
            <button type="button" disabled={bloqueado} onClick={() => setAberto({ tipo: "novo", data: dia })} aria-label="Novo evento neste dia" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[#0A84FF] hover:bg-white/[0.14] disabled:opacity-40">
              <Plus size={19} strokeWidth={2.5} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {doDia.length ? (
              <ul className="space-y-0.5">
                {doDia.map((i) => <Linha key={`${i.origem}-${i.id}`} i={i} calendario={calendarioDe(i.calendarioId)} abrir={() => abrir(i)} alternar={() => alternarFeito(i)} />)}
              </ul>
            ) : (
              <button type="button" disabled={bloqueado} onClick={() => setAberto({ tipo: "novo", data: dia })} className="mx-2 mt-1 w-[calc(100%-1rem)] rounded-xl border border-dashed border-white/[0.12] px-4 py-6 text-center text-[13.5px] text-white/45 hover:border-white/25 hover:text-white/70 disabled:hover:border-white/[0.12]">
                Nada marcado. Toque para adicionar.
              </button>
            )}

            {proximos.length > 0 && (
              <div className="mt-5">
                <p className="px-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/40">Próximos dias</p>
                <ul className="space-y-0.5">
                  {proximos.map((i) => (
                    <Linha key={`p-${i.origem}-${i.id}`} i={i} calendario={calendarioDe(i.calendarioId)} abrir={() => { selecionar(i.data); abrir(i); }} alternar={() => alternarFeito(i)} mostrarData={diaCurto(i.data)} />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!planoBloqueado && (
            <div className="px-2 pb-2">
              <PuxarDoPlano cartoes={semData} bloqueado={planoBloqueado} puxar={(id) => aplicarPlano((q) => editarCartao(q, id, { data: dia })) && setAviso("Cartão colocado neste dia.")} />
            </div>
          )}
        </aside>
      </div>

      {aberto?.tipo === "novo" && (
        <ModalEvento
          inicial={{ data: aberto.data, calendarioId: calendarioNovo }}
          calendarios={agenda.calendarios}
          bloqueado={bloqueado}
          salvar={(d) => aplicar((a) => criarEvento(a, d))}
          criarNoPlano={(d) => {
            if (planoBloqueado) {
              setAviso("O Plano não pôde ser lido; crie como evento.");
              return false;
            }
            const cal = calendarioDe(d.calendarioId);
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
          calendario={calendarioDe(calendarioDoCartao(agenda, cartaoAberto))}
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
          salvar={(d) => (calendarioAberto ? aplicar((a) => editarCalendario(a, calendarioAberto.id, d)) : aplicar((a) => criarCalendario(a, d)))}
          remover={calendarioAberto && calendarioAberto.id !== PESSOAL ? () => aplicar((a) => removerCalendario(a, calendarioAberto.id)) : undefined}
          eventos={calendarioAberto ? agenda.eventos.filter((e) => e.calendarioId === calendarioAberto.id).length : 0}
          bloqueado={bloqueado}
          fechar={() => setAberto(null)}
        />
      )}
    </InternalShell>
  );
}
