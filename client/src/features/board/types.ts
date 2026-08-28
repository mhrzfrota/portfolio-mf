export interface BoardCard {
  id: string;
  text: string;
  /** Ausente equivale a não concluído — cartões salvos antes do check seguem válidos. */
  done?: boolean;
}

export interface BoardList {
  id: string;
  title: string;
  cards: BoardCard[];
}

export interface BoardState {
  lists: BoardList[];
}

/** Um board completo com nome próprio — o board tem vários, um de cada vez na tela. */
export interface BoardWorkspace {
  id: string;
  name: string;
  lists: BoardList[];
}

export interface WorkspacesState {
  workspaces: BoardWorkspace[];
  activeId: string;
}
