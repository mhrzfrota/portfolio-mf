// Só no pnpm dev (/dev/financas): a aba Finanças com dados de exemplo, sem login e sem banco.
import { useMemo, useState } from "react";
import InternalShell from "@/components/InternalShell";
import { WalletContext, type WalletContextValue } from "@/components/financas/FinancasProvider";
import { FinancasConteudo } from "@/pages/Financas";
import { setMoneyHidden, type ExpenseCategory, type Vault, type WalletCard } from "@shared/financas/wallet";

const LUGARES: [string, ExpenseCategory, number][] = [
  ["iFood *Restaurante", "Alimentação", 38.9], ["Posto Ipiranga Aldeota", "Gasolina", 180], ["Uber *Trip", "Transporte", 22.5],
  ["Pão de Açúcar", "Alimentação", 245.3], ["Farmácia Pague Menos", "Saúde", 64.2], ["Cinemark", "Lazer", 56], ["Spotify", "Assinaturas", 21.9],
];

function dia(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function semente(): WalletCard[] {
  const out: WalletCard[] = [];
  for (let i = 0; i < 95; i += 1) {
    const data = dia(i);
    const n = Number(data.slice(8));
    if (i % 2 === 0) {
      const [title, category, base] = LUGARES[i % LUGARES.length];
      out.push({ id: `g${i}`, title, amount: Math.round((base + (i % 5) * 3.1) * 100) / 100, column: "expense", category, occurredAt: data, createdAt: data, source: i % 3 ? "apple_pay" : "ofx", vault: "personal" });
    }
    if (n === 5) out.push({ id: `s${i}`, title: "Salário", amount: 6500, column: "income", incomeSource: "Salário", occurredAt: data, createdAt: data, source: "recurring", vault: "personal" });
    if (n === 10) out.push({ id: `a${i}`, title: "Aluguel", amount: 1800, column: "expense", category: "Moradia", occurredAt: data, createdAt: data, source: "recurring", vault: "personal" });
    if (n === 15) out.push({ id: `p${i}`, title: "Notebook 3/10", amount: 420, column: "debt", occurredAt: data, createdAt: data, vault: "personal" });
  }
  return out;
}

const TABELAS: Record<string, unknown> = {
  frtcash_category_budgets: [{ id: "b1", category: "Alimentação", monthly_limit: 900 }, { id: "b2", category: "Lazer", monthly_limit: 150 }],
  frtcash_capture_tokens: [{ id: "t1", label: "iPhone do Matheus", vault: "personal", token_prefix: "a1b2c3d4", created_at: new Date().toISOString(), last_used_at: new Date().toISOString(), revoked_at: null }],
  frtcash_recurring: [{ id: "r1", title: "Aluguel", amount: 1800, column_id: "expense", category: "Moradia", income_source: null, day_of_month: 10, starts_on: "2026-01-01", ends_on: null, active: true, generated_until: null }],
  frtcash_couple_plans: null,
};

function clienteFalso() {
  const consulta = (tabela: string): unknown =>
    new Proxy(
      {},
      { get: (_alvo, chave) => (chave === "then" ? (ok: (v: unknown) => void) => ok({ data: TABELAS[tabela] ?? [], error: null }) : () => consulta(tabela)) }
    );
  return {
    from: (tabela: string) => consulta(tabela),
    rpc: async () => ({ data: { id: "t2", token: `frt_${"ab12".repeat(12)}`, token_prefix: "ab12ab12", label: "iPhone", vault: "personal" }, error: null }),
  };
}

export default function FinancasPrevia() {
  const [cards, setCards] = useState(semente);
  const [vault, setVault] = useState<Vault>("personal");
  const [oculto, setOculto] = useState(false);
  const valor = useMemo(
    () =>
      ({
        supabase: clienteFalso(),
        user: { id: "previa" },
        ready: true,
        syncing: false,
        syncError: null,
        setSyncError: () => {},
        vault,
        setVault,
        cards,
        vaultCards: cards.filter((c) => (c.vault ?? "personal") === vault),
        investmentGoals: {},
        rules: [],
        existingFitids: new Set<string>(),
        addCards: () => {},
        removeCard: (id: string) => setCards((l) => l.filter((c) => c.id !== id)),
        updateCardCategory: (id: string, category: ExpenseCategory) => setCards((l) => l.map((c) => (c.id === id ? { ...c, category } : c))),
        reloadCards: async () => {},
        hideValues: oculto,
        toggleHideValues: () => setOculto((o) => { setMoneyHidden(!o); return !o; }),
        setGoal: () => {},
        saveRule: () => {},
        importCards: async () => [],
      }) as unknown as WalletContextValue,
    [cards, vault, oculto]
  );
  return (
    <InternalShell title="Finanças (prévia)">
      <WalletContext.Provider value={valor}>
        <FinancasConteudo />
      </WalletContext.Provider>
    </InternalShell>
  );
}
