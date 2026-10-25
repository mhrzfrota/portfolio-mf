import { telefoneDe } from "./normalizar.ts";

const DIA = 86_400_000;

/** "2026-10-19" lido como data local, sem o fuso puxar para o dia anterior. */
function dia(iso: string): Date | undefined {
  const [ano, mes, d] = iso.split("-").map(Number);
  if (!ano || !mes || !d) return undefined;
  return new Date(ano, mes - 1, d);
}

export function data(iso: string | undefined): string {
  const valor = iso ? dia(iso) : undefined;
  return valor ? valor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "sem data";
}

export function diasDesde(iso: string, hoje = new Date()): number | undefined {
  const valor = dia(iso);
  if (!valor) return undefined;
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((base.getTime() - valor.getTime()) / DIA);
}

export function haQuanto(iso: string): string {
  const dias = diasDesde(iso);
  if (dias === undefined) return "sem data";
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const inteiro = new Intl.NumberFormat("pt-BR");

export function seguidores(n: number | undefined): string {
  return n === undefined ? "não informado" : compacto.format(n);
}

export function numero(n: number): string {
  return inteiro.format(n);
}

export function nota(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function segundos(ms: number): string {
  return `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
}

/** Host sem "www.", para mostrar o link sem a URL inteira. */
export function host(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function telefoneLegivel(bruto: string | undefined): string {
  const digitos = bruto ? telefoneDe(bruto) : undefined;
  if (!digitos) return bruto ?? "";
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  const corte = resto.length - 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/**
 * Abre a conversa com a mensagem já escrita. O envio continua na mão do
 * Matheus: o WhatsApp só preenche, quem aperta enviar é ele.
 */
export function linkWhatsApp(bruto: string | undefined, texto?: string): string | undefined {
  const digitos = bruto ? telefoneDe(bruto) : undefined;
  if (!digitos) return undefined;
  return `https://wa.me/55${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export function linkInstagram(usuario: string): string {
  return `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
}

/** Só permite fontes web seguras ao renderizar dados vindos do Supabase. */
export function linkSeguro(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
