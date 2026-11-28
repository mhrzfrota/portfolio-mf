import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/components/financas/FinancasProvider";
import { loadBudgets, type CategoryBudget } from "@/features/financas/dados";
import {
  EXPENSE_CATEGORIES,
  formatBRL,
  getCardDate,
  todayInputValue,
  VAULTS,
  type ExpenseCategory,
  type WalletCard,
} from "@shared/financas/wallet";

type Mode = "day" | "week" | "month" | "year" | "custom";

const MODES: { id: Mode; label: string }[] = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
  { id: "custom", label: "Período" },
];

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

/* ── datas em YYYY-MM-DD, sempre no calendário local ─────────────────── */
function toDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function addDays(value: string, days: number): string {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return toKey(date);
}
function daysBetween(start: string, end: string): number {
  return Math.round((toDate(end).getTime() - toDate(start).getTime()) / 86_400_000) + 1;
}
function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`;
}
function monthEnd(value: string): string {
  const date = toDate(monthStart(value));
  return toKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
}
function shiftMonth(value: string, months: number): string {
  const date = toDate(monthStart(value));
  return toKey(new Date(date.getFullYear(), date.getMonth() + months, 1, 12));
}

function rangeFor(mode: Mode, anchor: string, custom: { start: string; end: string }) {
  if (mode === "day") return { start: anchor, end: anchor };
  if (mode === "week") {
    const weekday = (toDate(anchor).getDay() + 6) % 7; // segunda = 0
    const start = addDays(anchor, -weekday);
    return { start, end: addDays(start, 6) };
  }
  if (mode === "month") return { start: monthStart(anchor), end: monthEnd(anchor) };
  if (mode === "year") return { start: `${anchor.slice(0, 4)}-01-01`, end: `${anchor.slice(0, 4)}-12-31` };
  return custom.start <= custom.end ? custom : { start: custom.end, end: custom.start };
}

function previousRange(mode: Mode, range: { start: string; end: string }) {
  if (mode === "month") {
    const start = shiftMonth(range.start, -1);
    return { start, end: monthEnd(start) };
  }
  if (mode === "year") {
    const year = Number(range.start.slice(0, 4)) - 1;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const length = daysBetween(range.start, range.end);
  return { start: addDays(range.start, -length), end: addDays(range.start, -1) };
}

function shiftAnchor(mode: Mode, anchor: string, direction: 1 | -1): string {
  if (mode === "day") return addDays(anchor, direction);
  if (mode === "week") return addDays(anchor, 7 * direction);
  if (mode === "month") return shiftMonth(anchor, direction);
  if (mode === "year") return `${Number(anchor.slice(0, 4)) + direction}${anchor.slice(4)}`;
  return anchor;
}

const dayLabel = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const shortDay = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const weekdayLong = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function rangeLabel(mode: Mode, range: { start: string; end: string }): string {
  if (mode === "day") return capitalize(dayLabel.format(toDate(range.start)));
  if (mode === "month") return capitalize(monthName.format(toDate(range.start)));
  if (mode === "year") return range.start.slice(0, 4);
  if (range.start === range.end) return capitalize(dayLabel.format(toDate(range.start)));
  return `${shortDay.format(toDate(range.start))} a ${shortDay.format(toDate(range.end))}`;
}

function isOutflow(card: WalletCard): boolean {
  return card.column === "expense" || card.column === "debt";
}

function sumOut(cards: WalletCard[]): number {
  return cards.filter(isOutflow).reduce((sum, card) => sum + card.amount, 0);
}
function sumIn(cards: WalletCard[]): number {
  return cards.filter((card) => card.column === "income").reduce((sum, card) => sum + card.amount, 0);
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const SOURCE_BADGE: Record<string, string> = {
  apple_pay: "iPhone",
  ofx: "Extrato",
  recurring: "Recorrente",
};

export default function Reports() {
  const { vaultCards, vault, supabase, user, hideValues, updateCardCategory, syncError } = useWallet();
  const today = todayInputValue();
  const [mode, setMode] = useState<Mode>("month");
  const [anchor, setAnchor] = useState(today);
  const [custom, setCustom] = useState({ start: addDays(today, -29), end: today });
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    loadBudgets(supabase, vault)
      .then((loaded) => active && setBudgets(loaded))
      .catch(() => active && setBudgets([])); // antes do SQL v3 a tabela não existe
    return () => {
      active = false;
    };
  }, [supabase, user, vault]);

  const range = useMemo(() => rangeFor(mode, anchor, custom), [mode, anchor, custom]);
  const prev = useMemo(() => previousRange(mode, range), [mode, range]);
  const vaultLabel = VAULTS.find((option) => option.id === vault)?.label ?? "Pessoal";

  const compact = (value: number) =>
    hideValues
      ? formatBRL(value)
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const data = useMemo(() => {
    const inRange = (card: WalletCard, r: { start: string; end: string }) => {
      const date = getCardDate(card);
      return date >= r.start && date <= r.end;
    };
    const current = vaultCards.filter((card) => inRange(card, range));
    const before = vaultCards.filter((card) => inRange(card, prev));

    const income = sumIn(current);
    const outflow = sumOut(current);
    const days = daysBetween(range.start, range.end);
    const elapsed = range.end > today ? Math.max(1, daysBetween(range.start, today)) : days;

    // Categorias: só gastos (dívidas e parcelas ficam numa linha própria).
    const byCategory = new Map<string, { now: number; before: number }>();
    for (const card of current) {
      if (card.column !== "expense") continue;
      const key = card.category ?? "Outros";
      const entry = byCategory.get(key) ?? { now: 0, before: 0 };
      entry.now += card.amount;
      byCategory.set(key, entry);
    }
    for (const card of before) {
      if (card.column !== "expense") continue;
      const key = card.category ?? "Outros";
      const entry = byCategory.get(key) ?? { now: 0, before: 0 };
      entry.before += card.amount;
      byCategory.set(key, entry);
    }
    const categories = [...byCategory.entries()]
      .map(([category, values]) => ({ category, ...values }))
      .filter((row) => row.now > 0 || row.before > 0)
      .sort((a, b) => b.now - a.now || b.before - a.before);
    const debtNow = current.filter((card) => card.column === "debt").reduce((s, c) => s + c.amount, 0);
    const debtBefore = before.filter((card) => card.column === "debt").reduce((s, c) => s + c.amount, 0);

    // Barras: por dia até ~2 meses, por mês acima disso.
    const byMonth = days > 62;
    const buckets: { key: string; label: string; title: string; income: number; outflow: number }[] = [];
    if (byMonth) {
      for (let cursor = monthStart(range.start); cursor <= range.end; cursor = shiftMonth(cursor, 1)) {
        const end = monthEnd(cursor);
        const cards = current.filter((card) => {
          const date = getCardDate(card);
          return date >= cursor && date <= end;
        });
        buckets.push({
          key: cursor,
          label: monthShort.format(toDate(cursor)).replace(".", ""),
          title: capitalize(monthName.format(toDate(cursor))),
          income: sumIn(cards),
          outflow: sumOut(cards),
        });
      }
    } else {
      for (let cursor = range.start; cursor <= range.end; cursor = addDays(cursor, 1)) {
        const cards = current.filter((card) => getCardDate(card) === cursor);
        buckets.push({
          key: cursor,
          label: String(toDate(cursor).getDate()),
          title: capitalize(weekdayLong.format(toDate(cursor))),
          income: sumIn(cards),
          outflow: sumOut(cards),
        });
      }
    }

    const statement = [...current].sort((a, b) =>
      getCardDate(b).localeCompare(getCardDate(a)) || (b.capturedAt ?? b.createdAt).localeCompare(a.capturedAt ?? a.createdAt)
    );

    return {
      income,
      outflow,
      balance: income - outflow,
      perDay: outflow / elapsed,
      prevOutflow: sumOut(before),
      categories,
      debtNow,
      debtBefore,
      buckets,
      statement,
    };
  }, [vaultCards, range, prev, today]);

  // Calendário do mês do período (ou do mês da data escolhida).
  const calendar = useMemo(() => {
    const base = mode === "year" || mode === "custom" ? null : monthStart(mode === "month" ? range.start : anchor);
    if (!base) return null;
    const first = toDate(base);
    const lead = (first.getDay() + 6) % 7;
    const last = monthEnd(base);
    const totals = new Map<string, number>();
    for (const card of vaultCards) {
      if (!isOutflow(card)) continue;
      const date = getCardDate(card);
      if (date >= base && date <= last) totals.set(date, (totals.get(date) ?? 0) + card.amount);
    }
    const max = Math.max(0, ...totals.values());
    const cells: ({ key: string; day: number; total: number } | null)[] = Array.from({ length: lead }, () => null);
    for (let cursor = base; cursor <= last; cursor = addDays(cursor, 1)) {
      cells.push({ key: cursor, day: toDate(cursor).getDate(), total: totals.get(cursor) ?? 0 });
    }
    return { label: capitalize(monthName.format(first)), cells, max, total: [...totals.values()].reduce((s, v) => s + v, 0) };
  }, [mode, range.start, anchor, vaultCards]);

  const maxBar = Math.max(1, ...data.buckets.map((b) => Math.max(b.income, b.outflow)));
  const budgetByCategory = new Map(budgets.map((budget) => [budget.category, Number(budget.monthly_limit)]));
  const outflowChange = percentChange(data.outflow, data.prevOutflow);
  const budgetRows = mode === "month"
    ? budgets
        .map((budget) => ({
          category: budget.category,
          limit: Number(budget.monthly_limit),
          spent: data.categories.find((row) => row.category === budget.category)?.now ?? 0,
        }))
        .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    : [];

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Relatórios · Cofre {vaultLabel}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Para onde foi o dinheiro
              </h1>
            </div>
          </div>

          {syncError && (
            <div className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {syncError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full rounded-xl bg-[var(--surface-muted)] p-1 sm:w-auto" role="group" aria-label="Período">
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  aria-pressed={mode === option.id}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors sm:flex-none sm:px-3 ${
                    mode === option.id
                      ? "bg-[var(--card-bg)] text-[var(--text)] shadow-sm ring-1 ring-[var(--ring-subtle)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {mode === "custom" ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <label className="flex items-center gap-2">
                  <span>De</span>
                  <input
                    type="date"
                    value={custom.start}
                    onChange={(event) => event.target.value && setCustom((c) => ({ ...c, start: event.target.value }))}
                    className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 font-semibold text-[var(--text)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span>até</span>
                  <input
                    type="date"
                    value={custom.end}
                    onChange={(event) => event.target.value && setCustom((c) => ({ ...c, end: event.target.value }))}
                    className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 font-semibold text-[var(--text)]"
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAnchor((a) => shiftAnchor(mode, a, -1))}
                  aria-label="Período anterior"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                >
                  ‹
                </button>
                <span className="min-w-[150px] text-center text-sm font-bold text-[var(--text)] sm:min-w-[180px]" aria-live="polite">
                  {rangeLabel(mode, range)}
                </span>
                <button
                  type="button"
                  onClick={() => setAnchor((a) => shiftAnchor(mode, a, 1))}
                  aria-label="Próximo período"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                >
                  ›
                </button>
                {anchor !== today && (
                  <button
                    type="button"
                    onClick={() => setAnchor(today)}
                    className="ml-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                  >
                    Hoje
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Entradas" value={formatBRL(data.income)} tone="teal" />
            <Stat
              label="Saídas"
              value={formatBRL(data.outflow)}
              tone="orange"
              hint={
                outflowChange === null
                  ? undefined
                  : `${outflowChange > 0 ? "+" : ""}${outflowChange}% contra o período anterior`
              }
            />
            <Stat label="Saldo" value={formatBRL(data.balance)} tone={data.balance < 0 ? "red" : "slate"} />
            <Stat label="Gasto médio por dia" value={formatBRL(data.perDay)} tone="indigo" />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="min-w-0 space-y-4">
          <Panel eyebrow="Entradas x saídas" title={data.buckets.length > 1 ? "Ao longo do período" : "No dia"}>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent-income)]" aria-hidden="true" /> Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent-expense)]" aria-hidden="true" /> Saídas
              </span>
            </div>
            {data.income === 0 && data.outflow === 0 ? (
              <Empty>Nenhuma entrada ou saída neste período.</Empty>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <div
                  className="flex h-48 items-end gap-1"
                  style={{ minWidth: `${Math.max(data.buckets.length * 18, 240)}px` }}
                  role="img"
                  aria-label={`Entradas de ${formatBRL(data.income)} e saídas de ${formatBRL(data.outflow)} em ${rangeLabel(mode, range)}`}
                >
                  {data.buckets.map((bucket) => (
                    <div
                      key={bucket.key}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                      title={`${bucket.title}: entradas ${formatBRL(bucket.income)}, saídas ${formatBRL(bucket.outflow)}`}
                    >
                      <div className="flex h-full w-full items-end justify-center gap-[2px]">
                        <div
                          className="w-1/2 max-w-[14px] rounded-t bg-[var(--accent-income)]"
                          style={{ height: `${(bucket.income / maxBar) * 100}%`, minHeight: bucket.income > 0 ? 3 : 0 }}
                        />
                        <div
                          className="w-1/2 max-w-[14px] rounded-t bg-[var(--accent-expense)]"
                          style={{ height: `${(bucket.outflow / maxBar) * 100}%`, minHeight: bucket.outflow > 0 ? 3 : 0 }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">{bucket.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {calendar && (
            <Panel eyebrow="Calendário de gastos" title={calendar.label} aside={`Total ${formatBRL(calendar.total)}`}>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="pb-1 text-[11px] font-semibold uppercase text-[var(--text-muted)]">
                    {day}
                  </span>
                ))}
                {calendar.cells.map((cell, index) =>
                  cell ? (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => {
                        setAnchor(cell.key);
                        setMode("day");
                      }}
                      title={`${capitalize(weekdayLong.format(toDate(cell.key)))}: ${formatBRL(cell.total)}`}
                      className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border text-[var(--text)] transition-transform hover:scale-[1.04] ${
                        cell.key === today ? "border-[var(--text)]" : "border-transparent"
                      }`}
                      style={{
                        background:
                          cell.total > 0
                            ? `color-mix(in srgb, var(--accent-expense) ${Math.round(12 + (cell.total / calendar.max) * 58)}%, transparent)`
                            : "var(--surface-muted)",
                      }}
                    >
                      <span className="text-xs font-bold sm:text-sm">{cell.day}</span>
                      {cell.total > 0 && (
                        <span className="hidden truncate px-0.5 text-[10px] font-semibold sm:block">{compact(cell.total)}</span>
                      )}
                    </button>
                  ) : (
                    <span key={`vazio-${index}`} aria-hidden="true" />
                  )
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">Toque num dia para ver o que entrou e saiu nele.</p>
            </Panel>
          )}

          <Panel eyebrow="Extrato" title={`${data.statement.length} ${data.statement.length === 1 ? "lançamento" : "lançamentos"}`}>
            {data.statement.length === 0 ? (
              <Empty>Nada lançado neste período.</Empty>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.statement.slice(0, 200).map((card) => (
                  <li key={card.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{card.title}</p>
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <span>{shortDay.format(toDate(getCardDate(card)))}</span>
                        {card.source && SOURCE_BADGE[card.source] && (
                          <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-semibold">
                            {SOURCE_BADGE[card.source]}
                          </span>
                        )}
                        {card.column === "debt" && <span>Parcela ou dívida</span>}
                        {card.column === "income" && card.incomeSource && <span>{card.incomeSource}</span>}
                      </p>
                    </div>
                    {card.column === "expense" && (
                      <select
                        value={card.category ?? "Outros"}
                        onChange={(event) => updateCardCategory(card.id, event.target.value as ExpenseCategory)}
                        aria-label={`Categoria de ${card.title}`}
                        className="h-8 max-w-[150px] rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 text-xs font-semibold text-[var(--text)]"
                      >
                        {EXPENSE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    )}
                    <span
                      className={`w-28 text-right text-sm font-bold tabular-nums ${
                        card.column === "income" ? "text-[var(--accent-income)]" : "text-[var(--text)]"
                      }`}
                    >
                      {card.column === "income" ? "+" : "−"} {formatBRL(card.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {data.statement.length > 200 && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">Mostrando os 200 mais recentes. Diminua o período para ver o resto.</p>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-4">
          <Panel eyebrow="Gastos por categoria" title="Contra o período anterior">
            {data.categories.length === 0 && data.debtNow === 0 ? (
              <Empty>Sem gastos neste período.</Empty>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {data.categories.map((row) => {
                  const change = percentChange(row.now, row.before);
                  const share = data.outflow > 0 ? (row.now / data.outflow) * 100 : 0;
                  const limit = mode === "month" ? budgetByCategory.get(row.category as ExpenseCategory) : undefined;
                  return (
                    <li key={row.category}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-[var(--text)]">{row.category}</span>
                        <span className="font-bold tabular-nums text-[var(--text)]">{formatBRL(row.now)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div className="h-full rounded-full bg-[var(--accent-expense)]" style={{ width: `${Math.min(100, share)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {row.before > 0 ? `Antes ${formatBRL(row.before)}` : "Nada no período anterior"}
                        {change !== null && (
                          <span className={change > 0 ? "font-semibold text-[var(--negative-value)]" : "font-semibold text-[var(--accent-income)]"}>
                            {" "}· {change > 0 ? "+" : ""}
                            {change}%
                          </span>
                        )}
                        {limit !== undefined && <span> · limite {formatBRL(limit)}</span>}
                      </p>
                    </li>
                  );
                })}
                {(data.debtNow > 0 || data.debtBefore > 0) && (
                  <li className="border-t border-[var(--border-subtle)] pt-3">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-[var(--text)]">Parcelas e dívidas</span>
                      <span className="font-bold tabular-nums text-[var(--text)]">{formatBRL(data.debtNow)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Antes {formatBRL(data.debtBefore)}</p>
                  </li>
                )}
              </ul>
            )}
          </Panel>

          {mode === "month" && (
            <Panel eyebrow="Limites do mês" title={budgetRows.length ? "Quanto ainda dá para gastar" : "Nenhum limite definido"}>
              {budgetRows.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Defina um teto por categoria em <a href="/financas/ajustes#limites" className="font-semibold underline">Ajustes</a> e
                  acompanhe aqui o que sobra no mês.
                </p>
              ) : (
                <ul className="mt-4 space-y-3.5">
                  {budgetRows.map((row) => {
                    const ratio = row.spent / row.limit;
                    const color = ratio >= 1 ? "var(--accent-debt)" : ratio >= 0.8 ? "var(--accent-expense)" : "var(--accent-income)";
                    return (
                      <li key={row.category}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-semibold text-[var(--text)]">{row.category}</span>
                          <span className="tabular-nums text-[var(--text-muted)]">
                            <strong className="text-[var(--text)]">{formatBRL(row.spent)}</strong> de {formatBRL(row.limit)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold" style={{ color }}>
                          {ratio >= 1
                            ? `Passou ${formatBRL(row.spent - row.limit)} do limite`
                            : `Sobram ${formatBRL(row.limit - row.spent)}`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}
        </aside>
      </main>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
        </div>
        {aside && <span className="text-sm font-semibold text-[var(--text-muted)]">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
      {children}
    </p>
  );
}

const TONES = {
  teal: "from-[var(--stat-teal-from)] to-[var(--stat-teal-to)] text-[var(--stat-teal-text)] ring-[var(--stat-teal-ring)]",
  orange: "from-[var(--stat-orange-from)] to-[var(--stat-orange-to)] text-[var(--stat-orange-text)] ring-[var(--stat-orange-ring)]",
  red: "from-[var(--stat-red-from)] to-[var(--stat-red-to)] text-[var(--stat-red-text)] ring-[var(--stat-red-ring)]",
  slate: "from-[var(--stat-slate-from)] to-[var(--stat-slate-to)] text-[var(--stat-slate-text)] ring-[var(--stat-slate-ring)]",
  indigo: "from-[var(--stat-indigo-from)] to-[var(--stat-indigo-to)] text-[var(--stat-indigo-text)] ring-[var(--stat-indigo-ring)]",
} as const;

function Stat({ label, value, tone, hint }: { label: string; value: string; tone: keyof typeof TONES; hint?: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-4 ring-1 ${TONES[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs font-semibold opacity-80">{hint}</p>}
    </div>
  );
}
