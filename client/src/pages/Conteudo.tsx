import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BookOpen, CalendarRange, Cloud, CloudOff, Columns3, Grid3x3, LoaderCircle, Search, X } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import { ColunaEtapa, FacePeca } from "@/components/conteudo/pecas";
import DetalhePeca from "@/components/conteudo/detalhe";
import Semana from "@/components/conteudo/semana";
import Formular from "@/components/conteudo/formular";
import Guia from "@/components/conteudo/guia";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  ANGULOS, ETAPAS,
  adicionar as adicionarPeca, adicionarItem, adicionarNota, adicionarTematica, alternarNotaFixada as alternarFixada,
  alternarItem, duplicar as duplicarPeca, editarMetricas, editarNota, editar as editarPeca, editarTematica,
  encontrar as encontrarPeca, filtrarPecas, mover as moverPeca, removerItem, removerNota, remover as removerPeca,
  removerTematica,
  type AnguloId, type EtapaId, type Estudio, type GrupoNota,
} from "@/features/conteudo/estudio";
import { useEstudioNuvem } from "@/features/conteudo/use-estudio";
import { semente } from "@/features/conteudo/semente";

type Vista = "quadro" | "semana" | "formular" | "guia";
const VISTAS: { id: Vista; nome: string; icone: typeof Columns3 }[] = [
  { id: "quadro", nome: "Quadro", icone: Columns3 },
  { id: "semana", nome: "Semana", icone: CalendarRange },
  { id: "formular", nome: "Formular", icone: Grid3x3 },
  { id: "guia", nome: "Guia", icone: BookOpen },
];
const lerVista = (): Vista => {
  const v = new URLSearchParams(window.location.search).get("ver");
  return VISTAS.some((x) => x.id === v) ? (v as Vista) : "quadro";
};

/** Todas as peças, de todas as etapas: para achar a que acabou de nascer. */
const ids = (e: Estudio) => new Set(ETAPAS.flatMap((x) => e.pecas[x.id].map((p) => p.id)));

export default function Conteudo() {
  const { user } = useAuth();
  return user ? <ConteudoNuvem key={user.id} userId={user.id} /> : null;
}

type Fonte = ReturnType<typeof useEstudioNuvem>;

function ConteudoNuvem({ userId }: { userId: string }) {
  const [aviso, setAviso] = useState("");
  return <ConteudoEstudio fonte={useEstudioNuvem(userId, setAviso)} aviso={aviso} setAviso={setAviso} />;
}

/** Só no pnpm dev: o estúdio com a semente, em memória, sem login nem banco. */
export function ConteudoPrevia() {
  const [aviso, setAviso] = useState("");
  const [estudio, setEstudio] = useState(semente);
  const aplicar = (op: (e: Estudio) => Estudio) => {
    try {
      setEstudio(op(estudio));
      return true;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível fazer isso.");
      return false;
    }
  };
  return <ConteudoEstudio fonte={{ estudio, aplicar, estado: "local", salvando: false } as Fonte} aviso={aviso} setAviso={setAviso} />;
}

/**
 * Estúdio de conteúdo: a esteira das peças (Quadro), a semana de publicação,
 * o cruzamento temática × ângulo que gera pauta (Formular) e as notas do
 * método, da voz e das narrativas (Guia). Salva no Supabase (tabela
 * `conteudo`); sem a tabela, no navegador.
 */
function ConteudoEstudio({ fonte, aviso, setAviso }: { fonte: Fonte; aviso: string; setAviso: (t: string) => void }) {
  const { estudio, aplicar, estado, salvando } = fonte;
  const bloqueado = estado !== "pronto" && estado !== "local";
  const erro =
    estado === "invalido" ? "O estúdio salvo está inválido. Recupere os dados antes de editar."
    : estado === "sem-conexao" ? "Sem conexão com a nuvem. Mostrando a última cópia deste navegador; a edição volta quando conectar."
    : "";
  const [vista, setVista] = useState<Vista>(lerVista);
  const [aberta, setAberta] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [anguloFiltro, setAnguloFiltro] = useState<AnguloId | "">("");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (vista === "quadro") url.searchParams.delete("ver");
    else url.searchParams.set("ver", vista);
    window.history.replaceState(null, "", url);
  }, [vista]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const tematicas = useMemo(() => new Map(estudio.tematicas.map((t) => [t.id, t])), [estudio.tematicas]);
  const filtroAtivo = Boolean(busca.trim() || anguloFiltro);
  // Filtro devolve a lista; o quadro precisa dela de volta por etapa, na mesma ordem
  const visivel = useMemo(() => {
    if (!filtroAtivo) return estudio;
    const lista = filtrarPecas(estudio, { busca, angulo: anguloFiltro || undefined });
    const pecas = Object.fromEntries(ETAPAS.map((x) => [x.id, lista.filter((p) => p.etapa === x.id)])) as Estudio["pecas"];
    return { ...estudio, pecas };
  }, [estudio, busca, anguloFiltro, filtroAtivo]);
  const total = useMemo(() => ETAPAS.reduce((n, e) => n + estudio.pecas[e.id].length, 0), [estudio]);
  const pecaAberta = aberta ? encontrarPeca(estudio, aberta) : null;
  const pecaArrastada = arrastando ? encontrarPeca(estudio, arrastando) : null;

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } }),
  );

  function aoSoltar({ active, over }: DragEndEvent) {
    setArrastando(null);
    if (!over) return;
    const id = String(active.id);
    const alvo = String(over.id);
    const destino = (over.data.current?.etapa ?? (alvo.startsWith("etapa:") ? alvo.slice(6) : null)) as EtapaId | null;
    if (!destino) return;
    const lista = estudio.pecas[destino];
    const indice = alvo.startsWith("etapa:") ? lista.length : Math.max(0, lista.findIndex((p) => p.id === alvo));
    const atual = encontrarPeca(estudio, id);
    if (atual && atual.etapa === destino && lista[indice]?.id === id) return;
    aplicar((e) => moverPeca(e, id, destino, indice));
  }

  /** Cria e já abre a peça nova. */
  function criarEAbrir(entrada: Parameters<typeof adicionarPeca>[1]): boolean {
    let nova: string | null = null;
    const ok = aplicar((e) => {
      const antes = ids(e);
      const prox = adicionarPeca(e, entrada);
      nova = [...ids(prox)].find((x) => !antes.has(x)) ?? null;
      return prox;
    });
    if (ok && nova) setAberta(nova);
    return ok;
  }

  return (
    <InternalShell title="Conteúdo">
      <div className="flex flex-wrap items-center gap-2 pb-3 sm:gap-3">
        <h1 className="mr-auto flex items-baseline gap-3 text-[26px] font-bold leading-none tracking-tight sm:text-[30px]">
          Conteúdo
          <span className="text-[13px] font-normal tracking-normal text-white/40">{total} peças</span>
          <span className="hidden items-center gap-1.5 text-[12px] font-normal tracking-normal text-white/45 md:inline-flex" role="status" title="Onde o estúdio está salvo">
            {estado === "carregando" ? <><LoaderCircle size={13} className="animate-spin" /> carregando</>
              : estado === "pronto" ? (salvando ? <><LoaderCircle size={13} className="animate-spin" /> salvando</> : <><Cloud size={13} /> salvo</>)
              : estado === "local" ? <><CloudOff size={13} className="text-[#FF9F0A]" /> só neste navegador</>
              : <><CloudOff size={13} className="text-[#FF9F0A]" /> sem nuvem</>}
          </span>
        </h1>
        <div role="tablist" aria-label="Vistas" className="flex w-full rounded-xl bg-white/[0.06] p-1 sm:w-auto">
          {VISTAS.map(({ id, nome, icone: Icone }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={vista === id}
              onClick={() => setVista(id)}
              className={cn("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors sm:flex-none", vista === id ? "bg-white/[0.14] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]" : "text-white/60 hover:text-white")}
            >
              <Icone size={14} className="shrink-0" /> {nome}
            </button>
          ))}
        </div>
      </div>

      {(aviso || erro) && (
        <p role={erro ? "alert" : "status"} className={cn("mb-3 rounded-xl px-4 py-2.5 text-[13.5px]", erro ? "bg-[#FF453A]/15 text-[#FFB3AD]" : "bg-white/[0.08] text-white/90")}>
          {erro || aviso}
        </p>
      )}

      {vista === "quadro" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Buscar peças</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar em título, gancho e roteiro" className="h-9 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] pl-9 pr-3 text-[13.5px] text-white placeholder:text-white/40 focus:border-[#0A84FF] focus:outline-none" />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por ângulo">
              {ANGULOS.map((a) => {
                const ativo = anguloFiltro === a.id;
                return (
                  <button key={a.id} type="button" aria-pressed={ativo} onClick={() => setAnguloFiltro(ativo ? "" : a.id)} className={cn("flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", ativo ? "border-transparent bg-white/[0.16] text-white" : "border-white/[0.1] text-white/65 hover:border-white/25")} title={a.serve}>
                    <span className="h-2 w-2 rounded-full" style={{ background: a.cor }} aria-hidden />
                    {a.nome}
                  </button>
                );
              })}
            </div>
            {filtroAtivo && (
              <button type="button" onClick={() => { setBusca(""); setAnguloFiltro(""); }} className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] text-white/60 hover:bg-white/[0.08] hover:text-white">
                <X size={14} /> Limpar
              </button>
            )}
          </div>
          {filtroAtivo && <p className="mb-2 text-[12.5px] text-white/45">Com filtro ativo, arrastar fica desligado.</p>}

          <div className="-mx-3 snap-x snap-mandatory overflow-x-auto px-3 pb-2 sm:-mx-6 sm:snap-none sm:px-6 [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
            <DndContext sensors={sensores} collisionDetection={closestCorners} onDragStart={(e) => setArrastando(String(e.active.id))} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
              <div className="flex w-max items-start gap-3">
                {ETAPAS.map((e) => (
                  <ColunaEtapa
                    key={e.id}
                    id={e.id}
                    titulo={e.titulo}
                    descricao={e.descricao}
                    pecas={visivel.pecas[e.id]}
                    tematicas={tematicas}
                    abrir={setAberta}
                    criar={(etapa, titulo) => aplicar((q) => adicionarPeca(q, { etapa, titulo }))}
                    arrasteDesligado={filtroAtivo || bloqueado}
                    bloqueado={bloqueado}
                  />
                ))}
              </div>
              {createPortal(<DragOverlay dropAnimation={null}>{pecaArrastada && <FacePeca p={pecaArrastada} tematica={tematicas.get(pecaArrastada.tematica)} arrastando />}</DragOverlay>, document.body)}
            </DndContext>
          </div>
        </>
      )}

      {vista === "semana" && (
        <Semana estudio={estudio} tematicas={tematicas} abrir={setAberta} bloqueado={bloqueado} criarNoDia={(data) => criarEAbrir({ etapa: "ideias", titulo: "Nova peça", data })} />
      )}

      {vista === "formular" && (
        <Formular
          estudio={estudio}
          abrir={setAberta}
          bloqueado={bloqueado}
          criar={({ tematica, angulo }) => {
            const a = ANGULOS.find((x) => x.id === angulo)!;
            const t = tematicas.get(tematica)!;
            criarEAbrir({ etapa: "ideias", titulo: `${a.nome}: ${t.nome}`, tematica, angulo, roteiro: a.esqueleto.map((s) => `${s}:\n`).join("\n") });
          }}
          tematicaAcoes={{
            adicionar: (nome) => aplicar((e) => adicionarTematica(e, { nome })),
            editar: (id, patch) => aplicar((e) => editarTematica(e, id, patch)),
            remover: (id) => aplicar((e) => removerTematica(e, id)),
          }}
        />
      )}

      {vista === "guia" && (
        <Guia
          estudio={estudio}
          bloqueado={bloqueado}
          acoes={{
            adicionar: (grupo: GrupoNota) => {
              let nova: string | null = null;
              const ok = aplicar((e) => {
                const antes = new Set(e.notas.map((n) => n.id));
                const prox = adicionarNota(e, { grupo, titulo: "Nova nota", texto: "" });
                nova = prox.notas.find((n) => !antes.has(n.id))?.id ?? null;
                return prox;
              });
              return ok ? nova : null;
            },
            editar: (id, patch) => aplicar((e) => editarNota(e, id, patch)),
            fixar: (id) => void aplicar((e) => alternarFixada(e, id)),
            remover: (id) => aplicar((e) => removerNota(e, id)),
          }}
        />
      )}

      {pecaAberta && (
        <DetalhePeca
          p={pecaAberta}
          tematicas={estudio.tematicas}
          bloqueado={bloqueado}
          acoes={{
            editar: (patch) => aplicar((e) => editarPeca(e, pecaAberta.id, patch)),
            mover: (etapa) => void aplicar((e) => moverPeca(e, pecaAberta.id, etapa, Number.MAX_SAFE_INTEGER)),
            metricas: (patch) => aplicar((e) => editarMetricas(e, pecaAberta.id, patch)),
            adicionarItem: (texto) => aplicar((e) => adicionarItem(e, pecaAberta.id, texto)),
            alternarItem: (itemId) => void aplicar((e) => alternarItem(e, pecaAberta.id, itemId)),
            removerItem: (itemId) => void aplicar((e) => removerItem(e, pecaAberta.id, itemId)),
            duplicar: () => {
              if (aplicar((e) => duplicarPeca(e, pecaAberta.id))) setAviso("Peça duplicada.");
            },
            remover: () => {
              if (aplicar((e) => removerPeca(e, pecaAberta.id))) {
                setAberta(null);
                setAviso("Peça excluída.");
              }
            },
            fechar: () => setAberta(null),
          }}
        />
      )}
    </InternalShell>
  );
}
