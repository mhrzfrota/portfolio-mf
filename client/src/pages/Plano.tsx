import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Search, SlidersHorizontal, X } from "lucide-react";
import InternalShell from "@/components/InternalShell";
import Coluna from "@/components/plano/coluna";
import DetalheCartao from "@/components/plano/detalhe";
import { FaceCartao } from "@/components/plano/cartao";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  COLUNAS,
  ETIQUETAS,
  adicionar,
  adicionarItem,
  alternarItem,
  atrasado,
  carregarQuadro,
  duplicar,
  editar,
  editarItem,
  encontrar,
  filtrar,
  mover,
  projetos,
  remover,
  removerItem,
  salvarQuadro,
  type ColunaId,
  type EtiquetaId,
  type Quadro,
} from "@/features/plano/quadro";
import { semente } from "@/features/plano/semente";

export default function Plano() {
  const { user } = useAuth();
  return user ? <PlanoConteudo key={user.id} userId={user.id} /> : null;
}

function lerInicial(userId: string) {
  try {
    return carregarQuadro(localStorage, userId, () => semente());
  } catch {
    return { quadro: semente(), origem: "semente" as const, erro: "" };
  }
}

/**
 * Quadro no estilo Trello. Cinco colunas fixas, cartões arrastáveis (mouse,
 * toque e teclado), detalhe com etiquetas, projeto, data, link e checklist.
 * Salva no navegador a cada mudança.
 */
function PlanoConteudo({ userId }: { userId: string }) {
  const [inicial] = useState(() => lerInicial(userId));
  const [quadro, setQuadro] = useState<Quadro>(inicial.quadro);
  const bloqueado = Boolean(inicial.erro);
  const [aviso, setAviso] = useState(
    inicial.origem === "migrado" ? "Sua lista antiga veio para o quadro, junto com as pendências e ideias do vault." : "",
  );
  const [erro, setErro] = useState(inicial.erro);
  // Vindo do Calendário ("Abrir no Plano"), já abre o cartão
  const [aberto, setAberto] = useState<string | null>(() => {
    const id = new URLSearchParams(window.location.search).get("cartao");
    return id && encontrar(inicial.quadro, id) ? id : null;
  });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [etiquetas, setEtiquetas] = useState<EtiquetaId[]>([]);
  const [projeto, setProjeto] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Primeira abertura (semente ou migração): grava já no formato novo
  useEffect(() => {
    if (!bloqueado && inicial.origem !== "v2") salvarQuadro(localStorage, userId, inicial.quadro);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  /** Aplica uma operação pura e salva. Devolve false quando a regra recusa (a mensagem aparece na tela). */
  function aplicar(operacao: (q: Quadro) => Quadro): boolean {
    if (bloqueado) return false;
    try {
      const proximo = operacao(quadro);
      if (!salvarQuadro(localStorage, userId, proximo)) {
        setErro("Não foi possível salvar neste navegador. Verifique o espaço ou as permissões e tente de novo.");
        return false;
      }
      setQuadro(proximo);
      setErro("");
      return true;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível fazer isso.");
      return false;
    }
  }

  const filtroAtivo = Boolean(busca.trim() || etiquetas.length || projeto);
  const visivel = useMemo(
    () => (filtroAtivo ? filtrar(quadro, { busca, etiquetas, projeto: projeto || undefined }) : quadro),
    [quadro, busca, etiquetas, projeto, filtroAtivo],
  );
  const listaProjetos = useMemo(() => projetos(quadro), [quadro]);
  const total = useMemo(() => Object.values(quadro.colunas).reduce((n, l) => n + l.length, 0), [quadro]);
  const atrasados = useMemo(() => Object.values(quadro.colunas).flat().filter((c) => atrasado(c)).length, [quadro]);
  const cartaoAberto = aberto ? encontrar(quadro, aberto) : null;
  const cartaoArrastado = arrastando ? encontrar(quadro, arrastando) : null;

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Espaço pega o cartão pelo teclado; Enter fica livre para abrir o detalhe
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  function aoComecar(e: DragStartEvent) {
    setArrastando(String(e.active.id));
  }

  function aoSoltar({ active, over }: DragEndEvent) {
    setArrastando(null);
    if (!over) return;
    const id = String(active.id);
    const alvo = String(over.id);
    const destino = (over.data.current?.coluna ?? (alvo.startsWith("coluna:") ? alvo.slice(7) : null)) as ColunaId | null;
    if (!destino) return;
    const lista = quadro.colunas[destino];
    // Solto sobre um cartão: vai para a posição dele. Solto na área vazia da coluna: vai para o fim.
    const indice = alvo.startsWith("coluna:") ? lista.length : Math.max(0, lista.findIndex((c) => c.id === alvo));
    const atual = encontrar(quadro, id);
    if (atual && atual.coluna === destino && lista[indice]?.id === id) return;
    aplicar((q) => mover(q, id, destino, indice));
  }

  return (
    <InternalShell title="Plano">
      {/* Barra do quadro */}
      <div className="flex flex-wrap items-center gap-2 pb-3 sm:gap-3">
        <h1 className="mr-auto flex items-baseline gap-3 text-[26px] font-bold leading-none tracking-tight sm:text-[30px]">
          Plano
          <span className="text-[13px] font-normal tracking-normal text-white/40">{total} cartões</span>
          {atrasados > 0 && (
            <span className="rounded-full bg-[#FF453A]/15 px-2 py-0.5 text-[12px] font-semibold tracking-normal text-[#FF6961]">
              {atrasados} atrasado{atrasados > 1 ? "s" : ""}
            </span>
          )}
        </h1>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Buscar cartões</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar"
            className="h-9 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] pl-9 pr-3 text-[13.5px] text-white placeholder:text-white/40 focus:border-[#0A84FF] focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltrosAbertos((f) => !f)}
          aria-expanded={filtrosAbertos}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13.5px] font-medium",
            etiquetas.length || projeto ? "border-[#0A84FF]/60 bg-[#0A84FF]/15 text-white" : "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08]",
          )}
        >
          <SlidersHorizontal size={15} /> Filtros
          {(etiquetas.length > 0 || projeto) && <span className="rounded-full bg-[#0A84FF] px-1.5 text-[11px] font-semibold">{etiquetas.length + (projeto ? 1 : 0)}</span>}
        </button>
        {filtroAtivo && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setEtiquetas([]);
              setProjeto("");
            }}
            className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] text-white/60 hover:bg-white/[0.08] hover:text-white"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {filtrosAbertos && (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#121318] p-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por etiqueta">
            {ETIQUETAS.map((e) => {
              const ativa = etiquetas.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => setEtiquetas((a) => (ativa ? a.filter((x) => x !== e.id) : [...a, e.id]))}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
                    ativa ? "border-transparent text-white" : "border-white/[0.1] text-white/70 hover:border-white/25",
                  )}
                  style={ativa ? { background: e.cor } : undefined}
                >
                  {!ativa && <span className="h-2 w-2 rounded-full" style={{ background: e.cor }} />}
                  {e.nome}
                </button>
              );
            })}
          </div>
          <label className="sr-only" htmlFor="filtro-projeto">Projeto</label>
          <select
            id="filtro-projeto"
            value={projeto}
            onChange={(e) => setProjeto(e.target.value)}
            className="h-9 rounded-lg border border-white/[0.1] bg-[#1C1C1E] px-3 text-[13.5px] text-white [color-scheme:dark] sm:ml-auto"
          >
            <option value="">Todos os projetos</option>
            {listaProjetos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {(aviso || erro || filtroAtivo) && (
        <p role={erro ? "alert" : "status"} className={cn("mb-3 rounded-xl px-4 py-2.5 text-[13.5px]", erro ? "bg-[#FF453A]/15 text-[#FFB3AD]" : aviso ? "bg-white/[0.08] text-white/90" : "bg-transparent px-0 py-0 text-[12.5px] text-white/45")}>
          {erro || aviso || "Com filtro ativo, arrastar fica desligado. Limpe o filtro para reorganizar."}
        </p>
      )}

      {/* Quadro: colunas na altura da tela, rolando para o lado como no Trello */}
      <div className="-mx-3 snap-x snap-mandatory overflow-x-auto px-3 pb-2 sm:-mx-6 sm:snap-none sm:px-6 [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
        <DndContext sensors={sensores} collisionDetection={closestCorners} onDragStart={aoComecar} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
          <div className="flex w-max items-start gap-3">
            {COLUNAS.map((col) => (
              <Coluna
                key={col.id}
                id={col.id}
                titulo={col.titulo}
                descricao={col.descricao}
                cartoes={visivel.colunas[col.id]}
                abrir={setAberto}
                criar={(coluna, titulo) => aplicar((q) => adicionar(q, { coluna, titulo }))}
                arrasteDesligado={filtroAtivo || bloqueado}
                bloqueado={bloqueado}
              />
            ))}
          </div>
          {createPortal(<DragOverlay dropAnimation={null}>{cartaoArrastado && <FaceCartao c={cartaoArrastado} arrastando />}</DragOverlay>, document.body)}
        </DndContext>
      </div>

      {cartaoAberto && (
        <DetalheCartao
          c={cartaoAberto}
          projetos={listaProjetos}
          bloqueado={bloqueado}
          acoes={{
            editar: (patch) => aplicar((q) => editar(q, cartaoAberto.id, patch)),
            mover: (coluna) => aplicar((q) => mover(q, cartaoAberto.id, coluna, Number.MAX_SAFE_INTEGER)),
            adicionarItem: (texto) => aplicar((q) => adicionarItem(q, cartaoAberto.id, texto)),
            alternarItem: (itemId) => aplicar((q) => alternarItem(q, cartaoAberto.id, itemId)),
            editarItem: (itemId, texto) => aplicar((q) => editarItem(q, cartaoAberto.id, itemId, texto)),
            removerItem: (itemId) => aplicar((q) => removerItem(q, cartaoAberto.id, itemId)),
            duplicar: () => {
              if (aplicar((q) => duplicar(q, cartaoAberto.id))) setAviso("Cartão duplicado.");
            },
            remover: () => {
              if (aplicar((q) => remover(q, cartaoAberto.id))) {
                setAberto(null);
                setAviso("Cartão excluído.");
              }
            },
            fechar: () => setAberto(null),
          }}
        />
      )}
    </InternalShell>
  );
}
