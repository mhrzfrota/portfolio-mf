import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  GripVertical,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import InternalAccount from "@/components/InternalAccount";
import { cn } from "@/lib/utils";
import {
  activeOn,
  addHabit,
  currentStreak,
  doneOn,
  isDone,
  lastDays,
  loadHabits,
  removeHabit,
  renameHabit,
  reorderHabits,
  saveHabits,
  shiftISO,
  statsFor,
  todayISO,
  toggleDay,
  weekdayOf,
} from "@/features/habits/store";
import type { Habit, HabitsState } from "@/features/habits/types";

/** Semanas mostradas no heatmap de cada hábito — meio ano. */
const HEATMAP_WEEKS = 26;

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function parseISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Hoje", "Ontem" ou a data por extenso — o cabeçalho do dia. */
function dayLabel(date: string, today: string): string {
  if (date === today) return "Hoje";
  if (date === shiftISO(today, -1)) return "Ontem";
  return dateFormat.format(parseISO(date)).replace(".,", ",");
}

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Círculo de check do dia — o gesto principal da tela, por isso é grande. */
function DayCheck({
  done,
  label,
  onToggle,
}: {
  done: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      title={done ? "Desmarcar o dia" : "Marcar o dia"}
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        done
          ? "border-white bg-white text-[var(--brand-blue-dark)] shadow-[0_6px_18px_rgba(0,16,80,0.25)]"
          : "border-white/60 text-transparent hover:border-white hover:bg-white/20"
      )}
    >
      <Check
        aria-hidden="true"
        className={cn(
          "h-6 w-6 transition-transform duration-200",
          done ? "scale-100" : "scale-50"
        )}
        strokeWidth={3}
      />
    </button>
  );
}

/** Fita dos últimos 7 dias de um hábito, do mais antigo ao dia mostrado. */
function WeekStrip({ habit, end }: { habit: Habit; end: string }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {lastDays(7, end).map(day => (
        <span
          key={day}
          className={cn(
            "h-1.5 w-4 rounded-full",
            isDone(habit, day) ? "bg-white" : "bg-white/25"
          )}
        />
      ))}
    </div>
  );
}

/** Linha de um hábito no dia selecionado. */
function HabitRow({
  habit,
  date,
  today,
  renaming,
  onStartRename,
  onRename,
  onCancelRename,
  onToggle,
  onDelete,
  dragProps,
  dragging,
}: {
  habit: Habit;
  date: string;
  today: string;
  renaming: boolean;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onToggle: () => void;
  onDelete: () => void;
  dragProps: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
  dragging: boolean;
}) {
  const done = isDone(habit, date);
  const streak = currentStreak(habit, today);

  return (
    <div
      {...dragProps}
      className={cn(
        "habit-card habit-row-in group flex items-center gap-4 rounded-2xl px-4 py-3.5",
        done && "habit-card-done",
        dragging && "opacity-40"
      )}
    >
      <DayCheck
        done={done}
        label={`${done ? "Desmarcar" : "Marcar"} ${habit.name} em ${date}`}
        onToggle={onToggle}
      />

      <div className="min-w-0 flex-1">
        {renaming ? (
          <input
            autoFocus
            defaultValue={habit.name}
            aria-label="Renomear hábito"
            onBlur={event => onRename(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") onCancelRename();
            }}
            className="w-full rounded-lg bg-white/20 px-2 py-1 text-[16px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          />
        ) : (
          <button
            onClick={onStartRename}
            title="Renomear hábito"
            className="block max-w-full truncate text-left text-[16px] font-semibold tracking-[-0.01em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {habit.name}
          </button>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <span
            className={cn(
              "mono-label flex items-center gap-1 text-[10px]",
              streak > 0 ? "text-white/85" : "text-white/50"
            )}
          >
            <Flame aria-hidden="true" className="h-3 w-3" />
            {streak > 0
              ? `${streak} ${streak === 1 ? "dia" : "dias"}`
              : "sem sequência"}
          </span>
          <WeekStrip habit={habit} end={date} />
        </div>
      </div>

      <span
        aria-hidden="true"
        className="hidden cursor-grab text-white/0 transition-colors group-hover:text-white/40 sm:block"
        title="Arraste para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <button
        onClick={onDelete}
        aria-label={`Excluir hábito ${habit.name}`}
        title="Excluir hábito"
        className="shrink-0 rounded-md p-1 text-white/0 transition-colors hover:!text-white focus-visible:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-hover:text-white/45"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Caixa de número do relatório. */
function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="habit-glass rounded-2xl px-4 py-3.5">
      <p className="mono-label text-[10px] text-white/65">{label}</p>
      <p className="mt-1 text-[26px] font-medium leading-none tracking-[-0.03em]">
        {value}
      </p>
      {hint && <p className="mt-1 text-[12px] text-white/60">{hint}</p>}
    </div>
  );
}

/** Calendário de 13 semanas: colunas são semanas, linhas são dias da semana. */
function Heatmap({ habit, today }: { habit: Habit; today: string }) {
  const days = useMemo(() => {
    // Fecha a grade no sábado da semana atual para as colunas ficarem alinhadas.
    const end = shiftISO(today, 6 - weekdayOf(today));
    const start = shiftISO(end, -(HEATMAP_WEEKS * 7 - 1));
    return Array.from({ length: HEATMAP_WEEKS * 7 }, (_, index) =>
      shiftISO(start, index)
    );
  }, [today]);

  const weeks = useMemo(
    () =>
      Array.from({ length: HEATMAP_WEEKS }, (_, week) =>
        days.slice(week * 7, week * 7 + 7)
      ),
    [days]
  );

  // No celular a grade é mais larga que a tela; abre já nas semanas recentes.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days]);

  return (
    <div ref={scrollerRef} className="overflow-x-auto pb-1">
      {/* As colunas dividem a largura do cartão; no celular a grade rola. */}
      <div className="flex min-w-[460px] gap-[3px]">
        <div className="mr-1 flex shrink-0 flex-col gap-[3px] pt-[18px]">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((initial, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="mono-label flex flex-1 items-center text-[8px] leading-none text-white/45"
            >
              {index % 2 === 1 ? initial : ""}
            </span>
          ))}
        </div>
        {weeks.map(week => {
          const first = week[0];
          const showMonth = parseISO(first).getDate() <= 7;
          return (
            <div key={first} className="flex flex-1 flex-col gap-[3px]">
              <span
                aria-hidden="true"
                className="mono-label h-[14px] text-[8px] leading-none text-white/50"
              >
                {showMonth
                  ? monthFormat.format(parseISO(first)).replace(".", "")
                  : ""}
              </span>
              {week.map(day => {
                // Fora da vida do hábito (antes de criado ou no futuro) a
                // célula fica oca: nada a cobrar num dia que não existia.
                const outside = day > today || day < habit.createdAt;
                const marked = isDone(habit, day);
                return (
                  <span
                    key={day}
                    title={`${dateFormat.format(parseISO(day))} — ${
                      outside ? "—" : marked ? "feito" : "não feito"
                    }`}
                    style={{ ["--level" as string]: marked ? 1 : 0 }}
                    className={cn(
                      "aspect-square w-full rounded-[3px]",
                      outside ? "habit-cell-future" : "habit-cell"
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Barras dos últimos 14 dias: quanto do dia foi cumprido no geral. */
function DailyBars({ state, today }: { state: HabitsState; today: string }) {
  const days = lastDays(14, today);
  return (
    <div className="habit-glass rounded-2xl p-4">
      <p className="mono-label text-[10px] text-white/65">Últimos 14 dias</p>
      <div className="mt-3 flex items-end gap-1.5">
        {days.map(day => {
          const total = activeOn(state, day).length;
          const done = doneOn(state, day);
          const rate = total ? done / total : 0;
          return (
            <div
              key={day}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                title={`${dateFormat.format(parseISO(day))} — ${done}/${total}`}
                className="flex h-16 w-full max-w-[22px] items-end overflow-hidden rounded-[5px] bg-white/15"
              >
                <div
                  className={cn(
                    "w-full rounded-t-[5px] bg-white/85 transition-[height] duration-300",
                    rate === 1 && "bg-white"
                  )}
                  style={{
                    height: `${Math.max(Math.round(rate * 100), total ? 6 : 0)}%`,
                  }}
                />
              </div>
              <span className="mono-label text-[8px] leading-none text-white/45">
                {parseISO(day).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Habits() {
  const [state, setState] = useState(() => loadHabits());
  const [tab, setTab] = useState<"hoje" | "relatorios">("hoje");
  const [date, setDate] = useState(() => todayISO());
  const [adding, setAdding] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const today = todayISO();

  useEffect(() => {
    saveHabits(state);
  }, [state]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Hábitos · MF";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    if (adding) addRef.current?.focus();
  }, [adding]);

  const visible = activeOn(state, date);
  const doneToday = visible.filter(habit => isDone(habit, date)).length;
  const dayRate = visible.length ? doneToday / visible.length : 0;

  const commitNewHabit = (name: string) => {
    setState(prev => addHabit(prev, name, today));
    setAdding(false);
  };

  const handleDelete = (habit: Habit) => {
    const ok =
      habit.done.length === 0 ||
      window.confirm(
        `Excluir "${habit.name}" e seus ${habit.done.length} dias marcados?`
      );
    if (ok) setState(prev => removeHabit(prev, habit.id));
  };

  /** Drag & drop nativo para reordenar, igual ao board. */
  const dragPropsFor = (habit: Habit, index: number) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      event.dataTransfer.setData("text/plain", habit.id);
      event.dataTransfer.effectAllowed = "move";
      setDragId(habit.id);
    },
    onDragEnd: () => setDragId(null),
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragId && dragId !== habit.id) {
        setState(prev => reorderHabits(prev, dragId, index));
      }
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragId(null);
    },
  });

  return (
    <div className="board-bg relative flex min-h-dvh flex-col font-sans text-white">
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
      <header className="relative z-10 mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="habit-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Voltar ao início"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="mono-label text-[11px] text-white/65">MF · interno</p>
            <h1 className="text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[28px]">
              Hábitos
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/board"
            className="habit-glass mono-label flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </Link>
          <InternalAccount surface="habits" />
        </div>
      </header>

      {/* Abas */}
      <div className="relative z-10 mx-auto w-full max-w-[760px] px-4 pt-3 sm:px-6">
        <div
          role="tablist"
          aria-label="Modo da tela"
          className="habit-glass inline-flex rounded-full p-1"
        >
          {(
            [
              ["hoje", "Hoje"],
              ["relatorios", "Relatórios"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "mono-label rounded-full px-4 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                tab === value
                  ? "bg-white text-[var(--brand-blue-dark)]"
                  : "text-white/70 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[760px] flex-1 px-4 pb-10 pt-4 sm:px-6">
        {tab === "hoje" ? (
          <div className="flex flex-col gap-3">
            {/* Dia + progresso */}
            <section className="habit-glass rounded-2xl px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDate(shiftISO(date, -1))}
                  aria-label="Dia anterior"
                  title="Dia anterior"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/85 transition-colors hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[17px] font-semibold tracking-[-0.01em]">
                    {dayLabel(date, today)}
                  </p>
                  <p className="mono-label text-[10px] text-white/65">
                    {dateFormat.format(parseISO(date)).replace(".,", ",")}
                  </p>
                </div>
                <button
                  onClick={() => setDate(shiftISO(date, 1))}
                  disabled={date >= today}
                  aria-label="Próximo dia"
                  title="Próximo dia"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/85 transition-colors hover:bg-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/15"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-300"
                    style={{ width: `${Math.round(dayRate * 100)}%` }}
                  />
                </div>
                <span className="mono-label shrink-0 text-[10px] text-white/80">
                  {doneToday}/{visible.length}
                </span>
              </div>
              {date !== today && (
                <button
                  onClick={() => setDate(today)}
                  className="mono-label mt-3 text-[10px] text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Voltar para hoje
                </button>
              )}
            </section>

            {/* Hábitos do dia */}
            {visible.length === 0 ? (
              <p className="habit-glass rounded-2xl px-4 py-6 text-center text-[14px] text-white/70">
                Nenhum hábito neste dia. Adicione um abaixo.
              </p>
            ) : (
              visible.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  date={date}
                  today={today}
                  renaming={renamingId === habit.id}
                  onStartRename={() => setRenamingId(habit.id)}
                  onRename={name => {
                    setState(prev => renameHabit(prev, habit.id, name));
                    setRenamingId(null);
                  }}
                  onCancelRename={() => setRenamingId(null)}
                  onToggle={() =>
                    setState(prev => toggleDay(prev, habit.id, date))
                  }
                  onDelete={() => handleDelete(habit)}
                  dragProps={dragPropsFor(habit, index)}
                  dragging={dragId === habit.id}
                />
              ))
            )}

            {/* Novo hábito */}
            {adding ? (
              <input
                ref={addRef}
                placeholder="Ex.: tomar creatina"
                aria-label="Nome do novo hábito"
                onBlur={event => {
                  if (event.target.value.trim()) {
                    commitNewHabit(event.target.value);
                  } else {
                    setAdding(false);
                  }
                }}
                onKeyDown={event => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") setAdding(false);
                }}
                className="habit-card w-full rounded-2xl px-4 py-4 text-[15px] text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/70"
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="habit-card flex w-full items-center gap-2 rounded-2xl px-4 py-4 text-[15px] text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Plus className="h-4 w-4" />
                Novo hábito
              </button>
            )}
          </div>
        ) : (
          <ReportsView state={state} today={today} />
        )}
      </main>
    </div>
  );
}

function ReportsView({ state, today }: { state: HabitsState; today: string }) {
  const habits = state.habits;

  if (habits.length === 0) {
    return (
      <p className="habit-glass rounded-2xl px-4 py-6 text-center text-[14px] text-white/70">
        Sem hábitos ainda — os relatórios aparecem depois da primeira marcação.
      </p>
    );
  }

  const stats = habits.map(habit => statsFor(habit, 30, today));
  const bestStreakNow = Math.max(...stats.map(item => item.streak));
  const bestEver = Math.max(...stats.map(item => item.best));
  const average =
    stats.reduce((sum, item) => sum + item.rate, 0) / (stats.length || 1);
  const totalMarks = habits.reduce((sum, habit) => sum + habit.done.length, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Hábitos" value={String(habits.length)} />
        <StatTile
          label="Aderência 30d"
          value={percent(average)}
          hint="média dos hábitos"
        />
        <StatTile
          label="Sequência"
          value={String(bestStreakNow)}
          hint={`recorde: ${bestEver}`}
        />
        <StatTile
          label="Marcações"
          value={String(totalMarks)}
          hint="desde o início"
        />
      </div>

      <DailyBars state={state} today={today} />

      {habits.map((habit, index) => {
        const week = statsFor(habit, 7, today);
        const month = stats[index];
        return (
          <section key={habit.id} className="habit-glass rounded-2xl p-4">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
                {habit.name}
              </h2>
              <span className="mono-label flex items-center gap-1 text-[10px] text-white/75">
                <Flame aria-hidden="true" className="h-3 w-3" />
                {month.streak} {month.streak === 1 ? "dia" : "dias"} · recorde{" "}
                {month.best}
              </span>
            </header>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
              <p className="text-[13px] text-white/75">
                <span className="mono-label text-[10px] text-white/55">
                  7 dias
                </span>{" "}
                {week.done}/{week.total} · {percent(week.rate)}
              </p>
              <p className="text-[13px] text-white/75">
                <span className="mono-label text-[10px] text-white/55">
                  30 dias
                </span>{" "}
                {month.done}/{month.total} · {percent(month.rate)}
              </p>
              <p className="text-[13px] text-white/75">
                <span className="mono-label text-[10px] text-white/55">
                  total
                </span>{" "}
                {habit.done.length}
              </p>
            </div>

            <div className="mt-4">
              <Heatmap habit={habit} today={today} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
