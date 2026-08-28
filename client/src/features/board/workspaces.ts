import type { BoardState, BoardWorkspace, WorkspacesState } from "./types";
import {
  defaultStorage,
  isBoardLists,
  loadLegacyBoard,
  newId,
  seedBoard,
  type BoardStorage,
} from "./store";
import { planBoard } from "./plan";

const STORAGE_KEY = "mf-board:v2";

export const PLAN_WORKSPACE_NAME = "Plano de marketing";

/** Nome do workspace que recebe o board único de quem já usava a versão anterior. */
const FIRST_WORKSPACE_NAME = "Meu board";

export function newWorkspace(
  name: string,
  lists: BoardWorkspace["lists"] = seedBoard().lists
): BoardWorkspace {
  return { id: newId(), name, lists };
}

/** O plano comercial como workspace próprio, para não se misturar ao board do dia. */
export function planWorkspace(): BoardWorkspace {
  return newWorkspace(PLAN_WORKSPACE_NAME, planBoard().lists);
}

/**
 * Estado inicial: o board de trabalho (o antigo, quando existe) e o plano de
 * marketing ao lado dele. Quem abre cai no board de trabalho, não no plano.
 */
export function seedWorkspaces(existing?: BoardState | null): WorkspacesState {
  const first = newWorkspace(FIRST_WORKSPACE_NAME, existing?.lists);
  return { workspaces: [first, planWorkspace()], activeId: first.id };
}

export function activeWorkspace(state: WorkspacesState): BoardWorkspace {
  return (
    state.workspaces.find(ws => ws.id === state.activeId) ?? state.workspaces[0]
  );
}

/** Aplica uma operação de board (as de store.ts) só no workspace ativo. */
export function mapActive(
  state: WorkspacesState,
  update: (board: BoardState) => BoardState
): WorkspacesState {
  const active = activeWorkspace(state);
  if (!active) return state;
  const next = update({ lists: active.lists });
  if (next.lists === active.lists) return state;
  return {
    ...state,
    workspaces: state.workspaces.map(ws =>
      ws.id === active.id ? { ...ws, lists: next.lists } : ws
    ),
  };
}

export function selectWorkspace(
  state: WorkspacesState,
  id: string
): WorkspacesState {
  if (!state.workspaces.some(ws => ws.id === id)) return state;
  return { ...state, activeId: id };
}

/** Cria o workspace no fim da fila e já entra nele. */
export function addWorkspace(
  state: WorkspacesState,
  name: string,
  lists?: BoardWorkspace["lists"]
): WorkspacesState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  const created = newWorkspace(trimmed, lists);
  return {
    workspaces: [...state.workspaces, created],
    activeId: created.id,
  };
}

export function renameWorkspace(
  state: WorkspacesState,
  id: string,
  name: string
): WorkspacesState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return {
    ...state,
    workspaces: state.workspaces.map(ws =>
      ws.id === id ? { ...ws, name: trimmed } : ws
    ),
  };
}

/**
 * Remove o workspace. O último nunca sai — sem nenhum não haveria board para
 * mostrar. Saindo o ativo, o vizinho da esquerda assume.
 */
export function removeWorkspace(
  state: WorkspacesState,
  id: string
): WorkspacesState {
  if (state.workspaces.length <= 1) return state;
  const index = state.workspaces.findIndex(ws => ws.id === id);
  if (index === -1) return state;
  const workspaces = state.workspaces.filter(ws => ws.id !== id);
  const activeId =
    state.activeId === id
      ? workspaces[Math.max(0, index - 1)].id
      : state.activeId;
  return { workspaces, activeId };
}

function isWorkspacesState(value: unknown): value is WorkspacesState {
  if (typeof value !== "object" || value === null) return false;
  const { workspaces, activeId } = value as Partial<WorkspacesState>;
  if (!Array.isArray(workspaces) || workspaces.length === 0) return false;
  if (typeof activeId !== "string") return false;
  return workspaces.every(ws => {
    if (typeof ws !== "object" || ws === null) return false;
    const { id, name, lists } = ws as Partial<BoardWorkspace>;
    return (
      typeof id === "string" && typeof name === "string" && isBoardLists(lists)
    );
  });
}

/**
 * Lê os workspaces; na primeira vez, migra o board único salvo antes e semeia o
 * plano de marketing ao lado dele. A migração roda só enquanto não há v2 —
 * depois disso, apagar o plano é uma decisão que fica de pé.
 */
export function loadWorkspaces(
  storage: BoardStorage | null = defaultStorage()
): WorkspacesState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isWorkspacesState(parsed)) {
        // activeId pode apontar para um workspace que sumiu em outra aba.
        return parsed.workspaces.some(ws => ws.id === parsed.activeId)
          ? parsed
          : { ...parsed, activeId: parsed.workspaces[0].id };
      }
    }
  } catch {
    // JSON quebrado: cai na migração/seed abaixo.
  }
  return seedWorkspaces(loadLegacyBoard(storage));
}

export function saveWorkspaces(
  state: WorkspacesState,
  storage: BoardStorage | null = defaultStorage()
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage cheio ou bloqueado: o board segue funcionando só em memória
  }
}
