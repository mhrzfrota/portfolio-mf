import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/components/financas/FinancasProvider";
import { loadCouplePlan, saveCouplePlan } from "@/features/financas/dados";
import {
  buildPlanSummary,
  buildSuggestions,
  DEFAULT_PLAN,
  formatBRL,
  monthLabel,
  type CouplePlan,
} from "@shared/financas/coupleGoal";

function parseAmount(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(/R\$/gi, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export default function CoupleGoal() {
  const { supabase, user } = useWallet();
  const [plan, setPlan] = useState<CouplePlan>(DEFAULT_PLAN);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // O plano mora no banco (no FRTCASH ficava só no navegador).
  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    loadCouplePlan(supabase, user.id)
      .then((saved) => {
        if (!active) return;
        if (saved) setPlan({ ...DEFAULT_PLAN, ...saved });
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSaveError((error as Error).message);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!ready || !supabase || !user) return;
    const timer = setTimeout(() => {
      saveCouplePlan(supabase, user.id, plan)
        .then(() => setSaveError(null))
        .catch((error: unknown) => setSaveError((error as Error).message));
    }, 600);
    return () => clearTimeout(timer);
  }, [plan, ready, supabase, user]);

  const summary = useMemo(() => buildPlanSummary(plan), [plan]);
  const suggestions = useMemo(
    () => buildSuggestions(summary.shortfallPerMonth),
    [summary.shortfallPerMonth]
  );

  const accumulatedNow = plan.saved;
  const overallPercent = plan.goal > 0 ? Math.min(100, (accumulatedNow / plan.goal) * 100) : 0;
  const perPerson = plan.monthly / 2;

  const update = <K extends keyof CouplePlan>(key: K, value: CouplePlan[K]) =>
    setPlan((prev) => ({ ...prev, [key]: value }));

  const statusMessage = summary.onTrack
    ? `No ritmo de ${formatBRL(plan.monthly)}/mês vocês fecham a meta${
        summary.reachedMonthKey ? ` em ${monthLabel(summary.reachedMonthKey)}` : ""
      } e ainda sobram ${formatBRL(Math.abs(summary.gap))}.`
    : `Mantendo ${formatBRL(plan.monthly)}/mês, no prazo faltam ${formatBRL(
        summary.gap
      )}. Para chegar lá, o aporte precisa subir para ${formatBRL(summary.requiredMonthly)}/mês.`;

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Planejamento a dois
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Meta a Dois 💚
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
              Um cronograma simples para você e ela juntarem o valor combinado até o fim do prazo, com
              ideias para chegar lá mais rápido.
            </p>
          </div>
          {saveError && <p className="text-xs font-semibold text-[var(--danger)]">{saveError}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero progresso */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Já guardado
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--text)] sm:text-4xl">
                {formatBRL(accumulatedNow)}{" "}
                <span className="text-lg font-semibold text-[var(--text-muted)]">
                  / {formatBRL(plan.goal)}
                </span>
              </p>
            </div>
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                summary.onTrack
                  ? "bg-[var(--income-tag-bg)] text-[var(--income-tag-text)] ring-1 ring-[var(--income-tag-ring)]"
                  : "bg-[var(--expense-tag-bg)] text-[var(--expense-tag-text)] ring-1 ring-[var(--expense-tag-ring)]"
              }`}
            >
              {summary.onTrack ? "No caminho certo" : "Precisa acelerar"}
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--column-bg)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-[width] duration-500 ease-out"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{statusMessage}</p>
        </section>

        {/* Indicadores */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill label="Faltam para a meta" value={Math.max(0, plan.goal - accumulatedNow)} tone="slate" />
          <StatPill label="Aporte ideal / mês" value={summary.requiredMonthly} tone="indigo" />
          <StatPill label="Projeção no prazo" value={summary.projectedEnd} tone={summary.onTrack ? "teal" : "orange"} />
          <StatPill label="Meses restantes" value={summary.monthsRemaining} tone="slate" isCount />
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Configuração do plano */}
          <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Plano</p>
              <h2 className="text-lg font-bold text-[var(--text)]">Ajustes do casal</h2>
            </div>

            <MoneyField
              label="Meta total"
              value={plan.goal}
              onChange={(v) => update("goal", v)}
              placeholder="10000"
            />
            <MoneyField
              label="Já guardado"
              value={plan.saved}
              onChange={(v) => update("saved", v)}
              placeholder="0"
            />
            <MoneyField
              label="Aporte combinado por mês"
              value={plan.monthly}
              onChange={(v) => update("monthly", v)}
              placeholder="500"
              hint={`≈ ${formatBRL(perPerson)} por pessoa`}
            />

            <div className="grid grid-cols-2 gap-3">
              <MonthField label="Início" value={plan.startMonth} onChange={(v) => update("startMonth", v)} />
              <MonthField label="Prazo final" value={plan.deadline} onChange={(v) => update("deadline", v)} />
            </div>

            <button
              type="button"
              onClick={() => setPlan(DEFAULT_PLAN)}
              className="h-10 w-full rounded-lg border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]"
            >
              Restaurar padrão
            </button>
          </section>

          {/* Cronograma + soluções */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Cronograma
                  </p>
                  <h2 className="text-lg font-bold text-[var(--text)]">Mês a mês até o prazo</h2>
                </div>
              </div>

              {summary.schedule.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-4 text-sm text-[var(--text-muted)]">
                  Ajuste o início e o prazo para gerar o cronograma.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[440px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Mês</th>
                        <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Aporte</th>
                        <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">Acumulado</th>
                        <th className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">% da meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.schedule.map((row) => (
                        <tr
                          key={row.monthKey}
                          className={row.reached ? "bg-[var(--income-tag-bg)] text-[var(--text)]" : "text-[var(--text)]"}
                        >
                          <td className="border-b border-[var(--border-subtle)] px-3 py-2 font-semibold">
                            {monthLabel(row.monthKey)}
                            {row.reached && <span className="ml-1">🎯</span>}
                          </td>
                          <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                            {formatBRL(row.contribution)}
                          </td>
                          <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums font-semibold">
                            {formatBRL(row.accumulated)}
                          </td>
                          <td className="border-b border-[var(--border-subtle)] px-3 py-2 tabular-nums">
                            {Math.round(row.percent)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Soluções
              </p>
              <h2 className="text-lg font-bold text-[var(--text)]">
                {summary.onTrack ? "Como chegar ainda mais rápido" : "Como fechar a diferença"}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {summary.onTrack
                  ? "Vocês já fecham no prazo. Estas ideias antecipam a meta ou criam uma folga extra."
                  : `Faltam ${formatBRL(summary.shortfallPerMonth)}/mês. Combine algumas ideias abaixo para cobrir esse valor.`}
              </p>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.title}
                    className="animate-card-in rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-[var(--text)]">{suggestion.title}</h3>
                      <span className="shrink-0 rounded-md bg-[var(--income-tag-bg)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--income-tag-text)] ring-1 ring-[var(--income-tag-ring)]">
                        +{formatBRL(suggestion.estimate)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">{suggestion.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
  isCount,
}: {
  label: string;
  value: number;
  tone: "teal" | "orange" | "slate" | "indigo";
  isCount?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-sm"
      style={{
        background: `linear-gradient(135deg, var(--stat-${tone}-from), var(--stat-${tone}-to))`,
        boxShadow: `inset 0 0 0 1px var(--stat-${tone}-ring)`,
        color: `var(--stat-${tone}-text)`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums sm:text-xl">
        {isCount ? `${value} ${value === 1 ? "mês" : "meses"}` : formatBRL(value)}
      </p>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(value ? String(value).replace(".", ",") : "");
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <input
        value={draft}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(parseAmount(event.target.value));
        }}
        className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
      />
      {hint && <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

function MonthField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <input
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
      />
    </label>
  );
}
