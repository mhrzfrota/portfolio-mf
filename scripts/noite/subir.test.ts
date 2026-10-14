import { beforeEach, expect, it, vi } from "vitest";
import type { Relatorio } from "../../shared/noite/relatorio.ts";
const mock = vi.hoisted(() => ({
  listUsers: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mock.createClient }));
import { subir } from "./subir.ts";
const relatorio = {
  dia: "2026-10-13",
  versao: 1,
  geradoEm: "2026-10-14T02:00:00Z",
} as Relatorio;
const env = {
  VITE_SUPABASE_URL: "https://example.com",
  SUPABASE_SERVICE_ROLE_KEY: "somente-fixture",
};
beforeEach(() => {
  vi.resetAllMocks();
  mock.createClient.mockReturnValue({
    auth: { admin: { listUsers: mock.listUsers } },
    from: mock.from,
  });
  mock.from.mockReturnValue({ upsert: mock.upsert });
  mock.upsert.mockResolvedValue({ error: null });
  mock.listUsers.mockResolvedValue({
    data: { users: [{ id: "owner", email: "teste@example.com" }] },
    error: null,
  });
});
it("sem ambiente ou seco não acessa rede", async () => {
  expect(await subir(relatorio, false, vi.fn(), {})).toBe("local");
  expect(await subir(relatorio, true, vi.fn(), env)).toBe("seco");
  expect(mock.createClient).not.toHaveBeenCalled();
});
it("upsert usa dono único e chave composta", async () => {
  expect(await subir(relatorio, false, vi.fn(), env)).toBe("enviado");
  expect(mock.from).toHaveBeenCalledWith("noite_relatorios");
  expect(mock.upsert).toHaveBeenCalledWith(
    {
      owner: "owner",
      dia: relatorio.dia,
      versao: 1,
      relatorio,
      gerado_em: relatorio.geradoEm,
    },
    { onConflict: "owner,dia" }
  );
});
it("prefere NOITE_OWNER_EMAIL e pagina usuários", async () => {
  mock.listUsers.mockResolvedValueOnce({
    data: {
      users: Array.from({ length: 100 }, (_, n) => ({ id: `outro-${n}` })),
    },
    error: null,
  });
  await subir(relatorio, false, vi.fn(), {
    ...env,
    NOITE_OWNER_EMAIL: "TESTE@example.com",
    CEREBRO_OWNER_EMAIL: "outro@example.com",
  });
  expect(mock.listUsers).toHaveBeenLastCalledWith({ page: 2, perPage: 100 });
});
it("aceita CEREBRO_OWNER_EMAIL e rejeita dono ambíguo ou ausente", async () => {
  await subir(relatorio, false, vi.fn(), {
    ...env,
    CEREBRO_OWNER_EMAIL: "teste@example.com",
  });
  mock.listUsers.mockResolvedValue({
    data: { users: [{ id: "1" }, { id: "2" }] },
    error: null,
  });
  await expect(subir(relatorio, false, vi.fn(), env)).rejects.toThrow(
    "NOITE_OWNER_EMAIL"
  );
  await expect(
    subir(relatorio, false, vi.fn(), {
      ...env,
      NOITE_OWNER_EMAIL: "nenhum@example.com",
    })
  ).rejects.toThrow("dono não encontrado");
});
it.each(["PGRST205", "42P01"])(
  "tabela ausente %s informa migration",
  async code => {
    mock.upsert.mockResolvedValue({
      error: { code, message: "não exibir credenciais" },
    });
    await expect(subir(relatorio, false, vi.fn(), env)).rejects.toThrow(
      "supabase/migrations/0004_noite.sql"
    );
  }
);
