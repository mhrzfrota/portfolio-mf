export type ColumnId = "income" | "expense" | "debt";

export type CardSource = "manual" | "ofx" | "apple_pay" | "recurring";

export type Vault = "personal" | "work";

export const VAULTS: { id: Vault; label: string; hint: string }[] = [
  { id: "personal", label: "Pessoal", hint: "Suas contas do dia a dia" },
  { id: "work", label: "Trabalho", hint: "Entradas e gastos profissionais" },
];

export const VAULT_STORAGE_KEY = "frtcash-vault-v1";

export const INCOME_SOURCES = [
  "Salário",
  "Freelancer",
  "Parentes",
  "Investimentos",
  "Bônus",
  "Outros",
] as const;

export const EXPENSE_CATEGORIES = [
  "Água",
  "Luz",
  "Gás",
  "Apartamento",
  "Plano saúde",
  "Gasolina",
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Lazer",
  "Assinaturas",
  "Outros",
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface WalletCard {
  id: string;
  title: string;
  amount: number;
  column: ColumnId;
  vault?: Vault;
  fitid?: string;
  source?: CardSource;
  merchantKey?: string;
  cardLabel?: string;
  recurringId?: string;
  capturedAt?: string;
  occurredAt?: string;
  incomeSource?: IncomeSource;
  category?: ExpenseCategory;
  dueDate?: string;
  createdAt: string;
}

export type CardDraft = Omit<WalletCard, "id" | "createdAt">;

export const STORAGE_KEY = "frtcash-wallet-v1";
export const INVESTMENT_GOALS_KEY = "frtcash-investment-goals-v1";
export const START_MONTH_KEY = "2026-04";

// Botão de olho: com os valores escondidos, todo formatBRL da tela vira "R$ •••••".
// O WalletProvider liga e desliga e faz as telas renderizarem de novo.
let moneyHidden = false;
export const HIDE_VALUES_KEY = "frtcash-hide-values-v1";

export function setMoneyHidden(hidden: boolean): void {
  moneyHidden = hidden;
}

export function formatBRL(value: number): string {
  if (moneyHidden) return "R$ •••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cardVault(card: WalletCard): Vault {
  return card.vault === "work" ? "work" : "personal";
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function clampMonthKey(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return START_MONTH_KEY;
  return monthKey < START_MONTH_KEY ? START_MONTH_KEY : monthKey;
}

export function getInitialMonthKey(): string {
  return clampMonthKey(getCurrentMonthKey());
}

export function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function defaultDateForMonth(monthKey: string): string {
  const safeMonthKey = clampMonthKey(monthKey);
  return safeMonthKey === getCurrentMonthKey() ? todayInputValue() : `${safeMonthKey}-01`;
}

export function getCardDate(card: WalletCard): string {
  return (card.occurredAt ?? card.dueDate ?? card.createdAt ?? todayInputValue()).slice(0, 10);
}

export function getCardMonth(card: WalletCard): string {
  return getCardDate(card).slice(0, 7);
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(date?: string): string {
  if (!date) return "";
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function addMonthsToInputDate(date: string, monthOffset: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const monthIndex = month - 1 + monthOffset;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12;
  const maxDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate();

  return `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(
    Math.min(day, maxDay)
  ).padStart(2, "0")}`;
}

export function addDaysToInputDate(date: string, days: number): string {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
    parsed.getDate()
  ).padStart(2, "0")}`;
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(/R\$/gi, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

export function editableAmount(value: number): string {
  if (!value) return "";
  return String(value).replace(".", ",");
}

export function sumByColumn(cards: WalletCard[], col: ColumnId): number {
  return cards.filter((c) => c.column === col).reduce((s, c) => s + c.amount, 0);
}

export function daysRemainingInMonth(monthKey: string): number {
  const currentMonth = getCurrentMonthKey();
  const [year, month] = monthKey.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();

  if (monthKey < currentMonth) return 0;
  if (monthKey > currentMonth) return totalDays;

  return totalDays - new Date().getDate() + 1;
}

export function summarizeMonth(cards: WalletCard[], monthKey: string, investmentGoal: number) {
  const monthCards = cards.filter((card) => getCardMonth(card) === monthKey);
  const income = sumByColumn(monthCards, "income");
  const expense = sumByColumn(monthCards, "expense");
  const debt = sumByColumn(monthCards, "debt");
  const balance = income - expense - debt;
  const balanceAfterGoal = balance - investmentGoal;
  const expenseLimit = income - debt - investmentGoal;
  const remainingExpenseBudget = expenseLimit - expense;

  return {
    cards: monthCards,
    income,
    expense,
    debt,
    investmentGoal,
    balance,
    balanceAfterGoal,
    expenseLimit,
    remainingExpenseBudget,
  };
}

export type MonthSummary = ReturnType<typeof summarizeMonth>;
