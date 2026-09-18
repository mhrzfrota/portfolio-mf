/**
 * Leitura de uma nota do vault: frontmatter, título, links e tamanho.
 * Puro, sem fs: o script de sync e os testes usam a mesma função.
 */

export interface NotaParseada {
  titulo: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  status: string | null;
  links: string[];
  palavras: number;
  chars: number;
  tokens: number;
  resumo: string;
  corpo: string;
}

export interface FocoSemana {
  /** Data no "Semana de:", em YYYY-MM-DD, quando existe. */
  semana: string | null;
  /** Texto da seção, sem o cabeçalho. */
  texto: string;
}

/** Separa o bloco `---` do início. Sem bloco, o yaml vem vazio. */
export function separarFrontmatter(texto: string): { yaml: string; corpo: string } {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { yaml: "", corpo: texto };
  return { yaml: m[1], corpo: texto.slice(m[0].length) };
}

function escalar(raw: string): unknown {
  const v = raw.trim();
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^\[.*\]$/.test(v)) {
    return v
      .slice(1, -1)
      .split(",")
      .map(x => tirarAspas(x.trim()))
      .filter(x => x !== "");
  }
  return tirarAspas(v);
}

function tirarAspas(v: string): string {
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Subconjunto de YAML que o vault usa: `chave: valor`, `chave: [a, b]` e
 * listas com `- item` na linha seguinte. Mapas aninhados são ignorados.
 */
export function parseYamlSimples(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const linhas = yaml.split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!m) continue;
    const [, chave, raw] = m;
    if (raw.trim() === "") {
      const lista: string[] = [];
      while (i + 1 < linhas.length && /^\s*-\s+/.test(linhas[i + 1])) {
        lista.push(tirarAspas(linhas[i + 1].replace(/^\s*-\s+/, "").trim()));
        i++;
      }
      out[chave] = lista.length ? lista : "";
      continue;
    }
    out[chave] = escalar(raw);
  }
  return out;
}

export function normalizarTags(fm: Record<string, unknown>): string[] {
  const t = fm.tags;
  if (Array.isArray(t)) return t.map(String).map(x => x.trim()).filter(Boolean);
  if (typeof t === "string" && t.trim()) return t.split(",").map(x => x.trim()).filter(Boolean);
  return [];
}

/** Primeiro `# Título`; sem ele, o nome do arquivo sem extensão. */
export function extrairTitulo(corpo: string, nomeArquivo: string): string {
  const m = corpo.match(/^#\s+(.+?)\s*$/m);
  const titulo = m ? m[1].trim() : nomeArquivo.replace(/\.md$/i, "");
  // Emoji na frente do título (surrogate pairs e símbolos) sai, o texto fica.
  return titulo.replace(/^[\uD800-\uDFFF\u2600-\u27BF\uFE0F\s]+/, "").trim() || titulo;
}

/** Alvos de `[[link]]`, `[[link|alias]]` e `[[link#seção]]`, sem repetir. */
export function extrairLinks(corpo: string): string[] {
  const vistos = new Set<string>();
  const re = /\[\[([^\]]+?)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(corpo))) {
    const alvo = m[1].split("|")[0].split("#")[0].trim();
    if (alvo) vistos.add(alvo);
  }
  return Array.from(vistos);
}

/** Estimativa: uns 3,5 caracteres por token em português. Serve para comparar, não para cobrar. */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 3.5);
}

function limparMarkdown(linha: string): string {
  return linha
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, alvo, alias) => alias ?? alvo)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/, "")
    .trim();
}

/** Primeiro parágrafo de texto corrido, sem títulos, listas ou tabelas. */
export function resumir(corpo: string, max = 220): string {
  for (const bloco of corpo.split(/\r?\n\s*\r?\n/)) {
    const linha = bloco.split(/\r?\n/).map(limparMarkdown).join(" ").trim();
    if (!linha || /^(#|-|\*|\||\d+\.)/.test(bloco.trim())) continue;
    return linha.length > max ? linha.slice(0, max - 1).trimEnd() + "…" : linha;
  }
  return "";
}

export function parseNota(texto: string, nomeArquivo: string): NotaParseada {
  const { yaml, corpo } = separarFrontmatter(texto);
  const frontmatter = parseYamlSimples(yaml);
  const status = typeof frontmatter.status === "string" && frontmatter.status ? frontmatter.status : null;
  return {
    titulo: extrairTitulo(corpo, nomeArquivo),
    frontmatter,
    tags: normalizarTags(frontmatter),
    status,
    links: extrairLinks(corpo),
    palavras: corpo.split(/\s+/).filter(Boolean).length,
    chars: texto.length,
    tokens: estimarTokens(texto),
    resumo: resumir(corpo),
    corpo,
  };
}

/** Seção "Foco da semana" do CLAUDE.md da raiz, até o próximo `## `. */
export function extrairFoco(claudeMd: string): FocoSemana | null {
  const m = claudeMd.match(/^##\s+(?:\d+\.\s*)?Foco da semana[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!m) return null;
  const texto = m[1].replace(/^>\s*Atualizar toda segunda[^\n]*\n/m, "").trim();
  const semana = texto.match(/\*\*Semana de:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  return { semana, texto };
}
