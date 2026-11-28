import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, promisify } from "node:util";
import { buscarTermo } from "../../shared/radar/dedup.ts";
import { dominioDe, normalizarInstagram, plataformaDeLinkBio, telefoneDe } from "../../shared/radar/normalizar.ts";
import { lerDescartados, lerLeads, usarDono } from "./armazem.ts";

// Candidatos do Google Maps para o /prospectar, pelo Google Maps Scraper Kit (roda local, sem chave).
// Só lê o Radar para tirar duplicado; não grava nada. Quem vira lead continua passando pela análise da skill.

const rodar = promisify(execFile);

// Além de DOMINIOS_NAO_PROPRIOS: agendadores e construtores gratuitos que aparecem como "site" na ficha do Maps.
const SEM_SITE_PROPRIO = [
  "schedweb.com.br", "booksy.com", "trinks.com", "appbarber.com.br", "avec.app", "agendapro.com",
  "wixsite.com", "sites.google.com", "negocio.site", "business.site", "ueniweb.com", "webnode.page",
  "olx.com.br", "ifood.com.br", "doctoralia.com.br",
];

const HANDLES_DE_PLATAFORMA = new Set(["whatsapp", "booksybiz", "booksy", "instagram", "facebook", "schedweb", "trinks", "appbarber", "avec.app", "linktree", "wix", "ueni"]);

type Linha = Record<string, string>;
export type Candidato = {
  nome: string;
  categoria: string;
  endereco: string;
  telefone: string;
  nota: number;
  avaliacoes: number;
  instagram: string;
  site: string;
  sinal: "sem site" | "link sem site próprio" | "site próprio";
  plataforma?: string;
  duplicado?: string;
};

function ajuda() {
  console.log(`Uso: pnpm radar:maps -- "<nicho> em <cidade> <UF>" --cidade "Fortaleza, CE" [opções]
  --profundidade 1     1 = uma busca (até ~120 resultados); 2 ou mais varre mais área
  --min-nota 4.5       nota mínima no Google
  --min-avaliacoes 25  avaliações mínimas
  --com-site           mostra também quem já tem site próprio
  --csv arquivo.csv    reaproveita um resultado já baixado em vez de buscar de novo
  --json               saída em JSON
  --kit <pasta>        onde está o kit (padrão ~/Desktop/projects/google-maps-scraper-kit)`);
}

/** CSV do kit: vírgula, aspas duplas, BOM no começo. */
export function lerCsv(texto: string): Linha[] {
  const linhas: string[][] = [];
  let campo = "", linha: string[] = [], aspas = false;
  const t = texto.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some(Boolean)) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); if (linha.some(Boolean)) linhas.push(linha); }
  const [cab, ...resto] = linhas;
  if (!cab) return [];
  return resto.map((l) => Object.fromEntries(cab.map((k, i) => [k.trim(), (l[i] ?? "").trim()])));
}

/** O Maps embrulha links em l.instagram.com/?u=...; devolve o destino real. */
export function desembrulhar(url: string): string {
  try {
    const u = new URL(url);
    if (/(^|\.)l\.instagram\.com$|(^|\.)l\.facebook\.com$/.test(u.hostname)) {
      const destino = u.searchParams.get("u");
      if (destino) return destino;
    }
  } catch { /* fica como veio */ }
  return url;
}

export function classificarSite(url: string): { sinal: Candidato["sinal"]; plataforma?: string } {
  if (!url) return { sinal: "sem site" };
  const real = desembrulhar(url);
  const dominio = dominioDe(real);
  if (!dominio) return { sinal: "link sem site próprio", plataforma: plataformaDeLinkBio(real) ?? "rede social ou link de bio" };
  const gratuito = SEM_SITE_PROPRIO.find((d) => dominio === d || dominio.endsWith(`.${d}`));
  if (gratuito) return { sinal: "link sem site próprio", plataforma: gratuito };
  return { sinal: "site próprio" };
}

export function paraCandidato(l: Linha): Candidato {
  const site = desembrulhar(l.website ?? "");
  // O kit tira o @ da página do site; em agendador sai o @ da plataforma (booksybiz, whatsapp). Ficha que aponta pro
  // Instagram é a fonte mais confiável.
  const doSite = /instagram\.com\//i.test(site) ? normalizarInstagram(site) : "";
  const doKit = l.instagram ? normalizarInstagram(l.instagram) : "";
  const ig = doSite || (HANDLES_DE_PLATAFORMA.has(doKit) ? "" : doKit);
  return {
    nome: l.title ?? "",
    categoria: l.category ?? "",
    endereco: l.address ?? "",
    telefone: l.phone ?? "",
    nota: Number(l.review_rating) || 0,
    avaliacoes: Number(l.review_count) || 0,
    instagram: ig ? `@${ig}` : "",
    site,
    ...classificarSite(site),
  };
}

async function buscar(kit: string, busca: string, cidade: string, profundidade: string): Promise<string> {
  const py = "python3";
  const status = await rodar(py, ["scripts/engine.py", "status"], { cwd: kit }).catch((e) => e);
  if (!/running/i.test(String(status.stdout ?? ""))) await rodar(py, ["scripts/engine.py", "start"], { cwd: kit, timeout: 300_000 });
  const { stdout } = await rodar(py, ["scripts/scrape.py", busca, "--city", cidade, "--depth", profundidade], {
    cwd: kit, timeout: 15 * 60_000, maxBuffer: 20 * 1024 * 1024,
  });
  const salvo = stdout.match(/saved → (\S+\.csv)/)?.[1];
  if (!salvo) throw new Error(`o kit não salvou CSV:\n${stdout.slice(-800)}`);
  return salvo;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      cidade: { type: "string" },
      profundidade: { type: "string", default: "1" },
      "min-nota": { type: "string", default: "4.5" },
      "min-avaliacoes": { type: "string", default: "25" },
      "com-site": { type: "boolean", default: false },
      csv: { type: "string" },
      json: { type: "boolean", default: false },
      kit: { type: "string", default: join(homedir(), "Desktop/projects/google-maps-scraper-kit") },
      dono: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const busca = positionals.join(" ").trim();
  if (values.help || (!values.csv && (!busca || !values.cidade))) { ajuda(); if (!values.help) process.exitCode = 1; return; }
  usarDono(values.dono);

  const arquivo = values.csv ?? (await buscar(values.kit!, busca, values.cidade!, values.profundidade!));
  const todos = lerCsv(await readFile(arquivo, "utf8")).map(paraCandidato);
  const minNota = Number(values["min-nota"]), minAval = Number(values["min-avaliacoes"]);
  const [leads, descartados] = await Promise.all([lerLeads(), lerDescartados()]);

  const filtrados = todos
    .filter((c) => c.nota >= minNota && c.avaliacoes >= minAval)
    .filter((c) => values["com-site"] || c.sinal !== "site próprio")
    .map((c) => {
      const termos = [c.instagram, c.sinal === "site próprio" ? c.site : "", telefoneDe(c.telefone) ? c.telefone : "", c.nome].filter(Boolean);
      const caso = termos.flatMap((t) => buscarTermo(t, leads, descartados))[0];
      return caso ? { ...c, duplicado: `${caso.onde} ${caso.chave}` } : c;
    })
    .sort((a, b) => Number(Boolean(a.duplicado)) - Number(Boolean(b.duplicado)) || b.avaliacoes - a.avaliacoes);

  if (values.json) { console.log(JSON.stringify({ arquivo, total: todos.length, candidatos: filtrados }, null, 2)); return; }
  const livres = filtrados.filter((c) => !c.duplicado);
  console.log(`# Maps: ${busca || arquivo}\n${todos.length} negócios, ${filtrados.length} passam no filtro (nota ${minNota}+, ${minAval}+ avaliações${values["com-site"] ? "" : ", sem site próprio"}), ${livres.length} fora do Radar\nCSV: ${arquivo}\n`);
  for (const c of filtrados) {
    const site = c.sinal === "sem site" ? "sem site" : `${c.sinal}${c.plataforma ? ` (${c.plataforma})` : ""}: ${c.site}`;
    console.log(`${c.duplicado ? "~ JÁ NO RADAR " : "- "}${c.nome} · ${c.nota} (${c.avaliacoes}) · ${c.telefone || "sem telefone"} · ${c.instagram || "sem @"} · ${site}${c.duplicado ? ` · ${c.duplicado}` : ""}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
}
