import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { DiagnosticoSite } from "./tipos.ts";

const MAX_REDIRECTS = 5,
  MAX_BYTES = 1_500_000;
const privadoV4 = (ip: string) =>
  /^(?:10\.|127\.|169\.254\.|0\.|192\.168\.|(?:172\.(?:1[6-9]|2\d|3[01]))\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(
    ip
  );
const privadoV6 = (ip: string) =>
  ip === "::1" ||
  ip === "::" ||
  /^f[cd][0-9a-f]{2}:/i.test(ip) ||
  /^fe[89ab][0-9a-f]:/i.test(ip) ||
  /^::ffff:(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(
    ip
  );
export function ipPublico(ip: string) {
  return isIP(ip) !== 0 && !(isIP(ip) === 4 ? privadoV4(ip) : privadoV6(ip));
}
export async function validarDestino(url: URL, resolver = lookup) {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Site deve usar HTTP ou HTTPS.");
  if (
    url.port &&
    !(
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443")
    )
  )
    throw new Error("Porta não permitida.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const enderecos = isIP(host)
    ? [{ address: host }]
    : await resolver(host, { all: true });
  if (!enderecos.length || enderecos.some(({ address }) => !ipPublico(address)))
    throw new Error("Destino privado ou local não permitido.");
}
export async function fetchSeguro(
  endereco: string,
  deps: { fetch?: typeof fetch; resolver?: typeof lookup } = {}
) {
  const chamar = deps.fetch ?? fetch,
    resolver = deps.resolver ?? lookup;
  let atual = new URL(endereco);
  for (let salto = 0; salto <= MAX_REDIRECTS; salto++) {
    await validarDestino(atual, resolver);
    const resposta = await chamar(atual, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "Mozilla/5.0 RadarMF/1.0", Accept: "text/html" },
    });
    if ([301, 302, 303, 307, 308].includes(resposta.status)) {
      const local = resposta.headers.get("location");
      if (!local || salto === MAX_REDIRECTS)
        throw new Error("Redirecionamento inválido ou excessivo.");
      atual = new URL(local, atual);
      continue;
    }
    const tamanho = Number(resposta.headers.get("content-length") ?? 0);
    if (tamanho > MAX_BYTES) throw new Error("Site excede o tamanho máximo.");
    const leitor = resposta.body?.getReader();
    const partes: Uint8Array[] = [];
    let total = 0;
    if (leitor)
      while (true) {
        const { value, done } = await leitor.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) {
          await leitor.cancel();
          throw new Error("Site excede o tamanho máximo.");
        }
        partes.push(value);
      }
    return {
      resposta,
      html: Buffer.concat(partes).toString("utf8"),
      urlFinal: atual.toString(),
      bytes: total,
    };
  }
  throw new Error("Redirecionamento excessivo.");
}
/** Caminhos do instagram.com que não são perfil. */
const NAO_PERFIL = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "share", "direct", "about", "legal", "developer", "instagram"]);

export function extrairContatosHtml(html: string) {
  // Só link para instagram.com conta: "@" solto no HTML pega e-mail (contato@gmail.com) e CSS (@media)
  const ig = [...html.matchAll(/instagram\.com\/([a-z0-9._]{1,30})(?=[/?#"'\s<]|$)/gi)]
    .map(m => m[1].toLowerCase())
    .find(x => !NAO_PERFIL.has(x) && !/^\.|\.$/.test(x));
  const wa = html
    .match(
      /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)(\+?\d[\d(). +%-]{8,20})/i
    )?.[1]
    ?.replace(/\D/g, "");
  return { instagram: ig, whatsapp: wa };
}
export async function diagnosticarSiteSeguro(
  url: string,
  analisar: (html: string, contexto: any) => DiagnosticoSite
) {
  const inicio = Date.now(),
    hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Fortaleza",
    }).format(new Date());
  try {
    const { resposta, html, urlFinal, bytes } = await fetchSeguro(url);
    return {
      diagnostico: analisar(html, {
        url,
        urlFinal,
        status: resposta.status,
        tempoRespostaMs: Date.now() - inicio,
        tamanhoHtmlKb: Math.round(bytes / 10.24) / 100,
        cabecalhos: Object.fromEntries(resposta.headers),
        analisadoEm: hoje,
      }),
      html,
    };
  } catch (erro) {
    return {
      diagnostico: analisar("", {
        url,
        analisadoEm: hoje,
        erro: erro instanceof Error ? erro.message : String(erro),
      }),
      html: "",
    };
  }
}
