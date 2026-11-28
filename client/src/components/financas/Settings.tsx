import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useWallet } from "@/components/financas/FinancasProvider";
import {
  createCaptureToken,
  deleteBudget,
  deleteRecurring,
  listCaptureTokens,
  loadBudgets,
  loadRecurring,
  revokeCaptureToken,
  saveRecurring,
  upsertBudget,
  type CaptureTokenInfo,
  type CategoryBudget,
  type CreatedCaptureToken,
  type Recurring,
} from "@/features/financas/dados";
import {
  EXPENSE_CATEGORIES,
  formatBRL,
  INCOME_SOURCES,
  parseAmount,
  todayInputValue,
  VAULTS,
  type ExpenseCategory,
  type IncomeSource,
  type Vault,
} from "@shared/financas/wallet";

const input =
  "h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30";
const primaryButton =
  "h-10 rounded-lg bg-[var(--button-primary-bg)] px-4 text-sm font-bold text-[var(--button-primary-text)] transition-colors hover:bg-[var(--button-primary-hover)] disabled:opacity-50";
const ghostButton =
  "rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--control-bg-hover)] hover:text-[var(--text)]";

const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function missingV3(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /frtcash_(capture_tokens|category_budgets|recurring)|schema cache|does not exist|não foi possível carregar/i.test(message);
}

export default function Settings() {
  const { vault } = useWallet();
  const vaultLabel = VAULTS.find((option) => option.id === vault)?.label ?? "Pessoal";

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto max-w-[900px] px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ajustes · Cofre {vaultLabel}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Automático e sob controle</h1>
          <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Seções">
            <a href="#iphone" className={ghostButton}>Conectar o iPhone</a>
            <a href="#recorrentes" className={ghostButton}>Recorrentes</a>
            <a href="#limites" className={ghostButton}>Limites por categoria</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[900px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <IphoneSection />
        <RecurringSection />
        <BudgetsSection />
      </main>
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-bg)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{eyebrow}</p>
      <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
      {children}
    </section>
  );
}

function Notice({ tone = "muted", children }: { tone?: "muted" | "danger" | "ok"; children: React.ReactNode }) {
  const styles = {
    muted: "border-dashed border-[var(--border-subtle)] text-[var(--text-muted)]",
    danger: "border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]",
    ok: "border-[var(--income-tag-ring)] bg-[var(--income-tag-bg)] text-[var(--income-tag-text)]",
  }[tone];
  return <p className={`mt-3 rounded-xl border px-3 py-2.5 text-sm font-medium ${styles}`} role={tone === "danger" ? "alert" : undefined}>{children}</p>;
}

const V3_PENDING = "Rode a migration 0010_financas.sql no SQL Editor do Supabase para liberar esta parte.";

/* ── Conectar o iPhone ─────────────────────────────────────────────── */
function IphoneSection() {
  const { supabase, vault } = useWallet();
  const [devices, setDevices] = useState<CaptureTokenInfo[]>([]);
  const [label, setLabel] = useState("iPhone");
  const [deviceVault, setDeviceVault] = useState<Vault>(vault);
  const [created, setCreated] = useState<CreatedCaptureToken | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const endpoint = typeof window === "undefined" ? "/api/financas/captura" : `${window.location.origin}/api/financas/captura`;

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setDevices(await listCaptureTokens(supabase));
      setError(null);
    } catch (err) {
      setError(missingV3(err) ? V3_PENDING : (err as Error).message);
    }
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !label.trim()) return;
    setBusy(true);
    setTestResult(null);
    try {
      setCreated(await createCaptureToken(supabase, label.trim(), deviceVault));
      await refresh();
    } catch (err) {
      setError(missingV3(err) ? V3_PENDING : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function sendTest() {
    if (!created) return;
    setTestResult(null);
    try {
      const response = await fetch("/api/financas/captura", {
        method: "POST",
        headers: { Authorization: `Bearer ${created.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "R$ 0,01", merchant: "Teste Finanças", card: created.label }),
      });
      const body = (await response.json()) as { ok: boolean; message: string };
      setTestResult({ ok: body.ok, message: body.ok ? `${body.message}. Apague em Lançamentos quando quiser.` : body.message });
    } catch {
      setTestResult({ ok: false, message: "Sem resposta do servidor." });
    }
  }

  async function onRevoke(device: CaptureTokenInfo) {
    if (!supabase) return;
    if (!window.confirm(`Desconectar "${device.label}"? A automação desse aparelho para de registrar compras.`)) return;
    try {
      await revokeCaptureToken(supabase, device.id);
      if (created?.id === device.id) setCreated(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const active = devices.filter((device) => !device.revoked_at);

  return (
    <Section id="iphone" eyebrow="Apple Pay" title="Conectar o iPhone">
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Quando você aproxima o iPhone na maquininha, uma automação do app Atalhos manda o valor e o lugar para a aba Finanças.
        O gasto entra na hora, com a categoria da última compra no mesmo lugar, e o iPhone mostra a confirmação.
      </p>

      {error && <Notice tone={error === V3_PENDING ? "muted" : "danger"}>{error}</Notice>}

      {active.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
          {active.map((device) => (
            <li key={device.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {device.label} <span className="font-mono text-xs text-[var(--text-muted)]">frt_{device.token_prefix}…</span>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Cofre {VAULTS.find((v) => v.id === device.vault)?.label} ·{" "}
                  {device.last_used_at ? `última compra ${dateTime.format(new Date(device.last_used_at))}` : "ainda não registrou compra"}
                </p>
              </div>
              <button type="button" onClick={() => void onRevoke(device)} className={ghostButton}>
                Desconectar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!created && error !== V3_PENDING && (
        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Nome do aparelho
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} className={`${input} mt-1`} required />
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Compras caem no cofre
            <select value={deviceVault} onChange={(e) => setDeviceVault(e.target.value as Vault)} className={`${input} mt-1`}>
              {VAULTS.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy || active.length >= 5} className={primaryButton}>
            {busy ? "Gerando..." : "Gerar chave"}
          </button>
        </form>
      )}

      {created && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[var(--income-tag-ring)] bg-[var(--income-tag-bg)] p-4">
            <p className="text-sm font-bold text-[var(--income-tag-text)]">Chave de {created.label}: copie agora</p>
            <p className="mt-1 text-xs text-[var(--income-tag-text)]">
              Ela aparece só esta vez. Se perder, desconecte o aparelho e gere outra.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-[var(--card-bg)] px-3 py-2 font-mono text-xs text-[var(--text)]">
                Bearer {created.token}
              </code>
              <button type="button" onClick={() => void copy(`Bearer ${created.token}`, "token")} className={primaryButton}>
                {copied === "token" ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-[var(--text)]">
            <Step n={1} title="Abra o app Atalhos no iPhone">
              Vá em <b>Automação</b>, toque em <b>+</b> e escolha <b>Transação</b> (Carteira). Marque os cartões que você usa
              no Apple Pay e escolha <b>Executar Imediatamente</b>, sem pedir confirmação.
            </Step>
            <Step n={2} title="Ação “Obter Conteúdo do URL”">
              <span className="mt-1 flex flex-wrap items-center gap-2">
                URL:
                <code className="break-all rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs">{endpoint}</code>
                <button type="button" onClick={() => void copy(endpoint, "url")} className={ghostButton}>
                  {copied === "url" ? "Copiado" : "Copiar"}
                </button>
              </span>
              <span className="mt-1 block">
                Toque na seta para abrir as opções: Método <b>POST</b>. Em Cabeçalhos, adicione <b>Authorization</b> com o
                valor copiado acima (começa com “Bearer”). Em Corpo da Solicitação, escolha <b>JSON</b> e adicione três campos de
                texto: <b>amount</b> com a variável Quantia, <b>merchant</b> com Comerciante e <b>card</b> com Nome (do cartão).
                As três vêm da Entrada do Atalho.
              </span>
            </Step>
            <Step n={3} title="Ação “Obter Valor do Dicionário”">
              Chave <b>message</b>, no Conteúdo do URL da ação anterior.
            </Step>
            <Step n={4} title="Ação “Mostrar Notificação”">
              Com o Valor do Dicionário. Pronto: na próxima compra aparece “R$ 23,90 · iFood · Alimentação”.
            </Step>
          </ol>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
            <button type="button" onClick={() => void sendTest()} className={ghostButton}>
              Enviar compra de teste (R$ 0,01)
            </button>
            <button type="button" onClick={() => setCreated(null)} className={ghostButton}>
              Já configurei
            </button>
          </div>
          {testResult && <Notice tone={testResult.ok ? "ok" : "danger"}>{testResult.message}</Notice>}
        </div>
      )}
    </Section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--button-primary-bg)] text-xs font-bold text-[var(--button-primary-text)]">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <div className="mt-0.5 leading-relaxed text-[var(--text-muted)]">{children}</div>
      </div>
    </li>
  );
}

/* ── Recorrentes ───────────────────────────────────────────────────── */
type RecurringForm = {
  id?: string;
  column_id: "income" | "expense";
  title: string;
  amount: string;
  day_of_month: string;
  category: ExpenseCategory;
  income_source: IncomeSource;
  starts_on: string;
  ends_on: string;
  active: boolean;
};

function emptyRecurring(): RecurringForm {
  return {
    column_id: "expense",
    title: "",
    amount: "",
    day_of_month: String(new Date().getDate()),
    category: "Moradia",
    income_source: "Salário",
    starts_on: `${todayInputValue().slice(0, 7)}-01`,
    ends_on: "",
    active: true,
  };
}

function RecurringSection() {
  const { supabase, vault, reloadCards } = useWallet();
  const [items, setItems] = useState<Recurring[]>([]);
  const [form, setForm] = useState<RecurringForm>(emptyRecurring);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setItems(await loadRecurring(supabase, vault));
      setError(null);
    } catch (err) {
      setError(missingV3(err) ? V3_PENDING : (err as Error).message);
    }
  }, [supabase, vault]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const amount = parseAmount(form.amount);
    const day = Number(form.day_of_month);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !(day >= 1 && day <= 31)) {
      setError("Preencha nome, valor maior que zero e um dia entre 1 e 31.");
      return;
    }
    if (form.ends_on && form.ends_on < form.starts_on) {
      setError("O fim precisa ser depois do início.");
      return;
    }
    setBusy(true);
    try {
      await saveRecurring(supabase, {
        ...(form.id ? { id: form.id } : {}),
        vault,
        title: form.title.trim(),
        amount: Math.round(amount * 100) / 100,
        column_id: form.column_id,
        day_of_month: day,
        starts_on: form.starts_on,
        ends_on: form.ends_on || null,
        active: form.active,
        category: form.column_id === "expense" ? form.category : null,
        income_source: form.column_id === "income" ? form.income_source : null,
      });
      setForm(emptyRecurring());
      await refresh();
      await reloadCards();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item: Recurring) {
    if (!supabase) return;
    if (!window.confirm(`Parar "${item.title}"? Os lançamentos já gerados continuam no histórico.`)) return;
    try {
      await deleteRecurring(supabase, item.id);
      if (form.id === item.id) setForm(emptyRecurring());
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function edit(item: Recurring) {
    setForm({
      id: item.id,
      column_id: item.column_id,
      title: item.title,
      amount: String(item.amount).replace(".", ","),
      day_of_month: String(item.day_of_month),
      category: (item.category ?? "Outros") as ExpenseCategory,
      income_source: (item.income_source ?? "Outros") as IncomeSource,
      starts_on: item.starts_on,
      ends_on: item.ends_on ?? "",
      active: item.active,
    });
    document.getElementById("recorrente-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const set = <K extends keyof RecurringForm>(key: K, value: RecurringForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Section id="recorrentes" eyebrow="Todo mês" title="Lançamentos recorrentes">
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Aluguel, salário, academia, assinaturas: cadastre uma vez e o lançamento de cada mês aparece sozinho no começo do mês.
        Apagou o de um mês? Ele não volta.
      </p>
      {error && <Notice tone={error === V3_PENDING ? "muted" : "danger"}>{error}</Notice>}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
          {items.map((item) => (
            <li key={item.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 ${item.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {item.title} {!item.active && <span className="text-xs font-semibold text-[var(--text-muted)]">(pausado)</span>}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Dia {item.day_of_month} · {item.column_id === "income" ? item.income_source ?? "Entrada" : item.category ?? "Outros"}
                  {item.ends_on ? ` · até ${item.ends_on.split("-").reverse().join("/")}` : ""}
                </p>
              </div>
              <span className={`text-sm font-bold tabular-nums ${item.column_id === "income" ? "text-[var(--accent-income)]" : "text-[var(--text)]"}`}>
                {item.column_id === "income" ? "+" : "−"} {formatBRL(Number(item.amount))}
              </span>
              <button type="button" onClick={() => edit(item)} className={ghostButton}>Editar</button>
              <button type="button" onClick={() => void onDelete(item)} className={ghostButton}>Excluir</button>
            </li>
          ))}
        </ul>
      )}

      {error !== V3_PENDING && (
        <form id="recorrente-form" onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-6">
          <div className="flex rounded-lg bg-[var(--surface-muted)] p-1 sm:col-span-6" role="group" aria-label="Tipo">
            {(["expense", "income"] as const).map((column) => (
              <button
                key={column}
                type="button"
                onClick={() => set("column_id", column)}
                aria-pressed={form.column_id === column}
                className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
                  form.column_id === column ? "bg-[var(--card-bg)] text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"
                }`}
              >
                {column === "expense" ? "Saída" : "Entrada"}
              </button>
            ))}
          </div>
          <label className="text-xs font-semibold text-[var(--text-muted)] sm:col-span-3">
            Nome
            <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Ex.: Aluguel" className={`${input} mt-1`} required />
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
            Valor
            <input value={form.amount} onChange={(e) => set("amount", e.target.value)} inputMode="decimal" placeholder="0,00" className={`${input} mt-1`} required />
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Dia
            <input value={form.day_of_month} onChange={(e) => set("day_of_month", e.target.value)} type="number" min={1} max={31} className={`${input} mt-1`} required />
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
            {form.column_id === "expense" ? "Categoria" : "Fonte"}
            {form.column_id === "expense" ? (
              <select value={form.category} onChange={(e) => set("category", e.target.value as ExpenseCategory)} className={`${input} mt-1`}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <select value={form.income_source} onChange={(e) => set("income_source", e.target.value as IncomeSource)} className={`${input} mt-1`}>
                {INCOME_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
            Começa em
            <input type="date" value={form.starts_on} onChange={(e) => e.target.value && set("starts_on", e.target.value)} className={`${input} mt-1`} required />
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)] sm:col-span-2">
            Termina em (opcional)
            <input type="date" value={form.ends_on} onChange={(e) => set("ends_on", e.target.value)} className={`${input} mt-1`} />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
            {form.id && (
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4" />
                Ativo
              </label>
            )}
            <button type="submit" disabled={busy} className={`${primaryButton} ml-auto`}>
              {busy ? "Salvando..." : form.id ? "Salvar alterações" : "Adicionar recorrente"}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(emptyRecurring())} className={ghostButton}>Cancelar</button>
            )}
          </div>
        </form>
      )}
    </Section>
  );
}

/* ── Limites por categoria ─────────────────────────────────────────── */
function BudgetsSection() {
  const { supabase, vault } = useWallet();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      const loaded = await loadBudgets(supabase, vault);
      setBudgets(loaded);
      setDrafts(Object.fromEntries(loaded.map((b) => [b.category, String(b.monthly_limit).replace(".", ",")])));
      setError(null);
    } catch (err) {
      setError(missingV3(err) ? V3_PENDING : (err as Error).message);
    }
  }, [supabase, vault]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function commit(category: ExpenseCategory) {
    if (!supabase) return;
    const raw = (drafts[category] ?? "").trim();
    const existing = budgets.find((b) => b.category === category);
    try {
      if (!raw) {
        if (existing) await deleteBudget(supabase, existing.id);
      } else {
        const value = parseAmount(raw);
        if (!Number.isFinite(value) || value <= 0) {
          setError(`Limite de ${category} precisa ser um valor maior que zero.`);
          return;
        }
        if (existing && Number(existing.monthly_limit) === Math.round(value * 100) / 100) return;
        await upsertBudget(supabase, vault, category, Math.round(value * 100) / 100);
      }
      setError(null);
      setSaved(category);
      setTimeout(() => setSaved(null), 1500);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Section id="limites" eyebrow="Teto do mês" title="Limites por categoria">
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Deixe em branco para não ter limite. Em Relatórios, no modo Mês, você vê quanto ainda sobra em cada uma.
      </p>
      {error && <Notice tone={error === V3_PENDING ? "muted" : "danger"}>{error}</Notice>}
      {error !== V3_PENDING && (
        <div className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {EXPENSE_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm font-semibold text-[var(--text)]">
              <span>{category}</span>
              <span className="flex items-center gap-2">
                {saved === category && <span className="text-xs font-semibold text-[var(--accent-income)]">Salvo</span>}
                <input
                  value={drafts[category] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [category]: e.target.value }))}
                  onBlur={() => void commit(category)}
                  onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                  inputMode="decimal"
                  placeholder="sem limite"
                  aria-label={`Limite mensal de ${category}`}
                  className="h-9 w-32 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-2 text-right text-sm font-semibold text-[var(--text)] outline-none focus:border-teal-400"
                />
              </span>
            </label>
          ))}
        </div>
      )}
    </Section>
  );
}
