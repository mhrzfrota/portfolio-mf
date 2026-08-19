import type { Habit, HabitStats, HabitsState } from "./types";

/** Subconjunto de Storage que os hábitos usam; injetável para testes. */
export type HabitsStorage = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "mf-habits:v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

/* ---------- Datas ----------
   Tudo em ISO YYYY-MM-DD no fuso local. `toISOString()` está fora de cogitação:
   ele converte para UTC e, em Fortaleza (UTC-3), viraria o dia às 21h. */

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Soma (ou subtrai) dias a uma data ISO, atravessando meses e anos. */
export function shiftISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return toISODate(new Date(year, month - 1, day + days));
}

/** Janela de `count` dias terminando em `end`, do mais antigo ao mais recente. */
export function lastDays(count: number, end: string): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftISO(end, index - (count - 1))
  );
}

/** Dia da semana: 0 = domingo, como `Date#getDay`. */
export function weekdayOf(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/* ---------- Mutações ---------- */

export function seedHabits(today: string = todayISO()): HabitsState {
  return {
    habits: ["Tomar creatina", "Ler 20 páginas", "Treinar"].map(name => ({
      id: newId(),
      name,
      createdAt: today,
      done: [],
    })),
  };
}

export function addHabit(
  state: HabitsState,
  name: string,
  today: string = todayISO()
): HabitsState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return {
    habits: [
      ...state.habits,
      { id: newId(), name: trimmed, createdAt: today, done: [] },
    ],
  };
}

export function renameHabit(
  state: HabitsState,
  habitId: string,
  name: string
): HabitsState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return {
    habits: state.habits.map(habit =>
      habit.id === habitId ? { ...habit, name: trimmed } : habit
    ),
  };
}

export function removeHabit(state: HabitsState, habitId: string): HabitsState {
  return { habits: state.habits.filter(habit => habit.id !== habitId) };
}

/** Marca/desmarca um dia. Marcar um dia anterior à criação recua o `createdAt`,
    senão o relatório contaria uma marcação fora da própria janela do hábito. */
export function toggleDay(
  state: HabitsState,
  habitId: string,
  date: string
): HabitsState {
  return {
    habits: state.habits.map(habit => {
      if (habit.id !== habitId) return habit;
      const marked = habit.done.includes(date);
      return {
        ...habit,
        createdAt: !marked && date < habit.createdAt ? date : habit.createdAt,
        done: marked
          ? habit.done.filter(day => day !== date)
          : [...habit.done, date],
      };
    }),
  };
}

export function reorderHabits(
  state: HabitsState,
  habitId: string,
  toIndex: number
): HabitsState {
  const from = state.habits.findIndex(habit => habit.id === habitId);
  if (from === -1) return state;
  const habits = [...state.habits];
  const [habit] = habits.splice(from, 1);
  const index = Math.max(0, Math.min(toIndex, habits.length));
  habits.splice(index, 0, habit);
  return { habits };
}

/* ---------- Leitura e relatórios ---------- */

export function isDone(habit: Habit, date: string): boolean {
  return habit.done.includes(date);
}

/** Quantos hábitos foram marcados num dia. */
export function doneOn(state: HabitsState, date: string): number {
  return state.habits.filter(habit => isDone(habit, date)).length;
}

/** Hábitos que já existiam no dia — o denominador honesto de "3 de 5". */
export function activeOn(state: HabitsState, date: string): Habit[] {
  return state.habits.filter(habit => habit.createdAt <= date);
}

export function currentStreak(habit: Habit, today: string): number {
  const done = new Set(habit.done);
  // Hoje ainda pode ser marcado mais tarde: se estiver em aberto, a sequência
  // é contada a partir de ontem em vez de zerar no meio do dia.
  let cursor = done.has(today) ? today : shiftISO(today, -1);
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = shiftISO(cursor, -1);
  }
  return streak;
}

export function bestStreak(habit: Habit): number {
  const days = Array.from(new Set(habit.done)).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous !== null && shiftISO(previous, 1) === day ? run + 1 : 1;
    previous = day;
    if (run > best) best = run;
  }
  return best;
}

export function statsFor(
  habit: Habit,
  windowDays: number,
  today: string
): HabitStats {
  const window = lastDays(windowDays, today).filter(
    day => day >= habit.createdAt
  );
  const done = window.filter(day => isDone(habit, day)).length;
  return {
    done,
    total: window.length,
    rate: window.length ? done / window.length : 0,
    streak: currentStreak(habit, today),
    best: bestStreak(habit),
  };
}

/* ---------- Persistência ---------- */

function isHabitsState(value: unknown): value is HabitsState {
  if (typeof value !== "object" || value === null) return false;
  const habits = (value as { habits?: unknown }).habits;
  if (!Array.isArray(habits)) return false;
  return habits.every(habit => {
    if (typeof habit !== "object" || habit === null) return false;
    const { id, name, createdAt, done } = habit as Partial<Habit>;
    if (typeof id !== "string" || typeof name !== "string") return false;
    if (typeof createdAt !== "string") return false;
    return Array.isArray(done) && done.every(day => typeof day === "string");
  });
}

function defaultStorage(): HabitsStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadHabits(
  storage: HabitsStorage | null = defaultStorage(),
  today: string = todayISO()
): HabitsState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return seedHabits(today);
    const parsed: unknown = JSON.parse(raw);
    return isHabitsState(parsed) ? parsed : seedHabits(today);
  } catch {
    return seedHabits(today);
  }
}

export function saveHabits(
  state: HabitsState,
  storage: HabitsStorage | null = defaultStorage()
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage cheio ou bloqueado: a tela segue funcionando só em memória
  }
}
