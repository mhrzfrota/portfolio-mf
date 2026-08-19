import { describe, expect, it } from "vitest";
import {
  activeOn,
  addHabit,
  bestStreak,
  currentStreak,
  doneOn,
  lastDays,
  loadHabits,
  removeHabit,
  renameHabit,
  reorderHabits,
  saveHabits,
  seedHabits,
  shiftISO,
  statsFor,
  toISODate,
  toggleDay,
} from "./store";
import type { HabitsState } from "./types";

/** Storage falso em memória para testar load/save sem navegador. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

/** Dois hábitos com histórico conhecido; "hoje" é sempre 2026-08-18. */
function habitsFixture(): HabitsState {
  return {
    habits: [
      {
        id: "h1",
        name: "Tomar creatina",
        createdAt: "2026-08-10",
        done: ["2026-08-16", "2026-08-17", "2026-08-18"],
      },
      {
        id: "h2",
        name: "Ler 20 páginas",
        createdAt: "2026-08-17",
        done: ["2026-08-17"],
      },
    ],
  };
}

describe("datas", () => {
  it("formata em ISO local, sem escorregar para UTC", () => {
    // 23h em UTC-3 vira o dia seguinte em toISOString(); aqui não pode virar.
    expect(toISODate(new Date(2026, 7, 18, 23, 30))).toBe("2026-08-18");
  });

  it("atravessa mês e ano ao deslocar dias", () => {
    expect(shiftISO("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftISO("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("lista a janela do mais antigo ao mais recente", () => {
    expect(lastDays(3, "2026-08-18")).toEqual([
      "2026-08-16",
      "2026-08-17",
      "2026-08-18",
    ]);
  });
});

describe("seedHabits", () => {
  it("semeia hábitos de exemplo vazios criados hoje", () => {
    const state = seedHabits("2026-08-18");
    expect(state.habits).toHaveLength(3);
    expect(state.habits.every(h => h.done.length === 0)).toBe(true);
    expect(state.habits.every(h => h.createdAt === "2026-08-18")).toBe(true);
  });

  it("gera ids únicos", () => {
    const ids = seedHabits("2026-08-18").habits.map(h => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mutações", () => {
  it("adiciona hábito com a data de criação", () => {
    const state = addHabit({ habits: [] }, "  Beber água  ", "2026-08-18");
    expect(state.habits[0]).toMatchObject({
      name: "Beber água",
      createdAt: "2026-08-18",
      done: [],
    });
  });

  it("ignora nome vazio ao adicionar e ao renomear", () => {
    const state = habitsFixture();
    expect(addHabit(state, "   ", "2026-08-18")).toBe(state);
    expect(renameHabit(state, "h1", "  ")).toBe(state);
  });

  it("renomeia e remove pelo id", () => {
    const renamed = renameHabit(habitsFixture(), "h1", "Creatina 5g");
    expect(renamed.habits[0].name).toBe("Creatina 5g");
    expect(removeHabit(habitsFixture(), "h1").habits.map(h => h.id)).toEqual([
      "h2",
    ]);
  });

  it("marca e desmarca o mesmo dia", () => {
    const marked = toggleDay(habitsFixture(), "h2", "2026-08-18");
    expect(marked.habits[1].done).toContain("2026-08-18");
    const unmarked = toggleDay(marked, "h2", "2026-08-18");
    expect(unmarked.habits[1].done).not.toContain("2026-08-18");
  });

  it("recua createdAt ao marcar um dia anterior à criação", () => {
    const state = toggleDay(habitsFixture(), "h2", "2026-08-12");
    expect(state.habits[1].createdAt).toBe("2026-08-12");
  });

  it("não mexe em createdAt ao desmarcar dia antigo", () => {
    const state = toggleDay(habitsFixture(), "h1", "2026-08-16");
    expect(state.habits[0].createdAt).toBe("2026-08-10");
  });

  it("reordena e ignora id desconhecido", () => {
    expect(
      reorderHabits(habitsFixture(), "h2", 0).habits.map(h => h.id)
    ).toEqual(["h2", "h1"]);
    const state = habitsFixture();
    expect(reorderHabits(state, "nope", 0)).toBe(state);
  });

  it("prende o índice ao fim da lista ao reordenar além do tamanho", () => {
    expect(
      reorderHabits(habitsFixture(), "h1", 99).habits.map(h => h.id)
    ).toEqual(["h2", "h1"]);
  });
});

describe("leitura do dia", () => {
  it("conta marcações do dia", () => {
    expect(doneOn(habitsFixture(), "2026-08-18")).toBe(1);
    expect(doneOn(habitsFixture(), "2026-08-17")).toBe(2);
  });

  it("só considera ativo o hábito que já existia na data", () => {
    expect(activeOn(habitsFixture(), "2026-08-12").map(h => h.id)).toEqual([
      "h1",
    ]);
  });
});

describe("sequências", () => {
  it("conta a sequência viva terminando hoje", () => {
    expect(currentStreak(habitsFixture().habits[0], "2026-08-18")).toBe(3);
  });

  it("mantém a sequência quando hoje ainda está em aberto", () => {
    // h2 marcou ontem e ainda não marcou hoje: a sequência não zera no meio do dia.
    expect(currentStreak(habitsFixture().habits[1], "2026-08-18")).toBe(1);
  });

  it("zera quando o último dia marcado é anterior a ontem", () => {
    expect(currentStreak(habitsFixture().habits[1], "2026-08-20")).toBe(0);
  });

  it("acha a maior sequência do histórico", () => {
    const habit = {
      id: "h",
      name: "x",
      createdAt: "2026-08-01",
      done: ["2026-08-01", "2026-08-03", "2026-08-04", "2026-08-05"],
    };
    expect(bestStreak(habit)).toBe(3);
    expect(bestStreak({ ...habit, done: [] })).toBe(0);
  });

  it("não conta o mesmo dia duas vezes", () => {
    const habit = {
      id: "h",
      name: "x",
      createdAt: "2026-08-01",
      done: ["2026-08-01", "2026-08-01"],
    };
    expect(bestStreak(habit)).toBe(1);
  });
});

describe("statsFor", () => {
  it("mede a janela inteira quando o hábito é mais velho que ela", () => {
    const stats = statsFor(habitsFixture().habits[0], 7, "2026-08-18");
    expect(stats).toMatchObject({ done: 3, total: 7 });
    expect(stats.rate).toBeCloseTo(3 / 7);
  });

  it("recorta a janela pela data de criação", () => {
    // h2 nasceu em 17/08: a janela de 7 dias só tem 2 dias válidos.
    const stats = statsFor(habitsFixture().habits[1], 7, "2026-08-18");
    expect(stats).toMatchObject({ done: 1, total: 2 });
    expect(stats.rate).toBeCloseTo(0.5);
  });

  it("não divide por zero em janela anterior à criação", () => {
    const stats = statsFor(habitsFixture().habits[1], 1, "2026-08-01");
    expect(stats).toMatchObject({ done: 0, total: 0, rate: 0 });
  });
});

describe("persistência", () => {
  it("semeia quando não há nada salvo", () => {
    expect(loadHabits(fakeStorage(), "2026-08-18").habits).toHaveLength(3);
  });

  it("semeia quando o JSON é inválido ou fora do formato", () => {
    expect(
      loadHabits(fakeStorage({ "mf-habits:v1": "{{" }), "2026-08-18").habits
    ).toHaveLength(3);
    expect(
      loadHabits(
        fakeStorage({ "mf-habits:v1": '{"habits":[{"id":1}]}' }),
        "2026-08-18"
      ).habits
    ).toHaveLength(3);
  });

  it("faz round-trip do estado salvo", () => {
    const storage = fakeStorage();
    saveHabits(habitsFixture(), storage);
    expect(loadHabits(storage, "2026-08-18")).toEqual(habitsFixture());
  });

  it("sobrevive a storage indisponível", () => {
    expect(() => saveHabits(habitsFixture(), null)).not.toThrow();
    expect(loadHabits(null, "2026-08-18").habits).toHaveLength(3);
  });
});
