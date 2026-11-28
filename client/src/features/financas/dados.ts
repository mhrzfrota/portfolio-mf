import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaptureEntry, CapturePaymentArgs } from "@shared/financas/captura";
import type { CouplePlan } from "@shared/financas/coupleGoal";
import type { CardSource, ColumnId, ExpenseCategory, IncomeSource, Vault, WalletCard } from "@shared/financas/wallet";
import { toExpenseCategory, type CategoryRule } from "@shared/financas/categorize";

export type InvestmentGoals = Record<string, number>;

export type CaptureTokenInfo = {
  id: string;
  label: string;
  vault: Vault;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type CreatedCaptureToken = Pick<CaptureTokenInfo, "id" | "label" | "vault" | "token_prefix"> & {
  token: string;
};

type OwnedRecord = {
  id: string;
  user_id: string;
  vault: Vault;
  created_at: string;
  updated_at: string;
};

export type CategoryBudget = OwnedRecord & {
  category: ExpenseCategory;
  monthly_limit: number;
};

export type Recurring = OwnedRecord & {
  title: string;
  amount: number;
  column_id: "income" | "expense";
  category: ExpenseCategory | null;
  income_source: IncomeSource | null;
  day_of_month: number;
  starts_on: string;
  ends_on: string | null;
  active: boolean;
  /** Último dia já gerado. Lançamento apagado antes dessa data não é recriado. */
  generated_until: string | null;
};

type RequiredRecurringFields = "title" | "amount" | "column_id" | "day_of_month" | "starts_on";
export type RecurringInput = Pick<Recurring, RequiredRecurringFields | "vault"> &
  Partial<Pick<Recurring, "id" | "category" | "income_source" | "ends_on" | "active">>;

export type Database = {
  public: {
    Tables: {
      frtcash_cards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          column_id: ColumnId;
          vault: Vault;
          fitid: string | null;
          source: CardSource;
          merchant_key: string | null;
          card_label: string | null;
          recurring_id: string | null;
          captured_at: string | null;
          occurred_at: string;
          income_source: IncomeSource | null;
          category: ExpenseCategory | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          column_id: ColumnId;
          vault?: Vault;
          fitid?: string | null;
          source?: CardSource;
          merchant_key?: string | null;
          card_label?: string | null;
          recurring_id?: string | null;
          captured_at?: string | null;
          occurred_at: string;
          income_source?: IncomeSource | null;
          category?: ExpenseCategory | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          amount?: number;
          column_id?: ColumnId;
          vault?: Vault;
          fitid?: string | null;
          source?: CardSource;
          merchant_key?: string | null;
          card_label?: string | null;
          recurring_id?: string | null;
          captured_at?: string | null;
          occurred_at?: string;
          income_source?: IncomeSource | null;
          category?: ExpenseCategory | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      frtcash_couple_plans: {
        Row: { user_id: string; plan: CouplePlan; updated_at: string };
        Insert: { user_id: string; plan: CouplePlan; updated_at?: string };
        Update: { plan?: CouplePlan; updated_at?: string };
        Relationships: [];
      };
      frtcash_capture_tokens: {
        Row: CaptureTokenInfo & { user_id: string; token_hash: string };
        Insert: never;
        Update: Partial<Pick<CaptureTokenInfo, "label" | "vault" | "revoked_at">>;
        Relationships: [];
      };
      frtcash_capture_log: {
        Row: { token_id: string; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      frtcash_category_budgets: {
        Row: CategoryBudget;
        Insert: Pick<CategoryBudget, "category" | "monthly_limit"> & Partial<CategoryBudget>;
        Update: Partial<CategoryBudget>;
        Relationships: [];
      };
      frtcash_recurring: {
        Row: Recurring;
        Insert: Pick<Recurring, RequiredRecurringFields> & Partial<Recurring>;
        Update: Partial<Recurring>;
        Relationships: [];
      };
      frtcash_category_rules: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      frtcash_investment_goals: {
        Row: {
          id: string;
          user_id: string;
          month_key: string;
          target_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_key: string;
          target_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_key?: string;
          target_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      frtcash_create_capture_token: {
        Args: { p_label: string; p_vault?: Vault };
        Returns: CreatedCaptureToken;
      };
      frtcash_capture_payment: {
        Args: CapturePaymentArgs;
        Returns: CaptureEntry;
      };
      frtcash_materialize_recurring: {
        Args: { p_until?: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type FrtcSupabaseClient = SupabaseClient<Database>;

export function rowToCard(row: Database["public"]["Tables"]["frtcash_cards"]["Row"]): WalletCard {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    column: row.column_id,
    vault: row.vault === "work" ? "work" : "personal",
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    ...(row.fitid ? { fitid: row.fitid } : {}),
    source: row.source ?? (row.fitid ? "ofx" : "manual"),
    ...(row.merchant_key != null ? { merchantKey: row.merchant_key } : {}),
    ...(row.card_label != null ? { cardLabel: row.card_label } : {}),
    ...(row.recurring_id != null ? { recurringId: row.recurring_id } : {}),
    ...(row.captured_at != null ? { capturedAt: row.captured_at } : {}),
    ...(row.income_source ? { incomeSource: row.income_source } : {}),
    ...(row.category ? { category: row.category } : {}),
    ...(row.due_date ? { dueDate: row.due_date } : {}),
  };
}

export function cardToRow(
  card: WalletCard,
  userId: string
): Database["public"]["Tables"]["frtcash_cards"]["Insert"] {
  return {
    id: card.id,
    user_id: userId,
    title: card.title,
    amount: card.amount,
    column_id: card.column,
    vault: card.vault ?? "personal",
    fitid: card.fitid ?? null,
    source: card.source ?? (card.fitid ? "ofx" : "manual"),
    merchant_key: card.merchantKey ?? null,
    card_label: card.cardLabel ?? null,
    recurring_id: card.recurringId ?? null,
    captured_at: card.capturedAt ?? null,
    occurred_at: card.occurredAt ?? card.createdAt.slice(0, 10),
    income_source: card.column === "income" ? card.incomeSource ?? "Outros" : null,
    category: card.column === "expense" ? card.category ?? "Outros" : null,
    due_date: card.column === "debt" ? card.dueDate ?? null : null,
    created_at: card.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export async function loadWalletData(
  client: FrtcSupabaseClient,
  userId: string
): Promise<{
  cards: WalletCard[];
  investmentGoals: InvestmentGoals;
}> {
  const [cardsResult, goalsResult] = await Promise.all([
    client
      .from("frtcash_cards")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false }),
    client
      .from("frtcash_investment_goals")
      .select("*")
      .eq("user_id", userId)
      .order("month_key", { ascending: true }),
  ]);

  if (cardsResult.error) throw cardsResult.error;
  if (goalsResult.error) throw goalsResult.error;

  const goals = (goalsResult.data ?? []).reduce<InvestmentGoals>((acc, goal) => {
    acc[goal.month_key] = Number(goal.target_amount);
    return acc;
  }, {});

  return {
    cards: (cardsResult.data ?? []).map(rowToCard),
    investmentGoals: goals,
  };
}

export async function saveWalletCard(
  client: FrtcSupabaseClient,
  userId: string,
  card: WalletCard
): Promise<void> {
  const { error } = await client.from("frtcash_cards").upsert(cardToRow(card, userId), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteWalletCard(
  client: FrtcSupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await client.from("frtcash_cards").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

/** Troca só a categoria: preserva origem, estabelecimento e cartão da captura. */
export async function updateCardCategory(
  client: FrtcSupabaseClient,
  userId: string,
  id: string,
  category: ExpenseCategory
): Promise<void> {
  const { error } = await client
    .from("frtcash_cards")
    .update({ category })
    .eq("user_id", userId)
    .eq("id", id)
    .eq("column_id", "expense");
  if (error) throw error;
}

export async function saveInvestmentGoal(
  client: FrtcSupabaseClient,
  userId: string,
  monthKey: string,
  targetAmount: number
): Promise<void> {
  const { error } = await client.from("frtcash_investment_goals").upsert(
    {
      user_id: userId,
      month_key: monthKey,
      target_amount: targetAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month_key" }
  );

  if (error) throw error;
}

export async function deleteInvestmentGoal(
  client: FrtcSupabaseClient,
  userId: string,
  monthKey: string
): Promise<void> {
  const { error } = await client
    .from("frtcash_investment_goals")
    .delete()
    .eq("user_id", userId)
    .eq("month_key", monthKey);
  if (error) throw error;
}

export async function loadCategoryRules(
  client: FrtcSupabaseClient,
  userId: string
): Promise<CategoryRule[]> {
  const { data, error } = await client
    .from("frtcash_category_rules")
    .select("keyword, category")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    keyword: row.keyword,
    category: toExpenseCategory(row.category),
  }));
}

export async function upsertCategoryRule(
  client: FrtcSupabaseClient,
  userId: string,
  rule: CategoryRule
): Promise<void> {
  const { error } = await client.from("frtcash_category_rules").upsert(
    {
      user_id: userId,
      keyword: rule.keyword,
      category: rule.category,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,keyword" }
  );

  if (error) throw error;
}

/**
 * Insere lançamentos importados do extrato ignorando os que já existem
 * (mesmo user_id + fitid). Retorna os cards que entraram de fato.
 */
export async function importCardsBatch(
  client: FrtcSupabaseClient,
  userId: string,
  cards: WalletCard[]
): Promise<WalletCard[]> {
  if (cards.length === 0) return [];

  const rows = cards.map((card) => cardToRow(card, userId));
  const { data, error } = await client
    .from("frtcash_cards")
    .upsert(rows, { onConflict: "user_id,fitid", ignoreDuplicates: true })
    .select("*");

  if (error) throw error;
  return (data ?? []).map(rowToCard);
}

const TOKEN_COLUMNS = "id, label, vault, token_prefix, created_at, last_used_at, revoked_at";

function requireData<T>(result: { data: T | null; error: unknown }, message: string): T {
  if (result.error || result.data === null) throw new Error(message);
  return result.data;
}

export async function listCaptureTokens(client: FrtcSupabaseClient): Promise<CaptureTokenInfo[]> {
  const result = await client.from("frtcash_capture_tokens").select(TOKEN_COLUMNS).order("created_at", { ascending: false });
  return requireData(result, "Não foi possível carregar os aparelhos.");
}

export async function createCaptureToken(
  client: FrtcSupabaseClient,
  label: string,
  vault: Vault = "personal"
): Promise<CreatedCaptureToken> {
  const result = await client.rpc("frtcash_create_capture_token", { p_label: label.trim(), p_vault: vault });
  if (result.error?.code === "54000") throw new Error("Você já tem cinco aparelhos ativos. Revogue um para continuar.");
  if (result.error?.code === "22023") throw new Error("Confira o nome do aparelho e o cofre.");
  return requireData(result, "Não foi possível criar o token do aparelho.");
}

export async function revokeCaptureToken(client: FrtcSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("frtcash_capture_tokens")
    .update({ revoked_at: new Date().toISOString() }).eq("id", id).is("revoked_at", null);
  if (error) throw new Error("Não foi possível revogar o token.");
}

export async function renameCaptureToken(client: FrtcSupabaseClient, id: string, label: string): Promise<CaptureTokenInfo> {
  const result = await client.from("frtcash_capture_tokens").update({ label: label.trim() })
    .eq("id", id).select(TOKEN_COLUMNS).single();
  return requireData(result, "Não foi possível renomear o aparelho. Confira o nome e se o token está ativo.");
}

export async function loadBudgets(client: FrtcSupabaseClient, vault: Vault): Promise<CategoryBudget[]> {
  const result = await client.from("frtcash_category_budgets").select("*").eq("vault", vault).order("category");
  return requireData(result, "Não foi possível carregar os limites.");
}

export async function upsertBudget(
  client: FrtcSupabaseClient,
  vault: Vault,
  category: ExpenseCategory,
  monthlyLimit: number
): Promise<CategoryBudget> {
  const result = await client.from("frtcash_category_budgets")
    .upsert({ vault, category, monthly_limit: monthlyLimit }, { onConflict: "user_id,vault,category" })
    .select("*").single();
  return requireData(result, "Não foi possível salvar o limite mensal.");
}

export async function deleteBudget(client: FrtcSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("frtcash_category_budgets").delete().eq("id", id);
  if (error) throw new Error("Não foi possível excluir o limite.");
}

export async function loadRecurring(client: FrtcSupabaseClient, vault: Vault): Promise<Recurring[]> {
  const result = await client.from("frtcash_recurring").select("*").eq("vault", vault).order("day_of_month").order("title");
  return requireData(result, "Não foi possível carregar os recorrentes.");
}

export async function saveRecurring(client: FrtcSupabaseClient, draft: RecurringInput): Promise<Recurring> {
  const values = {
    vault: draft.vault,
    title: draft.title.trim(),
    amount: draft.amount,
    column_id: draft.column_id,
    category: draft.column_id === "expense" ? draft.category ?? "Outros" : null,
    income_source: draft.column_id === "income" ? draft.income_source ?? "Outros" : null,
    day_of_month: draft.day_of_month,
    starts_on: draft.starts_on,
    ends_on: draft.ends_on ?? null,
    ...(draft.active !== undefined ? { active: draft.active } : {}),
  };
  const table = client.from("frtcash_recurring");
  const query = draft.id ? table.update(values).eq("id", draft.id) : table.insert(values);
  return requireData(await query.select("*").single(), "Não foi possível salvar o recorrente.");
}

export async function deleteRecurring(client: FrtcSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("frtcash_recurring").delete().eq("id", id);
  if (error) throw new Error("Não foi possível excluir o recorrente.");
}

export async function materializeRecurring(client: FrtcSupabaseClient, until?: string): Promise<number> {
  const args = until === undefined ? {} : { p_until: until };
  return requireData(await client.rpc("frtcash_materialize_recurring", args), "Não foi possível gerar os lançamentos recorrentes.");
}

export async function loadCouplePlan(client: FrtcSupabaseClient, userId: string): Promise<CouplePlan | null> {
  const { data, error } = await client.from("frtcash_couple_plans")
    .select("plan").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a Meta a Dois.");
  return data?.plan ?? null;
}

export async function saveCouplePlan(client: FrtcSupabaseClient, userId: string, plan: CouplePlan): Promise<void> {
  const { error } = await client.from("frtcash_couple_plans")
    .upsert({ user_id: userId, plan }, { onConflict: "user_id" });
  if (error) throw new Error("Não foi possível salvar a Meta a Dois.");
}
