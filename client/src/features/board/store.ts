import type { BoardCard, BoardList, BoardState } from "./types";

/** Subconjunto de Storage que o board usa; injetável para testes. */
export type BoardStorage = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "mf-board:v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export function seedBoard(): BoardState {
  return {
    lists: ["A fazer", "Fazendo", "Feito"].map(title => ({
      id: newId(),
      title,
      cards: [],
    })),
  };
}

export function addList(state: BoardState, title: string): BoardState {
  const trimmed = title.trim();
  if (!trimmed) return state;
  return {
    lists: [...state.lists, { id: newId(), title: trimmed, cards: [] }],
  };
}

export function renameList(
  state: BoardState,
  listId: string,
  title: string
): BoardState {
  const trimmed = title.trim();
  if (!trimmed) return state;
  return {
    lists: state.lists.map(list =>
      list.id === listId ? { ...list, title: trimmed } : list
    ),
  };
}

export function removeList(state: BoardState, listId: string): BoardState {
  return { lists: state.lists.filter(list => list.id !== listId) };
}

export function addCard(
  state: BoardState,
  listId: string,
  text: string
): BoardState {
  const trimmed = text.trim();
  if (!trimmed) return state;
  return {
    lists: state.lists.map(list =>
      list.id === listId
        ? { ...list, cards: [...list.cards, { id: newId(), text: trimmed }] }
        : list
    ),
  };
}

export function editCard(
  state: BoardState,
  cardId: string,
  text: string
): BoardState {
  const trimmed = text.trim();
  if (!trimmed) return state;
  return {
    lists: state.lists.map(list => ({
      ...list,
      cards: list.cards.map(card =>
        card.id === cardId ? { ...card, text: trimmed } : card
      ),
    })),
  };
}

export function removeCard(state: BoardState, cardId: string): BoardState {
  return {
    lists: state.lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => card.id !== cardId),
    })),
  };
}

export function moveCard(
  state: BoardState,
  cardId: string,
  toListId: string,
  toIndex?: number
): BoardState {
  const card = state.lists
    .flatMap(list => list.cards)
    .find(c => c.id === cardId);
  if (!card) return state;
  if (!state.lists.some(list => list.id === toListId)) return state;

  return {
    lists: state.lists.map(list => {
      const cards = list.cards.filter(c => c.id !== cardId);
      if (list.id !== toListId) return { ...list, cards };
      const index = Math.min(toIndex ?? cards.length, cards.length);
      return {
        ...list,
        cards: [...cards.slice(0, index), card, ...cards.slice(index)],
      };
    }),
  };
}

function isBoardState(value: unknown): value is BoardState {
  if (typeof value !== "object" || value === null) return false;
  const lists = (value as { lists?: unknown }).lists;
  if (!Array.isArray(lists)) return false;
  return lists.every(list => {
    if (typeof list !== "object" || list === null) return false;
    const { id, title, cards } = list as Partial<BoardList>;
    if (typeof id !== "string" || typeof title !== "string") return false;
    if (!Array.isArray(cards)) return false;
    return cards.every(
      (card: Partial<BoardCard>) =>
        typeof card === "object" &&
        card !== null &&
        typeof card.id === "string" &&
        typeof card.text === "string"
    );
  });
}

function defaultStorage(): BoardStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadBoard(
  storage: BoardStorage | null = defaultStorage()
): BoardState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return seedBoard();
    const parsed: unknown = JSON.parse(raw);
    return isBoardState(parsed) ? parsed : seedBoard();
  } catch {
    return seedBoard();
  }
}

export function saveBoard(
  state: BoardState,
  storage: BoardStorage | null = defaultStorage()
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage cheio ou bloqueado: o board segue funcionando só em memória
  }
}
