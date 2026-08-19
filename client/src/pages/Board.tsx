import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleCheckBig,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  addCard,
  addList,
  editCard,
  loadBoard,
  moveCard,
  removeCard,
  removeList,
  renameList,
  saveBoard,
  toggleCard,
} from "@/features/board/store";
import type { BoardCard, BoardList } from "@/features/board/types";

/** Posição de inserção durante o arrasto, para desenhar a linha-guia. */
interface DropTarget {
  listId: string;
  index: number;
}

/** Círculo de check reusado no cartão e no modal. */
function CheckCircle({
  done,
  onToggle,
  size = "sm",
}: {
  done: boolean;
  onToggle: () => void;
  size?: "sm" | "lg";
}) {
  return (
    <button
      onClick={event => {
        // No cartão o clique abre o modal; aqui ele para no círculo.
        event.stopPropagation();
        onToggle();
      }}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "Marcar como não concluído" : "Marcar como concluído"}
      title={done ? "Desmarcar" : "Concluir"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        size === "lg" ? "h-7 w-7" : "mt-px h-[18px] w-[18px]",
        done
          ? "border-white bg-white text-[var(--brand-blue-dark)]"
          : "border-white/45 text-transparent hover:border-white hover:bg-white/15"
      )}
    >
      <Check
        aria-hidden="true"
        className={cn(
          size === "lg" ? "h-4 w-4" : "h-3 w-3",
          "transition-transform duration-200",
          done ? "scale-100" : "scale-50"
        )}
        strokeWidth={3}
      />
    </button>
  );
}

/**
 * Modal de detalhe do cartão. Monta com animação de entrada e só desmonta
 * depois da animação de saída — por isso o fechamento passa por `requestClose`
 * em vez de chamar `onClose` direto.
 */
function CardModal({
  card,
  listTitle,
  onClose,
  onChangeText,
  onToggle,
  onDelete,
}: {
  card: BoardCard;
  listTitle: string;
  onClose: () => void;
  onChangeText: (text: string) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [text, setText] = useState(card.text);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // O textarea cresce com o conteúdo em vez de rolar dentro de si.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  return (
    <div
      onClick={event => {
        if (event.target === event.currentTarget) requestClose();
      }}
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-[#00104f]/55 p-3 backdrop-blur-md sm:items-center sm:p-6",
        closing ? "board-backdrop-out" : "board-backdrop-in"
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe do cartão"
        tabIndex={-1}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
        className={cn(
          "board-glass flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] text-white outline-none",
          closing ? "board-modal-out" : "board-modal-in"
        )}
      >
        <header className="flex items-center gap-3 px-5 pb-3 pt-5 sm:px-6">
          <CheckCircle done={!!card.done} onToggle={onToggle} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="mono-label text-[11px] text-white/60">{listTitle}</p>
            <p className="text-[13px] text-white/75">
              {card.done ? "Concluído" : "Em aberto"}
            </p>
          </div>
          <button
            onClick={requestClose}
            aria-label="Fechar"
            title="Fechar"
            className="shrink-0 rounded-full p-2 text-white/60 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 sm:px-6">
          <textarea
            ref={textareaRef}
            value={text}
            aria-label="Texto do cartão"
            onChange={event => {
              setText(event.target.value);
              onChangeText(event.target.value);
            }}
            className={cn(
              "w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none",
              card.done && "text-white/55 line-through"
            )}
          />
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 pb-5 pt-3 sm:px-6">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-white/55 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
          <button
            onClick={requestClose}
            className="mono-label rounded-full bg-white/15 px-5 py-2.5 text-[11px] transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Textarea que cresce com o conteúdo; commit no Enter, cancela no Escape.
 * Reusada para adicionar e editar cartões.
 */
function CardTextarea({
  initial = "",
  placeholder,
  onCommit,
  onCancel,
}: {
  initial?: string;
  placeholder: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const commit = () => {
    if (text.trim()) {
      onCommit(text);
    } else {
      onCancel();
    }
  };

  return (
    <textarea
      ref={ref}
      value={text}
      rows={2}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={event => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") onCancel();
      }}
      className="board-card w-full resize-none rounded-xl p-3 text-[14px] leading-snug text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-white/60"
    />
  );
}

export default function Board() {
  const [board, setBoard] = useState(() => loadBoard());
  const [addingListTitle, setAddingListTitle] = useState<string | null>(null);
  const [addingCardIn, setAddingCardIn] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Board · MF";
    return () => {
      document.title = previous;
    };
  }, []);

  const totalCards = board.lists.reduce(
    (sum, list) => sum + list.cards.length,
    0
  );

  /** Lista que contém o cartão aberto — o modal precisa do título dela. */
  const openList = openCardId
    ? board.lists.find(list => list.cards.some(card => card.id === openCardId))
    : undefined;
  const openCard = openList?.cards.find(card => card.id === openCardId);

  const endDrag = () => {
    setDragCardId(null);
    setDropTarget(null);
  };

  /** Só atualiza o alvo se mudou; dragover dispara continuamente. */
  const updateDropTarget = (listId: string, index: number) => {
    setDropTarget(prev =>
      prev?.listId === listId && prev.index === index ? prev : { listId, index }
    );
  };

  const handleDrop = () => {
    if (dragCardId && dropTarget) {
      setBoard(prev =>
        moveCard(prev, dragCardId, dropTarget.listId, dropTarget.index)
      );
    }
    endDrag();
  };

  const handleRemoveList = (list: BoardList) => {
    const ok =
      list.cards.length === 0 ||
      window.confirm(
        `Excluir a lista "${list.title}" e seus ${list.cards.length} cartões?`
      );
    if (ok) setBoard(prev => removeList(prev, list.id));
  };

  /** Linha-guia que mostra onde o cartão vai cair. */
  const dropLine = (listId: string, index: number) =>
    dragCardId && dropTarget?.listId === listId && dropTarget.index === index;

  return (
    <div className="board-bg relative flex h-dvh flex-col overflow-hidden font-sans text-white">
      {/* Luz atrás do vidro */}
      <div
        aria-hidden="true"
        className="board-blob left-[-10%] top-[-20%] h-[55vh] w-[55vh] bg-[var(--sky)]/45"
      />
      <div
        aria-hidden="true"
        className="board-blob bottom-[-25%] right-[-5%] h-[65vh] w-[65vh] bg-white/25 [animation-delay:-13s] [animation-duration:32s]"
      />

      {/* Topo */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pb-2 pt-4 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="board-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="mono-label text-[11px] text-white/60">MF · interno</p>
            <h1 className="text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[28px]">
              Board
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="mono-label hidden text-[11px] text-white/60 sm:block">
            {totalCards} {totalCards === 1 ? "cartão" : "cartões"}
          </p>
          <Link
            href="/habitos"
            className="board-glass mono-label flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <CircleCheckBig className="h-3.5 w-3.5" />
            Hábitos
          </Link>
        </div>
      </header>

      {/* Colunas */}
      <main className="relative z-10 flex flex-1 snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-6 pt-4 sm:snap-none sm:px-8">
        {board.lists.map((list, listIndex) => (
          <section
            key={list.id}
            style={{ animationDelay: `${listIndex * 70}ms` }}
            aria-label={list.title}
            onDragOver={event => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              updateDropTarget(list.id, list.cards.length);
            }}
            onDrop={event => {
              event.preventDefault();
              handleDrop();
            }}
            className={cn(
              "board-glass board-col-in flex max-h-full w-[85vw] max-w-[300px] shrink-0 snap-center flex-col rounded-[20px] transition-shadow sm:w-[300px]",
              dragCardId &&
                dropTarget?.listId === list.id &&
                "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)]"
            )}
          >
            <header className="board-col-head group mb-1 flex items-center gap-2 px-4 pb-3 pt-4">
              {renamingListId === list.id ? (
                <input
                  autoFocus
                  defaultValue={list.title}
                  aria-label="Renomear lista"
                  onBlur={event => {
                    setBoard(prev =>
                      renameList(prev, list.id, event.target.value)
                    );
                    setRenamingListId(null);
                  }}
                  onKeyDown={event => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") setRenamingListId(null);
                  }}
                  className="w-full min-w-0 rounded-lg bg-white/15 px-2 py-1 text-[15px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                />
              ) : (
                <>
                  <button
                    onClick={() => setRenamingListId(list.id)}
                    title="Renomear lista"
                    className="flex min-w-0 items-center gap-1.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">
                      {list.title}
                    </span>
                    <Pencil
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 text-white/0 transition-colors group-hover:text-white/50"
                    />
                  </button>
                  {/* Com algum cartão concluído o contador vira progresso. */}
                  <span className="mono-label ml-auto shrink-0 text-[11px] text-white/70">
                    {list.cards.some(card => card.done)
                      ? `${list.cards.filter(card => card.done).length}/${list.cards.length}`
                      : list.cards.length}
                  </span>
                  <button
                    onClick={() => handleRemoveList(list)}
                    aria-label={`Excluir lista ${list.title}`}
                    title="Excluir lista"
                    className="shrink-0 rounded-md p-1 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </header>

            <div className="flex min-h-10 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2">
              {list.cards.map((card, cardIndex) => (
                <div key={card.id}>
                  {dropLine(list.id, cardIndex) && (
                    <div className="mb-2 h-0.5 rounded-full bg-white/70" />
                  )}
                  <div
                    draggable
                    onDragStart={event => {
                      event.dataTransfer.setData("text/plain", card.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragCardId(card.id);
                    }}
                    onDragEnd={endDrag}
                    onDragOver={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      event.dataTransfer.dropEffect = "move";
                      updateDropTarget(list.id, cardIndex);
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDrop();
                    }}
                    className={cn(
                      "board-card group/card cursor-grab rounded-xl p-3 transition-opacity active:cursor-grabbing",
                      dragCardId === card.id && "opacity-35",
                      card.done && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle
                        done={!!card.done}
                        onToggle={() =>
                          setBoard(prev => toggleCard(prev, card.id))
                        }
                      />
                      <button
                        onClick={() => setOpenCardId(card.id)}
                        title="Abrir cartão"
                        className={cn(
                          "min-w-0 flex-1 whitespace-pre-wrap break-words text-left text-[14px] leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                          card.done && "text-white/60 line-through"
                        )}
                      >
                        {card.text}
                      </button>
                      <button
                        onClick={() =>
                          setBoard(prev => removeCard(prev, card.id))
                        }
                        aria-label="Excluir cartão"
                        title="Excluir cartão"
                        className="shrink-0 rounded-md p-0.5 text-white/0 transition-colors hover:!text-white focus-visible:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/card:text-white/45"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {dropLine(list.id, list.cards.length) && (
                <div className="h-0.5 rounded-full bg-white/70" />
              )}
            </div>

            <div className="px-3 pb-3 pt-1">
              {addingCardIn === list.id ? (
                <CardTextarea
                  placeholder="Escreva o cartão…"
                  onCommit={text => {
                    setBoard(prev => addCard(prev, list.id, text));
                    setAddingCardIn(null);
                  }}
                  onCancel={() => setAddingCardIn(null)}
                />
              ) : (
                <button
                  onClick={() => setAddingCardIn(list.id)}
                  className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar cartão
                </button>
              )}
            </div>
          </section>
        ))}

        {/* Nova lista */}
        <div className="w-[85vw] max-w-[300px] shrink-0 snap-center sm:w-[300px]">
          {addingListTitle !== null ? (
            <div className="board-glass rounded-[20px] p-3">
              <input
                autoFocus
                value={addingListTitle}
                placeholder="Nome da lista"
                aria-label="Nome da nova lista"
                onChange={event => setAddingListTitle(event.target.value)}
                onBlur={() => {
                  if (addingListTitle.trim()) {
                    setBoard(prev => addList(prev, addingListTitle));
                  }
                  setAddingListTitle(null);
                }}
                onKeyDown={event => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") setAddingListTitle(null);
                }}
                className="w-full rounded-lg bg-white/15 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-white/60"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingListTitle("")}
              className="board-glass flex w-full items-center gap-2 rounded-[20px] px-4 py-3.5 text-[14px] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Plus className="h-4 w-4" />
              Nova lista
            </button>
          )}
        </div>
      </main>

      {openCard && openList && (
        <CardModal
          key={openCard.id}
          card={openCard}
          listTitle={openList.title}
          onClose={() => setOpenCardId(null)}
          onChangeText={text =>
            setBoard(prev => editCard(prev, openCard.id, text))
          }
          onToggle={() => setBoard(prev => toggleCard(prev, openCard.id))}
          onDelete={() => {
            setBoard(prev => removeCard(prev, openCard.id));
            setOpenCardId(null);
          }}
        />
      )}
    </div>
  );
}
