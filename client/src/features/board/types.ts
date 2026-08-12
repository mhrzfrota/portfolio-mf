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
