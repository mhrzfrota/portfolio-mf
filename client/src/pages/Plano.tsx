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
import { Search, X } from "lucide-react";
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
 * Salva no navegador a cada mudança, como Hábitos e Financeiro.
 */
function PlanoConteudo({ userId }: { userId: string }) {
  const [inicial] = useState(() => lerInicial(userId));
  const [quadro, setQuadro] = useState<Quadro>(inicial.quadro);
  const bloqueado = Boolean(inicial.erro);
  const [aviso, setAviso] = useState(
    inicial.origem === "migrado" ? "Sua lista antiga veio para o quadro, junto com as pendências e ideias do vault." : "",
  );
  const [erro, setErro] = useState(inicial.erro);
  const [aberto, setAberto] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [etiquetas, setEtiquetas] = useState<EtiquetaId[]>([]);
  const [projeto, setProjeto] = useState("");

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
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
        <span>Ideias, referências, a fazer, agenda e feito, num quadro só.</span>
        {atrasados > 0 && <span className="rounded-full bg-red-500/25 px-2.5 py-0.5 text-[13px] text-red-100">{atrasados} atrasado{atrasados > 1 ? "s" : ""}</span>}
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative lg:w-72">
          <span className="sr-only">Buscar cartões</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cartões"
            className="h-10 w-full rounded-xl border border-white/15 bg-black/30 pl-9 pr-3 text-[14px] text-white placeholder:text-white/45 focus:border-white/40 focus:outline-none"
          />
        </label>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filtrar por etiqueta">
          {ETIQUETAS.map((e) => {
            const ativa = etiquetas.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setEtiquetas((a) => (ativa ? a.filter((x) => x !== e.id) : [...a, e.id]))}
                className={cn("h-8 shrink-0 rounded-md px-2.5 text-[12px] font-semibold text-white transition-opacity", ativa ? "ring-2 ring-white" : "opacity-55 hover:opacity-90")}
                style={{ background: e.cor }}
              >
                {e.nome}
              </button>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="filtro-projeto">
          Projeto
        </label>
        <select
          id="filtro-projeto"
          value={projeto}
          onChange={(e) => setProjeto(e.target.value)}
          className="h-10 rounded-xl border border-white/15 bg-black/30 px-3 text-[14px] text-white lg:ml-auto"
        >
          <option value="">Todos os projetos</option>
          {listaProjetos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {filtroAtivo && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setEtiquetas([]);
              setProjeto("");
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] text-white/80 hover:bg-white/10"
          >
            <X size={15} /> Limpar
          </button>
        )}
      </div>
      {filtroAtivo && <p className="mt-2 text-[13px] text-white/55">Com filtro ativo, arrastar fica desligado. Limpe o filtro para reorganizar.</p>}

      {(aviso || erro) && (
        <p role={erro ? "alert" : "status"} className={cn("mt-4 rounded-xl px-4 py-2.5 text-sm", erro ? "bg-red-500/20 text-red-100" : "bg-white/15 text-white")}>
          {erro || aviso}
        </p>
      )}

      {/* Quadro: ocupa a largura toda da tela e rola para o lado, como no Trello */}
      <div className="mt-6 ml-[calc(50%-50vw)] w-screen overflow-x-auto pb-6">
        <DndContext sensors={sensores} collisionDetection={closestCorners} onDragStart={aoComecar} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
          <div className="mx-auto flex w-max items-start gap-3 px-5 sm:px-8 xl:px-[max(2rem,calc((100vw-72rem)/2+2rem))]">
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
