/**
 * Sobe o vault (Obsidian) para o Supabase do portfólio.
 *
 *   pnpm cerebro:sync           # sincroniza
 *   pnpm cerebro:sync --dry     # só mede, não grava
 *
 * Lê de `.env.local`: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * CEREBRO_VAULT (padrão ~/Documents/FRT CEREBRO) e CEREBRO_OWNER_EMAIL
 * (opcional quando o projeto tem um usuário só).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, basename, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseNota, extrairFoco } from "../shared/cerebro/parse.ts";

const dry = process.argv.includes("--dry");
const vault = (process.env.CEREBRO_VAULT ?? join(homedir(), "Documents", "FRT CEREBRO")).replace(/^~/, homedir());
const url = process.env.VITE_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const ownerEmail = process.env.CEREBRO_OWNER_EMAIL?.trim();

if (!existsSync(vault)) {
  console.error(`Vault não encontrado em ${vault}. Ajuste CEREBRO_VAULT no .env.local.`);
  process.exit(1);
}

interface Linha {
  owner?: string;
  path: string;
  pasta: string;
  titulo: string;
  tags: string[];
  status: string | null;
  frontmatter: Record<string, unknown>;
  links: string[];
  palavras: number;
  chars: number;
  tokens: number;
  resumo: string;
  corpo: string;
  modificado: string;
}

function* arquivosMd(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* arquivosMd(p);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) yield p;
  }
}

const inicio = Date.now();
const linhas: Linha[] = [];
for (const abs of arquivosMd(vault)) {
  const path = relative(vault, abs).split(sep).join("/");
  const nota = parseNota(readFileSync(abs, "utf8"), basename(abs));
  const { corpo, ...resto } = nota;
  linhas.push({
    path,
    pasta: path.includes("/") ? path.split("/")[0] : "(raiz)",
    ...resto,
    corpo,
    modificado: statSync(abs).mtime.toISOString(),
  });
}

const claudeMd = join(vault, "CLAUDE.md");
const foco = existsSync(claudeMd) ? extrairFoco(readFileSync(claudeMd, "utf8")) : null;

const totalTokens = linhas.reduce((s, l) => s + l.tokens, 0);
const porPasta = new Map<string, { notas: number; tokens: number }>();
for (const l of linhas) {
  const p = porPasta.get(l.pasta) ?? { notas: 0, tokens: 0 };
  p.notas++;
  p.tokens += l.tokens;
  porPasta.set(l.pasta, p);
}

console.log(`${linhas.length} notas, ~${totalTokens.toLocaleString("pt-BR")} tokens em ${vault}`);
for (const [pasta, p] of [...porPasta].sort((a, b) => b[1].tokens - a[1].tokens)) {
  console.log(`  ${pasta.padEnd(14)} ${String(p.notas).padStart(3)} notas  ~${p.tokens.toLocaleString("pt-BR").padStart(7)} tokens`);
}
const pesadas = linhas.filter(l => l.tokens >= 5000).sort((a, b) => b.tokens - a.tokens);
if (pesadas.length) {
  console.log("Pesadas (5k+):");
  for (const l of pesadas) console.log(`  ~${l.tokens.toLocaleString("pt-BR").padStart(7)}  ${l.path}`);
}
if (foco?.semana) console.log(`Foco da semana: ${foco.semana}`);

if (dry) {
  console.log("Modo --dry: nada gravado.");
  process.exit(0);
}

if (!url || !serviceKey) {
  console.error("Faltam VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: usuarios, error: erroUsuarios } = await supabase.auth.admin.listUsers({ perPage: 50 });
if (erroUsuarios) {
  console.error("Não consegui listar usuários:", erroUsuarios.message);
  process.exit(1);
}
const dono = ownerEmail
  ? usuarios.users.find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase())
  : usuarios.users.length === 1
    ? usuarios.users[0]
    : undefined;
if (!dono) {
  console.error(
    ownerEmail
      ? `Nenhum usuário com e-mail ${ownerEmail}.`
      : `O projeto tem ${usuarios.users.length} usuários. Defina CEREBRO_OWNER_EMAIL no .env.local.`
  );
  process.exit(1);
}

const owner = dono.id;
const agora = new Date().toISOString();
for (let i = 0; i < linhas.length; i += 100) {
  const lote = linhas.slice(i, i + 100).map(l => ({ ...l, owner, sincronizado_em: agora }));
  const { error } = await supabase.from("cerebro_notas").upsert(lote, { onConflict: "owner,path" });
  if (error) {
    console.error(`Falha ao gravar o lote ${i / 100 + 1}:`, error.message);
    process.exit(1);
  }
}

// Notas apagadas ou movidas no vault saem da tabela.
const { data: existentes, error: erroExistentes } = await supabase
  .from("cerebro_notas")
  .select("path")
  .eq("owner", owner);
if (erroExistentes) {
  console.error("Não consegui listar as notas gravadas:", erroExistentes.message);
  process.exit(1);
}
const atuais = new Set(linhas.map(l => l.path));
const obsoletas = (existentes ?? []).map(r => r.path as string).filter(p => !atuais.has(p));
if (obsoletas.length) {
  const { error } = await supabase.from("cerebro_notas").delete().eq("owner", owner).in("path", obsoletas);
  if (error) {
    console.error("Não consegui remover notas obsoletas:", error.message);
    process.exit(1);
  }
}

const duracao_ms = Date.now() - inicio;
const { error: erroSync } = await supabase
  .from("cerebro_sync")
  .insert({ owner, notas: linhas.length, tokens: totalTokens, duracao_ms, foco });
if (erroSync) {
  console.error("Notas gravadas, mas o registro do sync falhou:", erroSync.message);
  process.exit(1);
}

console.log(
  `Gravado: ${linhas.length} notas${obsoletas.length ? `, ${obsoletas.length} removidas` : ""} em ${duracao_ms} ms.`
);
