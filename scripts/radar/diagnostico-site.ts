import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import type { DiagnosticoSite } from "../../shared/radar/tipos.ts";
import { plataformaDeLinkBio } from "../../shared/radar/normalizar.ts";

type ContextoHtml = {
  url: string;
  analisadoEm: string;
  urlFinal?: string;
  status?: number;
  tempoRespostaMs?: number;
  tamanhoHtmlKb?: number;
  cabecalhos?: Record<string, string>;
  pagespeedMobile?: number;
  erro?: string;
};

function decodificar(texto: string): string {
  const entidades: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", copy: "©" };
  return texto.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|copy);/gi, (original, entidade: string) => {
    if (!entidade.startsWith("#")) return entidades[entidade.toLowerCase()] ?? original;
    const codigo = entidade[1].toLowerCase() === "x" ? parseInt(entidade.slice(2), 16) : parseInt(entidade.slice(1), 10);
    return codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : original;
  }).replace(/\s+/g, " ").trim();
}

function metas(html: string): Map<string, string> {
  const resultado = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const atributos: Record<string, string> = {};
    for (const atributo of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
      atributos[atributo[1].toLowerCase()] = decodificar(atributo[2] ?? atributo[3] ?? atributo[4]);
    }
    const nome = atributos.name ?? atributos.property;
    if (nome) resultado.set(nome.toLowerCase(), atributos.content ?? "");
  }
  return resultado;
}

function detectarPlataforma(html: string, generator: string, cabecalhos: Record<string, string>): string | undefined {
  const sinais = `generator: ${generator}\n${html}\n${Object.entries(cabecalhos).map(([chave, valor]) => `${chave}: ${valor}`).join("\n")}`;
  // Só assinaturas técnicas (CDN, atributo, cabeçalho): a palavra solta no texto
  // pega site que só cita ou linka a plataforma, e a plataforma vira evidência
  const regras: [string, RegExp][] = [
    ["Wix", /wixstatic\.com|wixsite\.com|x-wix-|_wixCssImports|generator: wix/i],
    ["WordPress", /wp-content|wp-includes|wp-json|generator: wordpress/i],
    ["Squarespace", /static1\.squarespace\.com|squarespace-cdn|generator: squarespace/i],
    ["Shopify", /cdn\.shopify\.com|myshopify\.com|shopify\.theme/i],
    ["Nuvemshop", /nuvemshop|tiendanube|nuvemcdn|d26lpennugtm8s\.cloudfront/i],
    ["Loja Integrada", /lojaintegrada/i],
    ["Webflow", /data-wf-page|data-wf-site|website-files\.com|generator: webflow/i],
    ["Framer", /framerusercontent\.com|data-framer-|generator: framer/i],
    ["Webnode", /webnode\./i],
    ["Site123", /site123\.(?:me|com)|cdn-cms\.f-static/i],
    ["Weebly", /weebly\.com|editmysite\.com/i],
    ["GoDaddy", /img1\.wsimg\.com|generator: (?:starfield|godaddy)/i],
    ["Google Sites", /sites\.google\.com|gstatic\.com\/atari/i],
    ["Blogger", /blogger\.com\/static|\.blogspot\.com|generator: blogger/i],
    ["Hotmart", /hotmart\.host|generator: hotmart/i],
  ];
  const encontrada = regras.find(([, expressao]) => expressao.test(sinais))?.[0];
  return encontrada === "WordPress" && /elementor/i.test(sinais) ? "WordPress (Elementor)" : encontrada;
}

export function analisarHtml(html: string, contexto: ContextoHtml): DiagnosticoSite {
  const urlFinal = contexto.urlFinal ?? contexto.url;
  const meta = metas(html);
  const tituloBruto = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1];
  const titulo = tituloBruto ? decodificar(tituloBruto.replace(/<[^>]*>/g, "")) : undefined;
  const descricao = meta.get("description") || undefined;
  const anoAtual = Number(contexto.analisadoEm.slice(0, 4));
  const anos: number[] = [];
  const texto = decodificar(html.replace(/<[^>]*>/g, " "));
  for (const ocorrencia of texto.matchAll(/(?:©|copyright)[^\d©]{0,80}((?:19|20)\d{2}(?:\s*[-\u2013\u2014]\s*(?:19|20)\d{2})?)/gi)) {
    for (const ano of ocorrencia[1].match(/\d{4}/g) ?? []) {
      const numero = Number(ano);
      if (numero >= 1995 && numero <= anoAtual) anos.push(numero);
    }
  }
  const jquery = html.match(/jquery(?:[-./]|\s+v?)(\d+\.\d+(?:\.\d+)?)/i)?.[1]
    ?? html.match(/jquery(?:\.min)?\.js\?[^"'\s>]*\b(?:ver|version|v)=(\d+\.\d+(?:\.\d+)?)/i)?.[1];
  const linkBio = plataformaDeLinkBio(urlFinal) ?? plataformaDeLinkBio(contexto.url);
  const diagnostico: DiagnosticoSite = {
    url: contexto.url, urlFinal: contexto.urlFinal, status: contexto.status,
    https: /^https:\/\//i.test(urlFinal), tempoRespostaMs: contexto.tempoRespostaMs,
    tamanhoHtmlKb: contexto.tamanhoHtmlKb ?? Math.round(new TextEncoder().encode(html).length / 1024 * 100) / 100,
    viewport: Boolean(meta.get("viewport")), titulo: titulo || undefined, descricao,
    plataforma: linkBio ?? detectarPlataforma(html, meta.get("generator") ?? "", contexto.cabecalhos ?? {}),
    anoCopyright: anos.length ? Math.max(...anos) : undefined, jquery,
    temWhatsapp: /(?:wa\.me\/|api\.whatsapp\.com(?:\/|\b)|whatsapp:\/\/)/i.test(html),
    temFormulario: /<form\b/i.test(html), rastreamento: [],
    pagespeedMobile: contexto.pagespeedMobile, problemas: [], situacaoSugerida: "bom", analisadoEm: contexto.analisadoEm,
  };
  if (/fbq\s*\(|connect\.facebook\.net/i.test(html)) diagnostico.rastreamento.push("Meta Pixel");
  if (/gtag\s*\(|googletagmanager\.com\/gtag/i.test(html)) diagnostico.rastreamento.push("Google Analytics");
  if (/GTM-/i.test(html)) diagnostico.rastreamento.push("Google Tag Manager");
  if (linkBio) {
    diagnostico.problemas.push(`Link da bio é ${linkBio}, não um site próprio`);
    diagnostico.situacaoSugerida = "sem-site";
    return diagnostico;
  }
  if (contexto.erro) {
    diagnostico.problemas.push(`Site não respondeu: ${contexto.erro}`);
    diagnostico.situacaoSugerida = "ruim";
    return diagnostico;
  }
  let graves = 0;
  let leves = 0;
  const grave = (condicao: boolean, mensagem: string) => { if (condicao) { graves++; diagnostico.problemas.push(mensagem); } };
  const leve = (condicao: boolean, mensagem: string) => { if (condicao) { leves++; diagnostico.problemas.push(mensagem); } };
  if (contexto.status !== undefined && contexto.status >= 400) diagnostico.problemas.push(`Site retornou HTTP ${contexto.status}`);
  grave(!diagnostico.https, "Site sem HTTPS: navegador mostra Não seguro");
  grave(!diagnostico.viewport, "Sem meta viewport: não se adapta ao celular");
  grave((contexto.tempoRespostaMs ?? 0) > 2500, `Resposta lenta: ${((contexto.tempoRespostaMs ?? 0) / 1000).toFixed(1).replace(".", ",")} s`);
  grave(diagnostico.anoCopyright !== undefined && anoAtual - diagnostico.anoCopyright >= 3, `Rodapé com © ${diagnostico.anoCopyright}: parece abandonado`);
  grave(Boolean(jquery && /^[12]\./.test(jquery)), `jQuery ${jquery}: versão antiga`);
  grave(contexto.pagespeedMobile !== undefined && contexto.pagespeedMobile < 50, `PageSpeed mobile baixo: ${contexto.pagespeedMobile}/100`);
  leve(!diagnostico.titulo, "Sem título na página");
  leve(!diagnostico.descricao, "Sem meta description");
  leve(!diagnostico.temWhatsapp, "Sem botão de WhatsApp");
  diagnostico.situacaoSugerida = (contexto.status ?? 0) >= 400 || graves >= 2 ? "ruim" : graves === 1 || leves >= 2 ? "mediano" : "bom";
  return diagnostico;
}

const LIMITE_CORPO = 3 * 1024 * 1024;
const AGENTE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

async function buscarPagina(url: string): Promise<{ resposta: Response; tempoRespostaMs: number }> {
  const inicio = performance.now();
  const resposta = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": AGENTE } });
  return { resposta, tempoRespostaMs: Math.round(performance.now() - inicio) };
}

async function lerCorpo(resposta: Response): Promise<{ html: string; tamanhoHtmlKb: number }> {
  const leitor = resposta.body?.getReader();
  if (!leitor) return { html: "", tamanhoHtmlKb: 0 };
  const partes: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (tamanho < LIMITE_CORPO) {
      const { value, done } = await leitor.read();
      if (done) break;
      const parte = value.subarray(0, LIMITE_CORPO - tamanho);
      partes.push(parte);
      tamanho += parte.length;
    }
  } finally {
    await leitor.cancel();
    leitor.releaseLock();
  }
  return { html: Buffer.concat(partes).toString("utf8"), tamanhoHtmlKb: Math.round(tamanho / 1024 * 100) / 100 };
}

async function pagespeed(url: string): Promise<number | undefined> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  if (process.env.PSI_KEY) endpoint.searchParams.set("key", process.env.PSI_KEY);
  try {
    const resposta = await fetch(endpoint, { signal: AbortSignal.timeout(60_000) });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const resultado = await resposta.json() as { lighthouseResult?: { categories?: { performance?: { score?: unknown } } } };
    const nota = resultado?.lighthouseResult?.categories?.performance?.score;
    if (typeof nota !== "number" || !Number.isFinite(nota) || nota < 0 || nota > 1) throw new Error("resposta sem nota de desempenho válida");
    return Math.round(nota * 100);
  } catch (erro) {
    console.error(`Aviso: PageSpeed indisponível (${erro instanceof Error ? erro.message : String(erro)})`);
    return undefined;
  }
}

export async function diagnosticar(url: string, { psi = false }: { psi?: boolean } = {}): Promise<DiagnosticoSite> {
  const entrada = url.trim();
  if (!entrada) throw new Error("url: informe o endereço do site");
  const temEsquema = /^[a-z][a-z\d+.-]*:/i.test(entrada) && !/^[^/]+:\d+(?:\/|$)/.test(entrada);
  const endereco = temEsquema ? entrada : `https://${entrada}`;
  const contexto: ContextoHtml = { url: endereco, analisadoEm: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date()) };
  if (plataformaDeLinkBio(endereco)) return analisarHtml("", contexto);
  const parsed = new URL(endereco);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("url: use um endereço http(s)");
  let html = "";
  try {
    let pagina: Awaited<ReturnType<typeof buscarPagina>>;
    let requisitada = endereco;
    try { pagina = await buscarPagina(requisitada); }
    catch (erro) {
      if (temEsquema) throw erro;
      requisitada = endereco.replace(/^https:/, "http:");
      pagina = await buscarPagina(requisitada);
    }
    contexto.urlFinal = pagina.resposta.url || requisitada;
    contexto.status = pagina.resposta.status;
    contexto.tempoRespostaMs = pagina.tempoRespostaMs;
    contexto.cabecalhos = Object.fromEntries(pagina.resposta.headers.entries());
    const corpo = await lerCorpo(pagina.resposta);
    html = corpo.html;
    contexto.tamanhoHtmlKb = corpo.tamanhoHtmlKb;
  } catch (erro) {
    const causa = erro instanceof Error && erro.cause && typeof erro.cause === "object" && "code" in erro.cause ? ` (${String(erro.cause.code)})` : "";
    contexto.erro = `${erro instanceof Error ? erro.message : String(erro)}${causa}`;
  }
  if (psi && !contexto.erro && (contexto.status ?? 0) < 400) contexto.pagespeedMobile = await pagespeed(contexto.urlFinal ?? endereco);
  return analisarHtml(html, contexto);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // O pnpm repassa o "--" de `pnpm radar:site -- <url>`.
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { psi: { type: "boolean", default: false } } });
    if (positionals.length !== 1) throw new Error("Uso: node scripts/diagnostico-site.ts <url> [--psi]");
    const resultado = await diagnosticar(positionals[0], { psi: values.psi });
    console.log(JSON.stringify(resultado, null, 2));
    console.error(`${resultado.urlFinal ?? resultado.url}: ${resultado.situacaoSugerida}${resultado.plataforma ? ` (${resultado.plataforma})` : ""}`);
    for (const problema of resultado.problemas) console.error(`- ${problema}`);
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exitCode = 1;
  }
}
