import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as clienteDoPortfolio } from "@/lib/supabase";
import {
  deleteInvestmentGoal,
  deleteWalletCard,
  importCardsBatch,
  loadCategoryRules,
  loadWalletData,
  materializeRecurring,
  saveInvestmentGoal,
  saveWalletCard,
  updateCardCategory as updateCardCategoryInDb,
  upsertCategoryRule,
  type FrtcSupabaseClient,
  type InvestmentGoals,
} from "@/features/financas/dados";
import { keywordFromDescription, type CategoryRule } from "@shared/financas/categorize";
import {
  cardVault,
  defaultDateForMonth,
  HIDE_VALUES_KEY,
  newId,
  setMoneyHidden,
  VAULT_STORAGE_KEY,
  type CardDraft,
  type ExpenseCategory,
  type Vault,
  type WalletCard,
} from "@shared/financas/wallet";

/**
 * Dados da aba Finanças (o FRTCASH dentro do sistema interno). O login é o do
 * portfólio: a rota já passa pelo ProtectedRoute, e o RLS separa por usuário.
 */
export interface WalletContextValue {
  supabase: FrtcSupabaseClient | null;
  user: User | null;
  ready: boolean;
  syncing: boolean;
  syncError: string | null;
  setSyncError: (message: string | null) => void;
  vault: Vault;
  setVault: (vault: Vault) => void;
  /** Todos os lançamentos (os dois cofres). */
  cards: WalletCard[];
  /** Só os do cofre ativo. */
  vaultCards: WalletCard[];
  investmentGoals: InvestmentGoals;
  rules: CategoryRule[];
  existingFitids: Set<string>;
  addCards: (drafts: CardDraft[], baseMonth?: string) => void;
  removeCard: (id: string) => void;
  /** Corrige a categoria e ensina a regra para as próximas compras no mesmo lugar. */
  updateCardCategory: (id: string, category: ExpenseCategory) => void;
  /** Gera os recorrentes do mês e recarrega os lançamentos. */
  reloadCards: () => Promise<void>;
  hideValues: boolean;
  toggleHideValues: () => void;
  setGoal: (monthKey: string, amount: number | null) => void;
  saveRule: (rule: CategoryRule) => void;
  importCards: (cards: WalletCard[]) => Promise<WalletCard[]>;
}

/** Exportado só para a prévia de desenvolvimento (/dev/financas). */
export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet precisa estar dentro do FinancasProvider.");
  return value;
}

function mensagemDeErro(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/frtcash_|schema cache|does not exist/i.test(message) && /column|relation|table|find/i.test(message)) {
    return "As tabelas de Finanças ainda não existem: rode a migration 0010_financas.sql no Supabase.";
  }
  return message || "Não foi possível falar com o banco agora.";
}

/** Último dia do mês corrente: os recorrentes do mês aparecem já no começo dele. */
function fimDoMes(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export default function FinancasProvider({ children }: { children: ReactNode }) {
  const supabase = clienteDoPortfolio as unknown as FrtcSupabaseClient | null;
  const { user } = useAuth();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [investmentGoals, setInvestmentGoals] = useState<InvestmentGoals>({});
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [vault, setVaultState] = useState<Vault>("personal");
  const [hideValues, setHideValues] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved === "work" || saved === "personal") setVaultState(saved);
      if (localStorage.getItem(HIDE_VALUES_KEY) === "1") {
        setMoneyHidden(true);
        setHideValues(true);
      }
    } catch {
      /* sem armazenamento: começa no Pessoal e com os valores à mostra */
    }
    return () => setMoneyHidden(false); // fora da aba Finanças os valores voltam ao normal
  }, []);

  const setVault = useCallback((next: Vault) => {
    setVaultState(next);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleHideValues = useCallback(() => {
    setHideValues((prev) => {
      const next = !prev;
      setMoneyHidden(next);
      try {
        localStorage.setItem(HIDE_VALUES_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setReady(true);
      return;
    }
    let active = true;
    setSyncing(true);
    setSyncError(null);

    (async () => {
      try {
        // Gera os recorrentes do mês antes de ler. Sem a migration, segue sem eles.
        await materializeRecurring(supabase, fimDoMes()).catch(() => 0);
        const data = await loadWalletData(supabase, user.id);
        if (!active) return;
        setCards(data.cards);
        setInvestmentGoals(data.investmentGoals);
      } catch (error) {
        if (active) setSyncError(mensagemDeErro(error));
      } finally {
        if (active) {
          setReady(true);
          setSyncing(false);
        }
      }
    })();

    void loadCategoryRules(supabase, user.id)
      .then((loaded) => active && setRules(loaded))
      .catch(() => active && setRules([]));

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const addCards = useCallback(
    (drafts: CardDraft[], baseMonth?: string) => {
      const valid = drafts.filter((draft) => draft.title.trim() && Number.isFinite(draft.amount) && draft.amount > 0);
      if (valid.length === 0) return;
      if (!supabase || !user) {
        setSyncError("Entre para salvar seus lançamentos.");
        return;
      }
      const now = new Date().toISOString();
      const fallbackDate = defaultDateForMonth(baseMonth ?? now.slice(0, 7));
      const novos: WalletCard[] = valid.map((draft) => ({
        id: newId(),
        title: draft.title.trim(),
        amount: draft.amount,
        column: draft.column,
        vault: draft.vault ?? vault,
        occurredAt: draft.occurredAt || fallbackDate,
        createdAt: now,
        ...(draft.fitid ? { fitid: draft.fitid } : {}),
        ...(draft.column === "income" && draft.incomeSource ? { incomeSource: draft.incomeSource } : {}),
        ...(draft.column === "expense" && draft.category ? { category: draft.category } : {}),
        ...(draft.column === "debt" && draft.dueDate ? { dueDate: draft.dueDate } : {}),
      }));
      setSyncError(null);
      setCards((prev) => [...novos, ...prev]);
      void Promise.all(novos.map((card) => saveWalletCard(supabase, user.id, card))).catch((error: unknown) => {
        const ids = new Set(novos.map((card) => card.id));
        setCards((prev) => prev.filter((card) => !ids.has(card.id)));
        setSyncError(mensagemDeErro(error));
      });
    },
    [supabase, user, vault]
  );

  const removeCard = useCallback(
    (id: string) => {
      if (!supabase || !user) return;
      const removed = cards.find((card) => card.id === id);
      setSyncError(null);
      setCards((prev) => prev.filter((card) => card.id !== id));
      void deleteWalletCard(supabase, user.id, id).catch((error: unknown) => {
        if (removed) setCards((prev) => [removed, ...prev]);
        setSyncError(mensagemDeErro(error));
      });
    },
    [cards, supabase, user]
  );

  const updateCardCategory = useCallback(
    (id: string, category: ExpenseCategory) => {
      if (!supabase || !user) return;
      const previous = cards.find((card) => card.id === id);
      if (!previous || previous.column !== "expense" || previous.category === category) return;
      setSyncError(null);
      setCards((prev) => prev.map((card) => (card.id === id ? { ...card, category } : card)));
      void updateCardCategoryInDb(supabase, user.id, id, category).catch((error: unknown) => {
        setCards((prev) => prev.map((card) => (card.id === id ? previous : card)));
        setSyncError(mensagemDeErro(error));
      });
      // A captura do iPhone aprende pelo histórico do lugar; a regra cobre também o extrato OFX.
      const keyword = keywordFromDescription(previous.title);
      if (keyword.length >= 3) {
        setRules((prev) => [...prev.filter((rule) => rule.keyword !== keyword), { keyword, category }]);
        void upsertCategoryRule(supabase, user.id, { keyword, category }).catch(() => {
          /* regra é conveniência */
        });
      }
    },
    [cards, supabase, user]
  );

  const reloadCards = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      await materializeRecurring(supabase, fimDoMes()).catch(() => 0);
      const data = await loadWalletData(supabase, user.id);
      setCards(data.cards);
    } catch (error) {
      setSyncError(mensagemDeErro(error));
    }
  }, [supabase, user]);

  const setGoal = useCallback(
    (monthKey: string, amount: number | null) => {
      setSyncError(null);
      const valido = amount !== null && Number.isFinite(amount) && amount > 0;
      setInvestmentGoals((prev) => {
        const next = { ...prev };
        if (valido) next[monthKey] = amount as number;
        else delete next[monthKey];
        return next;
      });
      if (!supabase || !user) return;
      const pedido = valido
        ? saveInvestmentGoal(supabase, user.id, monthKey, amount as number)
        : deleteInvestmentGoal(supabase, user.id, monthKey);
      void pedido.catch((error: unknown) => setSyncError(mensagemDeErro(error)));
    },
    [supabase, user]
  );

  const saveRule = useCallback(
    (rule: CategoryRule) => {
      if (!rule.keyword || rule.keyword.length < 3) return;
      setRules((prev) => [...prev.filter((item) => item.keyword !== rule.keyword), rule]);
      if (!supabase || !user) return;
      void upsertCategoryRule(supabase, user.id, rule).catch(() => {
        /* regra é conveniência */
      });
    },
    [supabase, user]
  );

  const importCards = useCallback(
    async (toImport: WalletCard[]): Promise<WalletCard[]> => {
      if (!supabase || !user) throw new Error("Entre para importar extratos.");
      try {
        const inserted = await importCardsBatch(supabase, user.id, toImport);
        if (inserted.length > 0) setCards((prev) => [...inserted, ...prev]);
        return inserted;
      } catch (error) {
        throw new Error(mensagemDeErro(error));
      }
    },
    [supabase, user]
  );

  const vaultCards = useMemo(() => cards.filter((card) => cardVault(card) === vault), [cards, vault]);
  const existingFitids = useMemo(() => new Set(cards.flatMap((card) => (card.fitid ? [card.fitid] : []))), [cards]);

  const value = useMemo<WalletContextValue>(
    () => ({
      supabase,
      user,
      ready,
      syncing,
      syncError,
      setSyncError,
      vault,
      setVault,
      cards,
      vaultCards,
      investmentGoals,
      rules,
      existingFitids,
      addCards,
      removeCard,
      updateCardCategory,
      reloadCards,
      hideValues,
      toggleHideValues,
      setGoal,
      saveRule,
      importCards,
    }),
    [supabase, user, ready, syncing, syncError, vault, setVault, cards, vaultCards, investmentGoals, rules, existingFitids, addCards, removeCard, updateCardCategory, reloadCards, hideValues, toggleHideValues, setGoal, saveRule, importCards]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
