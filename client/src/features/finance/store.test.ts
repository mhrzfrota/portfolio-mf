import { describe, expect, it } from "vitest";
import {
  emptyFinance,
  isFinanceState,
  parseAmount,
  storageKey,
  summarize,
} from "./store";

describe("valores financeiros", () => {
  it("converte reais em centavos sem perder a precisão", () => {
    expect(parseAmount("R$ 1.234,56")).toBe(123456);
    expect(parseAmount("0,29")).toBe(29);
    expect(parseAmount("1500")).toBe(150000);
    for (const invalid of [
      "",
      "-1",
      "1.50",
      "1,234",
      "NaN",
      "Infinity",
      "1e4",
      "1000000001",
    ])
      expect(parseAmount(invalid)).toBeNull();
  });
  it("separa a fotografia do saldo dos resumos mensais", () => {
    const state = {
      ...emptyFinance(),
      balance: 100000,
      reserve: 40000,
      goal: 100000,
      rate: 20,
      months: { "2026-09": { income: 200000, expenses: 150000, saved: 30000 } },
    };
    expect(summarize(state, "2026-09")).toMatchObject({
      available: 60000,
      surplus: 50000,
      target: 40000,
      toSave: 10000,
      remaining: 60000,
      monthsToGoal: 2,
      progress: 40,
    });
    expect(summarize(state, "2026-08")).toMatchObject({
      income: 0,
      available: 60000,
      monthsToGoal: null,
    });
  });
  it("lida com déficit, meta ultrapassada e ausência de aportes", () => {
    const state = {
      ...emptyFinance(),
      balance: 20000,
      reserve: 20000,
      goal: 10000,
      months: { "2026-09": { income: 10000, expenses: 20000, saved: 0 } },
    };
    expect(summarize(state, "2026-09")).toMatchObject({
      surplus: -10000,
      remaining: 0,
      monthsToGoal: 0,
      progress: 100,
    });
    expect(summarize(emptyFinance(), "2026-09").monthsToGoal).toBe(0);
  });
  it("rejeita backups inválidos e reserva maior que o saldo", () => {
    const state = emptyFinance();
    expect(isFinanceState(JSON.parse(JSON.stringify(state)))).toBe(true);
    for (const invalid of [
      null,
      {},
      { ...state, reserve: 1 },
      { ...state, balance: -1 },
      { ...state, rate: 101 },
      { ...state, rate: null },
      { ...state, months: [] },
      { ...state, months: { "2026-13": { income: 0, expenses: 0, saved: 0 } } },
      {
        ...state,
        months: { "2026-09": { income: 0.5, expenses: 0, saved: 0 } },
      },
    ])
      expect(isFinanceState(invalid)).toBe(false);
  });
  it("usa um espaço separado para cada conta", () => {
    expect(storageKey("user-a")).not.toBe(storageKey("user-b"));
  });
});
