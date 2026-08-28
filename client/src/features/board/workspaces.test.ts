import { describe, expect, it } from "vitest";
import {
  activeWorkspace,
  addWorkspace,
  loadWorkspaces,
  mapActive,
  newWorkspace,
  PLAN_WORKSPACE_NAME,
  removeWorkspace,
  renameWorkspace,
  saveWorkspaces,
  seedWorkspaces,
  selectWorkspace,
} from "./workspaces";
import { addCard } from "./store";
import type { WorkspacesState } from "./types";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

/** Dois workspaces com ids fixos; o primeiro é o ativo. */
function fixture(): WorkspacesState {
  return {
    workspaces: [
      {
        id: "w1",
        name: "Meu board",
        lists: [{ id: "l1", title: "A fazer", cards: [] }],
      },
      {
        id: "w2",
        name: "Plano",
        lists: [
          { id: "l2", title: "Esta semana", cards: [{ id: "c1", text: "x" }] },
        ],
      },
    ],
    activeId: "w1",
  };
}

describe("seedWorkspaces", () => {
  it("cria o board de trabalho e o plano de marketing ao lado", () => {
    const state = seedWorkspaces();
    expect(state.workspaces.map(w => w.name)).toEqual([
      "Meu board",
      PLAN_WORKSPACE_NAME,
    ]);
  });

  it("abre no board de trabalho, não no plano", () => {
    const state = seedWorkspaces();
    expect(state.activeId).toBe(state.workspaces[0].id);
  });

  it("o plano vem com cartões", () => {
    const plano = seedWorkspaces().workspaces[1];
    const cards = plano.lists.flatMap(l => l.cards);
    expect(cards.length).toBeGreaterThan(30);
  });

  it("aproveita as listas do board antigo quando existem", () => {
    const state = seedWorkspaces({
      lists: [{ id: "l1", title: "Backlog", cards: [] }],
    });
    expect(state.workspaces[0].lists.map(l => l.title)).toEqual(["Backlog"]);
  });
});

describe("activeWorkspace", () => {
  it("devolve o workspace ativo", () => {
    expect(activeWorkspace(fixture()).id).toBe("w1");
  });

  it("cai no primeiro quando o ativo não existe mais", () => {
    expect(activeWorkspace({ ...fixture(), activeId: "sumiu" }).id).toBe("w1");
  });
});

describe("mapActive", () => {
  it("aplica a operação só no workspace ativo", () => {
    const next = mapActive(fixture(), board => addCard(board, "l1", "novo"));
    expect(next.workspaces[0].lists[0].cards.map(c => c.text)).toEqual([
      "novo",
    ]);
    expect(next.workspaces[1].lists[0].cards).toHaveLength(1);
  });

  it("não deixa uma operação vazar para outro workspace", () => {
    // l2 é do workspace inativo: addCard não acha a lista e nada muda.
    const state = fixture();
    const next = mapActive(state, board => addCard(board, "l2", "novo"));
    expect(next.workspaces[1]).toBe(state.workspaces[1]);
  });

  it("devolve o mesmo estado quando a operação é um no-op", () => {
    const state = fixture();
    expect(mapActive(state, board => addCard(board, "l1", "  "))).toBe(state);
  });
});

describe("selectWorkspace", () => {
  it("troca o ativo", () => {
    expect(selectWorkspace(fixture(), "w2").activeId).toBe("w2");
  });

  it("ignora id inexistente", () => {
    const state = fixture();
    expect(selectWorkspace(state, "w99")).toBe(state);
  });
});

describe("addWorkspace", () => {
  it("cria no fim, com o nome aparado, e já entra nele", () => {
    const next = addWorkspace(fixture(), "  Clientes  ");
    expect(next.workspaces).toHaveLength(3);
    expect(next.workspaces[2].name).toBe("Clientes");
    expect(next.activeId).toBe(next.workspaces[2].id);
  });

  it("nasce com as três listas padrão", () => {
    const next = addWorkspace(fixture(), "Clientes");
    expect(next.workspaces[2].lists.map(l => l.title)).toEqual([
      "A fazer",
      "Fazendo",
      "Feito",
    ]);
  });

  it("ignora nome vazio", () => {
    const state = fixture();
    expect(addWorkspace(state, "   ")).toBe(state);
  });
});

describe("renameWorkspace", () => {
  it("renomeia apenas o alvo", () => {
    const next = renameWorkspace(fixture(), "w2", "Marketing");
    expect(next.workspaces.map(w => w.name)).toEqual([
      "Meu board",
      "Marketing",
    ]);
  });

  it("ignora nome vazio", () => {
    const state = fixture();
    expect(renameWorkspace(state, "w1", " ")).toBe(state);
  });
});

describe("removeWorkspace", () => {
  it("remove o workspace", () => {
    expect(removeWorkspace(fixture(), "w2").workspaces.map(w => w.id)).toEqual([
      "w1",
    ]);
  });

  it("passa o ativo para o vizinho da esquerda", () => {
    const state = selectWorkspace(fixture(), "w2");
    expect(removeWorkspace(state, "w2").activeId).toBe("w1");
  });

  it("mantém o ativo quando o removido é outro", () => {
    expect(removeWorkspace(fixture(), "w2").activeId).toBe("w1");
  });

  it("nunca remove o último", () => {
    const state = removeWorkspace(fixture(), "w2");
    expect(removeWorkspace(state, "w1")).toBe(state);
  });

  it("ignora id inexistente", () => {
    const state = fixture();
    expect(removeWorkspace(state, "w99")).toBe(state);
  });
});

describe("loadWorkspaces / saveWorkspaces", () => {
  it("faz round-trip pelo storage", () => {
    const storage = fakeStorage();
    saveWorkspaces(fixture(), storage);
    const loaded = loadWorkspaces(storage);
    expect(loaded.workspaces.map(w => w.name)).toEqual(["Meu board", "Plano"]);
    expect(loaded.activeId).toBe("w1");
  });

  it("migra o board único salvo antes e semeia o plano ao lado", () => {
    const storage = fakeStorage({
      "mf-board:v1":
        '{"lists":[{"id":"l1","title":"Backlog","cards":[{"id":"c","text":"t"}]}]}',
    });
    const loaded = loadWorkspaces(storage);
    expect(loaded.workspaces).toHaveLength(2);
    expect(loaded.workspaces[0].lists[0].cards[0].text).toBe("t");
    expect(loaded.workspaces[1].name).toBe(PLAN_WORKSPACE_NAME);
  });

  it("não refaz a migração depois que o v2 existe", () => {
    // Plano apagado é decisão do usuário: recarregar não o traz de volta.
    const storage = fakeStorage({ "mf-board:v1": '{"lists":[]}' });
    const semPlano: WorkspacesState = {
      workspaces: [newWorkspace("Só o meu")],
      activeId: "x",
    };
    saveWorkspaces(
      { ...semPlano, activeId: semPlano.workspaces[0].id },
      storage
    );
    expect(loadWorkspaces(storage).workspaces.map(w => w.name)).toEqual([
      "Só o meu",
    ]);
  });

  it("semeia quando não há nada salvo", () => {
    expect(loadWorkspaces(fakeStorage()).workspaces).toHaveLength(2);
  });

  it("semeia com JSON inválido", () => {
    const storage = fakeStorage({ "mf-board:v2": "{quebrado" });
    expect(loadWorkspaces(storage).workspaces).toHaveLength(2);
  });

  it("semeia com formato inesperado", () => {
    const storage = fakeStorage({ "mf-board:v2": '{"workspaces":[]}' });
    expect(loadWorkspaces(storage).workspaces).toHaveLength(2);
  });

  it("conserta activeId apontando para workspace que sumiu", () => {
    const storage = fakeStorage({
      "mf-board:v2": JSON.stringify({ ...fixture(), activeId: "sumiu" }),
    });
    expect(loadWorkspaces(storage).activeId).toBe("w1");
  });

  it("semeia quando o storage lança (indisponível)", () => {
    const storage = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(loadWorkspaces(storage).workspaces).toHaveLength(2);
    expect(() => saveWorkspaces(fixture(), storage)).not.toThrow();
  });
});
