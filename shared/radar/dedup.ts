import type { Descartado, Lead } from "./tipos.ts";
import { dominioDe, nomeChave, normalizarInstagram, telefoneDe } from "./normalizar.ts";

export type Duplicado = { onde: "lead" | "descartado"; id: string; chave: string };
type CasoEncontrado = Duplicado & { motivo?: string };
type Candidato = Partial<Pick<Lead, "nome" | "cidade" | "instagram" | "site" | "contato">>;

export function chavesDoLead(lead: Candidato): string[] {
  const chaves = new Set<string>();
  const adicionar = (prefixo: string, valor: string | undefined) => { if (valor) chaves.add(`${prefixo}:${valor}`); };
  adicionar("ig", lead.instagram?.usuario ? normalizarInstagram(lead.instagram.usuario) : undefined);
  adicionar("dom", lead.site?.url ? dominioDe(lead.site.url) : undefined);
  adicionar("dom", lead.instagram?.linkBio ? dominioDe(lead.instagram.linkBio) : undefined);
  adicionar("tel", lead.contato?.whatsapp ? telefoneDe(lead.contato.whatsapp) : undefined);
  adicionar("tel", lead.contato?.telefone ? telefoneDe(lead.contato.telefone) : undefined);
  const nome = nomeChave(lead.nome ?? "", lead.cidade ?? "");
  if (nome.split("|").every(Boolean)) adicionar("nome", nome);
  return [...chaves];
}

export function chavesDoDescartado(d: Descartado): string[] {
  return chavesDoLead({
    nome: d.nome, cidade: d.cidade,
    instagram: { usuario: d.instagram, ultimoPost: "" },
    site: { url: d.site }, contato: { telefone: d.telefone },
  });
}

function casos(leads: Lead[], descartados: Descartado[]): CasoEncontrado[] {
  return [
    ...leads.flatMap((lead) => chavesDoLead(lead).map((chave) => ({ onde: "lead" as const, id: lead.id, chave }))),
    ...descartados.flatMap((d) => chavesDoDescartado(d).map((chave) => ({ onde: "descartado" as const, id: d.instagram, chave, motivo: d.motivo }))),
  ];
}

export function acharDuplicado(candidato: Candidato, leads: Lead[], descartados: Descartado[], ignorarId?: string): Duplicado | null {
  const chaves = new Set(chavesDoLead(candidato));
  const encontrado = casos(leads, descartados).find((caso) => !(caso.onde === "lead" && caso.id === ignorarId) && chaves.has(caso.chave));
  return encontrado ? { onde: encontrado.onde, id: encontrado.id, chave: encontrado.chave } : null;
}

export function buscarTermo(termo: string, leads: Lead[], descartados: Descartado[]): CasoEncontrado[] {
  const valor = termo.trim();
  if (!valor) return [];
  let chave: string | undefined;
  if (valor.startsWith("@") || /^(?:https?:\/\/)?(?:[\w-]+\.)*instagram\.com\//i.test(valor)) {
    chave = `ig:${normalizarInstagram(valor)}`;
  } else if (/^[+\d\s().-]+$/.test(valor) && telefoneDe(valor)) {
    chave = `tel:${telefoneDe(valor)}`;
  } else if (/^https?:\/\//i.test(valor) || /^[^\s/]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(valor)) {
    const dominio = dominioDe(valor);
    if (!dominio) return [];
    chave = `dom:${dominio}`;
  }
  const nome = nomeChave(valor, "").split("|")[0];
  const vistos = new Set<string>();
  const candidatos = casos(leads, descartados);
  // Nome sem cidade permite busca, mas não é seguro como chave de deduplicação.
  for (const d of descartados) {
    if (d.nome && !d.cidade) candidatos.push({ onde: "descartado", id: d.instagram, chave: `nome:${nomeChave(d.nome, "")}`, motivo: d.motivo });
  }
  return candidatos.filter((caso) => {
    // Um identificador sem @ pode parecer domínio, mas costuma ser um @: confere os dois
    const corresponde = chave ? caso.chave === chave || (!valor.includes("/") && caso.chave === `ig:${normalizarInstagram(valor)}`) :
      caso.chave === `ig:${normalizarInstagram(valor)}` || (Boolean(nome) && caso.chave.startsWith("nome:") && caso.chave.slice(5).split("|")[0].includes(nome));
    const identificador = `${caso.onde}:${caso.id}`;
    if (!corresponde || vistos.has(identificador)) return false;
    vistos.add(identificador);
    return true;
  });
}
