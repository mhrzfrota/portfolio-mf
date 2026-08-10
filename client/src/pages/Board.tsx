import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
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
} from "@/features/board/store";
import type { BoardList } from "@/features/board/types";

/** Posição de inserção durante o arrasto, para desenhar a linha-guia. */
interface DropTarget {
  listId: string;
  index: number;
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
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
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
        <p className="mono-label text-[11px] text-white/60">
          {totalCards} {totalCards === 1 ? "cartão" : "cartões"}
        </p>
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
            <header className="group flex items-center gap-2 px-4 pb-2 pt-4">
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
                    <span className="truncate text-[15px] font-semibold">
                      {list.title}
                    </span>
                    <Pencil
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 text-white/0 transition-colors group-hover:text-white/50"
                    />
                  </button>
                  <span className="mono-label ml-auto shrink-0 text-[11px] text-white/55">
                    {list.cards.length}
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
                  {editingCardId === card.id ? (
                    <CardTextarea
                      initial={card.text}
                      placeholder="Texto do cartão"
                      onCommit={text => {
                        setBoard(prev => editCard(prev, card.id, text));
                        setEditingCardId(null);
                      }}
                      onCancel={() => setEditingCardId(null)}
                    />
                  ) : (
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
                        dragCardId === card.id && "opacity-35"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => setEditingCardId(card.id)}
                          title="Editar cartão"
                          className="min-w-0 flex-1 whitespace-pre-wrap break-words text-left text-[14px] leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
                  )}
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
    </div>
  );
}
