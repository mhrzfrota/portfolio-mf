export interface BoardCard {
  id: string;
  text: string;
}

export interface BoardList {
  id: string;
  title: string;
  cards: BoardCard[];
}

export interface BoardState {
  lists: BoardList[];
}
