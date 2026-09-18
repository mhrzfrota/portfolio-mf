import type { NotaCerebro } from "./types";

/** Uma nota sem edição há tantos dias está fria. */
export const DIAS_FRIA = 30;
/** Acima disto a nota pesa demais para ser lida inteira no começo de toda sessão. */
export const TOKENS_PESADA = 5000;
/** Pastas que não contam como frias: já são histórico por definição. */
const PASTAS_HISTORICO = new Set(["arquivo", "diario"]);

export interface ResumoPasta {
  pasta: string;
  notas: number;
  tokens: number;
  /** ISO da nota mais recente da pasta. */
  ultima: string;
}

const MS_DIA = 86_400_000;

export function diasDesde(iso: string, hoje: Date): number {
  return Math.floor((hoje.getTime() - new Date(iso).getTime()) / MS_DIA);
}

export function porPasta(notas: NotaCerebro[]): ResumoPasta[] {
  const mapa = new Map<string, ResumoPasta>();
  for (const n of notas) {
    const p = mapa.get(n.pasta) ?? { pasta: n.pasta, notas: 0, tokens: 0, ultima: n.modificado };
    p.notas++;
    p.tokens += n.tokens;
    if (n.modificado > p.ultima) p.ultima = n.modificado;
    mapa.set(n.pasta, p);
  }
  return Array.from(mapa.values()).sort((a, b) => b.tokens - a.tokens);
}

export function ehFria(n: NotaCerebro, hoje: Date, dias = DIAS_FRIA): boolean {
  return !PASTAS_HISTORICO.has(n.pasta) && diasDesde(n.modificado, hoje) >= dias;
}

export function ehPesada(n: NotaCerebro, limite = TOKENS_PESADA): boolean {
  return n.tokens >= limite;
}

export function notasFrias(notas: NotaCerebro[], hoje: Date, dias = DIAS_FRIA): NotaCerebro[] {
  return notas.filter(n => ehFria(n, hoje, dias)).sort((a, b) => a.modificado.localeCompare(b.modificado));
}

export function notasPesadas(notas: NotaCerebro[], limite = TOKENS_PESADA): NotaCerebro[] {
  return notas.filter(n => ehPesada(n, limite)).sort((a, b) => b.tokens - a.tokens);
}

/** Nome pelo qual um `[[link]]` encontra a nota: título ou nome do arquivo, sem caixa. */
function chavesDaNota(n: NotaCerebro): string[] {
  const arquivo = n.path.split("/").pop()!.replace(/\.md$/i, "");
  return Array.from(new Set([arquivo.toLowerCase(), n.titulo.toLowerCase()]));
}

export interface NotaLigada {
  nota: NotaCerebro;
  /** Quantas notas apontam para ela. */
  entradas: number;
}

/** Notas mais citadas por `[[link]]`. Links para notas inexistentes são ignorados. */
export function maisLigadas(notas: NotaCerebro[], limite = 8): NotaLigada[] {
  const indice = new Map<string, NotaCerebro>();
  for (const n of notas) for (const k of chavesDaNota(n)) indice.set(k, n);
  const contagem = new Map<string, number>();
  for (const n of notas) {
    for (const alvo of n.links) {
      const destino = indice.get(alvo.split("/").pop()!.toLowerCase());
      if (!destino || destino.path === n.path) continue;
      contagem.set(destino.path, (contagem.get(destino.path) ?? 0) + 1);
    }
  }
  return Array.from(contagem)
    .map(([path, entradas]) => ({ nota: notas.find(n => n.path === path)!, entradas }))
    .sort((a, b) => b.entradas - a.entradas || a.nota.titulo.localeCompare(b.nota.titulo))
    .slice(0, limite);
}

export type OrdemNotas = "tokens" | "recentes" | "antigas";

export function ordenar(notas: NotaCerebro[], ordem: OrdemNotas): NotaCerebro[] {
  const c = [...notas];
  if (ordem === "tokens") return c.sort((a, b) => b.tokens - a.tokens);
  if (ordem === "recentes") return c.sort((a, b) => b.modificado.localeCompare(a.modificado));
  return c.sort((a, b) => a.modificado.localeCompare(b.modificado));
}

export function filtrar(notas: NotaCerebro[], pasta: string | null, busca: string): NotaCerebro[] {
  const q = busca.trim().toLowerCase();
  return notas.filter(
    n =>
      (!pasta || n.pasta === pasta) &&
      (!q || n.titulo.toLowerCase().includes(q) || n.path.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)))
  );
}

export function fmtTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: n >= 10000 ? 0 : 1 })}k`;
  return n.toLocaleString("pt-BR");
}

export function relativo(iso: string, hoje: Date): string {
  const d = diasDesde(iso, hoje);
  if (d <= 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  const m = Math.floor(d / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}
