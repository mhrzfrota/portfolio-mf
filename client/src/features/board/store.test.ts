import { describe, expect, it } from "vitest";
import {
  addCard,
  addList,
  editCard,
  loadBoard,
  moveCard,
  removeCard,
  removeList,
  renameList,
  saveBoard,
  seedBoard,
  toggleCard,
} from "./store";
import type { BoardState } from "./types";

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

/** Board com duas listas e cartões conhecidos para os testes de mutação. */
function boardFixture(): BoardState {
  return {
    lists: [
      {
        id: "l1",
        title: "A fazer",
        cards: [
          { id: "c1", text: "Comprar café" },
          { id: "c2", text: "Responder e-mails" },
        ],
      },
      { id: "l2", title: "Feito", cards: [{ id: "c3", text: "Deploy" }] },
    ],
  };
}

describe("seedBoard", () => {
  it("cria as três listas padrão vazias", () => {
    const state = seedBoard();
    expect(state.lists.map(l => l.title)).toEqual([
      "A fazer",
      "Fazendo",
      "Feito",
    ]);
    expect(state.lists.every(l => l.cards.length === 0)).toBe(true);
  });

  it("gera ids únicos por lista", () => {
    const ids = seedBoard().lists.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("addList", () => {
  it("acrescenta a lista no fim com o título aparado", () => {
    const next = addList(boardFixture(), "  Ideias  ");
    expect(next.lists).toHaveLength(3);
    expect(next.lists[2].title).toBe("Ideias");
    expect(next.lists[2].cards).toEqual([]);
  });

  it("ignora título vazio", () => {
    const state = boardFixture();
    expect(addList(state, "   ")).toBe(state);
  });

  it("não muta o estado original", () => {
    const state = boardFixture();
    addList(state, "Ideias");
    expect(state.lists).toHaveLength(2);
  });
});

describe("renameList", () => {
  it("renomeia apenas a lista alvo", () => {
    const next = renameList(boardFixture(), "l1", "Backlog");
    expect(next.lists[0].title).toBe("Backlog");
    expect(next.lists[1].title).toBe("Feito");
  });

  it("ignora título vazio", () => {
    const state = boardFixture();
    expect(renameList(state, "l1", " ")).toBe(state);
  });
});

describe("removeList", () => {
  it("remove a lista mesmo com cartões", () => {
    const next = removeList(boardFixture(), "l1");
    expect(next.lists.map(l => l.id)).toEqual(["l2"]);
  });
});

describe("addCard", () => {
  it("acrescenta o cartão no fim da lista alvo", () => {
    const next = addCard(boardFixture(), "l2", " Revisar texto ");
    expect(next.lists[1].cards.map(c => c.text)).toEqual([
      "Deploy",
      "Revisar texto",
    ]);
  });

  it("ignora texto vazio", () => {
    const state = boardFixture();
    expect(addCard(state, "l1", "")).toBe(state);
  });
});

describe("editCard", () => {
  it("altera o texto do cartão", () => {
    const next = editCard(boardFixture(), "c2", "Responder cliente");
    expect(next.lists[0].cards[1].text).toBe("Responder cliente");
  });

  it("ignora texto vazio", () => {
    const state = boardFixture();
    expect(editCard(state, "c2", "  ")).toBe(state);
  });
});

describe("toggleCard", () => {
  it("marca um cartão sem done como concluído", () => {
    const next = toggleCard(boardFixture(), "c2");
    expect(next.lists[0].cards[1].done).toBe(true);
  });

  it("desmarca um cartão já concluído", () => {
    const marcado = toggleCard(boardFixture(), "c2");
    expect(toggleCard(marcado, "c2").lists[0].cards[1].done).toBe(false);
  });

  it("não altera os outros cartões nem o texto", () => {
    const next = toggleCard(boardFixture(), "c1");
    expect(next.lists[0].cards[0].text).toBe("Comprar café");
    expect(next.lists[0].cards[1].done).toBeUndefined();
    expect(next.lists[1].cards[0].done).toBeUndefined();
  });

  it("ignora id inexistente", () => {
    const next = toggleCard(boardFixture(), "nao-existe");
    expect(next.lists.flatMap(l => l.cards).every(c => !c.done)).toBe(true);
  });
});

describe("removeCard", () => {
  it("remove o cartão da lista onde estiver", () => {
    const next = removeCard(boardFixture(), "c1");
    expect(next.lists[0].cards.map(c => c.id)).toEqual(["c2"]);
    expect(next.lists[1].cards).toHaveLength(1);
  });
});

describe("moveCard", () => {
  it("move o cartão para outra lista na posição indicada", () => {
    const next = moveCard(boardFixture(), "c1", "l2", 0);
    expect(next.lists[0].cards.map(c => c.id)).toEqual(["c2"]);
    expect(next.lists[1].cards.map(c => c.id)).toEqual(["c1", "c3"]);
  });

  it("move para o fim quando o índice não é informado", () => {
    const next = moveCard(boardFixture(), "c1", "l2");
    expect(next.lists[1].cards.map(c => c.id)).toEqual(["c3", "c1"]);
  });

  it("reordena dentro da própria lista", () => {
    const next = moveCard(boardFixture(), "c1", "l1", 2);
    expect(next.lists[0].cards.map(c => c.id)).toEqual(["c2", "c1"]);
  });

  it("ignora cartão inexistente", () => {
    const state = boardFixture();
    expect(moveCard(state, "c99", "l2")).toBe(state);
  });

  it("ignora lista de destino inexistente", () => {
    const state = boardFixture();
    expect(moveCard(state, "c1", "l99")).toBe(state);
  });
});

describe("loadBoard / saveBoard", () => {
  it("faz round-trip pelo storage", () => {
    const storage = fakeStorage();
    const state = addCard(seedBoard(), seedBoard().lists[0].id, "x");
    saveBoard(state, storage);
    const loaded = loadBoard(storage);
    expect(loaded.lists.map(l => l.title)).toEqual(
      state.lists.map(l => l.title)
    );
  });

  it("cai no seed quando não há nada salvo", () => {
    const loaded = loadBoard(fakeStorage());
    expect(loaded.lists.map(l => l.title)).toEqual([
      "A fazer",
      "Fazendo",
      "Feito",
    ]);
  });

  it("cai no seed com JSON inválido", () => {
    const storage = fakeStorage({ "mf-board:v1": "{quebrado" });
    expect(loadBoard(storage).lists).toHaveLength(3);
  });

  it("cai no seed com JSON de formato inesperado", () => {
    const storage = fakeStorage({ "mf-board:v1": '{"lists": "oops"}' });
    expect(loadBoard(storage).lists).toHaveLength(3);
  });

  it("preserva o done no round-trip", () => {
    const storage = fakeStorage();
    saveBoard(toggleCard(boardFixture(), "c1"), storage);
    expect(loadBoard(storage).lists[0].cards[0].done).toBe(true);
  });

  it("aceita cartão antigo sem o campo done", () => {
    const storage = fakeStorage({
      "mf-board:v1":
        '{"lists":[{"id":"l1","title":"A","cards":[{"id":"c","text":"t"}]}]}',
    });
    expect(loadBoard(storage).lists).toHaveLength(1);
  });

  it("cai no seed quando done tem tipo errado", () => {
    const storage = fakeStorage({
      "mf-board:v1":
        '{"lists":[{"id":"l1","title":"A","cards":[{"id":"c","text":"t","done":"sim"}]}]}',
    });
    expect(loadBoard(storage).lists).toHaveLength(3);
  });

  it("cai no seed quando o storage lança (indisponível)", () => {
    const storage = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(loadBoard(storage).lists).toHaveLength(3);
    expect(() => saveBoard(seedBoard(), storage)).not.toThrow();
  });
});
