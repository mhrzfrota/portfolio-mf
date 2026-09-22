import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Download,
  Upload,
  ArrowDownLeft,
  PiggyBank,
  Wallet,
} from "lucide-react";
import InternalShell from "@/components/InternalShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  amountInput,
  emptyFinance,
  emptyMonth,
  isFinanceState,
  money,
  parseAmount,
  storageKey,
  summarize,
  type FinanceState,
} from "@/features/finance/store";
import { todayISO } from "@/features/habits/store";

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-white/20 bg-[#07164a]/30 px-3 py-3 text-sm text-white outline-none focus:border-white/70 focus:ring-1 focus:ring-white/70 [color-scheme:dark]";
const buttonClass =
  "rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#092a9f] transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-50";
function Field({
  label,
  name,
  value,
  hint,
}: {
  label: string;
  name: string;
  value: number;
  hint?: string;
}) {
  return (
    <label className="block min-w-0 text-sm text-white/80">
      {label}
      <input
        className={inputClass}
        name={name}
        defaultValue={amountInput(value)}
        inputMode="decimal"
        required
        autoComplete="off"
      />
      {hint && (
        <span className="mt-2 block text-xs leading-relaxed text-white/60">
          {hint}
        </span>
      )}
    </label>
  );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="board-glass min-w-0 rounded-3xl p-5 sm:p-6">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </section>
  );
}
function readInitial(userId: string): { state: FinanceState; error: string } {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { state: emptyFinance(), error: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!isFinanceState(parsed)) throw new Error("invalid");
    return { state: parsed, error: "" };
  } catch {
    return {
      state: emptyFinance(),
      error:
        "Não foi possível ler os dados salvos. Para preservar seu histórico, a edição foi bloqueada. Recarregue a página ou importe um backup válido.",
    };
  }
}
export default function Finance() {
  const { user } = useAuth();
  return user ? <FinanceContent key={user.id} userId={user.id} /> : null;
}
function FinanceContent({ userId }: { userId: string }) {
  const [initial] = useState(() => readInitial(userId));
  const [state, setState] = useState(initial.state);
  const [blocked, setBlocked] = useState(!!initial.error);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [revision, setRevision] = useState(0);
  const upload = useRef<HTMLInputElement>(null);
  const report = summarize(state, month);
  const current = state.months[month] ?? emptyMonth();
  function save(next: FinanceState): boolean {
    try {
      if (!isFinanceState(next)) throw new Error("invalid");
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setState(next);
      setError("");
      setNotice("Dados salvos neste navegador.");
      return true;
    } catch {
      setNotice("");
      setError(
        "Não foi possível salvar. Verifique o espaço ou as permissões do navegador e tente novamente."
      );
      return false;
    }
  }
  function amounts(form: HTMLFormElement, names: string[]) {
    const data = new FormData(form);
    const values = names.map(name => parseAmount(String(data.get(name) ?? "")));
    if (values.some(v => v === null)) {
      setNotice("");
      setError(
        "Informe valores válidos em reais, como 1.500,50, sem números negativos."
      );
      return null;
    }
    return values as number[];
  }
  function saveMonth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = amounts(event.currentTarget, [
      "income",
      "expenses",
      "saved",
    ]);
    if (!values || blocked) return;
    const [income, expenses, saved] = values;
    save({
      ...state,
      months: { ...state.months, [month]: { income, expenses, saved } },
    });
  }
  function savePosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = amounts(event.currentTarget, ["balance", "reserve", "goal"]);
    if (!values || blocked) return;
    const [balance, reserve, goal] = values;
    const rate = Number(new FormData(event.currentTarget).get("rate"));
    if (reserve > balance) {
      setNotice("");
      setError(
        "O valor guardado deve fazer parte do saldo total e não pode ser maior que ele."
      );
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError("Escolha um percentual entre 0 e 100.");
      return;
    }
    save({
      ...state,
      balance,
      reserve,
      goal,
      rate,
      updatedAt: new Date().toISOString(),
    });
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `mf-financeiro-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <InternalShell title="Financeiro">
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
        <p className="max-w-lg text-sm leading-relaxed text-white/70">
          Clareza sobre o que entra, o que fica e o que você quer construir.
        </p>
        <label className="text-xs text-white/70">
          Mês de referência
          <input
            aria-label="Mês de referência"
            className={inputClass}
            type="month"
            required
            value={month}
            onChange={e => {
              if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) {
                setMonth(e.target.value);
                setNotice("");
                setError(blocked ? initial.error : "");
              }
            }}
          />
        </label>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Saldo atual",
            value: state.balance,
            detail: `Disponível fora da reserva: ${money(report.available)}`,
            icon: Wallet,
          },
          {
            title: "Recebido no mês",
            value: report.income,
            detail: state.months[month]
              ? `Após os gastos: ${money(report.surplus)}`
              : "Nenhum resumo salvo neste mês",
            icon: ArrowDownLeft,
          },
          {
            title: "Guardado hoje",
            value: state.reserve,
            detail: "Já incluído no saldo total",
            icon: PiggyBank,
          },
        ].map(({ title, value, detail, icon: Icon }) => (
          <div key={title} className="board-glass min-w-0 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm text-white/70">
              {title}
              <Icon size={18} />
            </div>
            <p className="mt-4 break-words text-2xl font-medium tracking-tight lg:text-3xl">
              {money(value)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              {detail}
            </p>
          </div>
        ))}
      </div>
      <div aria-live="polite" className="mt-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-amber-200/40 bg-amber-950/30 p-4 text-sm text-amber-100"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-white/80">
            {notice}
          </p>
        )}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Resumo do mês">
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            Preencha os totais do mês selecionado. Você pode voltar e corrigir
            quando precisar.
          </p>
          <form
            key={`month-${month}-${revision}`}
            onSubmit={saveMonth}
            className="mt-5 space-y-4"
          >
            <fieldset disabled={blocked} className="space-y-4">
              <Field
                name="income"
                label="Quanto recebi (R$)"
                value={current.income}
              />
              <Field
                name="expenses"
                label="Quanto gastei (R$)"
                value={current.expenses}
              />
              <Field
                name="saved"
                label="Quanto guardei neste mês (R$)"
                value={current.saved}
                hint="Só o que você separou neste mês. Guardar dinheiro não conta como gasto."
              />
              <button className={buttonClass}>Salvar mês</button>
            </fieldset>
          </form>
        </Panel>
        <Panel title="Minha posição hoje">
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            Uma fotografia do seu dinheiro. Os resumos mensais não alteram estes
            saldos automaticamente.
          </p>
          <form
            key={`position-${revision}`}
            onSubmit={savePosition}
            className="mt-5 space-y-4"
          >
            <fieldset disabled={blocked} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="balance"
                  label="Saldo total atual (R$)"
                  value={state.balance}
                />
                <Field
                  name="reserve"
                  label="Deste total, guardado (R$)"
                  value={state.reserve}
                />
              </div>
              <Field
                name="goal"
                label="Meta de reserva (R$)"
                value={state.goal}
              />
              <label className="block text-sm text-white/80">
                Quero guardar (%) do que recebo
                <input
                  name="rate"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  defaultValue={state.rate}
                  className={inputClass}
                />
              </label>
              <button className={buttonClass}>Atualizar posição</button>
            </fieldset>
          </form>
          <p className="mt-3 text-xs text-white/60">
            {state.updatedAt
              ? `Atualizada em ${new Date(state.updatedAt).toLocaleDateString("pt-BR")}`
              : "Informe os saldos para começar."}
          </p>
        </Panel>
      </div>
      <section className="mt-5 rounded-3xl bg-white p-5 text-[#17213b] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Seu próximo passo</h2>
          <span className="text-sm text-[#526078]">
            {state.goal > 0
              ? `${Math.round(report.progress)}% da meta`
              : "Defina sua meta de reserva"}
          </span>
        </div>
        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7ecf5]"
          role="progressbar"
          aria-label="Progresso da reserva"
          aria-valuenow={Math.round(report.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#0c2afe]"
            style={{ width: `${report.progress}%` }}
          />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[#526078]">
              Objetivo neste mês · {state.rate}% das entradas
            </p>
            <p className="mt-2 text-2xl font-medium">{money(report.target)}</p>
            <p className="mt-2 text-sm text-[#526078]">
              {state.rate === 0
                ? "Escolha acima o percentual que quer guardar."
                : report.toSave > 0
                  ? `Faltam ${money(report.toSave)} para o objetivo mensal.`
                  : report.income > 0
                    ? "Objetivo mensal alcançado."
                    : "Registre suas entradas para calcular o objetivo."}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#526078]">Para completar a reserva</p>
            <p className="mt-2 text-2xl font-medium">
              {state.goal > 0 ? money(report.remaining) : "Meta em aberto"}
            </p>
            <p className="mt-2 text-sm text-[#526078]">
              {state.goal > 0
                ? `Meta total de ${money(state.goal)}.`
                : "Dê um valor ao que você quer construir."}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#526078]">
              Se repetir o valor guardado neste mês
            </p>
            <p className="mt-2 text-2xl font-medium">
              {state.goal === 0
                ? "A definir"
                : report.remaining === 0
                  ? "Meta alcançada"
                  : report.monthsToGoal === null
                    ? "Sem projeção"
                    : `${report.monthsToGoal} ${report.monthsToGoal === 1 ? "mês" : "meses"}`}
            </p>
            <p className="mt-2 text-sm text-[#526078]">
              Simulação de novos aportes, sem rendimentos ou retiradas.
            </p>
          </div>
        </div>
        {report.surplus < 0 ? (
          <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Os gastos superaram as entradas em {money(-report.surplus)} neste
            mês.
          </p>
        ) : report.target > report.surplus ? (
          <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            A sobra de {money(report.surplus)} neste mês está abaixo do objetivo
            de guardar {money(report.target)}.
          </p>
        ) : null}
        {report.saved > Math.max(0, report.surplus) && (
          <p className="mt-4 text-sm text-[#526078]">
            O valor guardado supera a sobra do mês. Confira se parte veio de um
            saldo anterior.
          </p>
        )}
      </section>
      <div className="mt-5">
        <Panel title="Histórico mensal">
          {Object.keys(state.months).length === 0 ? (
            <p className="py-6 text-sm text-white/65">
              Seu histórico começa com o primeiro mês salvo.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">
                  Totais recebidos, gastos e guardados por mês
                </caption>
                <thead className="text-xs text-white/60">
                  <tr>
                    {["Mês", "Recebido", "Gastos", "Sobra", "Guardado"].map(
                      label => (
                        <th
                          key={label}
                          scope="col"
                          className="py-3 pr-5 font-normal"
                        >
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(state.months)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([key, summary]) => (
                      <tr key={key} className="border-t border-white/15">
                        <th scope="row" className="py-4 pr-5 font-normal">
                          <button
                            className="rounded text-white underline decoration-white/40 underline-offset-4 focus-visible:outline-2"
                            onClick={() => {
                              setMonth(key);
                              setNotice("");
                              window.scrollTo({ top: 0, behavior: "instant" });
                            }}
                          >
                            {key.slice(5)}/{key.slice(0, 4)}
                          </button>
                        </th>
                        {[
                          summary.income,
                          summary.expenses,
                          summary.income - summary.expenses,
                          summary.saved,
                        ].map((value, i) => (
                          <td
                            key={i}
                            className="whitespace-nowrap py-4 pr-5 tabular-nums"
                          >
                            {money(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/65">
        <p className="max-w-lg leading-relaxed">
          Dados salvos apenas neste navegador, por conta. Exporte um backup para
          guardar ou levar para outro dispositivo.
        </p>
        <div className="flex gap-4">
          <button
            disabled={blocked}
            onClick={exportData}
            className="flex items-center gap-2 rounded py-2 text-white disabled:opacity-40"
          >
            <Download size={15} />
            Exportar
          </button>
          <button
            onClick={() => upload.current?.click()}
            className="flex items-center gap-2 rounded py-2 text-white"
          >
            <Upload size={15} />
            Importar
          </button>
          <input
            ref={upload}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Importar backup financeiro"
            onChange={async e => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                if (file.size > 2_000_000) throw new Error("size");
                const parsed: unknown = JSON.parse(await file.text());
                if (!isFinanceState(parsed)) throw new Error("invalid");
                if (
                  !window.confirm(
                    "Importar este backup substituirá os dados financeiros deste navegador. Deseja continuar?"
                  )
                )
                  return;
                if (save(parsed)) {
                  setBlocked(false);
                  setRevision(r => r + 1);
                }
              } catch {
                setNotice("");
                setError(
                  "Backup inválido. Escolha um arquivo JSON exportado pelo Financeiro (até 2 MB)."
                );
              }
            }}
          />
        </div>
      </footer>
    </InternalShell>
  );
}
