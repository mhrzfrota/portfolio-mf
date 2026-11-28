import { Link } from "wouter";
import { useMemo, useState } from "react";
import { useWallet } from "@/components/financas/FinancasProvider";
import {
  addDaysToInputDate,
  clampMonthKey,
  formatBRL,
  formatDate,
  getCardDate,
  getInitialMonthKey,
  getMonthLabel,
  START_MONTH_KEY,
  sumByColumn,
  summarizeMonth,
  todayInputValue,
  VAULTS,
  type ColumnId,
  type WalletCard,
} from "@shared/financas/wallet";

const HORIZON_DAYS = 30;

const COLUMN_BADGE: Record<ColumnId, { label: string; className: string }> = {
  income: {
    label: "Receita",
    className: "bg-[var(--income-tag-bg)] text-[var(--income-tag-text)] ring-[var(--income-tag-ring)]",
  },
  expense: {
    label: "Gasto",
    className: "bg-[var(--expense-tag-bg)] text-[var(--expense-tag-text)] ring-[var(--expense-tag-ring)]",
  },
  debt: {
    label: "Dívida",
    className: "bg-[var(--debt-tag-bg)] text-[var(--debt-tag-text)] ring-[var(--debt-tag-ring)]",
  },
};

export default function Dashboard() {
  const { vaultCards: cards, vault, investmentGoals, syncError } = useWallet();
  const [selectedMonth, setSelectedMonth] = useState(() => getInitialMonthKey());

  const today = todayInputValue();
  const horizonEnd = addDaysToInputDate(today, HORIZON_DAYS);
  const vaultLabel = VAULTS.find((option) => option.id === vault)?.label ?? "Pessoal";

  const overview = useMemo(() => {
    const untilToday = cards.filter((card) => getCardDate(card) <= today);
    const inHorizon = cards.filter((card) => {
      const date = getCardDate(card);
      return date > today && date <= horizonEnd;
    });
    const openDebts = cards
      .filter((card) => card.column === "debt" && getCardDate(card) >= today)
      .sort((a, b) => getCardDate(a).localeCompare(getCardDate(b)));

    const moneyToday =
      sumByColumn(untilToday, "income") - sumByColumn(untilToday, "expense") - sumByColumn(untilToday, "debt");
    const toReceive = sumByColumn(inHorizon, "income");
    const toPay = sumByColumn(inHorizon, "expense") + sumByColumn(inHorizon, "debt");

    const upcoming = cards
      .filter((card) => getCardDate(card) > today)
      .sort((a, b) => getCardDate(a).localeCompare(getCardDate(b)))
      .slice(0, 8);

    return {
      moneyToday,
      toReceive,
      toPay,
      projection: moneyToday + toReceive - toPay,
      openDebtTotal: openDebts.reduce((sum, card) => sum + card.amount, 0),
      nextDebts: openDebts.slice(0, 5),
      upcoming,
    };
  }, [cards, horizonEnd, today]);

  const monthSummary = useMemo(
    () => summarizeMonth(cards, selectedMonth, investmentGoals[selectedMonth] ?? 0),
    [cards, investmentGoals, selectedMonth]
  );

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of monthSummary.cards) {
      if (card.column !== "expense") continue;
      const category = card.category ?? "Outros";
      map.set(category, (map.get(category) ?? 0) + card.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthSummary.cards]);

  const maxCategory = expenseByCategory[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Cofre {vaultLabel}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Visão geral
              </h1>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Valores calculados com o que já foi lançado e com as entradas e contas futuras.
            </p>
          </div>

          {syncError && (
            <div className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {syncError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Dinheiro hoje"
              value={overview.moneyToday}
              hint="Tudo que entrou menos o que saiu até hoje"
              tone="teal"
            />
            <StatTile
              label={`A receber (${HORIZON_DAYS} dias)`}
              value={overview.toReceive}
              hint="Receitas futuras já lançadas"
              tone="slate"
            />
            <StatTile
              label={`A pagar (${HORIZON_DAYS} dias)`}
              value={overview.toPay}
              hint="Gastos e parcelas que vão vencer"
              tone="orange"
            />
            <StatTile
              label={`Daqui a ${HORIZON_DAYS} dias`}
              value={overview.projection}
              hint="Dinheiro hoje + a receber - a pagar"
              tone="indigo"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        {cards.length === 0 ? (
          <Onboarding vaultLabel={vaultLabel} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Resumo do mês
                    </p>
                    <h2 className="text-lg font-bold text-[var(--text)]">{getMonthLabel(selectedMonth)}</h2>
                  </div>
                  <input
                    type="month"
                    min={START_MONTH_KEY}
                    value={selectedMonth}
                    onChange={(event) =>
                      setSelectedMonth(clampMonthKey(event.target.value || getInitialMonthKey()))
                    }
                    className="h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat label="Receitas" value={monthSummary.income} />
                  <MiniStat label="Gastos" value={monthSummary.expense} />
                  <MiniStat label="Dívidas" value={monthSummary.debt} />
                  <MiniStat label="Saldo do mês" value={monthSummary.balance} highlightNegative />
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Para onde foi o dinheiro
                    </p>
                    <h2 className="text-lg font-bold text-[var(--text)]">
                      Gastos por categoria - {getMonthLabel(selectedMonth)}
                    </h2>
                  </div>
                  <Link
                    href="/financas/importar"
                    className="whitespace-nowrap rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                  >
                    Importar extrato
                  </Link>
                </div>

                {expenseByCategory.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
                    Nenhum gasto lançado neste mês. Importe um extrato ou lance manualmente.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {expenseByCategory.map(([name, value]) => (
                      <li key={name} className="animate-card-in">
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="font-medium text-[var(--text)]">{name}</span>
                          <span className="tabular-nums text-[var(--text-muted)]">
                            {formatBRL(value)}
                            <span className="ml-2 text-xs">
                              {monthSummary.expense > 0
                                ? `${Math.round((value / monthSummary.expense) * 100)}%`
                                : ""}
                            </span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--column-bg)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-[width] duration-500 ease-out"
                            style={{ width: `${Math.min(100, (value / maxCategory) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Quanto estou devendo
                </p>
                <h2 className="mt-2 text-2xl font-bold tabular-nums text-[var(--text)]">
                  {formatBRL(overview.openDebtTotal)}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Parcelas e contas em aberto de hoje em diante.
                </p>

                {overview.nextDebts.length > 0 && (
                  <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
                    {overview.nextDebts.map((card) => (
                      <li key={card.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">{card.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            Vence {formatDate(card.dueDate ?? getCardDate(card))}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold tabular-nums text-[var(--text)]">
                          {formatBRL(card.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      O que vem por aí
                    </p>
                    <h2 className="text-lg font-bold text-[var(--text)]">Próximos lançamentos</h2>
                  </div>
                  <Link
                    href="/financas/lancamentos"
                    className="whitespace-nowrap rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
                  >
                    Lançar
                  </Link>
                </div>

                {overview.upcoming.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
                    Nada agendado. Lance salário, mensalidades e parcelas futuras para projetar seu dinheiro.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
                    {overview.upcoming.map((card) => (
                      <UpcomingRow key={card.id} card={card} />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "teal" | "orange" | "slate" | "indigo";
}) {
  const negative = value < 0;
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: `linear-gradient(135deg, var(--stat-${tone}-from), var(--stat-${tone}-to))`,
        boxShadow: `inset 0 0 0 1px var(--stat-${tone}-ring)`,
        color: `var(--stat-${tone}-text)`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${
          negative ? "text-[var(--negative-value)]" : ""
        }`}
      >
        {formatBRL(value)}
      </p>
      <p className="mt-1 text-[11px] leading-snug opacity-70">{hint}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlightNegative,
}: {
  label: string;
  value: number;
  highlightNegative?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-1 text-sm font-bold tabular-nums sm:text-base ${
          highlightNegative && value < 0 ? "text-[var(--negative-value)]" : "text-[var(--text)]"
        }`}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}

function UpcomingRow({ card }: { card: WalletCard }) {
  const badge = COLUMN_BADGE[card.column];
  const signed = card.column === "income" ? card.amount : -card.amount;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text)]">{card.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badge.className}`}
          >
            {badge.label}
          </span>
          {formatDate(getCardDate(card))}
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-bold tabular-nums ${
          signed < 0 ? "text-[var(--text)]" : "text-[var(--income-tag-text)]"
        }`}
      >
        {signed < 0 ? "-" : "+"}
        {formatBRL(Math.abs(signed))}
      </p>
    </li>
  );
}

function Onboarding({ vaultLabel }: { vaultLabel: string }) {
  const steps = [
    {
      title: "Importe seu extrato",
      text: "Baixe o arquivo OFX no app do seu banco (Nubank, Itaú, Inter...) e solte na tela Importar extrato. O app reconhece e categoriza os gastos sozinho.",
      href: "/importar",
      cta: "Importar extrato",
    },
    {
      title: "Lance o que vem por aí",
      text: "Salário, mensalidades e parcelas futuras entram na tela Lançamentos. É isso que permite projetar seu dinheiro daqui a 30 dias.",
      href: "/lancamentos",
      cta: "Abrir lançamentos",
    },
    {
      title: "Acompanhe por aqui",
      text: "Esta tela mostra quanto você tem, quanto deve e para onde o dinheiro está indo. Use os cofres Pessoal e Trabalho no topo para separar as contas.",
      href: "/",
      cta: "",
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Como começar</p>
      <h2 className="mt-1 text-xl font-bold text-[var(--text)]">
        Seu cofre {vaultLabel} ainda está vazio
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
        Três passos e o painel passa a mostrar suas estatísticas automaticamente.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col rounded-xl bg-[var(--surface-muted)] p-4">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--button-primary-bg)] text-xs font-bold text-[var(--button-primary-text)]">
              {index + 1}
            </span>
            <h3 className="mt-3 text-sm font-bold text-[var(--text)]">{step.title}</h3>
            <p className="mt-1 flex-1 text-sm text-[var(--text-muted)]">{step.text}</p>
            {step.cta && (
              <Link
                href={step.href}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--button-primary-bg)] px-3 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)]"
              >
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
