export interface Habit {
  id: string;
  name: string;
  /** ISO YYYY-MM-DD de criação — dias anteriores não entram nos relatórios. */
  createdAt: string;
  /** Dias marcados em ISO YYYY-MM-DD, sem ordem garantida. */
  done: string[];
}

export interface HabitsState {
  habits: Habit[];
}

/** Números de um hábito numa janela de dias (7, 30, …). */
export interface HabitStats {
  /** Dias marcados dentro da janela. */
  done: number;
  /** Dias da janela que já existiam (a partir de `createdAt`). */
  total: number;
  /** `done / total`, 0 quando a janela é anterior à criação. */
  rate: number;
  /** Sequência viva, contada de hoje (ou de ontem, se hoje ainda está aberto). */
  streak: number;
  /** Maior sequência já feita. */
  best: number;
}
