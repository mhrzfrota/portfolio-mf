import { expect, it } from "vitest";
import {
  coletar,
  contarPorcelain,
  parseGitLog,
  parseSessaoClaude,
  parseSessaoCodex,
  type Dependencias,
} from "./coletor.ts";
import { janela } from "./tempo.ts";
const ms = Date.parse("2026-10-13T12:00:00-03:00");
const j = janela("2026-10-13", Date.parse("2026-10-14T01:30:00-03:00"));
const jsonl = (linhas: unknown[]) =>
  linhas.map(l => JSON.stringify(l)).join("\n");
const pedido = (content: unknown, timestamp = new Date(ms).toISOString()) => ({
  type: "user",
  cwd: "/projetos/site",
  timestamp,
  message: { content },
});
it("Claude: texto e blocos, horário, tool_result, wrappers, truncamento e segredos", () => {
  const linhas = [
    pedido("<system>ignorar"),
    pedido([{ type: "tool_result", content: "ignorar" }]),
    { ...pedido("assistente"), type: "assistant" },
    pedido("fora", "2026-10-12T10:00:00Z"),
    pedido("sk-teste123 ajustar"),
    pedido([{ type: "text", text: "Ajustar card" }]),
    ...Array.from({ length: 15 }, () => pedido("x ".repeat(300))),
  ];
  const s = parseSessaoClaude(jsonl(linhas) + "\n{truncado", j, "/noite")!;
  expect(s.pedidos).toBe(17);
  expect(s.amostras).toHaveLength(12);
  expect(s.amostras[0]).toBe("[oculto] ajustar");
  expect(s.amostras[2]).toHaveLength(280);
  expect(s.inicio).toBe("12:00");
  expect(
    parseSessaoClaude(jsonl([pedido("teste")]), j, "/projetos")
  ).toBeNull();
  expect(
    parseSessaoClaude(jsonl([pedido("teste")]), j, "/projeto")
  ).not.toBeNull();
});
it("Codex: session_meta e event_msg, sem duplicar response_item", () => {
  const meta = { type: "session_meta", payload: { cwd: "/projetos/site" } };
  const event = {
    type: "event_msg",
    timestamp: new Date(ms).toISOString(),
    payload: { type: "user_message", message: "Corrigir ghp-teste normal" },
  };
  const response = {
    type: "response_item",
    timestamp: new Date(ms).toISOString(),
    payload: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "Corrigir card" }],
    },
  };
  expect(
    parseSessaoCodex(jsonl([meta, event, response]), j, "/noite")?.pedidos
  ).toBe(1);
  expect(
    parseSessaoCodex(jsonl([meta, response]), j, "/noite")?.amostras
  ).toEqual(["Corrigir card"]);
  expect(
    parseSessaoCodex(jsonl([meta, event]), j, "/projetos/site")
  ).toBeNull();
});
it("git log: deduplica hashes, soma numstat e preserva binários e renames", () => {
  const a = `\x1e${"a".repeat(40)}\x1f${ms / 1000}\x1f${"Mensagem ".repeat(25)}\n2\t3\tsrc/a.ts\n-\t-\tphoto.png\n1\t0\told => new\n`;
  const commits = parseGitLog(a + a);
  expect(commits).toHaveLength(1);
  expect(commits[0]).toMatchObject({
    hash: "aaaaaaaa",
    hora: "12:00",
    linhasMais: 3,
    linhasMenos: 3,
  });
  expect(commits[0].arquivos).toHaveLength(3);
  expect(commits[0].mensagem).toHaveLength(140);
  expect(
    contarPorcelain(" M src/a.ts\0R  novo.ts\0antigo.ts\0?? extra.ts\0")
  ).toBe(3);
});
it("coleta fixtures por dependências, métricas de 7 dias, vault e exclusões", () => {
  const arquivos = new Map<
    string,
    { texto: string; mtime?: number; nascimento?: number }
  >();
  const add = (p: string, texto: string, mtime = ms, nascimento = 0) =>
    arquivos.set(p, { texto, mtime, nascimento });
  add("/projects/site/.git", "gitdir: fixture");
  add("/projects/inativo/.git", "fixture");
  add("/projects/recente/.git", "fixture");
  add("/claude/a/dia.jsonl", jsonl([pedido("Construir rotina")]));
  add(
    "/claude/a/noite.jsonl",
    jsonl([{ ...pedido("Não contar"), cwd: "/noite/2026-10-13" }])
  );
  add(
    "/claude/a/recente.jsonl",
    jsonl([
      {
        ...pedido("Trabalho recente", "2026-10-10T12:00:00Z"),
        cwd: "/projects/recente",
      },
    ])
  );
  add(
    "/codex/2026/10/14/dia.jsonl",
    jsonl([
      { type: "session_meta", payload: { cwd: "/projects/site" } },
      {
        type: "event_msg",
        timestamp: "2026-10-14T04:00:00Z",
        payload: { type: "user_message", message: "Revisar rotina" },
      },
    ])
  );
  add("/vault/projetos/site.md", "# Site\nNota", ms, ms);
  add("/vault/arquivo/antigo.md", "# Ignorar");
  add("/vault/.obsidian/config.md", "# Ignorar");
  add(
    "/vault/diario/Linha do Tempo 2026.md",
    "- **2026-10-13:** Marco sem hora\n- **2026-10-12:** Ignorar",
    0
  );
  add("/vault/memoria/foco-da-semana.md", "f ".repeat(3000), 0);
  add(
    "/vault/clientes/exemplo/overview.md",
    '---\nstatus: ativo\nupdated: "2026-10-13"\n---',
    0
  );
  const dirs = new Set<string>();
  for (const p of arquivos.keys()) {
    let d = p;
    while ((d = d.slice(0, d.lastIndexOf("/")))) dirs.add(d);
  }
  const deps: Dependencias = {
    fs: {
      listar(p) {
        if (!dirs.has(p)) throw new Error("ENOENT");
        return [
          ...new Set(
            [...dirs, ...arquivos.keys()]
              .filter(
                k =>
                  k.startsWith(p + "/") && !k.slice(p.length + 1).includes("/")
              )
              .map(k => k.slice(p.length + 1))
          ),
        ];
      },
      ler(p) {
        if (!arquivos.has(p)) throw new Error("ENOENT");
        return arquivos.get(p)!.texto;
      },
      stat(p) {
        if (!dirs.has(p) && !arquivos.has(p)) throw new Error("ENOENT");
        return {
          mtimeMs: arquivos.get(p)?.mtime ?? 0,
          birthtimeMs: arquivos.get(p)?.nascimento ?? 0,
          isDirectory: () => dirs.has(p),
          isFile: () => arquivos.has(p),
          isSymbolicLink: () => false,
        };
      },
    },
    git(cwd, args) {
      if (args.includes("--numstat"))
        return cwd.endsWith("/site")
          ? `\x1eabcdef12345\x1f${ms / 1000}\x1ffeat rotina\n5\t2\tscript.ts\n`
          : "";
      if (args.includes("--max-parents=0"))
        return cwd.endsWith("/site") ? String(ms / 1000) : "1";
      if (args[0] === "status") return " M a.ts\0";
      if (args[0] === "rev-parse") return "origin/main";
      if (args[0] === "rev-list") return "2";
      if (args[0] === "remote") return "origin";
      throw new Error("Comando inesperado");
    },
  };
  const i = coletar(
    {
      dia: "2026-10-13",
      janela: j,
      raizProjetos: "/projects",
      vault: "/vault",
      claudeDir: "/claude",
      codexDir: "/codex",
      ignorarCwd: "/noite",
    },
    deps
  );
  expect(i.metricas).toMatchObject({
    commits: 1,
    linhasMais: 5,
    linhasMenos: 2,
    sessoesClaude: 1,
    sessoesCodex: 1,
    pedidos: 2,
    notasDoVault: 1,
    naoCommitado: 2,
    primeiraAtividade: "12:00",
    ultimaAtividade: "01:00",
  });
  expect(i.vault.notas[0].criado).toBe(true);
  expect(i.vault.foco).toHaveLength(4000);
  expect(i.vault.clientes[0]).toMatchObject({
    status: "ativo",
    updated: "2026-10-13",
  });
  expect(i.repositorios.find(r => r.projeto === "site")).toMatchObject({
    novo: true,
    aFrente: 2,
    remoto: true,
  });
  expect(i.eventos.at(-1)).toMatchObject({ tipo: "marco", hora: null });
});
it("tira o contexto que a extensão do Chrome põe antes do pedido no Codex", () => {
  const linhas = [
    { timestamp: "2026-10-13T17:17:00.000Z", type: "session_meta", payload: { cwd: "/Users/x/projetos/consegue" } },
    {
      timestamp: "2026-10-13T17:18:00.000Z",
      type: "event_msg",
      payload: { type: "user_message", message: "# Chrome tabs:\n- Current URL: https://exemplo.com\n\n## My request:\nquero revisar meu perfil" },
    },
  ].map((l) => JSON.stringify(l)).join("\n");
  const s = parseSessaoCodex(linhas, j, "/nada");
  expect(s?.amostras).toEqual(["quero revisar meu perfil"]);
});
