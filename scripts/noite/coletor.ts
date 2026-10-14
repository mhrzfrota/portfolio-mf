import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join, relative, resolve, sep } from "node:path";
import type {
  Metricas,
  Momento,
  PorProjeto,
  Relatorio,
} from "../../shared/noite/relatorio.ts";
import { horaFortaleza, diaFortaleza, type Janela } from "./tempo.ts";
import { ocultarSegredos } from "./segredos.ts";

export type Commit = {
  hash: string;
  ms: number;
  hora: string;
  mensagem: string;
  arquivos: string[];
  linhasMais: number;
  linhasMenos: number;
};
export type Sessao = {
  agente: "claude" | "codex";
  projeto: string;
  cwd: string;
  inicio: string;
  fim: string;
  pedidos: number;
  amostras: string[];
  tempos: number[];
};
export type Repositorio = {
  projeto: string;
  caminho: string;
  commits: Commit[];
  pendentes: number;
  aFrente: number | null;
  remoto: boolean;
  novo: boolean;
};
export type Evento = Omit<Momento, "hora"> & {
  hora: string | null;
  ms: number | null;
};
export type Insumos = {
  dia: string;
  janela: Janela;
  repositorios: Repositorio[];
  sessoes: Sessao[];
  vault: {
    notas: {
      caminho: string;
      pasta: string;
      titulo: string;
      criado: boolean;
      ms: number;
    }[];
    marcos: string[];
    foco: string;
    clientes: {
      caminho: string;
      status: string | null;
      updated: string | null;
    }[];
    prospeccao: string;
  };
  metricas: Metricas;
  porProjeto: PorProjeto[];
  eventos: Evento[];
  fontes: Relatorio["fontes"];
  avisos: string[];
};
export type ArquivoStat = {
  mtimeMs: number;
  birthtimeMs: number;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
};
export type Dependencias = {
  fs: {
    listar(p: string): string[];
    ler(p: string): string;
    stat(p: string): ArquivoStat;
  };
  git(cwd: string, args: string[]): string;
};
export const sistema: Dependencias = {
  fs: {
    listar: p => fs.readdirSync(p).sort(),
    ler: p => fs.readFileSync(p, "utf8"),
    stat: p => fs.lstatSync(p),
  },
  git: (cwd, args) =>
    execFileSync(
      "git",
      ["--no-optional-locks", "-c", "core.fsmonitor=false", ...args],
      {
        cwd,
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 32 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      }
    ),
};
export const dentro = (ms: number, j: Janela) =>
  Number.isFinite(ms) && ms >= j.inicio && ms <= j.fim;
export function dentroDaPasta(cwd: string, pasta: string): boolean {
  const r = relative(resolve(pasta), resolve(cwd));
  return (
    r === "" || (r !== ".." && !r.startsWith(`..${sep}`) && !r.startsWith(sep))
  );
}
/** Formato: --format=%x1e%H%x1f%ct%x1f%s --numstat (sem merges). */
export function parseGitLog(texto: string): Commit[] {
  const vistos = new Set<string>();
  return texto
    .split("\x1e")
    .flatMap(bloco => {
      const [cabeca, ...linhas] = bloco.trim().split("\n");
      const [hash, segundos, ...mensagem] = cabeca.split("\x1f");
      const ms = Number(segundos) * 1000;
      if (!hash || !segundos || !Number.isFinite(ms) || vistos.has(hash))
        return [];
      vistos.add(hash);
      const arquivos: string[] = [];
      let linhasMais = 0;
      let linhasMenos = 0;
      for (const linha of linhas) {
        const m = linha.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
        if (!m) continue;
        arquivos.push(ocultarSegredos(m[3]));
        linhasMais += Number(m[1]) || 0;
        linhasMenos += Number(m[2]) || 0;
      }
      return [
        {
          hash: hash.slice(0, 8),
          ms,
          hora: horaFortaleza(ms),
          mensagem: ocultarSegredos(mensagem.join("\x1f")).slice(0, 140),
          arquivos,
          linhasMais,
          linhasMenos,
        },
      ];
    })
    .sort((a, b) => a.ms - b.ms || a.hash.localeCompare(b.hash));
}
export function contarPorcelain(texto: string): number {
  const partes = texto.split("\0");
  let total = 0;
  for (let i = 0; i < partes.length; i++) {
    if (!partes[i]) continue;
    total++;
    if (/[RC]/.test(partes[i].slice(0, 2))) i++;
  }
  return total;
}
const obj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function linhasJson(texto: string): Record<string, any>[] {
  return texto.split("\n").flatMap(l => {
    try {
      const v: unknown = JSON.parse(l);
      return obj(v) ? [v] : [];
    } catch {
      return [];
    }
  });
}
function textoPuro(content: unknown, tipo = "text"): string {
  if (typeof content === "string") return content;
  if (
    !Array.isArray(content) ||
    content.some(b => obj(b) && b.type === "tool_result")
  )
    return "";
  return content
    .filter(b => obj(b) && b.type === tipo && typeof b.text === "string")
    .map(b => b.text)
    .join("\n");
}
export function parseSessao(
  texto: string,
  agente: Sessao["agente"],
  j: Janela,
  ignorarCwd: string
): Sessao | null {
  const linhas = linhasJson(texto);
  const cwd =
    agente === "codex"
      ? linhas.find(l => l.type === "session_meta")?.payload?.cwd
      : linhas.find(l => typeof l.cwd === "string")?.cwd;
  if (typeof cwd !== "string" || dentroDaPasta(cwd, ignorarCwd)) return null;
  // Eventos canônicos prevalecem; response_item é usado por versões desktop atuais.
  const temEventos = linhas.some(
    l => l.type === "event_msg" && l.payload?.type === "user_message"
  );
  const pedidos = linhas
    .flatMap(l => {
      let t = "";
      if (
        agente === "claude" &&
        l.type === "user" &&
        !l.isCompactSummary &&
        !l.isSidechain
      )
        t = textoPuro(l.message?.content);
      if (
        agente === "codex" &&
        temEventos &&
        l.type === "event_msg" &&
        l.payload?.type === "user_message"
      )
        t = textoPuro(l.payload.message);
      if (
        agente === "codex" &&
        !temEventos &&
        l.type === "response_item" &&
        l.payload?.type === "message" &&
        l.payload?.role === "user"
      )
        t = textoPuro(l.payload.content, "input_text");
      const ms = Date.parse(l.timestamp);
      // Extensões (ex.: Codex no Chrome) embrulham o pedido em contexto; fica só o que a pessoa escreveu
      const marca = t.indexOf("## My request:");
      if (marca >= 0) t = t.slice(marca + "## My request:".length);
      t = t.trim();
      if (
        !dentro(ms, j) ||
        !t ||
        t.startsWith("<") ||
        t.startsWith("# AGENTS.md instructions")
      )
        return [];
      return [{ ms, texto: ocultarSegredos(t).slice(0, 280) }];
    })
    .sort((a, b) => a.ms - b.ms);
  if (!pedidos.length) return null;
  return {
    agente,
    projeto: basename(cwd),
    cwd,
    inicio: horaFortaleza(pedidos[0].ms),
    fim: horaFortaleza(pedidos.at(-1)!.ms),
    pedidos: pedidos.length,
    amostras: pedidos.slice(0, 12).map(p => p.texto),
    tempos: pedidos.map(p => p.ms),
  };
}
export const parseSessaoClaude = (t: string, j: Janela, ignorar: string) =>
  parseSessao(t, "claude", j, ignorar);
export const parseSessaoCodex = (t: string, j: Janela, ignorar: string) =>
  parseSessao(t, "codex", j, ignorar);

export function coletar(
  op: {
    dia: string;
    janela: Janela;
    raizProjetos: string;
    vault: string;
    claudeDir: string;
    codexDir: string;
    ignorarCwd: string;
  },
  deps: Dependencias = sistema
): Insumos {
  const { dia, janela: j } = op;
  const avisos: string[] = [];
  const recente = { inicio: j.fim - 7 * 86400_000, fim: j.fim };
  const leitura = { inicio: Math.min(j.inicio, recente.inicio), fim: j.fim };
  function stat(p: string) {
    try {
      return deps.fs.stat(p);
    } catch {
      return null;
    }
  }
  function listar(p: string) {
    try {
      return deps.fs.listar(p).sort();
    } catch {
      avisos.push(`Pasta indisponível: ${p}`);
      return [];
    }
  }
  function ler(p: string) {
    try {
      return deps.fs.ler(p);
    } catch {
      avisos.push(`Arquivo indisponível: ${p}`);
      return "";
    }
  }
  function git(p: string, args: string[], opcional = false) {
    try {
      return deps.git(p, args);
    } catch {
      if (!opcional) avisos.push(`Git indisponível: ${p} (${args[0]})`);
      return "";
    }
  }
  const sessoes: Sessao[] = [];
  const ativos = new Set<string>();
  function sessao(p: string, agente: Sessao["agente"]) {
    const s = stat(p);
    if (!s?.isFile() || s.mtimeMs < leitura.inicio) return;
    const texto = ler(p);
    const seteDias = parseSessao(texto, agente, recente, op.ignorarCwd);
    if (seteDias) ativos.add(resolve(seteDias.cwd));
    const atual = parseSessao(texto, agente, j, op.ignorarCwd);
    if (atual) sessoes.push(atual);
  }
  for (const nome of listar(op.claudeDir)) {
    const pasta = join(op.claudeDir, nome);
    if (!stat(pasta)?.isDirectory()) continue;
    for (const arquivo of listar(pasta).filter(n => n.endsWith(".jsonl")))
      sessao(join(pasta, arquivo), "claude");
  }
  // Diretórios Codex podem usar data UTC ou local, dependendo do cliente.
  const dias = new Set<string>();
  for (
    let ms = leitura.inicio;
    ms <= leitura.fim + 86400_000;
    ms += 86400_000
  ) {
    const t = Math.min(ms, leitura.fim);
    dias.add(new Date(t).toISOString().slice(0, 10));
    dias.add(diaFortaleza(t));
  }
  for (const d of [...dias].sort()) {
    const pasta = join(op.codexDir, ...d.split("-"));
    if (!stat(pasta)?.isDirectory()) continue;
    for (const arquivo of listar(pasta).filter(n => n.endsWith(".jsonl")))
      sessao(join(pasta, arquivo), "codex");
  }
  sessoes.sort(
    (a, b) => a.tempos[0] - b.tempos[0] || a.cwd.localeCompare(b.cwd)
  );
  const repositorios: Repositorio[] = [];
  for (const nome of listar(op.raizProjetos)) {
    const caminho = join(op.raizProjetos, nome);
    const s = stat(caminho);
    if (!s?.isDirectory() || !stat(join(caminho, ".git"))) continue;
    const log = git(caminho, [
      "log",
      "--all",
      "--no-merges",
      `--since-as-filter=${new Date(leitura.inicio).toISOString()}`,
      `--until=${new Date(leitura.fim).toISOString()}`,
      "--format=%x1e%H%x1f%ct%x1f%s",
      "--numstat",
    ]);
    const todos = parseGitLog(log);
    if (todos.some(c => dentro(c.ms, recente))) ativos.add(resolve(caminho));
    const commits = todos.filter(c => dentro(c.ms, j));
    const raizes = git(
      caminho,
      ["log", "--all", "--max-parents=0", "--format=%ct"],
      true
    )
      .trim()
      .split("\n")
      .map(Number)
      .filter(n => n > 0);
    const primeiro = raizes.length ? Math.min(...raizes) * 1000 : null;
    const upstream = git(
      caminho,
      ["rev-parse", "--abbrev-ref", "@{upstream}"],
      true
    ).trim();
    const contagem = upstream
      ? git(caminho, ["rev-list", "--count", "@{upstream}..HEAD"]).trim()
      : "";
    repositorios.push({
      projeto: nome,
      caminho,
      commits,
      pendentes: contarPorcelain(
        git(caminho, ["status", "--porcelain=v1", "-z"])
      ),
      aFrente: /^\d+$/.test(contagem) ? Number(contagem) : null,
      remoto: !!git(caminho, ["remote"], true).trim(),
      novo:
        dentro(s.birthtimeMs, j) || (primeiro !== null && dentro(primeiro, j)),
    });
  }
  const notas: Insumos["vault"]["notas"] = [];
  function varrer(pasta: string) {
    for (const nome of listar(pasta)) {
      if ([".obsidian", ".claude", "arquivo", ".git"].includes(nome)) continue;
      const abs = join(pasta, nome);
      const s = stat(abs);
      if (!s || s.isSymbolicLink()) continue;
      if (s.isDirectory()) varrer(abs);
      else if (s.isFile() && nome.endsWith(".md") && dentro(s.mtimeMs, j)) {
        const caminho = relative(op.vault, abs);
        notas.push({
          caminho,
          pasta: caminho.includes(sep) ? caminho.split(sep)[0] : "(raiz)",
          titulo: ocultarSegredos(
            ler(abs).match(/^# (.+)$/m)?.[1] ?? basename(nome, ".md")
          ),
          criado: dentro(s.birthtimeMs, j),
          ms: s.mtimeMs,
        });
      }
    }
  }
  varrer(op.vault);
  const marcos = ler(
    join(op.vault, "diario", `Linha do Tempo ${dia.slice(0, 4)}.md`)
  )
    .split("\n")
    .filter(l => l.startsWith(`- **${dia}:**`))
    .map(ocultarSegredos);
  const foco = ocultarSegredos(
    ler(join(op.vault, "memoria/foco-da-semana.md"))
  ).slice(0, 4000);
  const clientes: Insumos["vault"]["clientes"] = [];
  for (const nome of listar(join(op.vault, "clientes"))) {
    const p = join(op.vault, "clientes", nome, "overview.md");
    if (!stat(p)?.isFile()) continue;
    const fm = ler(p).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const campo = (k: string) => {
      const v = fm.match(new RegExp(`^${k}:\\s*(.*?)\\s*$`, "m"))?.[1];
      return v ? ocultarSegredos(v.replace(/^['"]|['"]$/g, "")) : null;
    };
    clientes.push({
      caminho: relative(op.vault, p),
      status: campo("status"),
      updated: campo("updated"),
    });
  }
  const commits = repositorios.flatMap(r => r.commits);
  const tempos = [
    ...commits.map(c => c.ms),
    ...sessoes.flatMap(s => s.tempos),
    ...notas.map(n => n.ms),
  ].sort((a, b) => a - b);
  const tocados = repositorios.filter(
    r => r.commits.length || sessoes.some(s => dentroDaPasta(s.cwd, r.caminho))
  );
  const metricas: Metricas = {
    commits: commits.length,
    repositorios: tocados.length,
    arquivosAlterados: repositorios.reduce(
      (n, r) => n + new Set(r.commits.flatMap(c => c.arquivos)).size,
      0
    ),
    linhasMais: commits.reduce((n, c) => n + c.linhasMais, 0),
    linhasMenos: commits.reduce((n, c) => n + c.linhasMenos, 0),
    sessoesClaude: sessoes.filter(s => s.agente === "claude").length,
    sessoesCodex: sessoes.filter(s => s.agente === "codex").length,
    pedidos: sessoes.reduce((n, s) => n + s.pedidos, 0),
    notasDoVault: notas.length,
    primeiraAtividade: tempos.length ? horaFortaleza(tempos[0]) : null,
    ultimaAtividade: tempos.length ? horaFortaleza(tempos.at(-1)!) : null,
    naoCommitado: repositorios.filter(
      r => r.pendentes && [...ativos].some(cwd => dentroDaPasta(cwd, r.caminho))
    ).length,
  };
  const porProjeto = tocados
    .map(r => ({
      projeto: r.projeto,
      commits: r.commits.length,
      linhasMais: r.commits.reduce((n, c) => n + c.linhasMais, 0),
      linhasMenos: r.commits.reduce((n, c) => n + c.linhasMenos, 0),
    }))
    .sort(
      (a, b) =>
        b.commits - a.commits ||
        b.linhasMais + b.linhasMenos - a.linhasMais - a.linhasMenos ||
        a.projeto.localeCompare(b.projeto)
    );
  const eventos: Evento[] = repositorios.flatMap(r =>
    r.commits.map(c => ({
      ms: c.ms,
      hora: c.hora,
      projeto: r.projeto,
      texto: c.mensagem,
      tipo: "commit" as const,
    }))
  );
  eventos.push(
    ...sessoes.map(s => ({
      ms: s.tempos[0],
      hora: s.inicio,
      projeto: s.projeto,
      texto: s.amostras[0],
      tipo: "sessao" as const,
    }))
  );
  eventos.push(
    ...marcos.map(texto => {
      const hora = texto.match(/\b([01]\d|2[0-3]):[0-5]\d\b/)?.[0] ?? null;
      return {
        ms: hora
          ? j.inicio +
            (Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))) * 60_000
          : null,
        hora,
        projeto: null,
        texto,
        tipo: "marco" as const,
      };
    })
  );
  eventos.sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity));
  return {
    dia,
    janela: j,
    repositorios,
    sessoes,
    vault: {
      notas,
      marcos,
      foco,
      clientes,
      prospeccao: join(op.vault, "deals/prospeccao.md"),
    },
    metricas,
    porProjeto,
    eventos: eventos.slice(0, 80),
    fontes: {
      commits: metricas.commits,
      sessoesClaude: metricas.sessoesClaude,
      sessoesCodex: metricas.sessoesCodex,
      notas: notas.length,
      noticias: 0,
    },
    avisos,
  };
}
