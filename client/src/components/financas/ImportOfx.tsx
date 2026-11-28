import { Link } from "wouter";
import { useCallback, useMemo, useRef, useState } from "react";
import { useWallet } from "@/components/financas/FinancasProvider";
import { parseOfx, readOfxFile, type OfxStatement } from "@shared/financas/ofx";
import {
  keywordFromDescription,
  looksLikeInternalTransfer,
  suggestCategory,
  suggestIncomeSource,
} from "@shared/financas/categorize";
import {
  EXPENSE_CATEGORIES,
  formatBRL,
  formatDate,
  INCOME_SOURCES,
  newId,
  VAULTS,
  type ExpenseCategory,
  type IncomeSource,
  type WalletCard,
} from "@shared/financas/wallet";

type Destination = "expense" | "income" | "debt" | "skip";

interface ReviewRow {
  fitid: string;
  date: string;
  amount: number; // negativo = saída
  description: string;
  duplicate: boolean;
  destination: Destination;
  category: ExpenseCategory;
  suggestedCategory: ExpenseCategory | null;
  incomeSource: IncomeSource;
}

type Step =
  | { id: "pick" }
  | { id: "review"; rows: ReviewRow[]; statements: OfxStatement[]; fileNames: string[] }
  | { id: "done"; imported: number; skippedDuplicates: number; learned: number };

const DESTINATION_OPTIONS: { id: Destination; label: string }[] = [
  { id: "expense", label: "Gasto" },
  { id: "income", label: "Receita" },
  { id: "debt", label: "Dívida" },
  { id: "skip", label: "Não importar" },
];

export default function ImportOfx() {
  const { vault, rules, existingFitids, importCards, saveRule } = useWallet();
  const [step, setStep] = useState<Step>({ id: "pick" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const vaultLabel = VAULTS.find((option) => option.id === vault)?.label ?? "Pessoal";

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.name);
      if (list.length === 0) return;

      setError(null);
      setBusy(true);

      try {
        const statements: OfxStatement[] = [];
        for (const file of list) {
          const content = await readOfxFile(file);
          const parsed = parseOfx(content);
          if (parsed.transactions.length === 0) {
            throw new Error(
              `Não encontrei transações em "${file.name}". Confira se o arquivo é um extrato OFX exportado pelo banco.`
            );
          }
          statements.push(parsed);
        }

        const seen = new Set<string>();
        const rows: ReviewRow[] = [];

        for (const statement of statements) {
          for (const transaction of statement.transactions) {
            if (seen.has(transaction.fitid)) continue;
            seen.add(transaction.fitid);

            const internal = looksLikeInternalTransfer(transaction.description);
            const suggested =
              transaction.amount < 0 ? suggestCategory(transaction.description, rules) : null;

            rows.push({
              fitid: transaction.fitid,
              date: transaction.date,
              amount: transaction.amount,
              description: transaction.description,
              duplicate: existingFitids.has(transaction.fitid),
              destination: internal ? "skip" : transaction.amount < 0 ? "expense" : "income",
              category: suggested ?? "Outros",
              suggestedCategory: suggested,
              incomeSource:
                transaction.amount > 0 ? suggestIncomeSource(transaction.description) : "Outros",
            });
          }
        }

        rows.sort((a, b) => b.date.localeCompare(a.date));
        setStep({ id: "review", rows, statements, fileNames: list.map((file) => file.name) });
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : "Não consegui ler esse arquivo.");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [existingFitids, rules]
  );

  const updateRow = useCallback((fitid: string, patch: Partial<ReviewRow>) => {
    setStep((current) => {
      if (current.id !== "review") return current;
      return {
        ...current,
        rows: current.rows.map((row) => (row.fitid === fitid ? { ...row, ...patch } : row)),
      };
    });
  }, []);

  const confirmImport = useCallback(async () => {
    if (step.id !== "review") return;

    const importable = step.rows.filter((row) => !row.duplicate && row.destination !== "skip");
    if (importable.length === 0) {
      setError("Nenhum lançamento selecionado para importar.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const now = new Date().toISOString();
      const cards: WalletCard[] = importable.map((row) => {
        const base = {
          id: newId(),
          title: row.description,
          amount: Math.abs(row.amount),
          vault,
          fitid: row.fitid,
          occurredAt: row.date,
          createdAt: now,
        };

        if (row.destination === "income") {
          return { ...base, column: "income" as const, incomeSource: row.incomeSource };
        }
        if (row.destination === "debt") {
          return { ...base, column: "debt" as const, dueDate: row.date };
        }
        return { ...base, column: "expense" as const, category: row.category };
      });

      const inserted = await importCards(cards);

      // Aprende com as correções: descrição cuja categoria você mudou vira regra.
      let learned = 0;
      for (const row of importable) {
        if (row.destination !== "expense") continue;
        const changed = row.category !== (row.suggestedCategory ?? "Outros");
        if (!changed || row.category === "Outros") continue;
        const keyword = keywordFromDescription(row.description);
        if (keyword.length >= 3) {
          saveRule({ keyword, category: row.category });
          learned += 1;
        }
      }

      setStep({
        id: "done",
        imported: inserted.length,
        skippedDuplicates:
          step.rows.filter((row) => row.duplicate).length + (importable.length - inserted.length),
        learned,
      });
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Não foi possível importar.");
    } finally {
      setBusy(false);
    }
  }, [importCards, saveRule, step, vault]);

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Cofre {vaultLabel}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Importar extrato
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">
            Baixe o extrato em formato OFX no app do seu banco e solte aqui. O app reconhece os gastos,
            sugere categorias e nunca importa a mesma transação duas vezes.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
            {error}
          </div>
        )}

        {step.id === "pick" && (
          <section
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void handleFiles(event.dataTransfer.files);
            }}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging
                ? "border-teal-400 bg-[var(--income-tag-bg)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-bg)]"
            }`}
          >
            <p className="text-4xl">📄</p>
            <h2 className="mt-3 text-lg font-bold text-[var(--text)]">
              Arraste o arquivo OFX para cá
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-muted)]">
              Pode soltar mais de um arquivo de uma vez (conta e cartão, por exemplo). Os lançamentos
              entram no cofre <span className="font-semibold">{vaultLabel}</span>.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-5 h-11 rounded-lg bg-[var(--button-primary-bg)] px-5 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Lendo arquivo..." : "Escolher arquivo"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.qfx,.OFX,.QFX,text/plain"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void handleFiles(event.target.files);
              }}
            />

            <div className="mx-auto mt-8 max-w-lg rounded-xl bg-[var(--surface-muted)] p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Onde acho o OFX?
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                <li>• Nubank: Extrato → ícone de compartilhar → Exportar OFX</li>
                <li>• Itaú / BB / Bradesco / Inter: Extrato → Exportar/Salvar como → OFX</li>
                <li>• Cartão de crédito: a fatura também costuma ter exportação OFX</li>
              </ul>
            </div>
          </section>
        )}

        {step.id === "review" && (
          <ReviewStep
            rows={step.rows}
            statements={step.statements}
            fileNames={step.fileNames}
            busy={busy}
            onUpdateRow={updateRow}
            onConfirm={() => void confirmImport()}
            onCancel={() => {
              setStep({ id: "pick" });
              setError(null);
            }}
          />
        )}

        {step.id === "done" && (
          <section className="mx-auto max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-8 text-center shadow-sm">
            <p className="text-4xl">✅</p>
            <h2 className="mt-3 text-xl font-bold text-[var(--text)]">
              {step.imported} lançamento{step.imported === 1 ? "" : "s"} importado
              {step.imported === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {step.skippedDuplicates > 0 &&
                `${step.skippedDuplicates} já existiam e foram ignorados. `}
              {step.learned > 0 &&
                `O app aprendeu ${step.learned} regra${step.learned === 1 ? "" : "s"} de categoria para as próximas importações.`}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href="/financas"
                className="inline-flex h-11 items-center rounded-lg bg-[var(--button-primary-bg)] px-5 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)]"
              >
                Ver estatísticas
              </Link>
              <button
                type="button"
                onClick={() => setStep({ id: "pick" })}
                className="inline-flex h-11 items-center rounded-lg border border-[var(--border-subtle)] px-5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
              >
                Importar outro arquivo
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ReviewStep({
  rows,
  statements,
  fileNames,
  busy,
  onUpdateRow,
  onConfirm,
  onCancel,
}: {
  rows: ReviewRow[];
  statements: OfxStatement[];
  fileNames: string[];
  busy: boolean;
  onUpdateRow: (fitid: string, patch: Partial<ReviewRow>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const stats = useMemo(() => {
    const duplicates = rows.filter((row) => row.duplicate).length;
    const selected = rows.filter((row) => !row.duplicate && row.destination !== "skip");
    const expenses = selected
      .filter((row) => row.destination !== "income")
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const incomes = selected
      .filter((row) => row.destination === "income")
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const dates = rows.map((row) => row.date).sort();
    const balance = statements.find((statement) => statement.balance !== undefined);

    return {
      duplicates,
      selectedCount: selected.length,
      expenses,
      incomes,
      from: dates[0],
      to: dates[dates.length - 1],
      bankBalance: balance?.balance,
    };
  }, [rows, statements]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {fileNames.join(", ")}
            </p>
            <h2 className="text-lg font-bold text-[var(--text)]">
              Revise antes de importar
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Período de {formatDate(stats.from)} a {formatDate(stats.to)}. Ajuste a categoria onde o
              palpite errou: o app aprende e acerta sozinho na próxima.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--text-muted)]">
              {rows.length} transações
            </span>
            {stats.duplicates > 0 && (
              <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--text-muted)]">
                {stats.duplicates} já importadas
              </span>
            )}
            <span className="rounded-lg bg-[var(--expense-tag-bg)] px-2.5 py-1.5 text-[var(--expense-tag-text)]">
              Saídas {formatBRL(stats.expenses)}
            </span>
            <span className="rounded-lg bg-[var(--income-tag-bg)] px-2.5 py-1.5 text-[var(--income-tag-text)]">
              Entradas {formatBRL(stats.incomes)}
            </span>
            {stats.bankBalance !== undefined && (
              <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--text-muted)]">
                Saldo no banco {formatBRL(stats.bankBalance)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <ReviewRowItem key={row.fitid} row={row} onUpdate={onUpdateRow} />
        ))}
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-4 shadow-lg">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-bold text-[var(--text)]">{stats.selectedCount}</span> lançamento
          {stats.selectedCount === 1 ? "" : "s"} ser{stats.selectedCount === 1 ? "á" : "ão"} importado
          {stats.selectedCount === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || stats.selectedCount === 0}
            onClick={onConfirm}
            className="h-11 rounded-lg bg-[var(--button-primary-bg)] px-5 text-sm font-semibold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Importando..." : "Importar agora"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ReviewRowItem({
  row,
  onUpdate,
}: {
  row: ReviewRow;
  onUpdate: (fitid: string, patch: Partial<ReviewRow>) => void;
}) {
  const outgoing = row.amount < 0;
  const skipped = row.duplicate || row.destination === "skip";

  return (
    <article
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-3 shadow-sm transition-opacity ${
        skipped ? "opacity-55" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-52">
          <p className="truncate text-sm font-semibold text-[var(--text)]" title={row.description}>
            {row.description}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {formatDate(row.date)}
            {row.duplicate && (
              <span className="ml-2 rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Já importado
              </span>
            )}
          </p>
        </div>

        <p
          className={`shrink-0 text-sm font-bold tabular-nums ${
            outgoing ? "text-[var(--text)]" : "text-[var(--income-tag-text)]"
          }`}
        >
          {outgoing ? "-" : "+"}
          {formatBRL(Math.abs(row.amount))}
        </p>

        {!row.duplicate && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <select
              value={row.destination}
              onChange={(event) => onUpdate(row.fitid, { destination: event.target.value as Destination })}
              className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 text-xs font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
            >
              {DESTINATION_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            {row.destination === "expense" && (
              <select
                value={row.category}
                onChange={(event) =>
                  onUpdate(row.fitid, { category: event.target.value as ExpenseCategory })
                }
                className={`h-9 rounded-lg border px-2 text-xs font-semibold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 ${
                  row.suggestedCategory
                    ? "border-teal-400/50 bg-[var(--income-tag-bg)] text-[var(--income-tag-text)]"
                    : "border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text)]"
                }`}
                title={row.suggestedCategory ? "Categoria sugerida automaticamente" : "Escolha a categoria"}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}

            {row.destination === "income" && (
              <select
                value={row.incomeSource}
                onChange={(event) =>
                  onUpdate(row.fitid, { incomeSource: event.target.value as IncomeSource })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 text-xs font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
              >
                {INCOME_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
