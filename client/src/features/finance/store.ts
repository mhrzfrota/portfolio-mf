export interface MonthSummary {
  income: number;
  expenses: number;
  saved: number;
}
export interface FinanceState {
  version: 1;
  balance: number;
  reserve: number;
  goal: number;
  rate: number;
  updatedAt: string | null;
  months: Record<string, MonthSummary>;
}
export const emptyFinance = (): FinanceState => ({
  version: 1,
  balance: 0,
  reserve: 0,
  goal: 0,
  rate: 0,
  updatedAt: null,
  months: {},
});
export const emptyMonth = (): MonthSummary => ({
  income: 0,
  expenses: 0,
  saved: 0,
});
export const storageKey = (userId: string) => `mf-finance:v1:${userId}`;
export const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const amountInput = (cents: number) =>
  (cents / 100).toFixed(2).replace(".", ",");

// Accept Brazilian currency notation without silently changing malformed values.
export function parseAmount(input: string): number | null {
  const value = input.trim().replace(/^R\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(
    Number(value.replace(/\./g, "").replace(",", ".")) * 100
  );
  return Number.isSafeInteger(cents) && cents <= 100_000_000_000 ? cents : null;
}
const validMoney = (n: unknown): n is number =>
  typeof n === "number" &&
  Number.isSafeInteger(n) &&
  n >= 0 &&
  n <= 100_000_000_000;
export function isFinanceState(value: unknown): value is FinanceState {
  if (!value || typeof value !== "object") return false;
  const s = value as FinanceState;
  return (
    s.version === 1 &&
    validMoney(s.balance) &&
    validMoney(s.reserve) &&
    s.reserve <= s.balance &&
    validMoney(s.goal) &&
    typeof s.rate === "number" &&
    Number.isFinite(s.rate) &&
    s.rate >= 0 &&
    s.rate <= 100 &&
    (s.updatedAt === null ||
      (typeof s.updatedAt === "string" &&
        Number.isFinite(Date.parse(s.updatedAt)))) &&
    !!s.months &&
    typeof s.months === "object" &&
    !Array.isArray(s.months) &&
    Object.entries(s.months).every(
      ([month, m]) =>
        /^\d{4}-(0[1-9]|1[0-2])$/.test(month) &&
        !!m &&
        validMoney(m.income) &&
        validMoney(m.expenses) &&
        validMoney(m.saved)
    )
  );
}
export function summarize(state: FinanceState, month: string) {
  const current = state.months[month] ?? emptyMonth();
  const surplus = current.income - current.expenses;
  const target = Math.round((current.income * state.rate) / 100);
  const remaining = Math.max(0, state.goal - state.reserve);
  return {
    ...current,
    surplus,
    target,
    available: state.balance - state.reserve,
    toSave: Math.max(0, target - current.saved),
    remaining,
    progress:
      state.goal > 0 ? Math.min(100, (state.reserve / state.goal) * 100) : 0,
    monthsToGoal:
      remaining === 0
        ? 0
        : current.saved > 0
          ? Math.ceil(remaining / current.saved)
          : null,
  };
}
