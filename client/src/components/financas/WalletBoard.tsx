import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type CardDraft,
  type ColumnId,
  type ExpenseCategory,
  type IncomeSource,
  type MonthSummary,
  type WalletCard,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  START_MONTH_KEY,
  addMonthsToInputDate,
  clampMonthKey,
  daysRemainingInMonth,
  defaultDateForMonth,
  editableAmount,
  formatBRL,
  formatDate,
  getCurrentMonthKey,
  getInitialMonthKey,
  getMonthLabel,
  parseAmount,
  summarizeMonth,
} from "@shared/financas/wallet";
import { useWallet } from "@/components/financas/FinancasProvider";

type QuickEntryKind = "pix" | "card" | "subscription" | "income" | "debt";

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;
const QUICK_ENTRY_OPTIONS: { id: QuickEntryKind; label: string }[] = [
  { id: "pix", label: "PIX" },
  { id: "card", label: "Cartão" },
  { id: "subscription", label: "Mensalidade" },
  { id: "income", label: "Receita" },
  { id: "debt", label: "Dívida" },
];

const COLUMNS: {
  id: ColumnId;
  title: string;
  subtitle: string;
  dotClass: string;
  ringClass: string;
  placeholder: string;
}[] = [
  {
    id: "income",
    title: "Receitas",
    subtitle: "Salário, freelas e outras entradas",
    dotClass: "bg-teal-500",
    ringClass: "ring-teal-500/20",
    placeholder: "Ex.: Salário, freela, ajudas da família...",
  },
  {
    id: "expense",
    title: "Gastos",
    subtitle: "Despesas do mês selecionado",
    dotClass: "bg-orange-500",
    ringClass: "ring-orange-500/20",
    placeholder: "Ex.: Água, mercado, gasolina...",
  },
  {
    id: "debt",
    title: "Dívidas",
    subtitle: "Parcelas e contas em aberto",
    dotClass: "bg-red-500",
    ringClass: "ring-red-500/20",
    placeholder: "Ex.: Cartão, empréstimo, parcela...",
  },
];

function parseCount(value: string, fallback: number, max: number): number {
  const count = Number.parseInt(value, 10);
  if (!Number.isFinite(count)) return fallback;
  return Math.min(max, Math.max(1, count));
}

function getEntryKind(card: WalletCard): string {
  if (card.source === "apple_pay") return "iPhone";
  if (card.source === "recurring") return "Recorrentes";
  if (card.source === "ofx") return "Extrato";
  const title = card.title.toLocaleLowerCase("pt-BR");
  if (title.includes("mensalidade")) return "Mensalidades";
  if (title.includes("pix")) return "PIX avulsos";
  if (title.includes("cart")) return "Cartões";
  if (card.column === "debt") return "Dívidas";
  if (card.column === "income") return "Receitas";
  return "Outros";
}

export default function WalletBoard() {
  const {
    vaultCards: cards,
    investmentGoals,
    syncError,
    addCards,
    removeCard,
    setGoal,
  } = useWallet();
  const [goalDraft, setGoalDraft] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => getInitialMonthKey());
  const [openComposer, setOpenComposer] = useState<ColumnId | null>(null);

  const selectedGoal = investmentGoals[selectedMonth] ?? 0;

  useEffect(() => {
    setGoalDraft(editableAmount(selectedGoal));
  }, [selectedGoal, selectedMonth]);

  const monthSummary = useMemo(
    () => summarizeMonth(cards, selectedMonth, selectedGoal),
    [cards, selectedGoal, selectedMonth]
  );

  const incomeBySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of monthSummary.cards) {
      if (card.column !== "income") continue;
      const source = card.incomeSource ?? "Outros";
      map.set(source, (map.get(source) ?? 0) + card.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthSummary.cards]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of monthSummary.cards) {
      if (card.column !== "expense") continue;
      const category = card.category ?? "Outros";
      map.set(category, (map.get(category) ?? 0) + card.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthSummary.cards]);

  const entryTypeSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of monthSummary.cards) {
      if (card.column === "income") continue;
      const kind = getEntryKind(card);
      map.set(kind, (map.get(kind) ?? 0) + card.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthSummary.cards]);

  const updateGoal = useCallback(
    (raw: string) => {
      setGoalDraft(raw);
      const amount = parseAmount(raw);
      setGoal(selectedMonth, Number.isFinite(amount) && amount > 0 ? amount : null);
    },
    [selectedMonth, setGoal]
  );

  const handleAddCards = useCallback(
    (drafts: CardDraft[]) => {
      addCards(drafts, selectedMonth);
      setOpenComposer(null);
    },
    [addCards, selectedMonth]
  );

  const addCard = useCallback(
    (
      col: ColumnId,
      title: string,
      amount: number,
      extra?: {
        category?: ExpenseCategory;
        dueDate?: string;
        incomeSource?: IncomeSource;
        occurredAt?: string;
      }
    ) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle || !Number.isFinite(amount) || amount <= 0) return;

      handleAddCards([
        {
          title: trimmedTitle,
          amount,
          column: col,
          occurredAt: extra?.occurredAt || defaultDateForMonth(selectedMonth),
          ...(col === "income" && extra?.incomeSource ? { incomeSource: extra.incomeSource } : {}),
          ...(col === "expense" && extra?.category ? { category: extra.category } : {}),
          ...(col === "debt" && extra?.dueDate ? { dueDate: extra.dueDate } : {}),
        },
      ]);
    },
    [handleAddCards, selectedMonth]
  );

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Controle de gastos
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Lançamentos
            </h1>
            <p className="sr-only">
              Registre receitas, gastos e dívidas por mês. O painel calcula quanto você ainda pode gastar
              para manter sua meta de investimento.
            </p>
          </div>

          {syncError && (
            <div className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {syncError}
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Mês do controle
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="month"
                  min={START_MONTH_KEY}
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(clampMonthKey(event.target.value || getInitialMonthKey()));
                    setOpenComposer(null);
                  }}
                  className="h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                />
                {selectedMonth !== getCurrentMonthKey() && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonth(getInitialMonthKey())}
                    className="h-10 rounded-lg border border-[var(--border-subtle)] px-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                  >
                    Mês atual
                  </button>
                )}
              </div>
            </label>

            <label className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Meta de investimento do mês
              </span>
              <input
                value={goalDraft}
                onChange={(event) => updateGoal(event.target.value)}
                inputMode="decimal"
                placeholder="Ex.: 500,00"
                className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill label="Folga da meta" value={monthSummary.remainingExpenseBudget} tone="teal" emphasize />
            <StatPill label="Gastos + dívidas" value={monthSummary.expense + monthSummary.debt} tone="orange" />
            <StatPill label="Receitas" value={monthSummary.income} tone="slate" />
          </div>

          <div className="hidden">
            <StatPill label="Receitas" value={monthSummary.income} tone="teal" />
            <StatPill label="Gastos" value={monthSummary.expense} tone="orange" />
            <StatPill label="Dívidas" value={monthSummary.debt} tone="red" />
            <StatPill label="Meta" value={monthSummary.investmentGoal} tone="indigo" />
            <StatPill label="Limite de gasto" value={monthSummary.expenseLimit} tone="slate" emphasize />
            <StatPill label="Ainda pode gastar" value={monthSummary.remainingExpenseBudget} tone="teal" emphasize />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <QuickEntry selectedMonth={selectedMonth} onAddCards={handleAddCards} />
          <div className="space-y-4">
            <GoalAdvisor
              selectedMonth={selectedMonth}
              summary={monthSummary}
              expenseByCategory={expenseByCategory}
              entryTypeSummary={entryTypeSummary}
            />
            <RecentEntries cards={monthSummary.cards} onRemove={removeCard} />
          </div>
        </div>

        <details className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text)]">
            Detalhes completos
          </summary>
          <div className="mt-4">
            <BudgetPlanner selectedMonth={selectedMonth} summary={monthSummary} />

        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              config={col}
              cards={monthSummary.cards.filter((c) => c.column === col.id)}
              selectedMonth={selectedMonth}
              composerOpen={openComposer === col.id}
              onOpenComposer={() => setOpenComposer(col.id)}
              onCloseComposer={() => setOpenComposer(null)}
              onAdd={(title, amount, extra) => addCard(col.id, title, amount, extra)}
              onRemove={removeCard}
            />
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Análise de {getMonthLabel(selectedMonth)}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Origens de receita e categorias de gasto calculadas a partir dos lançamentos do mês selecionado.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <BreakdownList
              title="Receitas por origem"
              emptyText="Adicione salário, freela ou outra entrada para ver esta divisão."
              items={incomeBySource}
              maxValue={incomeBySource[0]?.[1] ?? 1}
              barClassName="from-teal-400 to-teal-600"
            />
            <BreakdownList
              title="Gastos por categoria"
              emptyText="Adicione gastos com categoria para ver as barras aqui."
              items={expenseByCategory}
              maxValue={expenseByCategory[0]?.[1] ?? 1}
              barClassName="from-orange-400 to-orange-600"
            />
          </div>
        </section>

        <AnnualTable
          cards={cards}
          investmentGoals={investmentGoals}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
          </div>
        </details>
      </main>
    </div>
  );
}

function QuickEntry({
  selectedMonth,
  onAddCards,
}: {
  selectedMonth: string;
  onAddCards: (drafts: CardDraft[]) => void;
}) {
  const [kind, setKind] = useState<QuickEntryKind>("pix");
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => defaultDateForMonth(selectedMonth));
  const [incomeSource, setIncomeSource] = useState<IncomeSource>(INCOME_SOURCES[0]);
  const [category, setCategory] = useState<ExpenseCategory>("Outros");
  const [cardName, setCardName] = useState("");
  const [installments, setInstallments] = useState("1");
  const [repeatMonths, setRepeatMonths] = useState("12");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setOccurredAt(defaultDateForMonth(selectedMonth));
    setDueDate("");
  }, [selectedMonth]);

  const submit = () => {
    const trimmedTitle = title.trim();
    const amount = parseAmount(amountStr);

    if (!trimmedTitle || !Number.isFinite(amount) || amount <= 0) {
      setFormError("Informe descrição e valor.");
      return;
    }

    const baseDate = occurredAt || defaultDateForMonth(selectedMonth);
    let drafts: CardDraft[] = [];

    if (kind === "income") {
      drafts = [
        {
          title: trimmedTitle,
          amount,
          column: "income",
          occurredAt: baseDate,
          incomeSource,
        },
      ];
    }

    if (kind === "pix") {
      drafts = [
        {
          title: `${trimmedTitle} - PIX`,
          amount,
          column: "expense",
          occurredAt: baseDate,
          category,
        },
      ];
    }

    if (kind === "subscription") {
      const repeats = parseCount(repeatMonths, 12, 48);
      drafts = Array.from({ length: repeats }, (_, index) => {
        const date = addMonthsToInputDate(baseDate, index);
        return {
          title: `${trimmedTitle} - Mensalidade${repeats > 1 ? ` ${index + 1}/${repeats}` : ""}`,
          amount,
          column: "expense",
          occurredAt: date,
          category,
        };
      });
    }

    if (kind === "card") {
      const totalInstallments = parseCount(installments, 1, 48);
      const cardSuffix = cardName.trim() ? ` ${cardName.trim()}` : "";
      drafts = Array.from({ length: totalInstallments }, (_, index) => {
        const date = addMonthsToInputDate(baseDate, index);
        return {
          title: `${trimmedTitle} - Cartão${cardSuffix}${
            totalInstallments > 1 ? ` ${index + 1}/${totalInstallments}` : ""
          }`,
          amount,
          column: "debt",
          occurredAt: date,
          dueDate: date,
        };
      });
    }

    if (kind === "debt") {
      drafts = [
        {
          title: `${trimmedTitle} - Dívida`,
          amount,
          column: "debt",
          occurredAt: baseDate,
          dueDate: dueDate || baseDate,
        },
      ];
    }

    onAddCards(drafts);
    setTitle("");
    setAmountStr("");
    setFormError(null);
  };

  const amountLabel = kind === "card" ? "Valor da parcela" : "Valor";

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Lançar</p>
          <h2 className="text-lg font-bold text-[var(--text)]">Abril em diante</h2>
        </div>
        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
          {getMonthLabel(selectedMonth)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
        {QUICK_ENTRY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setKind(option.id);
              if (option.id === "subscription") setCategory("Assinaturas");
              setFormError(null);
            }}
            className={`h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${
              kind === option.id
                ? "border-teal-400 bg-[var(--income-tag-bg)] text-[var(--income-tag-text)]"
                : "border-[var(--border-subtle)] bg-[var(--control-bg)] text-[var(--text-muted)] hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Descrição</span>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Mercado, Netflix, Nubank"
          className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{amountLabel}</span>
          <input
            value={amountStr}
            onChange={(event) => setAmountStr(event.target.value)}
            inputMode="decimal"
            placeholder="99,90"
            className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Data</span>
          <input
            type="date"
            min={`${START_MONTH_KEY}-01`}
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          />
        </label>
      </div>

      {kind === "income" ? (
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Origem</span>
          <select
            value={incomeSource}
            onChange={(event) => setIncomeSource(event.target.value as IncomeSource)}
            className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          >
            {INCOME_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
      ) : (
        kind !== "debt" && (
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Categoria</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
              className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
            >
              {EXPENSE_CATEGORIES.map((expenseCategory) => (
                <option key={expenseCategory} value={expenseCategory}>
                  {expenseCategory}
                </option>
              ))}
            </select>
          </label>
        )
      )}

      {kind === "card" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Cartão</span>
            <input
              value={cardName}
              onChange={(event) => setCardName(event.target.value)}
              placeholder="Ex.: Nubank"
              className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Parcelas</span>
            <input
              type="number"
              min={1}
              max={48}
              value={installments}
              onChange={(event) => setInstallments(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
            />
          </label>
        </div>
      )}

      {kind === "subscription" && (
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Repetir por meses</span>
          <input
            type="number"
            min={1}
            max={48}
            value={repeatMonths}
            onChange={(event) => setRepeatMonths(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          />
        </label>
      )}

      {kind === "debt" && (
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Vencimento</span>
          <input
            type="date"
            min={`${START_MONTH_KEY}-01`}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          />
        </label>
      )}

      {formError && <p className="mt-3 text-sm font-medium text-[var(--danger)]">{formError}</p>}

      <button
        type="button"
        onClick={submit}
        className="mt-4 h-11 w-full rounded-lg bg-[var(--button-primary-bg)] px-3 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)]"
      >
        Adicionar
      </button>
    </section>
  );
}

function GoalAdvisor({
  selectedMonth,
  summary,
  expenseByCategory,
  entryTypeSummary,
}: {
  selectedMonth: string;
  summary: MonthSummary;
  expenseByCategory: [string, number][];
  entryTypeSummary: [string, number][];
}) {
  const freeToGoal = summary.remainingExpenseBudget;
  const safeIncrease = Math.max(0, freeToGoal);
  const suggestedStep =
    safeIncrease > 0 ? Math.min(safeIncrease, Math.max(50, Math.round((summary.income * 0.05) / 10) * 10)) : 0;
  const topCategory = expenseByCategory[0];
  const topType = entryTypeSummary[0];
  const topCategoryCut = topCategory ? topCategory[1] * 0.1 : 0;

  let message = "Cadastre sua receita de abril em diante para o sistema calcular a folga real da meta.";
  if (summary.income > 0 && freeToGoal >= 0) {
    message = `Você pode mover até ${formatBRL(safeIncrease)} para a meta de ${getMonthLabel(
      selectedMonth
    )} sem deixar o mês negativo.`;
  } else if (summary.income > 0) {
    message = `Antes de aumentar a meta, faltam ${formatBRL(Math.abs(freeToGoal))} para fechar este mês.`;
  }

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Meta prática</p>
      <h2 className="mt-2 text-2xl font-bold tabular-nums text-[var(--text)]">
        {freeToGoal >= 0 ? formatBRL(safeIncrease) : `-${formatBRL(Math.abs(freeToGoal))}`}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Próximo passo</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text)]">
            {suggestedStep > 0 ? formatBRL(suggestedStep) : "Sem folga"}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Corte de 10%</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text)]">
            {topCategory ? formatBRL(topCategoryCut) : "Sem gastos"}
          </p>
          {topCategory && <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{topCategory[0]}</p>}
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Maior saída</p>
          <p className="mt-1 truncate text-sm font-bold text-[var(--text)]">{topType?.[0] ?? "Sem dados"}</p>
          {topType && <p className="mt-1 text-xs tabular-nums text-[var(--text-muted)]">{formatBRL(topType[1])}</p>}
        </div>
      </div>
    </section>
  );
}

function RecentEntries({ cards, onRemove }: { cards: WalletCard[]; onRemove: (id: string) => void }) {
  const recentCards = [...cards]
    .sort((a, b) => (b.occurredAt ?? b.createdAt).localeCompare(a.occurredAt ?? a.createdAt))
    .slice(0, 8);

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Lançamentos</p>
          <h2 className="text-lg font-bold text-[var(--text)]">Recentes</h2>
        </div>
        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
          {cards.length}
        </span>
      </div>

      {recentCards.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
          Nenhum lançamento neste mês.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
          {recentCards.map((card) => (
            <li key={card.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text)]">{card.title}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {getEntryKind(card)} - {formatDate(card.occurredAt ?? card.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--text)]">{formatBRL(card.amount)}</p>
              <button
                type="button"
                onClick={() => onRemove(card.id)}
                className="h-8 w-8 shrink-0 rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                aria-label="Remover lançamento"
                title="Remover"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      )}

      {cards.length > recentCards.length && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Mais {cards.length - recentCards.length} no detalhe completo.
        </p>
      )}
    </section>
  );
}

function BudgetPlanner({ selectedMonth, summary }: { selectedMonth: string; summary: MonthSummary }) {
  const daysRemaining = daysRemainingInMonth(selectedMonth);
  const dailyLimit = daysRemaining > 0 ? summary.remainingExpenseBudget / daysRemaining : 0;
  const usedPercent =
    summary.expenseLimit > 0 ? Math.min(100, Math.max(0, (summary.expense / summary.expenseLimit) * 100)) : 0;
  const goalPercent =
    summary.income > 0 ? Math.min(100, Math.max(0, (summary.investmentGoal / summary.income) * 100)) : 0;

  let message = "Registre suas receitas deste mês para calcular seu limite de gasto.";
  if (summary.income > 0 && summary.expenseLimit < 0) {
    message = `A meta e as dívidas passam suas receitas em ${formatBRL(
      Math.abs(summary.expenseLimit)
    )}. Ajuste a meta ou registre novas entradas.`;
  } else if (summary.income > 0 && summary.remainingExpenseBudget >= 0) {
    message = `Você ainda pode gastar ${formatBRL(
      summary.remainingExpenseBudget
    )} em ${getMonthLabel(selectedMonth)} e manter a meta de ${formatBRL(summary.investmentGoal)}.`;
  } else if (summary.income > 0) {
    message = `Você passou ${formatBRL(
      Math.abs(summary.remainingExpenseBudget)
    )} do limite para manter a meta deste mês.`;
  }

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Cálculo para investir
          </p>
          <h2 className="mt-1 text-xl font-bold text-[var(--text)]">{getMonthLabel(selectedMonth)}</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>

          <div className="mt-6 space-y-4">
            <ProgressRow
              label="Gasto usado do limite"
              value={`${Math.round(usedPercent)}%`}
              percent={usedPercent}
              barClassName="from-orange-400 to-orange-600"
            />
            <ProgressRow
              label="Meta reservada sobre receitas"
              value={`${Math.round(goalPercent)}%`}
              percent={goalPercent}
              barClassName="from-indigo-400 to-indigo-600"
            />
          </div>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Limite diário restante
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--text)]">
            {daysRemaining > 0 && summary.remainingExpenseBudget > 0 ? formatBRL(dailyLimit) : formatBRL(0)}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {daysRemaining > 0
              ? `${daysRemaining} dia(s) restantes considerados no cálculo.`
              : "Mês encerrado ou sem dias restantes para ratear."}
          </p>
          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--text-muted)]">
            Limite total de gasto:{" "}
            <span className="font-semibold text-[var(--text)]">{formatBRL(summary.expenseLimit)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressRow({
  label,
  value,
  percent,
  barClassName,
}: {
  label: string;
  value: string;
  percent: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--text)]">{label}</span>
        <span className="tabular-nums text-[var(--text-muted)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--column-bg)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone: "teal" | "orange" | "red" | "slate" | "indigo";
  emphasize?: boolean;
}) {
  const neg = value < 0;
  return (
    <div
      className={`rounded-xl px-4 py-3 ${emphasize ? "shadow-sm" : ""}`}
      style={{
        background: `linear-gradient(135deg, var(--stat-${tone}-from), var(--stat-${tone}-to))`,
        boxShadow: `inset 0 0 0 1px var(--stat-${tone}-ring)`,
        color: `var(--stat-${tone}-text)`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${neg ? "text-[var(--negative-value)]" : ""}`}>
        {formatBRL(value)}
      </p>
    </div>
  );
}

function BreakdownList({
  title,
  emptyText,
  items,
  maxValue,
  barClassName,
}: {
  title: string;
  emptyText: string;
  items: [string, number][];
  maxValue: number;
  barClassName: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map(([name, value]) => (
            <li key={name} className="animate-card-in">
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--text)]">{name}</span>
                <span className="tabular-nums text-[var(--text-muted)]">{formatBRL(value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--column-bg)]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out ${barClassName}`}
                  style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnnualTable({
  cards,
  investmentGoals,
  selectedMonth,
  onSelectMonth,
}: {
  cards: WalletCard[];
  investmentGoals: Record<string, number>;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}) {
  const year = Number(selectedMonth.slice(0, 4));
  let accumulated = 0;
  const firstMonthIndex =
    year === Number(START_MONTH_KEY.slice(0, 4)) ? Number(START_MONTH_KEY.slice(5, 7)) - 1 : 0;
  const rows = MONTHS.slice(firstMonthIndex).map((month, index) => {
    const monthNumber = firstMonthIndex + index + 1;
    const monthKey = `${year}-${String(monthNumber).padStart(2, "0")}`;
    const summary = summarizeMonth(cards, monthKey, investmentGoals[monthKey] ?? 0);
    accumulated += summary.balanceAfterGoal;
    return { month, monthKey, summary, accumulated };
  });

  return (
    <section className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text)]">Visão anual estilo planilha</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Total por mês, balanço depois da meta de investimento e acumulado do ano selecionado.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Mês</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Receitas</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Gastos</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Dívidas</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Meta</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Balanço</th>
              <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = row.monthKey === selectedMonth;
              return (
                <tr
                  key={row.monthKey}
                  className={active ? "bg-[var(--surface-muted)] text-[var(--text)]" : "text-[var(--text)]"}
                >
                  <td className="border-b border-[var(--border-subtle)] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelectMonth(row.monthKey)}
                      className="rounded-md px-2 py-1 font-bold transition-colors hover:bg-[var(--control-bg-hover)]"
                    >
                      {row.month}
                    </button>
                  </td>
                  <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                    {formatBRL(row.summary.income)}
                  </td>
                  <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                    {formatBRL(row.summary.expense)}
                  </td>
                  <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                    {formatBRL(row.summary.debt)}
                  </td>
                  <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                    {formatBRL(row.summary.investmentGoal)}
                  </td>
                  <td
                    className={`border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums ${
                      row.summary.balanceAfterGoal < 0 ? "text-[var(--negative-value)]" : ""
                    }`}
                  >
                    {formatBRL(row.summary.balanceAfterGoal)}
                  </td>
                  <td
                    className={`border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums ${
                      row.accumulated < 0 ? "text-[var(--negative-value)]" : ""
                    }`}
                  >
                    {formatBRL(row.accumulated)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BoardColumn({
  config,
  cards,
  selectedMonth,
  composerOpen,
  onOpenComposer,
  onCloseComposer,
  onAdd,
  onRemove,
}: {
  config: (typeof COLUMNS)[number];
  cards: WalletCard[];
  selectedMonth: string;
  composerOpen: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onAdd: (
    title: string,
    amount: number,
    extra?: {
      category?: ExpenseCategory;
      dueDate?: string;
      incomeSource?: IncomeSource;
      occurredAt?: string;
    }
  ) => void;
  onRemove: (id: string) => void;
}) {
  const subtotal = cards.reduce((s, c) => s + c.amount, 0);

  return (
    <div
      className={`flex w-[min(100%,340px)] shrink-0 flex-col rounded-2xl bg-[var(--column-bg)] p-3 shadow-sm ring-1 lg:w-auto ${config.ringClass}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dotClass}`} />
          <div>
            <h2 className="text-sm font-bold text-[var(--text)]">{config.title}</h2>
            <p className="text-xs text-[var(--text-muted)]">{config.subtitle}</p>
          </div>
        </div>
        <span className="rounded-md bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--text)] ring-1 ring-[var(--ring-subtle)]">
          {formatBRL(subtotal)}
        </span>
      </div>

      <div className="flex min-h-[120px] flex-1 flex-col gap-2">
        {cards.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
            Nenhum lançamento neste mês.
          </p>
        )}
        {cards.map((card, i) => (
          <article
            key={card.id}
            className="animate-card-in group relative cursor-default rounded-xl bg-[var(--card-bg)] p-3 shadow-sm ring-1 ring-[var(--ring-subtle)] transition-shadow hover:shadow-md"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <button
              type="button"
              onClick={() => onRemove(card.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] group-hover:opacity-100"
              aria-label="Remover lançamento"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="pr-8 text-sm font-semibold leading-snug text-[var(--text)]">{card.title}</h3>
            <p className="mt-2 text-base font-bold tabular-nums text-[var(--text)]">{formatBRL(card.amount)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {card.column === "income" && (
                <span className="rounded-md bg-[var(--income-tag-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--income-tag-text)] ring-1 ring-[var(--income-tag-ring)]">
                  {card.incomeSource ?? "Outros"}
                </span>
              )}
              {card.column === "expense" && card.category && (
                <span className="rounded-md bg-[var(--expense-tag-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--expense-tag-text)] ring-1 ring-[var(--expense-tag-ring)]">
                  {card.category}
                </span>
              )}
              {card.column === "debt" && (
                <span className="rounded-md bg-[var(--debt-tag-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--debt-tag-text)] ring-1 ring-[var(--debt-tag-ring)]">
                  Dívida
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Data: {formatDate(card.occurredAt ?? card.createdAt)}
            </p>
            {card.column === "debt" && card.dueDate && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">Venc.: {formatDate(card.dueDate)}</p>
            )}
          </article>
        ))}
      </div>

      {composerOpen ? (
        <Composer
          columnId={config.id}
          selectedMonth={selectedMonth}
          placeholder={config.placeholder}
          onCancel={onCloseComposer}
          onSubmit={onAdd}
        />
      ) : (
        <button
          type="button"
          onClick={onOpenComposer}
          className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--control-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
        >
          <span className="text-lg leading-none">+</span>
          Adicionar lançamento
        </button>
      )}
    </div>
  );
}

function Composer({
  columnId,
  selectedMonth,
  placeholder,
  onCancel,
  onSubmit,
}: {
  columnId: ColumnId;
  selectedMonth: string;
  placeholder: string;
  onCancel: () => void;
  onSubmit: (
    title: string,
    amount: number,
    extra?: {
      category?: ExpenseCategory;
      dueDate?: string;
      incomeSource?: IncomeSource;
      occurredAt?: string;
    }
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => defaultDateForMonth(selectedMonth));
  const [incomeSource, setIncomeSource] = useState<IncomeSource>(INCOME_SOURCES[0]);
  const [category, setCategory] = useState<ExpenseCategory>("Outros");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    setOccurredAt(defaultDateForMonth(selectedMonth));
    setDueDate("");
  }, [selectedMonth]);

  const submit = () => {
    const amount = parseAmount(amountStr);
    onSubmit(title, amount, {
      occurredAt,
      ...(columnId === "income" ? { incomeSource } : {}),
      ...(columnId === "expense" ? { category } : {}),
      ...(columnId === "debt" && dueDate ? { dueDate } : {}),
    });
    setTitle("");
    setAmountStr("");
    setDueDate("");
  };

  return (
    <div className="mt-2 rounded-xl bg-[var(--card-bg)] p-3 shadow-md ring-1 ring-[var(--ring-subtle)]">
      <input
        autoFocus
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
        placeholder="Valor (ex.: 150 ou 99,90)"
        inputMode="decimal"
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value)}
      />
      <input
        type="date"
        className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
        value={occurredAt}
        onChange={(e) => setOccurredAt(e.target.value)}
      />
      {columnId === "income" && (
        <select
          className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          value={incomeSource}
          onChange={(e) => setIncomeSource(e.target.value as IncomeSource)}
        >
          {INCOME_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      )}
      {columnId === "expense" && (
        <select
          className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        >
          {EXPENSE_CATEGORIES.map((expenseCategory) => (
            <option key={expenseCategory} value={expenseCategory}>
              {expenseCategory}
            </option>
          ))}
        </select>
      )}
      {columnId === "debt" && (
        <input
          type="date"
          className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          className="flex-1 rounded-lg bg-[var(--button-primary-bg)] px-3 py-2 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)]"
        >
          Adicionar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--control-bg-hover)]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
