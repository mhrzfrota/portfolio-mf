export const DOMINIOS_NAO_PROPRIOS = [
  "instagram.com", "facebook.com", "fb.com", "wa.me", "api.whatsapp.com",
  "whatsapp.com", "linktr.ee", "beacons.ai", "bio.link", "linkin.bio",
  "taplink.cc", "campsite.bio", "lnk.bio", "msha.ke", "linkbio.co",
  "carrd.co", "bio.site", "solo.to", "linklist.bio", "canva.com",
  // Encurtadores: o destino é que diz se há site; o encurtador em si é de todo mundo
  "bit.ly", "w.app", "wa.link", "shre.ink", "trakto.link", "tinyurl.com", "cutt.ly", "encurtador.com.br", "abre.ai",
  "google.com", "g.page", "goo.gl", "maps.app.goo.gl", "youtube.com", "tiktok.com",
] as const;

function hostDe(valor: string): string | undefined {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(valor.trim()) ? valor.trim() : `https://${valor.trim()}`);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return undefined;
  }
}

function pertence(host: string, dominio: string): boolean {
  return host === dominio || host.endsWith(`.${dominio}`);
}

export function normalizarInstagram(s: string): string {
  let valor = s.trim().toLowerCase();
  if (/^(?:https?:\/\/)?(?:[\w-]+\.)*instagram\.com(?:\/|$)/i.test(valor)) {
    try {
      const url = new URL(/^https?:\/\//.test(valor) ? valor : `https://${valor}`);
      valor = url.pathname.replace(/^\/+/, "");
    } catch {
      return "";
    }
  } else if (valor.includes("://")) return "";
  return valor.replace(/^@+/, "").split(/[/?#]/, 1)[0];
}

export function dominioDe(url: string): string | undefined {
  const host = hostDe(url);
  if (!host || DOMINIOS_NAO_PROPRIOS.some((dominio) => pertence(host, dominio))) return undefined;
  return host;
}

export function plataformaDeLinkBio(url: string): string | undefined {
  if (/^whatsapp:\/\//i.test(url.trim())) return "WhatsApp";
  const host = hostDe(url);
  if (!host) return undefined;
  const plataformas: Record<string, string> = {
    "wa.me": "WhatsApp", "whatsapp.com": "WhatsApp", "linktr.ee": "Linktree",
    "beacons.ai": "Beacons", "bio.link": "Bio.link", "linkin.bio": "Linkin.bio",
    "taplink.cc": "Taplink", "campsite.bio": "Campsite", "lnk.bio": "Lnk.Bio",
    "msha.ke": "Milkshake", "linkbio.co": "Linkbio",
    // Página de botões num subdomínio gratuito: visual pode ser bonito, mas não é site
    "carrd.co": "Carrd", "bio.site": "Bio Site", "solo.to": "Solo.to", "linklist.bio": "Linklist",
    "canva.com": "Canva",
  };
  return Object.entries(plataformas).find(([dominio]) => pertence(host, dominio))?.[1];
}

export function telefoneDe(s: string): string | undefined {
  let digitos = s.replace(/\D/g, "");
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2);
  return digitos.length >= 10 ? digitos : undefined;
}

export function nomeChave(nome: string, cidade: string): string {
  const limpar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return `${limpar(nome)}|${limpar(cidade)}`;
}
